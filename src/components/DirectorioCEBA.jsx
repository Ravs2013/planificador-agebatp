import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

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

const PIE_COLORS = ["#1E4D7B", "#2563A0", "#CA8A04", "#15803D", "#B91C1C", "#4338CA", "#0F766E", "#7C3AED", "#B45309"];

const LS_KEY = "agebatp_directorio_ceba";

/* ═══════════════════════════════════════════════════════════
   SVG ICON HELPER
   ═══════════════════════════════════════════════════════════ */
const SvgIcon = ({ children, size = 20, color = C.g500, style: s, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...s }} {...props}>{children}</svg>
);

const Icons = {
    users: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></SvgIcon>,
    school: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" /></SvgIcon>,
    book: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></SvgIcon>,
    grid: (sz, cl) => <SvgIcon size={sz} color={cl}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></SvgIcon>,
    briefcase: (sz, cl) => <SvgIcon size={sz} color={cl}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></SvgIcon>,
    mapPin: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></SvgIcon>,
    upload: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></SvgIcon>,
    download: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SvgIcon>,
    search: (sz, cl) => <SvgIcon size={sz} color={cl}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></SvgIcon>,
    x: (sz, cl) => <SvgIcon size={sz} color={cl}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></SvgIcon>,
    mail: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></SvgIcon>,
    phone: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></SvgIcon>,
    barChart: (sz, cl) => <SvgIcon size={sz} color={cl}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></SvgIcon>,
    check: (sz, cl) => <SvgIcon size={sz} color={cl}><polyline points="20 6 9 17 4 12" /></SvgIcon>,
    file: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></SvgIcon>,
};

