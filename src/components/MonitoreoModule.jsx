import { useState, useMemo, useRef, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ═══════════════════════════════════════════════════════════
   PALETA GUBERNAMENTAL UGEL 03 — AGEBATP
   ═══════════════════════════════════════════════════════════ */
const C = {
    navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
    gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
    g900: "#0F172A", g800: "#1E293B", g700: "#334155", g600: "#475569",
    g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
    g100: "#F1F5F9", g50: "#F8FAFC",
    bg: "#F5F6FA",
    red: "#B91C1C", amber: "#B45309", green: "#15803D",
    white: "#FFFFFF",
};

/* ═══════════════════════════════════════════════════════════
   ICONOS SVG
   ═══════════════════════════════════════════════════════════ */
const SvgIcon = ({ children, size = 20, color = C.g500, style: s, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...s }} {...props}>{children}</svg>
);

const I = {
    check: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></SvgIcon>,
    clock: (sz, cl) => <SvgIcon size={sz} color={cl}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SvgIcon>,
    trend: (sz, cl) => <SvgIcon size={sz} color={cl}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></SvgIcon>,
    file: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></SvgIcon>,
    download: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SvgIcon>,
    plus: (sz, cl) => <SvgIcon size={sz} color={cl}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></SvgIcon>,
    edit: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></SvgIcon>,
};

/* ═══════════════════════════════════════════════════════════
   PERSONAL FIJO DEL EQUIPO
   ═══════════════════════════════════════════════════════════ */
const PERSONAL = [
    { id: 1, nombre: "Liz Miluska Gutierrez Silva", rol: "oficinista", tipo: "-", shortName: "Gutierrez S." },
    { id: 2, nombre: "Juan Alberto Quispe Solano", rol: "especialista", tipo: "ETP", shortName: "Quispe S." },
    { id: 3, nombre: "Nelida Albino Igreda", rol: "especialista", tipo: "EBA", shortName: "Albino I." },
    { id: 4, nombre: "Francisco Villalobos Gonzales", rol: "especialista", tipo: "ETP", shortName: "Villalobos G." },
    { id: 5, nombre: "Lucy Ana Vasquez Aliaga", rol: "oficinista", tipo: "-", shortName: "Vasquez A." },
    { id: 6, nombre: "Beronica Olinda Cuellar Cornelio", rol: "oficinista", tipo: "-", shortName: "Cuellar C." },
];

/* ═══════════════════════════════════════════════════════════
   LOCAL STORAGE HELPERS
   ═══════════════════════════════════════════════════════════ */
const LS_KEY_SEMANAL = "agebatp_monitoreo_semanal";
const LS_KEY_ACUMULADO = "agebatp_monitoreo_acumulado";

const loadSemanal = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY_SEMANAL) || "[]"); } catch { return []; }
};
const saveSemanal = (data) => localStorage.setItem(LS_KEY_SEMANAL, JSON.stringify(data));

const loadAcumulado = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY_ACUMULADO) || "{}"); } catch { return {}; }
};
const saveAcumulado = (data) => localStorage.setItem(LS_KEY_ACUMULADO, JSON.stringify(data));

