import { useState, useEffect, useMemo, useRef } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area
} from "recharts";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { API } from "../api/endpoints";

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
    alert: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></SvgIcon>,
    trend: (sz, cl) => <SvgIcon size={sz} color={cl}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></SvgIcon>,
    file: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></SvgIcon>,
    download: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SvgIcon>,
    upload: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></SvgIcon>
};

/* ═══════════════════════════════════════════════════════════
   CLASIFICACIÓN DE PERSONAL
   Oficinistas: asignan expedientes y filtran devoluciones
   Especialistas: procesan expedientes (EBA o ETP)
   ═══════════════════════════════════════════════════════════ */
const OFICINISTAS_NOMBRES = [
    "Lucy Ana Vasquez Aliaga",
    "Liz Miluska Gutierrez Silva",
    "Beronica Olinda Cuellar Cornelio",
];
const esOficinista = (nombre) => OFICINISTAS_NOMBRES.some(n => nombre?.toLowerCase().includes(n.split(" ")[0].toLowerCase()) && nombre?.toLowerCase().includes(n.split(" ").slice(-1)[0].toLowerCase()));

/* ═══════════════════════════════════════════════════════════
   DATA DEMO DE RESERVA
   ═══════════════════════════════════════════════════════════ */
const DEMO_SPECIALISTS = [
    { id: 1, nombre: "Liz Miluska Gutierrez Silva", rol: "oficinista", tipo: "-", pi: 11, pe: 2, pt: 0, ri: 274, re: 40, rt: 0, tp: 13, tr: 314, tt: 327, pp: 4, pr: 96 },
    { id: 2, nombre: "Juan Alberto Quispe Solano", rol: "especialista", tipo: "ETP", pi: 6, pe: 38, pt: 0, ri: 26, re: 123, rt: 0, tp: 44, tr: 149, tt: 193, pp: 23, pr: 77 },
    { id: 3, nombre: "Nelida Albino Igreda", rol: "especialista", tipo: "EBA", pi: 6, pe: 7, pt: 0, ri: 40, re: 70, rt: 0, tp: 13, tr: 110, tt: 123, pp: 11, pr: 89 },
    { id: 4, nombre: "Francisco Villalobos Gonzales", rol: "especialista", tipo: "ETP", pi: 3, pe: 16, pt: 0, ri: 17, re: 52, rt: 0, tp: 19, tr: 69, tt: 88, pp: 22, pr: 78 },
    { id: 5, nombre: "Lucy Ana Vasquez Aliaga", rol: "oficinista", tipo: "-", pi: 2, pe: 0, pt: 0, ri: 6, re: 3, rt: 0, tp: 2, tr: 9, tt: 11, pp: 18, pr: 82 },
    { id: 6, nombre: "Beronica Olinda Cuellar Cornelio", rol: "oficinista", tipo: "-", pi: 9, pe: 0, pt: 0, ri: 426, re: 88, rt: 0, tp: 9, tr: 514, tt: 523, pp: 2, pr: 98 },
];

const DAILY_PROGRESS = (() => {
    const days = []; const start = new Date(2026, 0, 5); const end = new Date(2026, 2, 6); let d = new Date(start);
    while (d <= end) {
        if (d.getDay() !== 0 && d.getDay() !== 6) {
            days.push({
                fecha: d.toISOString().split("T")[0], label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
                "Cuellar C. ✦": Math.round(6 + Math.random() * 10), "Gutierrez S. ✦": Math.round(4 + Math.random() * 6),
                "Quispe S.": Math.round(2 + Math.random() * 4), "Albino I.": Math.round(1 + Math.random() * 3),
                "Villalobos G.": Math.round(1 + Math.random() * 2), "Vasquez A. ✦": Math.round(Math.random() * 1),
            });
        }
        d.setDate(d.getDate() + 1);
    }
    return days;
})();


