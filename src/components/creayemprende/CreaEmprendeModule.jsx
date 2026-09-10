import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso } from './cyeEstilos';
import {
  CYE_CONFIG, CATEGORIAS_CYE, DISPOSICIONES_BASES_CYE, SLOTS_JURADO,
  consolidadoIdCYE, categoriasDeGrupo, getCategoriaCYE, gruposDeCategoria
} from '../../data/creaEmprendeConfig';
import { assertRubricasIntegrasCYE } from '../../data/creaEmprendeRubricas';
import { PROYECTOS_SICE_CYE } from '../../data/creaEmprendePadronSICE';
import { descomponerCredencialCYE, getJuradoCYEPorCorreo } from '../../data/creaEmprendeJurados';
import {
  construirParticipantesCYE, esEvaluable, filtrarEvaluacionesValidasCYE, construirD13, construirD14,
  construirResultadosD15, casilleroPlanificado, descansaEnRotacion, acuerdosParaCategoria,
  ordenarEvaluacionesParaCompilacion
} from '../../utils/creaEmprendeHelpers';
import { resolverPanelFirmasCYE, esPreliminarCYE } from '../../utils/creaEmprendeFirmas';
import {
  subscribeCYEParticipantes, subscribeCYEProyectoEstado, subscribeCYEEvaluaciones, subscribeCYEPaneles,
  subscribeCYEConsolidados, subscribeCYEActas, subscribeCYEJurados, subscribeCYECalibracionConfig,
  subscribeCYECalibracionFichas, limpiarEvaluacionesCategoriaCYE, deleteCYEEvaluacion,
  saveCYEEvaluacion, actualizarEstadoProyectoCYE
} from '../../firebase/dbCreaEmprende';
import { obtenerMembreteCYE } from '../../pdf/membreteCreaEmprende';
import { generarFichasCYEPDF } from '../../pdf/generarFichaCYEPDF';
import { generarPaqueteLegalCYEPDF } from '../../pdf/generarDocumentosCYEPDF';

import CYESelectorProyecto from './CYESelectorProyecto';
import CYEFichaEvaluacion from './CYEFichaEvaluacion';
import CYECalibracion from './CYECalibracion';
import CYEConsolidadoD13 from './CYEConsolidadoD13';
import CYEConsolidadoD14 from './CYEConsolidadoD14';
import CYEActaD15 from './CYEActaD15';
import CYEPadronAdmision from './CYEPadronAdmision';
import CYEPanelFirmasOficial from './CYEPanelFirmasOficial';

const SUB_PESTANAS = [
  { id: 'fichas', label: 'Fichas de evaluación', icon: 'clipboard' },
  { id: 'calibracion', label: 'Calibración', icon: 'users' },
  { id: 'd13', label: 'Anexo D13 — Por jurado', icon: 'list', soloComision: true },
  { id: 'd14', label: 'Anexo D14 — Consolidado', icon: 'fileText', soloComision: true },
  { id: 'd15', label: 'Anexo D15 — Acta', icon: 'check', soloComision: true },
  { id: 'padron', label: 'Padrón y admisión', icon: 'shield', soloComision: true }
];

const CLASE_TOAST = { success: 'success', error: 'error', info: 'info' };

/**
 * CONCURSO NACIONAL CREA Y EMPRENDE 2026 — Etapa UGEL 03.
 * Contenedor del módulo: mismo encabezado, barra de subpestañas y bandeja de Juegos Florales;
 * panel de firmas y descargas masivas de Eureka.
 */