/* Obtener semana ISO actual */
const getCurrentWeek = () => {
    const now = new Date();
    const y = now.getFullYear();
    const jan1 = new Date(y, 0, 1);
    const days = Math.floor((now - jan1) / 86400000);
    const wn = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${y}-W${String(wn).padStart(2, "0")}`;
};

/* Obtener todas las semanas del año actual hasta la semana actual */
const getWeeksOfYear = () => {
    const now = new Date();
    const y = now.getFullYear();
    const current = getCurrentWeek();
    const weeks = [];
    for (let w = 1; w <= 53; w++) {
        const wk = `${y}-W${String(w).padStart(2, "0")}`;
        weeks.push(wk);
        if (wk === current) break;
    }
    return weeks;
};

/* Formatear semana para display */
const formatWeek = (w) => {
    if (!w) return "";
    const parts = w.split("-W");
    return `Semana ${parseInt(parts[1])} del ${parts[0]}`;
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTES INTERNOS
   ═══════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, border }) {
    return (
        <div style={{ background: C.white, borderRadius: 10, padding: "22px 20px", borderLeft: `4px solid ${border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <p style={{ color: C.g500, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'" }}>{label}</p>
                    <p style={{ color: C.navy1, fontSize: "1.8rem", margin: "6px 0 2px", fontFamily: "'DM Serif Display',serif" }}>{value}</p>
                    {sub && <p style={{ color: C.g500, fontSize: "0.78rem", margin: 0, fontFamily: "'DM Sans'" }}>{sub}</p>}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${border}12` }}>{icon}</div>
            </div>
        </div>
    );
}

function CTip({ active, payload, label }) {
    if (!active || !payload) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'" }}>
            <p style={{ color: C.g600, fontSize: "0.78rem", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: "0.8rem", margin: "2px 0", fontWeight: 600 }}>{p.name}: <span style={{ fontFamily: "'JetBrains Mono'" }}>{p.value}</span></p>)}
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function MonitoreoModule() {
    const [view, setView] = useState("semanal");
    const [showForm, setShowForm] = useState(false);
    const [showEditAcumulado, setShowEditAcumulado] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
    const [formWeek, setFormWeek] = useState(getCurrentWeek());
    const [weeklyData, setWeeklyData] = useState(loadSemanal());
    const [acumuladoData, setAcumuladoData] = useState(loadAcumulado());
    const [formEntries, setFormEntries] = useState(
        PERSONAL.map(p => ({ personId: p.id, procesados: "", pendientes: "" }))
    );
    const [editEntries, setEditEntries] = useState(
        PERSONAL.map(p => ({ personId: p.id, procesados: "", pendientes: "" }))
    );
    const [toast, setToast] = useState(null);
    const [exporting, setExporting] = useState(false);
    const chartRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── Guardar avance semanal ── */
    const handleSaveWeekly = () => {
        const entries = formEntries.filter(e => e.procesados !== "" || e.pendientes !== "");
        if (entries.length === 0) { showToast("Ingrese al menos un dato", "error"); return; }

        const newData = [...weeklyData];
        // Remove existing entries for this week
        const filtered = newData.filter(d => d.semana !== formWeek);

        entries.forEach(e => {
            const person = PERSONAL.find(p => p.id === e.personId);
            filtered.push({
                semana: formWeek,
                personId: e.personId,
                nombre: person.nombre,
                shortName: person.shortName,
                rol: person.rol,
                tipo: person.tipo,
                procesados: parseInt(e.procesados) || 0,
                pendientes: parseInt(e.pendientes) || 0,
            });
        });

        saveSemanal(filtered);
        setWeeklyData(filtered);

        // Recalculate cumulative
        recalcAcumulado(filtered);

        setShowForm(false);
        setFormEntries(PERSONAL.map(p => ({ personId: p.id, procesados: "", pendientes: "" })));
        showToast(`Avance de ${formatWeek(formWeek)} guardado correctamente`);
    };

    /* ── Recalcular acumulado ── */
    const recalcAcumulado = useCallback((data) => {
        const acc = {};
        PERSONAL.forEach(p => { acc[p.id] = { procesados: 0, pendientes: 0 }; });
        data.forEach(d => {
            if (!acc[d.personId]) acc[d.personId] = { procesados: 0, pendientes: 0 };
            acc[d.personId].procesados += d.procesados;
        });
        // For pendientes, use the latest week's pending value
        const weeksSorted = [...new Set(data.map(d => d.semana))].sort();
        if (weeksSorted.length > 0) {
            const latestWeek = weeksSorted[weeksSorted.length - 1];
            data.filter(d => d.semana === latestWeek).forEach(d => {
                if (acc[d.personId]) acc[d.personId].pendientes = d.pendientes;
            });
        }
        // Merge with existing acumulado (keep manual overrides)
        const existing = loadAcumulado();
        Object.keys(acc).forEach(id => {
            if (existing[id]?.pendientesManual !== undefined) {
                acc[id].pendientes = existing[id].pendientesManual;
                acc[id].pendientesManual = existing[id].pendientesManual;
            }
        });
        saveAcumulado(acc);
        setAcumuladoData(acc);
    }, []);

    /* ── Guardar acumulado editado manualmente ── */
    const handleSaveAcumulado = () => {
        const updated = { ...acumuladoData };
        editEntries.forEach(e => {
            const id = e.personId;
            if (!updated[id]) updated[id] = { procesados: 0, pendientes: 0 };
            if (e.procesados !== "") updated[id].procesados = parseInt(e.procesados) || 0;
            if (e.pendientes !== "") {
                updated[id].pendientes = parseInt(e.pendientes) || 0;
                updated[id].pendientesManual = parseInt(e.pendientes) || 0;
            }
        });
        saveAcumulado(updated);
        setAcumuladoData(updated);
        setShowEditAcumulado(false);
        showToast("Acumulado actualizado correctamente");
    };

    /* ── Exportar PDF ── */
    const handleExportPDF = async () => {
        if (!chartRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("landscape", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
            const w = imgWidth * ratio;
            const h = imgHeight * ratio;
            pdf.addImage(imgData, "PNG", (pdfWidth - w) / 2, 10, w, h);
            pdf.save(`Monitoreo_AGEBATP_${selectedWeek || "acumulado"}.pdf`);
            showToast("PDF exportado correctamente");
        } catch (err) {
            console.error("Error exporting PDF:", err);
            showToast("Error al exportar PDF", "error");
        }
        setExporting(false);
    };

    /* ── Datos filtrados para la semana seleccionada ── */
    const weekData = useMemo(() => weeklyData.filter(d => d.semana === selectedWeek), [weeklyData, selectedWeek]);
    const allWeeks = useMemo(() => [...new Set(weeklyData.map(d => d.semana))].sort(), [weeklyData]);

    /* ── KPIs ── */
    const kpis = useMemo(() => {
        const totalProcSemana = weekData.reduce((s, d) => s + d.procesados, 0);
        const totalPendSemana = weekData.reduce((s, d) => s + d.pendientes, 0);
        const totalProcAcum = Object.values(acumuladoData).reduce((s, d) => s + (d.procesados || 0), 0);
        const totalPendAcum = Object.values(acumuladoData).reduce((s, d) => s + (d.pendientes || 0), 0);
        return { totalProcSemana, totalPendSemana, totalProcAcum, totalPendAcum, semanasRegistradas: allWeeks.length };
    }, [weekData, acumuladoData, allWeeks]);

    /* ── Chart data para la vista semanal ── */
    const barDataSemanal = useMemo(() => {
        return weekData.map(d => ({
            nombre: d.shortName + (d.rol === "oficinista" ? " ✦" : ""),
            Procesados: d.procesados,
            Pendientes: d.pendientes,
        }));
    }, [weekData]);

    /* ── Chart data para tendencia semanal ── */
    const trendData = useMemo(() => {
        return allWeeks.map(w => {
            const wd = weeklyData.filter(d => d.semana === w);
            const entry = { semana: `S${parseInt(w.split("-W")[1])}` };
            wd.forEach(d => {
                entry[d.shortName + (d.rol === "oficinista" ? " ✦" : "")] = d.procesados;
            });
            return entry;
        });
    }, [allWeeks, weeklyData]);

    /* ── Chart data para acumulado ── */
    const barDataAcumulado = useMemo(() => {
        return PERSONAL.map(p => {
            const data = acumuladoData[p.id] || { procesados: 0, pendientes: 0 };
            return {
                nombre: p.shortName + (p.rol === "oficinista" ? " ✦" : ""),
                Procesados: data.procesados,
                Pendientes: data.pendientes,
            };
        });
    }, [acumuladoData]);

    /* ── Tendencia acumulativa semana a semana ── */
    const cumulativeTrendData = useMemo(() => {
        const cumulative = {};
        PERSONAL.forEach(p => { cumulative[p.id] = 0; });
        return allWeeks.map(w => {
            const wd = weeklyData.filter(d => d.semana === w);
            wd.forEach(d => { cumulative[d.personId] = (cumulative[d.personId] || 0) + d.procesados; });
            const entry = { semana: `S${parseInt(w.split("-W")[1])}` };
            PERSONAL.forEach(p => {
                entry[p.shortName + (p.rol === "oficinista" ? " ✦" : "")] = cumulative[p.id] || 0;
            });
            return entry;
        });
    }, [allWeeks, weeklyData]);

    const pieData = useMemo(() => {
        if (view === "semanal") return [{ name: "Procesados", value: kpis.totalProcSemana || 0 }, { name: "Pendientes", value: kpis.totalPendSemana || 0 }];
        return [{ name: "Procesados", value: kpis.totalProcAcum || 0 }, { name: "Pendientes", value: kpis.totalPendAcum || 0 }];
    }, [view, kpis]);

    /* ── Pre-fill form if week already has data ── */
    const openForm = () => {
        const existing = weeklyData.filter(d => d.semana === formWeek);
        if (existing.length > 0) {
            setFormEntries(PERSONAL.map(p => {
                const found = existing.find(e => e.personId === p.id);
                return { personId: p.id, procesados: found ? String(found.procesados) : "", pendientes: found ? String(found.pendientes) : "" };
            }));
        } else {
            setFormEntries(PERSONAL.map(p => ({ personId: p.id, procesados: "", pendientes: "" })));
        }
        setShowForm(true);
    };

    const openEditAcumulado = () => {
        setEditEntries(PERSONAL.map(p => {
            const data = acumuladoData[p.id] || { procesados: 0, pendientes: 0 };
            return { personId: p.id, procesados: String(data.procesados), pendientes: String(data.pendientes) };
        }));
        setShowEditAcumulado(true);
    };

    const card = { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g100}` };
    const h3s = { color: C.navy1, fontSize: "1.1rem", margin: "0 0 18px", fontFamily: "'DM Serif Display',serif" };
    const btn = (on, bgOn, colOn) => ({ padding: "7px 16px", border: "none", cursor: "pointer", background: on ? bgOn : "transparent", color: on ? colOn : C.g500, fontSize: "0.78rem", fontWeight: on ? 700 : 500, transition: "all 0.15s", fontFamily: "'DM Sans'", borderRadius: on ? 0 : 0 });
    const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" };
    const labelStyle = { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" };

    const nEspecialistas = PERSONAL.filter(s => s.rol === "especialista").length;
    const nOficinistas = PERSONAL.filter(s => s.rol === "oficinista").length;

    const SPEC_COLORS = [C.navy5, C.red, C.amber, C.green, C.g500, C.gold2];

    return (
        <div>
            {/* TOAST */}
            {toast && <div style={{ position: "fixed", top: 80, right: 28, zIndex: 200, padding: "10px 20px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECACA"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'", animation: "fadeIn 0.2s ease" }}>{toast.msg}</div>}

            {/* HEADER CONTROLS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Monitoreo Semanal — AGEBATP</h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>Periodo {new Date().getFullYear()} · <span style={{ color: C.navy5 }}>{nEspecialistas} especialistas</span> · <span style={{ color: C.gold1 }}>{nOficinistas} oficinistas</span> · <span style={{ color: C.g400 }}>{kpis.semanasRegistradas} semanas registradas</span></p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {/* Botón Registrar Avance */}
                    <button onClick={openForm} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: C.gold2, color: C.white, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "'DM Sans'" }}>
                        {I.plus(15, C.white)} Registrar Avance Semanal
                    </button>

                    {/* Vistas */}
                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.g200}` }}>
                        {[["semanal", "Semanal"], ["acumulado", "Acumulado"], ["tendencia", "Tendencia"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} style={btn(view === v, C.navy3, C.white)}>{l}</button>)}
                    </div>

                    {/* Exportar PDF */}
                    <button onClick={handleExportPDF} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.navy3, cursor: exporting ? "wait" : "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans'", opacity: exporting ? 0.6 : 1 }}>
                        {I.download(15, C.navy3)} {exporting ? "Exportando..." : "Exportar PDF"}
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard icon={I.file(20, C.navy4)} label="Procesados (Semana)" value={kpis.totalProcSemana.toLocaleString()} sub={weekData.length > 0 ? formatWeek(selectedWeek) : "Sin datos"} border={C.navy4} />
                <StatCard icon={I.clock(20, C.amber)} label="Pendientes (Semana)" value={kpis.totalPendSemana.toLocaleString()} sub="En la semana seleccionada" border={C.amber} />
                <StatCard icon={I.check(20, C.green)} label="Procesados (Acumulado)" value={kpis.totalProcAcum.toLocaleString()} sub="Desde inicio del año" border={C.green} />
                <StatCard icon={I.trend(20, C.red)} label="Pendientes (Acumulado)" value={kpis.totalPendAcum.toLocaleString()} sub="Total actual pendiente" border={C.red} />
            </div>

            {/* CHART AREA (this is what gets exported to PDF) */}
            <div ref={chartRef}>

                {/* ──── VISTA SEMANAL ──── */}
                {view === "semanal" && (
                    <div>
                        {/* Selector de semana */}
                        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <label style={labelStyle}>Seleccionar Semana:</label>
                            <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }}>
                                {allWeeks.length === 0 && <option value="">No hay semanas registradas</option>}
                                {allWeeks.map(w => <option key={w} value={w}>{formatWeek(w)}</option>)}
                            </select>
                        </div>

                        {weekData.length === 0 ? (
                            <div style={{ ...card, textAlign: "center", padding: 60 }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                                <h3 style={{ color: C.navy1, fontSize: "1.2rem", margin: "0 0 8px", fontFamily: "'DM Serif Display',serif" }}>Sin datos para esta semana</h3>
                                <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>Usa el botón <strong>"Registrar Avance Semanal"</strong> para ingresar los datos de procesados y pendientes.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                                <div style={card}>
                                    <h3 style={h3s}>Procesados vs Pendientes — {formatWeek(selectedWeek)}</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={barDataSemanal} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /><Bar dataKey="Procesados" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Pendientes" fill={C.red} radius={[4, 4, 0, 0]} /></BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={card}>
                                    <h3 style={h3s}>Estado General — Semana</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /></PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: "flex", justifyContent: "center", gap: 30, marginTop: 10 }}>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontSize: "1.5rem", fontFamily: "'DM Serif Display'" }}>{kpis.totalProcSemana + kpis.totalPendSemana > 0 ? Math.round(kpis.totalProcSemana / (kpis.totalProcSemana + kpis.totalPendSemana) * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.72rem", fontFamily: "'DM Sans'" }}>Resolución</p></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.navy4, fontSize: "1.5rem", fontFamily: "'DM Serif Display'" }}>{weekData.length}</p><p style={{ color: C.g500, fontSize: "0.72rem", fontFamily: "'DM Sans'" }}>Personas</p></div>
                                    </div>
                                </div>

                                {/* Tabla detallada de la semana */}
                                <div style={{ gridColumn: "1 / -1", ...card, padding: 0, overflow: "hidden" }}>
                                    <div style={{ padding: "14px 18px", background: `${C.navy5}08`, borderBottom: `2px solid ${C.navy5}25` }}>
                                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Detalle {formatWeek(selectedWeek)}</h3>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 100px 100px 60px", padding: "12px 18px", gap: 10, borderBottom: `2px solid ${C.g200}`, background: C.g50 }}>
                                        {["#", "Nombre", "Rol", "Procesados", "Pendientes", "Tipo"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Nombre" ? "left" : "center" }}>{h}</p>)}
                                    </div>
                                    {weekData.map((d, i) => (
                                        <div key={d.personId} style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 100px 100px 60px", alignItems: "center", padding: "14px 18px", gap: 10, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s" }}
                                            onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                            <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.82rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                            <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.87rem", margin: 0, fontFamily: "'DM Sans'" }}>{d.nombre}</p></div>
                                            <p style={{ textAlign: "center", color: C.g600, fontSize: "0.75rem", margin: 0, fontFamily: "'DM Sans'", textTransform: "capitalize" }}>{d.rol}</p>
                                            <p style={{ textAlign: "center", color: C.green, fontWeight: 700, fontSize: "0.95rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.procesados}</p>
                                            <p style={{ textAlign: "center", color: d.pendientes > 20 ? C.red : C.amber, fontWeight: 700, fontSize: "0.95rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.pendientes}</p>
                                            <p style={{ textAlign: "center", fontSize: "0.7rem", margin: 0, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: d.tipo === "EBA" ? C.navy5 : d.tipo === "ETP" ? C.gold1 : C.g500 }}>{d.tipo}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── VISTA ACUMULADO ──── */}
                {view === "acumulado" && (
                    <div>
                        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                            <div>
                                <h3 style={{ ...h3s, marginBottom: 4 }}>Acumulado Anual {new Date().getFullYear()}</h3>
                                <p style={{ color: C.g500, fontSize: "0.82rem", margin: 0, fontFamily: "'DM Sans'" }}>Procesados y pendientes totales desde inicio del año hasta la actualidad</p>
                            </div>
                            <button onClick={openEditAcumulado} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: C.navy4, color: C.white, border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "'DM Sans'" }}>
                                {I.edit(15, C.white)} Actualizar Acumulado
                            </button>
                        </div>

                        {Object.keys(acumuladoData).length === 0 ? (
                            <div style={{ ...card, textAlign: "center", padding: 60 }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                                <h3 style={{ color: C.navy1, fontSize: "1.2rem", margin: "0 0 8px", fontFamily: "'DM Serif Display',serif" }}>Sin datos acumulados</h3>
                                <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>Registra avances semanales para ver el acumulado aquí.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                                <div style={card}>
                                    <h3 style={h3s}>Procesados vs Pendientes — Acumulado {new Date().getFullYear()}</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={barDataAcumulado} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /><Bar dataKey="Procesados" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Pendientes" fill={C.red} radius={[4, 4, 0, 0]} /></BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={card}>
                                    <h3 style={h3s}>Estado General — Acumulado</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /></PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: "flex", justifyContent: "center", gap: 30, marginTop: 10 }}>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontSize: "1.5rem", fontFamily: "'DM Serif Display'" }}>{kpis.totalProcAcum + kpis.totalPendAcum > 0 ? Math.round(kpis.totalProcAcum / (kpis.totalProcAcum + kpis.totalPendAcum) * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.72rem", fontFamily: "'DM Sans'" }}>Resolución</p></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.navy4, fontSize: "1.5rem", fontFamily: "'DM Serif Display'" }}>{PERSONAL.length}</p><p style={{ color: C.g500, fontSize: "0.72rem", fontFamily: "'DM Sans'" }}>Personal</p></div>
                                    </div>
                                </div>

                                {/* Tabla acumulado */}
                                <div style={{ gridColumn: "1 / -1", ...card, padding: 0, overflow: "hidden" }}>
                                    <div style={{ padding: "14px 18px", background: `${C.green}08`, borderBottom: `2px solid ${C.green}25` }}>
                                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Detalle Acumulado — Año {new Date().getFullYear()}</h3>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 110px 110px 60px", padding: "12px 18px", gap: 10, borderBottom: `2px solid ${C.g200}`, background: C.g50 }}>
                                        {["#", "Nombre", "Rol", "Total Procesados", "Total Pendientes", "Tipo"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Nombre" ? "left" : "center" }}>{h}</p>)}
                                    </div>
                                    {PERSONAL.map((p, i) => {
                                        const data = acumuladoData[p.id] || { procesados: 0, pendientes: 0 };
                                        return (
                                            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 110px 110px 60px", alignItems: "center", padding: "14px 18px", gap: 10, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s" }}
                                                onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.82rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                                <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.87rem", margin: 0, fontFamily: "'DM Sans'" }}>{p.nombre}</p></div>
                                                <p style={{ textAlign: "center", color: C.g600, fontSize: "0.75rem", margin: 0, fontFamily: "'DM Sans'", textTransform: "capitalize" }}>{p.rol}</p>
                                                <p style={{ textAlign: "center", color: C.green, fontWeight: 700, fontSize: "1rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{data.procesados}</p>
                                                <p style={{ textAlign: "center", color: data.pendientes > 20 ? C.red : C.amber, fontWeight: 700, fontSize: "1rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{data.pendientes}</p>
                                                <p style={{ textAlign: "center", fontSize: "0.7rem", margin: 0, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g500 }}>{p.tipo}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── VISTA TENDENCIA SEMANAL ──── */}
                {view === "tendencia" && (
                    <div style={card}>
                        <h3 style={h3s}>Tendencia Semanal de Procesamiento</h3>
                        <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 6px", fontFamily: "'DM Sans'" }}>Expedientes procesados por semana ({allWeeks.length} semanas registradas)</p>
                        <p style={{ color: C.g400, fontSize: "0.7rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>✦ = Oficinista (asignación/revisión)</p>
                        {allWeeks.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 40, color: C.g400, fontSize: "0.9rem" }}>Sin datos. Registra avances semanales para ver la tendencia.</div>
                        ) : (
                            <>
                            <ResponsiveContainer width="100%" height={380}>
                                <AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="semana" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                    {PERSONAL.map((p, idx) => {
                                        const key = p.shortName + (p.rol === "oficinista" ? " ✦" : "");
                                        const isOfic = p.rol === "oficinista";
                                        return <Area key={key} type="monotone" dataKey={key} stroke={SPEC_COLORS[idx % SPEC_COLORS.length]} fill={`${SPEC_COLORS[idx % SPEC_COLORS.length]}15`} strokeWidth={isOfic ? 1.5 : 2} strokeDasharray={isOfic ? "5 3" : undefined} />;
                                    })}
                                </AreaChart>
                            </ResponsiveContainer>
                            {/* Cumulative trend */}
                            <div style={{ marginTop: 30 }}>
                                <h3 style={h3s}>Tendencia Acumulativa Semanal</h3>
                                <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>Total acumulado de procesados semana a semana</p>
                                <ResponsiveContainer width="100%" height={380}>
                                    <AreaChart data={cumulativeTrendData}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="semana" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                        {PERSONAL.map((p, idx) => {
                                            const key = p.shortName + (p.rol === "oficinista" ? " ✦" : "");
                                            const isOfic = p.rol === "oficinista";
                                            return <Area key={key} type="monotone" dataKey={key} stroke={SPEC_COLORS[idx % SPEC_COLORS.length]} fill={`${SPEC_COLORS[idx % SPEC_COLORS.length]}15`} strokeWidth={isOfic ? 1.5 : 2} strokeDasharray={isOfic ? "5 3" : undefined} />;
                                        })}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ──── MODAL: REGISTRAR AVANCE SEMANAL ──── */}
            {showForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={() => setShowForm(false)}>
                    <div style={{ background: C.white, borderRadius: 12, padding: 28, width: "95%", maxWidth: 700, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: C.navy1, fontSize: "1.25rem", margin: "0 0 6px", fontFamily: "'DM Serif Display',serif" }}>Registrar Avance Semanal</h3>
                        <p style={{ color: C.g500, fontSize: "0.82rem", margin: "0 0 20px", fontFamily: "'DM Sans'" }}>Ingrese los procesados y pendientes de cada persona para la semana seleccionada.</p>

                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Semana</label>
                            <input type="week" value={formWeek} onChange={e => { setFormWeek(e.target.value); }} style={{ ...inputStyle, maxWidth: 240 }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", gap: "8px 12px", marginBottom: 24 }}>
                            <p style={{ ...labelStyle, margin: 0 }}>Personal</p>
                            <p style={{ ...labelStyle, margin: 0, textAlign: "center" }}>Procesados</p>
                            <p style={{ ...labelStyle, margin: 0, textAlign: "center" }}>Pendientes</p>
                            {PERSONAL.map((p, idx) => (
                                <>
                                    <div key={`n-${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: p.tipo === "EBA" ? `${C.navy5}15` : p.tipo === "ETP" ? `${C.gold2}15` : `${C.g500}15`, color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g600 }}>{p.tipo === "-" ? "OFIC" : p.tipo}</span>
                                        <span style={{ fontSize: "0.85rem", color: C.navy1, fontWeight: 500, fontFamily: "'DM Sans'" }}>{p.shortName}</span>
                                    </div>
                                    <input key={`p-${p.id}`} type="number" min="0" placeholder="0" value={formEntries[idx]?.procesados ?? ""} onChange={e => { const ne = [...formEntries]; ne[idx] = { ...ne[idx], procesados: e.target.value }; setFormEntries(ne); }} style={{ ...inputStyle, textAlign: "center" }} />
                                    <input key={`d-${p.id}`} type="number" min="0" placeholder="0" value={formEntries[idx]?.pendientes ?? ""} onChange={e => { const ne = [...formEntries]; ne[idx] = { ...ne[idx], pendientes: e.target.value }; setFormEntries(ne); }} style={{ ...inputStyle, textAlign: "center" }} />
                                </>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.g600, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'DM Sans'" }}>Cancelar</button>
                            <button onClick={handleSaveWeekly} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.green, color: C.white, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "'DM Sans'" }}>Guardar Avance</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ──── MODAL: EDITAR ACUMULADO ──── */}
            {showEditAcumulado && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={() => setShowEditAcumulado(false)}>
                    <div style={{ background: C.white, borderRadius: 12, padding: 28, width: "95%", maxWidth: 700, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: C.navy1, fontSize: "1.25rem", margin: "0 0 6px", fontFamily: "'DM Serif Display',serif" }}>Actualizar Acumulado Anual</h3>
                        <p style={{ color: C.g500, fontSize: "0.82rem", margin: "0 0 20px", fontFamily: "'DM Sans'" }}>Aquí puede corregir/actualizar los totales acumulados de procesados y pendientes de todo el año.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 130px", gap: "8px 12px", marginBottom: 24 }}>
                            <p style={{ ...labelStyle, margin: 0 }}>Personal</p>
                            <p style={{ ...labelStyle, margin: 0, textAlign: "center" }}>Total Procesados</p>
                            <p style={{ ...labelStyle, margin: 0, textAlign: "center" }}>Total Pendientes</p>
                            {PERSONAL.map((p, idx) => (
                                <>
                                    <div key={`n-${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: p.tipo === "EBA" ? `${C.navy5}15` : p.tipo === "ETP" ? `${C.gold2}15` : `${C.g500}15`, color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g600 }}>{p.tipo === "-" ? "OFIC" : p.tipo}</span>
                                        <span style={{ fontSize: "0.85rem", color: C.navy1, fontWeight: 500, fontFamily: "'DM Sans'" }}>{p.shortName}</span>
                                    </div>
                                    <input key={`p-${p.id}`} type="number" min="0" value={editEntries[idx]?.procesados ?? ""} onChange={e => { const ne = [...editEntries]; ne[idx] = { ...ne[idx], procesados: e.target.value }; setEditEntries(ne); }} style={{ ...inputStyle, textAlign: "center" }} />
                                    <input key={`d-${p.id}`} type="number" min="0" value={editEntries[idx]?.pendientes ?? ""} onChange={e => { const ne = [...editEntries]; ne[idx] = { ...ne[idx], pendientes: e.target.value }; setEditEntries(ne); }} style={{ ...inputStyle, textAlign: "center" }} />
                                </>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowEditAcumulado(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.g600, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'DM Sans'" }}>Cancelar</button>
                            <button onClick={handleSaveAcumulado} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.navy4, color: C.white, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "'DM Sans'" }}>Guardar Acumulado</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
