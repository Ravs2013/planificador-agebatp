import { useState, useMemo, useRef, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
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
    /* Produccion Real — colores de desglose */
    realNavy: "#1E4D7B", indigo: "#4338CA", teal: "#0F766E", docAmber: "#B45309", slate: "#475569",
    purple: "#7C3AED",
};

const DOC_COLORS = { informes: "#4338CA", oficios: "#0F766E", oficiosMultiples: "#B45309", memorandums: "#475569" };

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
    pen: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></SvgIcon>,
};

/* ═══════════════════════════════════════════════════════════
   E-SINAD HELPERS
   ═══════════════════════════════════════════════════════════ */
const ESINAD_LS_SEMANAL = "agebatp_esinad_semanal";
const ESINAD_LS_ACUMULADO = "agebatp_esinad_acumulado";

const PERSONAL_ESINAD = [
    { id: 1, fullNames: ["GUTIERREZ SILVA"], shortName: "Gutierrez S.", nombre: "Gutierrez Silva, Liz M.", rol: "oficinista", tipo: "-" },
    { id: 2, fullNames: ["QUISPE SOLANO"], shortName: "Quispe S.", nombre: "Quispe Solano, Juan A.", rol: "especialista", tipo: "ETP" },
    { id: 3, fullNames: ["ALBINO IGREDA"], shortName: "Albino I.", nombre: "Albino Igreda, Nelida", rol: "especialista", tipo: "EBA" },
    { id: 4, fullNames: ["VILLALOBOS GONZALES"], shortName: "Villalobos G.", nombre: "Villalobos Gonzales, Francisco", rol: "especialista", tipo: "ETP" },
    { id: 5, fullNames: ["VASQUEZ ALIAGA"], shortName: "Vasquez A.", nombre: "Vasquez Aliaga, Lucy A.", rol: "oficinista", tipo: "-" },
    { id: 6, fullNames: ["CUELLAR CORNELIO"], shortName: "Cuellar C.", nombre: "Cuellar Cornelio, Beronica O.", rol: "oficinista", tipo: "-" },
];

const SKIP_NAMES = ["NINAMANGO", "FBRC UGEL", "FBRC"];

function matchPerson(excelName) {
    if (!excelName) return null;
    const upper = excelName.toUpperCase().trim();
    if (SKIP_NAMES.some(s => upper.includes(s))) return null;
    for (const p of PERSONAL_ESINAD) {
        if (p.fullNames.some(fn => upper.includes(fn))) return p;
    }
    return null;
}

function classifyDoc(tipoDoc) {
    if (!tipoDoc || typeof tipoDoc !== "string") return null;
    const t = tipoDoc.trim().toUpperCase();
    if (t.startsWith("EXPEDIENTE")) return null;
    if (t.startsWith("INFORME")) return "informes";
    if (t.startsWith("OFICIO MULT") || t.startsWith("OFICIO MÚLT")) return "oficiosMultiples";
    if (t.startsWith("OFICIO")) return "oficios";
    if (t.startsWith("MEMORANDUM") || t.startsWith("MEMORÁNDUM")) return "memorandums";
    return null;
}

function catLabel(cat) {
    if (cat === "informes") return "Informes";
    if (cat === "oficios") return "Oficios";
    if (cat === "oficiosMultiples") return "Of. Multiples";
    if (cat === "memorandums") return "Memorandums";
    return cat;
}

