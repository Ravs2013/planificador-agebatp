import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso } from '../creayemprende/cyeEstilos';
import {
  EUREKA_CONFIG, CATEGORIAS, getAreasDeCategoria, getArea, getCategoria, consolidadoId
} from '../../data/eurekaConfigUGEL03';
import { assertRubricasIntegras, getRubricaEureka } from '../../data/eurekaRubricas';
import {
  subscribeEKParticipantesTodos, subscribeEKEvaluaciones, subscribeEKPaneles, subscribeEKConsolidados,
  subscribeEKActas, evaluacionId, limpiarEvaluacionesCategoriaArea, deleteEKEvaluacion, saveEKEvaluacion,
  actualizarParticipanteEK
} from '../../firebase/dbEureka';
import {
  filtrarEvaluacionesValidas, construirConsolidadoE19, construirResultadosActa
} from '../../utils/eurekaHelpers';
import {
  construirParticipantesEK, esEvaluableEK, resumenAnexos, requiereRevision, tienePuntajes
} from '../../utils/eurekaAnexos';
import { resolverPanelFirmas, esPreliminar } from '../../utils/eurekaFirmas';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';
import { generarTodasFichasCategoriaAreaPDF, generarFichasCategoriaCompletaPDF } from '../../pdf/generarFichaEurekaPDF';
import { generarPaqueteLegalPDF } from '../../pdf/generarPaqueteLegalPDF';

import EKProgramacionTab from './EKProgramacionTab';
import EKFichaEvaluacion from './EKFichaEvaluacion';
import EKSelectorParticipante from './EKSelectorParticipante';
import EKConsolidadoE19 from './EKConsolidadoE19';
import EKActaE20 from './EKActaE20';
import EKPanelFirmasOficial from './EKPanelFirmasOficial';
import EKBannerPanelPendiente from './EKBannerPanelPendiente';
import EKPadronAdmision from './EKPadronAdmision';
import EKPadronTab from './EKPadronTab';

const SUB_PESTANAS = [
  { id: 'fichas', label: 'Fichas de evaluación', icon: 'clipboard' },
  { id: 'consolidado', label: 'Anexo E19 — Consolidado', icon: 'fileText' },
  { id: 'acta', label: 'Anexo E20 — Acta', icon: 'check' },
  { id: 'programacion', label: 'Programación', icon: 'calendar' },
  { id: 'padron', label: 'Padrón y admisión', icon: 'shield', soloComision: true }
];

const DISPOSICIONES_BASES_EK = [
  'Categorías: A (1.° y 2.° de primaria), B (3.° y 4.°), C (5.° y 6.°), D (1.° y 2.° de secundaria) y E (3.°, 4.° y 5.° de secundaria) (numeral 2).',
  'En A, B y C, el área Indagación en Ciencia y Tecnología se evalúa con el Anexo E11 (indagación científica) o el E12 (solución tecnológica), y el área Indagación social con el E13 (pregunta relacionada a la historia) o el E14 (problema ambiental o territorial). Cada ficha muestra el anexo del proyecto y por qué; la comisión puede cambiarlo con motivo registrado.',
  'En D y E el anexo lo fija el área: Indagación científica con el E15 (variante experimental o descriptiva), Soluciones tecnológicas con el E16 y Ciencias Sociales con el E17 (D) o el E18 (E) (numeral 12).',
  'En los Anexos E11 a E14, si no se presenta la evidencia de planificación curricular, el proyecto concluye su participación (pregunta 1 de cada anexo).',
  'Exposición presencial de hasta 8 minutos, a cargo de los estudiantes inscritos (máximo dos), sin participación del docente asesor (numeral 10.1).',
  'En A, B y C la etapa UGEL es la última y se reconoce a los tres primeros puestos; en D y E el informe con mayor puntaje de cada área es seleccionado como ganador (numeral 4).',
  'No se consideran empates entre los tres primeros lugares: el jurado calificador los resuelve y su fallo es inapelable (numeral 11).',
  'El jurado de la etapa UGEL lo integran cuatro miembros (numerales 6 y 11); los formatos E19 y E20 traen tres casilleros de firma y el sistema sigue los formatos.',
  'Prohibiciones (numeral 8): experimentos con animales fuera de la Ley N.° 30407, microorganismos potencialmente peligrosos fuera de una institución regulada, sustancias peligrosas o inflamables, y administrar o aplicar sustancias o alimentos en seres humanos.',
  'Inscripción en SICE para la etapa UGEL: del 24 de agosto al 4 de setiembre, hasta las 11:59 p. m. (numeral 16). Reclamos con el Anexo E21 hasta 24 horas después de publicados los resultados.'
];

