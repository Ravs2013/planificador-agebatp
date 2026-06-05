import { useState, useMemo, useEffect, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import {
    subscribeDirectorioCeba, subscribeDirectorioCetpro,
    subscribeActividades, subscribeMonitoreoSemanal, subscribeMonitoreoAcumulado,
    subscribeEsinadSemanas, subscribeReqCeba, subscribeReqCetpro, subscribeReuniones
} from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import { STAFF } from "../data/constants";
import Icon from "./Icon";

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
    indigo: "#4338CA", teal: "#0F766E", purple: "#7C3AED",
};

const CHART_COLORS = ["#1E4D7B", "#2563A0", "#CA8A04", "#15803D", "#B91C1C", "#4338CA", "#0F766E", "#7C3AED", "#B45309", "#0C1929"];

/* ═══ ESTILOS ═══ */
const S = {
    card: { background: C.white, border: `1px solid ${C.g200}`, borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.06)" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
};

/* ═══ TOOLTIP ═══ */
function CTip({ active, payload, label }) {
    if (!active || !payload) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'" }}>
            <p style={{ color: C.g600, fontSize: "0.78rem", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill, fontSize: "0.8rem", margin: "2px 0", fontWeight: 600 }}>{p.name}: <span style={{ fontFamily: "'JetBrains Mono'" }}>{p.value}</span></p>)}
        </div>
    );
}

