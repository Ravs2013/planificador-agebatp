import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const C = {
    navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
    gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
    g900: "#0F172A", g800: "#1E293B", g700: "#334155", g600: "#475569",
    g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
    g100: "#F1F5F9", g50: "#F8FAFC", bg: "#F5F6FA",
    red: "#B91C1C", amber: "#B45309", green: "#15803D",
    white: "#FFFFFF", indigo: "#4338CA", teal: "#0F766E", purple: "#7C3AED",
};
const PIE_COLORS = [C.navy4, C.navy5, C.gold2, C.green, C.red, C.indigo, C.teal, C.purple, C.amber];
const LS_KEY = "agebatp_directorio_cetpro";

const SvgIcon = ({ children, size = 20, color = C.g500, style: s, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...s }} {...props}>{children}</svg>
);
const Ic = {
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
    clock: (sz, cl) => <SvgIcon size={sz} color={cl}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SvgIcon>,
    barChart: (sz, cl) => <SvgIcon size={sz} color={cl}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></SvgIcon>,
};

function CTip({ active, payload, label }) {
    if (!active || !payload) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'" }}>
            <p style={{ color: C.g600, fontSize: "0.78rem", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill, fontSize: "0.8rem", margin: "2px 0", fontWeight: 600 }}>{p.name}: <span style={{ fontFamily: "'JetBrains Mono'" }}>{p.value}</span></p>)}
        </div>
    );
}

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

const S = {
    card: { background: C.white, border: `1px solid ${C.g200}`, borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.06)" },
    badge: (bg, color, border) => ({ fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: bg, color, border: `1px solid ${border || color + "30"}`, letterSpacing: 0.3, fontFamily: "'JetBrains Mono'" }),
    input: { padding: "9px 14px", borderRadius: 6, border: "1px solid #D6DCE8", fontFamily: "'DM Sans'", fontSize: 13, background: C.white, color: C.g800, outline: "none" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
};

function parseLines(text) {
    if (!text) return [];
    return String(text).split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
}

function parseDirectorioCETPRO(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                const dataRows = rows.slice(4);
                const cetpros = [];
                const toStr = (v) => (v != null ? String(v).trim() : "");
                const toNum = (v) => parseInt(v) || 0;

                for (let i = 0; i < dataRows.length; i++) {
                    const r = dataRows[i];
                    if (!r || r.length < 5) continue;
                    const nVal = r[0];
                    if (nVal === "" || nVal === null || nVal === undefined || !Number.isInteger(Number(nVal)) || Number(nVal) <= 0) continue;

                    cetpros.push({
                        n: toNum(nVal),
                        codigoLocal: toStr(r[1]),
                        codigoModular: toStr(r[2]),
                        nombre: toStr(r[3]),
                        tipoGestion: toStr(r[4]),
                        distrito: toStr(r[5]),
                        cargo: toStr(r[6]),
                        apellidoPaterno: toStr(r[7]),
                        apellidoMaterno: toStr(r[8]),
                        nombres: toStr(r[9]),
                        dni: toStr(r[10]),
                        correoInstitucional: toStr(r[11]),
                        correoPersonal: toStr(r[12]),
                        celular: toStr(r[13]),
                        telefonoInstitucional: toStr(r[14]),
                        direccion: toStr(r[15]),
                        turnos: toStr(r[16]),
                        horarioInicio: toStr(r[17]),
                        horarioTermino: toStr(r[18]),
                        permanenciaDirectivo: toStr(r[19]),
                        ofertaFormativaRaw: toStr(r[20]),
                        ofertaFormativa: parseLines(r[20]),
                        familiasProductivasRaw: toStr(r[21]),
                        familiasProductivas: parseLines(r[21]),
                        formacionContinuaRaw: toStr(r[22]),
                        formacionContinua: parseLines(r[22]),
                        alumnosCenso: toNum(r[23]),
                        docentesCenso: toNum(r[24]),
                        talleresCenso: toNum(r[25]),
                        adminNombrados: toNum(r[26]),
                        adminContratados: toNum(r[27]),
                        observaciones: toStr(r[28]),
                    });
                }
                resolve(cetpros);
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsArrayBuffer(file);
    });
}

