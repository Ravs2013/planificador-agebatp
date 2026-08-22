import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getRubrica } from '../data/juegosFloralesRubricas';
import { ACREDITACION_PRESENCIAL, getContextoEvaluacion } from '../data/juegosFloralesUGEL03';
import { CATEGORIAS_JF, C } from '../data/juegosFloralesCatalogos';
import {
  calcularPuntajeBruto,
  contarIndicadoresCalificados,
  estaCompleta,
  excedeTiempo,
  calcularPuntajeTotal,
  validarDNI
} from '../utils/juegosFloralesHelpers';
import { saveJFEvaluacion, firmarJFEvaluacion, reabrirJFEvaluacion, deleteJFEvaluacion, deleteJFConsolidado, deleteJFActa } from '../firebase/dbJuegosFlorales';
import { generarFichaJFPDF } from '../pdf/generarFichaJFPDF';
import { loadImageDataURL } from '../pdf/membrete';
import { construirBloqueJurado, getJuradosDeDisciplina } from '../data/juegosFloralesCredenciales';
import FirmaDigital from './FirmaDigital';
import JFSelectorParticipante from './JFSelectorParticipante';
import Icon from './Icon';

export default function JFFichaEvaluacion({
  evaluacionInicial,
  participante,
  disciplinaId,
  categoria,
  user,
  isRole,
  onBack,
  onToast,
  onSelectOtroParticipante
}) {
  const rubrica = useMemo(() => getRubrica(disciplinaId), [disciplinaId]);
  const contexto = useMemo(() => getContextoEvaluacion(disciplinaId), [disciplinaId]);

  // Datos precargados
  const snap = participante || evaluacionInicial?.participanteSnapshot || {};
  const detCat = CATEGORIAS_JF[categoria]?.detalle || categoria;

  // Estado del formulario
  const [puntajes, setPuntajes] = useState(evaluacionInicial?.puntajes || {});
  const [duracionEjecutada, setDuracionEjecutada] = useState(evaluacionInicial?.duracionEjecutada || "");
  const [excedeAuto, setExcedeAuto] = useState(false);
  const [penalizacionManual, setPenalizacionManual] = useState(
    (evaluacionInicial?.penalizaciones || []).some(p => p.tipo === "tiempo")
  );
  const [sustentoTiempo, setSustentoTiempo] = useState(
    (evaluacionInicial?.penalizaciones || []).find(p => p.tipo === "tiempo")?.motivo || ""
  );
  const [observacionesJurado, setObservacionesJurado] = useState(evaluacionInicial?.observacionesJurado || "");

  // Acreditación (disciplinas presenciales)
  const [acreditacion, setAcreditacion] = useState(
    evaluacionInicial?.acreditacion || { acr1: false, acr2: false, acr3: false, acr4: false, acr5: false, acr6: false }
  );
  const [showAcreditacion, setShowAcreditacion] = useState(true);

  // Jurado
  const juradoUid = user?.uid || "anon";
  const juradoMatriz = useMemo(() => construirBloqueJurado(user?.email, categoria), [user?.email, categoria]);
  const userManuallyEditedJuradoRef = useRef(false);

  const isPlaceholderName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const clean = name.trim().toUpperCase();
    return clean === '' || clean.startsWith('JURADO ') || clean.startsWith('JURADO 1') || clean.startsWith('JURADO 2') || clean.startsWith('JURADO 3');
  };

  const getBestNombreJurado = (num = numeroJurado) => {
    const fromEval = evaluacionInicial?.jurado?.nombreCompleto;
    if (!isPlaceholderName(fromEval)) return fromEval.toUpperCase();

    const juradosDisc = getJuradosDeDisciplina(disciplinaId, categoria);
    const jMatch = juradosDisc.find(j => j.numeroJurado === num);
    if (!isPlaceholderName(jMatch?.nombreCompleto)) return jMatch.nombreCompleto.toUpperCase();

    const fromMat = juradoMatriz?.nombreCompleto;
    if (!isPlaceholderName(fromMat)) return fromMat.toUpperCase();

    const fromUser = user?.nombreCompleto || user?.nombre;
    if (!isPlaceholderName(fromUser)) return fromUser.toUpperCase();

    return fromEval || jMatch?.nombreCompleto || fromMat || fromUser || "";
  };

  const getBestDniJurado = (num = numeroJurado) => {
    const fromEval = evaluacionInicial?.jurado?.dni;
    if (fromEval && fromEval !== "00000000") return fromEval;

    const juradosDisc = getJuradosDeDisciplina(disciplinaId, categoria);
    const jMatch = juradosDisc.find(j => j.numeroJurado === num);
    if (jMatch?.dni) return jMatch.dni;

    return juradoMatriz?.dni || user?.dni || "";
  };

  const getBestCargoJurado = (num = numeroJurado) => {
    const fromEval = evaluacionInicial?.jurado?.especialidad;
    if (fromEval && !fromEval.toUpperCase().startsWith('JURADO CALIFICADOR N.°')) return fromEval;

    const juradosDisc = getJuradosDeDisciplina(disciplinaId, categoria);
    const jMatch = juradosDisc.find(j => j.numeroJurado === num);
    if (jMatch?.cargo) return jMatch.cargo;

    return juradoMatriz?.cargo || user?.cargo || "JURADO CALIFICADOR";
  };

  const [numeroJurado, setNumeroJurado] = useState(
    evaluacionInicial?.jurado?.numeroJurado || juradoMatriz?.numeroJurado || user?.numeroJurado || 1
  );
  const [nombreJurado, setNombreJurado] = useState(() => getBestNombreJurado(evaluacionInicial?.jurado?.numeroJurado || juradoMatriz?.numeroJurado || user?.numeroJurado || 1));
  const [dniJurado, setDniJurado] = useState(() => getBestDniJurado(evaluacionInicial?.jurado?.numeroJurado || juradoMatriz?.numeroJurado || user?.numeroJurado || 1));
  const [especialidadJurado, setEspecialidadJurado] = useState(() => getBestCargoJurado(evaluacionInicial?.jurado?.numeroJurado || juradoMatriz?.numeroJurado || user?.numeroJurado || 1));
  const [firmaDataUrl, setFirmaDataUrl] = useState(evaluacionInicial?.jurado?.firmaDataUrl || null);

  // Sync jurado profile automatically from matrix credential when discipline/category/seat changes
  useEffect(() => {
    if (userManuallyEditedJuradoRef.current) return;
    const currentIsPlaceholder = isPlaceholderName(nombreJurado);
    if (currentIsPlaceholder) {
      const bestNom = getBestNombreJurado(numeroJurado);
      if (bestNom) setNombreJurado(bestNom);
      const bestDni = getBestDniJurado(numeroJurado);
      if (bestDni) setDniJurado(bestDni);
      const bestCargo = getBestCargoJurado(numeroJurado);
      if (bestCargo) setEspecialidadJurado(bestCargo);
    }
  }, [disciplinaId, categoria, numeroJurado]);

  // Estado de la evaluación y UI
  const [estado, setEstado] = useState(evaluacionInicial?.estado || "borrador");
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  const [showFirmarModal, setShowFirmarModal] = useState(false);
  const [showReabrirModal, setShowReabrirModal] = useState(false);
  const [motivoReapertura, setMotivoReapertura] = useState("");

  // Cronómetro
  const [cronoRunning, setCronoRunning] = useState(false);
  const [cronoSegundos, setCronoSegundos] = useState(0);
  const timerRef = useRef(null);

  // Cronómetro efecto
  useEffect(() => {
    if (cronoRunning) {
      timerRef.current = setInterval(() => {
        setCronoSegundos(s => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [cronoRunning]);

  const handleStartCrono = () => setCronoRunning(true);
  const handlePauseCrono = () => setCronoRunning(false);

  const [pdfEscaneadoUrl, setPdfEscaneadoUrl] = useState(evaluacionInicial?.pdfEscaneadoUrl || null);
  const handleStopCrono = () => {
    setCronoRunning(false);
    const m = Math.floor(cronoSegundos / 60);
    const s = cronoSegundos % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    setDuracionEjecutada(formatted);
  };
  const handleResetCrono = () => {
    setCronoRunning(false);
    setCronoSegundos(0);
  };

  // Autodetectar si excede tiempo en disciplinas presenciales con penalización
  useEffect(() => {
    if (rubrica?.presencial && rubrica?.penalizacionTiempo > 0 && duracionEjecutada) {
      const exc = excedeTiempo(duracionEjecutada, rubrica.tiempoMaximo);
      setExcedeAuto(exc);
    }
  }, [duracionEjecutada, rubrica]);

  // Cálculos de puntaje
  const puntajeBruto = useMemo(() => calcularPuntajeBruto(puntajes), [puntajes]);
  const penalizacionTiempoAplicada = (excedeAuto || penalizacionManual) ? (rubrica?.penalizacionTiempo || 0) : 0;
  const penalizacionesList = penalizacionTiempoAplicada > 0 ? [
    { tipo: "tiempo", puntos: penalizacionTiempoAplicada, motivo: sustentoTiempo || "Exceso de tiempo ejecutado" }
  ] : [];
  const puntajeTotal = useMemo(() => calcularPuntajeTotal(puntajeBruto, penalizacionesList), [puntajeBruto, penalizacionesList]);

  const { calificados, total: totalInds } = useMemo(() => contarIndicadoresCalificados(puntajes, rubrica), [puntajes, rubrica]);
  const completa = useMemo(() => estaCompleta(puntajes, rubrica), [puntajes, rubrica]);

  // Acreditaciones marcadas
  const marcadasAcr = Object.values(acreditacion).filter(Boolean).length;
  const tieneAcrIncompleta = rubrica?.presencial && marcadasAcr < 6;

  const currentPartIdRef = useRef(snap.id || evaluacionInicial?.participanteId || evaluacionInicial?.id);
  const loadedEvalIdRef = useRef(null);

  useEffect(() => {
    const targetId = snap.id || evaluacionInicial?.participanteId || evaluacionInicial?.id;
    if (targetId && targetId !== currentPartIdRef.current) {
      currentPartIdRef.current = targetId;
      loadedEvalIdRef.current = null;
      userClearedFirmaRef.current = false;
      userManuallyEditedJuradoRef.current = false;
    }
  }, [snap.id, evaluacionInicial]);

  // Sincronización completa de persistencia cuando evaluacionInicial carga desde Firestore (solo al cambiar de participante o carga inicial)
  useEffect(() => {
    const targetId = snap.id || evaluacionInicial?.participanteId || evaluacionInicial?.id;

    if (evaluacionInicial && (targetId !== currentPartIdRef.current || loadedEvalIdRef.current === null)) {
      currentPartIdRef.current = targetId;
      loadedEvalIdRef.current = evaluacionInicial.id;

      if (evaluacionInicial.puntajes && Object.keys(evaluacionInicial.puntajes).length > 0) {
        setPuntajes(evaluacionInicial.puntajes);
      }
      if (evaluacionInicial.duracionEjecutada != null) {
        setDuracionEjecutada(evaluacionInicial.duracionEjecutada);
      }
      if (evaluacionInicial.penalizaciones) {
        setPenalizacionManual(evaluacionInicial.penalizaciones.some(p => p.tipo === "tiempo"));
        const pMot = evaluacionInicial.penalizaciones.find(p => p.tipo === "tiempo")?.motivo;
        if (pMot) setSustentoTiempo(pMot);
      }
      if (evaluacionInicial.observacionesJurado != null) {
        setObservacionesJurado(evaluacionInicial.observacionesJurado);
      }
      if (evaluacionInicial.acreditacion) {
        setAcreditacion(evaluacionInicial.acreditacion);
      }
      if (evaluacionInicial.estado) {
        setEstado(evaluacionInicial.estado);
      }
      if (evaluacionInicial.jurado) {
        if (!userManuallyEditedJuradoRef.current) {
          if (evaluacionInicial.jurado.nombreCompleto && !isPlaceholderName(evaluacionInicial.jurado.nombreCompleto)) {
            setNombreJurado(evaluacionInicial.jurado.nombreCompleto.toUpperCase());
          } else {
            const bestNom = getBestNombreJurado(evaluacionInicial.jurado.numeroJurado || numeroJurado);
            if (bestNom) setNombreJurado(bestNom);
          }
          if (evaluacionInicial.jurado.dni) {
            setDniJurado(evaluacionInicial.jurado.dni);
          } else {
            const bestDni = getBestDniJurado(evaluacionInicial.jurado.numeroJurado || numeroJurado);
            if (bestDni) setDniJurado(bestDni);
          }
          if (evaluacionInicial.jurado.especialidad && !evaluacionInicial.jurado.especialidad.toUpperCase().startsWith('JURADO CALIFICADOR N.°')) {
            setEspecialidadJurado(evaluacionInicial.jurado.especialidad);
          } else {
            const bestCargo = getBestCargoJurado(evaluacionInicial.jurado.numeroJurado || numeroJurado);
            if (bestCargo) setEspecialidadJurado(bestCargo);
          }
          if (evaluacionInicial.jurado.numeroJurado) {
            setNumeroJurado(evaluacionInicial.jurado.numeroJurado);
          }
        }
        if (!userClearedFirmaRef.current && evaluacionInicial.jurado.firmaDataUrl) {
          setFirmaDataUrl(evaluacionInicial.jurado.firmaDataUrl);
        }
      }
      if (evaluacionInicial.pdfEscaneadoUrl != null) {
        setPdfEscaneadoUrl(evaluacionInicial.pdfEscaneadoUrl);
      }
      if (evaluacionInicial.firmadaEn || evaluacionInicial.updatedAt) {
        const fecha = evaluacionInicial.firmadaEn || evaluacionInicial.updatedAt;
        if (typeof fecha === 'string') {
          setUltimoGuardado(new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          setUltimoGuardado("Guardado");
        }
      }
    }
  }, [evaluacionInicial, snap.id]);

  // Clave de almacenamiento de firma en sesión aislada por cada jurado / disciplina / categoría única
  const userSignatureKey = useMemo(() => {
    const cleanName = (nombreJurado || user?.nombreCompleto || user?.nombre || "").trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanDni = (dniJurado || user?.dni || "").trim();
    const identity = cleanDni ? `dni_${cleanDni}` : (cleanName ? `nom_${cleanName}` : (user?.uid || 'anon'));
    return `jf_sig_${disciplinaId}_${categoria}_j${numeroJurado}_${identity}`;
  }, [disciplinaId, categoria, numeroJurado, nombreJurado, dniJurado, user]);

  const userClearedFirmaRef = useRef(false);

  // Auto-cargar firma guardada de la sesión si pertenece a ESTE jurado en específico y no ha sido borrada
  useEffect(() => {
    if (!userClearedFirmaRef.current && !firmaDataUrl && !evaluacionInicial?.jurado?.firmaDataUrl && userSignatureKey) {
      const cached = localStorage.getItem(userSignatureKey);
      if (cached && cached.startsWith('data:image')) {
        setFirmaDataUrl(cached);
      }
    }
  }, [evaluacionInicial, userSignatureKey]);

  // Guardar la firma en la sesión vinculada ÚNICAMENTE a esta jurada y categoría
  useEffect(() => {
    if (firmaDataUrl && userSignatureKey) {
      userClearedFirmaRef.current = false;
      try {
        localStorage.setItem(userSignatureKey, firmaDataUrl);
      } catch (err) {}
    }
  }, [firmaDataUrl, userSignatureKey]);

  // Autoguardado debounced
  useEffect(() => {
    if (estado === "firmada") return;
    const t = setTimeout(() => {
      handleGuardarBorrador(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [puntajes, duracionEjecutada, penalizacionManual, sustentoTiempo, observacionesJurado, acreditacion, nombreJurado, dniJurado, especialidadJurado, numeroJurado]);

  const handleGuardarBorrador = async (isAuto = false) => {
    if (estado === "firmada") return;
    // Protección contra autoguardados que sobrescriban fichas con datos existentes
    if (isAuto && Object.keys(puntajes).length === 0 && Object.keys(evaluacionInicial?.puntajes || {}).length > 0) {
      return;
    }
    try {
      if (!isAuto) setGuardando(true);

      const payload = {
        id: evaluacionInicial?.id || `${snap.id || 'P'}__${juradoUid}`,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        categoria,
        participanteId: snap.id || evaluacionInicial?.participanteId || "P1",
        participanteSnapshot: {
          codigoParticipante: snap.codigoParticipante || 'JF-2026',
          tituloObra: snap.tituloObra || '',
          urlTrabajo: snap.urlTrabajo || '',
          institucionNombre: snap.institucion?.nombre || snap.institucionNombre || '',
          codigoModular: snap.institucion?.codigoModular || snap.codigoModular || '',
          ugel: snap.institucion?.ugel || snap.ugel || 'UGEL 03',
          dre: snap.institucion?.dre || snap.dre || 'DRE LIMA METROPOLITANA',
          categoria,
          disciplinaLabel: rubrica?.disciplina || '',
          estudiantes: snap.estudiantes || [],
          docenteAsesor: snap.docenteAsesor || null
        },
        jurado: {
          uid: juradoUid,
          nombreCompleto: nombreJurado.toUpperCase(),
          dni: dniJurado,
          numeroJurado: parseInt(numeroJurado, 10) || 1,
          especialidad: especialidadJurado,
          firmaDataUrl: firmaDataUrl || null
        },
        puntajes,
        puntajeBruto,
        penalizaciones: penalizacionesList,
        puntajeTotal,
        puntajeMaximo: rubrica?.puntajeMaximo || 40,
        duracionEjecutada,
        observacionesJurado,
        acreditacion,
        pdfEscaneadoUrl: pdfEscaneadoUrl || null,
        fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
        lugar: contexto?.lugar || "UGEL 03",
        estado: "borrador"
      };

      await saveJFEvaluacion(payload);
      setUltimoGuardado(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (!isAuto && onToast) onToast("Borrador guardado en Firestore", "info");
    } catch (err) {
      if (!isAuto && onToast) onToast(`Error al guardar: ${err.message}`, "error");
    } finally {
      if (!isAuto) setGuardando(false);
    }
  };

  const [showIncomparecenciaModal, setShowIncomparecenciaModal] = useState(false);
  const [showExtemporaneoModal, setShowExtemporaneoModal] = useState(false);

  const handleMarcarExtemporaneo = async () => {
    try {
      setGuardando(true);
      const docId = evaluacionInicial?.id || `${snap.id || 'P'}__${juradoUid}`;
      const obsFinal = observacionesJurado
        ? `${observacionesJurado} | EXTEMPORÁNEO — FUERA DE HORARIO (0 PTOS)`
        : "EXTEMPORÁNEO — EL PARTICIPANTE SE PRESENTÓ FUERA DEL HORARIO ESTABLECIDO (0 PTOS)";

      let firmaAEmitir = firmaDataUrl;
      if (!firmaAEmitir && userSignatureKey) {
        try {
          const cached = localStorage.getItem(userSignatureKey);
          if (cached && cached.startsWith('data:image')) {
            firmaAEmitir = cached;
          }
        } catch (err) {}
      }
      if (!firmaAEmitir) {
        if (evaluacionInicial?.jurado?.firmaDataUrl) {
          firmaAEmitir = evaluacionInicial.jurado.firmaDataUrl;
        } else if (user?.firmaDataUrl?.startsWith('data:image')) {
          firmaAEmitir = user.firmaDataUrl;
        }
      }

      const payload = {
        id: docId,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        categoria,
        participanteId: snap.id || evaluacionInicial?.participanteId || "P1",
        participanteSnapshot: {
          codigoParticipante: snap.codigoParticipante || 'JF-2026',
          tituloObra: snap.tituloObra || '',
          urlTrabajo: snap.urlTrabajo || '',
          institucionNombre: snap.institucion?.nombre || snap.institucionNombre || snap.iiee || '',
          codigoModular: snap.institucion?.codigoModular || snap.codigoModular || '',
          ugel: snap.institucion?.ugel || snap.ugel || 'UGEL 03',
          dre: snap.institucion?.dre || snap.dre || 'DRE LIMA METROPOLITANA',
          categoria,
          disciplinaLabel: rubrica?.disciplina || '',
          estudiantes: snap.estudiantes || [],
          docenteAsesor: snap.docenteAsesor || null
        },
        jurado: {
          uid: juradoUid,
          nombreCompleto: (nombreJurado || user?.nombre || "JURADO").toUpperCase(),
          dni: dniJurado,
          numeroJurado: parseInt(numeroJurado, 10) || 1,
          especialidad: especialidadJurado,
          firmaDataUrl: firmaAEmitir || null
        },
        puntajes: {},
        puntajeBruto: 0,
        penalizaciones: [],
        puntajeTotal: 0,
        puntajeMaximo: rubrica?.puntajeMaximo || 40,
        duracionEjecutada: "00:00",
        observacionesJurado: obsFinal,
        acreditacion,
        fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
        lugar: contexto?.lugar || "UGEL 03",
        estado: "firmada",
        incomparecencia: false,
        extemporaneo: true,
        firmadaEn: new Date().toISOString()
      };

      await saveJFEvaluacion(payload);
      if (firmaAEmitir && !firmaDataUrl) {
        setFirmaDataUrl(firmaAEmitir);
      }
      setEstado("firmada");
      setShowExtemporaneoModal(false);
      if (onToast) onToast(`Participante marcado como EXTEMPORÁNEO (0 ptos)${firmaAEmitir ? ' con firma digital' : ''}.`, "info");
    } catch (err) {
      if (onToast) onToast(`Error al registrar extemporáneo: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleFirmarFinal = async () => {
    const ieNombre = snap.institucion?.nombre || snap.institucionNombre || snap.iiee || snap.institucion || snap.nombre || '';
    if (!ieNombre.trim()) {
      const msj = "Debe seleccionar o escribir la Institución Educativa antes de firmar.";
      if (onToast) onToast(msj, "error");
      alert(msj);
      return;
    }
    if (!categoria) {
      const msj = "La categoría es requerida para cerrar la ficha.";
      if (onToast) onToast(msj, "error");
      alert(msj);
      return;
    }
    if (!disciplinaId) {
      const msj = "La disciplina es requerida para cerrar la ficha.";
      if (onToast) onToast(msj, "error");
      alert(msj);
      return;
    }

    // Auto-resolver nombre si está vacío
    let nombreFinal = (nombreJurado || '').trim();
    if (!nombreFinal) {
      const bestNom = getBestNombreJurado(numeroJurado);
      if (bestNom) {
        nombreFinal = bestNom;
        setNombreJurado(bestNom);
      } else {
        nombreFinal = user?.nombre || "JURADO";
      }
    }

    // Auto-resolver DNI si está vacío o no tiene 8 dígitos
    let dniFinal = (dniJurado || '').trim();
    if (!validarDNI(dniFinal)) {
      const bestDni = getBestDniJurado(numeroJurado);
      if (validarDNI(bestDni)) {
        dniFinal = bestDni;
        setDniJurado(bestDni);
      }
    }

    if (!validarDNI(dniFinal)) {
      const msj = "El documento de identidad del jurado debe ser válido (8 a 12 dígitos). Por favor verifique el campo DNI / Documento en la sección de firma.";
      if (onToast) onToast(msj, "error");
      alert(msj);
      return;
    }

    // Resolver firma si existe en caché o perfil
    let firmaAEmitir = firmaDataUrl;
    if (!firmaAEmitir && userSignatureKey) {
      try {
        const cached = localStorage.getItem(userSignatureKey);
        if (cached && cached.startsWith('data:image')) {
          firmaAEmitir = cached;
        }
      } catch (err) {}
    }
    if (!firmaAEmitir) {
      if (evaluacionInicial?.jurado?.firmaDataUrl) {
        firmaAEmitir = evaluacionInicial.jurado.firmaDataUrl;
      } else if (user?.firmaDataUrl?.startsWith('data:image')) {
        firmaAEmitir = user.firmaDataUrl;
      }
    }

    try {
      setGuardando(true);
      const docId = evaluacionInicial?.id || `${snap.id || snap.codigoParticipante || 'P'}__${juradoUid}`;

      const payload = {
        id: docId,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        categoria,
        participanteId: snap.id || snap.codigoParticipante || evaluacionInicial?.participanteId || "P1",
        participanteSnapshot: {
          id: snap.id || snap.codigoParticipante || "P1",
          codigoParticipante: snap.codigoParticipante || snap.codigo || 'JF-2026',
          tituloObra: snap.tituloObra || snap.titulo || '',
          urlTrabajo: snap.urlTrabajo || snap.enlace || '',
          institucionNombre: ieNombre,
          codigoModular: snap.institucion?.codigoModular || snap.codigoModular || '',
          ugel: snap.institucion?.ugel || snap.ugel || 'UGEL 03',
          dre: snap.institucion?.dre || snap.dre || 'DRE LIMA METROPOLITANA',
          categoria,
          disciplinaLabel: rubrica?.disciplina || '',
          estudiantes: snap.estudiantes || [],
          docenteAsesor: snap.docenteAsesor || null
        },
        jurado: {
          uid: juradoUid,
          nombreCompleto: nombreFinal.toUpperCase(),
          dni: dniFinal,
          numeroJurado: parseInt(numeroJurado, 10) || 1,
          especialidad: especialidadJurado || "JURADO CALIFICADOR",
          firmaDataUrl: firmaAEmitir || null
        },
        puntajes,
        puntajeBruto,
        penalizaciones: penalizacionesList,
        puntajeTotal,
        puntajeMaximo: rubrica?.puntajeMaximo || 40,
        duracionEjecutada: duracionEjecutada || "00:00",
        observacionesJurado,
        acreditacion,
        pdfEscaneadoUrl: pdfEscaneadoUrl || null,
        fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
        lugar: contexto?.lugar || "UGEL 03",
        estado: "firmada",
        incomparecencia: false,
        firmadaEn: new Date().toISOString()
      };

      await saveJFEvaluacion(payload);
      if (firmaAEmitir && !firmaDataUrl) {
        setFirmaDataUrl(firmaAEmitir);
      }
      setEstado("firmada");
      setShowFirmarModal(false);
      if (onToast) onToast("¡Ficha cerrada y firmada exitosamente!", "success");
    } catch (err) {
      console.error("Error al firmar/cerrar ficha:", err);
      if (onToast) onToast(`Error al firmar: ${err.message}`, "error");
      alert(`Error al cerrar ficha: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleMarcarIncomparecencia = async () => {
    try {
      setGuardando(true);
      const docId = evaluacionInicial?.id || `${snap.id || 'P'}__${juradoUid}`;
      const obsFinal = observacionesJurado
        ? `${observacionesJurado} | INCOMPARECENCIA — NO SE PRESENTÓ`
        : "INCOMPARECENCIA — EL PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN";

      let firmaAEmitir = firmaDataUrl;
      if (!firmaAEmitir && userSignatureKey) {
        try {
          const cached = localStorage.getItem(userSignatureKey);
          if (cached && cached.startsWith('data:image')) {
            firmaAEmitir = cached;
          }
        } catch (err) {}
      }
      if (!firmaAEmitir) {
        if (evaluacionInicial?.jurado?.firmaDataUrl) {
          firmaAEmitir = evaluacionInicial.jurado.firmaDataUrl;
        } else if (user?.firmaDataUrl?.startsWith('data:image')) {
          firmaAEmitir = user.firmaDataUrl;
        }
      }

      const payload = {
        id: docId,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        categoria,
        participanteId: snap.id || evaluacionInicial?.participanteId || "P1",
        participanteSnapshot: {
          codigoParticipante: snap.codigoParticipante || 'JF-2026',
          tituloObra: snap.tituloObra || '',
          urlTrabajo: snap.urlTrabajo || '',
          institucionNombre: snap.institucion?.nombre || snap.institucionNombre || snap.iiee || '',
          codigoModular: snap.institucion?.codigoModular || snap.codigoModular || '',
          ugel: snap.institucion?.ugel || snap.ugel || 'UGEL 03',
          dre: snap.institucion?.dre || snap.dre || 'DRE LIMA METROPOLITANA',
          categoria,
          disciplinaLabel: rubrica?.disciplina || '',
          estudiantes: snap.estudiantes || [],
          docenteAsesor: snap.docenteAsesor || null
        },
        jurado: {
          uid: juradoUid,
          nombreCompleto: (nombreJurado || user?.nombre || "JURADO").toUpperCase(),
          dni: dniJurado,
          numeroJurado: parseInt(numeroJurado, 10) || 1,
          especialidad: especialidadJurado,
          firmaDataUrl: firmaAEmitir || null
        },
        puntajes: {},
        puntajeBruto: 0,
        penalizaciones: [],
        puntajeTotal: 0,
        puntajeMaximo: rubrica?.puntajeMaximo || 40,
        duracionEjecutada: "00:00",
        observacionesJurado: obsFinal,
        acreditacion,
        fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
        lugar: contexto?.lugar || "UGEL 03",
        estado: "firmada",
        incomparecencia: true,
        firmadaEn: new Date().toISOString()
      };

      await saveJFEvaluacion(payload);
      if (firmaAEmitir && !firmaDataUrl) {
        setFirmaDataUrl(firmaAEmitir);
      }
      setEstado("firmada");
      setShowIncomparecenciaModal(false);
      if (onToast) onToast(`Participante registrado con Incomparecencia (NSP)${firmaAEmitir ? ' y firma digital' : ''}.`, "warning");
    } catch (err) {
      if (onToast) onToast(`Error al registrar incomparecencia: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleReabrirFicha = async () => {
    if (!motivoReapertura.trim()) {
      if (onToast) onToast("Ingrese el motivo de la reapertura.", "error");
      return;
    }
    try {
      setGuardando(true);
      const docId = evaluacionInicial?.id || `${snap.id || 'P'}_${juradoUid}`;
      await reabrirJFEvaluacion(docId, motivoReapertura, user);
      setEstado("borrador");
      setShowReabrirModal(false);
      setMotivoReapertura("");
      if (onToast) onToast("Ficha reabierta para edición.", "info");
    } catch (err) {
      if (onToast) onToast(`Error al reabrir ficha: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarFicha = async () => {
    if (!window.confirm("¿Desea ELIMINAR completamente esta ficha de evaluación y dejarla EN BLANCO para calificar desde cero?")) return;
    try {
      setGuardando(true);
      const docId = evaluacionInicial?.id || `${snap.id || 'p'}__${juradoUid}`;
      await deleteJFEvaluacion(docId);
      const catDocId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;
      await deleteJFConsolidado(catDocId);
      await deleteJFActa(catDocId);
      setPuntajes({});
      setPenalizaciones([]);
      setDuracionEjecutada("00:00");
      setObservacionesJurado("");
      setFirmaDataUrl(null);
      setEstado("borrador");
      if (onToast) onToast("Ficha eliminada. Quedó completamente en blanco.", "info");
      if (onBack) onBack();
    } catch (err) {
      if (onToast) onToast(`Error al eliminar ficha: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleDescargarPDF = async () => {
    const banner = await loadImageDataURL('/membrete-juegos-florales.png');
    const evalSnapshot = {
      ...evaluacionInicial,
      disciplinaId,
      categoria,
      disciplinaLabel: rubrica?.disciplina,
      detalleCategoria: detCat,
      participanteSnapshot: snap,
      jurado: {
        nombreCompleto: nombreJurado,
        dni: dniJurado,
        numeroJurado,
        especialidad: especialidadJurado,
        firmaDataUrl
      },
      puntajes,
      puntajeBruto,
      penalizaciones: penalizacionesList,
      puntajeTotal,
      duracionEjecutada,
      observacionesJurado,
      acreditacion,
      incomparecencia: evaluacionInicial?.incomparecencia || false,
      etapa: "UGEL",
      fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
      lugar: contexto?.lugar || "UGEL 03"
    };
    generarFichaJFPDF(evalSnapshot, rubrica, banner);
  };

  const readOnly = estado === "firmada";

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, maxWidth: 1000, margin: '0 auto', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      {/* Banner de solo lectura si está firmada */}
      {readOnly && (
        <div style={{ background: C.g100, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={16} color={C.green} />
            Ficha firmada el {evaluacionInicial?.firmadaEn ? new Date(evaluacionInicial.firmadaEn).toLocaleString() : ''} — solo lectura
          </div>
          {isRole('admin') && (
            <button onClick={() => setShowReabrirModal(true)} style={{ background: C.amber, color: C.white, border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Reabrir Ficha
            </button>
          )}
        </div>
      )}

      {/* 4.1 Encabezado Obligatorio */}
      <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: `2px solid ${C.g100}`, paddingBottom: 16 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: C.navy2, textTransform: 'uppercase', margin: 0, letterSpacing: 0.5 }}>
          FICHA DE EVALUACIÓN DEL JURADO CALIFICADOR
        </h2>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy4, marginTop: 2 }}>
          JUEGOS FLORALES ESCOLARES NACIONALES 2026
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.g500, marginTop: 4 }}>
          {rubrica?.arte} — {rubrica?.numeral} {rubrica?.disciplina}
        </div>
      </div>

      {/* Selector interactivo de participante (Autocomplete sobre Padrón SICE) */}
      <JFSelectorParticipante
        disciplinaId={disciplinaId}
        categoria={categoria}
        participanteSeleccionado={snap}
        onSelectParticipante={(partSelected) => {
          if (onSelectOtroParticipante) {
            onSelectOtroParticipante(partSelected);
          }
        }}
        onRegistrarManual={() => {
          if (onSelectOtroParticipante) {
            onSelectOtroParticipante({
              id: `JF-MANUAL-${Date.now()}`,
              codigoParticipante: `JF26-MANUAL-${Math.floor(100 + Math.random() * 900)}`,
              institucionNombre: '',
              tituloObra: '',
              seudonimo: '',
              origen: 'manual'
            });
          }
        }}
        onRegistrarIEManual={() => {
          if (onSelectOtroParticipante) {
            onSelectOtroParticipante({
              ...snap,
              institucionNombre: '',
              iiee: ''
            });
          }
        }}
        tienesPuntajesCargados={Object.keys(puntajes).length > 0}
        readOnly={readOnly}
      />

      {/* Datos Generales Destacados en el Orden Especificado por Addendum 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
        {/* 1. INSTITUCIÓN EDUCATIVA */}
        <div style={{ gridColumn: '1 / -1', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>INSTITUCIÓN EDUCATIVA</div>
            {snap.origen === 'manual' && (
              <span style={{ background: '#FFFBEB', color: C.amber, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                Fuera de padrón
              </span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginTop: 2 }}>
            {snap.institucion?.nombre || snap.institucionNombre || snap.iiee || 'I. E. no registrada (Seleccionar arriba)'}
          </div>
        </div>

        {/* 2. CATEGORÍA */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: 'uppercase' }}>CATEGORÍA</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2, marginTop: 2 }}>
            Categoría {categoria} — {detCat}
          </div>
        </div>

        {/* 3. DISCIPLINA */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>DISCIPLINA</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2, marginTop: 2 }}>
            {rubrica?.numeral} {rubrica?.disciplina}
          </div>
        </div>

        {/* 4. TÍTULO DEL TRABAJO */}
        <div style={{ gridColumn: '1 / -1', background: C.white, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>TÍTULO DEL TRABAJO</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy2, marginTop: 2 }}>
            {snap.tituloObra || snap.titulo || <span style={{ color: C.amber, fontStyle: 'italic' }}>Sin título registrado (se puede firmar de todas formas)</span>}
          </div>
        </div>

        {/* 5. SEUDÓNIMO */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>SEUDÓNIMO</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginTop: 2 }}>
            {snap.seudonimo || '— (Sin seudónimo)'}
          </div>
        </div>

        {/* 6. PUNTAJE MÁXIMO */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>PUNTAJE MÁXIMO</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2, marginTop: 2 }}>
            {rubrica?.puntajeMaximo || 40} puntos
          </div>
        </div>

        <div style={{ fontSize: 12, color: C.g800 }}>
          <strong>Etapa:</strong> {contexto?.etapa || 'UGEL'} · <strong>DRE:</strong> {contexto?.dre || 'DRE LIMA METROPOLITANA'} · <strong>UGEL:</strong> {contexto?.ugel || 'UGEL 03'}
        </div>
        <div style={{ fontSize: 12, color: C.g800 }}>
          <strong>Código SICE:</strong> <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{snap.codigoParticipante || snap.codigo || '—'}</span>
        </div>
        <div style={{ fontSize: 12, color: C.g800 }}>
          <strong>Estudiante(s) (opcional):</strong> {Array.isArray(snap.estudiantes) && snap.estudiantes.some(e => e.nombres) ? snap.estudiantes.map(e => `${e.nombres || ''} ${e.apellidos || ''}`).join(', ') : '— (Evaluación a ciegas)'}
        </div>
        <div style={{ fontSize: 12, color: C.g800 }}>
          <strong>Docente asesor (opcional):</strong> {snap.docenteAsesor?.nombres ? `${snap.docenteAsesor.nombres || ''} ${snap.docenteAsesor.apellidos || ''}` : '—'}
        </div>
        <div style={{ fontSize: 12, color: C.g800, gridColumn: '1 / -1' }}>
          <strong>Fecha:</strong> {contexto?.fecha || ''} · <strong>Lugar:</strong> {contexto?.lugar || ''}
        </div>

        {/* Indicador de Sorteo / Orden en presencial */}
        {rubrica?.presencial && (
          <div style={{ gridColumn: '1 / -1', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700, color: C.green, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Orden de presentación asignado por sorteo: N.° {snap.ordenPresentacion || 0}</span>
            {snap.sorteoRealizadoEn && <span style={{ fontSize: 10, color: C.g500, fontWeight: 400 }}>Sorteado por {snap.sorteoRealizadoPor}</span>}
          </div>
        )}
      </div>

      {/* NOTA ORIENTATIVA PRESENCIAL VS NO PRESENCIAL */}
      {!rubrica?.presencial && (
        <div style={{ background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 11, color: C.g500 }}>
          Disciplina no presencial. La evaluación se realiza sobre el trabajo remitido; no se requiere la presencia de los estudiantes.
        </div>
      )}

      {/* 5.2 Checklist Acreditación para Disciplinas Presenciales */}
      {rubrica?.presencial && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 20, overflow: 'hidden' }}>
          <button
            onClick={() => setShowAcreditacion(!showAcreditacion)}
            style={{ width: '100%', background: C.g100, border: 'none', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 700, color: C.navy3 }}
          >
            <span>ACREDITACIÓN DE PARTICIPANTES (Mesa de Jurados)</span>
            <span style={{ fontSize: 11, color: marcadasAcr === 6 ? C.green : C.amber }}>
              {marcadasAcr} de 6 verificados {showAcreditacion ? '▲' : '▼'}
            </span>
          </button>
          {showAcreditacion && (
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {ACREDITACION_PRESENCIAL.map(req => (
                  <label key={req.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: C.g800, cursor: readOnly ? 'default' : 'pointer' }}>
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={!!acreditacion[req.id]}
                      onChange={e => setAcreditacion({ ...acreditacion, [req.id]: e.target.checked })}
                      style={{ marginTop: 2, accentColor: C.navy3 }}
                    />
                    <span>{req.texto}</span>
                  </label>
                ))}
              </div>
              {tieneAcrIncompleta && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 4, fontSize: 11, fontWeight: 600, color: C.amber }}>
                  Existen requisitos de acreditación sin verificar. Registre la observación correspondiente.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REGLAS O ESPECIFICACIONES DE TRABAJO (No presenciales / Enlace) */}
      {!rubrica?.presencial && (
        <div style={{ marginBottom: 20 }}>
          {rubrica?.requiereURL && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: 12, borderRadius: 6, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.navy4, marginBottom: 4 }}>ENLACE DEL TRABAJO O RECURSO MULTIMEDIA:</div>
              {snap.urlTrabajo ? (
                <a href={snap.urlTrabajo} target="_blank" rel="noopener noreferrer" style={{ color: C.navy4, fontWeight: 700, fontSize: 13, textDecoration: 'underline', wordBreak: 'break-all' }}>
                  {snap.urlTrabajo}
                </a>
              ) : (
                <div style={{ color: C.amber, fontSize: 12, fontWeight: 700 }}>No se registró el enlace del trabajo en la plataforma.</div>
              )}
            </div>
          )}

          {/* Medidas declaradas y reglas normativas */}
          {['pintura', 'escultura', 'arte_tradicional', 'fotografia'].includes(disciplinaId) && (
            <div style={{ background: C.g50, border: `1px solid ${C.border}`, padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4 }}>MEDIDAS DECLARADAS Y REGLAS DE PRESENTACIÓN:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.g800 }}>
                {rubrica?.reglas?.map((r, idx) => <li key={idx} style={{ marginBottom: 4 }}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 5.3 CRONÓMETRO DE PRESENTACIÓN (SI APLICA Y ES PRESENCIAL) */}
      {rubrica?.presencial && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⏱ CRONÓMETRO DE EVALUACIÓN / PRESENTACIÓN</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.g500 }}>(Tiempo máx: {rubrica.tiempoMaximo} min)</span>
              </div>
              <div style={{ fontSize: 11, color: C.g500, marginTop: 2 }}>
                Mide la duración de la presentación de la I. E. Si excede el tiempo, se aplicará automáticamente la penalización de {rubrica.penalizacionTiempo || 5} ptos.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'center', background: C.white, border: `2px solid ${cronoRunning ? C.navy3 : C.border}`, padding: '6px 16px', borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>TIEMPO TRANSCURRIDO</div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 800, color: cronoRunning ? C.red : C.navy2 }}>
                  {String(Math.floor(cronoSegundos / 60)).padStart(2, '0')}:{String(cronoSegundos % 60).padStart(2, '0')}
                </div>
              </div>

              {!readOnly && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!cronoRunning ? (
                    <button
                      type="button"
                      onClick={handleStartCrono}
                      style={{ background: C.navy3, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {cronoSegundos > 0 ? '▶ Continuar' : '▶ Iniciar Cronómetro'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseCrono}
                      style={{ background: C.amber, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ⏸ Pausar
                    </button>
                  )}

                  {cronoSegundos > 0 && (
                    <button
                      type="button"
                      onClick={handleStopCrono}
                      style={{ background: C.green, color: C.white, border: 'none', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      title="Fija este tiempo en la ficha"
                    >
                      ✓ Aplicar Tiempo
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetCrono}
                    style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                  >
                    Reiniciar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.navy2 }}>Duración Ejecutada Registrada:</span>
              <input
                type="text"
                disabled={readOnly}
                placeholder="MM:SS"
                maxLength={5}
                value={duracionEjecutada}
                onChange={e => setDuracionEjecutada(e.target.value)}
                style={{ width: 80, padding: '4px 8px', borderRadius: 4, border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono'", fontSize: 12, textAlign: 'center', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="chkPenal"
                disabled={readOnly}
                checked={excedeAuto || penalizacionManual}
                onChange={e => setPenalizacionManual(e.target.checked)}
                style={{ accentColor: C.red }}
              />
              <label htmlFor="chkPenal" style={{ fontSize: 12, fontWeight: 700, color: C.red }}>
                Excede el tiempo establecido (−{rubrica.penalizacionTiempo || 5} ptos)
              </label>
            </div>
          </div>

          {(excedeAuto || penalizacionManual) && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                disabled={readOnly}
                placeholder="Sustento o motivo de la penalización..."
                value={sustentoTiempo}
                onChange={e => setSustentoTiempo(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
              />
              <div style={{ fontSize: 11, color: C.amber, marginTop: 4, fontWeight: 600 }}>
                Se aplicará la penalización de cinco (5) puntos según las bases.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leyenda de la escala */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11, color: C.g500 }}>
        <span>Escala: <strong>4 Logro destacado</strong> · <strong>3 Logro esperado</strong> · <strong>2 En proceso</strong> · <strong>1 En inicio</strong></span>
        <span>{calificados} de {totalInds} indicadores calificados</span>
      </div>

      {/* 4.2 Tabla de Calificación con Columna PUNTAJE OBTENIDO */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: `1px solid ${C.border}` }}>
          <thead>
            <tr style={{ background: C.navy3, color: C.white, textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '22%' }}>CRITERIOS</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}` }}>INDICADORES</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '12%', textAlign: 'center' }}>PUNTAJE MÁXIMO</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '24%', textAlign: 'center', minWidth: 160 }}>PUNTAJE OBTENIDO</th>
            </tr>
          </thead>
          <tbody>
            {(rubrica?.criterios || []).flatMap((crit, critIdx) => {
              const numInds = crit.indicadores.length;
              return crit.indicadores.map((ind, indIdx) => {
                const valActual = puntajes[ind.id];
                const isAlt = (critIdx + indIdx) % 2 === 1;

                return (
                  <tr key={ind.id} style={{ background: isAlt ? C.g50 : C.white }}>
                    {indIdx === 0 && (
                      <td
                        rowSpan={numInds}
                        style={{
                          padding: '10px 12px',
                          border: `1px solid ${C.border}`,
                          fontWeight: 700,
                          color: C.navy2,
                          verticalAlign: 'top',
                          background: C.g100
                        }}
                      >
                        {crit.criterio}
                      </td>
                    )}
                    <td style={{ padding: '10px 12px', border: `1px solid ${C.border}`, color: C.g800 }}>
                      {ind.texto}
                    </td>
                    <td style={{ padding: '10px 12px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                      4
                    </td>
                    <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {[1, 2, 3, 4].map(num => {
                          const isSel = valActual === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              disabled={readOnly}
                              title={`${num} ${num === 4 ? 'Logro destacado' : num === 3 ? 'Logro esperado' : num === 2 ? 'En proceso' : 'En inicio'}`}
                              onClick={() => setPuntajes({ ...puntajes, [ind.id]: num })}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                border: `1px solid ${isSel ? C.navy3 : C.border}`,
                                background: isSel ? C.navy3 : C.white,
                                color: isSel ? C.white : C.g500,
                                fontWeight: isSel ? 700 : 500,
                                fontFamily: "'JetBrains Mono'",
                                fontSize: 13,
                                cursor: readOnly ? 'default' : 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
            {/* Fila TOTAL */}
            <tr style={{ background: C.g100, fontWeight: 700 }}>
              <td colSpan={2} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, textAlign: 'right' }}>
                TOTAL BRUTO
              </td>
              <td style={{ padding: '10px 12px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'" }}>
                {rubrica?.puntajeMaximo}
              </td>
              <td style={{ padding: '10px 12px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'", fontSize: 15, color: C.navy2 }}>
                {puntajeBruto}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4.4 Resumen de Puntaje */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.g100, border: `1px solid ${C.border}`, padding: '16px 20px', borderRadius: 6, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: C.g500 }}>Puntaje bruto: <strong>{puntajeBruto}</strong> / {rubrica?.puntajeMaximo}</div>
          <div style={{ fontSize: 12, color: penalizacionTiempoAplicada > 0 ? C.red : C.g500 }}>Penalizaciones: <strong>− {penalizacionTiempoAplicada} ptos</strong></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.g500, textTransform: 'uppercase' }}>PUNTAJE TOTAL FINAL</div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 28, fontWeight: 800, color: C.navy2 }}>
            {puntajeTotal} <span style={{ fontSize: 14, color: C.g500 }}>/ {rubrica?.puntajeMaximo}</span>
          </div>
        </div>
      </div>

      {/* 4.5 Observaciones del Jurado */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          OBSERVACIONES DEL JURADO (Máx. 500 caracteres)
        </label>
        <textarea
          rows={3}
          disabled={readOnly}
          maxLength={500}
          value={observacionesJurado}
          onChange={e => setObservacionesJurado(e.target.value)}
          placeholder="Ingrese observaciones adicionales si corresponde..."
          style={{ width: '100%', padding: 10, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "'DM Sans'" }}
        />
        <div style={{ fontSize: 10, color: C.g500, textAlign: 'right', marginTop: 2 }}>
          {observacionesJurado.length} / 500 caracteres
        </div>
      </div>

      {/* 4.6 Bloque de Firma Digital Obligatorio (ADDENDUM 3 - IDENTIDAD POR CREDENCIAL) */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, background: C.g50, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, textTransform: 'uppercase', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>FIRMA DEL JURADO CALIFICADOR</span>
          <span style={{ fontSize: 11, color: C.gold, fontWeight: 800 }}>JURADO N.° {numeroJurado}</span>
        </div>

        {/* Identidad del Jurado (Pre-cargada por defecto desde la matriz oficial pero editable) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 4 }}>
              NOMBRES Y APELLIDOS DEL JURADO *
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={nombreJurado}
              onChange={e => {
                userManuallyEditedJuradoRef.current = true;
                setNombreJurado(e.target.value.toUpperCase());
              }}
              placeholder="APELLIDOS Y NOMBRES"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.navy2, background: readOnly ? C.g100 : C.white }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 4 }}>
              DNI / CÉDULA *
            </label>
            <input
              type="text"
              disabled={readOnly}
              maxLength={12}
              value={dniJurado}
              onChange={e => {
                userManuallyEditedJuradoRef.current = true;
                setDniJurado(e.target.value.replace(/\D/g, ''));
              }}
              placeholder="DNI / CARNÉ EXT."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${dniJurado && !validarDNI(dniJurado) ? C.red : C.border}`,
                fontFamily: "'JetBrains Mono'",
                fontSize: 12,
                fontWeight: 700,
                color: C.navy2,
                background: readOnly ? C.g100 : C.white
              }}
            />
            {dniJurado && !validarDNI(dniJurado) && (
              <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>El documento debe tener entre 8 y 12 dígitos.</div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 4 }}>
              CARGO
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={especialidadJurado}
              onChange={e => {
                userManuallyEditedJuradoRef.current = true;
                setEspecialidadJurado(e.target.value);
              }}
              placeholder="Ej: DOCENTE / MAGISTER EN EDUCACIÓN"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, color: C.navy2, background: readOnly ? C.g100 : C.white }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.navy2, display: 'block', marginBottom: 4 }}>
              ASIENTO JURADO *
            </label>
            <select
              disabled={readOnly}
              value={numeroJurado}
              onChange={e => {
                const newNum = parseInt(e.target.value, 10);
                setNumeroJurado(newNum);
                userManuallyEditedJuradoRef.current = false;
                const juradosDisc = getJuradosDeDisciplina(disciplinaId, categoria);
                const jMatch = juradosDisc.find(j => j.numeroJurado === newNum);
                if (jMatch && jMatch.nombreCompleto) {
                  setNombreJurado(jMatch.nombreCompleto.toUpperCase());
                  setDniJurado(jMatch.dni || "");
                  setEspecialidadJurado(jMatch.cargo || "JURADO CALIFICADOR");
                }
              }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.navy2, background: readOnly ? C.g100 : C.white }}
            >
              <option value={1}>Jurado N.° 1</option>
              <option value={2}>Jurado N.° 2</option>
              <option value={3}>Jurado N.° 3</option>
            </select>
          </div>
        </div>

        {!readOnly && (
          <div style={{ fontSize: 11, color: C.g500, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span>* Datos precargados automáticamente de la matriz oficial. Puede modificarlos si evalúa un jurado suplente.</span>
            <button
              type="button"
              onClick={() => {
                userManuallyEditedJuradoRef.current = false;
                const juradosDisc = getJuradosDeDisciplina(disciplinaId, categoria);
                const jMatch = juradosDisc.find(j => j.numeroJurado === numeroJurado) || construirBloqueJurado(user?.email, categoria);
                if (jMatch) {
                  if (jMatch.nombreCompleto) setNombreJurado(jMatch.nombreCompleto.toUpperCase());
                  if (jMatch.dni) setDniJurado(jMatch.dni);
                  if (jMatch.cargo) setEspecialidadJurado(jMatch.cargo);
                  if (jMatch.numeroJurado) setNumeroJurado(jMatch.numeroJurado);
                }
              }}
              style={{ background: 'none', border: 'none', color: C.navy3, textDecoration: 'underline', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
            >
              Restablecer datos de la matriz oficial (Jurado N.° {numeroJurado})
            </button>
          </div>
        )}

        {/* Firma Canvas Digital */}
        <div style={{ maxWidth: 380, margin: '0 auto', textAlign: 'center' }}>
          {!readOnly ? (
            <FirmaDigital
              value={firmaDataUrl}
              storageKey={userSignatureKey}
              onChange={(url) => {
                if (!url) {
                  userClearedFirmaRef.current = true;
                  if (userSignatureKey) {
                    try {
                      localStorage.removeItem(userSignatureKey);
                    } catch (e) {}
                  }
                }
                setFirmaDataUrl(url);
              }}
              label="Dibujar Firma Digital del Jurado Calificador"
            />
          ) : (
            firmaDataUrl && (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <img src={firmaDataUrl} alt="Firma" style={{ maxHeight: 60, objectFit: 'contain' }} />
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4, marginTop: 4, fontSize: 11, fontWeight: 700 }}>
                  Firma de {nombreJurado} (DNI {dniJurado})
                </div>
              </div>
            )
          )}
        </div>

        {/* Opción de Subir PDF Escaneado (Firma Manuscrita en Físico) */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, marginBottom: 4 }}>
            Subir Ficha PDF Escaneada (Firma Manuscrita en Físico)
          </div>
          <div style={{ fontSize: 11, color: C.g500, marginBottom: 8 }}>
            Si la evaluación fue firmada en papel impreso a manuscrito, puede adjuntar el documento PDF escaneado.
          </div>
          <input
            type="file"
            accept="application/pdf,image/*"
            disabled={readOnly}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                  setPdfEscaneadoUrl(evt.target.result);
                  if (onToast) onToast("PDF escaneado cargado correctamente.", "success");
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ fontSize: 12 }}
          />
          {pdfEscaneadoUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>✓ PDF Escaneado Adjunto</span>
              <a href={pdfEscaneadoUrl} download={`Ficha_Escaneada_${snap.codigoParticipante || 'part'}.pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.navy3, fontWeight: 700 }}>Ver / Descargar PDF Escaneado</a>
            </div>
          )}
        </div>
      </div>

      {/* Barra Sticky Inferior de Acciones */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: C.white,
        borderTop: `2px solid ${C.border}`,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 20,
        boxShadow: '0 -4px 16px rgba(15,23,42,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.g500 }}>
          <span>{ultimoGuardado ? `Guardado a las ${ultimoGuardado}` : 'Cambios sin guardar'}</span>
          <span style={{ fontWeight: 700, color: C.navy3 }}>Ficha D1</span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%'
        }}>
          <button onClick={onBack} style={{ flex: '1 1 auto', minWidth: 90, background: C.white, color: C.g800, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
            Volver
          </button>

          {!readOnly && (
            <>
              <button
                disabled={guardando}
                onClick={() => setShowIncomparecenciaModal(true)}
                style={{ flex: '1 1 auto', minWidth: 140, background: C.red, color: C.white, border: 'none', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                title="Marcar si el participante no se presentó a la evaluación"
              >
                Incomparecencia (NSP)
              </button>

              <button
                disabled={guardando}
                onClick={() => setShowExtemporaneoModal(true)}
                style={{ flex: '1 1 auto', minWidth: 140, background: C.amber, color: C.white, border: 'none', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                title="Marcar si el participante se presentó fuera del horario establecido (Nota 0)"
              >
                Extemporáneo (0 ptos)
              </button>

              <button
                disabled={guardando}
                onClick={() => handleGuardarBorrador(false)}
                style={{ flex: '1 1 auto', minWidth: 130, background: C.white, color: C.navy3, border: `1px solid ${C.navy3}`, borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
              >
                Guardar borrador
              </button>

              <button
                type="button"
                onClick={() => setShowFirmarModal(true)}
                style={{ flex: '1 1 auto', minWidth: 150, background: C.navy3, color: C.white, border: 'none', borderRadius: 6, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 6px rgba(12,25,41,0.15)' }}
              >
                Cerrar o firmar ficha
              </button>
            </>
          )}

          {readOnly && (
            <button
              type="button"
              onClick={() => setEstado("borrador")}
              style={{ flex: '1 1 auto', minWidth: 130, background: C.navy3, color: C.white, border: 'none', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
            >
              Reabrir / Editar
            </button>
          )}

          {(evaluacionInicial || estado === "firmada" || estado === "cerrada") && (
            <button
              type="button"
              disabled={guardando}
              onClick={handleEliminarFicha}
              style={{ flex: '1 1 auto', minWidth: 160, background: '#FEF2F2', color: C.red, border: '1px solid #FCA5A5', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
              title="Eliminar esta evaluación y dejarla en blanco"
            >
              Poner en Blanco (Eliminar)
            </button>
          )}

          <button type="button" onClick={handleDescargarPDF} style={{ flex: '1 1 auto', minWidth: 120, background: C.gold, color: C.navy1, border: 'none', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Modal de Confirmación de Firma / Cierre */}
      {showFirmarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.white, padding: 24, borderRadius: 8, maxWidth: 480, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.navy2 }}>¿Cerrar ficha de evaluación?</h3>

            {/* Avisos en #B45309 para campos opcionales no llenados */}
            {(!snap.tituloObra && !snap.titulo) && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 12px', borderRadius: 6, margin: '12px 0', fontSize: 12, color: C.amber, lineHeight: 1.4 }}>
                <strong>Aviso:</strong> El título del trabajo no ha sido registrado. Se registrará sin título.
              </div>
            )}

            {!firmaDataUrl && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '10px 12px', borderRadius: 6, margin: '12px 0', fontSize: 12, color: C.navy4, lineHeight: 1.4 }}>
                <strong>Nota sobre firma:</strong> No ha dibujado firma digital en pantalla. La ficha se cerrará dejando la línea vacía para **firma manuscrita en físico** en la ficha PDF.
              </div>
            )}

            <p style={{ fontSize: 12, color: C.g800, margin: '12px 0 20px 0', lineHeight: 1.5 }}>
              Al cerrar, la ficha quedará registrada como <strong>firmada</strong> en el sistema y podrá descargarse el PDF oficial.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" disabled={guardando} onClick={() => setShowFirmarModal(false)} style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="button" disabled={guardando} onClick={handleFirmarFinal} style={{ background: C.navy3, color: C.white, border: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: guardando ? 'wait' : 'pointer' }}>
                {guardando ? "Cerrando..." : "Confirmar y Cerrar Ficha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Incomparecencia (NSP) */}
      {showIncomparecenciaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.white, padding: 24, borderRadius: 8, maxWidth: 450, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.red }}>¿Marcar Incomparecencia (NSP)?</h3>
            <p style={{ fontSize: 12, color: C.g800, margin: '12px 0', lineHeight: 1.5 }}>
              Esta acción registrará que el participante de la I. E. <strong>{snap.institucion?.nombre || snap.institucionNombre || snap.iiee || 'seleccionada'}</strong> <strong>NO SE PRESENTÓ</strong> a la evaluación. Se asignará puntaje 0 y se marcará la observación oficial.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" disabled={guardando} onClick={() => setShowIncomparecenciaModal(false)} style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="button" disabled={guardando} onClick={handleMarcarIncomparecencia} style={{ background: C.red, color: C.white, border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: guardando ? 'wait' : 'pointer' }}>
                {guardando ? "Guardando..." : "Confirmar NSP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Extemporáneo (Fuera de Hora) */}
      {showExtemporaneoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.white, padding: 24, borderRadius: 8, maxWidth: 450, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.amber }}>¿Marcar EXTEMPORÁNEO (Puntaje 0)?</h3>
            <p style={{ fontSize: 12, color: C.g800, margin: '12px 0', lineHeight: 1.5 }}>
              Esta acción registrará que el participante de la I. E. <strong>{snap.institucion?.nombre || snap.institucionNombre || snap.iiee || 'seleccionada'}</strong> se presentó <strong>FUERA DEL HORARIO ESTABLECIDO</strong>. Se asignará nota <strong>0 (cero)</strong> y se registrará la observación correspondiente.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" disabled={guardando} onClick={() => setShowExtemporaneoModal(false)} style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="button" disabled={guardando} onClick={handleMarcarExtemporaneo} style={{ background: C.amber, color: C.white, border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: guardando ? 'wait' : 'pointer' }}>
                {guardando ? "Guardando..." : "Confirmar Extemporáneo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reapertura de Ficha (Admin) */}
      {showReabrirModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: C.white, padding: 24, borderRadius: 8, maxWidth: 450, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.amber }}>Reabrir Ficha Firmada</h3>
            <p style={{ fontSize: 12, color: C.g800, margin: '10px 0' }}>
              Esta acción quedará auditada con su usuario y fecha. Ingrese el motivo formal de reapertura:
            </p>
            <textarea
              rows={3}
              value={motivoReapertura}
              onChange={e => setMotivoReapertura(e.target.value)}
              placeholder="Motivo de la reapertura..."
              style={{ width: '100%', padding: 8, borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowReabrirModal(false)} style={{ background: C.g100, color: C.g800, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleReabrirFicha} style={{ background: C.amber, color: C.white, border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Confirmar Reapertura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
