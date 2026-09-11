import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso } from '../creayemprende/cyeEstilos';
import EKRubricaMatriz from './EKRubricaMatriz';
import EKAnexoAplicable, { ModalCambioAnexo } from './EKAnexoAplicable';
import { getRubricaEureka } from '../../data/eurekaRubricas';
import { EUREKA_CONFIG, SLOTS_JURADO, getArea, getCategoria } from '../../data/eurekaConfigUGEL03';
import { calcularPuntajeEvaluacion, nombresEstudiantes } from '../../utils/eurekaHelpers';
import { resolverFirmanteDeFicha } from '../../utils/eurekaFirmas';
import { tienePuntajes, claveOpcion } from '../../utils/eurekaAnexos';
import {
  saveEKEvaluacion, evaluacionId, deleteEKEvaluacion, reabrirEKEvaluacion, actualizarParticipanteEK
} from '../../firebase/dbEureka';
import { generarFichaEurekaPDF } from '../../pdf/generarFichaEurekaPDF';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';

const DEBOUNCE_MS = 1500;
const OBSERVACION_NSP = 'INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN';

function formatoTiempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Firestore rechaza `undefined`: la matriz deja ese valor al desmarcar un nivel. */
function limpiarPuntajes(obj = {}) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

/**
 * Ficha de evaluación de un proyecto para un casillero de jurado (Anexos E11 a E18).
 * El anexo lo decide el proyecto (padrón o comisión) y es el mismo para los tres jurados.
 */
