import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { DISCIPLINAS_UGEL03, getCategoriasHabilitadas, NOTAS_COMUNICADO_01, getDisciplinaUGEL03 } from '../data/juegosFloralesUGEL03';
import { construirBloqueJurado, getJuradosDeDisciplina } from '../data/juegosFloralesCredenciales';
import { PARTICIPANTES_SICE, getParticipantes } from '../data/juegosFloralesPadronSICE';
import { C } from '../data/juegosFloralesCatalogos';
import {
  subscribeJFParticipantes,
  subscribeJFEvaluaciones,
  addJFParticipante,
  deleteJFParticipante,
  sortearOrdenPresentacion,
  getJFEvaluacion,
  saveJFEvaluacion,
  deleteJFEvaluacion,
  deleteJFConsolidado,
  deleteJFActa,
  reabrirJFEvaluacion,
  limpiarEvaluacionesCategoria,
  limpiarEvaluacionesHuerfanas,
  batchImportarPadronSICE
} from '../firebase/dbJuegosFlorales';
import { parsearExcelSICE, filtrarEvaluacionesValidas } from '../utils/juegosFloralesHelpers';
import { getRubrica } from '../data/juegosFloralesRubricas';
import { generarTodasFichasJFPDF } from '../pdf/generarFichaJFPDF';
import { loadImageDataURL } from '../pdf/membrete';
import JFFichaEvaluacion from './JFFichaEvaluacion';
import JFConsolidadoA10 from './JFConsolidadoA10';
import JFActaA11 from './JFActaA11';
import JFProgramacionTab from './JFProgramacionTab';
import Icon from './Icon';