function gestionBadgeStyle(tipo) {
    const t = (tipo || "").toUpperCase();
    if (t.includes("PARROQUIAL")) return S.badge("#EEF2FF", C.indigo, "#C7D2FE");
    if (t.includes("CONVENIO")) return S.badge("#FFFBEB", C.amber, "#FDE68A");
    return S.badge("#F0FDF4", C.green, "#BBF7D0");
}
function gestionLabel(tipo) {
    const t = (tipo || "").toUpperCase();
    if (t.includes("PARROQUIAL")) return "PARROQUIAL";
    if (t.includes("CONVENIO")) return "CONVENIO";
    return "ESTATAL";
}

function generatePDF(filtered, kpis) {
    const pdf = new jsPDF("portrait", "mm", "a4");
    const W = 210, H = 297, MX = 14, MY = 14;
    const pw = W - 2 * MX;
    let y = MY;
    const totalPages = [];
    let pageNum = 1;

    const addFooter = () => { totalPages.push(pageNum); };
    const checkPage = (need) => { if (y + need > H - MY - 8) { addFooter(); pdf.addPage(); pageNum++; y = MY; } };

    // Header
    pdf.setFontSize(16); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
    pdf.text("Directorio CETPRO - UGEL 03", MX, y + 6); y += 10;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139);
    pdf.text(`Centros de Educacion Tecnico Productiva | Generado: ${new Date().toLocaleDateString("es-PE")}`, MX, y + 4); y += 10;

    // KPI row
    pdf.setFillColor(241, 245, 249); pdf.roundedRect(MX, y, pw, 14, 2, 2, "F");
    pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 77, 123);
    const kpiItems = [
        `CETPRO: ${kpis.total}`, `Estudiantes: ${kpis.totalEstudiantes.toLocaleString()}`,
        `Docentes: ${kpis.totalDocentes}`, `Talleres: ${kpis.totalTalleres}`,
        `Admin: ${kpis.totalAdmin}`, `Distritos: ${kpis.distritosUnicos}`
    ];
    const kpiW = pw / kpiItems.length;
    kpiItems.forEach((t, i) => { pdf.text(t, MX + i * kpiW + kpiW / 2, y + 9, { align: "center" }); });
    y += 20;

    // CETPROs
    filtered.forEach((c, idx) => {
        checkPage(50);
        // Name bar
        pdf.setFillColor(27, 58, 92); pdf.roundedRect(MX, y, pw, 8, 1, 1, "F");
        pdf.setFontSize(10); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
        pdf.text(`${idx + 1}. ${c.nombre}`, MX + 3, y + 5.5);
        const gLabel = gestionLabel(c.tipoGestion);
        pdf.setFontSize(7); pdf.text(`${gLabel} | ${c.distrito}`, MX + pw - 3, y + 5.5, { align: "right" });
        y += 11;

        // Director & contact
        pdf.setFontSize(8.5); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
        const fullName = [c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ") + (c.nombres ? ", " + c.nombres : "");
        pdf.text(`${c.cargo || "Director"}: ${fullName}`, MX + 2, y + 3);
        y += 5;

        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
        const contactLine = [c.correoInstitucional, c.celular, c.direccion].filter(Boolean).join(" | ");
        if (contactLine) { const lines = pdf.splitTextToSize(contactLine, pw - 4); pdf.text(lines, MX + 2, y + 3); y += lines.length * 3.5 + 1; }

        // Stats line
        pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(21, 128, 61);
        pdf.text(`Alumnos: ${c.alumnosCenso}`, MX + 2, y + 3);
        pdf.setTextColor(15, 118, 110); pdf.text(`Docentes: ${c.docentesCenso}`, MX + 45, y + 3);
        pdf.setTextColor(67, 56, 202); pdf.text(`Talleres: ${c.talleresCenso}`, MX + 85, y + 3);
        pdf.setTextColor(100, 116, 139); pdf.setFont("helvetica", "normal");
        pdf.text(`Turnos: ${c.turnos || "-"}`, MX + 120, y + 3);
        y += 5;

        // Oferta formativa (abbreviated)
        if (c.ofertaFormativa.length > 0) {
            checkPage(12);
            pdf.setFontSize(7.5); pdf.setFont("helvetica", "italic"); pdf.setTextColor(100, 116, 139);
            const shown = c.ofertaFormativa.slice(0, 4).join(", ");
            const extra = c.ofertaFormativa.length > 4 ? ` ...y ${c.ofertaFormativa.length - 4} mas` : "";
            const ofLines = pdf.splitTextToSize(`Oferta: ${shown}${extra}`, pw - 4);
            pdf.text(ofLines, MX + 2, y + 3);
            y += ofLines.length * 3 + 1;
        }

        // Separator
        pdf.setDrawColor(226, 232, 240); pdf.line(MX, y + 1, MX + pw, y + 1);
        y += 5;
    });

    addFooter();
    // Page numbers
    const total = pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(148, 163, 184);
        pdf.text(`Pagina ${i} de ${total}`, W / 2, H - 6, { align: "center" });
    }

    const today = new Date().toISOString().split("T")[0];
    pdf.save(`Directorio_CETPRO_UGEL03_${today}.pdf`);
}