export default function EKFichaEvaluacion({
  participante,
  evaluacionInicial,
  evaluacionesProyecto = [],
  numeroJurado,
  onCambiarJurado,
  casilleroFijo = false,
  panel,
  usuario,
  esStaff = false,
  soloLectura = false,
  motivoBloqueo = null,
  onToast,
  onIrAlPanel
}) {
  const anexo = participante?.anexoEvaluacion;
  const variante = participante?.varianteRubrica || 'A';
  const rubrica = useMemo(() => getRubricaEureka(anexo), [anexo]);

  const [puntajes, setPuntajes] = useState({});
  const [planificacion, setPlanificacion] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [segundos, setSegundos] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  const [varianteSolicitada, setVarianteSolicitada] = useState(null);
  const [modalNSP, setModalNSP] = useState(false);

  const idEsperado = participante ? evaluacionId(participante.id, numeroJurado) : null;
  const cargaRef = useRef({ id: null, anexo: null, conDatos: false });
  const sucioRef = useRef(false);
  const debounceRef = useRef(null);
  const cronometroRef = useRef(null);

  const desalineada = Boolean(
    evaluacionInicial && tienePuntajes(evaluacionInicial)
    && evaluacionInicial.anexoEvaluacion && evaluacionInicial.anexoEvaluacion !== anexo
  );
  const noSePresento = Boolean(participante?.noSePresento || evaluacionInicial?.incomparecencia || evaluacionInicial?.noSePresento);
  const registrada = evaluacionInicial?.estado === 'registrada';
  const edicionBloqueada = soloLectura || desalineada || registrada || noSePresento;

  /* ── Carga del documento remoto sin pisar lo que el jurado está marcando ── */
  useEffect(() => {
    const carga = cargaRef.current;
    const cambioDeFicha = carga.id !== idEsperado || carga.anexo !== anexo;
    const llegaronDatos = !carga.conDatos && Boolean(evaluacionInicial) && !sucioRef.current;
    if (!cambioDeFicha && !llegaronDatos) return;

    const ev = evaluacionInicial;
    const alineada = !ev || !ev.anexoEvaluacion || ev.anexoEvaluacion === anexo;
    setPuntajes(alineada ? limpiarPuntajes(ev?.puntajes) : {});
    setPlanificacion(ev?.planificacionCurricular ?? null);
    setObservaciones(ev?.observacionesJurado || '');
    const [m, s] = String(ev?.duracionEjecutada || '00:00').split(':');
    setSegundos((parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0));
    setCronometroActivo(false);
    setUltimoGuardado(null);
    sucioRef.current = false;
    cargaRef.current = { id: idEsperado, anexo, conDatos: Boolean(ev) };
  }, [idEsperado, evaluacionInicial, anexo]);

  /* ── Cronómetro ── */
  useEffect(() => {
    if (!cronometroActivo) return undefined;
    cronometroRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(cronometroRef.current);
  }, [cronometroActivo]);

  const maxMinutos = EUREKA_CONFIG.tiempoExposicionMin;
  const excedioTiempo = segundos > maxMinutos * 60;

  /* ── Cálculo en vivo ── */
  const gateNegativo = Boolean(rubrica?.gate?.requerido && planificacion === false);
  const calculo = useMemo(() => calcularPuntajeEvaluacion({
    rubrica,
    puntajes,
    penalizaciones: evaluacionInicial?.penalizaciones || [],
    variante,
    noProsigue: gateNegativo,
    incomparecencia: noSePresento
  }), [rubrica, puntajes, evaluacionInicial?.penalizaciones, variante, gateNegativo, noSePresento]);

  const pendientes = useMemo(() => {
    if (!rubrica) return [];
    const items = rubrica.tipoEscala === 'simple' ? (rubrica.criterios || []) : (rubrica.aspectos || []);
    return items.filter(it => !Number(puntajes[it.id]));
  }, [rubrica, puntajes]);

  /* ── Documento ── */
  const construirPayload = useCallback((estado) => {
    const p = participante;
    return {
      participanteId: p.id,
      participanteSnapshot: {
        id: p.id,
        codigoParticipante: p.codigoParticipante || p.id,
        tituloProyecto: p.tituloProyecto || '',
        pseudonimo: p.pseudonimo || '',
        urlTrabajo: p.urlTrabajo || '',
        institucionNombre: p.institucion?.nombre || p.institucionNombre || '',
        institucion: {
          nombre: p.institucion?.nombre || p.institucionNombre || '',
          codigoModular: p.institucion?.codigoModular || '',
          ugel: p.institucion?.ugel || EUREKA_CONFIG.ugel,
          dre: p.institucion?.dre || EUREKA_CONFIG.dre
        },
        estudiantes: (p.estudiantes || []).map(e => ({
          apellidoPaterno: e.apellidoPaterno || '', apellidoMaterno: e.apellidoMaterno || '', nombres: e.nombres || ''
        })),
        docenteAsesor: {
          nombreCompleto: p.docenteAsesor?.nombreCompleto || '',
          especialidad: p.docenteAsesor?.especialidad || ''
        },
        gradoSeccion: p.gradoSeccion || '',
        ordenPresentacion: p.ordenPresentacion || p.numero || 0,
        noSePresento
      },
      categoria: p.categoria,
      areaId: p.areaId,
      lineaId: p.lineaId || null,
      anexoEvaluacion: anexo,
      varianteRubrica: rubrica?.tieneVariantes ? variante : null,
      jurado: { numeroJurado },
      planificacionCurricular: rubrica?.gate?.requerido ? planificacion : null,
      puntajes: limpiarPuntajes(puntajes),
      puntajeBruto: calculo.puntajeBruto,
      puntajePonderado: calculo.puntajePonderado,
      puntajeTotal: calculo.puntajeTotal,
      puntajeMaximo: calculo.puntajeMaximo,
      penalizaciones: evaluacionInicial?.penalizaciones || [],
      duracionEjecutada: formatoTiempo(segundos),
      excedioTiempo,
      observacionesJurado: observaciones,
      acreditacion: evaluacionInicial?.acreditacion || {},
      incomparecencia: noSePresento,
      noProsigue: gateNegativo,
      fecha: EUREKA_CONFIG.fechaEvaluacion,
      estado
    };
  }, [participante, anexo, rubrica, variante, numeroJurado, planificacion, puntajes, calculo, evaluacionInicial,
    segundos, excedioTiempo, observaciones, noSePresento, gateNegativo]);

  const guardar = useCallback(async (estado, esAuto) => {
    if (!participante || soloLectura || desalineada) return false;
    try {
      if (!esAuto) setGuardando(true);
      await saveEKEvaluacion(construirPayload(estado), {
        usuario,
        accion: esAuto ? 'autoguardado' : (estado === 'registrada' ? 'registro' : 'guardado')
      });
      sucioRef.current = false;
      setUltimoGuardado(new Date());
      if (!esAuto && onToast) {
        onToast(estado === 'registrada' ? `Calificación del Jurado N.° ${numeroJurado} registrada.` : 'Borrador guardado.', 'success');
      }
      return true;
    } catch (err) {
      if (!esAuto && onToast) onToast(`No se pudo guardar: ${err.message}`, 'error');
      return false;
    } finally {
      if (!esAuto) setGuardando(false);
    }
  }, [participante, soloLectura, desalineada, construirPayload, usuario, numeroJurado, onToast]);

  useEffect(() => {
    if (!sucioRef.current || edicionBloqueada) return undefined;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { guardar('borrador', true); }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [puntajes, planificacion, observaciones, cronometroActivo, guardar, edicionBloqueada]);

  /* ── Acciones ── */
  const cambiarPuntajes = (nuevos) => {
    if (edicionBloqueada) return;
    sucioRef.current = true;
    setPuntajes(prev => limpiarPuntajes(typeof nuevos === 'function' ? nuevos(prev) : nuevos));
  };

  const responderGate = (valor) => {
    if (edicionBloqueada) return;
    sucioRef.current = true;
    setPlanificacion(valor);
  };

  const alternarCronometro = () => {
    if (cronometroActivo) sucioRef.current = true;
    setCronometroActivo(a => !a);
  };

  const reiniciarCronometro = () => {
    setCronometroActivo(false);
    setSegundos(0);
    sucioRef.current = true;
  };

  const irACriterio = (id) => {
    const el = document.getElementById(`criterio-${id}`) || document.getElementById(`aspecto-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const registrar = async () => {
    if (rubrica?.gate?.requerido && planificacion === null) {
      if (onToast) onToast('Responda primero la pregunta sobre la evidencia de planificación curricular.', 'error');
      document.getElementById('pregunta-habilitacion')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!gateNegativo && !calculo.completa) {
      if (pendientes[0]) irACriterio(pendientes[0].id);
      if (onToast) onToast(`Faltan ${pendientes.length} criterio(s) por calificar.`, 'error');
      return;
    }
    clearTimeout(debounceRef.current);
    setCronometroActivo(false);
    await guardar('registrada', false);
  };

  const corregir = async () => {
    try {
      await reabrirEKEvaluacion(idEsperado, 'Corrección solicitada desde la ficha de evaluación', usuario);
      if (onToast) onToast('La ficha volvió a borrador para su corrección.', 'info');
    } catch (err) {
      if (onToast) onToast(`No se pudo reabrir la ficha: ${err.message}`, 'error');
    }
  };

  const reiniciarEstadoLocal = () => {
    clearTimeout(debounceRef.current);
    sucioRef.current = false;
    setPuntajes({});
    setPlanificacion(null);
    setObservaciones('');
    setSegundos(0);
    setCronometroActivo(false);
    setUltimoGuardado(null);
  };

  const limpiarFicha = async () => {
    if (soloLectura) return;
    if (!window.confirm(`¿Limpiar la ficha del Jurado N.° ${numeroJurado}?\n\nSe eliminan los puntajes guardados y la ficha queda en blanco.`)) return;
    try {
      setGuardando(true);
      reiniciarEstadoLocal();
      if (idEsperado) await deleteEKEvaluacion(idEsperado);
      if (participante?.noSePresento) await actualizarParticipanteEK(participante, { noSePresento: false });
      if (onToast) onToast(`Ficha del Jurado N.° ${numeroJurado} restablecida en blanco.`, 'info');
    } catch (err) {
      if (onToast) onToast(`No se pudo limpiar la ficha: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descartarCapturaDesalineada = async () => {
    if (!window.confirm(`¿Descartar la captura hecha con el Anexo ${evaluacionInicial?.anexoEvaluacion} y calificar con el Anexo ${anexo}?`)) return;
    try {
      setGuardando(true);
      reiniciarEstadoLocal();
      await deleteEKEvaluacion(idEsperado);
      if (onToast) onToast(`Captura descartada. Califique con el Anexo ${anexo}.`, 'info');
    } catch (err) {
      if (onToast) onToast(`No se pudo descartar: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const marcarNSP = async () => {
    try {
      setGuardando(true);
      clearTimeout(debounceRef.current);
      const payload = {
        ...construirPayload('registrada'),
        puntajes: {}, puntajeBruto: 0, puntajePonderado: 0, puntajeTotal: 0,
        planificacionCurricular: null, noProsigue: false,
        incomparecencia: true, noSePresento: true,
        observacionesJurado: OBSERVACION_NSP
      };
      payload.participanteSnapshot = { ...payload.participanteSnapshot, noSePresento: true };
      await saveEKEvaluacion(payload, { usuario, accion: 'incomparecencia' });
      await actualizarParticipanteEK(participante, { noSePresento: true });
      reiniciarEstadoLocal();
      setObservaciones(OBSERVACION_NSP);
      setModalNSP(false);
      if (onToast) onToast(`Incomparecencia registrada para «${participante.institucion?.nombre || 'la I. E.'}».`, 'info');
    } catch (err) {
      if (onToast) onToast(`No se pudo registrar la incomparecencia: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const revertirNSP = async () => {
    if (!window.confirm('¿Revertir la incomparecencia y habilitar la calificación de este proyecto?')) return;
    try {
      setGuardando(true);
      await actualizarParticipanteEK(participante, { noSePresento: false });
      if (idEsperado) await deleteEKEvaluacion(idEsperado);
      reiniciarEstadoLocal();
      if (onToast) onToast('Incomparecencia revertida. La ficha está habilitada.', 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo revertir: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descargarPDF = async () => {
    try {
      const banner = await obtenerMembreteEureka();
      generarFichaEurekaPDF(
        { ...construirPayload(evaluacionInicial?.estado || 'borrador'), id: idEsperado },
        { panel, banner }
      );
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el PDF: ${err.message}`, 'error');
    }
  };

  if (!participante) return null;

  const cat = getCategoria(participante.categoria);
  const area = getArea(participante.areaId);
  const firmante = resolverFirmanteDeFicha({ jurado: { numeroJurado } }, panel);
  const estudiantes = nombresEstudiantes(participante);
  const estadoCasillero = slot => evaluacionesProyecto.find(e => Number(e.jurado?.numeroJurado) === slot)?.estado;

  const estiloGate = (activo, tono) => ({
    minHeight: 52, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 800, fontFamily: FUENTES.sans,
    cursor: edicionBloqueada ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: activo ? tono : C.white, color: activo ? C.white : tono,
    border: `2px solid ${activo ? tono : C.g300}`, boxShadow: activo ? '0 4px 10px rgba(15,23,42,0.15)' : 'none'
  });

  const cronometro = (
    <div style={{ ...S.seccion, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 120, textAlign: 'center', border: `2px solid ${excedioTiempo ? C.red : C.navy3}`, borderRadius: 8, padding: '6px 14px', background: C.white }}>
          <div style={{ fontFamily: FUENTES.mono, fontSize: 28, fontWeight: 800, color: excedioTiempo ? C.red : C.navy2, fontVariantNumeric: 'tabular-nums' }}>
            {formatoTiempo(segundos)}
          </div>
        </div>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.navy2 }}>Tiempo de exposición</div>
          <div style={{ fontSize: 12, color: excedioTiempo ? C.red : C.g500, lineHeight: 1.45 }}>
            {excedioTiempo
              ? `Superó los ${maxMinutos} minutos del numeral 10.1. Es un dato informativo: las bases no fijan descuento.`
              : `Hasta ${maxMinutos} minutos, expuesto solo por los estudiantes inscritos (numeral 10.1).`}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={alternarCronometro} disabled={soloLectura || registrada} style={soloLectura || registrada ? btnDeshabilitado(btn('primario', { minHeight: 40 })) : btn(cronometroActivo ? 'peligroSuave' : 'primario', { minHeight: 40 })}>
          <Icon name={cronometroActivo ? 'pause' : 'play'} size={14} color={cronometroActivo ? C.red : C.white} />
          {cronometroActivo ? 'Pausar' : (segundos > 0 ? 'Reanudar' : 'Iniciar cronómetro')}
        </button>
        <button type="button" onClick={reiniciarCronometro} disabled={soloLectura || registrada} style={btn('secundario', { minHeight: 40 })}>
          <Icon name="refresh" size={14} /> Reiniciar
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1040, margin: '0 auto' }}>
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
          {usuario?.nombreCompleto && <div style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 2 }}>{usuario.nombreCompleto}</div>}
        </div>
        {casilleroFijo ? (
          <div style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.10)', border: `1px solid ${C.gold}`, color: C.goldLight, fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: 0.5 }}>
            <Icon name="lock" size={14} color={C.goldLight} /> CASILLERO ASIGNADO: J{numeroJurado}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SLOTS_JURADO.map(slot => {
              const activo = slot === numeroJurado;
              const estado = estadoCasillero(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onCambiarJurado && onCambiarJurado(slot)}
                  style={{
                    minWidth: 68, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FUENTES.sans, textAlign: 'center',
                    background: activo ? C.gold : 'rgba(255,255,255,0.10)', color: activo ? C.navy1 : C.white,
                    border: `1px solid ${activo ? C.gold : 'rgba(255,255,255,0.25)'}`
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {estado === 'registrada' && <Icon name="check" size={12} color={activo ? C.navy1 : '#86EFAC'} />} J{slot}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.85 }}>
                    {estado === 'registrada' ? 'Registrada' : (estado ? 'Borrador' : 'Libre')}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Proyecto evaluado ── */}
      <div style={{ ...S.tarjeta, padding: '16px 18px', borderLeft: `5px solid ${C.navy3}` }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ ...S.chip(C.navy3, C.white), fontFamily: FUENTES.mono }}>N.° {participante.ordenPresentacion || participante.numero || '—'}</span>
          <span style={S.chip('#EFF6FF', '#1E40AF', '#BFDBFE')}>{cat?.nombre} · {participante.gradoSeccion || cat?.grados}</span>
          <span style={S.chip(C.g100, C.g700, C.g300)}>{area?.nombre}</span>
          {participante.pseudonimo && <span style={S.chip('#FEF9C3', '#854D0E', '#FDE047')}>Pseudónimo: {participante.pseudonimo}</span>}
          {esStaff && participante.estadoAdmision === 'observado' && <span style={S.chip('#FFFBEB', C.amber, '#FDE68A')}>Observado</span>}
          {noSePresento && <span style={S.chip('#FEF2F2', C.red, '#FECACA')}>No se presentó</span>}
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: C.g900, lineHeight: 1.3 }}>{participante.institucion?.nombre || participante.institucionNombre}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.g700, marginTop: 4, lineHeight: 1.4 }}>
          Proyecto: <span style={{ color: C.g900 }}>{participante.tituloProyecto || 'Sin título registrado'}</span>
        </div>
        <div style={{ fontSize: 12, color: C.g500, marginTop: 6, lineHeight: 1.55 }}>
          {participante.docenteAsesor?.nombreCompleto && <div>Docente asesor: {participante.docenteAsesor.nombreCompleto}</div>}
          <div>Estudiantes: {estudiantes || `${participante.numeroEstudiantes || '—'} inscrito(s) en SICE`}</div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.g200}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {participante.urlTrabajo ? (
            <a
              href={participante.urlTrabajo}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', color: C.white, padding: '11px 18px',
                borderRadius: 8, fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(2,132,199,0.25)'
              }}
            >
              <Icon name="folderOpen" size={17} color={C.white} /> Abrir informe y evidencias
              <Icon name="externalLink" size={14} color={C.white} />
            </a>
          ) : (
            <div style={{ fontSize: 12.5, color: C.amber, fontWeight: 700 }}>El proyecto no registró enlace web en SICE.</div>
          )}
          {participante.urlCuadernoCampo && (
            <a href={participante.urlCuadernoCampo} target="_blank" rel="noreferrer" style={{ ...btn('secundario', { padding: '10px 16px', fontSize: 13 }), textDecoration: 'none' }}>
              <Icon name="fileText" size={14} /> Cuaderno de campo
            </a>
          )}
        </div>
      </div>

      {/* ── Formulario que se aplica (anexo del proyecto) ── */}
      <EKAnexoAplicable
        participante={participante}
        evaluacionesProyecto={evaluacionesProyecto}
        usuario={usuario}
        puedeCambiar={!soloLectura}
        esStaff={esStaff}
        onToast={onToast}
      />

      {/* ── Estado de la ficha ── */}
      {soloLectura && motivoBloqueo && <div style={aviso('alerta')}>{motivoBloqueo}</div>}

      {noSePresento && (
        <div style={{ ...aviso('error'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 18px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#991B1B' }}>Incomparecencia: el equipo no se presentó</div>
            <div style={{ fontSize: 12, color: '#7F1D1D', marginTop: 3 }}>La ficha queda con 0 puntos y fuera del orden de mérito.</div>
          </div>
          {!soloLectura && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={revertirNSP} disabled={guardando} style={btn('secundario', { color: C.red, borderColor: '#FCA5A5' })}>
                <Icon name="refresh" size={13} color={C.red} /> Revertir incomparecencia
              </button>
            </div>
          )}
        </div>
      )}

      {desalineada && (
        <div style={{ ...aviso('alerta'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>
            Esta ficha se calificó con el <strong>Anexo {evaluacionInicial.anexoEvaluacion}</strong>, pero el anexo vigente del proyecto es el
            <strong> {anexo}</strong>. Esa captura no cuenta en el consolidado.
          </span>
          {!soloLectura && (
            <button type="button" onClick={descartarCapturaDesalineada} disabled={guardando} style={btn('primario')}>
              <Icon name="refresh" size={13} color={C.white} /> Descartar y calificar con {anexo}
            </button>
          )}
        </div>
      )}

      {registrada && !noSePresento && !desalineada && (
        <div style={{ ...aviso('exito'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>
            Calificación registrada{evaluacionInicial?.registradaEn ? ` el ${new Date(evaluacionInicial.registradaEn).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}.
          </span>
          {!soloLectura && (
            <button type="button" onClick={corregir} style={btn('contorno', { background: 'transparent' })}>
              <Icon name="refresh" size={13} /> Corregir calificación
            </button>
          )}
        </div>
      )}

      {/* ── Pregunta 1 del anexo y, debajo, el cronómetro ── */}
      {rubrica?.gate?.requerido && !noSePresento && (
        <div id="pregunta-habilitacion" style={{ ...S.seccion, borderLeft: `5px solid ${gateNegativo ? C.red : (planificacion === true ? C.green : C.navy3)}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>PREGUNTA PREVIA DEL ANEXO {rubrica.id}</div>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: C.navy2, marginTop: 4, lineHeight: 1.45 }}>
            1.- {rubrica.gate.pregunta}
          </div>
          <div style={{ fontSize: 12.5, color: C.g500, marginTop: 4 }}>
            Si la respuesta es «SÍ», prosigue con la evaluación. Si es «NO», concluye su participación.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 14 }}>
            <button type="button" onClick={() => responderGate(true)} disabled={edicionBloqueada} style={estiloGate(planificacion === true, C.green)}>
              <Icon name="check" size={18} color={planificacion === true ? C.white : C.green} /> Sí, presenta la evidencia
            </button>
            <button type="button" onClick={() => responderGate(false)} disabled={edicionBloqueada} style={estiloGate(planificacion === false, C.red)}>
              <Icon name="x" size={18} color={planificacion === false ? C.white : C.red} /> No la presenta
            </button>
          </div>
          {gateNegativo && (
            <div style={{ ...aviso('error'), marginTop: 12, fontSize: 13 }}>
              El proyecto concluye su participación: la ficha se registra con 0 puntos y no se califica la rúbrica.
            </div>
          )}
        </div>
      )}

      {!noSePresento && cronometro}

      {/* ── Rúbrica oficial ── */}
      {!noSePresento && !gateNegativo && rubrica && (
        <div style={desalineada ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>
          <EKRubricaMatriz
            rubrica={rubrica}
            puntajes={puntajes}
            onChange={cambiarPuntajes}
            variante={variante}
            onCambiarVariante={rubrica.tieneVariantes && !soloLectura ? (v => { if (v && v !== variante) setVarianteSolicitada(v); }) : undefined}
            soloLectura={edicionBloqueada}
          />
        </div>
      )}

      {!noSePresento && (
        <div style={S.seccion}>
          <label style={S.etiqueta}>Observaciones del jurado (opcional)</label>
          <textarea
            value={observaciones}
            readOnly={edicionBloqueada}
            maxLength={900}
            onChange={e => { sucioRef.current = true; setObservaciones(e.target.value); }}
            style={{ ...S.textarea, background: edicionBloqueada ? C.g50 : C.white }}
            placeholder="Precisiones técnicas o recomendaciones sobre la sustentación del proyecto."
          />
        </div>
      )}

      {/* ── Suscripción ── */}
      {(firmante || esStaff) && (
        <div style={{ ...S.seccion, borderLeft: `5px solid ${firmante ? C.green : C.gold}` }}>
          {firmante ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 140, height: 56, border: `1px solid ${C.g300}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.white }}>
                {firmante.firmaDataUrl
                  ? <img src={firmante.firmaDataUrl} alt="Firma del jurado" style={{ maxHeight: 46, maxWidth: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 11, color: C.g500 }}>Sin trazo</span>}
              </div>
              <div style={{ fontSize: 13, color: C.g800, lineHeight: 1.5 }}>
                Ficha suscrita por <strong style={{ color: C.navy2 }}>{firmante.nombreCompleto}</strong>, DNI {firmante.dni} — Jurado N.° {numeroJurado}
                {firmante.presidente ? ' (preside el jurado)' : ''}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: C.g700 }}>
                La firma del Jurado N.° {numeroJurado} se incorpora desde el Panel de Firmas Oficial cuando se sella.
              </div>
              {onIrAlPanel && (
                <button type="button" onClick={onIrAlPanel} style={btn('primario')}>
                  <Icon name="shield" size={13} color={C.white} /> Panel de Firmas
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!calculo.completa && !gateNegativo && !noSePresento && !desalineada && pendientes.length > 0 && (
        <div style={{ ...aviso('alerta'), display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>Faltan calificar {pendientes.length} criterio(s) en esta ficha.</span>
          <button type="button" onClick={() => irACriterio(pendientes[0].id)} style={btn('contorno', { background: 'transparent' })}>
            Ir al primer criterio pendiente
          </button>
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
          <span style={{ fontWeight: 800, color: C.navy3 }}>{claveOpcion(anexo, variante)} — Jurado N.° {numeroJurado}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.g500 }}>PUNTAJE TOTAL</div>
              <div style={{ fontFamily: FUENTES.mono, fontSize: 20, fontWeight: 800, color: C.g900 }}>
                {calculo.puntajeTotal}<span style={{ fontSize: 12, color: C.g500 }}> / {calculo.puntajeMaximo}</span>
              </div>
            </div>
            <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.g500 }}>CRITERIOS</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: calculo.completa || gateNegativo ? C.green : C.amber }}>
                {gateNegativo ? 'No prosigue' : `${calculo.itemsCalificados} de ${calculo.itemsTotales}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!soloLectura && (
              <button type="button" onClick={limpiarFicha} disabled={guardando} style={btn('peligroSuave')} title="Eliminar la captura de este casillero y dejar la ficha en blanco">
                <Icon name="trash" size={13} color={C.red} /> Limpiar ficha
              </button>
            )}
            {!soloLectura && !noSePresento && !registrada && (
              <button type="button" onClick={() => setModalNSP(true)} disabled={guardando} style={btn('contorno', { color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' })}>
                <Icon name="x" size={13} color="#DC2626" /> Incomparecencia
              </button>
            )}
            {!edicionBloqueada && (
              <button type="button" onClick={() => guardar('borrador', false)} disabled={guardando} style={btn('contorno')}>
                <Icon name="save" size={13} /> Guardar borrador
              </button>
            )}
            {!edicionBloqueada && (
              <button type="button" onClick={registrar} disabled={guardando} style={btn('exito', { padding: '9px 16px', fontSize: 13 })}>
                <Icon name="check" size={14} color={C.white} /> Registrar calificación
              </button>
            )}
            <button type="button" onClick={descargarPDF} style={btn('dorado')}>
              <Icon name="download" size={13} /> PDF
            </button>
          </div>
        </div>
      </div>

      {varianteSolicitada && (
        <ModalCambioAnexo
          participante={participante}
          evaluacionesProyecto={evaluacionesProyecto}
          usuario={usuario}
          onToast={onToast}
          claveInicial={claveOpcion('E15', varianteSolicitada)}
          onCerrar={() => setVarianteSolicitada(null)}
        />
      )}

      {modalNSP && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div role="dialog" aria-modal="true" style={{ background: C.white, borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #FECDD3' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B', marginBottom: 10 }}>¿Registrar incomparecencia?</div>
            <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.5, margin: '0 0 18px' }}>
              Se registrará que el equipo de <strong>{participante.institucion?.nombre}</strong> no se presentó a la evaluación.
              La ficha queda con 0 puntos y el proyecto sale del orden de mérito.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setModalNSP(false)} disabled={guardando} style={btn('contorno')}>Cancelar</button>
              <button type="button" onClick={marcarNSP} disabled={guardando} style={btn('critico')}>
                {guardando ? 'Guardando...' : 'Registrar incomparecencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
