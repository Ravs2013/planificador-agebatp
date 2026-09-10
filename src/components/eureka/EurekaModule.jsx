import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { C, CE, S, btn, btnDeshabilitado, aviso } from './ekEstilos';
import {
  EUREKA_CONFIG, CATEGORIAS, SLOTS_JURADO, getAreasDeCategoria, getArea, getCategoria, consolidadoId
} from '../../data/eurekaConfigUGEL03';
import { assertRubricasIntegras } from '../../data/eurekaRubricas';
import {
  subscribeEKParticipantes, subscribeEKEvaluaciones, subscribeEKPaneles,
  subscribeEKConsolidados, subscribeEKActas,
  getEKEvaluaciones, getEKParticipantes, getEKConsolidados, getEKActas,
  updateEKParticipante, evaluacionId,
  limpiarEvaluacionesCategoriaArea, deleteEKEvaluacion
} from '../../firebase/dbEureka';
import {
  filtrarEvaluacionesValidas, construirConsolidadoE19, construirResultadosActa
} from '../../utils/eurekaHelpers';
import { resolverPanelFirmas, esPreliminar } from '../../utils/eurekaFirmas';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';
import {
  generarTodasFichasCategoriaAreaPDF, generarFichasCategoriaCompletaPDF
} from '../../pdf/generarFichaEurekaPDF';
import { generarE19CategoriaCompletaPDF } from '../../pdf/generarE19PDF';
import { generarE20CategoriaCompletaPDF } from '../../pdf/generarE20PDF';
import { generarPaqueteLegalPDF } from '../../pdf/generarPaqueteLegalPDF';

import EKPadronTab from './EKPadronTab';
import EKProgramacionTab from './EKProgramacionTab';
import EKFichaEvaluacion from './EKFichaEvaluacion';
import EKSelectorParticipante from './EKSelectorParticipante';
import EKConsolidadoE19 from './EKConsolidadoE19';
import EKActaE20 from './EKActaE20';
import EKPanelFirmasOficial from './EKPanelFirmasOficial';
import EKBannerPanelPendiente from './EKBannerPanelPendiente';

const SUB_PESTANAS = [
  { id: 'fichas', label: 'Fichas de evaluación', icon: 'clipboard' },
  { id: 'consolidado', label: 'Anexo E19 — Consolidado', icon: 'fileText' },
  { id: 'acta', label: 'Anexo E20 — Acta', icon: 'check' },
  { id: 'programacion', label: 'Programación', icon: 'calendar' },
  { id: 'padron', label: 'Padrón SICE', icon: 'users' }
];

/**
 * Contenedor maestro del módulo Eureka 2026 (Etapa UGEL — UGEL 03).
 */