function formatExcelDate(val) {
    if (!val) return "";
    if (typeof val === "number") {
        const d = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
    return String(val).trim();
}

const IEsinad = {
    upload: (s = 20, c = C.g500) => <SvgIcon size={s} color={c}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></SvgIcon>,
    trash: (s = 20, c = C.g500) => <SvgIcon size={s} color={c}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></SvgIcon>,
    chevDown: (s = 16, c = C.g500) => <SvgIcon size={s} color={c}><polyline points="6 9 12 15 18 9"/></SvgIcon>,
    chevUp: (s = 16, c = C.g500) => <SvgIcon size={s} color={c}><polyline points="18 15 12 9 6 15"/></SvgIcon>,
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
    const emptyEntry = (id) => ({ personId: id, procesados: "", pendientes: "", informes: "", oficios: "", oficiosMultiples: "", memorandums: "" });
    const [formEntries, setFormEntries] = useState(PERSONAL.map(p => emptyEntry(p.id)));
    const [editEntries, setEditEntries] = useState(PERSONAL.map(p => emptyEntry(p.id)));
    const [toast, setToast] = useState(null);
    const [exporting, setExporting] = useState(false);
    const chartRef = useRef(null);

    /* ── E-SINAD state ── */
    const loadEsinadWeeks = () => { try { return JSON.parse(localStorage.getItem(ESINAD_LS_SEMANAL) || "[]"); } catch { return []; } };
    const [esinadWeeks, setEsinadWeeks] = useState(loadEsinadWeeks);
    const [esinadSelectedWeek, setEsinadSelectedWeek] = useState(() => { const now = new Date(); const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); const wn = Math.ceil(((d - ys) / 86400000 + 1) / 7); return `${d.getUTCFullYear()}-W${String(wn).padStart(2, "0")}`; });
    const [esinadViewMode, setEsinadViewMode] = useState("semana");
    const [esinadExpandedPerson, setEsinadExpandedPerson] = useState(null);
    const [esinadDragOver, setEsinadDragOver] = useState(false);
    const [esinadProcessing, setEsinadProcessing] = useState(false);
    const [esinadError, setEsinadError] = useState("");
    const esinadFileRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── Guardar avance semanal ── */
    const handleSaveWeekly = () => {
        const entries = formEntries.filter(e => e.procesados !== "" || e.pendientes !== "" || e.informes !== "" || e.oficios !== "" || e.oficiosMultiples !== "" || e.memorandums !== "");
        if (entries.length === 0) { showToast("Ingrese al menos un dato", "error"); return; }

        const filtered = weeklyData.filter(d => d.semana !== formWeek);

        entries.forEach(e => {
            const person = PERSONAL.find(p => p.id === e.personId);
            const inf = parseInt(e.informes) || 0;
            const ofi = parseInt(e.oficios) || 0;
            const ofm = parseInt(e.oficiosMultiples) || 0;
            const mem = parseInt(e.memorandums) || 0;
            filtered.push({
                semana: formWeek, personId: e.personId, nombre: person.nombre,
                shortName: person.shortName, rol: person.rol, tipo: person.tipo,
                procesados: parseInt(e.procesados) || 0, pendientes: parseInt(e.pendientes) || 0,
                informes: inf, oficios: ofi, oficiosMultiples: ofm, memorandums: mem,
                totalReal: inf + ofi + ofm + mem,
            });
        });

        saveSemanal(filtered);
        setWeeklyData(filtered);
        recalcAcumulado(filtered);
        setShowForm(false);
        setFormEntries(PERSONAL.map(p => emptyEntry(p.id)));
        showToast(`Avance de ${formatWeek(formWeek)} guardado correctamente`);
    };

    /* ── Recalcular acumulado ── */
    const recalcAcumulado = useCallback((data) => {
        const acc = {};
        PERSONAL.forEach(p => { acc[p.id] = { procesados: 0, pendientes: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 }; });
        data.forEach(d => {
            if (!acc[d.personId]) acc[d.personId] = { procesados: 0, pendientes: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 };
            acc[d.personId].procesados += d.procesados;
            acc[d.personId].informes += (d.informes || 0);
            acc[d.personId].oficios += (d.oficios || 0);
            acc[d.personId].oficiosMultiples += (d.oficiosMultiples || 0);
            acc[d.personId].memorandums += (d.memorandums || 0);
            acc[d.personId].totalReal += (d.totalReal || 0);
        });
        const weeksSorted = [...new Set(data.map(d => d.semana))].sort();
        if (weeksSorted.length > 0) {
            const latestWeek = weeksSorted[weeksSorted.length - 1];
            data.filter(d => d.semana === latestWeek).forEach(d => {
                if (acc[d.personId]) acc[d.personId].pendientes = d.pendientes;
            });
        }
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
            if (!updated[id]) updated[id] = { procesados: 0, pendientes: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 };
            if (e.procesados !== "") updated[id].procesados = parseInt(e.procesados) || 0;
            if (e.pendientes !== "") { updated[id].pendientes = parseInt(e.pendientes) || 0; updated[id].pendientesManual = parseInt(e.pendientes) || 0; }
            if (e.informes !== "") updated[id].informes = parseInt(e.informes) || 0;
            if (e.oficios !== "") updated[id].oficios = parseInt(e.oficios) || 0;
            if (e.oficiosMultiples !== "") updated[id].oficiosMultiples = parseInt(e.oficiosMultiples) || 0;
            if (e.memorandums !== "") updated[id].memorandums = parseInt(e.memorandums) || 0;
            updated[id].totalReal = (updated[id].informes || 0) + (updated[id].oficios || 0) + (updated[id].oficiosMultiples || 0) + (updated[id].memorandums || 0);
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
        const totalRealSemana = weekData.reduce((s, d) => s + (d.totalReal || 0), 0);
        const totalProcAcum = Object.values(acumuladoData).reduce((s, d) => s + (d.procesados || 0), 0);
        const totalPendAcum = Object.values(acumuladoData).reduce((s, d) => s + (d.pendientes || 0), 0);
        const totalRealAcum = Object.values(acumuladoData).reduce((s, d) => s + (d.totalReal || 0), 0);
        return { totalProcSemana, totalPendSemana, totalRealSemana, totalProcAcum, totalPendAcum, totalRealAcum, semanasRegistradas: allWeeks.length };
    }, [weekData, acumuladoData, allWeeks]);

    /* ── Chart data para la vista semanal ── */
    const barDataSemanal = useMemo(() => {
        return weekData.map(d => ({
            nombre: d.shortName + (d.rol === "oficinista" ? " *" : ""),
            "E-SINAD": d.procesados, "Prod. Real": d.totalReal || 0, Pendientes: d.pendientes,
            Informes: d.informes || 0, Oficios: d.oficios || 0, "Of. Multiples": d.oficiosMultiples || 0, Memorandums: d.memorandums || 0,
        }));
    }, [weekData]);

    /* ── Chart data para tendencia semanal ── */
    const trendData = useMemo(() => {
        return allWeeks.map(w => {
            const wd = weeklyData.filter(d => d.semana === w);
            const entry = { semana: `S${parseInt(w.split("-W")[1])}` };
            wd.forEach(d => { entry[d.shortName + (d.rol === "oficinista" ? " *" : "")] = d.procesados; });
            return entry;
        });
    }, [allWeeks, weeklyData]);

    const trendDataReal = useMemo(() => {
        return allWeeks.map(w => {
            const wd = weeklyData.filter(d => d.semana === w);
            const entry = { semana: `S${parseInt(w.split("-W")[1])}` };
            wd.forEach(d => { entry[d.shortName + (d.rol === "oficinista" ? " *" : "")] = d.totalReal || 0; });
            return entry;
        });
    }, [allWeeks, weeklyData]);

    /* ── Chart data para acumulado ── */
    const barDataAcumulado = useMemo(() => {
        return PERSONAL.map(p => {
            const d = acumuladoData[p.id] || { procesados: 0, pendientes: 0, totalReal: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0 };
            return {
                nombre: p.shortName + (p.rol === "oficinista" ? " *" : ""),
                "E-SINAD": d.procesados, "Prod. Real": d.totalReal || 0, Pendientes: d.pendientes,
                Informes: d.informes || 0, Oficios: d.oficios || 0, "Of. Multiples": d.oficiosMultiples || 0, Memorandums: d.memorandums || 0,
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
            PERSONAL.forEach(p => { entry[p.shortName + (p.rol === "oficinista" ? " *" : "")] = cumulative[p.id] || 0; });
            return entry;
        });
    }, [allWeeks, weeklyData]);

    const cumulativeTrendDataReal = useMemo(() => {
        const cumulative = {};
        PERSONAL.forEach(p => { cumulative[p.id] = 0; });
        return allWeeks.map(w => {
            const wd = weeklyData.filter(d => d.semana === w);
            wd.forEach(d => { cumulative[d.personId] = (cumulative[d.personId] || 0) + (d.totalReal || 0); });
            const entry = { semana: `S${parseInt(w.split("-W")[1])}` };
            PERSONAL.forEach(p => { entry[p.shortName + (p.rol === "oficinista" ? " *" : "")] = cumulative[p.id] || 0; });
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
                const f = existing.find(e => e.personId === p.id);
                return f ? { personId: p.id, procesados: String(f.procesados), pendientes: String(f.pendientes), informes: String(f.informes || 0), oficios: String(f.oficios || 0), oficiosMultiples: String(f.oficiosMultiples || 0), memorandums: String(f.memorandums || 0) } : emptyEntry(p.id);
            }));
        } else {
            setFormEntries(PERSONAL.map(p => emptyEntry(p.id)));
        }
        setShowForm(true);
    };

    const openEditAcumulado = () => {
        setEditEntries(PERSONAL.map(p => {
            const d = acumuladoData[p.id] || { procesados: 0, pendientes: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0 };
            return { personId: p.id, procesados: String(d.procesados), pendientes: String(d.pendientes), informes: String(d.informes || 0), oficios: String(d.oficios || 0), oficiosMultiples: String(d.oficiosMultiples || 0), memorandums: String(d.memorandums || 0) };
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
                        {[["semanal", "Semanal"], ["acumulado", "Acumulado"], ["tendencia", "Tendencia"], ["esinad", "E-SINAD"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} style={btn(view === v, C.navy3, C.white)}>{l}</button>)}
                    </div>

                    {/* Exportar PDF */}
                    <button onClick={handleExportPDF} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.navy3, cursor: exporting ? "wait" : "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans'", opacity: exporting ? 0.6 : 1 }}>
                        {I.download(15, C.navy3)} {exporting ? "Exportando..." : "Exportar PDF"}
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard icon={I.file(20, C.navy4)} label="E-SINAD (Semana)" value={kpis.totalProcSemana.toLocaleString()} sub={weekData.length > 0 ? formatWeek(selectedWeek) : "Sin datos"} border={C.navy4} />
                <StatCard icon={I.pen(20, C.realNavy)} label="Prod. Real (Semana)" value={kpis.totalRealSemana.toLocaleString()} sub="Documentos redactados" border={C.realNavy} />
                <StatCard icon={I.clock(20, C.amber)} label="Pendientes (Semana)" value={kpis.totalPendSemana.toLocaleString()} sub="En la semana seleccionada" border={C.amber} />
                <StatCard icon={I.check(20, C.green)} label="E-SINAD (Acumulado)" value={kpis.totalProcAcum.toLocaleString()} sub="Desde inicio del año" border={C.green} />
                <StatCard icon={I.pen(20, C.indigo)} label="Prod. Real (Acumulado)" value={kpis.totalRealAcum.toLocaleString()} sub="Total documentos redactados" border={C.indigo} />
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
                                {I.file(48, C.g300)}
                                <h3 style={{ color: C.navy1, fontSize: "1.2rem", margin: "16px 0 8px", fontFamily: "'DM Serif Display',serif" }}>Sin datos para esta semana</h3>
                                <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>Usa el boton <strong>"Registrar Avance Semanal"</strong> para ingresar los datos.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                                {/* Fila 1: Barras principales + Pie */}
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                                    <div style={card}>
                                        <h3 style={h3s}>E-SINAD vs Prod. Real vs Pendientes — {formatWeek(selectedWeek)}</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={barDataSemanal} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="E-SINAD" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Prod. Real" fill={C.realNavy} radius={[4, 4, 0, 0]} /><Bar dataKey="Pendientes" fill={C.red} radius={[4, 4, 0, 0]} /></BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={card}>
                                        <h3 style={h3s}>Estado General — Semana</h3>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /></PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
                                            <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontSize: "1.3rem", fontFamily: "'DM Serif Display'", margin: 0 }}>{kpis.totalProcSemana + kpis.totalPendSemana > 0 ? Math.round(kpis.totalProcSemana / (kpis.totalProcSemana + kpis.totalPendSemana) * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.68rem", fontFamily: "'DM Sans'", margin: 0 }}>Resolucion</p></div>
                                            <div style={{ textAlign: "center" }}><p style={{ color: C.realNavy, fontSize: "1.3rem", fontFamily: "'DM Serif Display'", margin: 0 }}>{kpis.totalProcSemana > 0 ? Math.round(kpis.totalRealSemana / kpis.totalProcSemana * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.68rem", fontFamily: "'DM Sans'", margin: 0 }}>Eficiencia Real</p></div>
                                            <div style={{ textAlign: "center" }}><p style={{ color: C.navy4, fontSize: "1.3rem", fontFamily: "'DM Serif Display'", margin: 0 }}>{weekData.length}</p><p style={{ color: C.g500, fontSize: "0.68rem", fontFamily: "'DM Sans'", margin: 0 }}>Personas</p></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fila 2: Desglose de Produccion Real */}
                                <div style={card}>
                                    <h3 style={h3s}>Desglose Produccion Real — {formatWeek(selectedWeek)}</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={barDataSemanal} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="Informes" stackId="real" fill={DOC_COLORS.informes} radius={[0, 0, 0, 0]} /><Bar dataKey="Oficios" stackId="real" fill={DOC_COLORS.oficios} /><Bar dataKey="Of. Multiples" stackId="real" fill={DOC_COLORS.oficiosMultiples} /><Bar dataKey="Memorandums" stackId="real" fill={DOC_COLORS.memorandums} radius={[4, 4, 0, 0]} /></BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Tabla detallada */}
                                <div style={{ ...card, padding: 0, overflow: "auto" }}>
                                    <div style={{ padding: "14px 18px", background: `${C.navy5}08`, borderBottom: `2px solid ${C.navy5}25` }}>
                                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Detalle {formatWeek(selectedWeek)}</h3>
                                    </div>
                                    <div style={{ overflowX: "auto" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 85px 85px 65px 65px 65px 65px 75px 50px", padding: "10px 14px", gap: 6, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 820 }}>
                                            {["#", "Nombre", "Rol", "E-SINAD", "Pendientes", "Inf.", "Ofi.", "Of.M.", "Memo.", "Total Real", "Tipo"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Nombre" ? "left" : "center" }}>{h}</p>)}
                                        </div>
                                        {weekData.map((d, i) => (
                                            <div key={d.personId} style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 85px 85px 65px 65px 65px 65px 75px 50px", alignItems: "center", padding: "12px 14px", gap: 6, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s", minWidth: 820 }}
                                                onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.75rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                                <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'DM Sans'" }}>{d.nombre}</p></div>
                                                <p style={{ textAlign: "center", color: C.g600, fontSize: "0.7rem", margin: 0, fontFamily: "'DM Sans'", textTransform: "capitalize" }}>{d.rol}</p>
                                                <p style={{ textAlign: "center", color: C.green, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.procesados}</p>
                                                <p style={{ textAlign: "center", color: d.pendientes > 20 ? C.red : C.amber, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.pendientes}</p>
                                                <p style={{ textAlign: "center", color: DOC_COLORS.informes, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.informes || 0}</p>
                                                <p style={{ textAlign: "center", color: DOC_COLORS.oficios, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.oficios || 0}</p>
                                                <p style={{ textAlign: "center", color: DOC_COLORS.oficiosMultiples, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.oficiosMultiples || 0}</p>
                                                <p style={{ textAlign: "center", color: DOC_COLORS.memorandums, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.memorandums || 0}</p>
                                                <p style={{ textAlign: "center", color: C.realNavy, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.totalReal || 0}</p>
                                                <p style={{ textAlign: "center", fontSize: "0.65rem", margin: 0, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: d.tipo === "EBA" ? C.navy5 : d.tipo === "ETP" ? C.gold1 : C.g500 }}>{d.tipo}</p>
                                            </div>
                                        ))}
                                    </div>
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
                                {I.trend(48, C.g300)}
                                <h3 style={{ color: C.navy1, fontSize: "1.2rem", margin: "16px 0 8px", fontFamily: "'DM Serif Display',serif" }}>Sin datos acumulados</h3>
                                <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>Registra avances semanales para ver el acumulado aqui.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                                    <div style={card}>
                                        <h3 style={h3s}>E-SINAD vs Prod. Real vs Pendientes — Acumulado {new Date().getFullYear()}</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={barDataAcumulado} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="E-SINAD" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Prod. Real" fill={C.realNavy} radius={[4, 4, 0, 0]} /><Bar dataKey="Pendientes" fill={C.red} radius={[4, 4, 0, 0]} /></BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={card}>
                                        <h3 style={h3s}>Estado General — Acumulado</h3>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /></PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
                                            <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontSize: "1.3rem", fontFamily: "'DM Serif Display'", margin: 0 }}>{kpis.totalProcAcum + kpis.totalPendAcum > 0 ? Math.round(kpis.totalProcAcum / (kpis.totalProcAcum + kpis.totalPendAcum) * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.68rem", fontFamily: "'DM Sans'", margin: 0 }}>Resolucion</p></div>
                                            <div style={{ textAlign: "center" }}><p style={{ color: C.realNavy, fontSize: "1.3rem", fontFamily: "'DM Serif Display'", margin: 0 }}>{kpis.totalProcAcum > 0 ? Math.round(kpis.totalRealAcum / kpis.totalProcAcum * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.68rem", fontFamily: "'DM Sans'", margin: 0 }}>Eficiencia Real</p></div>
                                            <div style={{ textAlign: "center" }}><p style={{ color: C.navy4, fontSize: "1.3rem", fontFamily: "'DM Serif Display'", margin: 0 }}>{PERSONAL.length}</p><p style={{ color: C.g500, fontSize: "0.68rem", fontFamily: "'DM Sans'", margin: 0 }}>Personal</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={card}>
                                    <h3 style={h3s}>Desglose Produccion Real — Acumulado {new Date().getFullYear()}</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={barDataAcumulado} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="Informes" stackId="real" fill={DOC_COLORS.informes} /><Bar dataKey="Oficios" stackId="real" fill={DOC_COLORS.oficios} /><Bar dataKey="Of. Multiples" stackId="real" fill={DOC_COLORS.oficiosMultiples} /><Bar dataKey="Memorandums" stackId="real" fill={DOC_COLORS.memorandums} radius={[4, 4, 0, 0]} /></BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Tabla acumulado */}
                                <div style={{ ...card, padding: 0, overflow: "auto" }}>
                                    <div style={{ padding: "14px 18px", background: `${C.green}08`, borderBottom: `2px solid ${C.green}25` }}>
                                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Detalle Acumulado — Año {new Date().getFullYear()}</h3>
                                    </div>
                                    <div style={{ overflowX: "auto" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 85px 85px 65px 65px 65px 65px 75px 50px", padding: "10px 14px", gap: 6, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 820 }}>
                                            {["#", "Nombre", "Rol", "E-SINAD", "Pendientes", "Inf.", "Ofi.", "Of.M.", "Memo.", "Total Real", "Tipo"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Nombre" ? "left" : "center" }}>{h}</p>)}
                                        </div>
                                        {PERSONAL.map((p, i) => {
                                            const ad = acumuladoData[p.id] || { procesados: 0, pendientes: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 };
                                            return (
                                                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 85px 85px 65px 65px 65px 65px 75px 50px", alignItems: "center", padding: "12px 14px", gap: 6, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s", minWidth: 820 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.75rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                                    <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'DM Sans'" }}>{p.nombre}</p></div>
                                                    <p style={{ textAlign: "center", color: C.g600, fontSize: "0.7rem", margin: 0, fontFamily: "'DM Sans'", textTransform: "capitalize" }}>{p.rol}</p>
                                                    <p style={{ textAlign: "center", color: C.green, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.procesados}</p>
                                                    <p style={{ textAlign: "center", color: ad.pendientes > 20 ? C.red : C.amber, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.pendientes}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.informes, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.informes || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.oficios, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.oficios || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.oficiosMultiples, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.oficiosMultiples || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.memorandums, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.memorandums || 0}</p>
                                                    <p style={{ textAlign: "center", color: C.realNavy, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{ad.totalReal || 0}</p>
                                                    <p style={{ textAlign: "center", fontSize: "0.65rem", margin: 0, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g500 }}>{p.tipo}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── VISTA TENDENCIA SEMANAL ──── */}
                {view === "tendencia" && (
                    <div style={{ display: "grid", gap: 20 }}>
                        <div style={card}>
                            <h3 style={h3s}>Tendencia Semanal — E-SINAD (Procesados)</h3>
                            <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 6px", fontFamily: "'DM Sans'" }}>Expedientes procesados por semana ({allWeeks.length} semanas registradas)</p>
                            <p style={{ color: C.g400, fontSize: "0.7rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>* = Oficinista</p>
                            {allWeeks.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, color: C.g400, fontSize: "0.9rem" }}>Sin datos. Registra avances semanales para ver la tendencia.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={340}>
                                    <AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="semana" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                        {PERSONAL.map((p, idx) => {
                                            const key = p.shortName + (p.rol === "oficinista" ? " *" : "");
                                            return <Area key={key} type="monotone" dataKey={key} stroke={SPEC_COLORS[idx % SPEC_COLORS.length]} fill={`${SPEC_COLORS[idx % SPEC_COLORS.length]}15`} strokeWidth={p.rol === "oficinista" ? 1.5 : 2} strokeDasharray={p.rol === "oficinista" ? "5 3" : undefined} />;
                                        })}
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {allWeeks.length > 0 && (
                            <div style={card}>
                                <h3 style={h3s}>Tendencia Semanal — Produccion Real</h3>
                                <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>Documentos efectivamente redactados por semana</p>
                                <ResponsiveContainer width="100%" height={340}>
                                    <AreaChart data={trendDataReal}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="semana" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                        {PERSONAL.map((p, idx) => {
                                            const key = p.shortName + (p.rol === "oficinista" ? " *" : "");
                                            return <Area key={key} type="monotone" dataKey={key} stroke={SPEC_COLORS[idx % SPEC_COLORS.length]} fill={`${SPEC_COLORS[idx % SPEC_COLORS.length]}15`} strokeWidth={p.rol === "oficinista" ? 1.5 : 2} strokeDasharray={p.rol === "oficinista" ? "5 3" : undefined} />;
                                        })}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {allWeeks.length > 0 && (
                            <div style={card}>
                                <h3 style={h3s}>Tendencia Acumulativa — E-SINAD</h3>
                                <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>Total acumulado de procesados semana a semana</p>
                                <ResponsiveContainer width="100%" height={340}>
                                    <AreaChart data={cumulativeTrendData}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="semana" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                        {PERSONAL.map((p, idx) => {
                                            const key = p.shortName + (p.rol === "oficinista" ? " *" : "");
                                            return <Area key={key} type="monotone" dataKey={key} stroke={SPEC_COLORS[idx % SPEC_COLORS.length]} fill={`${SPEC_COLORS[idx % SPEC_COLORS.length]}15`} strokeWidth={p.rol === "oficinista" ? 1.5 : 2} strokeDasharray={p.rol === "oficinista" ? "5 3" : undefined} />;
                                        })}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {allWeeks.length > 0 && (
                            <div style={card}>
                                <h3 style={h3s}>Tendencia Acumulativa — Produccion Real</h3>
                                <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>Total acumulado de documentos redactados semana a semana</p>
                                <ResponsiveContainer width="100%" height={340}>
                                    <AreaChart data={cumulativeTrendDataReal}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="semana" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                        {PERSONAL.map((p, idx) => {
                                            const key = p.shortName + (p.rol === "oficinista" ? " *" : "");
                                            return <Area key={key} type="monotone" dataKey={key} stroke={SPEC_COLORS[idx % SPEC_COLORS.length]} fill={`${SPEC_COLORS[idx % SPEC_COLORS.length]}15`} strokeWidth={p.rol === "oficinista" ? 1.5 : 2} strokeDasharray={p.rol === "oficinista" ? "5 3" : undefined} />;
                                        })}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── VISTA E-SINAD ──── */}
                {view === "esinad" && (() => {
                    /* ── E-SINAD persist ── */
                    const persistEsinad = (weeks) => {
                        localStorage.setItem(ESINAD_LS_SEMANAL, JSON.stringify(weeks));
                        const acum = {};
                        PERSONAL_ESINAD.forEach(p => { acum[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 }; });
                        weeks.forEach(w => { w.personas.forEach(pe => { if (acum[pe.personId]) { acum[pe.personId].procesadosSinad += pe.procesadosSinad || 0; acum[pe.personId].informes += pe.informes || 0; acum[pe.personId].oficios += pe.oficios || 0; acum[pe.personId].oficiosMultiples += pe.oficiosMultiples || 0; acum[pe.personId].memorandums += pe.memorandums || 0; acum[pe.personId].totalReal += pe.totalReal || 0; } }); });
                        localStorage.setItem(ESINAD_LS_ACUMULADO, JSON.stringify(acum));
                    };

                    /* ── Process Excel ── */
                    const processExcel = (file) => {
                        setEsinadProcessing(true); setEsinadError("");
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                const data = new Uint8Array(ev.target.result);
                                const wb = XLSX.read(data, { type: "array" });
                                const ws = wb.Sheets[wb.SheetNames[0]];
                                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                                let headerIdx = -1;
                                for (let i = 0; i < Math.min(rows.length, 15); i++) {
                                    const row = rows[i];
                                    if (row && row.some(c => String(c).toUpperCase().includes("ESPECIALISTA")) && row.some(c => String(c).toUpperCase().includes("EXPEDIENTE"))) { headerIdx = i; break; }
                                }
                                if (headerIdx === -1) { setEsinadError('No se encontro la fila de encabezados (debe contener "Especialista" y "Expediente").'); setEsinadProcessing(false); return; }
                                const dataRows = rows.slice(headerIdx + 1).filter(r => r && r.length > 2 && String(r[1] || "").trim());
                                const personStats = {};
                                PERSONAL_ESINAD.forEach(p => { personStats[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 }; });
                                const allDocs = [];
                                const seenDocs = new Set();
                                dataRows.forEach(r => {
                                    const especialista = String(r[1] || "").trim();
                                    const expediente = String(r[2] || "").trim();
                                    const fechaIngreso = formatExcelDate(r[5]);
                                    const asuntoExpediente = String(r[6] || "").trim();
                                    const remiteOficina = String(r[9] || "").trim();
                                    const asuntoResp = String(r[13] || "").trim();
                                    const tipoDoc = String(r[14] || "").trim();
                                    const fechaDeriv = formatExcelDate(r[20]);
                                    const destino = String(r[21] || "").trim();
                                    const person = matchPerson(especialista);
                                    if (!person) return;
                                    personStats[person.id].procesadosSinad++;
                                    if (tipoDoc && !seenDocs.has(tipoDoc)) {
                                        const cat = classifyDoc(tipoDoc);
                                        if (cat) {
                                            seenDocs.add(tipoDoc);
                                            personStats[person.id][cat]++;
                                            personStats[person.id].totalReal++;
                                            allDocs.push({
                                                tipoDocumento: tipoDoc,
                                                categoria: catLabel(cat),
                                                especialista: person.nombre,
                                                personId: person.id,
                                                shortName: person.shortName,
                                                rol: person.rol,
                                                tipo: person.tipo,
                                                expediente,
                                                asuntoExpediente,
                                                asuntoRespuesta: asuntoResp,
                                                remiteOficina,
                                                fechaIngreso,
                                                fechaDerivacion: fechaDeriv,
                                                destino,
                                            });
                                        }
                                    }
                                });
                                const weekRecord = {
                                    semana: esinadSelectedWeek,
                                    fechaCarga: new Date().toISOString(),
                                    nombreArchivo: file.name,
                                    totalFilas: dataRows.length,
                                    personas: PERSONAL_ESINAD.map(p => ({ personId: p.id, nombreExcel: "", shortName: p.shortName, rol: p.rol, tipo: p.tipo, ...personStats[p.id] })),
                                    documentos: allDocs,
                                };
                                const updated = esinadWeeks.filter(w => w.semana !== esinadSelectedWeek);
                                updated.push(weekRecord);
                                updated.sort((a, b) => a.semana.localeCompare(b.semana));
                                setEsinadWeeks(updated);
                                persistEsinad(updated);
                                setEsinadError("");
                                showToast("Excel E-SINAD procesado correctamente");
                            } catch (err) { setEsinadError(`Error procesando el archivo: ${err.message}`); }
                            setEsinadProcessing(false);
                        };
                        reader.onerror = () => { setEsinadError("Error leyendo el archivo."); setEsinadProcessing(false); };
                        reader.readAsArrayBuffer(file);
                    };

                    const handleFile = (file) => { if (!file) return; if (!file.name.match(/\.xlsx?$/i)) { setEsinadError("Solo archivos .xlsx o .xls"); return; } processExcel(file); };
                    const handleDrop = (e) => { e.preventDefault(); setEsinadDragOver(false); handleFile(e.dataTransfer.files[0]); };
                    const deleteWeek = (sem) => { const updated = esinadWeeks.filter(w => w.semana !== sem); setEsinadWeeks(updated); persistEsinad(updated); showToast("Semana eliminada"); };

                    const currentWeekData = esinadWeeks.find(w => w.semana === esinadSelectedWeek);
                    const esinadAcumulado = (() => { const acum = {}; PERSONAL_ESINAD.forEach(p => { acum[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 }; }); esinadWeeks.forEach(w => { w.personas.forEach(pe => { if (acum[pe.personId]) { acum[pe.personId].procesadosSinad += pe.procesadosSinad || 0; acum[pe.personId].informes += pe.informes || 0; acum[pe.personId].oficios += pe.oficios || 0; acum[pe.personId].oficiosMultiples += pe.oficiosMultiples || 0; acum[pe.personId].memorandums += pe.memorandums || 0; acum[pe.personId].totalReal += pe.totalReal || 0; } }); }); return acum; })();

                    const activeData = esinadViewMode === "semana" && currentWeekData ? currentWeekData.personas : esinadViewMode === "acumulado" ? PERSONAL_ESINAD.map(p => ({ personId: p.id, shortName: p.shortName, rol: p.rol, tipo: p.tipo, ...esinadAcumulado[p.id] })) : [];
                    const activeDocs = esinadViewMode === "semana" && currentWeekData ? (currentWeekData.documentos || []) : esinadViewMode === "acumulado" ? esinadWeeks.flatMap(w => w.documentos || []) : [];

                    const ekpis = (() => { const ts = activeData.reduce((s, d) => s + (d.procesadosSinad || 0), 0); const tr = activeData.reduce((s, d) => s + (d.totalReal || 0), 0); return { totalSinad: ts, totalReal: tr, eficiencia: ts > 0 ? Math.round(tr / ts * 100) : 0, semanasCount: esinadWeeks.length }; })();

                    const eBarData = activeData.map(d => ({ nombre: d.shortName, "E-SINAD": d.procesadosSinad || 0, "Prod. Real": d.totalReal || 0 }));
                    const eBarDesglose = activeData.map(d => ({ nombre: d.shortName, Informes: d.informes || 0, Oficios: d.oficios || 0, "Of. Multiples": d.oficiosMultiples || 0, Memorandums: d.memorandums || 0 }));
                    const hasEData = activeData.length > 0 && activeData.some(d => d.procesadosSinad > 0);
                    const fmtEWeek = (w) => { if (!w) return ""; const [y, wk] = w.split("-W"); return `Semana ${parseInt(wk)}, ${y}`; };

                    return (
                        <div>
                            {/* Upload Panel */}
                            <div style={{ ...card, marginBottom: 20 }}>
                                <h3 style={h3s}>Carga Semanal E-SINAD</h3>
                                <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
                                    <div style={{ flex: "0 0 auto" }}>
                                        <label style={labelStyle}>Semana</label>
                                        <input type="week" value={esinadSelectedWeek} onChange={e => setEsinadSelectedWeek(e.target.value)} style={{ ...inputStyle, width: 210 }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => setEsinadViewMode("semana")} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${esinadViewMode === "semana" ? C.navy4 : C.g200}`, background: esinadViewMode === "semana" ? C.navy4 : C.white, color: esinadViewMode === "semana" ? C.white : C.g600, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600 }}>Semana</button>
                                        <button onClick={() => setEsinadViewMode("acumulado")} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${esinadViewMode === "acumulado" ? C.navy4 : C.g200}`, background: esinadViewMode === "acumulado" ? C.navy4 : C.white, color: esinadViewMode === "acumulado" ? C.white : C.g600, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600 }}>Acumulado</button>
                                    </div>
                                    {esinadWeeks.length > 0 && (
                                        <div style={{ flex: "0 0 auto" }}>
                                            <label style={labelStyle}>Semanas cargadas</label>
                                            <select value={esinadSelectedWeek} onChange={e => setEsinadSelectedWeek(e.target.value)} style={{ ...inputStyle, width: 200 }}>
                                                {esinadWeeks.map(w => <option key={w.semana} value={w.semana}>{fmtEWeek(w.semana)}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {currentWeekData && (
                                    <div style={{ padding: "10px 14px", background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 6, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {I.check(16, C.green)}
                                            <span style={{ fontSize: 12, color: C.green, fontWeight: 600, fontFamily: "'DM Sans'" }}>Datos cargados: {new Date(currentWeekData.fechaCarga).toLocaleDateString()} -- {currentWeekData.nombreArchivo} ({currentWeekData.totalFilas} filas)</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button onClick={() => esinadFileRef.current?.click()} style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${C.amber}`, background: C.white, color: C.amber, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans'" }}>Reemplazar</button>
                                            <button onClick={() => deleteWeek(esinadSelectedWeek)} style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${C.red}`, background: C.white, color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans'", display: "flex", alignItems: "center", gap: 4 }}>{IEsinad.trash(13, C.red)} Eliminar</button>
                                        </div>
                                    </div>
                                )}

                                <div
                                    onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setEsinadDragOver(true); }} onDragLeave={() => setEsinadDragOver(false)}
                                    onClick={() => esinadFileRef.current?.click()}
                                    style={{ border: `2px dashed ${esinadDragOver ? C.navy4 : C.g300}`, borderRadius: 8, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: esinadDragOver ? `${C.navy4}08` : C.g50, transition: "all 0.2s" }}
                                >
                                    <input ref={esinadFileRef} type="file" accept=".xlsx,.xls" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
                                    {esinadProcessing ? (
                                        <div style={{ color: C.navy4, fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600 }}>Procesando archivo...</div>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: 8 }}>{IEsinad.upload(32, esinadDragOver ? C.navy4 : C.g400)}</div>
                                            <div style={{ color: C.navy1, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'", marginBottom: 4 }}>Arrastra el Excel del E-SINAD aqui</div>
                                            <div style={{ color: C.g400, fontSize: 11, fontFamily: "'DM Sans'" }}>o haz click para seleccionar (.xlsx)</div>
                                        </>
                                    )}
                                </div>
                                {esinadError && <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", color: C.red, fontSize: 12, fontFamily: "'DM Sans'" }}>{esinadError}</div>}
                            </div>

                            {/* E-SINAD KPIs */}
                            {hasEData && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
                                    <StatCard icon={I.file(18, C.green)} label="Total E-SINAD" value={ekpis.totalSinad.toLocaleString()} sub={esinadViewMode === "semana" ? fmtEWeek(esinadSelectedWeek) : "Acumulado total"} border={C.green} />
                                    <StatCard icon={I.file(18, C.realNavy)} label="Prod. Real" value={ekpis.totalReal.toLocaleString()} sub="Documentos unicos" border={C.realNavy} />
                                    <StatCard icon={I.check(18, ekpis.eficiencia >= 30 ? C.green : ekpis.eficiencia >= 15 ? C.amber : C.red)} label="Eficiencia" value={`${ekpis.eficiencia}%`} sub="Real / E-SINAD" border={ekpis.eficiencia >= 30 ? C.green : ekpis.eficiencia >= 15 ? C.amber : C.red} />
                                    <StatCard icon={I.file(18, C.navy4)} label="Semanas Cargadas" value={ekpis.semanasCount} sub="Total de semanas" border={C.navy4} />
                                </div>
                            )}

                            {/* E-SINAD Charts */}
                            {hasEData && (
                                <div style={{ display: "grid", gap: 16, marginBottom: 20 }}>
                                    <div style={card}>
                                        <h3 style={h3s}>E-SINAD vs Produccion Real -- {esinadViewMode === "semana" ? fmtEWeek(esinadSelectedWeek) : "Acumulado"}</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={eBarData} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="E-SINAD" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Prod. Real" fill={C.realNavy} radius={[4, 4, 0, 0]} /></BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={card}>
                                        <h3 style={h3s}>Desglose Produccion Real -- {esinadViewMode === "semana" ? fmtEWeek(esinadSelectedWeek) : "Acumulado"}</h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={eBarDesglose} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="Informes" stackId="real" fill={DOC_COLORS.informes} /><Bar dataKey="Oficios" stackId="real" fill={DOC_COLORS.oficios} /><Bar dataKey="Of. Multiples" stackId="real" fill={DOC_COLORS.oficiosMultiples} /><Bar dataKey="Memorandums" stackId="real" fill={DOC_COLORS.memorandums} radius={[4, 4, 0, 0]} /></BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* E-SINAD Detail Table */}
                            {hasEData && (
                                <div style={{ ...card, padding: 0, overflow: "auto", marginBottom: 20 }}>
                                    <div style={{ padding: "14px 18px", background: `${C.navy4}08`, borderBottom: `2px solid ${C.navy4}25` }}>
                                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Detalle por Especialista -- {esinadViewMode === "semana" ? fmtEWeek(esinadSelectedWeek) : "Acumulado"}</h3>
                                    </div>
                                    <div style={{ overflowX: "auto" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 80px 60px 60px 60px 65px 70px 70px", padding: "10px 14px", gap: 6, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 750 }}>
                                            {["#", "Especialista", "Rol", "E-SINAD", "Inf.", "Ofi.", "Of.M.", "Memo.", "Total Real", "Eficiencia"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Especialista" ? "left" : "center" }}>{h}</p>)}
                                        </div>
                                        {activeData.map((d, i) => {
                                            const eff = d.procesadosSinad > 0 ? Math.round(d.totalReal / d.procesadosSinad * 100) : 0;
                                            const effColor = eff >= 30 ? C.green : eff >= 15 ? C.amber : C.red;
                                            return (
                                                <div key={d.personId || i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 80px 60px 60px 60px 65px 70px 70px", alignItems: "center", padding: "12px 14px", gap: 6, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s", minWidth: 750 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.75rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                                    <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'DM Sans'" }}>{d.shortName}</p></div>
                                                    <p style={{ textAlign: "center", color: C.g600, fontSize: "0.7rem", margin: 0, fontFamily: "'DM Sans'", textTransform: "capitalize" }}>{d.rol}</p>
                                                    <p style={{ textAlign: "center", color: C.green, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.procesadosSinad || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.informes, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.informes || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.oficios, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.oficios || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.oficiosMultiples, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.oficiosMultiples || 0}</p>
                                                    <p style={{ textAlign: "center", color: DOC_COLORS.memorandums, fontWeight: 600, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.memorandums || 0}</p>
                                                    <p style={{ textAlign: "center", color: C.realNavy, fontWeight: 700, fontSize: "0.88rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.totalReal || 0}</p>
                                                    <p style={{ textAlign: "center", color: effColor, fontWeight: 700, fontSize: "0.82rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{eff}%</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* E-SINAD Documents List */}
                            {hasEData && activeDocs.length > 0 && (
                                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                                    <div style={{ padding: "14px 18px", background: `${C.indigo}08`, borderBottom: `2px solid ${C.indigo}25` }}>
                                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Documentos Generados ({activeDocs.length})</h3>
                                    </div>
                                    {PERSONAL_ESINAD.map(p => {
                                        const docs = activeDocs.filter(d => d.personId === p.id);
                                        if (docs.length === 0) return null;
                                        const isExp = esinadExpandedPerson === p.id;
                                        return (
                                            <div key={p.id}>
                                                <div onClick={() => setEsinadExpandedPerson(isExp ? null : p.id)}
                                                    style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${C.g100}`, background: isExp ? C.g50 : "transparent", transition: "background 0.15s" }}
                                                    onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = C.g50; }} onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = "transparent"; }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: p.tipo === "EBA" ? `${C.navy5}15` : p.tipo === "ETP" ? `${C.gold2}15` : `${C.g500}15`, color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g600 }}>{p.tipo === "-" ? "OFIC" : p.tipo}</span>
                                                        <span style={{ fontSize: "0.85rem", color: C.navy1, fontWeight: 600, fontFamily: "'DM Sans'" }}>{p.shortName}</span>
                                                        <span style={{ fontSize: "0.72rem", color: C.g400, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>({docs.length} doc{docs.length !== 1 ? "s" : ""})</span>
                                                    </div>
                                                    {isExp ? IEsinad.chevUp(16, C.g500) : IEsinad.chevDown(16, C.g500)}
                                                </div>
                                                {isExp && (
                                                    <div style={{ padding: "0 18px 12px" }}>
                                                        {docs.map((doc, di) => (
                                                            <div key={di} style={{ padding: "10px 14px", borderRadius: 6, background: C.g50, marginTop: 8, border: `1px solid ${C.g100}` }}>
                                                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                                                                    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: DOC_COLORS[doc.categoria === "Informes" ? "informes" : doc.categoria === "Oficios" ? "oficios" : doc.categoria === "Of. Multiples" ? "oficiosMultiples" : "memorandums"] + "18", color: DOC_COLORS[doc.categoria === "Informes" ? "informes" : doc.categoria === "Oficios" ? "oficios" : doc.categoria === "Of. Multiples" ? "oficiosMultiples" : "memorandums"], fontFamily: "'JetBrains Mono'", letterSpacing: "0.04em" }}>{doc.categoria.toUpperCase()}</span>
                                                                </div>
                                                                <div style={{ fontSize: "0.78rem", color: C.navy1, fontWeight: 600, fontFamily: "'JetBrains Mono'", marginBottom: 4, wordBreak: "break-all" }}>{doc.tipoDocumento}</div>
                                                                {doc.expediente && <div style={{ fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'" }}>Expediente: {doc.expediente}</div>}
                                                                {doc.asuntoRespuesta && <div style={{ fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginTop: 2 }}>{doc.asuntoRespuesta.substring(0, 120)}{doc.asuntoRespuesta.length > 120 ? "..." : ""}</div>}
                                                                {doc.fechaDerivacion && <div style={{ fontSize: "0.68rem", color: C.g400, fontFamily: "'JetBrains Mono'", marginTop: 2 }}>Derivado: {doc.fechaDerivacion}</div>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty State */}
                            {!hasEData && (
                                <div style={{ ...card, textAlign: "center", padding: 60 }}>
                                    {I.file(48, C.g300)}
                                    <h3 style={{ color: C.navy1, fontSize: "1.2rem", margin: "16px 0 8px", fontFamily: "'DM Serif Display',serif" }}>
                                        {esinadViewMode === "semana" ? `Sin datos para ${fmtEWeek(esinadSelectedWeek)}` : "Sin datos acumulados"}
                                    </h3>
                                    <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>Sube un archivo Excel del E-SINAD usando el panel de carga superior.</p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* ──── MODAL: REGISTRAR AVANCE SEMANAL ──── */}
            {showForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={() => setShowForm(false)}>
                    <div style={{ background: C.white, borderRadius: 12, padding: 28, width: "95%", maxWidth: 900, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: C.navy1, fontSize: "1.25rem", margin: "0 0 6px", fontFamily: "'DM Serif Display',serif" }}>Registrar Avance Semanal</h3>
                        <p style={{ color: C.g500, fontSize: "0.82rem", margin: "0 0 20px", fontFamily: "'DM Sans'" }}>Ingrese los datos E-SINAD y la produccion real (documentos redactados) para cada persona.</p>

                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Semana</label>
                            <input type="week" value={formWeek} onChange={e => { setFormWeek(e.target.value); }} style={{ ...inputStyle, maxWidth: 240 }} />
                        </div>

                        {PERSONAL.map((p, idx) => {
                            const e = formEntries[idx] || {};
                            const totalR = (parseInt(e.informes) || 0) + (parseInt(e.oficios) || 0) + (parseInt(e.oficiosMultiples) || 0) + (parseInt(e.memorandums) || 0);
                            const upd = (field, val) => { const ne = [...formEntries]; ne[idx] = { ...ne[idx], [field]: val }; setFormEntries(ne); };
                            return (
                                <div key={p.id} style={{ marginBottom: 16, border: `1px solid ${C.g200}`, borderRadius: 8, overflow: "hidden" }}>
                                    <div style={{ padding: "8px 14px", background: C.g50, display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: p.tipo === "EBA" ? `${C.navy5}15` : p.tipo === "ETP" ? `${C.gold2}15` : `${C.g500}15`, color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g600 }}>{p.tipo === "-" ? "OFIC" : p.tipo}</span>
                                        <span style={{ fontSize: "0.88rem", color: C.navy1, fontWeight: 600, fontFamily: "'DM Sans'" }}>{p.shortName}</span>
                                    </div>
                                    <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                                        <div style={{ gridColumn: "1 / -1", paddingBottom: 2 }}><span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.green, textTransform: "uppercase", fontFamily: "'DM Sans'", letterSpacing: "0.06em" }}>E-SINAD</span></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10 }}>Procesados</label><input type="number" min="0" placeholder="0" value={e.procesados ?? ""} onChange={ev => upd("procesados", ev.target.value)} style={{ ...inputStyle, textAlign: "center" }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10 }}>Pendientes</label><input type="number" min="0" placeholder="0" value={e.pendientes ?? ""} onChange={ev => upd("pendientes", ev.target.value)} style={{ ...inputStyle, textAlign: "center" }} /></div>
                                        <div style={{ gridColumn: "1 / -1", paddingTop: 8, paddingBottom: 2, borderTop: `1px solid ${C.g100}` }}><span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.realNavy, textTransform: "uppercase", fontFamily: "'DM Sans'", letterSpacing: "0.06em" }}>Produccion Real</span></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.informes }}>Informes</label><input type="number" min="0" placeholder="0" value={e.informes ?? ""} onChange={ev => upd("informes", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.informes}40` }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.oficios }}>Oficios</label><input type="number" min="0" placeholder="0" value={e.oficios ?? ""} onChange={ev => upd("oficios", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.oficios}40` }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.oficiosMultiples }}>Oficios Multiples</label><input type="number" min="0" placeholder="0" value={e.oficiosMultiples ?? ""} onChange={ev => upd("oficiosMultiples", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.oficiosMultiples}40` }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.memorandums }}>Memorandums</label><input type="number" min="0" placeholder="0" value={e.memorandums ?? ""} onChange={ev => upd("memorandums", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.memorandums}40` }} /></div>
                                        <div style={{ gridColumn: "1 / -1", textAlign: "right", paddingTop: 4 }}><span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.realNavy, fontFamily: "'JetBrains Mono'" }}>Total Real: {totalR}</span></div>
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                            <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.g600, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'DM Sans'" }}>Cancelar</button>
                            <button onClick={handleSaveWeekly} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.green, color: C.white, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "'DM Sans'" }}>Guardar Avance</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ──── MODAL: EDITAR ACUMULADO ──── */}
            {showEditAcumulado && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }} onClick={() => setShowEditAcumulado(false)}>
                    <div style={{ background: C.white, borderRadius: 12, padding: 28, width: "95%", maxWidth: 900, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: C.navy1, fontSize: "1.25rem", margin: "0 0 6px", fontFamily: "'DM Serif Display',serif" }}>Actualizar Acumulado Anual</h3>
                        <p style={{ color: C.g500, fontSize: "0.82rem", margin: "0 0 20px", fontFamily: "'DM Sans'" }}>Corrija o actualice los totales acumulados E-SINAD y produccion real de todo el año.</p>

                        {PERSONAL.map((p, idx) => {
                            const e = editEntries[idx] || {};
                            const totalR = (parseInt(e.informes) || 0) + (parseInt(e.oficios) || 0) + (parseInt(e.oficiosMultiples) || 0) + (parseInt(e.memorandums) || 0);
                            const upd = (field, val) => { const ne = [...editEntries]; ne[idx] = { ...ne[idx], [field]: val }; setEditEntries(ne); };
                            return (
                                <div key={p.id} style={{ marginBottom: 16, border: `1px solid ${C.g200}`, borderRadius: 8, overflow: "hidden" }}>
                                    <div style={{ padding: "8px 14px", background: C.g50, display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: p.tipo === "EBA" ? `${C.navy5}15` : p.tipo === "ETP" ? `${C.gold2}15` : `${C.g500}15`, color: p.tipo === "EBA" ? C.navy5 : p.tipo === "ETP" ? C.gold1 : C.g600 }}>{p.tipo === "-" ? "OFIC" : p.tipo}</span>
                                        <span style={{ fontSize: "0.88rem", color: C.navy1, fontWeight: 600, fontFamily: "'DM Sans'" }}>{p.shortName}</span>
                                    </div>
                                    <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                                        <div style={{ gridColumn: "1 / -1", paddingBottom: 2 }}><span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.green, textTransform: "uppercase", fontFamily: "'DM Sans'", letterSpacing: "0.06em" }}>E-SINAD</span></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10 }}>Total Procesados</label><input type="number" min="0" value={e.procesados ?? ""} onChange={ev => upd("procesados", ev.target.value)} style={{ ...inputStyle, textAlign: "center" }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10 }}>Total Pendientes</label><input type="number" min="0" value={e.pendientes ?? ""} onChange={ev => upd("pendientes", ev.target.value)} style={{ ...inputStyle, textAlign: "center" }} /></div>
                                        <div style={{ gridColumn: "1 / -1", paddingTop: 8, paddingBottom: 2, borderTop: `1px solid ${C.g100}` }}><span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.realNavy, textTransform: "uppercase", fontFamily: "'DM Sans'", letterSpacing: "0.06em" }}>Produccion Real</span></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.informes }}>Informes</label><input type="number" min="0" value={e.informes ?? ""} onChange={ev => upd("informes", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.informes}40` }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.oficios }}>Oficios</label><input type="number" min="0" value={e.oficios ?? ""} onChange={ev => upd("oficios", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.oficios}40` }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.oficiosMultiples }}>Oficios Multiples</label><input type="number" min="0" value={e.oficiosMultiples ?? ""} onChange={ev => upd("oficiosMultiples", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.oficiosMultiples}40` }} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: 10, color: DOC_COLORS.memorandums }}>Memorandums</label><input type="number" min="0" value={e.memorandums ?? ""} onChange={ev => upd("memorandums", ev.target.value)} style={{ ...inputStyle, textAlign: "center", borderColor: `${DOC_COLORS.memorandums}40` }} /></div>
                                        <div style={{ gridColumn: "1 / -1", textAlign: "right", paddingTop: 4 }}><span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.realNavy, fontFamily: "'JetBrains Mono'" }}>Total Real: {totalR}</span></div>
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                            <button onClick={() => setShowEditAcumulado(false)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.g600, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'DM Sans'" }}>Cancelar</button>
                            <button onClick={handleSaveAcumulado} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.navy4, color: C.white, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "'DM Sans'" }}>Guardar Acumulado</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
