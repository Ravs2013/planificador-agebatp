import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeMonitoreoDirector, 
  batchSetMonitoreoDirector, 
  deleteMonitoreoDirector, 
  updateMonitoreoDirector 
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

const LEVEL_COLORS = { 1: C.red, 2: C.amber, 3: C.blue, 4: C.green };

/* TODO: Ajustar los criterios de gestión cuando se tenga el instrumento real de la ficha de director */
const GESTION_CRITERIOS_DEFAULT = [
  { key: 'planificacionInstitucional', label: 'Planificación Institucional' },
  { key: 'gestionPedagogica', label: 'Gestión Pedagógica' },
  { key: 'climaInstitucional', label: 'Clima Institucional' },
  { key: 'gestionRecursos', label: 'Gestión de Recursos' },
  { key: 'monitoreoInterno', label: 'Monitoreo Interno' },
];

export default function MonitoreoDirector() {
  const { user, isRole } = useAuth();
  const esStaffPleno = isRole('admin') || isRole('jefatura');

  const [programa, setPrograma] = useState('EBA');
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchDirector, setSearchDirector] = useState('');
  const [filterIE, setFilterIE] = useState('todos');
  const [filterMonitor, setFilterMonitor] = useState('todos');
  const [filterNivel, setFilterNivel] = useState('todos');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Upload
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [parsedItems, setParsedItems] = useState([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState(new Set());

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeMonitoreoDirector(programa, (list) => {
      setFichas(list || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [programa]);

  useEffect(() => { setCurrentPage(1); }, [searchDirector, filterIE, filterMonitor, filterNivel]);

  const filterOptions = useMemo(() => {
    const ies = new Set();
    const monitors = new Set();
    fichas.forEach(f => {
      if (f.institucionNombre) ies.add(`${f.institucionCodigo || ''} - ${f.institucionNombre}`);
      if (f.monitorNombre) monitors.add(f.monitorNombre);
    });
    return { ies: Array.from(ies).sort(), monitors: Array.from(monitors).sort() };
  }, [fichas]);

  const filteredFichas = useMemo(() => {
    return fichas.filter(f => {
      const matchDoc = !searchDirector || f.docenteNombre?.toLowerCase().includes(searchDirector.toLowerCase());
      const matchIE = filterIE === 'todos' || `${f.institucionCodigo || ''} - ${f.institucionNombre}` === filterIE;
      const matchMonitor = filterMonitor === 'todos' || f.monitorNombre === filterMonitor;
      const matchNivel = filterNivel === 'todos' || f.nivelGeneralLabel === filterNivel;
      return matchDoc && matchIE && matchMonitor && matchNivel;
    });
  }, [fichas, searchDirector, filterIE, filterMonitor, filterNivel]);

  const kpis = useMemo(() => {
    const total = filteredFichas.length;
    const directoresUnicos = new Set(filteredFichas.map(f => f.docenteNombre)).size;
    const ieUnicas = new Set(filteredFichas.map(f => f.institucionCodigo)).size;
    const sumG = filteredFichas.reduce((sum, f) => sum + (f.promedioGeneral || 0), 0);
    const promG = total > 0 ? parseFloat((sumG / total).toFixed(2)) : 0;
    return { total, directoresUnicos, ieUnicas, promG };
  }, [filteredFichas]);

  const chartPieData = useMemo(() => {
    const counts = { "Nivel I": 0, "Nivel II": 0, "Nivel III": 0, "Nivel IV": 0 };
    filteredFichas.forEach(f => { if (counts[f.nivelGeneralLabel] !== undefined) counts[f.nivelGeneralLabel]++; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [filteredFichas]);

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
      return { name: ind.label, "Nivel I": counts.I, "Nivel II": counts.II, "Nivel III": counts.III, "Nivel IV": counts.IV };
    });
  }, [filteredFichas]);

  const paginatedFichas = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredFichas.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredFichas, currentPage]);

  const totalPages = Math.ceil(filteredFichas.length / itemsPerPage);

  // File Processing (same accumulative logic as MonitoreoDocente)
  const processFiles = async (files) => {
    setIsProcessing(true);
    setProcessingProgress({ current: 0, total: files.length });
    const items = [];
    const idsToSelect = new Set();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingProgress({ current: i + 1, total: files.length });
      try {
        const text = await extraerTextoPdf(file);
        const parsed = parsearFicha(text, file.name, programa);
        // Add director-specific fields
        parsed.tipoMonitoreo = 'director';
        /* TODO: Ajustar con el instrumento real de la ficha de director */
        parsed.gestion = {};
        items.push(parsed);
        idsToSelect.add(parsed.id);
      } catch (err) {
        items.push({
          id: `error-${Date.now()}-${i}`,
          archivoOrigen: file.name,
          docenteNombre: "ERROR DE CARGA",
          institucionNombre: `El archivo PDF no se pudo leer o está corrupto.`,
          promedioGeneral: 0,
          nivelGeneralLabel: "Error",
          advertencias: [`Fallo en la lectura: ${err.message}`],
          isErrorItem: true
        });
      }
    }
    
    // Acumulación: no borra items previos
    setParsedItems(prev => [...prev, ...items]);
    setSelectedUploadIds(prev => {
      const next = new Set(prev);
      idsToSelect.forEach(id => next.add(id));
      return next;
    });
    setIsProcessing(false);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    if (!esStaffPleno) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.pdf$/i));
    if (files.length > 0) await processFiles(files);
  };
  const handleFileSelect = async (e) => {
    if (!esStaffPleno) return;
    const files = Array.from(e.target.files).filter(f => f.name.match(/\.pdf$/i));
    if (files.length > 0) await processFiles(files);
  };

  const handleSaveBulkUpload = async () => {
    const toSave = parsedItems.filter(item => selectedUploadIds.has(item.id) && !item.isErrorItem);
    if (toSave.length === 0) { showToast("No hay elementos válidos seleccionados.", "error"); return; }
    try {
      await batchSetMonitoreoDirector(programa, toSave, user.uid, user.nombre);
      showToast(`Se guardaron ${toSave.length} fichas de monitoreo director exitosamente.`);
      setParsedItems([]);
      setSelectedUploadIds(new Set());
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, "error");
    }
  };

  const openFichaDetails = (ficha) => { setSelectedFicha(ficha); setIsEditing(false); setEditForm({ ...ficha }); };
  
  const handleUpdateFicha = async () => {
    try {
      await updateMonitoreoDirector(programa, selectedFicha.id, editForm);
      showToast("Ficha actualizada correctamente.");
      setSelectedFicha(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch (err) { showToast(`Error al actualizar: ${err.message}`, "error"); }
  };

  const handleDeleteFicha = async () => {
    if (confirm(`¿Está seguro de eliminar la ficha de ${selectedFicha.docenteNombre}?`)) {
      try {
        await deleteMonitoreoDirector(programa, selectedFicha.id);
        showToast("Ficha eliminada.");
        setSelectedFicha(null);
      } catch (err) { showToast(`Error al eliminar: ${err.message}`, "error"); }
    }
  };

  const toggleSelectUploadId = (id) => { setSelectedUploadIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const toggleSelectAllUploads = () => {
    if (selectedUploadIds.size === parsedItems.filter(p => !p.isErrorItem).length) {
      setSelectedUploadIds(new Set());
    } else {
      const n = new Set();
      parsedItems.forEach(p => { if (!p.isErrorItem) n.add(p.id); });
      setSelectedUploadIds(n);
    }
  };

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    sectionTitle: { fontSize: "1.1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 16 },
    badge: (bg, color, border) => ({ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 4, background: bg, color, border: `1px solid ${border || color + '30'}`, letterSpacing: "0.04em", fontFamily: "'DM Sans'" }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
    statCard: (border) => ({ background: C.white, borderRadius: 10, padding: "18px 20px", borderLeft: `4px solid ${border}`, boxShadow: "0 1px 3px rgba(15,23,42,0.06)", borderTop: `1px solid ${C.g100}`, borderRight: `1px solid ${C.g100}`, borderBottom: `1px solid ${C.g100}` })
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.g800 }}>
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 28, zIndex: 220, padding: "10px 20px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? C.greenBg : C.redBg, border: `1px solid ${toast.type === "success" ? C.greenBorder : C.redBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", animation: "fadeIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <div>
          <h2 style={{ color: C.navy1, fontSize: "1.45rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Monitoreo de Gestión Directiva</h2>
          <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0" }}>Módulo para el registro, control y análisis de fichas de monitoreo a directores CEBA y CETPRO.</p>
        </div>
        <div style={{ display: "flex", background: C.g100, padding: 4, borderRadius: 8 }}>
          <button onClick={() => setPrograma('EBA')} style={{ padding: "6px 16px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, background: programa === 'EBA' ? C.white : "transparent", color: programa === 'EBA' ? C.navy3 : C.g500, cursor: "pointer", transition: "all 0.15s" }}>
            EBA (CEBA)
          </button>
          <button onClick={() => setPrograma('ETP')} style={{ padding: "6px 16px", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, background: programa === 'ETP' ? C.white : "transparent", color: programa === 'ETP' ? C.navy3 : C.g500, cursor: "pointer", transition: "all 0.15s" }}>
            ETP (CETPRO)
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, color: C.g500 }}>
          <span>Cargando datos de monitoreo director...</span>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {fichas.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
                <div style={S.statCard(C.navy4)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.navy4 }}>{kpis.total}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Total Fichas</div>
                </div>
                <div style={S.statCard(C.realNavy)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.realNavy }}>{kpis.directoresUnicos}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Directores</div>
                </div>
                <div style={S.statCard(C.gold2)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.gold1 }}>{kpis.ieUnicas}</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>IE Cubiertas</div>
                </div>
                <div style={S.statCard(C.blue)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 26, fontWeight: 700, color: C.blue }}>{kpis.promG} / 4.0</div>
                  <div style={{ fontSize: 11, color: C.g500, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Promedio General</div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>Distribución por Criterio de Desempeño</h3>
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
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>Calificación General del Director</h3>
                  <div style={{ height: 260, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartPieData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                            <Cell fill={C.red} /><Cell fill={C.amber} /><Cell fill={C.blue} /><Cell fill={C.green} />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
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

          {/* Filters */}
          {fichas.length > 0 && (
            <div style={{ ...S.card, padding: 18, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "flex-end" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={S.label}>Buscar Director</label>
                  <input type="text" placeholder="Nombre del director..." value={searchDirector} onChange={e => setSearchDirector(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Institución</label>
                  <select value={filterIE} onChange={e => setFilterIE(e.target.value)} style={S.input}>
                    <option value="todos">Todas las IE</option>
                    {filterOptions.ies.map(ie => <option key={ie} value={ie}>{ie}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Monitor</label>
                  <select value={filterMonitor} onChange={e => setFilterMonitor(e.target.value)} style={S.input}>
                    <option value="todos">Todos</option>
                    {filterOptions.monitors.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Nivel General</label>
                  <select value={filterNivel} onChange={e => setFilterNivel(e.target.value)} style={S.input}>
                    <option value="todos">Todos</option>
                    <option value="Nivel I">Nivel I</option>
                    <option value="Nivel II">Nivel II</option>
                    <option value="Nivel III">Nivel III</option>
                    <option value="Nivel IV">Nivel IV</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div style={{ ...S.card, padding: 0, overflow: "auto", marginBottom: 24 }}>
            <div style={{ padding: "14px 18px", background: `${C.navy5}08`, borderBottom: `2px solid ${C.navy5}25`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>
                Fichas de Monitoreo Director — {programa} ({filteredFichas.length})
              </h3>
            </div>
            {filteredFichas.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: C.g500 }}>
                <Icon name="folder" size={48} color={C.g300} style={{ marginBottom: 16 }} />
                <p style={{ fontSize: "0.85rem" }}>No hay fichas de director cargadas para {programa}. Use el panel de importación inferior.</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 80px 80px 70px 60px", padding: "10px 14px", gap: 6, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 600 }}>
                    {["#", "Director", "Institución", "Fecha", "Monitor", "Promedio", "Nivel"].map(h =>
                      <p key={h} style={{ color: C.g500, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, fontFamily: "'DM Sans'" }}>{h}</p>
                    )}
                  </div>
                  {paginatedFichas.map((f, i) => (
                    <div key={f.id} onClick={() => openFichaDetails(f)} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 80px 80px 70px 60px", alignItems: "center", padding: "12px 14px", gap: 6, borderBottom: `1px solid ${C.g100}`, cursor: "pointer", transition: "background 0.15s", minWidth: 600 }}
                      onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.75rem", fontFamily: "'JetBrains Mono'" }}>{(currentPage - 1) * itemsPerPage + i + 1}</div>
                      <p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.82rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.docenteNombre || "—"}</p>
                      <p style={{ color: C.g600, fontSize: "0.78rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.institucionNombre || "—"}</p>
                      <p style={{ color: C.g600, fontSize: "0.75rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{f.fechaEjecucionISO || f.fechaEjecucion || "—"}</p>
                      <p style={{ color: C.g600, fontSize: "0.72rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.monitorNombre || "—"}</p>
                      <p style={{ color: LEVEL_COLORS[Math.round(f.promedioGeneral)] || C.g500, fontWeight: 700, fontSize: "0.85rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{f.promedioGeneral?.toFixed(2) || "—"}</p>
                      <span style={S.badge(
                        f.nivelGeneralLabel === 'Nivel IV' ? C.greenBg : f.nivelGeneralLabel === 'Nivel III' ? C.blueBg : f.nivelGeneralLabel === 'Nivel II' ? C.amberBg : C.redBg,
                        f.nivelGeneralLabel === 'Nivel IV' ? C.green : f.nivelGeneralLabel === 'Nivel III' ? C.blue : f.nivelGeneralLabel === 'Nivel II' ? C.amber : C.red,
                        f.nivelGeneralLabel === 'Nivel IV' ? C.greenBorder : f.nivelGeneralLabel === 'Nivel III' ? C.blueBorder : f.nivelGeneralLabel === 'Nivel II' ? C.amberBorder : C.redBorder
                      )}>{f.nivelGeneralLabel || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 14 }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ ...S.btn(C.white, C.navy3, C.g200), opacity: currentPage === 1 ? 0.5 : 1 }}>← Anterior</button>
                    <span style={{ padding: "8px 12px", fontSize: 12, color: C.g500, fontFamily: "'DM Sans'" }}>Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ ...S.btn(C.white, C.navy3, C.g200), opacity: currentPage === totalPages ? 0.5 : 1 }}>Siguiente →</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Upload Panel (Accumulative) */}
          {esStaffPleno && (
            <div style={{ ...S.card, marginBottom: 24 }}>
              <h3 style={S.sectionTitle}>
                <Icon name="upload" size={18} color={C.navy4} style={{ marginRight: 8 }} />
                Importar Fichas de Director desde PDF (Carga Masiva)
              </h3>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ border: `2px dashed ${dragOver ? C.navy5 : C.g300}`, borderRadius: 10, padding: "40px 20px", textAlign: "center", background: dragOver ? `${C.navy5}08` : C.g50, transition: "all 0.2s", cursor: "pointer", marginBottom: parsedItems.length > 0 ? 20 : 0 }}
                onClick={() => document.getElementById("file-upload-input-director")?.click()}
              >
                <Icon name="upload" size={32} color={dragOver ? C.navy5 : C.g400} />
                <p style={{ color: C.g500, fontSize: "0.85rem", margin: "12px 0 4px" }}>
                  {isProcessing ? `Procesando archivo ${processingProgress.current} de ${processingProgress.total}...` : "Arrastre archivos PDF aquí o haga clic para seleccionar"}
                </p>
                <p style={{ color: C.g400, fontSize: "0.72rem", margin: 0 }}>Los archivos se acumulan sin borrar los anteriores</p>
                <input id="file-upload-input-director" type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={handleFileSelect} />
              </div>

              {/* Preview Table */}
              {parsedItems.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.navy1 }}>{parsedItems.length} fichas cargadas · {selectedUploadIds.size} seleccionadas</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={toggleSelectAllUploads} style={S.btn(C.white, C.navy3, C.g200)}>
                        {selectedUploadIds.size === parsedItems.filter(p => !p.isErrorItem).length ? "Deseleccionar Todo" : "Seleccionar Todo"}
                      </button>
                      <button onClick={() => { setParsedItems([]); setSelectedUploadIds(new Set()); }} style={S.btn(C.white, C.red, C.redBorder)}>Limpiar Vista</button>
                      <button onClick={handleSaveBulkUpload} disabled={selectedUploadIds.size === 0} style={{ ...S.btn(C.navy4, C.white, C.navy5), opacity: selectedUploadIds.size === 0 ? 0.5 : 1 }}>
                        Guardar {selectedUploadIds.size} Fichas Seleccionadas
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto", border: `1px solid ${C.g200}`, borderRadius: 8 }}>
                    {parsedItems.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.g100}`, background: item.isErrorItem ? C.redBg : "transparent" }}>
                        {!item.isErrorItem && (
                          <input type="checkbox" checked={selectedUploadIds.has(item.id)} onChange={() => toggleSelectUploadId(item.id)} />
                        )}
                        <span style={{ flex: 1, fontSize: 12, color: item.isErrorItem ? C.red : C.navy1, fontWeight: 500 }}>
                          {item.docenteNombre || "Sin nombre"} — {item.institucionNombre || "Sin IE"} — {item.fechaEjecucionISO || "Sin fecha"}
                        </span>
                        <span style={S.badge(
                          item.isErrorItem ? C.redBg : C.greenBg,
                          item.isErrorItem ? C.red : C.green,
                          item.isErrorItem ? C.redBorder : C.greenBorder
                        )}>{item.isErrorItem ? "Error" : item.nivelGeneralLabel || "OK"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedFicha && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 20px", overflow: "auto" }}
          onClick={() => setSelectedFicha(null)}>
          <div style={{ background: C.white, borderRadius: 12, width: "100%", maxWidth: 700, padding: 32, position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFicha(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: C.g500, display: 'flex', alignItems: 'center', padding: 4 }}><Icon name="x" size={20} /></button>
            <h3 style={{ ...S.sectionTitle, marginBottom: 20 }}>Detalle de Ficha — Director</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div><label style={S.label}>Director</label><p style={{ margin: 0, fontSize: 13, color: C.navy1 }}>{selectedFicha.docenteNombre}</p></div>
              <div><label style={S.label}>Institución</label><p style={{ margin: 0, fontSize: 13, color: C.navy1 }}>{selectedFicha.institucionNombre}</p></div>
              <div><label style={S.label}>Código Modular</label><p style={{ margin: 0, fontSize: 13, color: C.navy1 }}>{selectedFicha.institucionCodigo}</p></div>
              <div><label style={S.label}>Monitor</label><p style={{ margin: 0, fontSize: 13, color: C.navy1 }}>{selectedFicha.monitorNombre}</p></div>
              <div><label style={S.label}>Fecha</label><p style={{ margin: 0, fontSize: 13, color: C.navy1 }}>{selectedFicha.fechaEjecucion}</p></div>
              <div><label style={S.label}>Programa</label><p style={{ margin: 0, fontSize: 13, color: C.navy1 }}>{programa}</p></div>
            </div>

            <div style={{ background: C.g50, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.navy3 }}>Criterios de Desempeño</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(selectedFicha.desempeno || {}).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.white, borderRadius: 6, border: `1px solid ${C.g200}` }}>
                    <span style={{ fontSize: 11, color: C.g600 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: LEVEL_COLORS[val?.nivel] || C.g500 }}>{val?.nivel ? `Nivel ${val.nivel}` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TODO: Mostrar criterios de gestión cuando estén definidos */}
            {selectedFicha.gestion && Object.keys(selectedFicha.gestion).length > 0 && (
              <div style={{ background: C.g50, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: C.navy3 }}>Criterios de Gestión</h4>
                {Object.entries(selectedFicha.gestion).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", marginBottom: 4, background: C.white, borderRadius: 6, border: `1px solid ${C.g200}` }}>
                    <span style={{ fontSize: 11, color: C.g600 }}>{key}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.navy1 }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={{ textAlign: "center", padding: 14, borderRadius: 8, background: C.g50 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: LEVEL_COLORS[Math.round(selectedFicha.promedioDesempeno)] || C.navy1, fontFamily: "'JetBrains Mono'" }}>{selectedFicha.promedioDesempeno?.toFixed(2) || "—"}</div>
                <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>Prom. Desempeño</div>
              </div>
              <div style={{ textAlign: "center", padding: 14, borderRadius: 8, background: C.g50 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: LEVEL_COLORS[Math.round(selectedFicha.promedioGeneral)] || C.navy1, fontFamily: "'JetBrains Mono'" }}>{selectedFicha.promedioGeneral?.toFixed(2) || "—"}</div>
                <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>Prom. General</div>
              </div>
              <div style={{ textAlign: "center", padding: 14, borderRadius: 8, background: C.g50 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: LEVEL_COLORS[Math.round(selectedFicha.promedioGeneral)] || C.navy1 }}>{selectedFicha.nivelGeneralLabel}</div>
                <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>Nivel General</div>
              </div>
            </div>

            {esStaffPleno && (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={handleDeleteFicha} style={S.btn(C.redBg, C.red, C.redBorder)}>Eliminar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