export default function EurekaModule() {
  const { user, isRole } = useAuth();

  const esAdministrador = isRole('admin');
  const esStaff = esAdministrador || isRole('jefatura') || isRole('personal');

  const [subTab, setSubTab] = useState('fichas');
  const [showBases, setShowBases] = useState(false);
  const [categoria, setCategoria] = useState('A');
  const [areaId, setAreaId] = useState(() => getAreasDeCategoria('A')[0]?.id || '');
  const [numeroJurado, setNumeroJurado] = useState(1);

  const [participantes, setParticipantes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [panelesMap, setPanelesMap] = useState({});
  const [consolidados, setConsolidados] = useState([]);
  const [actas, setActas] = useState([]);

  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarListaLateral, setMostrarListaLateral] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [progreso, setProgreso] = useState(null);
  const [cargando, setCargando] = useState({});

  /* ── Navegación secuencial de proyectos para jurados ── */
  const indiceSeleccionado = useMemo(() => {
    if (!seleccionado) return -1;
    return participantes.findIndex(p => p.id === seleccionado.id);
  }, [seleccionado, participantes]);

  const irAnterior = indiceSeleccionado > 0 ? () => setSeleccionado(participantes[indiceSeleccionado - 1]) : null;
  const irSiguiente = (indiceSeleccionado >= 0 && indiceSeleccionado < participantes.length - 1)
    ? () => setSeleccionado(participantes[indiceSeleccionado + 1])
    : null;

  /* ── Integridad de rúbricas: si falla, se muestra visible y no en silencio ── */
  const integridad = useMemo(() => assertRubricasIntegras(), []);

  const addToast = useCallback((msg, tipo = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5200);
  }, []);

  /* ── Áreas disponibles según la categoría ── */
  const areasDisponibles = useMemo(() => getAreasDeCategoria(categoria), [categoria]);

  useEffect(() => {
    if (areasDisponibles.length > 0 && !areasDisponibles.some(a => a.id === areaId)) {
      setAreaId(areasDisponibles[0].id);
      setSeleccionado(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, areasDisponibles]);

  /* ── Suscripciones en tiempo real ── */
  useEffect(() => {
    if (!areaId) return undefined;
    const unP = subscribeEKParticipantes({ categoria, areaId, etapa: EUREKA_CONFIG.etapa }, setParticipantes);
    const unE = subscribeEKEvaluaciones({ categoria, areaId }, setEvaluaciones);
    return () => { unP(); unE(); };
  }, [categoria, areaId]);

  useEffect(() => {
    const unPan = subscribeEKPaneles(setPanelesMap);
    const unCon = subscribeEKConsolidados(setConsolidados);
    const unAct = subscribeEKActas(setActas);
    return () => { unPan(); unCon(); unAct(); };
  }, []);

  /* ── Datos derivados ── */

  const evaluacionesValidas = useMemo(
    () => filtrarEvaluacionesValidas(evaluaciones, categoria, areaId, participantes),
    [evaluaciones, categoria, areaId, participantes]
  );

  const panel = useMemo(
    () => resolverPanelFirmas(panelesMap, { categoria, areaId }),
    [panelesMap, categoria, areaId]
  );

  const idDocumento = useMemo(() => consolidadoId(categoria, areaId), [categoria, areaId]);
  const consolidadoGuardado = useMemo(() => consolidados.find(c => c.id === idDocumento), [consolidados, idDocumento]);
  const actaGuardada = useMemo(() => actas.find(a => a.id === idDocumento), [actas, idDocumento]);

  const evaluacionActual = useMemo(() => {
    if (!seleccionado) return null;
    return evaluaciones.find(ev => ev.id === evaluacionId(seleccionado.id, numeroJurado)) || null;
  }, [evaluaciones, seleccionado, numeroJurado]);

  const cat = getCategoria(categoria);
  const area = getArea(areaId);

  // Tras el sellado del panel, una nota ya no puede cambiar salvo que la reabra un
  // administrador: es lo que da valor probatorio al consolidado suscrito por el jurado.
  const puedeCapturar = esStaff || isRole('jurado');
  const bloqueadoPorSellado = !esPreliminar(panel) && !esAdministrador;
  const fichaBloqueada = !puedeCapturar || bloqueadoPorSellado;
  const motivoBloqueo = !puedeCapturar
    ? 'Su rol no permite capturar calificaciones en este módulo.'
    : (bloqueadoPorSellado
      ? 'El Panel de Firmas Oficial está sellado. Las calificaciones del alcance quedaron cerradas; solo un administrador puede reabrir el panel para modificarlas.'
      : null);

  /* ── Descargas masivas ── */

  const marcarCarga = (clave, valor) => setCargando(prev => ({ ...prev, [clave]: valor }));

  const descargarFichasCategoriaArea = async () => {
    try {
      marcarCarga('fichasArea', true);
      addToast(`Recopilando fichas de ${cat?.nombre} — ${area?.nombre}...`, 'info');
      if (evaluacionesValidas.length === 0) {
        addToast('No hay fichas registradas en esta categoría y área.', 'alerta');
        return;
      }
      const banner = await obtenerMembreteEureka();
      addToast(`Generando PDF consolidado de ${evaluacionesValidas.length} fichas...`, 'info');
      const n = await generarTodasFichasCategoriaAreaPDF(evaluacionesValidas, {
        panelesMap, banner,
        onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Fichas' })
      });
      addToast(`Descarga completada. ${n} fichas generadas.`, 'exito');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcarCarga('fichasArea', false);
      setProgreso(null);
    }
  };

  const descargarFichasCategoria = async () => {
    try {
      marcarCarga('fichasCategoria', true);
      const areas = getAreasDeCategoria(categoria);
      addToast(`Recopilando fichas de ${cat?.nombre} (${areas.length} áreas de participación)...`, 'info');

      const [todasEvals, todosParts] = await Promise.all([
        getEKEvaluaciones({ categoria }),
        getEKParticipantes({ categoria })
      ]);

      const pool = [];
      areas.forEach(a => {
        const partsArea = todosParts.filter(p => p.areaId === a.id);
        pool.push(...filtrarEvaluacionesValidas(todasEvals, categoria, a.id, partsArea));
      });

      if (pool.length === 0) {
        addToast(`No hay fichas registradas en la categoría ${categoria}.`, 'alerta');
        return;
      }

      const banner = await obtenerMembreteEureka();
      addToast(`Generando PDF consolidado de ${pool.length} fichas...`, 'info');
      const n = await generarFichasCategoriaCompletaPDF(pool, {
        categoria, panelesMap, banner,
        onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Fichas' })
      });
      addToast(`Descarga completada. ${n} fichas generadas.`, 'exito');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcarCarga('fichasCategoria', false);
      setProgreso(null);
    }
  };

  /** Sintetiza al vuelo los consolidados de una categoría, estén o no cerrados. */
  const sintetizarConsolidados = async () => {
    const areas = getAreasDeCategoria(categoria);
    const [todasEvals, todosParts, guardados] = await Promise.all([
      getEKEvaluaciones({ categoria }),
      getEKParticipantes({ categoria }),
      getEKConsolidados()
    ]);

    return areas.map(a => {
      const partsArea = todosParts.filter(p => p.areaId === a.id);
      const evalsArea = filtrarEvaluacionesValidas(todasEvals, categoria, a.id, partsArea);
      const guardado = guardados.find(g => g.id === consolidadoId(categoria, a.id));
      return {
        categoria,
        areaId: a.id,
        dre: EUREKA_CONFIG.dre,
        ugel: EUREKA_CONFIG.ugel,
        region: EUREKA_CONFIG.region,
        provincia: EUREKA_CONFIG.provincia,
        distrito: EUREKA_CONFIG.distrito,
        fecha: EUREKA_CONFIG.fechaEvaluacion,
        etapa: EUREKA_CONFIG.etapa,
        filas: construirConsolidadoE19(partsArea, evalsArea),
        dirimencias: guardado?.dirimencias || [],
        estado: guardado?.estado || 'borrador',
        vacia: partsArea.length === 0
      };
    });
  };

  const descargarE19Categoria = async () => {
    try {
      marcarCarga('e19Categoria', true);
      addToast(`Recopilando los consolidados de ${cat?.nombre}...`, 'info');
      const todos = (await sintetizarConsolidados()).filter(c => !c.vacia);
      if (todos.length === 0) {
        addToast(`No hay áreas con participantes en la categoría ${categoria}.`, 'alerta');
        return;
      }
      const banner = await obtenerMembreteEureka();
      const n = await generarE19CategoriaCompletaPDF(todos, { categoria, panelesMap, banner });
      addToast(`Descarga completada. ${n} consolidados generados.`, 'exito');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcarCarga('e19Categoria', false);
    }
  };

  const descargarE20Categoria = async () => {
    try {
      marcarCarga('e20Categoria', true);
      addToast(`Recopilando las actas de ${cat?.nombre}...`, 'info');
      const [consolidadosSintetizados, actasGuardadas] = await Promise.all([
        sintetizarConsolidados(),
        getEKActas()
      ]);

      const paraCompilar = consolidadosSintetizados
        .filter(c => !c.vacia)
        .map(c => {
          const guardada = actasGuardadas.find(a => a.id === consolidadoId(categoria, c.areaId));
          return {
            categoria,
            areaId: c.areaId,
            region: guardada?.region || EUREKA_CONFIG.region,
            provincia: guardada?.provincia || EUREKA_CONFIG.provincia,
            distrito: guardada?.distrito || EUREKA_CONFIG.distrito,
            fecha: guardada?.fecha || EUREKA_CONFIG.fechaEvaluacion,
            hora: guardada?.hora || EUREKA_CONFIG.horaActa,
            etapa: EUREKA_CONFIG.etapa,
            incluirPuntaje: guardada?.incluirPuntaje || false,
            resultados: construirResultadosActa(c.filas, { incluirPuntaje: guardada?.incluirPuntaje || false }),
            estado: guardada?.estado || 'borrador'
          };
        });

      if (paraCompilar.length === 0) {
        addToast(`No hay áreas con participantes en la categoría ${categoria}.`, 'alerta');
        return;
      }

      const banner = await obtenerMembreteEureka();
      const n = await generarE20CategoriaCompletaPDF(paraCompilar, { categoria, panelesMap, banner });
      addToast(`Descarga completada. ${n} actas generadas.`, 'exito');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcarCarga('e20Categoria', false);
    }
  };

  const descargarPaqueteLegal = async () => {
    try {
      marcarCarga('paquete', true);
      addToast(`Compilando el paquete legal de ${cat?.nombre}...`, 'info');

      const areas = getAreasDeCategoria(categoria);
      const [todasEvals, todosParts, actasGuardadas] = await Promise.all([
        getEKEvaluaciones({ categoria }),
        getEKParticipantes({ categoria }),
        getEKActas()
      ]);

      const evalsPool = [];
      areas.forEach(a => {
        const partsArea = todosParts.filter(p => p.areaId === a.id);
        evalsPool.push(...filtrarEvaluacionesValidas(todasEvals, categoria, a.id, partsArea));
      });

      const consolidadosSintetizados = (await sintetizarConsolidados()).filter(c => !c.vacia);
      const actasParaPaquete = consolidadosSintetizados.map(c => {
        const guardada = actasGuardadas.find(a => a.id === consolidadoId(categoria, c.areaId));
        return {
          categoria,
          areaId: c.areaId,
          region: guardada?.region || EUREKA_CONFIG.region,
          provincia: guardada?.provincia || EUREKA_CONFIG.provincia,
          distrito: guardada?.distrito || EUREKA_CONFIG.distrito,
          fecha: guardada?.fecha || EUREKA_CONFIG.fechaEvaluacion,
          hora: guardada?.hora || EUREKA_CONFIG.horaActa,
          etapa: EUREKA_CONFIG.etapa,
          incluirPuntaje: guardada?.incluirPuntaje || false,
          resultados: construirResultadosActa(c.filas, { incluirPuntaje: guardada?.incluirPuntaje || false })
        };
      });

      const banner = await obtenerMembreteEureka();
      addToast(`Generando el expediente con ${evalsPool.length} fichas...`, 'info');

      const res = await generarPaqueteLegalPDF({
        categoria,
        consolidados: consolidadosSintetizados,
        actas: actasParaPaquete,
        evaluaciones: evalsPool,
        panelesMap,
        banner,
        onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Paquete legal' })
      });

      addToast(`Paquete legal completado. ${res.paginas} páginas, ${res.fichas} fichas, ${res.areas} áreas.`, 'exito');
    } catch (err) {
      addToast(`No se pudo generar el paquete legal: ${err.message}`, 'error');
    } finally {
      marcarCarga('paquete', false);
      setProgreso(null);
    }
  };

  /* ── Acciones sobre participantes ── */

  const marcarNoPresentado = async (p) => {
    if (!window.confirm(`¿Marcar como NO SE PRESENTÓ a "${p.institucion?.nombre || p.institucionNombre}"?\n\nSu puntaje queda en cero y se excluye del podio y de la detección de empates.`)) return;
    try {
      await updateEKParticipante(p.id, { noSePresento: true });
      addToast('Participante marcado como no presentado.', 'alerta');
    } catch (err) {
      addToast(`No se pudo actualizar: ${err.message}`, 'error');
    }
  };

  const irAlPanel = () => {
    setSubTab('consolidado');
    setPanelAbierto(true);
  };

  const handleLimpiarFichasArea = async () => {
    if (!window.confirm(`¿Está seguro de ELIMINAR TODAS las evaluaciones registradas para ${area?.nombre || areaId} — Categoría ${categoria}?\n\nEsta acción dejará todas las fichas completamente en blanco para la evaluación oficial.`)) return;

    try {
      const borrados = await limpiarEvaluacionesCategoriaArea(categoria, areaId);
      addToast(`Se eliminaron ${borrados} evaluaciones de prueba. Fichas dejadas en blanco.`, 'info');
    } catch (err) {
      addToast(`Error al limpiar evaluaciones: ${err.message}`, 'error');
    }
  };

  /* ── Render ── */

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.tipo}`}>{t.msg}</div>)}
      </div>

      {/* Encabezado principal del módulo con gradiente oscuro institucional */}
      <div style={{
        background: 'linear-gradient(135deg, #0C1929 0%, #1A2E4C 50%, #10213A 100%)',
        border: '1px solid #334155',
        borderLeft: '6px solid #16A34A',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 20,
        boxShadow: '0 4px 16px rgba(12,25,41,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="/logo-eureka.png"
              alt="Logo Eureka 2026"
              style={{ height: 58, width: 'auto', objectFit: 'contain', background: '#FFFFFF', padding: 5, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            />
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 21, color: '#FFFFFF', margin: 0, letterSpacing: 0.5 }}>
                {EUREKA_CONFIG.edicion}
              </h2>
              <div style={{ fontSize: 12, color: '#FDE047', fontWeight: 700, marginTop: 4, letterSpacing: 0.5 }}>
                ETAPA {EUREKA_CONFIG.etapa} · {EUREKA_CONFIG.ugel} · {EUREKA_CONFIG.dre} · EDICIÓN {EUREKA_CONFIG.anio}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                R.V.M. N.° 097-2024-MINEDU · Comisión Organizadora AGEBATP UGEL 03
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowBases(b => !b)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FDE047',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Disposiciones de las Bases 2026 {showBases ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Panel Plegable de Disposiciones Oficiales */}
        {showBases && (
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 14, marginTop: 14, fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#FDE047', marginBottom: 6 }}>LINEAMIENTOS OFICIALES DE EVALUACIÓN (R.V.M. N.° 097-2024-MINEDU):</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><strong>Categorías:</strong> Categoría A (1.° y 2.° Primaria), B (3.° y 4.° Primaria), C (5.° y 6.° Primaria), D (1.° y 2.° Secundaria), E (3.°, 4.° y 5.° Secundaria).</li>
              <li><strong>Áreas de Secundaria (Cat. D y E):</strong> Indagación Científica (Experimental y Descriptiva), Alternativa de Solución Tecnológica e Indagación Cualitativa.</li>
              <li><strong>Jurado Calificador:</strong> Cada proyecto es evaluado por una terna de 3 jurados oficiales. Las calificaciones se registran en los Anexos E11 a E18 y se consolidan en el Anexo E19 y Acta Oficial E20.</li>
              <li><strong>Exposición:</strong> Tiempo máximo de exposición presencial de 15 minutos por proyecto, seguido de preguntas del jurado.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Barra de sub-pestañas estilo Juegos Florales */}
      <div style={{ display: 'flex', background: '#FFFFFF', borderBottom: '2px solid #D6DCE8', overflowX: 'auto', marginBottom: 20 }}>
        {SUB_PESTANAS.map(tab => {
          const activo = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSubTab(tab.id);
                setSeleccionado(null);
              }}
              style={{
                padding: '12px 22px',
                fontSize: 13,
                fontWeight: 700,
                color: activo ? '#FFFFFF' : '#64748B',
                background: activo ? '#1B3A5C' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name={tab.icon} size={15} color={activo ? '#FFFFFF' : '#64748B'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido de sub-pestañas */}
      <div>
        {!integridad.ok && (
          <div style={{ ...aviso('error'), marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Error de integridad en las rúbricas oficiales. No emita documentos hasta corregirlo.
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {integridad.errores.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {progreso && (
          <div style={{ ...aviso('info'), marginBottom: 16 }}>
            {progreso.etiqueta}: {progreso.hechas} de {progreso.total} procesadas.
          </div>
        )}

        <EKBannerPanelPendiente panel={panel} onAbrirPanel={irAlPanel} />

        {subTab === 'padron' && (
          <EKPadronTab
            categoria={categoria}
            areaId={areaId}
            participantes={participantes}
            usuario={user}
            esStaff={esStaff}
            onToast={addToast}
            onSeleccionar={p => { setSeleccionado(p); setSubTab('fichas'); }}
          />
        )}

        {subTab === 'programacion' && (
          <EKProgramacionTab
            categoria={categoria}
            areaId={areaId}
            participantes={participantes}
            usuario={user}
            esStaff={esStaff}
            onToast={addToast}
          />
        )}

        {/* SUB-PESTAÑA: FICHAS DE EVALUACIÓN */}
        {subTab === 'fichas' && (
          <div>
            {!seleccionado ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                {/* Selectores de Categoría, Área y Etapa idénticos a Juegos Florales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, background: '#F8FAFC', border: '1px solid #D6DCE8', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>CATEGORÍA HABILITADA</label>
                    <select
                      value={categoria}
                      onChange={e => { setCategoria(e.target.value); setSeleccionado(null); }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #D6DCE8', fontSize: 13, fontWeight: 700, color: '#122240', background: '#FFFFFF' }}
                    >
                      {CATEGORIAS.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} — {c.grados}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>ÁREA DE PARTICIPACIÓN</label>
                    <select
                      value={areaId}
                      onChange={e => { setAreaId(e.target.value); setSeleccionado(null); }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #D6DCE8', fontSize: 13, fontWeight: 700, color: '#122240', background: '#FFFFFF' }}
                    >
                      {areasDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>ETAPA</label>
                    <input
                      type="text"
                      readOnly
                      value="UGEL"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #D6DCE8', background: '#F1F5F9', fontSize: 13, fontWeight: 700, color: '#122240' }}
                    />
                  </div>
                </div>

                {/* Barra de Acciones de la Bandeja */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#122240' }}>
                    Participantes de {area?.nombre || areaId} — {cat?.nombre || categoria} ({participantes.length})
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (participantes.length > 0) setSeleccionado(participantes[0]);
                      }}
                      disabled={participantes.length === 0}
                      style={{
                        background: participantes.length > 0 ? '#1B3A5C' : '#64748B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: participantes.length > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Icon name="play" size={14} /> Iniciar evaluación del área
                    </button>

                    <button
                      type="button"
                      onClick={handleLimpiarFichasArea}
                      style={{ background: '#FFF1F2', color: '#B91C1C', border: '1px solid #FECDD3', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Limpiar fichas de prueba de esta categoría y área"
                    >
                      Limpiar Fichas
                    </button>

                    <button
                      type="button"
                      onClick={descargarFichasCategoriaArea}
                      disabled={cargando.fichasArea}
                      style={{ background: '#1B3A5C', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Icon name="download" size={14} /> {cargando.fichasArea ? 'Generando...' : 'Fichas Área (PDF)'}
                    </button>

                    <button
                      type="button"
                      onClick={descargarFichasCategoria}
                      disabled={cargando.fichasCategoria}
                      style={{
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        border: '1px solid #3B82F6',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: cargando.fichasCategoria ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
                      }}
                      title="Descargar PDF consolidando todas las fichas de esta categoría"
                    >
                      <Icon name="download" size={14} />
                      {cargando.fichasCategoria ? 'Generando...' : `Descargar Toda la Cat. ${categoria} (PDF)`}
                    </button>

                    <button
                      type="button"
                      onClick={descargarPaqueteLegal}
                      disabled={cargando.paquete}
                      style={{
                        background: 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)',
                        color: '#FFFFFF',
                        border: '1px solid #6366F1',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: cargando.paquete ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)'
                      }}
                      title="Compilar expediente oficial de la categoría con fichas, consolidados E19 y actas E20"
                    >
                      <Icon name="shield" size={14} />
                      {cargando.paquete ? 'Compilando...' : 'Paquete Legal Completo (PDF)'}
                    </button>

                    {esStaff && (
                      <button
                        type="button"
                        onClick={() => setSubTab('padron')}
                        style={{ background: '#F1F5F9', color: '#122240', border: '1px solid #D6DCE8', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="upload" size={14} /> Padrón SICE
                      </button>
                    )}

                    {esStaff && (
                      <button
                        type="button"
                        onClick={() => setSubTab('padron')}
                        style={{ background: '#CA8A04', color: '#0C1929', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="plus" size={14} /> + Registrar Proyecto
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Tarjetas Completas de Participantes */}
                <EKSelectorParticipante
                  participantes={participantes}
                  evaluaciones={evaluacionesValidas}
                  seleccionado={seleccionado}
                  onSeleccionar={setSeleccionado}
                  onMarcarNoPresentado={esStaff ? marcarNoPresentado : null}
                  categoria={categoria}
                  areaId={areaId}
                  numeroJuradoActivo={numeroJurado}
                />
              </div>
            ) : (
              /* Vista de Evaluación Individual cuando se selecciona un proyecto */
              <div>
                <div style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  background: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: 8,
                  border: '1px solid #D6DCE8',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setSeleccionado(null)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D6DCE8',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#122240'
                      }}
                    >
                      <Icon name="arrowLeft" size={14} /> Volver a la lista de proyectos
                    </button>
                    <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                      Evaluando proyecto {indiceSeleccionado + 1} de {participantes.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {irAnterior && (
                      <button
                        type="button"
                        onClick={irAnterior}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #D6DCE8',
                          borderRadius: 6,
                          padding: '8px 14px',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#122240'
                        }}
                      >
                        <Icon name="arrowLeft" size={13} /> Anterior
                      </button>
                    )}
                    {irSiguiente && (
                      <button
                        type="button"
                        onClick={irSiguiente}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #D6DCE8',
                          borderRadius: 6,
                          padding: '8px 14px',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#122240'
                        }}
                      >
                        Siguiente <Icon name="arrowRight" size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <EKFichaEvaluacion
                  participante={seleccionado}
                  evaluacionInicial={evaluacionActual}
                  numeroJurado={numeroJurado}
                  onCambiarJurado={setNumeroJurado}
                  categoria={categoria}
                  areaId={areaId}
                  panel={panel}
                  usuario={user}
                  soloLectura={fichaBloqueada}
                  motivoBloqueo={motivoBloqueo}
                  onToast={addToast}
                  onIrAlPanel={irAlPanel}
                  onVolver={() => setSeleccionado(null)}
                  onAnterior={irAnterior}
                  onSiguiente={irSiguiente}
                />
              </div>
            )}
          </div>
        )}

        {subTab === 'consolidado' && (
          <EKConsolidadoE19
            categoria={categoria}
            areaId={areaId}
            participantes={participantes}
            evaluaciones={evaluacionesValidas}
            consolidadoGuardado={consolidadoGuardado}
            panel={panel}
            panelesMap={panelesMap}
            usuario={user}
            esStaff={esStaff}
            onAbrirPanel={() => setPanelAbierto(true)}
            onToast={addToast}
          />
        )}

        {subTab === 'acta' && (
          <EKActaE20
            categoria={categoria}
            areaId={areaId}
            participantes={participantes}
            evaluaciones={evaluacionesValidas}
            actaGuardada={actaGuardada}
            panel={panel}
            panelesMap={panelesMap}
            usuario={user}
            esStaff={esStaff}
            onAbrirPanel={() => setPanelAbierto(true)}
            onToast={addToast}
          />
        )}
      </div>

      <EKPanelFirmasOficial
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        panelesMap={panelesMap}
        categoria={categoria}
        areaId={areaId}
        evaluacionesDelAlcance={evaluacionesValidas}
        participantesDelAlcance={participantes}
        usuario={user}
        esAdministrador={esAdministrador}
        onToast={addToast}
      />
    </div>
  );
}

function BotonDescarga({ etiqueta, cargando, onClick, destacado }) {
  const estilo = destacado
    ? btn('dorado', { padding: '7px 13px', fontSize: 11.5 })
    : btn('secundario', { padding: '7px 13px', fontSize: 11.5 });
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      style={cargando ? btnDeshabilitado(estilo) : estilo}
    >
      <Icon name={cargando ? 'refresh' : 'download'} size={12} />
      {cargando ? 'Generando...' : etiqueta}
    </button>
  );
}