export default function DirectorioCETPRO() {
    const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } });
    const [searchTerm, setSearchTerm] = useState("");
    const [distritoFilter, setDistritoFilter] = useState("todos");
    const [gestionFilter, setGestionFilter] = useState("todos");
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => { if (data.length > 0) localStorage.setItem(LS_KEY, JSON.stringify(data)); }, [data]);

    const distritos = useMemo(() => [...new Set(data.map(c => c.distrito).filter(Boolean))].sort(), [data]);
    const gestionTypes = useMemo(() => [...new Set(data.map(c => gestionLabel(c.tipoGestion)))].sort(), [data]);

    const filtered = useMemo(() => {
        let f = [...data];
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            f = f.filter(c =>
                (c.nombre || "").toLowerCase().includes(t) ||
                (c.distrito || "").toLowerCase().includes(t) ||
                `${c.apellidoPaterno} ${c.apellidoMaterno} ${c.nombres}`.toLowerCase().includes(t) ||
                (c.correoInstitucional || "").toLowerCase().includes(t) ||
                (c.ofertaFormativaRaw || "").toLowerCase().includes(t)
            );
        }
        if (distritoFilter !== "todos") f = f.filter(c => c.distrito === distritoFilter);
        if (gestionFilter !== "todos") f = f.filter(c => gestionLabel(c.tipoGestion) === gestionFilter);
        return f;
    }, [data, searchTerm, distritoFilter, gestionFilter]);

    const kpis = useMemo(() => ({
        total: data.length,
        totalEstudiantes: data.reduce((s, c) => s + (c.alumnosCenso || 0), 0),
        totalDocentes: data.reduce((s, c) => s + (c.docentesCenso || 0), 0),
        totalTalleres: data.reduce((s, c) => s + (c.talleresCenso || 0), 0),
        totalAdmin: data.reduce((s, c) => s + (c.adminNombrados || 0) + (c.adminContratados || 0), 0),
        distritosUnicos: new Set(data.map(c => c.distrito).filter(Boolean)).size,
    }), [data]);

    const barData = useMemo(() =>
        [...data].sort((a, b) => (b.alumnosCenso || 0) - (a.alumnosCenso || 0))
            .map(c => ({ nombre: c.nombre?.length > 28 ? c.nombre.substring(0, 28) + "..." : c.nombre, Estudiantes: c.alumnosCenso || 0 })),
    [data]);

    const pieData = useMemo(() => {
        const m = {}; data.forEach(c => { const d = c.distrito || "Otro"; m[d] = (m[d] || 0) + 1; });
        return Object.entries(m).map(([name, value]) => ({ name, value }));
    }, [data]);

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setLoading(true);
        try { setData(await parseDirectorioCETPRO(file)); } catch (err) { console.error(err); alert("Error al parsear el archivo Excel."); }
        setLoading(false); if (fileRef.current) fileRef.current.value = "";
    }, []);

    const handleExportPDF = useCallback(() => {
        setExporting(true);
        try { generatePDF(filtered, kpis); } catch (err) { console.error(err); }
        setExporting(false);
    }, [filtered, kpis]);

    const dirName = (c) => {
        const ap = [c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");
        return ap ? `${ap}, ${c.nombres || ""}`.trim() : (c.nombres || "Sin responsable");
    };

    // EMPTY STATE
    if (data.length === 0 && !loading) {
        return (
            <div style={{ textAlign: "center", padding: 80 }}>
                {Ic.school(56, C.g300)}
                <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "20px 0 10px", fontFamily: "'DM Serif Display',serif" }}>Directorio CETPRO - UGEL 03</h3>
                <p style={{ color: C.g500, fontSize: "0.9rem", fontFamily: "'DM Sans'", maxWidth: 460, margin: "0 auto 24px" }}>No hay datos de CETPRO cargados. Suba el archivo Excel del directorio CETPRO.</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "12px 28px", fontSize: 14, margin: "0 auto" }}>{Ic.upload(16, C.white)} Cargar Excel del Directorio CETPRO</button>
            </div>
        );
    }

    return (
        <div>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Directorio CETPRO - UGEL 03</h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>Centros de Educacion Tecnico Productiva · {kpis.total} instituciones registradas</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={loading} style={{ ...S.btn(C.gold2, C.white, C.gold1), opacity: loading ? 0.7 : 1 }}>{loading ? "Procesando..." : <>{Ic.upload(14, C.white)} Cargar Excel</>}</button>
                    <button onClick={handleExportPDF} disabled={exporting} style={{ ...S.btn(C.white, C.navy3, C.g200), opacity: exporting ? 0.6 : 1 }}>{exporting ? "Exportando..." : <>{Ic.download(14, C.navy3)} Descargar PDF</>}</button>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 400 }}>
                    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{Ic.search(14, C.g400)}</div>
                    <input placeholder="Buscar por nombre, distrito, director, correo, oferta..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...S.input, width: "100%", paddingLeft: 34, boxSizing: "border-box" }} />
                </div>
                <select value={distritoFilter} onChange={e => setDistritoFilter(e.target.value)} style={{ ...S.input, minWidth: 170 }}>
                    <option value="todos">Todos los distritos</option>
                    {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={gestionFilter} onChange={e => setGestionFilter(e.target.value)} style={{ ...S.input, minWidth: 150 }}>
                    <option value="todos">Toda gestion</option>
                    {gestionTypes.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard icon={Ic.school(20, C.navy4)} label="Total CETPRO" value={kpis.total} sub="Instituciones registradas" border={C.navy4} />
                <StatCard icon={Ic.users(20, C.green)} label="Total Estudiantes" value={kpis.totalEstudiantes.toLocaleString()} sub="Alumnos censo" border={C.green} />
                <StatCard icon={Ic.book(20, C.teal)} label="Total Docentes" value={kpis.totalDocentes.toLocaleString()} sub="Docentes censo" border={C.teal} />
                <StatCard icon={Ic.grid(20, C.indigo)} label="Total Talleres" value={kpis.totalTalleres.toLocaleString()} sub="Talleres censo" border={C.indigo} />
                <StatCard icon={Ic.briefcase(20, C.purple)} label="Personal Admin" value={kpis.totalAdmin.toLocaleString()} sub="Nombrados + Contratados" border={C.purple} />
                <StatCard icon={Ic.mapPin(20, C.amber)} label="Distritos" value={kpis.distritosUnicos} sub="Distritos atendidos" border={C.amber} />
            </div>

            {/* CHARTS */}
            {data.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }} className="grid-calendar">
                    <div style={S.card}>
                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>Estudiantes por CETPRO</h3>
                        <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 32)}>
                            <BarChart data={barData} layout="vertical" barSize={16} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><YAxis type="category" dataKey="nombre" width={190} tick={{ fill: C.g600, fontSize: 9.5, fontFamily: "'DM Sans'" }} /><Tooltip content={<CTip />} /><Bar dataKey="Estudiantes" fill={C.navy4} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={S.card}>
                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" }}>Distribucion por Distrito</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: C.g300 }}>{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip content={<CTip />} /></PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* CARD GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
                {filtered.map((c, idx) => (
                    <div key={idx} onClick={() => setSelectedItem(c)} style={{ ...S.card, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.12)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06)"; }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Sans'", lineHeight: 1.3, flex: 1 }}>{c.nombre}</h4>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap" }}>
                                <span style={gestionBadgeStyle(c.tipoGestion)}>{gestionLabel(c.tipoGestion)}</span>
                                <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>{c.distrito}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 6, background: C.navy3, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0, fontFamily: "'JetBrains Mono'" }}>{(c.nombres || "D")[0]}{(c.apellidoPaterno || "R")[0]}</div>
                            <div><div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.navy1, fontFamily: "'DM Sans'" }}>{dirName(c)}</div><div style={{ fontSize: "0.68rem", color: C.g500 }}>{c.cargo}</div></div>
                        </div>
                        {c.correoInstitucional && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, marginBottom: 4 }}>{Ic.mail(11, C.g400)}<span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.correoInstitucional}</span></div>}
                        {c.celular && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, marginBottom: 4 }}>{Ic.phone(11, C.g400)}<span>{c.celular}</span></div>}
                        {c.direccion && <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.72rem", color: C.g500, marginBottom: 4 }}>{Ic.mapPin(11, C.g400)}<span style={{ lineHeight: 1.3 }}>{c.direccion}</span></div>}
                        {c.turnos && <div style={{ fontSize: "0.68rem", color: C.g400, marginBottom: 8 }}>Turnos: {c.turnos}</div>}
                        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${C.g100}`, paddingTop: 10 }}>
                            {[{ label: "Estudiantes", value: c.alumnosCenso || 0, color: C.green }, { label: "Docentes", value: c.docentesCenso || 0, color: C.teal }, { label: "Talleres", value: c.talleresCenso || 0, color: C.indigo }].map((st, i) => (
                                <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${C.g100}` : "none" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1rem", fontWeight: 700, color: st.color }}>{st.value}</div>
                                    <div style={{ fontSize: "0.58rem", color: C.g500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{st.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && data.length > 0 && <div style={{ textAlign: "center", padding: 48, color: C.g400, fontSize: "0.9rem" }}>No se encontraron resultados con los filtros aplicados.</div>}

            {/* DETAIL MODAL */}
            {selectedItem && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease" }} onClick={() => setSelectedItem(null)}>
                    <div style={{ ...S.card, padding: 0, width: "100%", maxWidth: 780, maxHeight: "88vh", overflowY: "auto", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{ padding: "24px 28px 18px", borderBottom: `2px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, position: "sticky", top: 0, background: C.white, zIndex: 2, borderRadius: "10px 10px 0 0" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                    <span style={gestionBadgeStyle(selectedItem.tipoGestion)}>{gestionLabel(selectedItem.tipoGestion)}</span>
                                    <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>{selectedItem.distrito}</span>
                                </div>
                                <h2 style={{ fontSize: "1.3rem", fontFamily: "'DM Serif Display',serif", color: C.navy1, margin: 0 }}>{selectedItem.nombre}</h2>
                            </div>
                            <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.g400, padding: 4 }}>{Ic.x(22, C.g400)}</button>
                        </div>

                        <div style={{ padding: "20px 28px 28px" }}>
                            {/* S1 Datos Institucionales */}
                            <SecTitle>Datos Institucionales</SecTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                                <Field label="Codigo de Local" value={selectedItem.codigoLocal} mono />
                                <Field label="Codigo Modular" value={selectedItem.codigoModular} mono />
                                <Field label="Tipo de Gestion" value={selectedItem.tipoGestion} />
                                <Field label="Distrito" value={selectedItem.distrito} />
                                <Field label="Direccion" value={selectedItem.direccion} span />
                            </div>

                            {/* S2 Responsable */}
                            <SecTitle>Responsable</SecTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                                <Field label="Cargo" value={selectedItem.cargo} />
                                <Field label="Nombre Completo" value={dirName(selectedItem)} />
                                <Field label="DNI" value={selectedItem.dni} mono />
                                <Field label="Correo Institucional" value={selectedItem.correoInstitucional} />
                                <Field label="Correo Personal" value={selectedItem.correoPersonal} />
                                <Field label="Celular Personal" value={selectedItem.celular} mono />
                                <Field label="Telefono Institucional" value={selectedItem.telefonoInstitucional} mono />
                            </div>

                            {/* S3 Horarios */}
                            <SecTitle>Horarios</SecTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                                <Field label="Turnos" value={selectedItem.turnos} />
                                <Field label="Horario Inicio" value={selectedItem.horarioInicio} />
                                <Field label="Horario Termino" value={selectedItem.horarioTermino} />
                                <Field label="Permanencia del Directivo" value={selectedItem.permanenciaDirectivo} span />
                            </div>

                            {/* S4 Oferta Formativa */}
                            <SecTitle>Oferta Formativa</SecTitle>
                            {selectedItem.ofertaFormativa.length > 0 ? (
                                <div style={{ background: `${C.navy4}08`, border: `1px solid ${C.navy4}20`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.navy4, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Programas de Estudio</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {selectedItem.ofertaFormativa.map((p, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: C.g700, fontFamily: "'DM Sans'", padding: "4px 10px", background: C.white, border: `1px solid ${C.g200}`, borderRadius: 5 }}>
                                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.navy4, flexShrink: 0 }} />{p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : <p style={{ color: C.g400, fontSize: "0.82rem", marginBottom: 16 }}>Sin oferta formativa registrada.</p>}

                            {selectedItem.familiasProductivas.length > 0 && (
                                <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}20`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Familias Productivas</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {selectedItem.familiasProductivas.map((p, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: C.g700, padding: "4px 10px", background: C.white, border: `1px solid ${C.g200}`, borderRadius: 5 }}>
                                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.teal, flexShrink: 0 }} />{p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedItem.formacionContinua.length > 0 && (
                                <div style={{ background: `${C.gold2}08`, border: `1px solid ${C.gold2}20`, borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gold1, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Formacion Continua / OO</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {selectedItem.formacionContinua.map((p, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: C.g700, padding: "4px 10px", background: C.white, border: `1px solid ${C.g200}`, borderRadius: 5 }}>
                                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold2, flexShrink: 0 }} />{p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* S5 Estadisticas */}
                            <SecTitle>Datos Estadisticos</SecTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                                <BigStat label="Alumnos" value={selectedItem.alumnosCenso || 0} color={C.green} />
                                <BigStat label="Docentes" value={selectedItem.docentesCenso || 0} color={C.teal} />
                                <BigStat label="Talleres" value={selectedItem.talleresCenso || 0} color={C.indigo} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.navy4 }}>{selectedItem.adminNombrados || 0}</div>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombrados</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.amber }}>{selectedItem.adminContratados || 0}</div>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contratados</div>
                                </div>
                            </div>

                            {/* S6 Observaciones */}
                            {selectedItem.observaciones && (
                                <><SecTitle>Observaciones</SecTitle>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "14px 18px", fontSize: "0.82rem", color: C.g600, lineHeight: 1.6, fontFamily: "'DM Sans'" }}>{selectedItem.observaciones}</div></>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SecTitle({ children }) {
    return <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy1, textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 10, marginBottom: 14, borderBottom: `2px solid ${C.g100}`, fontFamily: "'DM Sans'", display: "flex", alignItems: "center", gap: 8 }}>{children}</div>;
}
function Field({ label, value, mono, span }) {
    return <div style={span ? { gridColumn: "1 / -1" } : {}}><div style={{ fontSize: "0.65rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div><div style={{ fontSize: "0.82rem", color: value ? C.g800 : C.g400, fontFamily: mono ? "'JetBrains Mono'" : "'DM Sans'", fontWeight: value ? 500 : 400 }}>{value || "\u2014"}</div></div>;
}
function BigStat({ label, value, color }) {
    return <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8, padding: "18px", textAlign: "center" }}><div style={{ fontFamily: "'JetBrains Mono'", fontSize: "2rem", fontWeight: 700, color }}>{value}</div><div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div></div>;
}