export default function JuegosFloralesModule() {
  const { user, isRole } = useAuth();

  const userJuradoNum = useMemo(() => {
    if (user?.numeroJurado) return parseInt(user.numeroJurado, 10);
    const match = user?.email?.match(/jurado\w*?(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }, [user]);

  const isUserJurado = isRole('jurado') || Boolean(user?.disciplinaId) || Boolean(userJuradoNum);

  // Sub-pestañas: 'fichas' | 'a10' | 'a11' | 'programacion'
  const [subTab, setSubTab] = useState('fichas');

  // Header Comunicado 01 desplegable
  const [showComunicado, setShowComunicado] = useState(false);

  // Filtros de sub-pestaña Fichas
  const [disciplinaId, setDisciplinaId] = useState("teatro");
  const categoriasHabilitadas = useMemo(() => getCategoriasHabilitadas(disciplinaId), [disciplinaId]);
  const [categoria, setCategoria] = useState(categoriasHabilitadas[0] || "D");

  useEffect(() => {
    const cats = getCategoriasHabilitadas(disciplinaId);
    if (cats.length > 0 && !cats.includes(categoria)) {
      setCategoria(cats[0]);
    }
  }, [disciplinaId]);

  const discInfo = useMemo(() => getDisciplinaUGEL03(disciplinaId), [disciplinaId]);

  // Preset disciplina if logged in jurado has assigned discipline
  useEffect(() => {
    if (user?.disciplinaId) {
      setDisciplinaId(user.disciplinaId);
    }
  }, [user]);

  // Evaluaciones y Participantes en vivo de Firestore
  const [fsParticipantes, setFsParticipantes] = useState([]);
  const [fsEvaluaciones, setFsEvaluaciones] = useState([]);
  const [selectedParticipante, setSelectedParticipante] = useState(null);
  const [evaluacionActual, setEvaluacionActual] = useState(null);

  // MODO RÁPIDO DE EVALUACIÓN CONTINUA
  const [modoRapido, setModoRapido] = useState(false);
  const [rapidoIndex, setRapidoIndex] = useState(0);

  // Subscripción a participantes y evaluaciones de Firestore
  useEffect(() => {
    const unSubP = subscribeJFParticipantes({ disciplinaId, categoria, etapa: "UGEL" }, (list) => {
      setFsParticipantes(list);
    });
    const unSubE = subscribeJFEvaluaciones({ disciplinaId, categoria }, (evals) => {
      setFsEvaluaciones(evals);
    });
    return () => {
      unSubP();
      unSubE();
    };
  }, [disciplinaId, categoria]);

  // Lista Pre-Cargada Nativamente (Padrón SICE Local + Adicionales de Firestore)
  const participantes = useMemo(() => {
    const siceList = getParticipantes(disciplinaId, categoria);
    const map = new Map();

    // 1. Cargar el padrón SICE pre-cargado de 215 participantes en memoria
    siceList.forEach(p => {
      const cod = p.codigo || p.id;
      map.set(cod, {
        id: cod,
        codigoParticipante: cod,
        institucionNombre: p.iiee,
        iiee: p.iiee,
        iieeId: p.iieeId,
        categoria: p.categoria,
        disciplinaId: p.disciplinaId,
        tituloObra: p.titulo,
        seudonimo: p.seudonimo,
        urlTrabajo: p.enlace,
        origen: 'sice'
      });
    });

    // 2. Unir con participantes adicionales creados o guardados en Firestore
    fsParticipantes.forEach(p => {
      const cod = p.codigoParticipante || p.codigo || p.id;
      map.set(cod, p);
    });

    return Array.from(map.values());
  }, [disciplinaId, categoria, fsParticipantes]);

  // Sincronizar participante en modo rápido
  useEffect(() => {
    if (modoRapido && participantes.length > 0) {
      const idx = Math.max(0, Math.min(rapidoIndex, participantes.length - 1));
      setSelectedParticipante(participantes[idx]);
    }
  }, [modoRapido, rapidoIndex, participantes]);

  // Cargar evaluación cuando se selecciona un participante (Persistencia en tiempo real + Fallback)
  useEffect(() => {
    if (selectedParticipante && user) {
      // 1. Buscar coincidencia inmediata en las evaluaciones cargadas en tiempo real
      const matchFs = fsEvaluaciones.find(ev => 
        (ev.participanteId === selectedParticipante.id || ev.id?.startsWith(selectedParticipante.id)) &&
        (ev.jurado?.uid === user.uid || ev.jurado?.numeroJurado === user.numeroJurado || isRole('admin'))
      );

      if (matchFs) {
        setEvaluacionActual(matchFs);
      }

      // 2. Consultar directamente a Firestore para obtener los datos más recientes
      getJFEvaluacion(selectedParticipante.id, user.uid).then(ev => {
        if (ev) setEvaluacionActual(ev);
      }).catch(err => {
        console.error("Error obteniendo evaluación:", err);
      });
    } else {
      setEvaluacionActual(null);
    }
  }, [selectedParticipante, user, fsEvaluaciones]);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportSICEModal, setShowImportSICEModal] = useState(false);
  const [soloNuevosSICE, setSoloNuevosSICE] = useState(true);
  const [cargandoImport, setCargandoImport] = useState(false);

  // Auto-depuración en segundo plano de evaluaciones huérfanas o duplicadas en Firestore
  useEffect(() => {
    if (participantes.length > 0 && fsEvaluaciones.length > 0) {
      const validas = filtrarEvaluacionesValidas(fsEvaluaciones, disciplinaId, categoria, participantes);
      const fsCatCount = fsEvaluaciones.filter(ev => 
        (ev.disciplinaId === disciplinaId || ev.id?.includes(disciplinaId)) && 
        (ev.categoria === categoria || ev.participanteSnapshot?.categoria === categoria)
      ).length;

      if (fsCatCount > validas.length) {
        console.warn(`[Auto-Purge] Detectadas ${fsCatCount - validas.length} evaluaciones huérfanas/duplicadas en Firestore. Depurando...`);
        limpiarEvaluacionesHuerfanas(disciplinaId, categoria, participantes).then(num => {
          if (num > 0) console.log(`[Auto-Purge] Se eliminaron ${num} registros huérfanos de Firestore.`);
        }).catch(console.error);
      }
    }
  }, [disciplinaId, categoria, participantes, fsEvaluaciones]);

  const handleDescargarTodasLasFichasPDF = async () => {
    try {
      const evsForCategory = filtrarEvaluacionesValidas(fsEvaluaciones, disciplinaId, categoria, participantes);

      if (evsForCategory.length === 0) {
        addToast("No se encontraron evaluaciones registradas en esta disciplina y categoría para descargar.", "amber");
        return;
      }

      addToast(`Generando PDF consolidado de ${evsForCategory.length} fichas de evaluación...`, "info");
      const banner = await loadImageDataURL('/membrete-juegos-florales.png');
      const rubrica = getRubrica(disciplinaId);
      generarTodasFichasJFPDF(evsForCategory, rubrica, banner);
      addToast("Descarga masiva de fichas PDF completada.", "success");
    } catch (err) {
      console.error("Error al descargar fichas masivas:", err);
      addToast(`Error al descargar fichas masivas: ${err.message}`, "error");
    }
  };

  const [newPartForm, setNewPartForm] = useState({
    codigoParticipante: '',
    institucionNombre: '',
    codigoModular: '',
    tituloObra: '',
    urlTrabajo: '',
    estudianteNombre: '',
    estudianteDni: '',
    docenteNombre: '',
    docenteDni: ''
  });

  // Toasts locales
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // Iniciar Modo Rápido
  const handleIniciarModoRapido = () => {
    if (participantes.length === 0) {
      addToast("No hay participantes para evaluar en esta disciplina y categoría.", "error");
      return;
    }
    setRapidoIndex(0);
    setSelectedParticipante(participantes[0]);
    setModoRapido(true);
  };

  const handleSalirModoRapido = () => {
    setModoRapido(false);
    setSelectedParticipante(null);
  };

  const handleNavegarRapido = (direccion) => {
    const nextIdx = rapidoIndex + direccion;
    if (nextIdx >= 0 && nextIdx < participantes.length) {
      setRapidoIndex(nextIdx);
      setSelectedParticipante(participantes[nextIdx]);
    }
  };

  // Acción Rápida para Marcar Incomparecencia (NSP)
  const handleQuickMarcarNSP = async (p, e) => {
    e.stopPropagation();
    const instNombre = p.institucion?.nombre || p.institucionNombre || p.iiee || 'I. E.';
    if (!window.confirm(`¿Confirmar INCOMPARECENCIA (NSP) para la I. E. "${instNombre}"?`)) return;

    try {
      const juradoUid = user?.uid || "anon";
      const docId = `${p.id}__${juradoUid}`;

      // Resolver datos oficiales del jurado
      const juradoCred = (user?.email ? construirBloqueJurado(user.email, categoria) : null) ||
                         (disciplinaId && userJuradoNum ? getJuradosDeDisciplina(disciplinaId, categoria).find(j => j.numeroJurado === userJuradoNum) : null);

      const nombreJurado = juradoCred?.nombreCompleto || user?.nombreCompleto || user?.nombre || "JURADO CALIFICADOR";
      const dniJurado = juradoCred?.dni || user?.dni || "";
      const numJurado = juradoCred?.numeroJurado || parseInt(user?.numeroJurado, 10) || userJuradoNum || 1;
      const cargoJurado = juradoCred?.cargo || user?.cargo || user?.especialidad || "";

      // 1. Buscar firma digital del jurado en localStorage
      let firmaJurado = null;
      const cleanName = (nombreJurado || user?.nombreCompleto || user?.nombre || "").trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const cleanDni = (dniJurado || user?.dni || "").trim();
      const identity = cleanDni ? `dni_${cleanDni}` : (cleanName ? `nom_${cleanName}` : (user?.uid || 'anon'));
      const catKey = `jf_sig_${disciplinaId}_${categoria}_j${numJurado}_${identity}`;

      const possibleKeys = [
        catKey,
        user?.uid ? `jf_sig_user_${user.uid}` : null,
        user?.email ? `jf_sig_user_${user.email}` : null,
        numJurado ? `jf_sig_user_jurado_${numJurado}` : null,
        juradoUid ? `jf_sig_user_${juradoUid}` : null
      ].filter(Boolean);

      for (const k of possibleKeys) {
        try {
          const cached = localStorage.getItem(k);
          if (cached && cached.startsWith('data:image')) {
            firmaJurado = cached;
            break;
          }
        } catch (err) {}
      }

      // 2. Buscar en el perfil del usuario autenticado
      if (!firmaJurado) {
        if (user?.firmaDataUrl?.startsWith('data:image')) firmaJurado = user.firmaDataUrl;
        else if (user?.firmaUrl?.startsWith('data:image')) firmaJurado = user.firmaUrl;
        else if (user?.firma?.startsWith('data:image')) firmaJurado = user.firma;
      }

      // 3. Buscar en evaluaciones previas registradas por este jurado en Firestore
      if (!firmaJurado && fsEvaluaciones && fsEvaluaciones.length > 0) {
        const evConFirma = fsEvaluaciones.find(ev => 
          (ev.jurado?.uid === user?.uid || 
           (numJurado && (ev.jurado?.numeroJurado === numJurado || ev.juradoId === numJurado)) ||
           (user?.email && ev.jurado?.email === user.email)) &&
          ev.jurado?.firmaDataUrl
        );
        if (evConFirma?.jurado?.firmaDataUrl) {
          firmaJurado = evConFirma.jurado.firmaDataUrl;
          if (possibleKeys[0]) {
            try { localStorage.setItem(possibleKeys[0], firmaJurado); } catch (err) {}
          }
        }
      }

      await saveJFEvaluacion({
        id: docId,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        categoria,
        participanteId: p.id,
        participanteSnapshot: {
          codigoParticipante: p.codigoParticipante || p.codigo || 'JF-2026',
          tituloObra: p.tituloObra || '',
          urlTrabajo: p.urlTrabajo || '',
          institucionNombre: instNombre,
          codigoModular: p.institucion?.codigoModular || p.codigoModular || '',
          ugel: p.institucion?.ugel || p.ugel || 'UGEL 03',
          dre: p.institucion?.dre || p.dre || 'DRE LIMA METROPOLITANA',
          categoria,
          disciplinaLabel: discInfo?.label || '',
          estudiantes: p.estudiantes || [],
          docenteAsesor: p.docenteAsesor || null
        },
        jurado: {
          uid: juradoUid,
          nombreCompleto: String(nombreJurado).toUpperCase(),
          dni: dniJurado,
          numeroJurado: numJurado,
          especialidad: cargoJurado,
          firmaDataUrl: firmaJurado || null
        },
        puntajes: {},
        puntajeBruto: 0,
        penalizaciones: [],
        puntajeTotal: 0,
        puntajeMaximo: 40,
        duracionEjecutada: "00:00",
        observacionesJurado: "INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN",
        acreditacion: {},
        fecha: new Date().toISOString().slice(0, 10),
        lugar: "UGEL 03",
        estado: "firmada",
        incomparecencia: true,
        firmadaEn: new Date().toISOString()
      });
      addToast(`I. E. ${instNombre} registrada con Incomparecencia (NSP)${firmaJurado ? ' y firma digital adjunta' : ''}.`, "warning");
    } catch (err) {
      addToast(`Error al marcar incomparecencia: ${err.message}`, "error");
    }
  };

  const listaDisciplinas = useMemo(() => {
    if (isRole('jurado') && user?.disciplinaId) {
      const match = DISCIPLINAS_UGEL03.filter(d => d.disciplinaId === user.disciplinaId);
      if (match.length > 0) return match;
    }
    return DISCIPLINAS_UGEL03;
  }, [user, isRole]);

  // Limpiar evaluaciones de prueba de la categoría seleccionada
  const handleLimpiarPruebas = async () => {
    const discObj = getDisciplinaUGEL03(disciplinaId);
    const discLabel = discObj?.label || disciplinaId;
    if (!window.confirm(`¿Está seguro de ELIMINAR TODAS las evaluaciones registradas para ${discLabel} — Categoría ${categoria}?\n\nEsta acción dejará todas las fichas completamente en blanco para el día oficial.`)) return;

    try {
      const borrados = await limpiarEvaluacionesCategoria(disciplinaId, categoria);
      addToast(`Se eliminaron ${borrados} evaluaciones de prueba. Fichas dejadas en blanco.`, "info");
    } catch (err) {
      addToast(`Error al limpiar evaluaciones: ${err.message}`, "error");
    }
  };

  const handleEliminarEvaluacionItem = async (evDocId, instNombre, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar la evaluación de "${instNombre}" y dejar su ficha en blanco?`)) return;
    try {
      await deleteJFEvaluacion(evDocId);
      const catDocId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;
      await deleteJFConsolidado(catDocId);
      await deleteJFActa(catDocId);
      addToast(`Evaluación de ${instNombre} eliminada. Ficha en blanco.`, "info");
    } catch (err) {
      addToast(`Error al eliminar evaluación: ${err.message}`, "error");
    }
  };

  // Importar Padrón Semilla SICE (215 registros)
  const handleImportarSemillaSICE = async () => {
    try {
      setCargandoImport(true);
      const res = await batchImportarPadronSICE(PARTICIPANTES_SICE, { soloNuevos: soloNuevosSICE, usuario: user });
      addToast(`Importación exitosa. ${res.importados} participantes importados (${res.omitidos} omitidos por duplicado).`, "success");
      setShowImportSICEModal(false);
    } catch (err) {
      addToast(`Error en la carga masiva: ${err.message}`, "error");
    } finally {
      setCargandoImport(false);
    }
  };

  // Importar Reporte SICE Excel (.xls / .xlsx)
  const handleImportarExcelSICE = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCargandoImport(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const aoaRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const { participantes: parsedList, noReconocidos } = parsearExcelSICE(aoaRows);

      if (parsedList.length === 0) {
        addToast("No se pudo leer el archivo. Exporte el reporte desde SICE en formato Excel y vuelva a intentarlo.", "error");
        return;
      }

      if (noReconocidos.length > 0) {
        addToast(`Se omitieron ${noReconocidos.length} filas por disciplinas no reconocidas.`, "warning");
      }

      const res = await batchImportarPadronSICE(parsedList, { soloNuevos: soloNuevosSICE, usuario: user });
      addToast(`Importación exitosa desde Excel. ${res.importados} participantes procesados (${res.omitidos} omitidos).`, "success");
      setShowImportSICEModal(false);
    } catch (err) {
      addToast(`Error procesando archivo Excel: ${err.message}`, "error");
    } finally {
      setCargandoImport(false);
      e.target.value = null;
    }
  };

  // Sorteo de orden de presentación (disciplinas presenciales)
  const handleSortearOrden = async () => {
    if (!discInfo || discInfo.modalidad !== "presencial") return;
    if (participantes.length === 0) {
      addToast("No hay participantes registrados para esta disciplina y categoría.", "error");
      return;
    }

    if (confirm(`Se reasignará el orden de presentación de ${participantes.length} participantes. ¿Desea continuar?`)) {
      try {
        const count = await sortearOrdenPresentacion({ disciplinaId, categoria, usuario: user });
        addToast(`Sorteo realizado con éxito. Se asignó el orden 1 a ${count} participantes.`, "success");
      } catch (err) {
        addToast(`Error al sortear orden: ${err.message}`, "error");
      }
    }
  };

  const handleCrearParticipante = async () => {
    if (!newPartForm.institucionNombre) {
      addToast("Complete el nombre de la Institución Educativa.", "error");
      return;
    }

    try {
      const partId = `JF-${Date.now()}`;
      await addJFParticipante({
        id: partId,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        categoria,
        codigoParticipante: newPartForm.codigoParticipante || `JF-2026-${Math.floor(100 + Math.random() * 900)}`,
        institucion: {
          nombre: newPartForm.institucionNombre,
          codigoModular: newPartForm.codigoModular || '000000',
          ugel: 'UGEL 03',
          dre: 'DRE LIMA METROPOLITANA',
          region: 'Lima',
          provincia: 'Lima',
          distrito: 'Pueblo Libre'
        },
        tituloObra: newPartForm.tituloObra || '',
        urlTrabajo: newPartForm.urlTrabajo || '',
        estudiantes: newPartForm.estudianteNombre ? [{ nombres: newPartForm.estudianteNombre, dni: newPartForm.estudianteDni || '' }] : [],
        docenteAsesor: newPartForm.docenteNombre ? { nombres: newPartForm.docenteNombre, dni: newPartForm.docenteDni || '' } : {},
        ordenPresentacion: participantes.length + 1,
        origen: 'manual'
      });

      addToast("Participante registrado correctamente.", "success");
      setShowAddModal(false);
      setNewPartForm({
        codigoParticipante: '',
        institucionNombre: '',
        codigoModular: '',
        tituloObra: '',
        urlTrabajo: '',
        estudianteNombre: '',
        estudianteDni: '',
        docenteNombre: '',
        docenteDni: ''
      });
    } catch (err) {
      addToast(`Error al registrar participante: ${err.message}`, "error");
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Toast container local */}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
      </div>

      {/* HEADER DEL MÓDULO */}
      <div style={{ background: C.navy2, color: C.white, borderRadius: '8px 8px 0 0', padding: '16px 24px', borderBottom: `3px solid ${C.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, margin: 0, letterSpacing: 0.3 }}>
              Juegos Florales Escolares Nacionales 2026
            </h1>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>
              Etapa UGEL 03 · Comunicado 01 · RVM N.° 106-2026-MINEDU
            </div>
          </div>

          <button
            onClick={() => setShowComunicado(!showComunicado)}
            style={{ background: 'transparent', border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans'" }}
          >
            {showComunicado ? 'Ocultar Disposiciones ▲' : 'Disposiciones del Comunicado 01 ▼'}
          </button>
        </div>

        {/* Bloque Plegable de Disposiciones del Comunicado 01 */}
        {showComunicado && (
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 14, marginTop: 14, fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>NOTAS Y REGLAS DEL COMUNICADO 01 (ETAPA UGEL 03):</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {NOTAS_COMUNICADO_01.map((nota, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{nota}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* BARRA DE SUB-PESTAÑAS */}
      <div style={{ display: 'flex', background: C.white, borderBottom: `2px solid ${C.border}`, overflowX: 'auto' }}>
        {[
          { id: 'fichas', label: 'Fichas de evaluación', icon: 'clipboard' },
          { id: 'a10', label: 'Anexo A10 — Consolidado', icon: 'fileText' },
          { id: 'a11', label: 'Anexo A11 — Acta', icon: 'check' },
          { id: 'programacion', label: 'Programación', icon: 'calendar' }
        ].map(tab => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id);
                setSelectedParticipante(null);
                setModoRapido(false);
              }}
              style={{
                padding: '12px 22px',
                fontSize: 13,
                fontWeight: 700,
                color: isActive ? C.white : C.g500,
                background: isActive ? C.navy3 : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans'",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              <Icon name={tab.icon} size={15} color={isActive ? C.white : C.g500} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DE SUB-PESTAÑAS */}
      <div style={{ padding: '24px 0' }}>
        {/* SUB-PESTAÑA 1: FICHAS DE EVALUACIÓN (D1) */}
        {subTab === 'fichas' && (
          <div>
            {!selectedParticipante && !modoRapido ? (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                {/* Selectores de Disciplina y Categoría */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>DISCIPLINA HABILITADA (COMUNICADO 01)</label>
                    <select
                      value={disciplinaId}
                      disabled={isRole('jurado') && Boolean(user?.disciplinaId)}
                      onChange={e => setDisciplinaId(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.navy2, background: (isRole('jurado') && Boolean(user?.disciplinaId)) ? C.g100 : C.white }}
                    >
                      <optgroup label="PRESENCIALES">
                        {listaDisciplinas.filter(d => d.modalidad === 'presencial').map(d => (
                          <option key={d.disciplinaId} value={d.disciplinaId}>{d.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="NO PRESENCIALES">
                        {listaDisciplinas.filter(d => d.modalidad === 'no_presencial').map(d => (
                          <option key={d.disciplinaId} value={d.disciplinaId}>{d.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>CATEGORÍA HABILITADA</label>
                    <select
                      value={categoria}
                      onChange={e => setCategoria(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.navy2 }}
                    >
                      {categoriasHabilitadas.map(c => (
                        <option key={c} value={c}>Categoría {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>ETAPA</label>
                    <input type="text" readOnly value="UGEL" style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.g100, fontSize: 13, fontWeight: 700, color: C.navy2 }} />
                  </div>
                </div>

                {/* Acciones de Bandeja: Modo Rápido, SICE Import, Sorteo y Nuevo Participante */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>
                    Participantes de {discInfo?.label} — Categoría {categoria} ({participantes.length})
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleIniciarModoRapido}
                      disabled={participantes.length === 0}
                      style={{
                        background: participantes.length > 0 ? C.navy3 : C.g500,
                        color: C.white,
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
                      <Icon name="play" size={14} /> Iniciar evaluación de la disciplina
                    </button>

                    <button
                      onClick={handleLimpiarPruebas}
                      style={{ background: '#FFF1F2', color: C.red, border: '1px solid #FECDD3', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Eliminar todas las evaluaciones registradas en esta categoría para dejarlas en blanco"
                    >
                      Limpiar Fichas
                    </button>

                    <button
                      onClick={handleDescargarTodasLasFichasPDF}
                      style={{ background: C.navy3, color: C.white, border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Descargar un único archivo PDF consolidado conteniendo todas las fichas de evaluación de esta categoría para imprimir directamente"
                    >
                      <Icon name="download" size={14} /> Descargar Fichas PDF (Masivo)
                    </button>

                    {(isRole('admin') || isRole('jefatura')) && (
                      <button
                        onClick={() => setShowImportSICEModal(true)}
                        style={{ background: C.g100, color: C.navy2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="upload" size={14} /> Importar padrón SICE
                      </button>
                    )}

                    {discInfo?.modalidad === 'presencial' && (isRole('admin') || isRole('jefatura') || isRole('personal')) && (
                      <button
                        onClick={handleSortearOrden}
                        style={{ background: C.white, color: C.navy3, border: `1px solid ${C.navy3}`, borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="list" size={14} /> Sortear orden
                      </button>
                    )}

                    {(isRole('admin') || isRole('jefatura') || isRole('personal')) && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        style={{ background: C.gold, color: C.navy1, border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Icon name="plus" size={14} /> + Registrar Participante
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Participantes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {participantes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 36, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, color: C.amber, fontWeight: 700 }}>
                      Sin inscritos en esta disciplina y categoría.
                    </div>
                  ) : (
                    participantes.map((p, idx) => {
                      const evsForPart = fsEvaluaciones.filter(ev => ev.participanteId === p.id || ev.id?.startsWith(p.id));
                      const evMatch = isUserJurado
                        ? evsForPart.find(ev => (
                            ev.jurado?.uid === user?.uid ||
                            (userJuradoNum && (ev.jurado?.numeroJurado === userJuradoNum || ev.juradoId === userJuradoNum || ev.id === `${p.id}__${user?.uid}`))
                          ))
                        : evsForPart[0];

                      const isNSP = evMatch?.incomparecencia || evMatch?.estado === 'incomparecencia';
                      const isCerrada = evMatch?.estado === 'firmada' || evMatch?.estado === 'cerrada';

                      return (
                        <div
                          key={p.id || idx}
                          onClick={() => {
                            setSelectedParticipante(p);
                            setModoRapido(false);
                          }}
                          style={{
                            background: C.white,
                            border: `1px solid ${isNSP ? '#FCA5A5' : C.border}`,
                            borderLeft: `5px solid ${isNSP ? C.red : isCerrada ? C.green : C.navy3}`,
                            borderRadius: 8,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: '0 1px 4px rgba(15,23,42,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2, lineHeight: 1.4 }}>
                                {p.institucion?.nombre || p.institucionNombre || p.iiee}
                              </div>
                              <div style={{ fontSize: 12, color: C.g800, marginTop: 4 }}>
                                <strong>Obra:</strong> {p.tituloObra || 'Sin título'} &nbsp;·&nbsp; <span style={{ color: C.gold, fontWeight: 700 }}>seudónimo: {p.seudonimo || '—'}</span>
                              </div>
                              <div style={{ fontSize: 11, color: C.g500, marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <span>Código SICE: {p.codigoParticipante || p.codigo}</span>
                                {p.ordenPresentacion > 0 && <span>Orden: N.° {p.ordenPresentacion}</span>}
                              </div>
                            </div>

                            <div>
                              {isNSP && (
                                <span style={{ background: '#FEE2E2', color: C.red, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 4, border: '1px solid #FCA5A5', whiteSpace: 'nowrap' }}>
                                  INCOMPARECENCIA (NSP)
                                </span>
                              )}
                              {!isNSP && isCerrada && (
                                <span style={{ background: '#F0FDF4', color: C.green, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 4, border: '1px solid #BBF7D0', whiteSpace: 'nowrap' }}>
                                  EVALUADA / CERRADA ({evMatch?.puntajeTotal || 0} pts)
                                </span>
                              )}
                              {!isNSP && !isCerrada && evMatch && (
                                <span style={{ background: '#EFF6FF', color: C.navy3, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 4, border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                                  EN BORRADOR ({evMatch?.puntajeTotal || 0} pts)
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            {evMatch && (
                              <button
                                onClick={(e) => handleEliminarEvaluacionItem(evMatch.id, p.institucion?.nombre || p.institucionNombre || p.iiee || 'I. E.', e)}
                                style={{ background: '#FFF1F2', color: C.red, border: '1px solid #FECDD3', borderRadius: 6, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                title="Eliminar evaluación de este participante y dejar la ficha en blanco"
                              >
                                Limpiar Ficha
                              </button>
                            )}
                            {!isNSP && !isCerrada && (
                              <button
                                onClick={(e) => handleQuickMarcarNSP(p, e)}
                                style={{ background: '#FEF2F2', color: C.red, border: '1px solid #FCA5A5', borderRadius: 6, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                title="Marcar incomparecencia sin ingresar a la ficha"
                              >
                                Marcar NSP
                              </button>
                            )}
                            <button style={{ background: isNSP ? C.red : isCerrada ? C.green : C.navy3, color: C.white, border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700 }}>
                              {isNSP ? 'Ver Ficha NSP →' : 'Evaluar Ficha D1 →'}
                            </button>
                            {isRole('admin') && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`¿Eliminar participante ${p.codigoParticipante}?`)) {
                                    await deleteJFParticipante(p.id);
                                    addToast("Participante eliminado", "info");
                                  }
                                }}
                                style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: 6 }}
                              >
                                <Icon name="x" size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Banner de Modo Rápido si está activo */}
                {modoRapido && (
                  <div style={{ background: C.navy3, color: C.white, padding: '12px 20px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ background: C.gold, color: C.navy1, padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                        MODO RÁPIDO
                      </span>
                      Participante {rapidoIndex + 1} de {participantes.length} — {discInfo?.label}, categoría {categoria}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={rapidoIndex === 0}
                        onClick={() => handleNavegarRapido(-1)}
                        style={{ background: 'rgba(255,255,255,0.15)', color: C.white, border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: rapidoIndex === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        ← Anterior
                      </button>
                      <button
                        disabled={rapidoIndex === participantes.length - 1}
                        onClick={() => handleNavegarRapido(1)}
                        style={{ background: C.gold, color: C.navy1, border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: rapidoIndex === participantes.length - 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Siguiente →
                      </button>
                      <button
                        onClick={handleSalirModoRapido}
                        style={{ background: 'transparent', color: C.white, border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                      >
                        Volver a la lista
                      </button>
                    </div>
                  </div>
                )}

                <JFFichaEvaluacion
                  evaluacionInicial={evaluacionActual}
                  participante={selectedParticipante}
                  disciplinaId={disciplinaId}
                  categoria={categoria}
                  user={user}
                  isRole={isRole}
                  onBack={() => {
                    setSelectedParticipante(null);
                    setModoRapido(false);
                  }}
                  onSelectOtroParticipante={(newPartObj) => {
                    setSelectedParticipante(newPartObj);
                  }}
                  onToast={addToast}
                />
              </div>
            )}
          </div>
        )}

        {/* SUB-PESTAÑA 2: ANEXO A10 CONSOLIDADO (D2) */}
        {subTab === 'a10' && (
          <JFConsolidadoA10
            user={user}
            isRole={isRole}
            onToast={addToast}
            initialDisciplinaId={disciplinaId}
            onGenerarA11={({ disciplinaId: dId, categoria: cat }) => {
              setDisciplinaId(dId);
              setCategoria(cat);
              setSubTab('a11');
            }}
          />
        )}

        {/* SUB-PESTAÑA 3: ANEXO A11 ACTA (D3) */}
        {subTab === 'a11' && (
          <JFActaA11
            user={user}
            isRole={isRole}
            onToast={addToast}
            initialDisciplinaId={disciplinaId}
          />
        )}

        {/* SUB-PESTAÑA 4: PROGRAMACIÓN (CONTROL DE 37 COMBINACIONES) */}
        {subTab === 'programacion' && (
          <JFProgramacionTab />
        )}
      </div>

      {/* MODAL IMPORTAR PADRÓN SICE */}
      {showImportSICEModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 8, padding: 24, maxWidth: 520, width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.navy2, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${C.g100}` }}>
              Carga e Importación del Padrón SICE
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.g800, cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={soloNuevosSICE}
                  onChange={e => setSoloNuevosSICE(e.target.checked)}
                  style={{ accentColor: C.navy3 }}
                />
                Solo importar los que no existan en Firestore (Omitir duplicados)
              </label>
            </div>

            {/* Opción 1: Cargar Padrón Semilla Real (215 registros) */}
            <div style={{ background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>1. Padrón oficial SICE pre-cargado (215 inscritos)</div>
              <div style={{ fontSize: 11, color: C.g500, margin: '4px 0 10px 0' }}>
                Importa automáticamente los 215 participantes reales de las 63 IIEE de la UGEL 03 exportados desde SICE.
              </div>
              <button
                disabled={cargandoImport}
                onClick={handleImportarSemillaSICE}
                style={{ width: '100%', background: C.navy3, color: C.white, border: 'none', padding: '10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: cargandoImport ? 'not-allowed' : 'pointer' }}
              >
                {cargandoImport ? 'Importando a Firestore...' : 'Cargar 215 participantes de SICE'}
              </button>
            </div>

            {/* Opción 2: Subir Excel exportado de SICE */}
            <div style={{ background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>2. Cargar reporte Excel exportado de SICE (.xls / .xlsx)</div>
              <div style={{ fontSize: 11, color: C.g500, margin: '4px 0 10px 0' }}>
                Deteción dinámica de cabecera en fila con columna "Nro" y mapeo automático de seudónimo y enlaces.
              </div>
              <input
                type="file"
                accept=".xls,.xlsx"
                disabled={cargandoImport}
                onChange={handleImportarExcelSICE}
                style={{ fontSize: 12, width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.g100}` }}>
              <button onClick={() => setShowImportSICEModal(false)} style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PARTICIPANTE MANUAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 8, padding: 24, maxWidth: 550, width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.navy2, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${C.g100}` }}>
              Registrar Participante Manual en {discInfo?.label} — Cat. {categoria}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>CÓDIGO SICE (OPCIONAL)</label>
                <input
                  type="text"
                  placeholder="JF-2026-000123"
                  value={newPartForm.codigoParticipante}
                  onChange={e => setNewPartForm({ ...newPartForm, codigoParticipante: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>CÓDIGO MODULAR I. E.</label>
                <input
                  type="text"
                  placeholder="0123456"
                  value={newPartForm.codigoModular}
                  onChange={e => setNewPartForm({ ...newPartForm, codigoModular: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>NOMBRE DE LA INSTITUCIÓN EDUCATIVA *</label>
                <input
                  type="text"
                  placeholder="Ej: I. E. Teresa Gonzales de Fanning"
                  value={newPartForm.institucionNombre}
                  onChange={e => setNewPartForm({ ...newPartForm, institucionNombre: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>TÍTULO DE LA OBRA (OPCIONAL)</label>
                <input
                  type="text"
                  placeholder="Ej: Odisea Andina"
                  value={newPartForm.tituloObra}
                  onChange={e => setNewPartForm({ ...newPartForm, tituloObra: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              {discInfo?.requiereURL && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>ENLACE DEL TRABAJO (OPCIONAL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newPartForm.urlTrabajo}
                    onChange={e => setNewPartForm({ ...newPartForm, urlTrabajo: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>ESTUDIANTE (OPCIONAL)</label>
                <input
                  type="text"
                  placeholder="Nombres y Apellidos"
                  value={newPartForm.estudianteNombre}
                  onChange={e => setNewPartForm({ ...newPartForm, estudianteNombre: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>DNI ESTUDIANTE</label>
                <input
                  type="text"
                  placeholder="8 dígitos"
                  maxLength={8}
                  value={newPartForm.estudianteDni}
                  onChange={e => setNewPartForm({ ...newPartForm, estudianteDni: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>DOCENTE ASESOR (OPCIONAL)</label>
                <input
                  type="text"
                  placeholder="Nombres y Apellidos"
                  value={newPartForm.docenteNombre}
                  onChange={e => setNewPartForm({ ...newPartForm, docenteNombre: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>DNI DOCENTE ASESOR</label>
                <input
                  type="text"
                  placeholder="8 dígitos"
                  maxLength={8}
                  value={newPartForm.docenteDni}
                  onChange={e => setNewPartForm({ ...newPartForm, docenteDni: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.g100}` }}>
              <button onClick={() => setShowAddModal(false)} style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleCrearParticipante} style={{ background: C.navy3, color: C.white, border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Guardar Participante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
