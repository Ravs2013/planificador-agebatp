import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso } from './cyeEstilos';
import CYEAnexoPlegable from './CYEAnexoPlegable';
import { CYE_CONFIG, SLOTS_JURADO, getCategoriaCYE } from '../../data/creaEmprendeConfig';
import { getInstrumentosCategoria } from '../../data/creaEmprendeRubricas';
import {
  calcularFicha, evaluacionIdCYE, resumenGradoSeccion, nombresIntegrantes
} from '../../utils/creaEmprendeHelpers';
import { firmanteDelCasillero } from '../../utils/creaEmprendeFirmas';
import { saveCYEEvaluacion, reabrirCYEEvaluacion, CasilleroOcupadoError } from '../../firebase/dbCreaEmprende';
import { generarFichaCYEPDF } from '../../pdf/generarFichaCYEPDF';
import { obtenerMembreteCYE } from '../../pdf/membreteCreaEmprende';

const DEBOUNCE_MS = 1200;
const VACIO = { D10: {}, D11: {}, D12: {} };

function completoAnexo(rubrica, puntajesAnexo = {}) {
  return rubrica.criterios.every(c => Number(puntajesAnexo[c.id]) >= 1);
}

/**
 * Ficha de evaluación de un proyecto para un casillero de jurado (J1, J2 o J3).
 * Los tres instrumentos de la etapa UGEL se presentan como viñetas plegables: solo una
 * abierta a la vez; al completar una se comprime y se abre la siguiente pendiente.
 */
