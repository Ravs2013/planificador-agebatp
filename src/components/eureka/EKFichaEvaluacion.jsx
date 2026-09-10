import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../Icon';
import { C, CE, S, btn, btnDeshabilitado, aviso } from './ekEstilos';
import EKRubricaMatriz from './EKRubricaMatriz';
import EKAcreditacionChecklist from './EKAcreditacionChecklist';
import { getRubricaEureka } from '../../data/eurekaRubricas';
import {
  EUREKA_CONFIG, SLOTS_JURADO, getArea, getLinea, getCategoria
} from '../../data/eurekaConfigUGEL03';
import {
  calcularPuntajeEvaluacion, sumaPenalizaciones, nombresEstudiantes, resolverVariante, resolverAnexoPorDefecto
} from '../../utils/eurekaHelpers';
import { resolverFirmanteDeFicha, esPreliminar } from '../../utils/eurekaFirmas';
import { saveEKEvaluacion, evaluacionId, deleteEKEvaluacion, updateEKParticipante } from '../../firebase/dbEureka';
import { generarFichaEurekaPDF } from '../../pdf/generarFichaEurekaPDF';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';

const DEBOUNCE_MS = 1500;

/**
 * Ficha de evaluación individual (Anexos E11 a E18) — Diseñada para Jurados Mayores.
 *
 * Características senior-friendly:
 * - Barra superior clara con el Casillero de Jurado activo (J1, J2, J3).
 * - Cabecera con datos en tipografía grande (16-18px) y botón destacado a Google Drive.
 * - Navegación secuencial inmediata (Proyecto anterior / siguiente).
 * - Barra de progreso visual y puntaje en números grandes (28px).
 * - Indicador tranquilizador de autoguardado en la nube con hora visible.
 * - Alerta guiada si faltan criterios por responder con scroll automático.
 */