/* ═══════════════════════════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════════════════════════ */
function CTip({ active, payload, label }) {
    if (!active || !payload) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'" }}>
            <p style={{ color: C.g600, fontSize: "0.78rem", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill, fontSize: "0.8rem", margin: "2px 0", fontWeight: 600 }}>{p.name}: <span style={{ fontFamily: "'JetBrains Mono'" }}>{p.value}</span></p>)}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD
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

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */
const S = {
    card: { background: C.white, border: `1px solid ${C.g200}`, borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.06)" },
    badge: (bg, color, border) => ({ fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: bg, color, border: `1px solid ${border || color + "30"}`, letterSpacing: 0.3, fontFamily: "'JetBrains Mono'" }),
    input: { padding: "9px 14px", borderRadius: 6, border: "1px solid #D6DCE8", fontFamily: "'DM Sans'", fontSize: 13, background: C.white, color: C.g800, outline: "none" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
};

/* ═══════════════════════════════════════════════════════════
   EXCEL PARSER
   ═══════════════════════════════════════════════════════════ */
function parseDirectorioCEBA(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                // Data starts at row 5 (index 4)
                const dataRows = rows.slice(4);
                const cebas = [];
                let current = null;

                for (let i = 0; i < dataRows.length; i++) {
                    const r = dataRows[i];
                    if (!r || r.length < 5) continue;

                    const nVal = r[0];
                    const isMainRow = nVal !== "" && nVal !== null && nVal !== undefined && Number.isInteger(Number(nVal)) && Number(nVal) > 0;

                    if (isMainRow) {
                        // Save previous CEBA
                        if (current) cebas.push(current);

                        const toNum = (v) => parseInt(v) || 0;
                        const toStr = (v) => (v != null ? String(v).trim() : "");
                        const toBool = (v) => { const s = toStr(v).toUpperCase(); return s === "SI" || s === "SÍ" || s === "S" || s === "X"; };

                        current = {
                            n: toNum(nVal),
                            codigoLocal: toStr(r[1]),
                            codigoModularInicialIntermedio: toStr(r[2]),
                            codigoModularAvanzado: toStr(r[3]),
                            nombre: toStr(r[4]),
                            tipoGestion: toStr(r[5]),
                            distrito: toStr(r[6]),
                            cargo: toStr(r[7]),
                            apellidoPaterno: toStr(r[8]),
                            apellidoMaterno: toStr(r[9]),
                            nombres: toStr(r[10]),
                            dni: toStr(r[11]),
                            correoInstitucional: toStr(r[12]),
                            correoPersonal: toStr(r[13]),
                            celular: toStr(r[14]),
                            direccion: toStr(r[15]),
                            cantidadPerifericos: toNum(r[16]),
                            presencial: toBool(r[22]),
                            semipresencial: toBool(r[23]),
                            aDistancia: toBool(r[24]),
                            cicloInicial: toBool(r[25]),
                            cicloIntermedio: toBool(r[26]),
                            cicloAvanzado: toBool(r[27]),
                            turnos: toStr(r[28]),
                            alumnosCenso: toNum(r[29]),
                            observaciones: toStr(r[30]),
                            alumnosInicial: toNum(r[31]),
                            alumnosIntermedio: toNum(r[32]),
                            alumnosAvanzado: toNum(r[33]),
                            docentesInicial: toNum(r[34]),
                            docentesIntermedio: toNum(r[35]),
                            docentesAvanzado: toNum(r[36]),
                            aulasInicial: toNum(r[37]),
                            aulasIntermedio: toNum(r[38]),
                            aulasAvanzado: toNum(r[39]),
                            adminNombrados: toNum(r[40]),
                            adminContratados: toNum(r[41]),
                            sedes: [],
                        };

                        // Add main row sede data
                        const sede = toStr(r[17]);
                        const dirSede = toStr(r[18]);
                        const formaAtencion = toStr(r[19]);
                        const dias = toStr(r[20]);
                        const horario = toStr(r[21]);
                        if (sede || dirSede || formaAtencion || dias || horario) {
                            current.sedes.push({ sede, direccion: dirSede, formaAtencion, dias, horario });
                        }
                    } else if (current) {
                        // Sub-row: additional sede/schedule data
                        const toStr = (v) => (v != null ? String(v).trim() : "");
                        const sede = toStr(r[17]);
                        const dirSede = toStr(r[18]);
                        const formaAtencion = toStr(r[19]);
                        const dias = toStr(r[20]);
                        const horario = toStr(r[21]);
                        if (sede || dirSede || formaAtencion || dias || horario) {
                            current.sedes.push({ sede, direccion: dirSede, formaAtencion, dias, horario });
                        }
                    }
                }
                // Push last CEBA
                if (current) cebas.push(current);

                resolve(cebas);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsArrayBuffer(file);
    });
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function DirectorioCEBA() {
    const [data, setData] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [distritoFilter, setDistritoFilter] = useState("todos");
    const [selectedCEBA, setSelectedCEBA] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const fileRef = useRef(null);
    const contentRef = useRef(null);

    // Persist to localStorage
    useEffect(() => {
        if (data.length > 0) {
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        }
    }, [data]);

    // Unique districts
    const distritos = useMemo(() => {
        const set = new Set(data.map(c => c.distrito).filter(Boolean));
        return [...set].sort();
    }, [data]);

    // Filtered data
    const filtered = useMemo(() => {
        let f = [...data];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            f = f.filter(c =>
                (c.nombre || "").toLowerCase().includes(term) ||
                (c.distrito || "").toLowerCase().includes(term) ||
                (`${c.apellidoPaterno} ${c.apellidoMaterno} ${c.nombres}`).toLowerCase().includes(term) ||
                (c.correoInstitucional || "").toLowerCase().includes(term)
            );
        }
        if (distritoFilter !== "todos") {
            f = f.filter(c => c.distrito === distritoFilter);
        }
        return f;
    }, [data, searchTerm, distritoFilter]);

    // KPIs
    const kpis = useMemo(() => {
        const totalCEBA = data.length;
        const totalEstudiantes = data.reduce((s, c) => s + (c.alumnosCenso || 0), 0);
        const totalDocentes = data.reduce((s, c) => s + (c.docentesInicial || 0) + (c.docentesIntermedio || 0) + (c.docentesAvanzado || 0), 0);
        const totalAulas = data.reduce((s, c) => s + (c.aulasInicial || 0) + (c.aulasIntermedio || 0) + (c.aulasAvanzado || 0), 0);
        const totalAdmin = data.reduce((s, c) => s + (c.adminNombrados || 0) + (c.adminContratados || 0), 0);
        const distritosUnicos = new Set(data.map(c => c.distrito).filter(Boolean)).size;
        return { totalCEBA, totalEstudiantes, totalDocentes, totalAulas, totalAdmin, distritosUnicos };
    }, [data]);

    // Chart data: students by CEBA (horizontal bar, descending)
    const barData = useMemo(() => {
        return [...data]
            .sort((a, b) => (b.alumnosCenso || 0) - (a.alumnosCenso || 0))
            .map(c => ({ nombre: c.nombre?.length > 25 ? c.nombre.substring(0, 25) + "..." : c.nombre, Estudiantes: c.alumnosCenso || 0 }));
    }, [data]);

    // Chart data: CEBAs by district (pie)
    const pieData = useMemo(() => {
        const map = {};
        data.forEach(c => { const d = c.distrito || "Otro"; map[d] = (map[d] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [data]);

    // Handle file upload
    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const parsed = await parseDirectorioCEBA(file);
            setData(parsed);
        } catch (err) {
            console.error("Error parsing Excel:", err);
            alert("Error al parsear el archivo Excel. Verifique el formato.");
        }
        setLoading(false);
        if (fileRef.current) fileRef.current.value = "";
    }, []);

    // Export PDF
    const handleExportPDF = useCallback(async () => {
        if (!contentRef.current) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(contentRef.current, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("landscape", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height) * 0.9;
            const w = canvas.width * ratio;
            const h = canvas.height * ratio;
            pdf.addImage(imgData, "PNG", (pdfWidth - w) / 2, 10, w, h);
            pdf.save("Directorio_CEBA_UGEL03.pdf");
        } catch (err) {
            console.error("Error exporting PDF:", err);
        }
        setExporting(false);
    }, []);

    // Full name of director
    const directorName = (c) => [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");

    /* ═══════════════════════════════════════════════════════
       EMPTY STATE
       ═══════════════════════════════════════════════════════ */
    if (data.length === 0 && !loading) {
        return (
            <div style={{ textAlign: "center", padding: 80 }}>
                {Icons.school(56, C.g300)}
                <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "20px 0 10px", fontFamily: "'DM Serif Display',serif" }}>
                    Directorio CEBA - UGEL 03
                </h3>
                <p style={{ color: C.g500, fontSize: "0.9rem", fontFamily: "'DM Sans'", maxWidth: 460, margin: "0 auto 24px" }}>
                    No hay datos de CEBA cargados. Suba el archivo Excel del Directorio CEBA para visualizar toda la informacion.
                </p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "12px 28px", fontSize: 14, margin: "0 auto" }}>
                    {Icons.upload(16, C.white)} Cargar Excel del Directorio CEBA
                </button>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════
       MAIN RENDER
       ═══════════════════════════════════════════════════════ */
    return (
        <div>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>
                        Directorio CEBA - UGEL 03
                    </h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>
                        Centros de Educacion Basica Alternativa · {kpis.totalCEBA} instituciones registradas
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={loading} style={{ ...S.btn(C.gold2, C.white, C.gold1), opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Procesando..." : <>{Icons.upload(14, C.white)} Cargar Excel</>}
                    </button>
                    <button onClick={handleExportPDF} disabled={exporting} style={{ ...S.btn(C.white, C.navy3, C.g200), opacity: exporting ? 0.6 : 1 }}>
                        {exporting ? "Exportando..." : <>{Icons.download(14, C.navy3)} Descargar PDF</>}
                    </button>
                </div>
            </div>

            {/* SEARCH & FILTER */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 300px", maxWidth: 400 }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{Icons.search(14, C.g400)}</div>
                    <input
                        placeholder="Buscar por nombre, distrito, director, correo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...S.input, width: "100%", paddingLeft: 34, boxSizing: "border-box" }}
                    />
                </div>
                <select value={distritoFilter} onChange={e => setDistritoFilter(e.target.value)} style={{ ...S.input, minWidth: 180 }}>
                    <option value="todos">Todos los distritos</option>
                    {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            {/* CONTENT REF FOR PDF EXPORT */}
            <div ref={contentRef}>
                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard icon={Icons.school(20, C.navy4)} label="Total CEBA" value={kpis.totalCEBA} sub="Instituciones registradas" border={C.navy4} />
                    <StatCard icon={Icons.users(20, C.green)} label="Total Estudiantes" value={kpis.totalEstudiantes.toLocaleString()} sub="Alumnos matriculados (censo)" border={C.green} />
                    <StatCard icon={Icons.book(20, C.indigo)} label="Total Docentes" value={kpis.totalDocentes.toLocaleString()} sub="Todos los ciclos" border={C.indigo} />
                    <StatCard icon={Icons.grid(20, C.amber)} label="Total Aulas" value={kpis.totalAulas.toLocaleString()} sub="Todos los ciclos" border={C.amber} />
                    <StatCard icon={Icons.briefcase(20, C.purple)} label="Personal Admin" value={kpis.totalAdmin.toLocaleString()} sub="Nombrados + Contratados" border={C.purple} />
                    <StatCard icon={Icons.mapPin(20, C.teal)} label="Distritos" value={kpis.distritosUnicos} sub="Distritos atendidos" border={C.teal} />
                </div>

                {/* CHARTS */}
                {data.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }} className="grid-calendar">
                        {/* Bar Chart: Students by CEBA */}
                        <div style={S.card}>
                            <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>
                                Estudiantes por CEBA
                            </h3>
                            <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 36)}>
                                <BarChart data={barData} layout="vertical" barSize={18} margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                    <XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                    <YAxis type="category" dataKey="nombre" width={180} tick={{ fill: C.g600, fontSize: 10, fontFamily: "'DM Sans'" }} />
                                    <Tooltip content={<CTip />} />
                                    <Bar dataKey="Estudiantes" fill={C.navy4} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie Chart: CEBAs by District */}
                        <div style={S.card}>
                            <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>
                                Distribucion por Distrito
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: C.g300 }}>
                                        {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CTip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* CARD GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
                    {filtered.map((ceba, idx) => {
                        const isEstatal = (ceba.tipoGestion || "").toUpperCase().includes("ESTATAL");
                        const totalDocentes = (ceba.docentesInicial || 0) + (ceba.docentesIntermedio || 0) + (ceba.docentesAvanzado || 0);
                        const totalAulas = (ceba.aulasInicial || 0) + (ceba.aulasIntermedio || 0) + (ceba.aulasAvanzado || 0);
                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedCEBA(ceba)}
                                style={{
                                    ...S.card,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    position: "relative",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.12)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06)"; }}
                            >
                                {/* Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Sans'", lineHeight: 1.3, flex: 1 }}>
                                        {ceba.nombre}
                                    </h4>
                                    <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap" }}>
                                        <span style={S.badge(
                                            isEstatal ? "#F0FDF4" : "#FFFBEB",
                                            isEstatal ? C.green : C.amber,
                                            isEstatal ? "#BBF7D0" : "#FDE68A"
                                        )}>
                                            {isEstatal ? "ESTATAL" : "CONVENIO"}
                                        </span>
                                        <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>
                                            {ceba.distrito}
                                        </span>
                                    </div>
                                </div>

                                {/* Director */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 6, background: C.navy3, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0, fontFamily: "'JetBrains Mono'" }}>
                                        {(ceba.nombres || "D")[0]}{(ceba.apellidoPaterno || "R")[0]}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.navy1, fontFamily: "'DM Sans'", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {directorName(ceba) || "Sin responsable"}
                                        </div>
                                        <div style={{ fontSize: "0.68rem", color: C.g500, fontFamily: "'DM Sans'" }}>{ceba.cargo || ""}</div>
                                    </div>
                                </div>

                                {/* Contact */}
                                {ceba.correoInstitucional && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginBottom: 4 }}>
                                        {Icons.mail(11, C.g400)}
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ceba.correoInstitucional}</span>
                                    </div>
                                )}
                                {ceba.celular && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginBottom: 4 }}>
                                        {Icons.phone(11, C.g400)}
                                        <span>{ceba.celular}</span>
                                    </div>
                                )}

                                {/* Address */}
                                {ceba.direccion && (
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginBottom: 12 }}>
                                        {Icons.mapPin(11, C.g400)}
                                        <span style={{ lineHeight: 1.3 }}>{ceba.direccion}</span>
                                    </div>
                                )}

                                {/* Mini Stats */}
                                <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${C.g100}`, paddingTop: 10 }}>
                                    {[
                                        { label: "Estudiantes", value: ceba.alumnosCenso || 0, color: C.green },
                                        { label: "Docentes", value: totalDocentes, color: C.indigo },
                                        { label: "Aulas", value: totalAulas, color: C.amber },
                                        { label: "Perifericos", value: ceba.cantidadPerifericos || 0, color: C.teal },
                                    ].map((st, i) => (
                                        <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 3 ? `1px solid ${C.g100}` : "none" }}>
                                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1rem", fontWeight: 700, color: st.color }}>{st.value}</div>
                                            <div style={{ fontSize: "0.58rem", color: C.g500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'DM Sans'" }}>{st.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filtered.length === 0 && data.length > 0 && (
                    <div style={{ textAlign: "center", padding: 48, color: C.g400, fontSize: "0.9rem", fontFamily: "'DM Sans'" }}>
                        No se encontraron resultados con los filtros aplicados.
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════
               DETAIL MODAL
               ═══════════════════════════════════════════════════ */}
            {selectedCEBA && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease" }}
                    onClick={() => setSelectedCEBA(null)}
                >
                    <div
                        style={{ ...S.card, padding: 0, width: "100%", maxWidth: 780, maxHeight: "88vh", overflowY: "auto", animation: "fadeIn 0.2s ease" }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: "24px 28px 18px", borderBottom: `2px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, position: "sticky", top: 0, background: C.white, zIndex: 2, borderRadius: "10px 10px 0 0" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                    <span style={S.badge(
                                        (selectedCEBA.tipoGestion || "").toUpperCase().includes("ESTATAL") ? "#F0FDF4" : "#FFFBEB",
                                        (selectedCEBA.tipoGestion || "").toUpperCase().includes("ESTATAL") ? C.green : C.amber,
                                        (selectedCEBA.tipoGestion || "").toUpperCase().includes("ESTATAL") ? "#BBF7D0" : "#FDE68A"
                                    )}>
                                        {(selectedCEBA.tipoGestion || "").toUpperCase().includes("ESTATAL") ? "ESTATAL" : "CONVENIO"}
                                    </span>
                                    <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>{selectedCEBA.distrito}</span>
                                </div>
                                <h2 style={{ fontSize: "1.3rem", fontFamily: "'DM Serif Display',serif", color: C.navy1, margin: 0 }}>
                                    {selectedCEBA.nombre}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedCEBA(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.g400, padding: 4 }}>
                                {Icons.x(22, C.g400)}
                            </button>
                        </div>

                        <div style={{ padding: "20px 28px 28px" }}>
                            {/* Section 1: Datos Institucionales */}
                            <SectionTitle>Datos Institucionales</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                                <FieldRow label="Codigo de Local" value={selectedCEBA.codigoLocal} />
                                <FieldRow label="Cod. Modular Inicial-Intermedio" value={selectedCEBA.codigoModularInicialIntermedio} />
                                <FieldRow label="Cod. Modular Avanzado" value={selectedCEBA.codigoModularAvanzado} />
                                <FieldRow label="Tipo de Gestion" value={selectedCEBA.tipoGestion} />
                                <FieldRow label="Distrito" value={selectedCEBA.distrito} />
                                <FieldRow label="Direccion" value={selectedCEBA.direccion} span />
                            </div>

                            {/* Section 2: Responsable */}
                            <SectionTitle>Responsable</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                                <FieldRow label="Cargo" value={selectedCEBA.cargo} />
                                <FieldRow label="Nombre Completo" value={directorName(selectedCEBA)} />
                                <FieldRow label="DNI" value={selectedCEBA.dni} mono />
                                <FieldRow label="Correo Institucional" value={selectedCEBA.correoInstitucional} />
                                <FieldRow label="Correo Personal" value={selectedCEBA.correoPersonal} />
                                <FieldRow label="Celular" value={selectedCEBA.celular} mono />
                            </div>

                            {/* Section 3: Modalidades y Ciclos */}
                            <SectionTitle>Modalidades y Ciclos</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 24 }}>
                                <BoolBadge label="Presencial" value={selectedCEBA.presencial} />
                                <BoolBadge label="Semipresencial" value={selectedCEBA.semipresencial} />
                                <BoolBadge label="A Distancia" value={selectedCEBA.aDistancia} />
                                <BoolBadge label="Ciclo Inicial" value={selectedCEBA.cicloInicial} />
                                <BoolBadge label="Ciclo Intermedio" value={selectedCEBA.cicloIntermedio} />
                                <BoolBadge label="Ciclo Avanzado" value={selectedCEBA.cicloAvanzado} />
                            </div>
                            {selectedCEBA.turnos && (
                                <div style={{ marginBottom: 24 }}>
                                    <FieldRow label="Turnos" value={selectedCEBA.turnos} />
                                </div>
                            )}

                            {/* Section 4: Sedes y Horarios */}
                            {selectedCEBA.sedes && selectedCEBA.sedes.length > 0 && (
                                <>
                                    <SectionTitle>Sedes y Horarios</SectionTitle>
                                    <div style={{ overflowX: "auto", marginBottom: 24 }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", fontFamily: "'DM Sans'" }}>
                                            <thead>
                                                <tr style={{ background: C.g50, borderBottom: `2px solid ${C.g200}` }}>
                                                    {["Sede", "Direccion", "Forma de Atencion", "Dias", "Horario"].map(h => (
                                                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedCEBA.sedes.map((sede, i) => (
                                                    <tr key={i} style={{ borderBottom: `1px solid ${C.g100}` }}>
                                                        <td style={{ padding: "10px 12px", color: C.navy1, fontWeight: 600, whiteSpace: "nowrap" }}>{sede.sede || "-"}</td>
                                                        <td style={{ padding: "10px 12px", color: C.g700 }}>{sede.direccion || "-"}</td>
                                                        <td style={{ padding: "10px 12px", color: C.g700 }}>{sede.formaAtencion || "-"}</td>
                                                        <td style={{ padding: "10px 12px", color: C.g700 }}>{sede.dias || "-"}</td>
                                                        <td style={{ padding: "10px 12px", color: C.g700, fontFamily: "'JetBrains Mono'", fontSize: "0.75rem" }}>{sede.horario || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {/* Section 5: Datos Estadisticos */}
                            <SectionTitle>Datos Estadisticos</SectionTitle>
                            <div style={{ overflowX: "auto", marginBottom: 24 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", fontFamily: "'DM Sans'" }}>
                                    <thead>
                                        <tr style={{ background: C.g50, borderBottom: `2px solid ${C.g200}` }}>
                                            {["Concepto", "Inicial", "Intermedio", "Avanzado", "Total"].map(h => (
                                                <th key={h} style={{ padding: "10px 14px", textAlign: h === "Concepto" ? "left" : "center", color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: "Alumnos", ini: selectedCEBA.alumnosInicial, inter: selectedCEBA.alumnosIntermedio, ava: selectedCEBA.alumnosAvanzado },
                                            { label: "Docentes", ini: selectedCEBA.docentesInicial, inter: selectedCEBA.docentesIntermedio, ava: selectedCEBA.docentesAvanzado },
                                            { label: "Aulas", ini: selectedCEBA.aulasInicial, inter: selectedCEBA.aulasIntermedio, ava: selectedCEBA.aulasAvanzado },
                                        ].map((row, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${C.g100}` }}>
                                                <td style={{ padding: "10px 14px", fontWeight: 600, color: C.navy1 }}>{row.label}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 600, color: C.g700 }}>{row.ini || 0}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 600, color: C.g700 }}>{row.inter || 0}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 600, color: C.g700 }}>{row.ava || 0}</td>
                                                <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.navy4 }}>{(row.ini || 0) + (row.inter || 0) + (row.ava || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Section 6: Personal Administrativo */}
                            <SectionTitle>Personal Administrativo</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.navy4 }}>{selectedCEBA.adminNombrados || 0}</div>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" }}>Nombrados</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.amber }}>{selectedCEBA.adminContratados || 0}</div>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" }}>Contratados</div>
                                </div>
                            </div>

                            {/* Section 7: Observaciones */}
                            {selectedCEBA.observaciones && (
                                <>
                                    <SectionTitle>Observaciones</SectionTitle>
                                    <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px", fontSize: "0.82rem", color: C.g700, lineHeight: 1.6, fontFamily: "'DM Sans'" }}>
                                        {selectedCEBA.observaciones}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function SectionTitle({ children }) {
    return (
        <div style={{
            fontSize: "0.78rem", fontWeight: 700, color: C.navy1, textTransform: "uppercase",
            letterSpacing: "0.06em", paddingBottom: 10, marginBottom: 14,
            borderBottom: `2px solid ${C.g100}`, fontFamily: "'DM Sans'",
            display: "flex", alignItems: "center", gap: 8
        }}>
            {children}
        </div>
    );
}

function FieldRow({ label, value, mono, span }) {
    return (
        <div style={span ? { gridColumn: "1 / -1" } : {}}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, fontFamily: "'DM Sans'" }}>{label}</div>
            <div style={{ fontSize: "0.82rem", color: value ? C.g800 : C.g400, fontFamily: mono ? "'JetBrains Mono'" : "'DM Sans'", fontWeight: value ? 500 : 400 }}>
                {value || "—"}
            </div>
        </div>
    );
}

function BoolBadge({ label, value }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 12px", borderRadius: 6,
            background: value ? "#F0FDF4" : C.g50,
            border: `1px solid ${value ? "#BBF7D0" : C.g200}`,
        }}>
            <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: `2px solid ${value ? C.green : C.g300}`,
                background: value ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                {value && <span style={{ color: C.white, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>&#10003;</span>}
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: value ? C.green : C.g500, fontFamily: "'DM Sans'" }}>{label}</span>
        </div>
    );
}