export default function CYEFichaEvaluacion({
  participante,
  numeroJurado,
  onCambiarJurado,
  evaluacionesProyecto = [],
  panel,
  usuario,
  esStaff = false,
  bloqueadoPorSellado = false,
  onToast,
  onIrAlPanel,
  acuerdos = {},
  notaRotacion = null
}) {
  const categoria = participante?.categoria;
  const cat = getCategoriaCYE(categoria);
  const rubricas = useMemo(() => getInstrumentosCategoria(categoria), [categoria]);
  const idEvaluacion = participante ? evaluacionIdCYE(participante.id, numeroJurado) : null;
  const evaluacionInicial = useMemo(
    () => evaluacionesProyecto.find(ev => ev.id === idEvaluacion) || null,
    [evaluacionesProyecto, idEvaluacion]
  );

  const [puntajes, setPuntajes] = useState(VACIO);
  const [observaciones, setObservaciones] = useState('');
  const [abierto, setAbierto] = useState('D10');
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);

  const cargaRef = useRef({ id: null, conDatos: false });
  const sucioRef = useRef(false);
  const debounceRef = useRef(null);
  const payloadRef = useRef(null);

  /* ── Carga del documento remoto sin pisar lo que el jurado está marcando ── */
  useEffect(() => {
    const carga = cargaRef.current;
    const cambioDeFicha = carga.id !== idEvaluacion;
    const llegaronDatos = !carga.conDatos && Boolean(evaluacionInicial) && !sucioRef.current;
    if (!cambioDeFicha && !llegaronDatos) return;

    const base = evaluacionInicial?.puntajes || VACIO;
    const nuevos = { D10: { ...(base.D10 || {}) }, D11: { ...(base.D11 || {}) }, D12: { ...(base.D12 || {}) } };
    setPuntajes(nuevos);
    setObservaciones(evaluacionInicial?.observacionesJurado || '');
    const primeraPendiente = rubricas.find(r => !completoAnexo(r, nuevos[r.anexo]));
    setAbierto(primeraPendiente ? primeraPendiente.anexo : null);
    setUltimoGuardado(null);
    sucioRef.current = false;
    cargaRef.current = { id: idEvaluacion, conDatos: Boolean(evaluacionInicial) };
  }, [idEvaluacion, evaluacionInicial, rubricas]);

  /* ── Estado de la ficha ── */
  const calculo = useMemo(() => calcularFicha(categoria, puntajes), [categoria, puntajes]);
  const evaluador = evaluacionInicial?.evaluadorOperativo || null;
  const ocupadoPorOtro = Boolean(evaluador?.uid && usuario?.uid && evaluador.uid !== usuario.uid && !esStaff);
  const registrada = evaluacionInicial?.estado === 'registrada';
  const noSePresento = Boolean(participante?.noSePresento);
  const soloLectura = bloqueadoPorSellado || ocupadoPorOtro || registrada || noSePresento;

  const ocupacion = useMemo(() => SLOTS_JURADO.map(slot => {
    const ev = evaluacionesProyecto.find(e => Number(e.jurado?.numeroJurado) === slot);
    const uid = ev?.evaluadorOperativo?.uid;
    return {
      slot,
      propio: Boolean(uid && uid === usuario?.uid),
      ocupado: Boolean(uid && uid !== usuario?.uid),
      registrada: ev?.estado === 'registrada',
      evaluador: ev?.evaluadorOperativo?.nombre || ev?.evaluadorOperativo?.correo || ''
    };
  }), [evaluacionesProyecto, usuario?.uid]);

  /* ── Construcción y guardado ── */
  const construirPayload = useCallback((estado) => {
    const calc = calcularFicha(categoria, puntajes);
    return {
      participanteId: participante.id,
      categoria,
      jurado: { numeroJurado },
      participanteSnapshot: {
        id: participante.id,
        numero: participante.numero || null,
        institucionNombre: participante.institucion?.nombre || '',
        codigoModular: participante.institucion?.codigoModular || '',
        tituloProyecto: participante.tituloProyecto || '',
        gradoSeccion: resumenGradoSeccion(participante.integrantes),
        grupo: participante.grupo || null
      },
      puntajes,
      subtotales: {
        D10: calc.anexos.D10?.subtotal || 0,
        D11: calc.anexos.D11?.subtotal || 0,
        D12: calc.anexos.D12?.subtotal || 0
      },
      puntajeTotal: calc.puntajeTotal,
      puntajeMaximo: calc.maximoTotal,
      anexosCompletos: calc.anexosCompletos,
      completa: calc.completa,
      observacionesJurado: observaciones,
      fecha: CYE_CONFIG.fechaEvaluacion,
      estado
    };
  }, [categoria, puntajes, participante, numeroJurado, observaciones]);

  useEffect(() => {
    payloadRef.current = participante ? () => construirPayload('borrador') : null;
  }, [construirPayload, participante]);

  const guardar = useCallback(async (estado, esAuto) => {
    if (!participante || soloLectura) return false;
    try {
      if (!esAuto) setGuardando(true);
      await saveCYEEvaluacion(construirPayload(estado), {
        usuario,
        esStaff,
        accion: esAuto ? 'autoguardado' : (estado === 'registrada' ? 'registro' : 'guardado')
      });
      sucioRef.current = false;
      setUltimoGuardado(new Date());
      if (!esAuto && onToast) {
        onToast(estado === 'registrada'
          ? `Calificación del Jurado N.° ${numeroJurado} registrada.`
          : 'Borrador guardado.', 'success');
      }
      return true;
    } catch (err) {
      if (onToast && (!esAuto || err instanceof CasilleroOcupadoError)) onToast(err.message, 'error');
      return false;
    } finally {
      if (!esAuto) setGuardando(false);
    }
  }, [participante, soloLectura, construirPayload, usuario, esStaff, numeroJurado, onToast]);

  useEffect(() => {
    if (!sucioRef.current || soloLectura) return undefined;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { guardar('borrador', true); }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [puntajes, observaciones, guardar, soloLectura]);

  // Si el jurado cambia de proyecto o de casillero antes del autoguardado, se guarda lo pendiente.
  useEffect(() => {
    const idActual = idEvaluacion;
    return () => {
      if (sucioRef.current && payloadRef.current && cargaRef.current.id === idActual) {
        const payload = payloadRef.current();
        sucioRef.current = false;
        saveCYEEvaluacion(payload, { usuario, esStaff, accion: 'autoguardado' }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEvaluacion]);

  /* ── Acciones del jurado ── */
  const calificar = (anexo, criterioId, valor) => {
    if (soloLectura) return;
    const rubrica = rubricas.find(r => r.anexo === anexo);
    const estabaCompleto = completoAnexo(rubrica, puntajes[anexo]);
    const nuevos = { ...puntajes, [anexo]: { ...(puntajes[anexo] || {}), [criterioId]: valor } };
    sucioRef.current = true;
    setPuntajes(nuevos);

    if (!estabaCompleto && completoAnexo(rubrica, nuevos[anexo])) {
      const orden = rubricas.map(r => r.anexo);
      const i = orden.indexOf(anexo);
      const candidatos = [...orden.slice(i + 1), ...orden.slice(0, i)];
      const siguiente = candidatos.find(a => !completoAnexo(rubricas.find(r => r.anexo === a), nuevos[a]));
      setTimeout(() => {
        setAbierto(siguiente || null);
        const el = document.getElementById(`anexo-${siguiente || anexo}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  };

  const registrar = async () => {
    if (!calculo.completa) {
      const pendiente = rubricas.find(r => !completoAnexo(r, puntajes[r.anexo]));
      if (pendiente) {
        setAbierto(pendiente.anexo);
        setTimeout(() => {
          const el = document.getElementById(`anexo-${pendiente.anexo}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
      if (onToast) onToast(`Faltan ${calculo.criteriosPendientes} criterio(s) por calificar.`, 'error');
      return;
    }
    clearTimeout(debounceRef.current);
    await guardar('registrada', false);
  };

  const corregir = async () => {
    try {
      await reabrirCYEEvaluacion(idEvaluacion, usuario);
      if (onToast) onToast('La ficha volvió a borrador para su corrección.', 'info');
    } catch (err) {
      if (onToast) onToast(`No se pudo reabrir la ficha: ${err.message}`, 'error');
    }
  };

  const descargarPDF = async () => {
    try {
      const banner = await obtenerMembreteCYE();
      generarFichaCYEPDF(
        { ...construirPayload(evaluacionInicial?.estado || 'borrador'), id: idEvaluacion, evaluadorOperativo: evaluador },
        { participante, panel, banner }
      );
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el PDF: ${err.message}`, 'error');
    }
  };

  const cambiarCasillero = (item) => {
    if (item.slot === numeroJurado) return;
    if (item.ocupado && !esStaff) {
      if (onToast) onToast(`El casillero J${item.slot} ya lo calificó ${item.evaluador || 'otro jurado'}.`, 'error');
      return;
    }
    onCambiarJurado(item.slot);
  };

  if (!participante) return null;

  const firmante = firmanteDelCasillero(panel, numeroJurado);
  const integrantes = nombresIntegrantes(participante);
  const alertaEnlace = (participante.alertas || []).find(a => a.codigo === 'ENLACE');
  const faltan = calculo.criteriosPendientes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1000, margin: '0 auto' }}>
      {/* ── Identidad del casillero ── */}
      <div style={{
        background: C.navy2, color: C.white, borderRadius: 8, padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        borderBottom: `3px solid ${C.gold}`
      }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.goldLight, fontWeight: 800, letterSpacing: 0.8 }}>SESIÓN DE EVALUACIÓN</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            Usted califica como <span style={{ color: C.goldLight }}>Jurado N.° {numeroJurado}</span>
          </div>
          {usuario?.nombreCompleto && (
            <div style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 2 }}>{usuario.nombreCompleto}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ocupacion.map(item => {
            const activo = item.slot === numeroJurado;
            const bloqueado = item.ocupado && !esStaff;
            return (
              <button
                key={item.slot}
                type="button"
                onClick={() => cambiarCasillero(item)}
                title={item.ocupado ? `Calificado por ${item.evaluador}` : (item.propio ? 'Su casillero' : 'Casillero libre')}
                style={{
                  minWidth: 64, padding: '6px 10px', borderRadius: 6, cursor: bloqueado ? 'not-allowed' : 'pointer',
                  background: activo ? C.gold : 'rgba(255,255,255,0.10)',
                  color: activo ? C.navy1 : C.white,
                  border: `1px solid ${activo ? C.gold : 'rgba(255,255,255,0.25)'}`,
                  opacity: bloqueado ? 0.55 : 1, fontFamily: FUENTES.sans, textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {item.registrada ? <Icon name="check" size={12} color={activo ? C.navy1 : '#86EFAC'} /> : null}
                  {bloqueado ? <Icon name="lock" size={11} color={C.white} /> : null}
                  J{item.slot}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.85 }}>
                  {item.propio ? 'Suyo' : (item.ocupado ? 'Ocupado' : 'Libre')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Proyecto evaluado ── */}
      <div style={{ ...S.tarjeta, padding: '16px 18px', borderLeft: `5px solid ${C.navy3}` }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ ...S.chip(C.navy3, C.white), fontFamily: FUENTES.mono }}>N.° {participante.numero || '—'}</span>
          <span style={S.chip('#EFF6FF', '#1E40AF', '#BFDBFE')}>{cat?.nombre} · {resumenGradoSeccion(participante.integrantes) || cat?.grados}</span>
          {participante.grupo && <span style={S.chip(C.g100, C.g700, C.g300)}>Grupo {participante.grupo}</span>}
          {esStaff && participante.estadoAdmision === 'observado' && (
            <span style={S.chip('#FFFBEB', C.amber, '#FDE68A')}>Observado</span>
          )}
          {noSePresento && <span style={S.chip('#FEF2F2', C.red, '#FECACA')}>No se presentó</span>}
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: C.g900, lineHeight: 1.3 }}>{participante.institucion?.nombre}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.g700, marginTop: 4, lineHeight: 1.4 }}>
          Proyecto: <span style={{ color: C.g900 }}>{participante.tituloProyecto || 'Sin título registrado'}</span>
        </div>
        <div style={{ fontSize: 12, color: C.g500, marginTop: 6, lineHeight: 1.5 }}>
          {participante.docenteAsesor?.nombreCompleto && <div>Docente asesor: {participante.docenteAsesor.nombreCompleto}</div>}
          <div>
            Integrantes: {integrantes.length > 0 ? integrantes.join('; ') : `${(participante.integrantes || []).length} estudiantes`}
          </div>
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.g200}` }}>
          {participante.enlaceWeb && !(alertaEnlace?.bloqueaApertura) ? (
            <a
              href={participante.enlaceWeb}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: C.white, padding: '11px 18px',
                borderRadius: 8, fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(2,132,199,0.25)'
              }}
            >
              <Icon name="folderOpen" size={17} color={C.white} />
              Abrir portafolio y evidencias
              <Icon name="externalLink" size={14} color={C.white} />
            </a>
          ) : (
            <div style={{ fontSize: 12.5, color: C.amber, fontWeight: 700 }}>
              {alertaEnlace?.texto || 'El proyecto no registró enlace del portafolio.'}
            </div>
          )}
        </div>
      </div>

      {notaRotacion && !noSePresento && <div style={aviso('info')}>{notaRotacion}</div>}

      {/* ── Estado de la ficha (solo cuando corresponde) ── */}
      {noSePresento && (
        <div style={aviso('error')}>La comisión registró que el equipo no se presentó a la Expoferia. Esta ficha no se califica.</div>
      )}
      {!noSePresento && bloqueadoPorSellado && (
        <div style={aviso('alerta')}>El Panel de Firmas Oficial está sellado. Las calificaciones quedaron cerradas; solo un administrador puede reabrirlas.</div>
      )}
      {!noSePresento && !bloqueadoPorSellado && ocupadoPorOtro && (
        <div style={aviso('alerta')}>
          Este casillero lo calificó {evaluador?.nombre || evaluador?.correo}. Elija un casillero libre en la barra superior.
        </div>
      )}
      {!noSePresento && !bloqueadoPorSellado && !ocupadoPorOtro && registrada && (
        <div style={{ ...aviso('exito'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>
            Calificación registrada
            {evaluacionInicial?.registradaEn
              ? ` el ${new Date(evaluacionInicial.registradaEn).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : ''}.
          </span>
          <button type="button" onClick={corregir} style={btn('contorno', { background: 'transparent' })}>
            <Icon name="refresh" size={13} /> Corregir calificación
          </button>
        </div>
      )}

      {/* ── Anexos D10, D11 y D12 ── */}
      {!noSePresento && rubricas.map(r => (
        <CYEAnexoPlegable
          key={r.anexo}
          anclaId={`anexo-${r.anexo}`}
          rubrica={r}
          puntajes={puntajes[r.anexo] || {}}
          calculo={calculo.anexos[r.anexo]}
          abierto={abierto === r.anexo}
          onAlternar={() => setAbierto(abierto === r.anexo ? null : r.anexo)}
          onCalificar={(criterioId, valor) => calificar(r.anexo, criterioId, valor)}
          soloLectura={soloLectura}
          acuerdos={acuerdos}
        />
      ))}

      {!noSePresento && (
        <div style={S.seccion}>
          <label style={S.etiqueta}>Observaciones del jurado (opcional)</label>
          <textarea
            value={observaciones}
            readOnly={soloLectura}
            maxLength={600}
            onChange={e => { sucioRef.current = true; setObservaciones(e.target.value); }}
            style={{ ...S.textarea, background: soloLectura ? C.g50 : C.white }}
            placeholder="Precisiones sobre el proyecto, el portafolio o la presentación."
          />
        </div>
      )}

      {/* ── Suscripción: visible cuando el panel está sellado, o para la comisión ── */}
      {(firmante || esStaff) && (
        <div style={{ ...S.seccion, borderLeft: `5px solid ${firmante ? C.green : C.gold}` }}>
          {firmante ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 140, height: 56, border: `1px solid ${C.g300}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.white }}>
                {firmante.firmaDataUrl
                  ? <img src={firmante.firmaDataUrl} alt="Firma" style={{ maxHeight: 46, maxWidth: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 11, color: C.g500 }}>Sin trazo</span>}
              </div>
              <div style={{ fontSize: 13, color: C.g800, lineHeight: 1.5 }}>
                Ficha suscrita por <strong style={{ color: C.navy2 }}>{firmante.nombreCompleto}</strong>, DNI {firmante.dni} — Jurado N.° {numeroJurado}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: C.g700 }}>
                La firma del Jurado N.° {numeroJurado} se incorpora desde el Panel de Firmas Oficial cuando se sella.
              </div>
              {onIrAlPanel && (
                <button type="button" onClick={onIrAlPanel} style={btn('primario')}>
                  <Icon name="penTool" size={13} color={C.white} /> Panel de Firmas
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Barra fija inferior ── */}
      <div style={{
        position: 'sticky', bottom: 0, background: C.white, borderTop: `2px solid ${C.border}`,
        padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 30,
        boxShadow: '0 -4px 16px rgba(15,23,42,0.10)', borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.g500, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ultimoGuardado || registrada ? C.green : '#EAB308', display: 'inline-block' }} />
            {registrada ? 'Registrada' : (ultimoGuardado ? `Guardado a las ${ultimoGuardado.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 'Se guarda automáticamente')}
          </span>
          <span style={{ fontWeight: 800, color: C.navy3 }}>Anexos D10 · D11 · D12 — Jurado N.° {numeroJurado}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.g500 }}>PUNTAJE TOTAL</div>
              <div style={{ fontFamily: FUENTES.mono, fontSize: 20, fontWeight: 800, color: C.g900 }}>
                {calculo.puntajeTotal}<span style={{ fontSize: 12, color: C.g500 }}> / {calculo.maximoTotal}</span>
              </div>
            </div>
            <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.g500 }}>ANEXOS</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: calculo.completa ? C.green : C.amber }}>
                {calculo.anexosCompletos} de {calculo.totalAnexos}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!soloLectura && (
              <button type="button" onClick={() => guardar('borrador', false)} disabled={guardando} style={btn('contorno')}>
                <Icon name="save" size={13} /> Guardar borrador
              </button>
            )}
            {!soloLectura && (
              <button
                type="button"
                onClick={registrar}
                disabled={guardando}
                style={calculo.completa ? btn('exito', { padding: '9px 16px', fontSize: 13 }) : btnDeshabilitado(btn('exito', { padding: '9px 16px', fontSize: 13 }))}
              >
                <Icon name="check" size={14} color={C.white} />
                {calculo.completa ? 'Registrar calificación' : `Faltan ${faltan} criterio${faltan === 1 ? '' : 's'}`}
              </button>
            )}
            <button type="button" onClick={descargarPDF} style={btn('dorado')}>
              <Icon name="download" size={13} /> PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