/* ═══════════════════════════════════════════════════════════
   COMPONENTES INTERNOS
   ═══════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, border, trend }) {
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
            {trend !== undefined && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontFamily: "'DM Sans'" }}><span style={{ color: trend >= 0 ? C.green : C.red, fontWeight: 700 }}>{trend >= 0 ? "+" : ""}{trend}%</span><span style={{ color: C.g400 }}>vs mes anterior</span></div>}
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

export default function MonitoreoModule() {
    const { isRole } = useAuth();
    const fileInputRef = useRef(null);

    const [rolFilter, setRolFilter] = useState("todos");   // todos | especialistas | oficinistas
    const [filter, setFilter] = useState("todos");          // todos | EBA | ETP  (solo para especialistas)
    const [view, setView] = useState("resumen");
    const [specialists, setSpecialists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchMonitoreo = async () => {
        setLoading(true);
        try {
            const res = await API.listarMonitoreo();
            if (res && Array.isArray(res) && res.length > 0) {
                // Parse from JSON structure that backend gives (mapping keys if necessary)
                // If the backend returns standard SheetJS JSON, map it appropriately
                // Assuming your backend returns mapped metrics already:
                const mapped = res.map((r, idx) => {
                    const nombre = r.nombre || r.Nombre || r.Especialista || "Desconocido";
                    const isOfic = esOficinista(nombre);
                    return {
                        id: idx + 1,
                        nombre,
                        rol: isOfic ? "oficinista" : "especialista",
                        tipo: isOfic ? "-" : (r.tipo || r.Tipo || "ETP"),
                        pi: parseInt(r.pi || r["Pendiente Int"] || 0),
                        pe: parseInt(r.pe || r["Pendiente Ext"] || 0),
                        pt: parseInt(r.pt || r["Otros Pend."] || 0),
                        ri: parseInt(r.ri || r["Resuelto Int"] || 0),
                        re: parseInt(r.re || r["Resuelto Ext"] || 0),
                        rt: parseInt(r.rt || r["Otros Res."] || 0),
                        tp: parseInt(r.tp || r["Total Pendiente"] || 0),
                        tr: parseInt(r.tr || r["Total Resuelto"] || 0),
                        tt: parseInt(r.tt || r["Total Expedientes"] || 0),
                        pp: parseInt(r.pp || 0),
                        pr: parseInt(r.pr || r["Eficiencia"] || 0)
                    };
                });
                setSpecialists(mapped);
            } else {
                setSpecialists(DEMO_SPECIALISTS);
            }
        } catch (e) {
            console.warn("Using demo data due to fetch error:", e);
            setSpecialists(DEMO_SPECIALISTS);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMonitoreo();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setToast(null);

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];

                    // Leer desde la línea 6 (range: 5 elimina las primeras 5 filas)
                    const rawData = XLSX.utils.sheet_to_json(ws, { range: 5 });

                    // Enviar la payload al Webhook de n8n
                    const res = await API.cargarMonitoreo(rawData);
                    if (res) {
                        setToast({ msg: "Datos e-SINAD cargados y procesados en n8n.", type: "success" });
                        fetchMonitoreo();
                    } else {
                        setToast({ msg: "Error al cargar datos en n8n.", type: "error" });
                    }
                } catch (err) {
                    console.error(err);
                    setToast({ msg: "Error procesando el archivo Excel.", type: "error" });
                } finally {
                    setUploading(false);
                }
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error(error);
            setToast({ msg: "Error al leer el archivo.", type: "error" });
            setUploading(false);
        }
    };

    // Filtrado por rol y luego por tipo
    const byRol = useMemo(() => rolFilter === "todos" ? specialists : specialists.filter(s => s.rol === (rolFilter === "especialistas" ? "especialista" : "oficinista")), [rolFilter, specialists]);
    const filtered = useMemo(() => filter === "todos" ? byRol : byRol.filter(s => s.tipo === filter), [filter, byRol]);
    const sorted = useMemo(() => [...filtered].sort((a, b) => b.tr - a.tr), [filtered]);
    const maxTT = Math.max(...specialists.map(s => s.tt), 1);
    const totals = useMemo(() => ({ exp: filtered.reduce((s, x) => s + x.tt, 0), proc: filtered.reduce((s, x) => s + x.tr, 0), pend: filtered.reduce((s, x) => s + x.tp, 0), avg: filtered.length ? Math.round(filtered.reduce((s, x) => s + x.pr, 0) / filtered.length) : 0 }), [filtered]);

    // Conteo por rol
    const nEspecialistas = specialists.filter(s => s.rol === "especialista").length;
    const nOficinistas = specialists.filter(s => s.rol === "oficinista").length;

    // Datos separados para ranking
    const sortedEspecialistas = useMemo(() => sorted.filter(s => s.rol === "especialista"), [sorted]);
    const sortedOficinistas = useMemo(() => sorted.filter(s => s.rol === "oficinista"), [sorted]);

    const barData = sorted.map(s => ({ nombre: s.nombre.split(" ").slice(0, 2).join(" ") + (s.rol === "oficinista" ? " ✦" : ""), Procesados: s.tr, Pendientes: s.tp }));
    const pieData = [{ name: "Procesados", value: totals.proc }, { name: "Pendientes", value: totals.pend }];

    // Comparativa EBA vs ETP — solo especialistas reales
    const typeComp = useMemo(() => {
        const calc = t => { const s = specialists.filter(x => x.rol === "especialista" && x.tipo === t); return { total: s.reduce((a, b) => a + b.tt, 0), proc: s.reduce((a, b) => a + b.tr, 0), pend: s.reduce((a, b) => a + b.tp, 0), avg: s.length ? Math.round(s.reduce((a, b) => a + b.pr, 0) / s.length) : 0, n: s.length, items: s }; };
        return { eba: calc("EBA"), etp: calc("ETP") };
    }, [specialists]);

    const radarEspecialistas = useMemo(() => specialists.filter(s => s.rol === "especialista").sort((a,b) => b.tr - a.tr), [specialists]);
    const radarData = radarEspecialistas.map(s => ({ nombre: s.nombre.split(" ")[0], eficiencia: s.pr, volumen: Math.round((s.tt / maxTT) * 100), internos: Math.round((s.ri / Math.max(s.ri + s.pi, 1)) * 100), externos: Math.round((s.re / Math.max(s.re + s.pe, 1)) * 100) }));

    const handleExport = () => {
        const h = "Ranking,Nombre,Rol,Tipo,Total,Procesados,Pendientes,Eficiencia%,Pend.Int,Pend.Ext,Proc.Int,Proc.Ext\n";
        const r = sorted.map((s, i) => `${i + 1},${s.nombre},${s.rol === "oficinista" ? "Oficinista" : "Especialista"},${s.tipo},${s.tt},${s.tr},${s.tp},${s.pr}%,${s.pi},${s.pe},${s.ri},${s.re}`).join("\n");
        const b = new Blob(["\uFEFF" + h + r], { type: "text/csv;charset=utf-8;" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b);
        a.download = `Monitoreo_AGEBATP_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    };

    const card = { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g100}` };
    const h3s = { color: C.navy1, fontSize: "1.1rem", margin: "0 0 18px", fontFamily: "'DM Serif Display',serif" };
    const btn = (on, bgOn, colOn) => ({ padding: "7px 16px", border: "none", cursor: "pointer", background: on ? bgOn : "transparent", color: on ? colOn : C.g500, fontSize: "0.78rem", fontWeight: on ? 700 : 500, transition: "all 0.15s", fontFamily: "'DM Sans'" });

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.g500, fontFamily: "'DM Sans'" }}>Cargando datos de monitoreo...</div>;

    return (
        <div>
            {/* HEADER CONTROLS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Monitoreo de Personal AGEBATP</h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>Periodo Actual  |  Fuente: e-SINAD — UGEL 03 &nbsp;·&nbsp; <span style={{ color: C.navy5 }}>{nEspecialistas} especialistas</span> &nbsp;·&nbsp; <span style={{ color: C.gold1 }}>{nOficinistas} oficinistas</span></p>
                    {toast && <div style={{ marginTop: 10, padding: "6px 14px", borderRadius: 6, fontSize: "0.8rem", color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECACA"}`, display: "inline-block" }}>{toast.msg}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

                    {/* File Upload Hidden Input */}
                    <input type="file" accept=".xlsx, .xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

                    {isRole("admin") && (
                        <button onClick={() => fileInputRef.current.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: C.gold2, color: C.white, border: "none", cursor: uploading ? "wait" : "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "'DM Sans'", opacity: uploading ? 0.7 : 1 }}>
                            {I.upload(15, C.white)} {uploading ? "Procesando..." : "Subir e-SINAD"}
                        </button>
                    )}

                    {/* Filtro por ROL */}
                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.g200}` }}>
                        {[["todos", "Todos"], ["especialistas", "Especialistas"], ["oficinistas", "Oficinistas"]].map(([v, l]) => <button key={v} onClick={() => { setRolFilter(v); if (v === "oficinistas") setFilter("todos"); }} style={btn(rolFilter === v, C.navy3, C.white)}>{l}</button>)}
                    </div>

                    {/* Filtro por TIPO — solo si no son oficinistas */}
                    {rolFilter !== "oficinistas" && (
                        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.g200}` }}>
                            {[["todos", "Todos"], ["EBA", "EBA"], ["ETP", "ETP"]].map(([v, l]) => <button key={v} onClick={() => setFilter(v)} style={btn(filter === v, C.navy4, C.white)}>{l}</button>)}
                        </div>
                    )}

                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.g200}` }}>
                        {[["resumen", "Resumen"], ["ranking", "Ranking"], ["comparativa", "EBA vs ETP"], ["tendencia", "Tendencia"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} style={btn(view === v, C.gold2, C.white)}>{l}</button>)}
                    </div>
                    <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white, color: C.navy3, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans'" }}>
                        {I.download(15, C.navy3)} Exportar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard icon={I.file(20, C.navy4)} label="Total Expedientes" value={totals.exp.toLocaleString()} sub={`${filtered.length} personas (${filtered.filter(s=>s.rol==="especialista").length} esp. · ${filtered.filter(s=>s.rol==="oficinista").length} ofic.)`} border={C.navy4} />
                <StatCard icon={I.check(20, C.green)} label="Procesados" value={totals.proc.toLocaleString()} sub={`${totals.exp ? Math.round(totals.proc / totals.exp * 100) : 0}% del total`} border={C.green} trend={5} />
                <StatCard icon={I.clock(20, C.amber)} label="Pendientes" value={totals.pend.toLocaleString()} sub="Requieren atencion" border={C.amber} trend={-12} />
                <StatCard icon={I.trend(20, C.navy5)} label="Eficiencia Promedio" value={`${totals.avg}%`} sub="Tasa de resolucion" border={C.navy5} />
            </div>

            {/* RESUMEN */}
            {view === "resumen" && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                    <div style={card}>
                        <h3 style={h3s}>Expedientes por Especialista</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /><Bar dataKey="Procesados" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Pendientes" fill={C.red} radius={[4, 4, 0, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={card}>
                        <h3 style={h3s}>Estado General</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"><Cell fill={C.green} /><Cell fill={C.red} /></Pie><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /></PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", justifyContent: "center", gap: 30, marginTop: 10 }}>
                            <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontSize: "1.5rem", fontFamily: "'DM Serif Display'" }}>{totals.exp ? Math.round(totals.proc / totals.exp * 100) : 0}%</p><p style={{ color: C.g500, fontSize: "0.72rem", fontFamily: "'DM Sans'" }}>Resolucion</p></div>
                            <div style={{ textAlign: "center" }}><p style={{ color: C.navy4, fontSize: "1.5rem", fontFamily: "'DM Serif Display'" }}>{filtered.length}</p><p style={{ color: C.g500, fontSize: "0.72rem", fontFamily: "'DM Sans'" }}>Especialistas</p></div>
                        </div>
                    </div>
                </div>
            )}

            {/* RANKING */}
            {view === "ranking" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* —— Sección Especialistas —— */}
                    {(rolFilter === "todos" || rolFilter === "especialistas") && sortedEspecialistas.length > 0 && (
                        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "14px 18px", background: `${C.navy5}08`, borderBottom: `2px solid ${C.navy5}25` }}>
                                <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Especialistas <span style={{ fontSize: "0.78rem", color: C.g500, fontFamily: "'DM Sans'", fontWeight: 400 }}>— Procesan expedientes</span></h3>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 70px 90px 90px 110px 60px", padding: "12px 18px", gap: 10, borderBottom: `2px solid ${C.g200}`, background: C.g50 }}>
                                {["#", "Especialista", "Total", "Procesados", "Pendientes", "Eficiencia", "Estado"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Especialista" ? "left" : "center" }}>{h}</p>)}
                            </div>
                            {sortedEspecialistas.map((s, i) => {
                                const hi = s.pr >= 90, lo = s.pr < 80, sc = hi ? C.green : lo ? C.red : C.amber;
                                return (
                                    <div key={s.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 70px 90px 90px 110px 60px", alignItems: "center", padding: "14px 18px", gap: 10, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s", cursor: "default" }}
                                        onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i < 3 ? `${C.gold2}18` : C.g100, color: i < 3 ? C.gold1 : C.g500, fontWeight: 700, fontSize: "0.82rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                        <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.87rem", margin: 0, fontFamily: "'DM Sans'" }}>{s.nombre}</p><span style={{ display: "inline-block", marginTop: 3, padding: "1px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: s.tipo === "EBA" ? `${C.navy5}15` : `${C.gold2}15`, color: s.tipo === "EBA" ? C.navy5 : C.gold1 }}>{s.tipo}</span></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.navy1, fontWeight: 700, fontSize: "1rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{s.tt}</p><p style={{ color: C.g400, fontSize: "0.65rem", margin: 0 }}>Total</p></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontWeight: 700, fontSize: "0.95rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{s.tr}</p><p style={{ color: C.g400, fontSize: "0.65rem", margin: 0 }}>Procesados</p></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: s.tp > 20 ? C.red : C.amber, fontWeight: 700, fontSize: "0.95rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{s.tp}</p><p style={{ color: C.g400, fontSize: "0.65rem", margin: 0 }}>Pendientes</p></div>
                                        <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: "0.68rem", color: C.g500 }}>Eficiencia</span><span style={{ fontSize: "0.78rem", fontWeight: 700, color: sc, fontFamily: "'JetBrains Mono'" }}>{s.pr}%</span></div><div style={{ height: 5, borderRadius: 3, background: C.g200, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, width: `${s.pr}%`, background: sc, transition: "width 0.8s ease" }} /></div></div>
                                        <div style={{ display: "flex", justifyContent: "center" }}>{hi ? I.check(18, C.green) : lo ? I.alert(18, C.red) : I.clock(18, C.amber)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* —— Sección Oficinistas —— */}
                    {(rolFilter === "todos" || rolFilter === "oficinistas") && sortedOficinistas.length > 0 && (
                        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "14px 18px", background: `${C.gold2}08`, borderBottom: `2px solid ${C.gold2}25` }}>
                                <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Oficinistas <span style={{ fontSize: "0.78rem", color: C.g500, fontFamily: "'DM Sans'", fontWeight: 400 }}>— Asignan expedientes y filtran devoluciones</span></h3>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 70px 90px 90px 110px 60px", padding: "12px 18px", gap: 10, borderBottom: `2px solid ${C.g200}`, background: C.g50 }}>
                                {["#", "Oficinista", "Total", "Asignados", "Pendientes", "Revisión", "Estado"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'", textAlign: h === "#" || h === "Oficinista" ? "left" : "center" }}>{h}</p>)}
                            </div>
                            {sortedOficinistas.map((s, i) => {
                                const hi = s.pr >= 90, lo = s.pr < 80, sc = hi ? C.green : lo ? C.red : C.amber;
                                return (
                                    <div key={s.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 70px 90px 90px 110px 60px", alignItems: "center", padding: "14px 18px", gap: 10, borderBottom: `1px solid ${C.g100}`, transition: "background 0.15s", cursor: "default" }}
                                        onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: "0.82rem", fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                        <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: "0.87rem", margin: 0, fontFamily: "'DM Sans'" }}>{s.nombre}</p><span style={{ display: "inline-block", marginTop: 3, padding: "1px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'JetBrains Mono'", background: `${C.g500}15`, color: C.g600 }}>OFICINISTA</span></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.navy1, fontWeight: 700, fontSize: "1rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{s.tt}</p><p style={{ color: C.g400, fontSize: "0.65rem", margin: 0 }}>Total</p></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: C.green, fontWeight: 700, fontSize: "0.95rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{s.tr}</p><p style={{ color: C.g400, fontSize: "0.65rem", margin: 0 }}>Asignados</p></div>
                                        <div style={{ textAlign: "center" }}><p style={{ color: s.tp > 20 ? C.red : C.amber, fontWeight: 700, fontSize: "0.95rem", margin: 0, fontFamily: "'JetBrains Mono'" }}>{s.tp}</p><p style={{ color: C.g400, fontSize: "0.65rem", margin: 0 }}>Pendientes</p></div>
                                        <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: "0.68rem", color: C.g500 }}>Revisión</span><span style={{ fontSize: "0.78rem", fontWeight: 700, color: sc, fontFamily: "'JetBrains Mono'" }}>{s.pr}%</span></div><div style={{ height: 5, borderRadius: 3, background: C.g200, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, width: `${s.pr}%`, background: sc, transition: "width 0.8s ease" }} /></div></div>
                                        <div style={{ display: "flex", justifyContent: "center" }}>{hi ? I.check(18, C.green) : lo ? I.alert(18, C.red) : I.clock(18, C.amber)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* COMPARATIVA */}
            {view === "comparativa" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={card}>
                        <h3 style={h3s}>Comparativa EBA vs ETP</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[{ m: "Total Exp.", EBA: typeComp.eba.total, ETP: typeComp.etp.total }, { m: "Procesados", EBA: typeComp.eba.proc, ETP: typeComp.etp.proc }, { m: "Pendientes", EBA: typeComp.eba.pend, ETP: typeComp.etp.pend }, { m: "Eficiencia %", EBA: typeComp.eba.avg, ETP: typeComp.etp.avg }]} layout="vertical" barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><YAxis dataKey="m" type="category" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'DM Sans'" }} width={90} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /><Bar dataKey="EBA" fill={C.navy5} radius={[0, 4, 4, 0]} /><Bar dataKey="ETP" fill={C.gold2} radius={[0, 4, 4, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={card}>
                        <h3 style={h3s}>Perfil de Rendimiento</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData}><PolarGrid stroke={C.g200} /><PolarAngleAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'DM Sans'" }} /><PolarRadiusAxis tick={{ fill: C.g400, fontSize: 9 }} /><Radar name="Eficiencia" dataKey="eficiencia" stroke={C.green} fill={C.green} fillOpacity={0.15} /><Radar name="Volumen" dataKey="volumen" stroke={C.gold2} fill={C.gold2} fillOpacity={0.15} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "'DM Sans'" }} /><Tooltip content={<CTip />} /></RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {["EBA", "ETP"].map(tipo => {
                            const info = tipo === "EBA" ? typeComp.eba : typeComp.etp;
                            const specs = info.items.sort((a, b) => b.pr - a.pr);
                            return (
                                <div key={tipo} style={{ ...card, borderLeft: `4px solid ${tipo === "EBA" ? C.navy5 : C.gold2}` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                                        <span style={{ padding: "4px 12px", borderRadius: 6, fontWeight: 700, fontSize: "0.82rem", fontFamily: "'JetBrains Mono'", background: tipo === "EBA" ? `${C.navy5}15` : `${C.gold2}15`, color: tipo === "EBA" ? C.navy5 : C.gold1 }}>Especialistas {tipo}</span>
                                        <span style={{ color: C.g400, fontSize: "0.82rem", fontFamily: "'DM Sans'" }}>{info.n} miembros</span>
                                    </div>
                                    {specs.map(s => (
                                        <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.g100}` }}>
                                            <span style={{ color: C.navy1, fontSize: "0.83rem", fontWeight: 500, fontFamily: "'DM Sans'" }}>{s.nombre}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <span style={{ color: C.g400, fontSize: "0.78rem", fontFamily: "'JetBrains Mono'" }}>{s.tt} exp.</span>
                                                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.78rem", fontWeight: 700, fontFamily: "'JetBrains Mono'", background: s.pr >= 90 ? `${C.green}12` : s.pr >= 80 ? `${C.amber}12` : `${C.red}12`, color: s.pr >= 90 ? C.green : s.pr >= 80 ? C.amber : C.red }}>{s.pr}%</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
                                        <div><p style={{ color: C.g400, fontSize: "0.68rem" }}>Total</p><p style={{ color: C.navy1, fontSize: "1.15rem", fontFamily: "'DM Serif Display'" }}>{info.total}</p></div>
                                        <div><p style={{ color: C.g400, fontSize: "0.68rem" }}>Eficiencia</p><p style={{ color: C.green, fontSize: "1.15rem", fontFamily: "'DM Serif Display'" }}>{info.avg}%</p></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TENDENCIA */}
            {view === "tendencia" && (
                <div style={card}>
                    <h3 style={h3s}>Tendencia Diaria de Procesamiento</h3>
                    <p style={{ color: C.g500, fontSize: "0.78rem", margin: "0 0 6px", fontFamily: "'DM Sans'" }}>Expedientes procesados por dia habil (ultimos 30 dias)</p>
                    <p style={{ color: C.g400, fontSize: "0.7rem", margin: "0 0 18px", fontFamily: "'DM Sans'" }}>✦ = Oficinista (asignación/revisión)</p>
                    <ResponsiveContainer width="100%" height={380}>
                        <AreaChart data={DAILY_PROGRESS.slice(-30)}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="label" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'JetBrains Mono'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                            {/* Especialistas — línea sólida */}
                            <Area type="monotone" dataKey="Quispe S." stroke={C.navy5} fill={`${C.navy5}15`} strokeWidth={2} />
                            <Area type="monotone" dataKey="Albino I." stroke={C.red} fill={`${C.red}15`} strokeWidth={2} />
                            <Area type="monotone" dataKey="Villalobos G." stroke={C.amber} fill={`${C.amber}15`} strokeWidth={2} />
                            {/* Oficinistas — con ✦ en nombre */}
                            <Area type="monotone" dataKey="Cuellar C. ✦" stroke={C.g500} fill={`${C.g500}10`} strokeWidth={1.5} strokeDasharray="5 3" />
                            <Area type="monotone" dataKey="Gutierrez S. ✦" stroke={C.g400} fill={`${C.g400}10`} strokeWidth={1.5} strokeDasharray="5 3" />
                            <Area type="monotone" dataKey="Vasquez A. ✦" stroke={C.g300} fill={`${C.g300}10`} strokeWidth={1.5} strokeDasharray="5 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