/* ═══ KPI CARD ═══ */
function KpiCard({ label, value, sub, color, iconName }) {
    return (
        <div style={{ ...S.card, padding: "18px 20px", position: "relative", overflow: "hidden", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: color }} />
            {iconName && <div style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 8, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={iconName} size={18} color={color} /></div>}
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.7rem", fontWeight: 600, letterSpacing: -1, lineHeight: 1, color }}>
                {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            <div style={{ fontSize: "0.68rem", color: C.g500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6, fontFamily: "'DM Sans'" }}>{label}</div>
            {sub && <div style={{ fontSize: "0.72rem", color: C.g400, marginTop: 2, fontFamily: "'DM Sans'" }}>{sub}</div>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function ReportesModule() {
    const { user, isRole } = useAuth();

    // ── Data state ──
    const [cebas, setCebas] = useState([]);
    const [cetpros, setCetpros] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [monitoreoSem, setMonitoreoSem] = useState([]);
    const [monitoreoAcum, setMonitoreoAcum] = useState([]);
    const [esinad, setEsinad] = useState([]);
    const [reqCeba, setReqCeba] = useState([]);
    const [reqCetpro, setReqCetpro] = useState([]);
    const [reuniones, setReuniones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dbStaff, setDbStaff] = useState([]);

    // ── Filters ──
    const [filtroDistrito, setFiltroDistrito] = useState("todos");
    const [filtroGestion, setFiltroGestion] = useState("todos");
    const [filtroStaff, setFiltroStaff] = useState("todos");
    const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
    const [filtroFechaFin, setFiltroFechaFin] = useState("");

    // ── Active staff list (from Firestore users if available, else from constants) ──
    const staff = useMemo(() => dbStaff.length > 0 ? dbStaff : STAFF, [dbStaff]);

    // ── Subscribe to all collections ──
    useEffect(() => {
        const unsubs = [];
        let loaded = 0;
        const checkLoaded = () => { loaded++; if (loaded >= 7) setLoading(false); };

        // Only subscribe to directorios if staff role
        if (isRole('admin') || isRole('jefatura') || isRole('personal')) {
            unsubs.push(subscribeDirectorioCeba((list) => { setCebas(list || []); checkLoaded(); }));
            unsubs.push(subscribeDirectorioCetpro((list) => { setCetpros(list || []); checkLoaded(); }));
        } else {
            loaded += 2; // Skip directory loading for non-staff
        }

        unsubs.push(subscribeActividades((list) => { setActividades(list || []); checkLoaded(); }));
        unsubs.push(subscribeMonitoreoSemanal((list) => { setMonitoreoSem(list || []); checkLoaded(); }));
        unsubs.push(subscribeMonitoreoAcumulado((list) => { setMonitoreoAcum(list || []); checkLoaded(); }));
        unsubs.push(subscribeEsinadSemanas((list) => { setEsinad(list || []); checkLoaded(); }));
        unsubs.push(subscribeReuniones((list) => { setReuniones(list || []); checkLoaded(); }));

        // Also load users for staff names
        import("../firebase/db").then(({ subscribeUsuarios }) => {
            unsubs.push(subscribeUsuarios((users) => {
                const staffList = users
                    .filter(u => u.staffId != null)
                    .map(u => ({
                        id: parseInt(u.staffId),
                        name: u.nombre,
                        role: u.cargo || u.rol || 'Personal',
                        initials: u.nombre?.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '??'
                    }));
                setDbStaff(staffList);
            }));
        });

        // Requerimientos (may not exist yet)
        try {
            unsubs.push(subscribeReqCeba((list) => { setReqCeba(list || []); }));
            unsubs.push(subscribeReqCetpro((list) => { setReqCetpro(list || []); }));
        } catch { /* collections may not exist yet */ }

        return () => unsubs.forEach(u => { if (typeof u === 'function') u(); });
    }, []);

    // ── Filtered CEBA data ──
    const filteredCebas = useMemo(() => {
        let f = [...cebas];
        if (filtroDistrito !== "todos") f = f.filter(c => c.distrito === filtroDistrito);
        if (filtroGestion !== "todos") {
            const isEstatal = filtroGestion === "estatal";
            f = f.filter(c => {
                const g = (c.tipoGestion || "").toUpperCase();
                return isEstatal ? g.includes("ESTATAL") : !g.includes("ESTATAL");
            });
        }
        return f;
    }, [cebas, filtroDistrito, filtroGestion]);

    // ── Filtered activities by date and staff ──
    const filteredActividades = useMemo(() => {
        let f = [...actividades];
        if (filtroStaff !== "todos") f = f.filter(a => a.assigned?.includes(parseInt(filtroStaff)));
        if (filtroFechaInicio) f = f.filter(a => (a.date || "") >= filtroFechaInicio);
        if (filtroFechaFin) f = f.filter(a => (a.date || "") <= filtroFechaFin);
        // For personal role, only show their own
        if (isRole('personal') && user?.staffId) {
            f = f.filter(a => a.assigned?.includes(parseInt(user.staffId)));
        }
        return f;
    }, [actividades, filtroStaff, filtroFechaInicio, filtroFechaFin, user]);

    // ── Derived data ──
    const distritos = useMemo(() => [...new Set(cebas.map(c => c.distrito).filter(Boolean))].sort(), [cebas]);

    // ── KPIs ──
    const kpis = useMemo(() => {
        const totalCeba = filteredCebas.length;
        const totalAlumnos = filteredCebas.reduce((s, c) => s + (c.alumnosCenso || 0), 0);
        const estatales = filteredCebas.filter(c => (c.tipoGestion || "").toUpperCase().includes("ESTATAL")).length;
        const convenio = totalCeba - estatales;
        const totalPerifericos = filteredCebas.reduce((s, c) => s + (c.cantidadPerifericos || 0), 0);
        const totalCetpro = cetpros.length;

        const actTotal = filteredActividades.length;
        const actCompletadas = filteredActividades.filter(a => a.status === "completado" || a.estado === "completado" || a.progress >= 100 || a.progreso >= 100).length;
        const actPendientes = filteredActividades.filter(a => a.status === "pendiente" || a.estado === "pendiente").length;
        const pctCompletadas = actTotal > 0 ? Math.round((actCompletadas / actTotal) * 100) : 0;

        const monSemanal = monitoreoSem.length;
        const monAcumulado = monitoreoAcum.reduce((s, m) => s + (parseInt(m.total) || parseInt(m.acumulado) || 1), 0) || monitoreoAcum.length;
        const esinadSemanal = esinad.length;
        const esinadTotal = esinad.reduce((s, e) => s + (e.expedientes?.length || 1), 0);

        const allReqs = [...reqCeba, ...reqCetpro];
        const reqPendientes = allReqs.filter(r => (r.estado || "").toLowerCase().includes("pendiente")).length;
        const reqAtendidos = allReqs.filter(r => (r.estado || "").toLowerCase().includes("atendid")).length;

        const reuTotal = reuniones.length;
        const reuRealizadas = reuniones.filter(r => r.estado === "realizada" || r.status === "realizada" || r.aprobada === true).length;
        const reuPendientes = reuniones.filter(r => r.estado === "pendiente" || r.status === "pendiente" || (!r.aprobada && !r.rechazada)).length;

        return {
            totalCeba, totalAlumnos, estatales, convenio, totalPerifericos, totalCetpro,
            actTotal, actCompletadas, actPendientes, pctCompletadas,
            monSemanal, monAcumulado, esinadSemanal, esinadTotal,
            reqPendientes, reqAtendidos, reqTotal: allReqs.length,
            reuTotal, reuRealizadas, reuPendientes
        };
    }, [filteredCebas, cetpros, filteredActividades, monitoreoSem, monitoreoAcum, esinad, reqCeba, reqCetpro, reuniones]);

    // ═══ CHART DATA ═══

    // CEBA por Distrito (barras)
    const cebaDistritoData = useMemo(() => {
        const map = {};
        filteredCebas.forEach(c => {
            const d = c.distrito || "Sin distrito";
            map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, CEBA: value }));
    }, [filteredCebas]);

    // Alumnos por CEBA (Top 10, barras horizontales)
    const alumnosData = useMemo(() => {
        return [...filteredCebas]
            .sort((a, b) => (b.alumnosCenso || 0) - (a.alumnosCenso || 0))
            .slice(0, 10)
            .map(c => ({ nombre: (c.nombre || "").substring(0, 25), Estudiantes: c.alumnosCenso || 0 }));
    }, [filteredCebas]);

    // Modalidad (dona)
    const modalidadData = useMemo(() => {
        let pres = 0, semi = 0, dist = 0;
        filteredCebas.forEach(c => {
            if (c.presencial) pres++;
            if (c.semipresencial) semi++;
            if (c.aDistancia) dist++;
        });
        return [
            { name: "Presencial", value: pres },
            { name: "Semipresencial", value: semi },
            { name: "A Distancia", value: dist },
        ].filter(d => d.value > 0);
    }, [filteredCebas]);

    // Ciclos (barras)
    const cicloData = useMemo(() => {
        let ini = 0, inter = 0, ava = 0;
        filteredCebas.forEach(c => {
            if (c.cicloInicial) ini++;
            if (c.cicloIntermedio) inter++;
            if (c.cicloAvanzado) ava++;
        });
        return [
            { name: "Inicial", value: ini },
            { name: "Intermedio", value: inter },
            { name: "Avanzado", value: ava },
        ];
    }, [filteredCebas]);

    // Turnos (dona)
    const turnosData = useMemo(() => {
        const map = { M: 0, T: 0, N: 0 };
        filteredCebas.forEach(c => {
            const t = (c.turnos || "").toUpperCase();
            if (t.includes("M") || t.includes("MAÑ")) map.M++;
            if (t.includes("T") || t.includes("TAR")) map.T++;
            if (t.includes("N") || t.includes("NOC")) map.N++;
        });
        return [
            { name: "Mañana", value: map.M },
            { name: "Tarde", value: map.T },
            { name: "Noche", value: map.N },
        ].filter(d => d.value > 0);
    }, [filteredCebas]);

    // Progreso por especialista (barras apiladas)
    const staffProgressData = useMemo(() => {
        return staff.map(s => {
            const acts = actividades.filter(a => a.assigned?.includes(s.id));
            const completadas = acts.filter(a => a.status === "completado" || a.estado === "completado" || a.progress >= 100 || a.progreso >= 100).length;
            const pendientes = acts.length - completadas;
            return { name: (s.name || "").split(" ").slice(0, 2).join(" "), Completadas: completadas, Pendientes: pendientes };
        }).filter(d => d.Completadas > 0 || d.Pendientes > 0);
    }, [staff, actividades]);

    // Monitoreo evolución
    const monitoreoEvData = useMemo(() => {
        return monitoreoSem.map((m, i) => ({
            name: m.semana || `Sem ${i + 1}`,
            Semanal: parseInt(m.total) || parseInt(m.cantidad) || 1,
        })).slice(-12);
    }, [monitoreoSem]);

    // ESINAD evolución
    const esinadEvData = useMemo(() => {
        return esinad.map((e, i) => ({
            name: e.semana || e.id || `Sem ${i + 1}`,
            Expedientes: e.expedientes?.length || parseInt(e.total) || 1,
        })).slice(-12);
    }, [esinad]);

    // Requerimientos por estado
    const reqEstadoData = useMemo(() => {
        const all = [...reqCeba, ...reqCetpro];
        const map = {};
        all.forEach(r => {
            const e = (r.estado || "pendiente").toLowerCase();
            map[e] = (map[e] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    }, [reqCeba, reqCetpro]);

    // ═══ EXPORT ═══
    const handleExportPDF = useCallback(() => {
        const pdf = new jsPDF("portrait", "mm", "a4");
        const W = 210, MX = 15;
        let y = 20;

        pdf.setFontSize(18); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
        pdf.text("Reporte de Gestión AGEBATP — UGEL 03", MX, y); y += 10;
        pdf.setFontSize(10); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139);
        pdf.text(`Generado: ${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE")}`, MX, y); y += 12;

        // KPIs table
        const kpiRows = [
            ["CEBA", kpis.totalCeba, "Alumnos (Censo)", kpis.totalAlumnos],
            ["Estatales", kpis.estatales, "Convenio", kpis.convenio],
            ["CETPRO", kpis.totalCetpro, "Periféricos", kpis.totalPerifericos],
            ["Actividades", kpis.actTotal, "% Completadas", `${kpis.pctCompletadas}%`],
            ["Monitoreo Sem.", kpis.monSemanal, "Acumulado", kpis.monAcumulado],
            ["ESINAD Semanas", kpis.esinadSemanal, "Expedientes Total", kpis.esinadTotal],
            ["Requerimientos", kpis.reqTotal, "Pendientes", kpis.reqPendientes],
            ["Reuniones", kpis.reuTotal, "Realizadas", kpis.reuRealizadas],
        ];
        pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
        pdf.text("Indicadores Clave", MX, y); y += 8;

        kpiRows.forEach(row => {
            pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(71, 85, 105);
            pdf.text(`${row[0]}: `, MX, y);
            pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 77, 123);
            pdf.text(String(row[1]), MX + 45, y);
            pdf.setFont("helvetica", "normal"); pdf.setTextColor(71, 85, 105);
            pdf.text(`${row[2]}: `, MX + 90, y);
            pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 77, 123);
            pdf.text(String(row[3]), MX + 135, y);
            y += 6;
        });

        y += 6;
        pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
        pdf.text("CEBA por Distrito", MX, y); y += 6;
        cebaDistritoData.forEach(d => {
            pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(71, 85, 105);
            pdf.text(`${d.name}: ${d.CEBA}`, MX + 4, y); y += 5;
        });

        pdf.save(`Reporte_AGEBATP_${new Date().toISOString().split("T")[0]}.pdf`);
    }, [kpis, cebaDistritoData]);

    const handleExportExcel = useCallback(() => {
        const wb = XLSX.utils.book_new();

        // KPIs sheet
        const kpiData = [
            ["Indicador", "Valor"],
            ["Total CEBA", kpis.totalCeba], ["Alumnos (Censo)", kpis.totalAlumnos],
            ["Estatales", kpis.estatales], ["Convenio", kpis.convenio],
            ["Total CETPRO", kpis.totalCetpro], ["Periféricos", kpis.totalPerifericos],
            ["Actividades Total", kpis.actTotal], ["% Completadas", kpis.pctCompletadas],
            ["Monitoreo Semanal", kpis.monSemanal], ["Monitoreo Acumulado", kpis.monAcumulado],
            ["ESINAD Semanas", kpis.esinadSemanal], ["ESINAD Total", kpis.esinadTotal],
            ["Requerimientos Total", kpis.reqTotal], ["Req. Pendientes", kpis.reqPendientes],
            ["Reuniones Total", kpis.reuTotal], ["Reuniones Realizadas", kpis.reuRealizadas],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), "KPIs");

        // CEBA por distrito
        const distData = [["Distrito", "Cantidad CEBA"], ...cebaDistritoData.map(d => [d.name, d.CEBA])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(distData), "CEBA por Distrito");

        // Progreso por especialista
        const progData = [["Especialista", "Completadas", "Pendientes"], ...staffProgressData.map(d => [d.name, d.Completadas, d.Pendientes])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(progData), "Progreso Staff");

        XLSX.writeFile(wb, `Reporte_AGEBATP_${new Date().toISOString().split("T")[0]}.xlsx`);
    }, [kpis, cebaDistritoData, staffProgressData]);

    // ═══ LOADING ═══
    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 80, fontFamily: "'DM Sans'" }}>
                <div style={{ display: 'inline-block', width: 24, height: 24, border: `3px solid ${C.g200}`, borderTopColor: C.navy4, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: C.g500, fontSize: '0.85rem', marginTop: 10 }}>Cargando datos del dashboard...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ═══ RENDER ═══
    return (
        <div>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>
                        Reportes y Estadísticas
                    </h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>
                        Dashboard de gestión AGEBATP — UGEL 03 · Datos en tiempo real
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleExportPDF} style={S.btn(C.navy4, C.white, C.navy5)}>
                        <Icon name="fileText" size={14} /> Exportar PDF
                    </button>
                    <button onClick={handleExportExcel} style={S.btn(C.green, C.white, C.green)}>
                        <Icon name="barChart" size={14} /> Exportar Excel
                    </button>
                </div>
            </div>

            {/* FILTERS BAR */}
            <div style={{ ...S.card, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filtros:</span>
                <select value={filtroDistrito} onChange={e => setFiltroDistrito(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: 12, fontFamily: "'DM Sans'", color: C.g700, background: C.white }}>
                    <option value="todos">Todos los distritos</option>
                    {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filtroGestion} onChange={e => setFiltroGestion(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: 12, fontFamily: "'DM Sans'", color: C.g700, background: C.white }}>
                    <option value="todos">Tipo de gestión</option>
                    <option value="estatal">Estatal</option>
                    <option value="convenio">Convenio / Otros</option>
                </select>
                <select value={filtroStaff} onChange={e => setFiltroStaff(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: 12, fontFamily: "'DM Sans'", color: C.g700, background: C.white }}>
                    <option value="todos">Todo el personal</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name?.split(" ").slice(0, 2).join(" ")}</option>)}
                </select>
                <input type="date" value={filtroFechaInicio} onChange={e => setFiltroFechaInicio(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: 12, fontFamily: "'DM Sans'", color: C.g700, background: C.white }} />
                <span style={{ color: C.g400, fontSize: 12 }}>a</span>
                <input type="date" value={filtroFechaFin} onChange={e => setFiltroFechaFin(e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: 12, fontFamily: "'DM Sans'", color: C.g700, background: C.white }} />
                {(filtroDistrito !== "todos" || filtroGestion !== "todos" || filtroStaff !== "todos" || filtroFechaInicio || filtroFechaFin) && (
                    <button onClick={() => { setFiltroDistrito("todos"); setFiltroGestion("todos"); setFiltroStaff("todos"); setFiltroFechaInicio(""); setFiltroFechaFin(""); }}
                        style={{ ...S.btn(C.g100, C.g600, C.g200), padding: "6px 12px", fontSize: 11 }}>
                        <Icon name="x" size={12} /> Limpiar
                    </button>
                )}
            </div>

            {/* KPI CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
                <KpiCard label="Total CEBA" value={kpis.totalCeba} sub="Instituciones" color={C.navy4} iconName="building" />
                <KpiCard label="Alumnos (Censo)" value={kpis.totalAlumnos} sub="Matriculados" color={C.green} iconName="graduationCap" />
                <KpiCard label="Gestión" value={`${kpis.estatales}E / ${kpis.convenio}C`} sub="Estatal / Convenio" color={C.gold2} iconName="clipboard" />
                <KpiCard label="Periféricos" value={kpis.totalPerifericos} sub="Sedes periféricas" color={C.teal} iconName="pin" />
                <KpiCard label="Actividades" value={`${kpis.pctCompletadas}%`} sub={`${kpis.actCompletadas}/${kpis.actTotal} completadas`} color={kpis.pctCompletadas >= 70 ? C.green : kpis.pctCompletadas >= 40 ? C.amber : C.red} iconName="checkCircle" />
                <KpiCard label="Monitoreo" value={kpis.monSemanal} sub={`${kpis.monAcumulado} acumulado`} color={C.indigo} iconName="barChart" />
                <KpiCard label="ESINAD" value={kpis.esinadSemanal} sub={`${kpis.esinadTotal} expedientes`} color={C.purple} iconName="folderOpen" />
                <KpiCard label="Reuniones" value={kpis.reuTotal} sub={`${kpis.reuRealizadas} realizadas`} color={C.navy3} iconName="meeting" />
            </div>

            {/* CHARTS ROW 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }} className="grid-calendar">
                {/* CEBA por Distrito */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>CEBA por Distrito</h3>
                    {cebaDistritoData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={Math.max(250, cebaDistritoData.length * 36)}>
                            <BarChart data={cebaDistritoData} layout="vertical" barSize={20} margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                <XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fill: C.g600, fontSize: 10, fontFamily: "'DM Sans'" }} />
                                <Tooltip content={<CTip />} />
                                <Bar dataKey="CEBA" fill={C.navy4} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 30 }}>Sin datos de directorio CEBA</p>}
                </div>

                {/* Distribución por Modalidad */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>Distribución por Modalidad</h3>
                    {modalidadData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={modalidadData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                                    label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: C.g300 }}>
                                    {modalidadData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CTip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 30 }}>Sin datos</p>}
                </div>
            </div>

            {/* CHARTS ROW 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }} className="grid-personal">
                {/* Ciclos */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "0.92rem", margin: "0 0 14px", fontFamily: "'DM Serif Display',serif" }}>Distribución por Ciclo</h3>
                    {cicloData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={cicloData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                <XAxis dataKey="name" tick={{ fill: C.g500, fontSize: 11 }} />
                                <YAxis tick={{ fill: C.g500, fontSize: 11 }} />
                                <Tooltip content={<CTip />} />
                                <Bar dataKey="value" name="CEBA" fill={C.navy5} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 20 }}>Sin datos</p>}
                </div>

                {/* Turnos */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "0.92rem", margin: "0 0 14px", fontFamily: "'DM Serif Display',serif" }}>Turnos (M/T/N)</h3>
                    {turnosData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={turnosData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                                    label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: C.g300 }}>
                                    {turnosData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CTip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 20 }}>Sin datos</p>}
                </div>

                {/* Requerimientos por estado */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "0.92rem", margin: "0 0 14px", fontFamily: "'DM Serif Display',serif" }}>Requerimientos por Estado</h3>
                    {reqEstadoData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={reqEstadoData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                                    label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: C.g300 }}>
                                    {reqEstadoData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 5) % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CTip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 20 }}>Sin datos de requerimientos</p>}
                </div>
            </div>

            {/* CHARTS ROW 3 — Alumnos Top N + Progreso por especialista */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="grid-calendar">
                {/* Alumnos por CEBA Top 10 */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>Alumnos por CEBA (Top 10)</h3>
                    {alumnosData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={Math.max(250, alumnosData.length * 30)}>
                            <BarChart data={alumnosData} layout="vertical" barSize={16} margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                <XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                <YAxis type="category" dataKey="nombre" width={160} tick={{ fill: C.g600, fontSize: 10, fontFamily: "'DM Sans'" }} />
                                <Tooltip content={<CTip />} />
                                <Bar dataKey="Estudiantes" fill={C.green} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 30 }}>Sin datos</p>}
                </div>

                {/* Progreso por especialista */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>Progreso por Especialista</h3>
                    {staffProgressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={Math.max(250, staffProgressData.length * 40)}>
                            <BarChart data={staffProgressData} layout="vertical" barSize={18} margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                <XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                <YAxis type="category" dataKey="name" width={130} tick={{ fill: C.g600, fontSize: 10, fontFamily: "'DM Sans'" }} />
                                <Tooltip content={<CTip />} />
                                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                <Bar dataKey="Completadas" stackId="a" fill={C.green} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Pendientes" stackId="a" fill={C.amber} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 30 }}>Sin actividades asignadas</p>}
                </div>
            </div>

            {/* CHARTS ROW 4 — Evolution lines */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="grid-calendar">
                {/* Monitoreo evolución */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>Monitoreo — Evolución Semanal</h3>
                    {monitoreoEvData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={monitoreoEvData}>
                                <defs>
                                    <linearGradient id="gradMon" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.indigo} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                <XAxis dataKey="name" tick={{ fill: C.g500, fontSize: 10 }} />
                                <YAxis tick={{ fill: C.g500, fontSize: 11 }} />
                                <Tooltip content={<CTip />} />
                                <Area type="monotone" dataKey="Semanal" stroke={C.indigo} fill="url(#gradMon)" strokeWidth={2} dot={{ r: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 30 }}>Sin datos de monitoreo</p>}
                </div>

                {/* ESINAD evolución */}
                <div style={S.card}>
                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>ESINAD — Evolución</h3>
                    {esinadEvData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={esinadEvData}>
                                <defs>
                                    <linearGradient id="gradEsi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={C.purple} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                <XAxis dataKey="name" tick={{ fill: C.g500, fontSize: 10 }} />
                                <YAxis tick={{ fill: C.g500, fontSize: 11 }} />
                                <Tooltip content={<CTip />} />
                                <Area type="monotone" dataKey="Expedientes" stroke={C.purple} fill="url(#gradEsi)" strokeWidth={2} dot={{ r: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <p style={{ color: C.g400, fontSize: "0.85rem", textAlign: "center", padding: 30 }}>Sin datos de ESINAD</p>}
                </div>
            </div>
        </div>
    );
}