export default function EKFichaEvaluacion({
  participante,
  evaluacionInicial,
  numeroJurado,
  onCambiarJurado,
  categoria,
  areaId,
  panel,
  usuario,
  soloLectura = false,
  motivoBloqueo = null,
  onToast,
  onIrAlPanel,
  onVolver,
  onAnterior,
  onSiguiente
}) {
  const anexoInicial = evaluacionInicial?.anexoEvaluacion
    || participante?.anexoEvaluacion
    || resolverAnexoPorDefecto(categoria || participante?.categoria, areaId || participante?.areaId);

  const [anexoActivo, setAnexoActivo] = useState(anexoInicial);

  useEffect(() => {
    const a = evaluacionInicial?.anexoEvaluacion
      || participante?.anexoEvaluacion
      || resolverAnexoPorDefecto(categoria || participante?.categoria, areaId || participante?.areaId);
    setAnexoActivo(a);
  }, [evaluacionInicial?.anexoEvaluacion, participante?.anexoEvaluacion, categoria, areaId, participante?.categoria, participante?.areaId]);

  const rubrica = useMemo(() => {
    return getRubricaEureka(anexoActivo)
      || getRubricaEureka(resolverAnexoPorDefecto(categoria || participante?.categoria, areaId || participante?.areaId));
  }, [anexoActivo, categoria, areaId, participante?.categoria, participante?.areaId]);

  const [puntajes, setPuntajes] = useState({});
  const [variante, setVariante] = useState('A');
  const [planificacion, setPlanificacion] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [acreditacion, setAcreditacion] = useState({});
  const [penalizaciones, setPenalizaciones] = useState([]);
  const [mostrarPenalizaciones, setMostrarPenalizaciones] = useState(false);
  const [nuevaPenalizacion, setNuevaPenalizacion] = useState({ puntos: '', motivo: '' });
  const [segundos, setSegundos] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);

  const loadedEvalIdRef = useRef(null);
  const debounceRef = useRef(null);
  const cronometroRef = useRef(null);

  const idEsperado = participante ? evaluacionId(participante.id, numeroJurado) : null;

  /* ── Guardián de carga: sincroniza el estado local al cambiar de participante o jurado ── */
  useEffect(() => {
    const idActual = evaluacionInicial?.id ?? idEsperado;
    if (loadedEvalIdRef.current !== null && loadedEvalIdRef.current === idActual) return;

    setPuntajes(evaluacionInicial?.puntajes || {});
    setVariante(
      evaluacionInicial?.varianteRubrica
      || participante?.varianteRubrica
      || resolverVariante({ areaId, lineaId: participante?.lineaId })
      || 'A'
    );
    setPlanificacion(
      evaluacionInicial?.planificacionCurricular != null
        ? evaluacionInicial.planificacionCurricular
        : null
    );
    setObservaciones(evaluacionInicial?.observacionesJurado || '');
    setAcreditacion(evaluacionInicial?.acreditacion || {});
    setPenalizaciones(evaluacionInicial?.penalizaciones || []);
    const dur = String(evaluacionInicial?.duracionEjecutada || '00:00').split(':');
    setSegundos((parseInt(dur[0], 10) || 0) * 60 + (parseInt(dur[1], 10) || 0));
    loadedEvalIdRef.current = idActual;
  }, [evaluacionInicial, idEsperado, areaId, participante]);

  /* ── Cronómetro ── */
  useEffect(() => {
    if (cronometroActivo) {
      cronometroRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
    }
    return () => { if (cronometroRef.current) clearInterval(cronometroRef.current); };
  }, [cronometroActivo]);

  const duracionTexto = useMemo(() => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [segundos]);

  const excedioTiempo = segundos > EUREKA_CONFIG.tiempoExposicionMin * 60;

  /* ── Cálculo en vivo ── */
  const gateNegativo = rubrica?.gate?.requerido && planificacion === false;

  const calculo = useMemo(() => calcularPuntajeEvaluacion({
    rubrica,
    puntajes,
    penalizaciones,
    variante,
    noProsigue: gateNegativo,
    incomparecencia: Boolean(participante?.noSePresento)
  }), [rubrica, puntajes, penalizaciones, variante, gateNegativo, participante?.noSePresento]);

  /* ── Criterios faltantes para feedback al usuario mayor ── */
  const itemsPendientes = useMemo(() => {
    if (!rubrica) return [];
    if (rubrica.tipoEscala === 'simple') {
      return (rubrica.criterios || []).filter(c => puntajes[c.id] == null);
    } else {
      const items = rubrica.aspectos || [];
      return items.filter(a => puntajes[a.id] == null || Number(puntajes[a.id]) === 0);
    }
  }, [rubrica, puntajes]);

  /* ── Construcción del documento ── */
  const construirPayload = useCallback((estado) => ({
    id: idEsperado,
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    participanteId: participante.id,
    participanteSnapshot: {
      id: participante.id,
      codigoParticipante: participante.codigoParticipante || participante.id,
      tituloProyecto: participante.tituloProyecto || '',
      pseudonimo: participante.pseudonimo || '',
      urlTrabajo: participante.urlTrabajo || '',
      urlCuadernoCampo: participante.urlCuadernoCampo || '',
      institucionNombre: participante.institucion?.nombre || participante.institucionNombre || '',
      institucion: participante.institucion || {},
      estudiantes: participante.estudiantes || [],
      docenteAsesor: participante.docenteAsesor || {},
      ordenPresentacion: participante.ordenPresentacion || 0,
      noSePresento: Boolean(participante.noSePresento)
    },
    categoria,
    areaId,
    lineaId: participante.lineaId,
    anexoEvaluacion: anexoActivo || rubrica?.id || participante.anexoEvaluacion,
    varianteRubrica: rubrica?.tieneVariantes ? variante : null,
    jurado: { numeroJurado },
    planificacionCurricular: rubrica?.gate?.requerido ? planificacion : null,
    puntajes,
    puntajeBruto: calculo.puntajeBruto,
    puntajePonderado: calculo.puntajePonderado,
    puntajeTotal: calculo.puntajeTotal,
    puntajeMaximo: calculo.puntajeMaximo,
    penalizaciones,
    duracionEjecutada: duracionTexto,
    excedioTiempo,
    observacionesJurado: observaciones,
    acreditacion,
    incomparecencia: Boolean(participante.noSePresento),
    noProsigue: Boolean(gateNegativo),
    fecha: EUREKA_CONFIG.fechaEvaluacion,
    estado
  }), [
    idEsperado, participante, categoria, areaId, rubrica, anexoActivo, variante, numeroJurado,
    planificacion, puntajes, calculo, penalizaciones, duracionTexto, excedioTiempo,
    observaciones, acreditacion, gateNegativo
  ]);

  const guardar = useCallback(async (estado, esAuto) => {
    if (!participante || soloLectura) return;

    if (esAuto
      && Object.keys(puntajes).length === 0
      && Object.keys(evaluacionInicial?.puntajes || {}).length > 0) {
      return;
    }

    try {
      if (!esAuto) setGuardando(true);
      await saveEKEvaluacion(construirPayload(estado), {
        usuario,
        accion: esAuto ? 'autoguardado' : (estado === 'registrada' ? 'registro' : 'guardado')
      });
      setUltimoGuardado(new Date());
      if (!esAuto && onToast) {
        onToast(
          estado === 'registrada'
            ? `¡Excelente! Calificación del Jurado N.° ${numeroJurado} registrada formalmente.`
            : 'Borrador guardado en la nube.',
          'exito'
        );
      }
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar: ${err.message}`, 'error');
    } finally {
      if (!esAuto) setGuardando(false);
    }
  }, [participante, soloLectura, puntajes, evaluacionInicial, construirPayload, usuario, numeroJurado, onToast]);

  /* ── Autoguardado con debounce ── */
  useEffect(() => {
    if (soloLectura || !participante) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      guardar('borrador', true);
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [puntajes, variante, planificacion, observaciones, acreditacion, penalizaciones, duracionTexto, soloLectura, participante, guardar]);

  const descargarPDF = async () => {
    try {
      const banner = await obtenerMembreteEureka();
      const payload = construirPayload(evaluacionInicial?.estado || 'borrador');
      generarFichaEurekaPDF(payload, { panel, banner });
      if (onToast) onToast('Ficha individual descargada en PDF.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el PDF: ${err.message}`, 'error');
    }
  };

  const handleLimpiarFicha = async () => {
    if (!window.confirm(`¿Está seguro de LIMPIAR la ficha del Jurado N.° ${numeroJurado}?\n\nSe eliminarán los puntajes guardados en la nube y la ficha quedará completamente en blanco.`)) return;
    try {
      setGuardando(true);
      if (idEsperado) {
        await deleteEKEvaluacion(idEsperado);
      }
      if (participante?.noSePresento) {
        await updateEKParticipante(participante.id, { noSePresento: false });
      }
      setPuntajes({});
      setObservaciones('');
      setPenalizaciones([]);
      setAcreditacion({});
      setSegundos(0);
      setUltimoGuardado(new Date());
      if (onToast) onToast(`Ficha del Jurado N.° ${numeroJurado} limpiada y restablecida en blanco.`, 'info');
    } catch (err) {
      if (onToast) onToast(`Error al limpiar ficha: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleMarcarNSPInterno = async () => {
    const inst = participante?.institucion?.nombre || participante?.institucionNombre || 'la I. E.';
    if (!window.confirm(`¿Confirmar INCOMPARECENCIA (NSP) para "${inst}"?\n\nLa ficha se registrará con 0 puntos y el participante se marcará como no presentado.`)) return;

    try {
      setGuardando(true);
      const payload = {
        ...construirPayload('registrada'),
        puntajes: {},
        puntajeBruto: 0,
        puntajePonderado: 0,
        puntajeTotal: 0,
        incomparecencia: true,
        noSePresento: true,
        observacionesJurado: 'INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN'
      };
      await saveEKEvaluacion(payload, { usuario, accion: 'incomparecencia' });
      await updateEKParticipante(participante.id, { noSePresento: true });
      setPuntajes({});
      setObservaciones('INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN');
      setUltimoGuardado(new Date());
      if (onToast) onToast(`Incomparecencia (NSP) registrada formalmente para "${inst}".`, 'alerta');
    } catch (err) {
      if (onToast) onToast(`Error al registrar incomparecencia: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleRevertirNSP = async () => {
    if (!window.confirm('¿Desea revertir la incomparecencia y habilitar la calificación de este proyecto?')) return;
    try {
      setGuardando(true);
      await updateEKParticipante(participante.id, { noSePresento: false });
      if (idEsperado) {
        await deleteEKEvaluacion(idEsperado);
      }
      setPuntajes({});
      setObservaciones('');
      setUltimoGuardado(new Date());
      if (onToast) onToast('Incomparecencia revertida. La ficha está habilitada para calificar.', 'exito');
    } catch (err) {
      if (onToast) onToast(`Error al revertir incomparecencia: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const hacerScrollACriterio = (criterioId) => {
    const el = document.getElementById(`criterio-${criterioId}`) || document.getElementById(`aspecto-${criterioId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const cat = getCategoria(categoria);
  const area = getArea(areaId);
  const linea = getLinea(areaId, participante?.lineaId);
  const firmante = resolverFirmanteDeFicha(panel, numeroJurado);
  const registrada = evaluacionInicial?.estado === 'registrada';

  if (!participante) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── 1. BARRA SUPERIOR: IDENTIDAD DEL JURADO Y NAVEGACIÓN ── */}
      <div style={{
        background: C.navy2,
        color: C.blanco,
        borderRadius: 8,
        padding: '16px 22px',
        boxShadow: '0 4px 14px rgba(12,25,41,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: C.blanco,
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon name="arrowLeft" size={14} color={C.blanco} />
              Volver a la lista
            </button>
          )}

          <div>
            <div style={{ fontSize: 11, color: CE.verdeHalo, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              SESIÓN DE EVALUACIÓN OFICIAL
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              Usted califica como: <span style={{ color: CE.verdeHalo }}>JURADO N.° {numeroJurado}</span>
            </div>
          </div>
        </div>

        {/* Segmento de cambio de casillero de jurado o casillero bloqueado */}
        {usuario?.modulo === 'eureka' && usuario?.numeroJurado && Number(usuario.numeroJurado) <= 3 ? (
          <div style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1.5px solid #4ADE80',
            color: C.blanco,
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(74,222,128,0.2)'
          }}>
            <Icon name="lock" size={14} color="#4ADE80" />
            <span>CASILLERO ASIGNADO: JURADO N.° {numeroJurado}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.blanco, opacity: 0.8, marginRight: 4 }}>Cambiar casillero:</span>
            {SLOTS_JURADO.map(slot => {
              const activo = numeroJurado === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onCambiarJurado(slot)}
                  style={{
                    minHeight: 40,
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: activo ? CE.verdeEureka : 'rgba(255,255,255,0.12)',
                    color: C.blanco,
                    border: `2px solid ${activo ? CE.verdeHalo : 'rgba(255,255,255,0.2)'}`,
                    boxShadow: activo ? '0 2px 8px rgba(110,158,35,0.4)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="user" size={14} color={C.blanco} />
                  <span>Jurado {slot}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. TARJETA DESTACADA DEL PROYECTO EVALUADO ── */}
      <div style={{
        ...S.tarjeta,
        padding: '20px 24px',
        border: '1px solid #D6DCE8',
        borderLeft: '5px solid #1B3A5C',
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                background: '#1B3A5C',
                color: C.blanco,
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                N.° {participante.ordenPresentacion || '—'}
              </span>

              <span style={S.chip('#EFF6FF', '#1E40AF', '#BFDBFE')}>
                {cat?.nombre} — {cat?.nivel}
              </span>

              {participante.pseudonimo && (
                <span style={S.chip('#FEF9C3', '#854D0E', '#FDE047')}>
                  Pseudónimo: {participante.pseudonimo}
                </span>
              )}

              <span style={S.chip('#F1F5F9', '#334155', '#CBD5E1')}>
                Anexo {rubrica?.id || anexoActivo}
              </span>
            </div>

            {/* Nombre de la Institución Educativa en grande */}
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
              {participante.institucion?.nombre || participante.institucionNombre || 'I. E. no registrada'}
            </div>

            {/* Título del proyecto */}
            <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
              Proyecto: <span style={{ color: '#0F172A' }}>"{participante.tituloProyecto || 'Sin título registrado'}"</span>
            </div>

            {linea && (
              <div style={{ fontSize: 13, color: '#0284C7', fontWeight: 600, marginTop: 4 }}>
                Línea de indagación: {linea.nombre}
              </div>
            )}
          </div>

          {/* Navegación secuencial de proyectos */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {onAnterior && (
              <button
                type="button"
                onClick={onAnterior}
                style={btn('secundario', { minHeight: 38, padding: '7px 14px', fontSize: 12.5 })}
                title="Ir al proyecto anterior"
              >
                <Icon name="arrowLeft" size={14} /> Anterior
              </button>
            )}
            {onSiguiente && (
              <button
                type="button"
                onClick={onSiguiente}
                style={btn('secundario', { minHeight: 38, padding: '7px 14px', fontSize: 12.5 })}
                title="Ir al proyecto siguiente"
              >
                Siguiente <Icon name="arrowRight" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── BOTÓN DESTACADO PARA ABRIR GOOGLE DRIVE ── */}
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {participante.urlTrabajo ? (
            <a
              href={participante.urlTrabajo}
              target="_blank"
              rel="noreferrer"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: C.blanco,
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name="folderOpen" size={17} color={C.blanco} />
              <span>ABRIR INFORME Y EVIDENCIAS EN GOOGLE DRIVE</span>
              <Icon name="externalLink" size={14} color={C.blanco} />
            </a>
          ) : (
            <div style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="alert" size={15} color="#94A3B8" />
              <span>Este proyecto no registró enlace web en el SICE (evaluación presencial física).</span>
            </div>
          )}

          {participante.urlCuadernoCampo && (
            <a
              href={participante.urlCuadernoCampo}
              target="_blank"
              rel="noreferrer"
              style={{
                background: C.blanco,
                color: C.navy2,
                border: `1.5px solid ${C.gris300}`,
                padding: '11px 18px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Icon name="fileText" size={15} color={C.navy2} />
              Cuaderno de campo ↗
            </a>
          )}

          {participante.noSePresento && (
            <span style={{
              background: '#FEF2F2',
              color: C.error,
              border: '1px solid #FECACA',
              padding: '8px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 800
            }}>
              NO SE PRESENTÓ (Puntaje en 0)
            </span>
          )}
        </div>
      </div>

      {/* ── ALERTA DE INCOMPARECENCIA (NSP) ── */}
      {(participante.noSePresento || evaluacionInicial?.incomparecencia || evaluacionInicial?.noSePresento) && (
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #F87171',
          borderLeft: '6px solid #DC2626',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 2px 8px rgba(220,38,38,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="alert" size={24} color="#DC2626" />
            <div>
              <div style={{ color: '#991B1B', fontSize: 14.5, fontWeight: 800 }}>
                PARTICIPANTE REGISTRADO CON INCOMPARECENCIA (NO SE PRESENTÓ)
              </div>
              <div style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 2 }}>
                La calificación se encuentra fijada en 0 puntos según las bases oficiales. Si el estudiante se presentó a la exposición, puede revertir la incomparecencia para habilitar la rúbrica.
              </div>
            </div>
          </div>
          {!soloLectura && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleRevertirNSP}
                disabled={guardando}
                style={{
                  background: '#15803D',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(21,128,61,0.25)'
                }}
              >
                <Icon name="refresh" size={13} color="#FFFFFF" /> Revertir NSP (Habilitar Evaluación)
              </button>
              <button
                type="button"
                onClick={handleLimpiarFicha}
                disabled={guardando}
                style={{
                  background: '#FFFFFF',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  padding: '9px 16px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon name="trash" size={13} color="#DC2626" /> Limpiar Ficha
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 2.1 FORMULARIO OFICIAL DE EVALUACIÓN SEGÚN BASES MINEDU ── */}
      {rubrica && (
        <div style={{
          background: C.blanco,
          border: `2px solid ${CE.verdeEureka}`,
          borderLeft: `8px solid ${CE.verdeEureka}`,
          borderRadius: 8,
          padding: '18px 22px',
          marginBottom: 18,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: CE.verdeOscuro, textTransform: 'uppercase', letterSpacing: 1 }}>
                ANEXO {rubrica.id} · FORMULARIO OFICIAL DE EVALUACIÓN (BASES MINEDU)
              </div>
              <h2 style={{ margin: '6px 0 8px', fontSize: 18, fontWeight: 900, color: C.navy2, lineHeight: 1.35 }}>
                {rubrica.titulo}
              </h2>
              {rubrica.competencia && (
                <div style={{ fontSize: 13.5, color: C.gris800, marginTop: 4 }}>
                  <strong style={{ color: C.navy2 }}>Competencia MINEDU:</strong> {rubrica.competencia}
                </div>
              )}
              {rubrica.notaMetodologica && (
                <div style={{ fontSize: 12.5, color: C.gris600, marginTop: 4, fontStyle: 'italic' }}>
                  Orientación: {rubrica.notaMetodologica}
                </div>
              )}
            </div>

            {/* Selector interactivo de formulario para Primaria (E11 vs E12 / E13 vs E14) */}
            {['A', 'B', 'C'].includes(categoria || participante.categoria) && (
              <div style={{ background: CE.verdeFondo, padding: '12px 16px', borderRadius: 8, border: `1.5px solid ${CE.verdeBorde}` }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: CE.verdeOscuro, marginBottom: 8, textTransform: 'uppercase' }}>
                  Formulario a aplicar:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(areaId || participante.areaId) === 'ind_ciencia_tecnologia' ? (
                    <>
                      <button
                        type="button"
                        disabled={soloLectura}
                        onClick={() => setAnexoActivo('E11')}
                        style={{
                          padding: '8px 14px', fontSize: 13, fontWeight: 800,
                          borderRadius: 6, cursor: soloLectura ? 'default' : 'pointer', fontFamily: 'inherit',
                          border: `2px solid ${anexoActivo === 'E11' ? CE.verdeEureka : C.gris300}`,
                          background: anexoActivo === 'E11' ? CE.verdeEureka : C.blanco,
                          color: anexoActivo === 'E11' ? C.blanco : C.gris700,
                          boxShadow: anexoActivo === 'E11' ? '0 2px 8px rgba(16,122,68,0.25)' : 'none'
                        }}
                      >
                        Anexo E11 (Indagación Científica)
                      </button>
                      <button
                        type="button"
                        disabled={soloLectura}
                        onClick={() => setAnexoActivo('E12')}
                        style={{
                          padding: '8px 14px', fontSize: 13, fontWeight: 800,
                          borderRadius: 6, cursor: soloLectura ? 'default' : 'pointer', fontFamily: 'inherit',
                          border: `2px solid ${anexoActivo === 'E12' ? CE.verdeEureka : C.gris300}`,
                          background: anexoActivo === 'E12' ? CE.verdeEureka : C.blanco,
                          color: anexoActivo === 'E12' ? C.blanco : C.gris700,
                          boxShadow: anexoActivo === 'E12' ? '0 2px 8px rgba(16,122,68,0.25)' : 'none'
                        }}
                      >
                        Anexo E12 (Solución Tecnológica)
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={soloLectura}
                        onClick={() => setAnexoActivo('E13')}
                        style={{
                          padding: '8px 14px', fontSize: 13, fontWeight: 800,
                          borderRadius: 6, cursor: soloLectura ? 'default' : 'pointer', fontFamily: 'inherit',
                          border: `2px solid ${anexoActivo === 'E13' ? CE.verdeEureka : C.gris300}`,
                          background: anexoActivo === 'E13' ? CE.verdeEureka : C.blanco,
                          color: anexoActivo === 'E13' ? C.blanco : C.gris700,
                          boxShadow: anexoActivo === 'E13' ? '0 2px 8px rgba(16,122,68,0.25)' : 'none'
                        }}
                      >
                        Anexo E13 (Historia)
                      </button>
                      <button
                        type="button"
                        disabled={soloLectura}
                        onClick={() => setAnexoActivo('E14')}
                        style={{
                          padding: '8px 14px', fontSize: 13, fontWeight: 800,
                          borderRadius: 6, cursor: soloLectura ? 'default' : 'pointer', fontFamily: 'inherit',
                          border: `2px solid ${anexoActivo === 'E14' ? CE.verdeEureka : C.gris300}`,
                          background: anexoActivo === 'E14' ? CE.verdeEureka : C.blanco,
                          color: anexoActivo === 'E14' ? C.blanco : C.gris700,
                          boxShadow: anexoActivo === 'E14' ? '0 2px 8px rgba(16,122,68,0.25)' : 'none'
                        }}
                      >
                        Anexo E14 (Ambiental/Territorial)
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {soloLectura && motivoBloqueo && (
        <div style={{ ...aviso('alerta'), fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="lock" size={18} color={C.alerta} />
            <span>{motivoBloqueo}</span>
          </div>
        </div>
      )}

      {/* ── 3. GATE DE PLANIFICACIÓN CURRICULAR (PRIMARIA) ── */}
      {rubrica?.gate?.requerido && (
        <div style={{
          ...S.seccion,
          border: `2px solid ${gateNegativo ? C.error : CE.verdeEureka}`,
          background: gateNegativo ? '#FEF2F2' : '#F9FDF5'
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: CE.verdeOscuro, textTransform: 'uppercase', marginBottom: 6 }}>
            1.- PREGUNTA DE HABILITACIÓN NORMATIVA (MINEDU)
          </div>
          <div style={{ fontSize: 14.5, color: C.gris900, lineHeight: 1.6, marginBottom: 16 }}>
            <strong>{rubrica.gate.pregunta}</strong>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={soloLectura}
              onClick={() => setPlanificacion(true)}
              style={{
                minHeight: 48,
                padding: '10px 24px',
                borderRadius: 8,
                fontSize: 14.5,
                fontWeight: 800,
                cursor: soloLectura ? 'default' : 'pointer',
                fontFamily: 'inherit',
                background: planificacion === true ? CE.verdeEureka : C.blanco,
                color: planificacion === true ? C.blanco : C.gris900,
                border: `2px solid ${planificacion === true ? CE.verdeOscuro : C.gris300}`,
                boxShadow: planificacion === true ? '0 4px 10px rgba(110,158,35,0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Icon name="check" size={18} color={planificacion === true ? C.blanco : C.exito} />
              SÍ — Presenta evidencia ({rubrica.gate.textoPositivo})
            </button>

            <button
              type="button"
              disabled={soloLectura}
              onClick={() => setPlanificacion(false)}
              style={{
                minHeight: 48,
                padding: '10px 24px',
                borderRadius: 8,
                fontSize: 14.5,
                fontWeight: 800,
                cursor: soloLectura ? 'default' : 'pointer',
                fontFamily: 'inherit',
                background: planificacion === false ? C.error : C.blanco,
                color: planificacion === false ? C.blanco : C.error,
                border: `2px solid ${planificacion === false ? C.error : C.gris300}`,
                boxShadow: planificacion === false ? '0 4px 10px rgba(185,28,28,0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Icon name="x" size={18} color={planificacion === false ? C.blanco : C.error} />
              NO — No presenta ({rubrica.gate.textoNegativo})
            </button>
          </div>

          {gateNegativo && (
            <div style={{ ...aviso('error'), marginTop: 14, fontSize: 13.5 }}>
              Conforme a las bases MINEDU, el participante concluye su participación sin calificar el formulario (puntaje en 0).
            </div>
          )}
        </div>
      )}

      {/* ── 4. FORMULARIO OFICIAL DE EVALUACIÓN (BASES MINEDU) ── */}
      {!gateNegativo && !participante.noSePresento && (
        <EKRubricaMatriz
          rubrica={rubrica}
          puntajes={puntajes}
          onChange={setPuntajes}
          variante={variante}
          onCambiarVariante={setVariante}
          soloLectura={soloLectura}
        />
      )}

      {/* ── 5. CRONÓMETRO DE EXPOSICIÓN (MÁXIMO 8 MINUTOS) ── */}
      <div style={{
        ...S.seccion,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        background: '#FAFBFD'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: C.blanco,
            border: `2px solid ${excedioTiempo ? C.error : CE.verdeEureka}`,
            borderRadius: 8,
            padding: '10px 18px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, color: C.gris500, textTransform: 'uppercase', fontWeight: 800 }}>
              TIEMPO DE EXPOSICIÓN
            </div>
            <div style={{
              fontSize: 30,
              fontWeight: 900,
              color: excedioTiempo ? C.error : C.navy2,
              fontVariantNumeric: 'tabular-nums'
            }}>
              {duracionTexto}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>
              Control de tiempo de exposición
            </div>
            <div style={{ fontSize: 12, color: C.gris700, marginTop: 2 }}>
              Tiempo máximo normativo: {EUREKA_CONFIG.tiempoExposicionMin} minutos.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            disabled={soloLectura}
            onClick={() => setCronometroActivo(a => !a)}
            style={btn(cronometroActivo ? 'peligro' : 'primario', { minHeight: 44, padding: '10px 20px' })}
          >
            <Icon name={cronometroActivo ? 'pause' : 'play'} size={15} />
            {cronometroActivo ? 'Pausar cronómetro' : 'Iniciar cronómetro'}
          </button>
          <button
            type="button"
            disabled={soloLectura}
            onClick={() => { setCronometroActivo(false); setSegundos(0); }}
            style={btn('secundario', { minHeight: 44, padding: '10px 16px' })}
          >
            <Icon name="refresh" size={14} /> Reiniciar
          </button>
        </div>
      </div>

      {/* ── 6. OBSERVACIONES DEL JURADO ── */}
      <div style={{ ...S.seccion }}>
        <label style={{ ...S.etiqueta, fontSize: 14 }}>Observaciones del jurado</label>
        <textarea
          value={observaciones}
          readOnly={soloLectura}
          onChange={e => setObservaciones(e.target.value)}
          style={{ ...S.textarea, fontSize: 14, minHeight: 90 }}
          placeholder="Escriba aquí cualquier observación técnica, recomendación o precisión sobre la sustentación del proyecto..."
        />
      </div>

      {/* ── 7. BLOQUE INFORMATIVO DE FIRMA ── */}
      <div style={{
        ...S.seccion,
        borderLeft: `5px solid ${firmante ? CE.verdeEureka : C.alerta}`,
        background: firmante ? '#F0FDF4' : '#FFFBEB'
      }}>
        <div style={S.tituloSeccion}>Suscripción oficial de la ficha</div>
        {firmante ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{
              border: `1.5px solid ${C.gris300}`,
              borderRadius: 6,
              padding: 6,
              background: C.blanco,
              width: 150,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {firmante.firmaDataUrl ? (
                <img
                  src={firmante.firmaDataUrl}
                  alt="Firma oficial"
                  style={{ maxHeight: 52, maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 11, color: C.gris500 }}>Sin trazo</span>
              )}
            </div>
            <div style={{ fontSize: 13.5, color: C.gris900, lineHeight: 1.6 }}>
              Ficha suscrita por:{' '}
              <strong style={{ color: C.navy2 }}>{firmante.nombreCompleto}</strong>, DNI {firmante.dni}
              {' '}— Jurado N.° {firmante.numeroJurado}
              {firmante.presidente ? ' (Presidente del Jurado)' : ''}
              {firmante.institucion && (
                <div style={{ fontSize: 12, color: C.gris700 }}>{firmante.institucion}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13.5, color: C.gris900, lineHeight: 1.6, maxWidth: 640 }}>
              Pendiente de suscripción centralizada. Los 3 jurados oficiales firman en el Panel de Firmas Oficial
              (en la pestaña Consolidado E19), y la firma se propaga automáticamente a todas las fichas.
            </div>
            {onIrAlPanel && (
              <button type="button" onClick={onIrAlPanel} style={btn('primario', { minHeight: 44 })}>
                <Icon name="shield" size={15} /> Ir al Panel de Firmas
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── ALERTA SI FALTAN CRITERIOS (CON SCROLL AUTOMÁTICO) ── */}
      {!calculo.completa && !gateNegativo && !participante.noSePresento && itemsPendientes.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="alert" size={20} color="#92400E" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#92400E' }}>
              Atención: Faltan calificar {itemsPendientes.length} criterio(s) en esta ficha.
            </span>
          </div>
          <button
            type="button"
            onClick={() => hacerScrollACriterio(itemsPendientes[0]?.id)}
            style={{
              background: '#92400E',
              color: C.blanco,
              border: 'none',
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Ir al primer criterio pendiente ↓
          </button>
        </div>
      )}

      {/* ── 8. BARRA STICKY INFERIOR DE ACCIONES (ESTILO JUEGOS FLORALES - IMAGEN 2) ── */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#FFFFFF',
        borderTop: '2px solid #D6DCE8',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 40,
        boxShadow: '0 -4px 20px rgba(15,23,42,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ultimoGuardado ? '#16A34A' : '#EAB308',
              display: 'inline-block'
            }} />
            <span>{ultimoGuardado ? `Guardado a las ${ultimoGuardado.toLocaleTimeString('es-PE')}` : 'Cambios sin guardar'}</span>
          </div>
          <div style={{ fontWeight: 800, color: '#1B3A5C', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Anexo {rubrica?.id || anexoActivo}</span>
            <span>·</span>
            <span>Jurado N.° {numeroJurado}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Métricas de puntaje */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {onVolver && (
              <button
                type="button"
                onClick={onVolver}
                style={{
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: '1px solid #D6DCE8',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon name="arrowLeft" size={14} /> Volver
              </button>
            )}

            <div style={{ borderLeft: onVolver ? '1px solid #D6DCE8' : 'none', paddingLeft: onVolver ? 14 : 0 }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Puntaje Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', fontFamily: "'JetBrains Mono', monospace" }}>
                {calculo.puntajeTotal}{' '}
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>/ {calculo.puntajeMaximo} pts</span>
              </span>
            </div>

            <div style={{ borderLeft: '1px solid #D6DCE8', paddingLeft: 14 }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Completitud</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: calculo.completa ? '#16A34A' : '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                {calculo.completa && <Icon name="check" size={13} color="#16A34A" />}
                {calculo.completa ? '100% Calificada' : `${calculo.itemsCalificados} de ${calculo.itemsTotales}`}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!soloLectura && (
              <button
                type="button"
                onClick={handleLimpiarFicha}
                disabled={guardando}
                style={{
                  padding: '9px 14px',
                  borderRadius: 6,
                  border: '1px solid #FECDD3',
                  background: '#FFF1F2',
                  color: '#B91C1C',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Eliminar la evaluación registrada y dejar la ficha en blanco"
              >
                <Icon name="trash" size={13} color="#B91C1C" /> Limpiar Ficha
              </button>
            )}

            {!soloLectura && !participante.noSePresento && !calculo.incomparecencia && (
              <button
                type="button"
                onClick={handleMarcarNSPInterno}
                disabled={guardando}
                style={{
                  padding: '9px 14px',
                  borderRadius: 6,
                  border: '1px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title="Marcar que el participante no se presentó a la evaluación (NSP)"
              >
                <Icon name="x" size={13} color="#DC2626" /> Incomparecencia (NSP)
              </button>
            )}

            {!soloLectura && (
              <button
                type="button"
                onClick={() => guardar('borrador', false)}
                disabled={guardando}
                style={{
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: '1.5px solid #1B3A5C',
                  background: '#FFFFFF',
                  color: '#1B3A5C',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Icon name="save" size={14} color="#1B3A5C" /> Guardar Borrador
              </button>
            )}

            {!soloLectura && (
              <button
                type="button"
                onClick={() => {
                  if (!gateNegativo && !participante.noSePresento && !calculo.completa) {
                    if (!window.confirm('Aún faltan criterios por calificar en esta ficha. ¿Desea registrar la calificación de todos modos?')) return;
                  }
                  guardar('registrada', false);
                }}
                disabled={guardando}
                style={{
                  padding: '9px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#15803D',
                  color: '#FFFFFF',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 6px rgba(21,128,61,0.25)'
                }}
              >
                <Icon name="check" size={15} color="#FFFFFF" />
                REGISTRAR CALIFICACIÓN OFICIAL
              </button>
            )}

            <button
              type="button"
              onClick={descargarPDF}
              style={{
                padding: '9px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'linear-gradient(135deg, #CA8A04 0%, #A16207 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(202,138,4,0.25)'
              }}
            >
              <Icon name="download" size={14} color="#FFFFFF" /> Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