const CLASE_TOAST = { success: 'success', exito: 'success', error: 'error', info: 'info', alerta: 'info', warning: 'info' };
const OBSERVACION_NSP = 'INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN';

/** Una captura con puntajes de un anexo distinto al vigente no cuenta hasta recalificarse. */
function desalineada(ev, participante) {
  return Boolean(participante && tienePuntajes(ev) && ev.anexoEvaluacion && ev.anexoEvaluacion !== participante.anexoEvaluacion);
}

/**
 * XXXVI FERIA ESCOLAR NACIONAL DE CIENCIA Y TECNOLOGÍA EUREKA 2026 — Etapa UGEL 03.
 * Mismo encabezado, subpestañas y bandeja que Crea y Emprende; el logo solo vive en el banner de bienvenida.
 */
export default function EurekaModule() {
  const { user, isRole } = useAuth();
  const esAdministrador = isRole('admin');
  const esStaff = esAdministrador || isRole('jefatura') || isRole('personal');
  const esJuradoEureka = !esStaff && Boolean(user?.modulo === 'eureka' || isRole('jurado'));
  const categoriaSesion = esJuradoEureka ? (user?.categoria || null) : null;
  const casilleroSesion = esJuradoEureka && Number(user?.numeroJurado) >= 1 && Number(user?.numeroJurado) <= 3
    ? Number(user.numeroJurado) : null;

  const [subTab, setSubTab] = useState('fichas');
  const [mostrarBases, setMostrarBases] = useState(false);
  const [categoria, setCategoria] = useState(categoriaSesion || 'A');
  const [areaId, setAreaId] = useState(() => getAreasDeCategoria(categoriaSesion || 'A')[0]?.id || '');
  const [numeroJurado, setNumeroJurado] = useState(casilleroSesion || 1);
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  const [importados, setImportados] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [panelesMap, setPanelesMap] = useState({});
  const [consolidados, setConsolidados] = useState([]);
  const [actas, setActas] = useState([]);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [progreso, setProgreso] = useState(null);
  const [cargando, setCargando] = useState({});

  useEffect(() => {
    if (categoriaSesion) setCategoria(categoriaSesion);
    if (casilleroSesion) setNumeroJurado(casilleroSesion);
  }, [categoriaSesion, casilleroSesion]);

  const addToast = useCallback((msg, tipo = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5200);
  }, []);

  /* ── Suscripciones en tiempo real ── */
  useEffect(() => {
    const bajas = [
      subscribeEKParticipantesTodos(setImportados),
      subscribeEKEvaluaciones({}, setEvaluaciones),
      subscribeEKPaneles(setPanelesMap),
      subscribeEKConsolidados(setConsolidados),
      subscribeEKActas(setActas)
    ];
    return () => bajas.forEach(baja => { if (typeof baja === 'function') baja(); });
  }, []);

  /* ── Áreas de la categoría ── */
  const areasDisponibles = useMemo(() => getAreasDeCategoria(categoria), [categoria]);
  useEffect(() => {
    if (areasDisponibles.length && !areasDisponibles.some(a => a.id === areaId)) {
      setAreaId(areasDisponibles[0].id);
      setSeleccionadoId(null);
    }
  }, [areasDisponibles, areaId]);

  /* ── Padrón combinado (semilla + Firestore) ── */
  const integridad = useMemo(() => assertRubricasIntegras(), []);
  const participantes = useMemo(() => construirParticipantesEK({ importados }), [importados]);
  const evaluables = useMemo(() => participantes.filter(esEvaluableEK), [participantes]);
  const porId = useMemo(() => new Map(participantes.map(p => [p.id, p])), [participantes]);

  const evaluacionesValidas = useMemo(
    () => filtrarEvaluacionesValidas(evaluaciones, null, null, evaluables),
    [evaluaciones, evaluables]
  );
  const evaluacionesComputables = useMemo(
    () => evaluacionesValidas.filter(ev => !desalineada(ev, porId.get(ev.participanteId))),
    [evaluacionesValidas, porId]
  );

  const participantesArea = useMemo(
    () => evaluables.filter(p => p.categoria === categoria && p.areaId === areaId),
    [evaluables, categoria, areaId]
  );
  const evaluacionesArea = useMemo(
    () => evaluacionesComputables.filter(ev => ev.categoria === categoria && ev.areaId === areaId),
    [evaluacionesComputables, categoria, areaId]
  );
  const desalineadasArea = useMemo(
    () => evaluacionesValidas.filter(ev => ev.categoria === categoria && ev.areaId === areaId && desalineada(ev, porId.get(ev.participanteId))),
    [evaluacionesValidas, categoria, areaId, porId]
  );

  const seleccionado = useMemo(() => participantesArea.find(p => p.id === seleccionadoId) || null, [participantesArea, seleccionadoId]);
  const indice = seleccionado ? participantesArea.findIndex(p => p.id === seleccionado.id) : -1;
  const evaluacionesProyecto = useMemo(
    () => (seleccionado ? evaluacionesValidas.filter(ev => ev.participanteId === seleccionado.id) : []),
    [evaluacionesValidas, seleccionado]
  );
  const evaluacionActual = useMemo(
    () => (seleccionado ? evaluacionesProyecto.find(ev => ev.id === evaluacionId(seleccionado.id, numeroJurado)) || null : null),
    [evaluacionesProyecto, seleccionado, numeroJurado]
  );

  const panel = useMemo(() => resolverPanelFirmas(panelesMap, { categoria, areaId }), [panelesMap, categoria, areaId]);
  const idDocumento = consolidadoId(categoria, areaId);
  const consolidadoGuardado = consolidados.find(c => c.id === idDocumento);
  const actaGuardada = actas.find(a => a.id === idDocumento);

  const puedeCapturar = esStaff || isRole('jurado') || esJuradoEureka;
  const bloqueadoPorSellado = !esPreliminar(panel) && !esAdministrador;
  const fichaBloqueada = !puedeCapturar || bloqueadoPorSellado;
  const motivoBloqueo = !puedeCapturar
    ? 'Su rol no permite capturar calificaciones en este módulo.'
    : (bloqueadoPorSellado ? 'El Panel de Firmas Oficial está sellado: las calificaciones quedaron cerradas y solo un administrador puede reabrirlas.' : null);

  const cat = getCategoria(categoria);
  const area = getArea(areaId);
  const anexosArea = resumenAnexos(participantesArea);
  const revisionArea = participantesArea.filter(requiereRevision).length;

  const abrirProyecto = (p) => {
    setSeleccionadoId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirFichaDesdePadron = (p) => {
    setCategoria(p.categoria);
    setAreaId(p.areaId);
    setSubTab('fichas');
    setSeleccionadoId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Descargas masivas (comisión) ── */
  const marcar = (clave, valor) => setCargando(prev => ({ ...prev, [clave]: valor }));

  const descargarFichasArea = async () => {
    if (!evaluacionesArea.length) { addToast('Aún no hay fichas registradas en esta categoría y área.', 'info'); return; }
    try {
      marcar('fichasArea', true);
      const banner = await obtenerMembreteEureka();
      const n = await generarTodasFichasCategoriaAreaPDF(evaluacionesArea, {
        panelesMap, banner, onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Fichas' })
      });
      addToast(`${n} fichas generadas.`, 'success');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcar('fichasArea', false);
      setProgreso(null);
    }
  };

  const descargarFichasCategoria = async () => {
    const pool = evaluacionesComputables.filter(ev => ev.categoria === categoria);
    if (!pool.length) { addToast(`Aún no hay fichas en la categoría ${categoria}.`, 'info'); return; }
    try {
      marcar('fichasCategoria', true);
      const banner = await obtenerMembreteEureka();
      const n = await generarFichasCategoriaCompletaPDF(pool, {
        categoria, panelesMap, banner, onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Fichas' })
      });
      addToast(`${n} fichas generadas.`, 'success');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcar('fichasCategoria', false);
      setProgreso(null);
    }
  };

  const descargarPaqueteLegal = async () => {
    try {
      marcar('paquete', true);
      const areas = getAreasDeCategoria(categoria);
      const consolidadosCat = areas.map(a => {
        const partsArea = evaluables.filter(p => p.categoria === categoria && p.areaId === a.id);
        const evalsArea = evaluacionesComputables.filter(ev => ev.categoria === categoria && ev.areaId === a.id);
        const guardado = consolidados.find(g => g.id === consolidadoId(categoria, a.id));
        return {
          categoria, areaId: a.id, dre: EUREKA_CONFIG.dre, ugel: EUREKA_CONFIG.ugel, region: EUREKA_CONFIG.region,
          provincia: EUREKA_CONFIG.provincia, distrito: EUREKA_CONFIG.distrito, fecha: EUREKA_CONFIG.fechaEvaluacion,
          etapa: EUREKA_CONFIG.etapa, filas: construirConsolidadoE19(partsArea, evalsArea),
          dirimencias: guardado?.dirimencias || [], estado: guardado?.estado || 'borrador', vacia: partsArea.length === 0
        };
      }).filter(c => !c.vacia);
      const actasCat = consolidadosCat.map(c => {
        const guardada = actas.find(a => a.id === consolidadoId(categoria, c.areaId));
        const incluirPuntaje = guardada?.incluirPuntaje || false;
        return {
          categoria, areaId: c.areaId, region: guardada?.region || EUREKA_CONFIG.region, provincia: guardada?.provincia || EUREKA_CONFIG.provincia,
          distrito: guardada?.distrito || EUREKA_CONFIG.distrito, fecha: guardada?.fecha || EUREKA_CONFIG.fechaEvaluacion,
          hora: guardada?.hora || EUREKA_CONFIG.horaActa, etapa: EUREKA_CONFIG.etapa, incluirPuntaje,
          resultados: construirResultadosActa(c.filas, { incluirPuntaje })
        };
      });
      const banner = await obtenerMembreteEureka();
      const res = await generarPaqueteLegalPDF({
        categoria,
        consolidados: consolidadosCat,
        actas: actasCat,
        evaluaciones: evaluacionesComputables.filter(ev => ev.categoria === categoria),
        panelesMap,
        banner,
        onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Paquete legal' })
      });
      addToast(`Paquete legal generado: ${res.paginas} páginas.`, 'success');
    } catch (err) {
      addToast(`No se pudo generar el paquete legal: ${err.message}`, 'error');
    } finally {
      marcar('paquete', false);
      setProgreso(null);
    }
  };

  /* ── Acciones desde la lista ── */
  const limpiarFichasArea = async () => {
    if (!esStaff) return;
    if (!window.confirm(`¿Eliminar TODAS las evaluaciones de ${area?.nombre} — ${cat?.nombre}?\n\nLas fichas quedan en blanco para la evaluación oficial.`)) return;
    try {
      marcar('limpiando', true);
      const borrados = await limpiarEvaluacionesCategoriaArea(categoria, areaId);
      addToast(`Se eliminaron ${borrados} evaluaciones. Fichas en blanco.`, 'info');
    } catch (err) {
      addToast(`No se pudieron limpiar las fichas: ${err.message}`, 'error');
    } finally {
      marcar('limpiando', false);
    }
  };

  const limpiarFichaItem = async (p, ev) => {
    const inst = p.institucion?.nombre || 'la I. E.';
    if (!window.confirm(`¿Limpiar la ficha del Jurado N.° ${numeroJurado} de «${inst}»?`)) return;
    try {
      await deleteEKEvaluacion(ev?.id || evaluacionId(p.id, numeroJurado));
      if (p.noSePresento) await actualizarParticipanteEK(p, { noSePresento: false });
      addToast(`Ficha de «${inst}» restablecida en blanco.`, 'info');
    } catch (err) {
      addToast(`No se pudo limpiar la ficha: ${err.message}`, 'error');
    }
  };

  const marcarNSPItem = async (p) => {
    const inst = p.institucion?.nombre || 'la I. E.';
    if (!window.confirm(`¿Registrar incomparecencia de «${inst}»?\n\nLa ficha queda con 0 puntos y el proyecto sale del orden de mérito.`)) return;
    try {
      const rubrica = getRubricaEureka(p.anexoEvaluacion);
      await saveEKEvaluacion({
        participanteId: p.id,
        participanteSnapshot: {
          id: p.id, codigoParticipante: p.codigoParticipante || p.id, tituloProyecto: p.tituloProyecto || '',
          pseudonimo: p.pseudonimo || '', institucionNombre: inst,
          institucion: { nombre: inst, codigoModular: p.institucion?.codigoModular || '', ugel: EUREKA_CONFIG.ugel, dre: EUREKA_CONFIG.dre },
          estudiantes: [], docenteAsesor: { nombreCompleto: p.docenteAsesor?.nombreCompleto || '', especialidad: p.docenteAsesor?.especialidad || '' },
          gradoSeccion: p.gradoSeccion || '', ordenPresentacion: p.ordenPresentacion || p.numero || 0, noSePresento: true
        },
        categoria: p.categoria, areaId: p.areaId, lineaId: p.lineaId || null,
        anexoEvaluacion: p.anexoEvaluacion, varianteRubrica: rubrica?.tieneVariantes ? (p.varianteRubrica || 'A') : null,
        jurado: { numeroJurado }, planificacionCurricular: null,
        puntajes: {}, puntajeBruto: 0, puntajePonderado: 0, puntajeTotal: 0, puntajeMaximo: rubrica?.puntajeMaximo || 0,
        penalizaciones: [], duracionEjecutada: '00:00', excedioTiempo: false, observacionesJurado: OBSERVACION_NSP,
        acreditacion: {}, incomparecencia: true, noSePresento: true, noProsigue: false,
        fecha: EUREKA_CONFIG.fechaEvaluacion, estado: 'registrada'
      }, { usuario: user, accion: 'incomparecencia' });
      await actualizarParticipanteEK(p, { noSePresento: true });
      addToast(`Incomparecencia registrada para «${inst}».`, 'info');
    } catch (err) {
      addToast(`No se pudo registrar la incomparecencia: ${err.message}`, 'error');
    }
  };

  const pestanas = SUB_PESTANAS.filter(t => !t.soloComision || esStaff);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${CLASE_TOAST[t.tipo] || 'info'}`}>{t.msg}</div>)}
      </div>

      {/* Encabezado del módulo (sin logo: el logo vive en el banner de bienvenida) */}
      <div style={{ background: C.navy2, color: C.white, borderRadius: '8px 8px 0 0', padding: '16px 24px', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: FUENTES.serif, fontSize: 22, margin: 0, letterSpacing: 0.3, fontWeight: 400 }}>
              XXXVI Feria Escolar Nacional de Ciencia y Tecnología Eureka
            </h1>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>
              Etapa UGEL 03 · DRE Lima Metropolitana · Bases Específicas 2026, Anexo E
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMostrarBases(v => !v)}
            style={{ background: 'transparent', border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FUENTES.sans, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Disposiciones de las bases <Icon name={mostrarBases ? 'chevronUp' : 'chevronDown'} size={14} color={C.gold} />
          </button>
        </div>
        {mostrarBases && (
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 14, marginTop: 14, fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {DISPOSICIONES_BASES_EK.map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Subpestañas */}
      <div style={{ display: 'flex', background: C.white, borderBottom: `2px solid ${C.border}`, overflowX: 'auto' }}>
        {pestanas.map(tab => {
          const activa = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setSubTab(tab.id); setSeleccionadoId(null); }}
              style={{
                padding: '12px 20px', fontSize: 13, fontWeight: 700, color: activa ? C.white : C.g500,
                background: activa ? C.navy3 : 'transparent', border: 'none', cursor: 'pointer', fontFamily: FUENTES.sans,
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
              }}
            >
              <Icon name={tab.icon} size={15} color={activa ? C.white : C.g500} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '20px 0' }}>
        {!integridad.ok && (
          <div style={{ ...aviso('error'), marginBottom: 14 }}>
            <strong>Error de integridad en las rúbricas oficiales. No emita documentos hasta corregirlo.</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{integridad.errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}
        {progreso && <div style={{ ...aviso('info'), marginBottom: 14 }}>{progreso.etiqueta}: {progreso.hechas} de {progreso.total} procesadas.</div>}

        {subTab !== 'padron' && <EKBannerPanelPendiente panel={panel} onAbrirPanel={() => { setSubTab('consolidado'); setPanelAbierto(true); }} />}

        {/* ───── FICHAS: BANDEJA ───── */}
        {subTab === 'fichas' && !seleccionado && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 'clamp(12px, 3vw, 24px)', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div>
                <label style={S.etiqueta}>Categoría habilitada</label>
                {categoriaSesion ? (
                  <input readOnly value={`${cat?.nombre || categoria} — ${cat?.grados || ''}`} style={{ ...S.input, background: C.g100, fontWeight: 700 }} />
                ) : (
                  <select value={categoria} onChange={e => { setCategoria(e.target.value); setSeleccionadoId(null); }} style={{ ...S.input, fontWeight: 700 }}>
                    {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.grados}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={S.etiqueta}>Área de participación</label>
                <select value={areaId} onChange={e => { setAreaId(e.target.value); setSeleccionadoId(null); }} style={{ ...S.input, fontWeight: 700 }}>
                  {areasDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={S.etiqueta}>Etapa</label>
                <input readOnly value="UGEL" style={{ ...S.input, background: C.g100, fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>
                  Proyectos de {area?.nombre} — {cat?.nombre} ({participantesArea.length})
                </div>
                <div style={{ fontSize: 12, color: C.g500, marginTop: 2 }}>
                  Anexos: {anexosArea.map(([k, n]) => `${k} (${n})`).join(' · ') || '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => participantesArea[0] && abrirProyecto(participantesArea[0])} disabled={!participantesArea.length} style={participantesArea.length ? btn('primario') : btnDeshabilitado(btn('primario'))}>
                  <Icon name="play" size={13} color={C.white} /> Iniciar evaluación
                </button>
                {esStaff && (
                  <button type="button" onClick={limpiarFichasArea} disabled={cargando.limpiando} style={btn('peligroSuave')}>
                    <Icon name="trash" size={13} color={C.red} /> Limpiar fichas del área
                  </button>
                )}
                {esStaff && (
                  <button type="button" onClick={descargarFichasArea} disabled={cargando.fichasArea} style={cargando.fichasArea ? btnDeshabilitado(btn('primario')) : btn('primario')}>
                    <Icon name="download" size={13} color={C.white} /> {cargando.fichasArea ? 'Generando...' : 'Fichas del área (PDF)'}
                  </button>
                )}
                {esStaff && (
                  <button type="button" onClick={descargarFichasCategoria} disabled={cargando.fichasCategoria} style={cargando.fichasCategoria ? btnDeshabilitado(btn('real')) : btn('real')}>
                    <Icon name="download" size={13} color={C.white} /> {cargando.fichasCategoria ? 'Generando...' : `Fichas de la Cat. ${categoria} (PDF)`}
                  </button>
                )}
                {esStaff && (
                  <button type="button" onClick={descargarPaqueteLegal} disabled={cargando.paquete} style={cargando.paquete ? btnDeshabilitado(btn('indigo')) : btn('indigo')}>
                    <Icon name="shield" size={13} color={C.white} /> {cargando.paquete ? 'Compilando...' : 'Paquete legal completo (PDF)'}
                  </button>
                )}
              </div>
            </div>

            {esStaff && (revisionArea > 0 || desalineadasArea.length > 0) && (
              <div style={{ ...aviso('alerta'), marginBottom: 12, fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span>
                  {revisionArea > 0 && `${revisionArea} proyecto(s) de esta área requieren revisión de anexo o admisión. `}
                  {desalineadasArea.length > 0 && `${desalineadasArea.length} ficha(s) se calificaron con un anexo distinto al vigente y no cuentan en el consolidado hasta recalificarse.`}
                </span>
                {revisionArea > 0 && (
                  <button type="button" onClick={() => setSubTab('padron')} style={btn('contorno', { background: 'transparent' })}>
                    <Icon name="shield" size={13} /> Ir a Padrón y admisión
                  </button>
                )}
              </div>
            )}

            <EKSelectorParticipante
              participantes={participantesArea}
              evaluaciones={evaluacionesArea}
              seleccionado={seleccionado}
              onSeleccionar={abrirProyecto}
              categoria={categoria}
              areaId={areaId}
              numeroJuradoActivo={numeroJurado}
              esStaff={esStaff}
              onLimpiarFicha={fichaBloqueada ? null : limpiarFichaItem}
              onMarcarNSP={fichaBloqueada ? null : marcarNSPItem}
            />
          </div>
        )}

        {/* ───── FICHAS: EVALUACIÓN ───── */}
        {subTab === 'fichas' && seleccionado && (
          <div>
            <div style={{ ...S.tarjeta, marginBottom: 14, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSeleccionadoId(null)} style={btn('secundario')}>
                  <Icon name="arrowLeft" size={14} /> Volver a la lista
                </button>
                {indice >= 0 && <span style={{ fontSize: 12.5, color: C.g500, fontWeight: 600 }}>Proyecto {indice + 1} de {participantesArea.length}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {indice > 0 && (
                  <button type="button" onClick={() => abrirProyecto(participantesArea[indice - 1])} style={btn('secundario')}>
                    <Icon name="arrowLeft" size={13} /> Anterior
                  </button>
                )}
                {indice >= 0 && indice < participantesArea.length - 1 && (
                  <button type="button" onClick={() => abrirProyecto(participantesArea[indice + 1])} style={btn('secundario')}>
                    Siguiente <Icon name="arrowRight" size={13} />
                  </button>
                )}
              </div>
            </div>

            <EKFichaEvaluacion
              participante={seleccionado}
              evaluacionInicial={evaluacionActual}
              evaluacionesProyecto={evaluacionesProyecto}
              numeroJurado={numeroJurado}
              onCambiarJurado={setNumeroJurado}
              casilleroFijo={Boolean(casilleroSesion)}
              panel={panel}
              usuario={user}
              esStaff={esStaff}
              soloLectura={fichaBloqueada}
              motivoBloqueo={motivoBloqueo}
              onToast={addToast}
              onIrAlPanel={() => { setSubTab('consolidado'); setPanelAbierto(true); }}
            />
          </div>
        )}

        {/* ───── E19, E20 Y PROGRAMACIÓN ───── */}
        {['consolidado', 'acta', 'programacion'].includes(subTab) && (
          <div style={{ ...S.seccion, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label style={S.etiqueta}>Categoría</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                style={{ ...S.input, fontWeight: 700 }}
                disabled={Boolean(categoriaSesion)}
              >
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.grados}</option>)}
              </select>
            </div>
            <div>
              <label style={S.etiqueta}>Área de participación</label>
              <select value={areaId} onChange={e => setAreaId(e.target.value)} style={{ ...S.input, fontWeight: 700 }}>
                {areasDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
          </div>
        )}

        {subTab === 'consolidado' && (
          <>
            {desalineadasArea.length > 0 && esStaff && (
              <div style={{ ...aviso('alerta'), marginBottom: 12 }}>
                {desalineadasArea.length} ficha(s) de esta área se calificaron con un anexo distinto al vigente del proyecto; no se suman hasta que el jurado vuelva a calificar.
              </div>
            )}
            <EKConsolidadoE19
              categoria={categoria}
              areaId={areaId}
              participantes={participantesArea}
              evaluaciones={evaluacionesArea}
              consolidadoGuardado={consolidadoGuardado}
              panel={panel}
              panelesMap={panelesMap}
              usuario={user}
              esStaff={esStaff}
              onAbrirPanel={() => setPanelAbierto(true)}
              onToast={addToast}
            />
          </>
        )}

        {subTab === 'acta' && (
          <EKActaE20
            categoria={categoria}
            areaId={areaId}
            participantes={participantesArea}
            evaluaciones={evaluacionesArea}
            actaGuardada={actaGuardada}
            panel={panel}
            panelesMap={panelesMap}
            usuario={user}
            esStaff={esStaff}
            onAbrirPanel={() => setPanelAbierto(true)}
            onToast={addToast}
          />
        )}

        {subTab === 'programacion' && (
          <EKProgramacionTab
            categoria={categoria}
            areaId={areaId}
            participantes={participantesArea}
            usuario={user}
            esStaff={esStaff}
            onToast={addToast}
          />
        )}

        {/* ───── PADRÓN Y ADMISIÓN (solo comisión) ───── */}
        {subTab === 'padron' && esStaff && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EKPadronAdmision
              participantes={participantes}
              evaluaciones={evaluacionesValidas}
              usuario={user}
              onToast={addToast}
              onAbrirFicha={abrirFichaDesdePadron}
            />
            <details style={{ ...S.seccion }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 800, color: C.navy2 }}>
                Registro manual y herramientas anteriores del padrón
              </summary>
              <div style={{ marginTop: 12 }}>
                <EKPadronTab
                  categoria={categoria}
                  areaId={areaId}
                  participantes={participantesArea}
                  usuario={user}
                  esStaff={esStaff}
                  onToast={addToast}
                  onSeleccionar={abrirFichaDesdePadron}
                />
              </div>
            </details>
          </div>
        )}
      </div>

      <EKPanelFirmasOficial
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        panelesMap={panelesMap}
        categoria={categoria}
        areaId={areaId}
        evaluacionesDelAlcance={evaluacionesArea}
        participantesDelAlcance={participantesArea}
        usuario={user}
        esAdministrador={esAdministrador}
        onToast={addToast}
      />
    </div>
  );
}