export default function CreaEmprendeModule() {
  const { user, isRole } = useAuth();
  const esAdmin = isRole('admin');
  const esStaff = esAdmin || isRole('jefatura') || isRole('personal');

  const [subTab, setSubTab] = useState('fichas');
  const [mostrarBases, setMostrarBases] = useState(false);
  const [importados, setImportados] = useState([]);
  const [estados, setEstados] = useState({});
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [paneles, setPaneles] = useState({});
  const [consolidados, setConsolidados] = useState({});
  const [actas, setActas] = useState({});
  const [juradosFS, setJuradosFS] = useState([]);
  const [calConfig, setCalConfig] = useState(null);
  const [calFichas, setCalFichas] = useState([]);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [numeroJurado, setNumeroJurado] = useState(1);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const [toasts, setToasts] = useState([]);
  const [progreso, setProgreso] = useState(null);
  const [cargando, setCargando] = useState({});

  const addToast = useCallback((msg, tipo = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  /* ── Identidad del jurado ── */
  const credencial = useMemo(() => descomponerCredencialCYE(user?.email), [user?.email]);
  const juradoPadron = useMemo(() => getJuradoCYEPorCorreo(user?.email, juradosFS), [user?.email, juradosFS]);
  const esJuradoCYE = !esStaff && Boolean(credencial || user?.modulo === 'creayemprende');
  const grupoSesion = Number(user?.grupo || juradoPadron?.grupo || credencial?.grupo) || null;
  const numeroCredencial = Number(user?.numeroCredencial || juradoPadron?.numeroCredencial || credencial?.numeroCredencial) || null;
  const categoriasSesion = useMemo(() => {
    if (!esJuradoCYE) return CATEGORIAS_CYE.map(c => c.id);
    const lista = user?.categoriasCYE || juradoPadron?.categorias || categoriasDeGrupo(grupoSesion);
    return lista && lista.length ? lista : ['A'];
  }, [esJuradoCYE, user?.categoriasCYE, juradoPadron, grupoSesion]);

  const [categoria, setCategoria] = useState(() => categoriasSesion[0] || 'A');
  useEffect(() => {
    if (!categoriasSesion.includes(categoria)) setCategoria(categoriasSesion[0]);
  }, [categoriasSesion, categoria]);

  /* ── Suscripciones en tiempo real ── */
  useEffect(() => {
    const bajas = [
      subscribeCYEParticipantes(setImportados),
      subscribeCYEProyectoEstado(setEstados),
      subscribeCYEEvaluaciones({}, setEvaluaciones),
      subscribeCYEPaneles(setPaneles),
      subscribeCYEConsolidados(setConsolidados),
      subscribeCYEActas(setActas),
      subscribeCYEJurados(setJuradosFS),
      subscribeCYECalibracionConfig(setCalConfig),
      subscribeCYECalibracionFichas(setCalFichas)
    ];
    return () => bajas.forEach(baja => { if (typeof baja === 'function') baja(); });
  }, []);

  /* ── Datos derivados ── */
  const integridad = useMemo(() => assertRubricasIntegrasCYE(), []);
  const participantes = useMemo(
    () => construirParticipantesCYE({ semilla: PROYECTOS_SICE_CYE, importados, estados }),
    [importados, estados]
  );
  const evaluables = useMemo(() => participantes.filter(esEvaluable), [participantes]);
  const evaluacionesValidas = useMemo(() => filtrarEvaluacionesValidasCYE(evaluaciones, evaluables), [evaluaciones, evaluables]);
  const evaluablesCategoria = useMemo(() => evaluables.filter(p => p.categoria === categoria), [evaluables, categoria]);
  const evaluacionesCategoria = useMemo(() => evaluacionesValidas.filter(e => e.categoria === categoria), [evaluacionesValidas, categoria]);

  const grupoVista = esJuradoCYE && CYE_CONFIG.filtrarProyectosPorGrupo
    ? grupoSesion
    : (filtroGrupo === 'todos' ? null : Number(filtroGrupo));
  const proyectosVista = useMemo(
    () => evaluablesCategoria.filter(p => !grupoVista || p.grupo === grupoVista),
    [evaluablesCategoria, grupoVista]
  );

  const seleccionado = useMemo(() => evaluables.find(p => p.id === seleccionadoId) || null, [evaluables, seleccionadoId]);
  const indice = seleccionado ? proyectosVista.findIndex(p => p.id === seleccionado.id) : -1;

  const panel = useMemo(() => resolverPanelFirmasCYE(paneles, { categoria }), [paneles, categoria]);
  const bloqueadoPorSellado = !esPreliminarCYE(panel) && !esAdmin;
  const idDocumento = consolidadoIdCYE(categoria);
  const consolidado = consolidados[idDocumento] || null;
  const acta = actas[idDocumento] || null;
  const acuerdos = useMemo(() => acuerdosParaCategoria(calConfig, categoria), [calConfig, categoria]);

  /* ── Casillero que corresponde al abrir un proyecto ── */
  const casilleroPorDefecto = useCallback((p) => {
    const evs = evaluacionesValidas.filter(e => e.participanteId === p.id);
    const propio = evs.find(e => e.evaluadorOperativo?.uid && e.evaluadorOperativo.uid === user?.uid);
    if (propio) return Number(propio.jurado.numeroJurado);
    const ocupados = new Set(evs
      .filter(e => e.evaluadorOperativo?.uid && e.evaluadorOperativo.uid !== user?.uid)
      .map(e => Number(e.jurado.numeroJurado)));
    if (esJuradoCYE) {
      const plan = casilleroPlanificado(p, numeroCredencial);
      if (plan && !ocupados.has(plan)) return plan;
    }
    return SLOTS_JURADO.find(s => !ocupados.has(s)) || 1;
  }, [evaluacionesValidas, user?.uid, esJuradoCYE, numeroCredencial]);

  const abrirProyecto = (p) => {
    setSeleccionadoId(p.id);
    setNumeroJurado(casilleroPorDefecto(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const notaRotacion = seleccionado && esJuradoCYE && descansaEnRotacion(seleccionado, numeroCredencial)
    ? `Según la rotación del Grupo ${seleccionado.grupo}, en este proyecto le corresponde descansar. Si falta un integrante del grupo, puede ocupar el casillero libre.`
    : null;

  /* ── Descargas masivas (comisión) ── */
  const marcar = (clave, valor) => setCargando(prev => ({ ...prev, [clave]: valor }));

  const descargarFichasCategoria = async () => {
    const evs = ordenarEvaluacionesParaCompilacion(evaluacionesCategoria, evaluables);
    if (evs.length === 0) { addToast('Aún no hay fichas en esta categoría.', 'info'); return; }
    try {
      marcar('fichas', true);
      const banner = await obtenerMembreteCYE();
      await generarFichasCYEPDF(evs, {
        categoria, participantes: evaluables, panelesMap: paneles, banner,
        onProgreso: (hechas, total) => setProgreso({ hechas, total, etiqueta: 'Fichas' })
      });
      addToast(`${evs.length} fichas generadas.`, 'success');
    } catch (err) {
      addToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      marcar('fichas', false);
      setProgreso(null);
    }
  };

  const descargarPaqueteLegal = async () => {
    try {
      marcar('paquete', true);
      const banner = await obtenerMembreteCYE();
      const filasD14 = consolidado?.estado === 'cerrado' && Array.isArray(consolidado.filas)
        ? consolidado.filas
        : construirD14(evaluablesCategoria, evaluacionesCategoria, { dirimencia: consolidado?.dirimencia });
      const res = await generarPaqueteLegalCYEPDF({
        categoria,
        participantes: evaluables,
        evaluaciones: ordenarEvaluacionesParaCompilacion(evaluacionesCategoria, evaluables),
        filasD14,
        filasD13PorSlot: Object.fromEntries(SLOTS_JURADO.map(s => [s, construirD13(evaluablesCategoria, evaluacionesCategoria, s)])),
        resultados: construirResultadosD15(filasD14),
        acta,
        criterioDesempate: filasD14.some(f => f.dirimido && f.puesto <= 3) ? (consolidado?.dirimencia?.criterio || '') : '',
        panel,
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

  const handleLimpiarFichasCategoria = async () => {
    if (!esStaff) return;
    if (!window.confirm(`¿Está seguro de ELIMINAR TODAS las evaluaciones registradas en la Categoría ${categoria}?\n\nEsta acción dejará todas las fichas completamente en blanco para la evaluación oficial.`)) return;

    try {
      marcar('limpiando', true);
      const borrados = await limpiarEvaluacionesCategoriaCYE(categoria);
      addToast(`Se eliminaron ${borrados} evaluaciones de prueba. Fichas de la Categoría ${categoria} dejadas en blanco.`, 'info');
    } catch (err) {
      addToast(`Error al limpiar evaluaciones: ${err.message}`, 'error');
    } finally {
      marcar('limpiando', false);
    }
  };

  const handleLimpiarFichaItem = async (p, ev) => {
    const inst = p.institucion?.nombre || 'la I. E.';
    if (!window.confirm(`¿Está seguro de limpiar la ficha de "${inst}"?\n\nSe restablecerán los puntajes y se eliminará la evaluación del casillero.`)) return;

    try {
      if (ev?.id) {
        await deleteCYEEvaluacion(ev.id);
      }
      if (p.noSePresento) {
        await actualizarEstadoProyectoCYE(p.id, { noSePresento: false }, user, {
          accion: 'restablecer',
          motivo: 'Ficha limpiada desde el listado'
        });
      }
      addToast(`Ficha de "${inst}" restablecida en blanco.`, 'info');
    } catch (err) {
      addToast(`Error al limpiar ficha: ${err.message}`, 'error');
    }
  };

  const handleMarcarNSPItem = async (p) => {
    const inst = p.institucion?.nombre || 'la I. E.';
    if (!window.confirm(`¿Confirmar INCOMPARECENCIA (NSP) para la I. E. "${inst}"?\n\nEl proyecto quedará registrado con 0 puntos / incomparecencia.`)) return;

    try {
      const slot = casilleroPorDefecto(p);
      const obsNSP = 'INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN';
      const payload = {
        participanteId: p.id,
        categoria: p.categoria || categoria,
        jurado: { numeroJurado: slot },
        participanteSnapshot: {
          id: p.id,
          numero: p.numero || null,
          institucionNombre: inst,
          codigoModular: p.institucion?.codigoModular || '',
          tituloProyecto: p.tituloProyecto || '',
          gradoSeccion: resumenGradoSeccion(p.integrantes),
          grupo: p.grupo || null
        },
        puntajes: { D10: {}, D11: {}, D12: {} },
        subtotales: { D10: 0, D11: 0, D12: 0 },
        puntajeTotal: 0,
        puntajeMaximo: 100,
        anexosCompletos: 0,
        completa: false,
        observacionesJurado: obsNSP,
        fecha: CYE_CONFIG.fechaEvaluacion,
        estado: 'registrada',
        incomparecencia: true,
        noSePresento: true
      };

      await saveCYEEvaluacion(payload, { usuario: user, esStaff, accion: 'incomparecencia' });
      await actualizarEstadoProyectoCYE(p.id, { noSePresento: true }, user, {
        accion: 'inasistencia',
        motivo: 'Incomparecencia a la Expoferia'
      });
      addToast(`I. E. "${inst}" registrada con Incomparecencia (NSP).`, 'warning');
    } catch (err) {
      addToast(`Error al marcar incomparecencia: ${err.message}`, 'error');
    }
  };

  const cat = getCategoriaCYE(categoria);
  const pestanas = SUB_PESTANAS.filter(t => !t.soloComision || esStaff);

  const selectorCategoria = (
    <select
      value={categoria}
      onChange={e => { setCategoria(e.target.value); setSeleccionadoId(null); setFiltroGrupo('todos'); }}
      style={{ ...S.input, fontWeight: 700 }}
    >
      {CATEGORIAS_CYE.filter(c => categoriasSesion.includes(c.id)).map(c => (
        <option key={c.id} value={c.id}>{c.nombre} — {c.grados}</option>
      ))}
    </select>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${CLASE_TOAST[t.tipo] || 'info'}`}>{t.msg}</div>)}
      </div>

      {/* Encabezado del módulo */}
      <div style={{ background: C.navy2, color: C.white, borderRadius: '8px 8px 0 0', padding: '16px 24px', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: FUENTES.serif, fontSize: 22, margin: 0, letterSpacing: 0.3, fontWeight: 400 }}>
              Concurso Nacional Crea y Emprende 2026
            </h1>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>
              Etapa UGEL 03 · Evaluación: 16 de setiembre · Bases Específicas 2026, Anexo D
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
              {DISPOSICIONES_BASES_CYE.map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Barra de subpestañas */}
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
            <strong>Error de integridad en las rúbricas. No emita documentos hasta corregirlo.</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{integridad.errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}
        {progreso && (
          <div style={{ ...aviso('info'), marginBottom: 14 }}>{progreso.etiqueta}: {progreso.hechas} de {progreso.total} procesadas.</div>
        )}

        {/* ───── FICHAS DE EVALUACIÓN ───── */}
        {subTab === 'fichas' && !seleccionado && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 'clamp(12px, 3vw, 24px)', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div>
                <label style={S.etiqueta}>Categoría habilitada</label>
                {selectorCategoria}
              </div>
              <div>
                <label style={S.etiqueta}>Grupo de jurados</label>
                {esJuradoCYE ? (
                  <input readOnly value={grupoSesion ? `Grupo ${grupoSesion}` : 'Sin grupo'} style={{ ...S.input, background: C.g100, fontWeight: 700 }} />
                ) : (
                  <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} style={{ ...S.input, fontWeight: 700 }}>
                    <option value="todos">Todos los grupos</option>
                    {gruposDeCategoria(categoria).map(g => <option key={g} value={g}>Grupo {g}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={S.etiqueta}>Etapa</label>
                <input readOnly value="UGEL" style={{ ...S.input, background: C.g100, fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>
                Proyectos de la {cat?.nombre}{grupoVista ? ` — Grupo ${grupoVista}` : ''} ({proyectosVista.length})
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { if (proyectosVista[0]) abrirProyecto(proyectosVista[0]); }}
                  disabled={proyectosVista.length === 0}
                  style={proyectosVista.length ? btn('primario') : btnDeshabilitado(btn('primario'))}
                >
                  <Icon name="play" size={13} color={C.white} /> Iniciar evaluación
                </button>
                {esStaff && (
                  <button
                    type="button"
                    onClick={handleLimpiarFichasCategoria}
                    disabled={cargando.limpiando}
                    style={{
                      background: '#FFF1F2', color: '#B91C1C', border: '1px solid #FECDD3',
                      borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                    title={`Limpiar todas las evaluaciones de prueba registradas en la Categoría ${categoria}`}
                  >
                    <Icon name="trash" size={13} color="#B91C1C" /> Limpiar Fichas
                  </button>
                )}
                {esStaff && (
                  <button type="button" onClick={descargarFichasCategoria} disabled={cargando.fichas} style={cargando.fichas ? btnDeshabilitado(btn('real')) : btn('real')}>
                    <Icon name="download" size={13} color={C.white} /> {cargando.fichas ? 'Generando...' : `Fichas de la Cat. ${categoria} (PDF)`}
                  </button>
                )}
                {esStaff && (
                  <button type="button" onClick={descargarPaqueteLegal} disabled={cargando.paquete} style={cargando.paquete ? btnDeshabilitado(btn('indigo')) : btn('indigo')}>
                    <Icon name="shield" size={13} color={C.white} /> {cargando.paquete ? 'Compilando...' : 'Paquete legal completo (PDF)'}
                  </button>
                )}
              </div>
            </div>

            <CYESelectorProyecto
              participantes={proyectosVista}
              evaluaciones={evaluacionesCategoria}
              numeroJuradoActivo={esJuradoCYE && numeroCredencial && numeroCredencial <= 3 ? numeroCredencial : numeroJurado}
              onSeleccionar={abrirProyecto}
              esStaff={esStaff}
              onLimpiarFicha={handleLimpiarFichaItem}
              onMarcarNSP={handleMarcarNSPItem}
            />
          </div>
        )}

        {subTab === 'fichas' && seleccionado && (
          <div>
            <div style={{ ...S.tarjeta, marginBottom: 14, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSeleccionadoId(null)} style={btn('secundario')}>
                  <Icon name="arrowLeft" size={14} /> Volver a la lista
                </button>
                {indice >= 0 && (
                  <span style={{ fontSize: 12.5, color: C.g500, fontWeight: 600 }}>Proyecto {indice + 1} de {proyectosVista.length}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {indice > 0 && (
                  <button type="button" onClick={() => abrirProyecto(proyectosVista[indice - 1])} style={btn('secundario')}>
                    <Icon name="arrowLeft" size={13} /> Anterior
                  </button>
                )}
                {indice >= 0 && indice < proyectosVista.length - 1 && (
                  <button type="button" onClick={() => abrirProyecto(proyectosVista[indice + 1])} style={btn('secundario')}>
                    Siguiente <Icon name="arrowRight" size={13} />
                  </button>
                )}
              </div>
            </div>

            <CYEFichaEvaluacion
              participante={seleccionado}
              numeroJurado={numeroJurado}
              onCambiarJurado={setNumeroJurado}
              evaluacionesProyecto={evaluacionesValidas.filter(e => e.participanteId === seleccionado.id)}
              panel={panel}
              usuario={user}
              esStaff={esStaff}
              bloqueadoPorSellado={bloqueadoPorSellado}
              onToast={addToast}
              onIrAlPanel={esStaff ? () => setPanelAbierto(true) : null}
              acuerdos={acuerdos}
              notaRotacion={notaRotacion}
            />
          </div>
        )}

        {/* ───── CALIBRACIÓN ───── */}
        {subTab === 'calibracion' && (
          <CYECalibracion
            participantes={participantes}
            fichas={calFichas}
            config={calConfig}
            usuario={user}
            esStaff={esStaff}
            categoriasSesion={categoriasSesion}
            juradosFirestore={juradosFS}
            onToast={addToast}
          />
        )}

        {/* ───── FORMATOS D13, D14 Y D15 ───── */}
        {['d13', 'd14', 'd15'].includes(subTab) && (
          <div style={{ ...S.seccion, marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 260, flex: '0 1 420px' }}>
              <label style={S.etiqueta}>Categoría</label>
              {selectorCategoria}
            </div>
          </div>
        )}

        {subTab === 'd13' && (
          <CYEConsolidadoD13
            categoria={categoria}
            participantes={evaluablesCategoria}
            evaluaciones={evaluacionesCategoria}
            panel={panel}
            esStaff={esStaff}
            onAbrirPanel={() => setPanelAbierto(true)}
            onToast={addToast}
          />
        )}

        {subTab === 'd14' && (
          <CYEConsolidadoD14
            categoria={categoria}
            participantes={evaluablesCategoria}
            evaluaciones={evaluacionesCategoria}
            consolidado={consolidado}
            panel={panel}
            usuario={user}
            esStaff={esStaff}
            esAdmin={esAdmin}
            onAbrirPanel={() => setPanelAbierto(true)}
            onToast={addToast}
          />
        )}

        {subTab === 'd15' && (
          <CYEActaD15
            categoria={categoria}
            participantes={evaluablesCategoria}
            evaluaciones={evaluacionesCategoria}
            consolidado={consolidado}
            acta={acta}
            panel={panel}
            usuario={user}
            esStaff={esStaff}
            onAbrirPanel={() => setPanelAbierto(true)}
            onToast={addToast}
          />
        )}

        {/* ───── PADRÓN Y ADMISIÓN (solo comisión) ───── */}
        {subTab === 'padron' && esStaff && (
          <CYEPadronAdmision
            participantes={participantes}
            evaluaciones={evaluacionesValidas}
            usuario={user}
            onToast={addToast}
          />
        )}
      </div>

      <CYEPanelFirmasOficial
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        panelesMap={paneles}
        categoria={categoria}
        evaluaciones={evaluacionesValidas}
        participantes={evaluables}
        juradosFirestore={juradosFS}
        usuario={user}
        esStaff={esStaff}
        esAdministrador={esAdmin}
        onToast={addToast}
      />
    </div>
  );
}
