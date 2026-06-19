import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeMonitoreoDocente, 
  batchSetMonitoreoDocente, 
  deleteMonitoreoDocente, 
  updateMonitoreoDocente 
} from '../firebase/db';
import { extraerTextoPdf, parsearFicha, generateSlug } from '../utils/parseFichaMonitoreo';
import Icon from './Icon';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const C = {
  navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
  g900: "#0F172A", g800: "#1E293B", g700: "#334155", g600: "#475569",
  g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
  g100: "#F1F5F9", g50: "#F8FAFC",
  bg: "#F5F6FA",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF", blueBorder: "#DBEAFE",
  white: "#FFFFFF",
  realNavy: "#1E4D7B"
};

const LEVEL_COLORS = {
  1: C.red,
  2: C.amber,
  3: C.blue,
  4: C.green
};

const LEVEL_LABELS = {
  1: "Nivel I",
  2: "Nivel II",
  3: "Nivel III",
  4: "Nivel IV"
};

export default function MonitoreoDocente() {
  const { user, isRole } = useAuth();
  const esStaffPleno = isRole('admin') || isRole('jefatura');

  // Core state
  const [programa, setPrograma] = useState('EBA'); // 'EBA' | 'ETP'
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchDocente, setSearchDocente] = useState('');
  const [filterIE, setFilterIE] = useState('todos');
  const [filterArea, setFilterArea] = useState('todos');
  const [filterMonitor, setFilterMonitor] = useState('todos');
  const [filterGrado, setFilterGrado] = useState('todos');
  const [filterNivel, setFilterNivel] = useState('todos');
  const [filterCriterion, setFilterCriterion] = useState('todos');
  const [filterCriterionLevel, setFilterCriterionLevel] = useState('todos');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected document for Modal View/Edit
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Upload Panel States
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [parsedItems, setParsedItems] = useState([]); // Array of parsed documents before saving
  const [selectedUploadIds, setSelectedUploadIds] = useState(new Set()); // IDs selected to save

  // Toast Notifications
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Subscribe to EBA or ETP records
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeMonitoreoDocente(programa, (list) => {
      setFichas(list || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [programa]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDocente, filterIE, filterArea, filterMonitor, filterGrado, filterNivel, filterCriterion, filterCriterionLevel]);

  // Unique values for filter lists (derived dynamically)
  const filterOptions = useMemo(() => {
    const ies = new Set();
    const areas = new Set();
    const monitors = new Set();
    const grados = new Set();
    
    fichas.forEach(f => {
      if (f.institucionNombre) ies.add(`${f.institucionCodigo} - ${f.institucionNombre}`);
      if (f.areaCurricular) areas.add(f.areaCurricular);
      if (f.monitorNombre) monitors.add(f.monitorNombre);
      if (f.grado) grados.add(f.grado);
    });

    return {
      ies: Array.from(ies).sort(),
      areas: Array.from(areas).sort(),
      monitors: Array.from(monitors).sort(),
      grados: Array.from(grados).sort()
    };
  }, [fichas]);

  // Filtered dataset
  const filteredFichas = useMemo(() => {
    return fichas.filter(f => {
      const matchDoc = !searchDocente || f.docenteNombre?.toLowerCase().includes(searchDocente.toLowerCase());
      const matchIE = filterIE === 'todos' || `${f.institucionCodigo} - ${f.institucionNombre}` === filterIE;
      const matchArea = filterArea === 'todos' || f.areaCurricular === filterArea;
      const matchMonitor = filterMonitor === 'todos' || f.monitorNombre === filterMonitor;
      const matchGrado = filterGrado === 'todos' || f.grado === filterGrado;
      const matchNivel = filterNivel === 'todos' || f.nivelGeneralLabel === filterNivel;
      
      const matchCriterion = filterCriterion === 'todos' || 
                             filterCriterionLevel === 'todos' || 
                             f.desempeno?.[filterCriterion]?.nivel === parseInt(filterCriterionLevel);
      
      return matchDoc && matchIE && matchArea && matchMonitor && matchGrado && matchNivel && matchCriterion;
    });
  }, [fichas, searchDocente, filterIE, filterArea, filterMonitor, filterGrado, filterNivel, filterCriterion, filterCriterionLevel]);

  // Calculated KPIs
  const kpis = useMemo(() => {
    const total = filteredFichas.length;
    const docentesUnicos = new Set(filteredFichas.map(f => f.docenteNombre)).size;
    const ieUnicas = new Set(filteredFichas.map(f => f.institucionCodigo)).size;
    
    const sumG = filteredFichas.reduce((sum, f) => sum + (f.promedioGeneral || 0), 0);
    const promG = total > 0 ? parseFloat((sumG / total).toFixed(2)) : 0;
    
    const nivelIVCount = filteredFichas.filter(f => f.promedioGeneral >= 3.5).length;
    const pctNivelIV = total > 0 ? Math.round((nivelIVCount / total) * 100) : 0;

    const getAvg = (key) => {
      const valid = filteredFichas.filter(f => typeof f.desempeno?.[key]?.nivel === 'number');
      return valid.length > 0 ? parseFloat((valid.reduce((sum, f) => sum + f.desempeno[key].nivel, 0) / valid.length).toFixed(2)) : 0;
    };

    const promInvolucra = getAvg('involucraEstudiantes');
    const promRazonamiento = getAvg('promueveRazonamiento');
    const promEvalua = getAvg('evaluaProgreso');
    const promRespeto = getAvg('ambienteRespeto');
    const promRegula = getAvg('regulaComportamiento');

    return { 
      total, docentesUnicos, ieUnicas, promG, pctNivelIV,
      promInvolucra, promRazonamiento, promEvalua, promRespeto, promRegula 
    };
  }, [filteredFichas]);

  // Recharts Data 1: Indicator Level Distribution (AR02 2.1-2.5)
  const chartIndicatorData = useMemo(() => {
    const indicators = [
      { key: 'involucraEstudiantes', label: 'Involucra' },
      { key: 'promueveRazonamiento', label: 'Razonamiento' },
      { key: 'evaluaProgreso', label: 'Evalúa' },
      { key: 'ambienteRespeto', label: 'Respeto' },
      { key: 'regulaComportamiento', label: 'Regula' }
    ];

    return indicators.map(ind => {
      const counts = { I: 0, II: 0, III: 0, IV: 0 };
      filteredFichas.forEach(f => {
        const lvlVal = f.desempeno?.[ind.key]?.nivel;
        if (lvlVal === 1) counts.I++;
        else if (lvlVal === 2) counts.II++;
        else if (lvlVal === 3) counts.III++;
        else if (lvlVal === 4) counts.IV++;
      });
      return {
        name: ind.label,
        "Nivel I": counts.I,
        "Nivel II": counts.II,
        "Nivel III": counts.III,
        "Nivel IV": counts.IV
      };
    });
  }, [filteredFichas]);

  // Recharts Data 2: Curricular Area Averages
  const chartAreaData = useMemo(() => {
    const areaMap = {};
    filteredFichas.forEach(f => {
      const area = f.areaCurricular || "No Especificado";
      if (!areaMap[area]) areaMap[area] = { sum: 0, count: 0 };
      areaMap[area].sum += f.promedioGeneral || 0;
      areaMap[area].count++;
    });

    return Object.keys(areaMap).map(area => ({
      area: area.substring(0, 18) + (area.length > 18 ? '...' : ''),
      promedio: parseFloat((areaMap[area].sum / areaMap[area].count).toFixed(2))
    })).sort((a, b) => b.promedio - a.promedio).slice(0, 8);
  }, [filteredFichas]);

  // Recharts Data 3: Level Pie Distribution
  const chartPieData = useMemo(() => {
    const counts = { "Nivel I": 0, "Nivel II": 0, "Nivel III": 0, "Nivel IV": 0 };
    filteredFichas.forEach(f => {
      if (counts[f.nivelGeneralLabel] !== undefined) {
        counts[f.nivelGeneralLabel]++;
      }
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [filteredFichas]);

  // Paginated records
  const paginatedFichas = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredFichas.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredFichas, currentPage]);

  const totalPages = Math.ceil(filteredFichas.length / itemsPerPage);

  // Clean filters helper
  const cleanFilters = () => {
    setSearchDocente('');
    setFilterIE('todos');
    setFilterArea('todos');
    setFilterGrado('todos');
    setFilterMonitor('todos');
    setFilterNivel('todos');
    setFilterCriterion('todos');
    setFilterCriterionLevel('todos');
  };

  // Helper to parse Excel format "mundoIE (1)"
  const parseExcelMundoIE = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // range: 1 tells sheet_to_json to skip the first row (title)
          const rows = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: "" });
          
          // Filter rows where ACCIÓN is COMPLETADO (case-insensitive check)
          const completados = rows.filter(r => {
            const acc = String(r['ACCIÓN'] || r['accion'] || '').trim().toUpperCase();
            return acc === 'COMPLETADO';
          });
          
          const parsedRecords = completados.map((row, idx) => {
            const modStr = String(row['MODIFICADO'] || '').trim();
            const dateMatch = modStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
            let fechaEjecucion = null;
            let fechaEjecucionISO = null;
            if (dateMatch) {
              const [_, d, m, y] = dateMatch;
              fechaEjecucion = `${d}/${m}/${y}`;
              fechaEjecucionISO = `${y}-${m}-${d}`;
            } else {
              fechaEjecucion = modStr.split(' ')[0] || new Date().toLocaleDateString('es-PE');
              const parts = fechaEjecucion.split('/');
              if (parts.length === 3) {
                fechaEjecucionISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else {
                fechaEjecucionISO = new Date().toISOString().split('T')[0];
              }
            }

            // Docente parsing: "DNI - APELLIDOS, NOMBRES"
            const docenteField = String(row['DOCENTE'] || '').trim();
            let docenteName = docenteField;
            let docenteDni = "";
            if (docenteField.includes('-')) {
              const parts = docenteField.split('-');
              docenteDni = parts[0] ? parts[0].trim() : "";
              docenteName = parts[1] ? parts[1].trim() : docenteField;
            }

            const instCodigo = String(row['COD. MODULAR'] || '').trim();
            const instNombre = String(row['INSTITUCIÓN EDUCATIVA'] || '').trim();
            
            const slugSource = `${instCodigo}-${docenteName}-${fechaEjecucionISO}-v1`;
            const id = 'excel-' + generateSlug(slugSource);

            return {
              id,
              programa: 'ETP',
              plan: 'Monitoreo ETP Excel',
              instrumento: 'Ficha ETP (Excel)',
              visita: 1,
              institucionCodigo: instCodigo,
              institucionNombre: instNombre,
              monitorNombre: String(row['REGISTRADO POR'] || 'ESPECIALISTA').trim() || "Especialista",
              docenteNombre: docenteName,
              docenteDni: docenteDni,
              fechaProgramacion: null,
              fechaEjecucion: fechaEjecucion,
              fechaEjecucionISO: fechaEjecucionISO,
              estado: 'COMPLETADO',
              
              reiACargo: null,
              grado: null,
              seccion: null,
              areaCurricular: "No Especificado",
              estudiantesMatriculados: 0,
              estudiantesAsistentes: 0,
              estudiantesDiscapacidad: 0,
              
              desempeno: {
                involucraEstudiantes: { raw: '', letra: null, nivel: null, mismatch: false },
                promueveRazonamiento: { raw: '', letra: null, nivel: null, mismatch: false },
                evaluaProgreso: { raw: '', letra: null, nivel: null, mismatch: false },
                ambienteRespeto: { raw: '', letra: null, nivel: null, mismatch: false },
                regulaComportamiento: { raw: '', letra: null, nivel: null, mismatch: false }
              },
              cuadernilloMonitoreoRef: null,
              planificacion: {
                presentaDocumentacion: false,
                planificaConUso: null,
                sesionEjecutada: false,
                planificacionAnual: { raw: '', letra: null, nivel: null, mismatch: false },
                situacionSignificativa: { raw: '', letra: null, nivel: null, mismatch: false },
                secuenciaMetodologica: { raw: '', letra: null, nivel: null, mismatch: false },
                metodologiaActiva: { raw: '', letra: null, nivel: null, mismatch: false },
                usoPedagogicoRecursos: { raw: '', letra: null, nivel: null, mismatch: false }
              },
              sesionObservadaRef: null,
              compromisos: null,
              comentarios: null,
              observaciones: null,
              recomendaciones: null,
              fortalezas: null,
              aspectosAMejorar: null,
              seccionesAdicionales: {},
              
              promedioDesempeno: 0,
              promedioPlanificacion: 0,
              promedioGeneral: 0,
              nivelGeneralLabel: "Nivel I",
              advertencias: [],
              archivoOrigen: file.name,
              cargadoPor: "",
              cargadoPorUid: "",
              isExcelImport: true
            };
          });
          
          resolve(parsedRecords);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  // Drag & Drop Upload Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!esStaffPleno) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.(pdf|xlsx|xls)$/i));
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleFileSelect = async (e) => {
    if (!esStaffPleno) return;
    const files = Array.from(e.target.files).filter(f => f.name.match(/\.(pdf|xlsx|xls)$/i));
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  // Extract text and parse each file sequentially (supports PDF and Excel)
  const processFiles = async (files) => {
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: files.length });
    const items = [];
    const idsToSelect = new Set();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingProgress({ current: i + 1, total: files.length });
      const isExcel = file.name.match(/\.(xlsx|xls)$/i);
      try {
        if (isExcel) {
          const excelRecords = await parseExcelMundoIE(file);
          excelRecords.forEach(rec => {
            items.push(rec);
            idsToSelect.add(rec.id);
          });
        } else {
          const text = await extraerTextoPdf(file);
          const parsed = parsearFicha(text, file.name, programa);
          items.push(parsed);
          idsToSelect.add(parsed.id);
        }
      } catch (err) {
        console.error(`Error parseando ${file.name}:`, err);
        items.push({
          id: `error-${Date.now()}-${i}`,
          archivoOrigen: file.name,
          docenteNombre: "ERROR DE CARGA",
          institucionNombre: `El archivo ${isExcel ? 'Excel' : 'PDF'} no se pudo leer o está corrupto.`,
          promedioGeneral: 0,
          nivelGeneralLabel: "Error",
          advertencias: [`Fallo en la lectura: ${err.message}`],
          isErrorItem: true
        });
      }
    }
    
    setParsedItems(prev => [...prev, ...items]);
    setSelectedUploadIds(prev => {
      const next = new Set(prev);
      idsToSelect.forEach(id => next.add(id));
      return next;
    });
    setIsProcessing(false);
  };

  // Perform Firestore save
  const handleSaveBulkUpload = async () => {
    const toSave = parsedItems.filter(item => selectedUploadIds.has(item.id) && !item.isErrorItem);
    if (toSave.length === 0) {
      showToast("No hay elementos válidos seleccionados para guardar.", "error");
      return;
    }

    try {
      await batchSetMonitoreoDocente(programa, toSave, user.uid, user.nombre);
      showToast(`Se guardaron ${toSave.length} fichas de monitoreo exitosamente.`);
      setParsedItems([]);
      setSelectedUploadIds(new Set());
    } catch (err) {
      showToast(`Error al guardar en lote: ${err.message}`, "error");
    }
  };

  // Selected item operations
  const openFichaDetails = (ficha) => {
    setSelectedFicha(ficha);
    setIsEditing(false);
    setEditForm({ ...ficha });
  };

  const handleUpdateFicha = async () => {
    try {
      await updateMonitoreoDocente(programa, selectedFicha.id, editForm);
      showToast("Ficha de monitoreo actualizada correctamente.");
      setSelectedFicha(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch (err) {
      showToast(`Error al actualizar la ficha: ${err.message}`, "error");
    }
  };

  const handleDeleteFicha = async () => {
    if (confirm(`¿Está seguro de eliminar permanentemente la ficha de monitoreo de ${selectedFicha.docenteNombre}?`)) {
      try {
        await deleteMonitoreoDocente(programa, selectedFicha.id);
        showToast("Ficha eliminada permanentemente de la base de datos.");
        setSelectedFicha(null);
      } catch (err) {
        showToast(`Error al eliminar: ${err.message}`, "error");
      }
    }
  };

  // Export to Excel using xlsx library
  const handleExportExcel = () => {
    const headers = [
      "ID Ficha", "Plan", "Instrumento", "Visita", "IE Codigo", "IE Nombre", 
      "Docente", "Monitor", "Fecha Programacion", "Fecha Ejecucion", "Rei a Cargo", 
      "Grado", "Seccion", "Area Curricular", "Estudiantes Matriculados", "Estudiantes Asistentes",
      "Promedio Desempeño", "Promedio Planificación", "Promedio General", "Nivel General", "Advertencias"
    ];

    const rows = filteredFichas.map(f => [
      f.id, f.plan, f.instrumento, f.visita, f.institucionCodigo, f.institucionNombre,
      f.docenteNombre, f.monitorNombre, f.fechaProgramacion, f.fechaEjecucion, f.reiACargo,
      f.grado, f.seccion, f.areaCurricular, f.estudiantesMatriculados, f.estudiantesAsistentes,
      f.promedioDesempeno, f.promedioPlanificacion, f.promedioGeneral, f.nivelGeneralLabel,
      (f.advertencias || []).join(" | ")
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Monitoreo ${programa}`);
    XLSX.writeFile(wb, `Monitoreo_Docente_${programa}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Reporte Excel descargado correctamente.");
  };

  const toggleSelectUploadId = (id) => {
    setSelectedUploadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllUploads = () => {
    if (selectedUploadIds.size === parsedItems.filter(p => !p.isErrorItem).length) {
      setSelectedUploadIds(new Set());
    } else {
      const next = new Set();
      parsedItems.forEach(p => { if (!p.isErrorItem) next.add(p.id); });
      setSelectedUploadIds(next);
    }
  };

  // Inline CSS
  const S = {
    card: { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    sectionTitle: { fontSize: "1.1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 16 },
    badge: (bg, color, border) => ({ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 4, background: bg, color, border: `1px solid ${border || color + '30'}`, letterSpacing: "0.04em", fontFamily: "'DM Sans'" }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
    progressBar: (pct) => ({ height: 6, background: C.g100, borderRadius: 3, overflow: "hidden", children: { height: "100%", borderRadius: 3, width: `${pct}%`, background: pct < 30 ? C.red : pct < 70 ? C.amber : C.green, transition: "width 0.3s" } }),
    statCard: (border) => ({ background: C.white, borderRadius: 10, padding: "18px 20px", borderLeft: `4px solid ${border}`, boxShadow: "0 1px 3px rgba(15,23,42,0.06)", borderTop: `1px solid ${C.g100}`, borderRight: `1px solid ${C.g100}`, borderBottom: `1px solid ${C.g100}` })
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.g800 }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 28, zIndex: 220, padding: "10px 20px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? C.greenBg : C.redBg, border: `1px solid ${toast.type === "success" ? C.greenBorder : C.redBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", animation: "fadeIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Program Selector & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <div>
          <h2 style={{ color: C.navy1, fontSize: "1.45rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Monitoreo Pedagogico Docente</h2>
          <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0" }}>Modulo para el registro, control y analisis de fichas pedagogicas EBA y ETP.</p>
        </div>

        {/* EBA / ETP Selector pills */}
        <div style={{ display: "flex", background: C.g100, padding: 4, borderRadius: 8 }}>
          <button 
            onClick={() => setPrograma('EBA')} 
            style={{ padding: "6px 16px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, background: programa === 'EBA' ? C.white : "transparent", color: programa === 'EBA' ? C.navy3 : C.g500, cursor: "pointer", transition: "all 0.15s" }}
          >
            EBA (Educacion Basica Alternativa)
          </button>
          <button 
            onClick={() => setPrograma('ETP')} 
            style={{ padding: "6px 16px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, background: programa === 'ETP' ? C.white : "transparent", color: programa === 'ETP' ? C.navy3 : C.g500, cursor: "pointer", transition: "all 0.15s" }}
          >
            ETP (Educacion Tecnico Productiva)
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, color: C.g500 }}>
          <span>Cargando datos de monitoreo...</span>
        </div>
      ) : programa === 'ETP' && fichas.length === 0 && parsedItems.length === 0 ? (
        /* Empty state for ETP */
        <div style={{ ...S.card, textAlign: "center", padding: 60, minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <Icon name="folder" size={48} color={C.g300} style={{ marginBottom: 16 }} />
          <h3 style={{ ...S.sectionTitle, marginBottom: 8 }}>Aun no hay fichas ETP cargadas</h3>
          <p style={{ color: C.g500, fontSize: "0.85rem", maxWidth: 460, margin: "0 auto 20px" }}>
            El programa ETP se encuentra listo para recibir cargas de fichas. Utilice el panel de importacion inferior para subir sus fichas de monitoreo en formato PDF.
          </p>
          {esStaffPleno && (
            <button 
              onClick={() => document.getElementById("file-upload-input")?.click()}
              style={S.btn(C.navy4, C.white, C.navy5)}
            >
              <Icon name="plus" size={14} /> Cargar Fichas ETP
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Dashboard Panel */}
          {fichas.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              {/* KPIs Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
                <div style={S.statCard(C.navy4)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.navy4 }}>{kpis.total}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Total Fichas</div>
                </div>
                <div style={S.statCard(C.realNavy)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.realNavy }}>{kpis.docentesUnicos}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Docentes</div>
                </div>
                <div style={S.statCard(C.gold2)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.gold1 }}>{kpis.ieUnicas}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>IE Cubiertas</div>
                </div>
                <div style={S.statCard(C.blue)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.blue }}>{kpis.promG} / 4.0</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Promedio General</div>
                </div>
                <div style={S.statCard(C.green)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.green }}>{kpis.pctNivelIV}%</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Eficiencia (Niv. IV)</div>
                </div>
              </div>

              {/* KPIs Grid 2: Averages by Criterion */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                <div style={S.statCard(LEVEL_COLORS[Math.round(kpis.promInvolucra)] || C.navy5)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: LEVEL_COLORS[Math.round(kpis.promInvolucra)] || C.navy5 }}>{kpis.promInvolucra?.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Prom. Involucra</div>
                </div>
                <div style={S.statCard(LEVEL_COLORS[Math.round(kpis.promRazonamiento)] || C.navy3)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: LEVEL_COLORS[Math.round(kpis.promRazonamiento)] || C.navy3 }}>{kpis.promRazonamiento?.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Prom. Razonamiento</div>
                </div>
                <div style={S.statCard(LEVEL_COLORS[Math.round(kpis.promEvalua)] || C.gold1)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: LEVEL_COLORS[Math.round(kpis.promEvalua)] || C.gold1 }}>{kpis.promEvalua?.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Prom. Evalúa</div>
                </div>
                <div style={S.statCard(LEVEL_COLORS[Math.round(kpis.promRespeto)] || C.blue)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: LEVEL_COLORS[Math.round(kpis.promRespeto)] || C.blue }}>{kpis.promRespeto?.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Prom. Respeto</div>
                </div>
                <div style={S.statCard(LEVEL_COLORS[Math.round(kpis.promRegula)] || C.green)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: LEVEL_COLORS[Math.round(kpis.promRegula)] || C.green }}>{kpis.promRegula?.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Prom. Regula</div>
                </div>
              </div>

              {/* Visual Charts (Recharts) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
                {/* Chart 1: Levels by Indicator */}
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>Distribucion por Criterio de Desempeño</h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartIndicatorData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Nivel I" stackId="a" fill={C.red} />
                        <Bar dataKey="Nivel II" stackId="a" fill={C.amber} />
                        <Bar dataKey="Nivel III" stackId="a" fill={C.blue} />
                        <Bar dataKey="Nivel IV" stackId="a" fill={C.green} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Promedio por Area Curricular */}
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>Desempeño Promedio por Area Curricular (Top 8)</h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartAreaData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                        <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 10 }} />
                        <YAxis dataKey="area" type="category" tick={{ fontSize: 9 }} width={110} />
                        <Tooltip />
                        <Bar dataKey="promedio" fill={C.realNavy} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Donut Distribution */}
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>Calificacion General del Docente</h3>
                  <div style={{ height: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={chartPieData.filter(d => d.value > 0)} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={45} 
                            outerRadius={70} 
                            paddingAngle={3} 
                            dataKey="value"
                          >
                            <Cell fill={C.red} />
                            <Cell fill={C.amber} />
                            <Cell fill={C.blue} />
                            <Cell fill={C.green} />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Pie Legend */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", fontSize: 11, fontWeight: 600 }}>
                      <span style={{ color: C.red }}>I: {chartPieData[0]?.value || 0}</span>
                      <span style={{ color: C.amber }}>II: {chartPieData[1]?.value || 0}</span>
                      <span style={{ color: C.blue }}>III: {chartPieData[2]?.value || 0}</span>
                      <span style={{ color: C.green }}>IV: {chartPieData[3]?.value || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          {fichas.length > 0 && (
            <div style={{ ...S.card, padding: 18, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, alignItems: "flex-end" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={S.label}>Buscar Docente</label>
                  <input 
                    type="text" 
                    placeholder="Escriba nombre del docente..." 
                    value={searchDocente} 
                    onChange={e => setSearchDocente(e.target.value)} 
                    style={S.input} 
                  />
                </div>
                <div>
                  <label style={S.label}>Institucion</label>
                  <select value={filterIE} onChange={e => setFilterIE(e.target.value)} style={S.input}>
                    <option value="todos">Todas las IE</option>
                    {filterOptions.ies.map(ie => <option key={ie} value={ie}>{ie}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Area Curricular</label>
                  <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={S.input}>
                    <option value="todos">Todas las areas</option>
                    {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Monitor</label>
                  <select value={filterMonitor} onChange={e => setFilterMonitor(e.target.value)} style={S.input}>
                    <option value="todos">Todos los monitores</option>
                    {filterOptions.monitors.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Nivel General</label>
                  <select value={filterNivel} onChange={e => setFilterNivel(e.target.value)} style={S.input}>
                    <option value="todos">Todos los niveles</option>
                    <option value="Nivel I">Nivel I</option>
                    <option value="Nivel II">Nivel II</option>
                    <option value="Nivel III">Nivel III</option>
                    <option value="Nivel IV">Nivel IV</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Criterio Específico</label>
                  <select value={filterCriterion} onChange={e => {
                    setFilterCriterion(e.target.value);
                    if (e.target.value === 'todos') {
                      setFilterCriterionLevel('todos');
                    }
                  }} style={S.input}>
                    <option value="todos">Todos los criterios</option>
                    <option value="involucraEstudiantes">2.1 Involucra</option>
                    <option value="promueveRazonamiento">2.2 Razonamiento</option>
                    <option value="evaluaProgreso">2.3 Evalúa</option>
                    <option value="ambienteRespeto">2.4 Respeto</option>
                    <option value="regulaComportamiento">2.5 Regula</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Nivel del Criterio</label>
                  <select 
                    value={filterCriterionLevel} 
                    onChange={e => setFilterCriterionLevel(e.target.value)} 
                    disabled={filterCriterion === 'todos'}
                    style={{
                      ...S.input,
                      opacity: filterCriterion === 'todos' ? 0.6 : 1,
                      cursor: filterCriterion === 'todos' ? 'not-allowed' : 'default'
                    }}
                  >
                    <option value="todos">Todos los niveles</option>
                    <option value="1">Nivel I</option>
                    <option value="2">Nivel II</option>
                    <option value="3">Nivel III</option>
                    <option value="4">Nivel IV</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={cleanFilters} style={S.btn(C.g100, C.g600, C.g200)}>
                    Limpiar
                  </button>
                  <button onClick={handleExportExcel} style={S.btn(C.greenBg, C.green, C.greenBorder)}>
                    Excel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data list Table */}
          {fichas.length > 0 && (
            <div style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: 24 }}>
              {/* Desktop Table View */}
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: C.g50, borderBottom: `2px solid ${C.g200}` }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Docente</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Institucion</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Area Curricular</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Grado/Secc</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Fecha</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>P. Desemp.</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>P. Planif.</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Nivel General</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase" }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFichas.map(f => {
                      const hasWarn = f.advertencias && f.advertencias.length > 0;
                      return (
                        <tr 
                          key={f.id} 
                          onClick={() => openFichaDetails(f)}
                          style={{ borderBottom: `1px solid ${C.g100}`, cursor: "pointer", transition: "background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = C.g50}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: C.navy1 }}>{f.docenteNombre}</td>
                          <td style={{ padding: "14px 16px", fontSize: 12, color: C.g600 }}>{f.institucionNombre} <span style={{ fontSize: 10, color: C.g400 }}>({f.institucionCodigo})</span></td>
                          <td style={{ padding: "14px 16px", fontSize: 12, color: C.g600 }}>{f.areaCurricular || "—"}</td>
                          <td style={{ padding: "14px 16px", fontSize: 12, color: C.g600, textAlign: "center" }}>{f.grado || "—"} {f.seccion ? ` - ${f.seccion}` : ''}</td>
                          <td style={{ padding: "14px 16px", fontSize: 12, color: C.g500, textAlign: "center", fontFamily: "'JetBrains Mono'" }}>{f.fechaEjecucionISO || f.fechaEjecucion || "—"}</td>
                          <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, textAlign: "center", fontFamily: "'JetBrains Mono'", color: C.navy3 }}>{f.promedioDesempeno?.toFixed(2)}</td>
                          <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, textAlign: "center", fontFamily: "'JetBrains Mono'", color: C.navy3 }}>{f.promedioPlanificacion?.toFixed(2)}</td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <span style={S.badge(
                              f.promedioGeneral >= 3.5 ? C.greenBg : f.promedioGeneral >= 2.5 ? C.blueBg : f.promedioGeneral >= 1.5 ? C.amberBg : C.redBg,
                              f.promedioGeneral >= 3.5 ? C.green : f.promedioGeneral >= 2.5 ? C.blue : f.promedioGeneral >= 1.5 ? C.amber : C.red
                            )}>
                              {f.nivelGeneralLabel}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            {hasWarn ? (
                              <span style={S.badge(C.amberBg, C.amber, C.amberBorder)}>
                                Revisar
                              </span>
                            ) : (
                              <span style={S.badge(C.greenBg, C.green, C.greenBorder)}>
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFichas.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: 36, color: C.g400, fontSize: 13 }}>
                          No se encontraron fichas que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderTop: `1px solid ${C.g200}`, background: C.g50 }}>
                  <span style={{ fontSize: 12, color: C.g500 }}>
                    Mostrando del {((currentPage - 1) * itemsPerPage) + 1} al {Math.min(currentPage * itemsPerPage, filteredFichas.length)} de {filteredFichas.length} registros
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                      style={S.btn(C.white, C.g600, C.g200)}
                    >
                      Anterior
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                      style={S.btn(C.white, C.g600, C.g200)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Bulk Upload Panel (only admin / jefatura) */}
      {esStaffPleno && (
        <div style={{ ...S.card, marginTop: 24 }}>
          <h3 style={S.sectionTitle}>Importar Fichas desde PDF / Excel (Carga Masiva)</h3>
          <p style={{ color: C.g500, fontSize: "0.82rem", margin: "-10px 0 16px" }}>
            Cargue múltiples archivos PDF o archivos Excel (formato mundoIE) de monitoreo de una sola vez. El procesamiento se realiza localmente en su navegador sin subir los archivos a la nube.
          </p>
 
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload-input")?.click()}
            style={{ border: `2px dashed ${dragOver ? C.navy4 : C.g300}`, borderRadius: 8, padding: "30px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? `${C.navy4}08` : C.g50, transition: "all 0.2s", marginBottom: 20 }}
          >
            <input 
              id="file-upload-input"
              type="file" 
              accept=".pdf,.xlsx,.xls" 
              multiple 
              onChange={handleFileSelect} 
              style={{ display: "none" }} 
            />
            {isProcessing ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.navy4 }}>Procesando archivos...</span>
                <span style={{ fontSize: 12, color: C.g500 }}>
                  Archivo {processingProgress.current} de {processingProgress.total}
                </span>
                <div style={{ width: "100%", maxWidth: 300, height: 6, background: C.g200, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(processingProgress.current / processingProgress.total) * 100}%`, background: C.navy4, transition: "width 0.2s" }} />
                </div>
              </div>
            ) : (
              <div>
                <Icon name="upload" size={32} color={dragOver ? C.navy4 : C.g400} style={{ marginBottom: 8 }} />
                <div style={{ color: C.navy1, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Arrastre múltiples PDFs o archivos Excel de monitoreo aquí
                </div>
                <div style={{ color: C.g400, fontSize: 11 }}>
                  o haga click para seleccionar de su computadora (PDF o Excel)
                </div>
              </div>
            )}
          </div>

          {/* Preview Table of Uploaded Items */}
          {parsedItems.length > 0 && (
            <div style={{ border: `1px solid ${C.g200}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: C.g50, borderBottom: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.navy1 }}>
                  Previsualizacion de Carga ({parsedItems.length} archivos)
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={toggleSelectAllUploads} style={{ ...S.btn(C.white, C.navy4, C.g200), fontSize: 11, padding: "5px 10px" }}>
                    {selectedUploadIds.size === parsedItems.filter(p => !p.isErrorItem).length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                  </button>
                  <button onClick={() => setParsedItems([])} style={{ ...S.btn(C.white, C.red, C.redBorder), fontSize: 11, padding: "5px 10px" }}>
                    Limpiar Vista
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.g100, borderBottom: `1px solid ${C.g200}` }}>
                      <th style={{ padding: "8px 12px", width: 40, textAlign: "center" }}></th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Docente</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Institucion</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", width: 80 }}>Prom. Gen</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Archivo de Origen</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", width: 100 }}>Validacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map(item => {
                      const isErr = item.isErrorItem;
                      const hasWarn = item.advertencias && item.advertencias.length > 0;
                      return (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${C.g100}`, background: isErr ? C.redBg : "transparent" }}>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            {!isErr && (
                              <input 
                                type="checkbox" 
                                checked={selectedUploadIds.has(item.id)} 
                                onChange={() => toggleSelectUploadId(item.id)} 
                              />
                            )}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: isErr ? C.red : C.navy1 }}>
                            {item.docenteNombre}
                          </td>
                          <td style={{ padding: "8px 12px", color: C.g600 }}>
                            {item.institucionNombre}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                            {item.promedioGeneral?.toFixed(2)}
                          </td>
                          <td style={{ padding: "8px 12px", color: C.g400, fontFamily: "'JetBrains Mono'", fontSize: 10 }}>
                            {item.archivoOrigen}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>
                            {isErr ? (
                              <span style={S.badge(C.redBg, C.red, C.redBorder)}>Error</span>
                            ) : hasWarn ? (
                              <span 
                                style={S.badge(C.amberBg, C.amber, C.amberBorder)} 
                                title={item.advertencias.join("\n")}
                              >
                                {item.advertencias.length} Alerta{item.advertencias.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span style={S.badge(C.greenBg, C.green, C.greenBorder)}>OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: "12px 16px", background: C.g50, borderTop: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.g500 }}>
                  Los archivos PDF no se guardan en el servidor; solo se grabaran los datos estructurados en Firestore.
                </span>
                <button 
                  onClick={handleSaveBulkUpload}
                  style={S.btn(C.green, C.white, C.green)}
                >
                  Guardar {selectedUploadIds.size} Fichas Seleccionadas
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL (includes Edit & Delete capabilities) */}
      {selectedFicha && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={() => setSelectedFicha(null)}>
          <div style={{ background: C.white, borderRadius: 12, padding: 28, width: "95%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: `1px solid ${C.g200}`, paddingBottom: 12 }}>
              <div>
                <span style={S.badge(C.navy4 + "15", C.navy4)}>FICHA DE MONITOREO - {programa}</span>
                <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "6px 0 2px", fontFamily: "'DM Serif Display',serif" }}>
                  {selectedFicha.docenteNombre}
                </h3>
                <p style={{ color: C.g500, fontSize: "0.8rem", margin: 0 }}>
                  IE: {selectedFicha.institucionNombre} ({selectedFicha.institucionCodigo}) · Visita: {selectedFicha.visita}
                </p>
              </div>
              <button onClick={() => setSelectedFicha(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.g400 }}>
                <Icon name="x" size={20} />
              </button>
            </div>

            {isEditing ? (
              /* Edit Form inside Modal */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div>
                    <label style={S.label}>Nombre Docente</label>
                    <input type="text" value={editForm.docenteNombre || ''} onChange={e => setEditForm(p => ({ ...p, docenteNombre: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Nombre Monitor</label>
                    <input type="text" value={editForm.monitorNombre || ''} onChange={e => setEditForm(p => ({ ...p, monitorNombre: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Nombre IE</label>
                    <input type="text" value={editForm.institucionNombre || ''} onChange={e => setEditForm(p => ({ ...p, institucionNombre: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Codigo IE</label>
                    <input type="text" value={editForm.institucionCodigo || ''} onChange={e => setEditForm(p => ({ ...p, institucionCodigo: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Grado</label>
                    <input type="text" value={editForm.grado || ''} onChange={e => setEditForm(p => ({ ...p, grado: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Seccion</label>
                    <input type="text" value={editForm.seccion || ''} onChange={e => setEditForm(p => ({ ...p, seccion: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Area Curricular</label>
                    <input type="text" value={editForm.areaCurricular || ''} onChange={e => setEditForm(p => ({ ...p, areaCurricular: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Fecha Ejecucion</label>
                    <input type="text" value={editForm.fechaEjecucion || ''} onChange={e => setEditForm(p => ({ ...p, fechaEjecucion: e.target.value }))} style={S.input} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.g200}`, paddingTop: 16 }}>
                  <button onClick={() => setIsEditing(false)} style={S.btn(C.white, C.g600, C.g200)}>
                    Cancelar
                  </button>
                  <button onClick={handleUpdateFicha} style={S.btn(C.green, C.white, C.green)}>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            ) : (
              /* Read Only Ficha details view */
              <div>
                {/* Warnings Alert Box */}
                {selectedFicha.advertencias && selectedFicha.advertencias.length > 0 && (
                  <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", color: C.amber, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                      <Icon name="alert" size={16} /> Alertas de Consistencia en Ficha
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.g700, lineHeight: 1.5 }}>
                      {selectedFicha.advertencias.map((warn, wi) => <li key={wi}>{warn}</li>)}
                    </ul>
                  </div>
                )}

                {/* Grid columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                  
                  {/* Left Column: Informativos */}
                  <div>
                    <h4 style={{ color: C.navy3, borderBottom: `2px solid ${C.g100}`, paddingBottom: 6, margin: "0 0 10px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Datos Informativos</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Plan:</span><span style={{ fontWeight: 600 }}>{selectedFicha.plan || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Instrumento:</span><span style={{ fontWeight: 600 }}>{selectedFicha.instrumento || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Monitor:</span><span style={{ fontWeight: 600 }}>{selectedFicha.monitorNombre || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>REI a cargo:</span><span style={{ fontWeight: 600 }}>{selectedFicha.reiACargo ?? "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Area Curricular:</span><span style={{ fontWeight: 600 }}>{selectedFicha.areaCurricular || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Grado / Seccion:</span><span style={{ fontWeight: 600 }}>{selectedFicha.grado || "—"} - {selectedFicha.seccion || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Fecha Programada:</span><span style={{ fontWeight: 600 }}>{selectedFicha.fechaProgramacion || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Fecha Ejecutada:</span><span style={{ fontWeight: 600 }}>{selectedFicha.fechaEjecucion || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Estudiantes Matriculados:</span><span style={{ fontWeight: 600 }}>{selectedFicha.estudiantesMatriculados ?? "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Estudiantes Asistentes:</span><span style={{ fontWeight: 600 }}>{selectedFicha.estudiantesAsistentes ?? "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.g500 }}>Estudiantes Discapacidad:</span><span style={{ fontWeight: 600 }}>{selectedFicha.estudiantesDiscapacidad ?? "—"}</span></div>
                    </div>
                  </div>

                  {/* Right Column: General Scores */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: C.g50, borderRadius: 8, padding: 16, border: `1px solid ${C.g200}` }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 13, color: C.navy3, textTransform: "uppercase", letterSpacing: "0.04em" }}>Resumen Calificaciones</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: C.g600 }}>Promedio Desempeño:</span>
                          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{selectedFicha.promedioDesempeno?.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: C.g600 }}>Promedio Planificación:</span>
                          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{selectedFicha.promedioPlanificacion?.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${C.g300}`, paddingTop: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy1 }}>Promedio General:</span>
                          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: LEVEL_COLORS[Math.round(selectedFicha.promedioGeneral)] || C.navy1 }}>
                            {selectedFicha.promedioGeneral?.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: C.g600 }}>Nivel Asignado:</span>
                          <span style={S.badge(
                            selectedFicha.promedioGeneral >= 3.5 ? C.greenBg : selectedFicha.promedioGeneral >= 2.5 ? C.blueBg : selectedFicha.promedioGeneral >= 1.5 ? C.amberBg : C.redBg,
                            selectedFicha.promedioGeneral >= 3.5 ? C.green : selectedFicha.promedioGeneral >= 2.5 ? C.blue : selectedFicha.promedioGeneral >= 1.5 ? C.amber : C.red
                          )}>
                            {selectedFicha.nivelGeneralLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: C.g50, borderRadius: 8, padding: 14, fontSize: 11, color: C.g500, border: `1px solid ${C.g200}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Cargado por:</span><span style={{ fontWeight: 600 }}>{selectedFicha.cargadoPor || "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Nombre Archivo:</span><span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>{selectedFicha.archivoOrigen || "—"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Aspect AR02 & AR03 details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
                  
                  {/* AR02 Desempeño indicators */}
                  <div>
                    <h4 style={{ color: C.navy3, borderBottom: `2px solid ${C.g100}`, paddingBottom: 6, margin: "0 0 10px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Desempeño Docente (AR02)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "2.1 Involucra activamente a estudiantes", val: selectedFicha.desempeno?.involucraEstudiantes },
                        { label: "2.2 Promueve razonamiento / creatividad", val: selectedFicha.desempeno?.promueveRazonamiento },
                        { label: "2.3 Evalúa progreso y retroalimenta", val: selectedFicha.desempeno?.evaluaProgreso },
                        { label: "2.4 Propicia ambiente de respeto", val: selectedFicha.desempeno?.ambienteRespeto },
                        { label: "2.5 Regula comportamiento", val: selectedFicha.desempeno?.regulaComportamiento }
                      ].map((ind, ii) => (
                        <div key={ii} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                          <span style={{ color: C.g700, maxWidth: "70%" }}>{ind.label}</span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: LEVEL_COLORS[ind.val?.nivel] + '18',
                            color: LEVEL_COLORS[ind.val?.nivel] || C.g500
                          }}>
                            {LEVEL_LABELS[ind.val?.nivel] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AR03 Planificación indicators */}
                  <div>
                    <h4 style={{ color: C.navy3, borderBottom: `2px solid ${C.g100}`, paddingBottom: 6, margin: "0 0 10px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Planificación Curricular (AR03)</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: C.g700 }}>3.1 ¿Presenta documentacion?</span>
                        <span style={{ fontWeight: 700, color: selectedFicha.planificacion?.presentaDocumentacion ? C.green : C.red }}>
                          {selectedFicha.planificacion?.presentaDocumentacion ? "Sí" : "No"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: C.g700 }}>3.2 Planifica usando</span>
                        <span style={{ fontWeight: 700, color: C.navy1 }}>
                          {selectedFicha.planificacion?.planificaConUso || "—"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: C.g700 }}>3.3 ¿Sesion ejecutada segun programacion?</span>
                        <span style={{ fontWeight: 700, color: selectedFicha.planificacion?.sesionEjecutada ? C.green : C.red }}>
                          {selectedFicha.planificacion?.sesionEjecutada ? "Sí" : "No"}
                        </span>
                      </div>
                      {[
                        { label: "3.4 Planificación anual coherente", val: selectedFicha.planificacion?.planificacionAnual },
                        { label: "3.5 Situacion significativa retadora", val: selectedFicha.planificacion?.situacionSignificativa },
                        { label: "3.6 Secuencia metodológica", val: selectedFicha.planificacion?.secuenciaMetodologica },
                        { label: "3.7 Metodología activa", val: selectedFicha.planificacion?.metodologiaActiva },
                        { label: "3.8 Uso pedagógico de recursos", val: selectedFicha.planificacion?.usoPedagogicoRecursos }
                      ].map((ind, ii) => (
                        <div key={ii} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                          <span style={{ color: C.g700, maxWidth: "70%" }}>{ind.label}</span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: LEVEL_COLORS[ind.val?.nivel] + '18',
                            color: LEVEL_COLORS[ind.val?.nivel] || C.g500
                          }}>
                            {LEVEL_LABELS[ind.val?.nivel] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Additional Text Areas: Compromisos, Comentarios, etc. */}
                {(selectedFicha.compromisos || selectedFicha.comentarios || selectedFicha.observaciones) && (
                  <div style={{ borderTop: `1px solid ${C.g200}`, paddingTop: 16 }}>
                    <h4 style={{ color: C.navy3, margin: "0 0 12px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>Detalles y Texto Libre</h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, fontSize: 12 }}>
                      {selectedFicha.compromisos && (
                        <div>
                          <div style={{ fontWeight: 700, color: C.navy1, marginBottom: 4 }}>Compromisos</div>
                          <div style={{ background: C.g50, borderRadius: 6, padding: "10px 12px", border: `1px solid ${C.g100}`, whiteSpace: "pre-wrap" }}>
                            {selectedFicha.compromisos}
                          </div>
                        </div>
                      )}
                      {selectedFicha.comentarios && (
                        <div>
                          <div style={{ fontWeight: 700, color: C.navy1, marginBottom: 4 }}>Comentarios</div>
                          <div style={{ background: C.g50, borderRadius: 6, padding: "10px 12px", border: `1px solid ${C.g100}`, whiteSpace: "pre-wrap" }}>
                            {selectedFicha.comentarios}
                          </div>
                        </div>
                      )}
                      {selectedFicha.observaciones && (
                        <div>
                          <div style={{ fontWeight: 700, color: C.navy1, marginBottom: 4 }}>Observaciones</div>
                          <div style={{ background: C.g50, borderRadius: 6, padding: "10px 12px", border: `1px solid ${C.g100}`, whiteSpace: "pre-wrap" }}>
                            {selectedFicha.observaciones}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions footer */}
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", borderTop: `1px solid ${C.g200}`, marginTop: 24, paddingTop: 16 }}>
                  {esStaffPleno ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleDeleteFicha} style={S.btn(C.white, C.red, C.redBorder)}>
                        Eliminar Ficha
                      </button>
                      <button onClick={() => setIsEditing(true)} style={S.btn(C.white, C.navy4, C.g200)}>
                        Editar Ficha
                      </button>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <button onClick={() => setSelectedFicha(null)} style={S.btn(C.navy4, C.white, C.navy5)}>
                    Cerrar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
