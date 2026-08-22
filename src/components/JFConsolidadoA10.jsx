import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { DISCIPLINAS_UGEL03, getCategoriasHabilitadas, getContextoEvaluacion, getDisciplinaUGEL03 } from '../data/juegosFloralesUGEL03';
import { getParticipantes } from '../data/juegosFloralesPadronSICE';
import { getJuradosDeDisciplina } from '../data/juegosFloralesCredenciales';
import { CATEGORIAS_JF, C } from '../data/juegosFloralesCatalogos';
import {
  construirConsolidadoA10,
  detectarEmpatesTop3,
  calcularOrdenMerito,
  filtrarEvaluacionesValidas
} from '../utils/juegosFloralesHelpers';
import {
  subscribeJFParticipantes,
  subscribeJFEvaluaciones,
  subscribeJFConsolidado,
  setJFConsolidado,
  cerrarJFConsolidado
} from '../firebase/dbJuegosFlorales';
import { generarA10PDF } from '../pdf/generarA10PDF';
import { loadImageDataURL } from '../pdf/membrete';
import Icon from './Icon';

export default function JFConsolidadoA10({ user, isRole, onToast, onGenerarA11, initialDisciplinaId }) {
  const [disciplinaId, setDisciplinaId] = useState(() => initialDisciplinaId || user?.disciplinaId || "teatro");
  const categoriasHabilitadas = useMemo(() => getCategoriasHabilitadas(disciplinaId), [disciplinaId]);
  const [categoria, setCategoria] = useState(categoriasHabilitadas[0] || "D");

  useEffect(() => {
    if (initialDisciplinaId) {
      setDisciplinaId(initialDisciplinaId);
    } else if (user?.disciplinaId) {
      setDisciplinaId(user.disciplinaId);
    }
  }, [user, initialDisciplinaId]);

  useEffect(() => {
    const cats = getCategoriasHabilitadas(disciplinaId);
    if (cats.length > 0 && !cats.includes(categoria)) {
      setCategoria(cats[0]);
    }
  }, [disciplinaId]);

  const discInfo = useMemo(() => getDisciplinaUGEL03(disciplinaId), [disciplinaId]);
  const contexto = useMemo(() => getContextoEvaluacion(disciplinaId), [disciplinaId]);

  // Datos en vivo de Firestore
  const [fsParticipantes, setFsParticipantes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [consolidadoGuardado, setConsolidadoGuardado] = useState(null);

  // Subscripción a datos
  useEffect(() => {
    const unSubP = subscribeJFParticipantes({ disciplinaId, categoria, etapa: "UGEL" }, setFsParticipantes);
    const unSubE = subscribeJFEvaluaciones({ disciplinaId, categoria }, setEvaluaciones);
    const docId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;
    const unSubC = subscribeJFConsolidado(docId, setConsolidadoGuardado);

    return () => {
      unSubP();
      unSubE();
      unSubC();
    };
  }, [disciplinaId, categoria]);

  // Lista Pre-Cargada Nativamente (SICE Padrón Local + Firestore)
  const participantes = useMemo(() => {
    const siceList = getParticipantes(disciplinaId, categoria);
    const map = new Map();

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

    fsParticipantes.forEach(p => {
      const cod = p.codigoParticipante || p.codigo || p.id;
      map.set(cod, p);
    });

    return Array.from(map.values());
  }, [disciplinaId, categoria, fsParticipantes]);

  // Estados de edición del consolidado
  const [distrito, setDistrito] = useState("Pueblo Libre");
  const [criterioDesempate, setCriterioDesempate] = useState("");
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);
  const [ordenManualMap, setOrdenManualMap] = useState({}); // key: participanteId -> ordenInt
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (consolidadoGuardado) {
      if (consolidadoGuardado.distrito) setDistrito(consolidadoGuardado.distrito);
      if (consolidadoGuardado.criterioDesempate) setCriterioDesempate(consolidadoGuardado.criterioDesempate);
    }
  }, [consolidadoGuardado]);

  // Evaluaciones filtradas y desduplicadas
  const evsValidas = useMemo(() => {
    return filtrarEvaluacionesValidas(evaluaciones, disciplinaId, categoria, participantes);
  }, [evaluaciones, disciplinaId, categoria, participantes]);

  // Construcción automática de filas
  const filasBase = useMemo(() => {
    return construirConsolidadoA10(participantes, evsValidas);
  }, [participantes, evsValidas]);

  // Filas combinadas con orden manual
  const filasConOrdenManual = useMemo(() => {
    return filasBase.map((f, idx) => ({
      ...f,
      ordenManual: ordenManualMap[f.participanteId] != null ? ordenManualMap[f.participanteId] : (f.ordenManual != null ? f.ordenManual : idx)
    }));
  }, [filasBase, ordenManualMap]);

  const filasFinales = useMemo(() => {
    return calcularOrdenMerito(filasConOrdenManual);
  }, [filasConOrdenManual]);

  const [pdfEscaneadoUrl, setPdfEscaneadoUrl] = useState(consolidadoGuardado?.pdfEscaneadoUrl || null);

  useEffect(() => {
    if (consolidadoGuardado?.pdfEscaneadoUrl) {
      setPdfEscaneadoUrl(consolidadoGuardado.pdfEscaneadoUrl);
    }
  }, [consolidadoGuardado]);

  // Extracción de Jurados desde matriz de credenciales (ADDENDUM 3) + evaluaciones firmadas
  const jurados = useMemo(() => {
    const juradosMatriz = getJuradosDeDisciplina(disciplinaId, categoria);
    const mapFirmas = {};

    evsValidas.forEach(e => {
      if (e.jurado && e.jurado.numeroJurado) {
        const jNum = e.jurado.numeroJurado;
        // Preferir la evaluación que tenga firma Data URL
        if (!mapFirmas[jNum] || (e.jurado.firmaDataUrl && !mapFirmas[jNum].firmaDataUrl)) {
          mapFirmas[jNum] = e.jurado;
        }
      }
    });

    return [1, 2, 3].map(num => {
      const infoMatriz = juradosMatriz.find(j => j.numeroJurado === num);
      const evalJurado = mapFirmas[num];

      const evalNombreValido = evalJurado?.nombreCompleto && !evalJurado.nombreCompleto.toUpperCase().startsWith('JURADO ');
      const nombreCompleto = evalNombreValido ? evalJurado.nombreCompleto : (infoMatriz?.nombreCompleto || "────────");
      const dni = (evalJurado?.dni && evalJurado.dni !== "00000000") ? evalJurado.dni : (infoMatriz?.dni || "────────");

      return {
        numeroJurado: num,
        nombreCompleto,
        dni,
        cargo: evalJurado?.especialidad || infoMatriz?.cargo || "JURADO CALIFICADOR",
        firmaDataUrl: evalJurado?.firmaDataUrl || null,
        firmado: !!(evalJurado?.firmaDataUrl || evalJurado?.estado === "firmada" || evalJurado?.estado === "cerrada")
      };
    });
  }, [disciplinaId, categoria, evsValidas]);

  const [juradosEditados, setJuradosEditados] = useState({});

  const juradosFinales = useMemo(() => {
    return jurados.map(j => {
      const ed = juradosEditados[j.numeroJurado];
      return {
        ...j,
        nombreCompleto: ed?.nombreCompleto != null ? ed.nombreCompleto.toUpperCase() : j.nombreCompleto,
        dni: ed?.dni != null ? ed.dni : j.dni
      };
    });
  }, [jurados, juradosEditados]);

  // Fichas firmadas conteo
  const totalFichasEsperadas = participantes.length * 3;
  const totalFichasFirmadas = evsValidas.filter(e => e.estado === "firmada").length;
  const juradosCompletos = juradosFinales.every(j => j.nombreCompleto !== "────────" && j.nombreCompleto !== "");

  // Detección de empates en Top 3
  const empatesTop3 = useMemo(() => detectarEmpatesTop3(filasFinales), [filasFinales]);
  const hayEmpatePendiente = empatesTop3.length > 0 && !criterioDesempate.trim();

  const estado = consolidadoGuardado?.estado || "borrador";
  const readOnly = estado === "cerrado";

  // Reordenar filas empatadas manualmente
  const handleMoverFila = (index, direccion) => {
    if (readOnly) return;
    const n = filasFinales.length;
    const targetIndex = index + direccion;
    if (targetIndex < 0 || targetIndex >= n) return;

    const newMap = { ...ordenManualMap };
    const fActual = filasFinales[index];
    const fTarget = filasFinales[targetIndex];

    newMap[fActual.participanteId] = targetIndex;
    newMap[fTarget.participanteId] = index;

    setOrdenManualMap(newMap);
  };

  const handleGuardarConsolidado = async () => {
    try {
      setGuardando(true);
      const docId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;
      const payload = {
        id: docId,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        disciplinaLabel: discInfo?.label || disciplinaId,
        categoria,
        lugar: discInfo?.sedeId === "grau" ? "Auditorio I. E. Miguel Grau" : discInfo?.sedeId === "tgf" ? "Auditorio I. E. Teresa Gonzales de Fanning" : "UGEL 03",
        region: "Lima",
        provincia: "Lima",
        distrito,
        fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
        jurados: juradosFinales,
        filas: filasFinales,
        criterioDesempate,
        pdfEscaneadoUrl: pdfEscaneadoUrl || null,
        estado: estado || "borrador"
      };
      await setJFConsolidado(docId, payload);
      if (onToast) onToast("Consolidado A10 guardado en Firestore.", "success");
    } catch (err) {
      if (onToast) onToast(`Error al guardar consolidado: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarConsolidado = async () => {
    if (participantes.length === 0) {
      if (onToast) onToast("No hay participantes inscritos en esta disciplina y categoría.", "error");
      return;
    }
    if (!juradosCompletos) {
      if (onToast) onToast("No se puede cerrar el A10: se requieren las tres fichas firmadas por los jurados.", "error");
      return;
    }
    if (hayEmpatePendiente) {
      if (onToast) onToast("Debe ingresar el criterio de desempate para resolver los empates en los tres primeros lugares.", "error");
      return;
    }

    try {
      setGuardando(true);
      await handleGuardarConsolidado();
      const docId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;
      await cerrarJFConsolidado(docId, user);
      if (onToast) onToast("¡Anexo A10 cerrado correctamente!", "success");
    } catch (err) {
      if (onToast) onToast(`Error al cerrar: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleExportarPDF = async () => {
    const banner = await loadImageDataURL('/membrete-juegos-florales.png');
    const consData = {
      id: `JFEN-2026__UGEL__${disciplinaId}__${categoria}`,
      eventoId: "JFEN-2026",
      etapa: "UGEL",
      disciplinaId,
      disciplinaLabel: discInfo?.label,
      categoria,
      region: "Lima",
      provincia: "Lima",
      distrito,
      fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
      jurados: juradosFinales,
      filas: filasFinales,
      criterioDesempate
    };
    generarA10PDF(consData, banner);
  };

  const handleExportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Consolidado
    const enc = [
      ["ANEXO A10 — FORMATO CONSOLIDADO DE EVALUACIÓN"],
      ["JUEGOS FLORALES ESCOLARES NACIONALES 2026 — ETAPA UGEL"],
      [],
      ["Etapa:", "UGEL", "Lugar:", `Lima/Lima/${distrito}`],
      ["Disciplina:", discInfo?.label || disciplinaId, "Categoría:", categoria, "Fecha:", contexto?.fecha || ""],
      []
    ];

    const tableHeaders = ["DRE/UGEL", "I. E.", "Jurado 1", "Jurado 2", "Jurado 3", "Total", "Puesto"];
    if (mostrarOpcionales) {
      tableHeaders.unshift("Código Participante");
      tableHeaders.push("Título de la obra", "Seudónimo", "Promedio");
    }

    const tableRows = filasFinales.map(f => {
      const row = [
        f.dreUgel,
        f.institucion,
        f.jurado1 != null ? f.jurado1 : "—",
        f.jurado2 != null ? f.jurado2 : "—",
        f.jurado3 != null ? f.jurado3 : "—",
        f.total != null ? f.total : "—",
        f.puesto != null ? `${f.puesto}.°` : "—"
      ];
      if (mostrarOpcionales) {
        row.unshift(f.codigoParticipante);
        row.push(f.tituloObra, f.seudonimo || '—', f.promedio != null ? f.promedio : "—");
      }
      return row;
    });

    const sheet1Data = [...enc, tableHeaders, ...tableRows];
    if (criterioDesempate) {
      sheet1Data.push([], ["Criterio de desempate aplicado:", criterioDesempate]);
    }

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(wb, ws1, "Consolidado");

    // Sheet 2: Jurados
    const juradosRows = [
      ["Jurado N.°", "Nombres y Apellidos", "DNI", "Especialidad"],
      ...jurados.map(j => [j.numeroJurado || 1, j.nombreCompleto || "—", j.dni || "—", j.especialidad || "—"])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(juradosRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Jurados");

    XLSX.writeFile(wb, `AnexoA10_${disciplinaId}_${categoria}_UGEL.xlsx`);
  };

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, maxWidth: 1100, margin: '0 auto', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      {/* Selector de Disciplina y Categoría */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>DISCIPLINA</label>
          <select
            value={disciplinaId}
            onChange={e => setDisciplinaId(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.navy2 }}
          >
            <optgroup label="PRESENCIALES">
              {DISCIPLINAS_UGEL03.filter(d => d.modalidad === 'presencial').map(d => (
                <option key={d.disciplinaId} value={d.disciplinaId}>{d.label}</option>
              ))}
            </optgroup>
            <optgroup label="NO PRESENCIALES">
              {DISCIPLINAS_UGEL03.filter(d => d.modalidad === 'no_presencial').map(d => (
                <option key={d.disciplinaId} value={d.disciplinaId}>{d.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.navy2 }}
          >
            {categoriasHabilitadas.map(c => (
              <option key={c} value={c}>Categoría {c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>ETAPA</label>
          <input
            type="text"
            readOnly
            value="UGEL"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.g100, fontSize: 13, fontWeight: 700, color: C.navy2 }}
          />
        </div>
      </div>

      {/* Indicador de Avance de Fichas Firmadas */}
      <div style={{ background: juradosCompletos ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${juradosCompletos ? '#BBF7D0' : '#FDE68A'}`, padding: '10px 16px', borderRadius: 6, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: juradosCompletos ? C.green : C.amber }}>
          {juradosCompletos ? 'Consolidado listo para cierre: las tres fichas D1 están firmadas.' : `Fichas firmadas: ${evaluaciones.filter(e => e.estado === 'firmada').length} de ${totalFichasEsperadas || 3}. El consolidado se cierra con las tres fichas firmadas.`}
        </div>
        <div style={{ fontSize: 11, color: C.g500 }}>
          {participantes.length} participante(s) registrados
        </div>
      </div>

      {/* Encabezado Literal del Formato Oficial A10 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, color: C.navy2, margin: 0, textTransform: 'uppercase' }}>
          ANEXO A10 — FORMATO CONSOLIDADO DE EVALUACIÓN
        </h3>
        <div style={{ fontSize: 11, color: C.g500, marginTop: 2 }}>JUEGOS FLORALES ESCOLARES NACIONALES 2026</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, background: C.g50, padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 12, color: C.g800 }}>
        <div><strong>Etapa:</strong> UGEL</div>
        <div>
          <strong>Lugar:</strong> Lima / Lima /{' '}
          <input
            type="text"
            disabled={readOnly}
            value={distrito}
            onChange={e => setDistrito(e.target.value)}
            placeholder="Distrito sede"
            style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, width: 110 }}
          />
        </div>
        <div><strong>Fecha:</strong> {contexto?.fecha || ''}</div>
        <div><strong>Disciplina:</strong> {discInfo?.label}</div>
        <div><strong>Categoría:</strong> {categoria}</div>
        <div><strong>Sede:</strong> {contexto?.lugar}</div>
      </div>

      {/* Toggle de columnas opcionales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: C.g500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={mostrarOpcionales}
            onChange={e => setMostrarOpcionales(e.target.checked)}
            style={{ accentColor: C.navy3 }}
          />
          Mostrar columnas adicionales (Código, Título, Seudónimo, Promedio)
        </label>
      </div>

      {/* Tabla Consolidada A10 */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: `1px solid ${C.border}` }}>
          <thead>
            <tr style={{ background: C.navy3, color: C.white, textAlign: 'left' }}>
              {mostrarOpcionales && <th style={{ padding: '10px 8px', border: `1px solid ${C.border}` }}>CÓDIGO</th>}
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>DRE/UGEL</th>
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>I. E.</th>
              {mostrarOpcionales && <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>TÍTULO OBRA</th>}
              {mostrarOpcionales && <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>SEUDÓNIMO</th>}
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>JURADO 1</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>JURADO 2</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>JURADO 3</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>TOTAL</th>
              {mostrarOpcionales && <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>PROMEDIO</th>}
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center', width: 70 }}>PUESTO</th>
              {!readOnly && empatesTop3.length > 0 && <th style={{ padding: '10px 4px', border: `1px solid ${C.border}`, textAlign: 'center', width: 50 }}>ACCION</th>}
            </tr>
          </thead>
          <tbody>
            {filasFinales.length === 0 ? (
              <tr>
                <td colSpan={mostrarOpcionales ? 12 : 8} style={{ padding: 28, textAlign: 'center', color: C.amber, fontWeight: 700, background: '#FFFBEB' }}>
                  No hay participantes inscritos en esta disciplina y categoría.
                </td>
              </tr>
            ) : (
              filasFinales.map((f, idx) => {
                const esTop3 = f.puesto && f.puesto <= 3;
                const isEmpatadoTop3 = empatesTop3.includes(f.puesto);

                return (
                  <tr key={f.participanteId} style={{ background: isEmpatadoTop3 ? '#FFFBEB' : esTop3 ? C.g100 : C.white }}>
                    {mostrarOpcionales && (
                      <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono'", fontSize: 11 }}>
                        {f.codigoParticipante}
                      </td>
                    )}
                    <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontSize: 11, color: C.g500 }}>
                      {f.dreUgel}
                    </td>
                    <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontWeight: 700, color: C.navy2 }}>
                      {f.institucion}
                    </td>
                    {mostrarOpcionales && (
                      <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontSize: 11, color: C.g800 }}>
                        {f.tituloObra || '—'}
                      </td>
                    )}
                    {mostrarOpcionales && (
                      <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontSize: 11, color: C.gold, fontWeight: 700 }}>
                        {f.seudonimo || '—'}
                      </td>
                    )}
                    <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'" }}>
                      {f.jurado1 != null ? f.jurado1 : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'" }}>
                      {f.jurado2 != null ? f.jurado2 : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'" }}>
                      {f.jurado3 != null ? f.jurado3 : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'", fontWeight: 800, fontSize: 13, color: C.navy2 }}>
                      {f.total != null ? f.total : '—'}
                    </td>
                    {mostrarOpcionales && (
                      <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'" }}>
                        {f.promedio != null ? f.promedio : '—'}
                      </td>
                    )}
                    <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 800, color: esTop3 ? C.navy2 : C.g500 }}>
                      {f.puesto ? `${f.puesto}.°` : '—'}
                    </td>
                    {!readOnly && empatesTop3.length > 0 && (
                      <td style={{ padding: '4px 2px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                          <button onClick={() => handleMoverFila(idx, -1)} disabled={idx === 0} style={{ border: 'none', background: C.g200, padding: '2px 4px', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}>▲</button>
                          <button onClick={() => handleMoverFila(idx, 1)} disabled={idx === filasFinales.length - 1} style={{ border: 'none', background: C.g200, padding: '2px 4px', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}>▼</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Alerta de Empates en el Top 3 y Criterio de Desempate */}
      {empatesTop3.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 16, borderRadius: 6, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 6 }}>
            EXISTE EMPATE EN EL TOP 3 (PUESTO{empatesTop3.length > 1 ? 'S' : ''} {empatesTop3.join(', ')})
          </div>
          <div style={{ fontSize: 12, color: C.g800, marginBottom: 10, lineHeight: 1.5 }}>
            Según el numeral 11 de las bases, no se admiten empates entre los tres primeros lugares; el Jurado Calificador debe resolverlo.
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>
              CRITERIO DE DESEMPATE APLICADO *
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={criterioDesempate}
              onChange={e => setCriterioDesempate(e.target.value)}
              placeholder="Describa el criterio acordado por el jurado (ej. Mayor puntaje en criterio de Representación / Voto unánime)"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12 }}
            />
          </div>
        </div>
      )}

      {/* Bloque de Firmas del Formato Oficial (2 arriba side-by-side, 1 abajo) */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, background: C.g50, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, textTransform: 'uppercase', marginBottom: 14 }}>
          FIRMAS DEL JURADO CALIFICADOR (TOMADAS DE D1)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
          {[1, 2].map(num => {
            const j = juradosFinales[num - 1] || {};
            return (
              <div key={num} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 6 }}>Jurado N.° {num}</div>
                {j.firmaDataUrl ? (
                  <img src={j.firmaDataUrl} alt={`Firma J${num}`} style={{ maxHeight: 45, objectFit: 'contain', marginBottom: 6 }} />
                ) : (
                  <div style={{ height: 45, color: C.g500, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Pendiente de firma D1</div>
                )}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={j.nombreCompleto === '────────' ? '' : j.nombreCompleto}
                    onChange={e => setJuradosEditados({
                      ...juradosEditados,
                      [num]: { ...(juradosEditados[num] || {}), nombreCompleto: e.target.value.toUpperCase() }
                    })}
                    placeholder="NOMBRES Y APELLIDOS JURADO"
                    style={{ width: '100%', padding: '4px 6px', fontSize: 11, fontWeight: 700, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4, color: C.navy2 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.g500, fontWeight: 700 }}>DNI:</span>
                    <input
                      type="text"
                      disabled={readOnly}
                      maxLength={8}
                      value={j.dni === '────────' ? '' : j.dni}
                      onChange={e => setJuradosEditados({
                        ...juradosEditados,
                        [num]: { ...(juradosEditados[num] || {}), dni: e.target.value.replace(/\D/g, '') }
                      })}
                      placeholder="DNI"
                      style={{ width: 90, padding: '3px 6px', fontSize: 10, fontFamily: "'JetBrains Mono'", textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          {(() => {
            const j = juradosFinales[2] || {};
            const num = 3;
            return (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 6 }}>Jurado N.° 3</div>
                {j.firmaDataUrl ? (
                  <img src={j.firmaDataUrl} alt="Firma J3" style={{ maxHeight: 45, objectFit: 'contain', marginBottom: 6 }} />
                ) : (
                  <div style={{ height: 45, color: C.g500, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Pendiente de firma D1</div>
                )}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={j.nombreCompleto === '────────' ? '' : j.nombreCompleto}
                    onChange={e => setJuradosEditados({
                      ...juradosEditados,
                      [num]: { ...(juradosEditados[num] || {}), nombreCompleto: e.target.value.toUpperCase() }
                    })}
                    placeholder="NOMBRES Y APELLIDOS JURADO"
                    style={{ width: '100%', padding: '4px 6px', fontSize: 11, fontWeight: 700, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4, color: C.navy2 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.g500, fontWeight: 700 }}>DNI:</span>
                    <input
                      type="text"
                      disabled={readOnly}
                      maxLength={8}
                      value={j.dni === '────────' ? '' : j.dni}
                      onChange={e => setJuradosEditados({
                        ...juradosEditados,
                        [num]: { ...(juradosEditados[num] || {}), dni: e.target.value.replace(/\D/g, '') }
                      })}
                      placeholder="DNI"
                      style={{ width: 90, padding: '3px 6px', fontSize: 10, fontFamily: "'JetBrains Mono'", textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {/* Opción de Subir PDF Escaneado de Anexo A10 (Firma Manuscrita) */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, marginBottom: 4 }}>
            Subir Anexo A10 Escaneado (Firmas Manuscritas en Físico)
          </div>
          <div style={{ fontSize: 11, color: C.g500, marginBottom: 8 }}>
            Si el Cuadro Consolidado A10 fue firmado físicamente en papel por los tres jurados, puede adjuntar el documento PDF escaneado aquí.
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
                  if (onToast) onToast("PDF escaneado de Anexo A10 cargado correctamente.", "success");
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ fontSize: 12 }}
          />
          {pdfEscaneadoUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>✓ PDF Escaneado Adjunto (A10)</span>
              <a href={pdfEscaneadoUrl} download={`AnexoA10_${disciplinaId}_Cat${categoria}.pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.navy3, fontWeight: 700 }}>Ver / Descargar PDF Escaneado</a>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.border}`, paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportarExcel} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="download" size={14} /> Exportar Excel
          </button>
          <button onClick={handleExportarPDF} style={{ background: C.gold, color: C.navy1, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="fileText" size={14} /> Descargar PDF (A4 Horiz)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!readOnly && (
            <>
              <button
                disabled={guardando}
                onClick={handleGuardarConsolidado}
                style={{ background: C.white, color: C.navy3, border: `1px solid ${C.navy3}`, borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Guardar consolidado
              </button>

              <button
                disabled={guardando || !juradosCompletos || hayEmpatePendiente}
                onClick={handleCerrarConsolidado}
                style={{
                  background: (juradosCompletos && !hayEmpatePendiente) ? C.navy3 : C.g500,
                  color: C.white,
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: (juradosCompletos && !hayEmpatePendiente) ? 'pointer' : 'not-allowed'
                }}
              >
                Cerrar consolidado
              </button>
            </>
          )}

          {readOnly && onGenerarA11 && (
            <button
              onClick={() => onGenerarA11({ disciplinaId, categoria })}
              style={{ background: C.navy3, color: C.white, border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Generar Anexo A11 (Acta) →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
