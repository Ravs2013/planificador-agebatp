import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { subscribeDirectorioCetpro, addCetpro, updateCetpro, deleteCetpro, batchSetCetpros } from "../firebase/db";
import { useAuth } from "../context/AuthContext";

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

function splitName(fullName) {
    let apellidoPaterno = "";
    let apellidoMaterno = "";
    let nombres = "";
    if (!fullName) return { apellidoPaterno, apellidoMaterno, nombres };
    const parts = fullName.trim().split(",");
    if (parts.length > 1) {
        nombres = parts[1].trim();
        const lastParts = parts[0].trim().split(/\s+/);
        apellidoPaterno = lastParts[0] || "";
        apellidoMaterno = lastParts.slice(1).join(" ") || "";
    } else {
        const wordParts = fullName.trim().split(/\s+/);
        if (wordParts.length >= 3) {
            apellidoPaterno = wordParts[0];
            apellidoMaterno = wordParts[1];
            nombres = wordParts.slice(2).join(" ");
        } else if (wordParts.length === 2) {
            apellidoPaterno = wordParts[0];
            nombres = wordParts[1];
        } else {
            nombres = fullName;
        }
    }
    return { apellidoPaterno, apellidoMaterno, nombres };
}

function parseDirectorioCETPRO(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const isMega = wb.SheetNames.includes("PORTADA") || wb.SheetNames.some(name => /^\d+_/i.test(name));

                if (isMega) {
                    const cetpros = [];
                    const sheetNames = wb.SheetNames.filter(name => 
                        !["PORTADA", "RESUMEN GENERAL", "GUÍA DE INCLUSIÓN", "CATÁLOGO DE PROGRAMAS"].includes(name.toUpperCase().trim())
                    );

                    sheetNames.forEach(sheetName => {
                        const ws = wb.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                        if (rows.length < 15) return;

                        const val = (r, c) => (rows[r] && rows[r][c] !== undefined ? String(rows[r][c]).trim() : "");
                        const valNum = (r, c) => parseInt(rows[r] && rows[r][c]) || 0;

                        const rawName = val(0, 0);
                        const cleanName = rawName.trim();
                        const fullName = val(6, 3);
                        const nameParts = splitName(fullName);

                        // Parse programs
                        const programas = [];
                        let r = 34;
                        while (r < rows.length) {
                            const check = val(r, 0);
                            if (check.includes("TOTALES DEL CETPRO") || !val(r, 1)) break;
                            programas.push(val(r, 1));
                            r++;
                        }

                        // Parse courses
                        let fcStart = -1;
                        for (let i = 40; i < rows.length; i++) {
                            if (val(i, 0).includes("FORMACIÓN CONTINUA")) {
                                fcStart = i + 2; // skip header
                                break;
                            }
                        }
                        const cursos = [];
                        if (fcStart !== -1) {
                            let idx = fcStart;
                            while (idx < rows.length) {
                                const check = val(idx, 0);
                                if (check.includes("5.  OBSERVACIONES") || !val(idx, 1)) break;
                                select:
                                cursos.push(val(idx, 1));
                                idx++;
                            }
                        }

                        const cleanObs = val(r + 14, 0) || val(60, 0);

                        cetpros.push({
                            nombre: cleanName,
                            codigoLocal: val(4, 3),
                            codigoModular: val(4, 14),
                            tipoGestion: val(5, 3) || "Estatal",
                            distrito: val(5, 14),
                            apellidoPaterno: nameParts.apellidoPaterno,
                            apellidoMaterno: nameParts.apellidoMaterno,
                            nombres: nameParts.nombres,
                            cargo: val(7, 3) || "Director",
                            dni: val(7, 14),
                            correoInstitucional: val(8, 3),
                            correoPersonal: val(8, 14),
                            celular: val(9, 3),
                            telefonoInstitucional: val(9, 14),
                            direccion: val(10, 3),
                            turnos: val(11, 3),
                            horarioInicio: val(11, 14),
                            horarioTermino: val(12, 3),
                            permanenciaDirectivo: val(12, 14),
                            alumnosCenso: valNum(15, 4),
                            docentesCenso: valNum(28, 4),
                            talleresCenso: valNum(27, 4),
                            adminNombrados: valNum(24, 4),
                            adminContratados: valNum(25, 4),
                            docentesNombrados: valNum(21, 4),
                            docentesContratados: valNum(22, 4),
                            ofertaFormativa: programas,
                            ofertaFormativaRaw: programas.join("\n"),
                            familiasProductivas: [],
                            familiasProductivasRaw: "",
                            formacionContinua: cursos,
                            formacionContinuaRaw: cursos.join("\n"),
                            totalInclusivos: valNum(17, 4),
                            apoyoIntermitenteLeve: 0,
                            apoyoContinuoModerado: 0,
                            apoyoIntensoSevero: 0,
                            porcentajeInclusion: valNum(15, 4) > 0 ? Number(((valNum(17, 4) / valNum(15, 4)) * 100).toFixed(1)) : 0,
                            observaciones: cleanObs
                        });
                    });
                    resolve(cetpros);
                } else {
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
                            tipoGestion: toStr(r[4]) || "Estatal",
                            distrito: toStr(r[5]),
                            cargo: toStr(r[6]) || "Director",
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
                            docentesNombrados: 0,
                            docentesContratados: 0,
                            totalInclusivos: 0,
                            apoyoIntermitenteLeve: 0,
                            apoyoContinuoModerado: 0,
                            apoyoIntensoSevero: 0,
                            porcentajeInclusion: 0,
                            observaciones: toStr(r[28]),
                        });
                    }
                    resolve(cetpros);
                }
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
    const pdf = new jsPDF("portrait", "mm", "a1");
    const W = 594, H = 841, MX = 40, MY = 40;
    const pw = W - 2 * MX;
    let y = MY;
    const totalPages = [];
    let pageNum = 1;

    const addFooter = () => { totalPages.push(pageNum); };
    const checkPage = (need) => { if (y + need > H - MY - 22) { addFooter(); pdf.addPage(); pageNum++; y = MY; } };

    // Header
    pdf.setFontSize(45); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
    pdf.text("Directorio CETPRO - UGEL 03", MX, y + 17); y += 28;
    pdf.setFontSize(25); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139);
    pdf.text(`Centros de Educacion Tecnico Productiva | Generado: ${new Date().toLocaleDateString("es-PE")}`, MX, y + 11); y += 28;

    // KPI row
    pdf.setFillColor(241, 245, 249); pdf.roundedRect(MX, y, pw, 40, 6, 6, "F");
    pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 77, 123);
    const kpiItems = [
        `CETPRO: ${kpis.total}`, `Estudiantes: ${kpis.totalEstudiantes.toLocaleString()}`,
        `Docentes: ${kpis.totalDocentes}`, `Talleres: ${kpis.totalTalleres}`,
        `Admin: ${kpis.totalAdmin}`, `Distritos: ${kpis.distritosUnicos}`
    ];
    const kpiW = pw / kpiItems.length;
    kpiItems.forEach((t, i) => { pdf.text(t, MX + i * kpiW + kpiW / 2, y + 25, { align: "center" }); });
    y += 56;

    // CETPROs
    filtered.forEach((c, idx) => {
        checkPage(141);
        // Name bar
        pdf.setFillColor(27, 58, 92); pdf.roundedRect(MX, y, pw, 22, 3, 3, "F");
        pdf.setFontSize(28); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
        pdf.text(`${idx + 1}. ${c.nombre}`, MX + 8, y + 15);
        const gLabel = gestionLabel(c.tipoGestion);
        pdf.setFontSize(20); pdf.text(`${gLabel} | ${c.distrito}`, MX + pw - 8, y + 15, { align: "right" });
        y += 31;

        // Director & contact
        pdf.setFontSize(24); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
        const fullName = [c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ") + (c.nombres ? ", " + c.nombres : "");
        pdf.text(`${c.cargo || "Director"}: ${fullName}`, MX + 6, y + 8);
        y += 14;

        pdf.setFont("helvetica", "normal"); pdf.setFontSize(22); pdf.setTextColor(71, 85, 105);
        const contactLine = [c.correoInstitucional, c.celular, c.direccion].filter(Boolean).join(" | ");
        if (contactLine) { const lines = pdf.splitTextToSize(contactLine, pw - 12); pdf.text(lines, MX + 6, y + 8); y += lines.length * 10 + 3; }

        // Stats line
        pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(21, 128, 61);
        pdf.text(`Alumnos: ${c.alumnosCenso}`, MX + 6, y + 8);
        pdf.setTextColor(15, 118, 110); pdf.text(`Docentes: ${c.docentesCenso}`, MX + 127, y + 8);
        pdf.setTextColor(67, 56, 202); pdf.text(`Talleres: ${c.talleresCenso}`, MX + 240, y + 8);
        pdf.setTextColor(100, 116, 139); pdf.setFont("helvetica", "normal");
        pdf.text(`Turnos: ${c.turnos || "-"}`, MX + 325, y + 8);
        y += 14;

        // Oferta formativa (abbreviated)
        if (c.ofertaFormativa && c.ofertaFormativa.length > 0) {
            checkPage(34);
            pdf.setFontSize(21); pdf.setFont("helvetica", "italic"); pdf.setTextColor(100, 116, 139);
            const shown = c.ofertaFormativa.slice(0, 4).join(", ");
            const extra = c.ofertaFormativa.length > 4 ? ` ...y ${c.ofertaFormativa.length - 4} mas` : "";
            const ofLines = pdf.splitTextToSize(`Oferta: ${shown}${extra}`, pw - 12);
            pdf.text(ofLines, MX + 6, y + 8);
            y += ofLines.length * 8.5 + 3;
        }

        // Separator
        pdf.setDrawColor(226, 232, 240); pdf.line(MX, y + 3, MX + pw, y + 3);
        y += 14;
    });

    addFooter();
    // Page numbers
    const total = pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(20); pdf.setFont("helvetica", "normal"); pdf.setTextColor(148, 163, 184);
        pdf.text(`Pagina ${i} de ${total}`, W / 2, H - 17, { align: "center" });
    }

    const today = new Date().toISOString().split("T")[0];
    pdf.save(`Directorio_CETPRO_UGEL03_${today}.pdf`);
}

export default function DirectorioCETPRO() {
    const { user, isRole } = useAuth();
    const [data, setData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [distritoFilter, setDistritoFilter] = useState("todos");
    const [gestionFilter, setGestionFilter] = useState("todos");
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const fileRef = useRef(null);

    // ── Drag-and-drop / Upload state ──
    const [dragOver, setDragOver] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null); // { items: [], totalEstudiantes: 0, totalDocentes: 0 }
    const [uploadMode, setUploadMode] = useState("merge"); // "merge" or "replace"

    // CRUD & Form State
    const [formOpen, setFormOpen] = useState(false);
    const [formTab, setFormTab] = useState("inst"); // inst, director, horarios, ofertas
    const [editingCETPRO, setEditingCETPRO] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        codigoLocal: "",
        codigoModular: "",
        tipoGestion: "Estatal",
        distrito: "",
        direccion: "",
        cargo: "Director",
        apellidoPaterno: "",
        apellidoMaterno: "",
        nombres: "",
        dni: "",
        correoInstitucional: "",
        correoPersonal: "",
        celular: "",
        telefonoInstitucional: "",
        turnos: "",
        horarioInicio: "",
        horarioTermino: "",
        permanenciaDirectivo: "",
        ofertaFormativaRaw: "",
        familiasProductivasRaw: "",
        formacionContinuaRaw: "",
        alumnosCenso: 0,
        docentesCenso: 0,
        talleresCenso: 0,
        adminNombrados: 0,
        adminContratados: 0,
        docentesNombrados: 0,
        docentesContratados: 0,
        apoyoIntermitenteLeve: 0,
        apoyoContinuoModerado: 0,
        apoyoIntensoSevero: 0,
        totalInclusivos: 0,
        porcentajeInclusion: 0,
        observaciones: ""
    });

    const openAddCETPRO = () => {
        setEditingCETPRO(null);
        setFormData({
            nombre: "",
            codigoLocal: "",
            codigoModular: "",
            tipoGestion: "Estatal",
            distrito: "",
            direccion: "",
            cargo: "Director",
            apellidoPaterno: "",
            apellidoMaterno: "",
            nombres: "",
            dni: "",
            correoInstitucional: "",
            correoPersonal: "",
            celular: "",
            telefonoInstitucional: "",
            turnos: "",
            horarioInicio: "",
            horarioTermino: "",
            permanenciaDirectivo: "",
            ofertaFormativaRaw: "",
            familiasProductivasRaw: "",
            formacionContinuaRaw: "",
            alumnosCenso: 0,
            docentesCenso: 0,
            talleresCenso: 0,
            adminNombrados: 0,
            adminContratados: 0,
            docentesNombrados: 0,
            docentesContratados: 0,
            apoyoIntermitenteLeve: 0,
            apoyoContinuoModerado: 0,
            apoyoIntensoSevero: 0,
            totalInclusivos: 0,
            porcentajeInclusion: 0,
            observaciones: ""
        });
        setFormTab("inst");
        setFormOpen(true);
    };

    const openEditCETPRO = (cetpro) => {
        setEditingCETPRO(cetpro);
        setFormData({
            ...cetpro,
            docentesNombrados: cetpro.docentesNombrados || 0,
            docentesContratados: cetpro.docentesContratados || 0,
            apoyoIntermitenteLeve: cetpro.apoyoIntermitenteLeve || 0,
            apoyoContinuoModerado: cetpro.apoyoContinuoModerado || 0,
            apoyoIntensoSevero: cetpro.apoyoIntensoSevero || 0,
            totalInclusivos: cetpro.totalInclusivos || 0,
            porcentajeInclusion: cetpro.porcentajeInclusion || 0,
            ofertaFormativaRaw: (cetpro.ofertaFormativa || []).join("\n"),
            familiasProductivasRaw: (cetpro.familiasProductivas || []).join("\n"),
            formacionContinuaRaw: (cetpro.formacionContinua || []).join("\n")
        });
        setFormTab("inst");
        setFormOpen(true);
        setSelectedItem(null);
    };

    const handleDeleteCETPRO = async (id) => {
        if (window.confirm("¿Está seguro de eliminar este CETPRO del directorio?")) {
            setLoading(true);
            try {
                await deleteCetpro(id);
                setSelectedItem(null);
                alert("CETPRO eliminado exitosamente.");
            } catch (err) {
                console.error("Error deleting CETPRO:", err);
                alert("Error al eliminar el CETPRO.");
            }
            setLoading(false);
        }
    };

    const handleSaveCETPRO = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim() || !formData.distrito.trim()) {
            alert("Nombre y Distrito son obligatorios.");
            return;
        }
        setLoading(true);
        const parsed = {
            ...formData,
            nombre: formData.nombre.trim(),
            distrito: formData.distrito.trim(),
            alumnosCenso: parseInt(formData.alumnosCenso) || 0,
            docentesCenso: parseInt(formData.docentesCenso) || 0,
            talleresCenso: parseInt(formData.talleresCenso) || 0,
            adminNombrados: parseInt(formData.adminNombrados) || 0,
            adminContratados: parseInt(formData.adminContratados) || 0,
            docentesNombrados: parseInt(formData.docentesNombrados) || 0,
            docentesContratados: parseInt(formData.docentesContratados) || 0,
            apoyoIntermitenteLeve: parseInt(formData.apoyoIntermitenteLeve) || 0,
            apoyoContinuoModerado: parseInt(formData.apoyoContinuoModerado) || 0,
            apoyoIntensoSevero: parseInt(formData.apoyoIntensoSevero) || 0,
            ofertaFormativa: parseLines(formData.ofertaFormativaRaw),
            familiasProductivas: parseLines(formData.familiasProductivasRaw),
            formacionContinua: parseLines(formData.formacionContinuaRaw),
            actualizadoPor: user?.nombre || user?.email || 'sistema',
            actualizadoEn: new Date().toISOString()
        };

        // Auto-calculate inclusion totals
        parsed.totalInclusivos = parsed.apoyoIntermitenteLeve + parsed.apoyoContinuoModerado + parsed.apoyoIntensoSevero;
        if (parsed.totalInclusivos === 0 && (parseInt(formData.totalInclusivos) || 0) > 0) {
            parsed.totalInclusivos = parseInt(formData.totalInclusivos) || 0;
        }
        parsed.porcentajeInclusion = parsed.alumnosCenso > 0 ? Number(((parsed.totalInclusivos / parsed.alumnosCenso) * 100).toFixed(1)) : 0;

        try {
            if (editingCETPRO) {
                await updateCetpro(editingCETPRO.id, parsed);
                alert("CETPRO actualizado exitosamente.");
            } else {
                await addCetpro(parsed);
                alert("CETPRO registrado exitosamente.");
            }
            setFormOpen(false);
            setEditingCETPRO(null);
        } catch (err) {
            console.error("Error saving CETPRO:", err);
            alert("Error al guardar el CETPRO.");
        }
        setLoading(false);
    };

    // Subscribirse a los CETPROs desde Firestore
    useEffect(() => {
        const unsubscribe = subscribeDirectorioCetpro((list) => {
            setData(list || []);
            setLoadingData(false);
        });
        return () => unsubscribe();
    }, []);

    // Auto-select own school if director
    useEffect(() => {
        if (user && user.rol === "director" && data.length > 0) {
            const mySchool = data.find(c => c.id === user.institucionId);
            if (mySchool) {
                setSelectedItem(mySchool);
            }
        }
    }, [data, user]);

    const distritos = useMemo(() => [...new Set(data.map(c => c.distrito).filter(Boolean))].sort(), [data]);
    const gestionTypes = useMemo(() => [...new Set(data.map(c => gestionLabel(c.tipoGestion)))].sort(), [data]);

    const filtered = useMemo(() => {
        let f = [...data];
        if (user && user.rol === "director") {
            f = f.filter(c => c.id === user.institucionId);
        } else {
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
        }
        return f;
    }, [data, searchTerm, distritoFilter, gestionFilter, user]);

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

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const parsed = await parseDirectorioCETPRO(file);
            if (parsed.length === 0) {
                alert("No se detectaron instituciones en el archivo. Verifique el formato.");
                setLoading(false);
                return;
            }
            const totalEstudiantes = parsed.reduce((s, c) => s + (c.alumnosCenso || 0), 0);
            const totalDocentes = parsed.reduce((s, c) => s + (c.docentesCenso || 0), 0);
            setUploadPreview({ items: parsed, totalEstudiantes, totalDocentes });
        } catch (err) {
            console.error("Error parsing file:", err);
            alert("Error al procesar el archivo Excel: " + err.message);
        }
        setLoading(false);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            handleFileUpload({ target: { files: [file] } });
        } else {
            alert("Solo se aceptan archivos Excel (.xlsx / .xls)");
        }
    };

    const confirmUpload = async () => {
        if (!uploadPreview) return;
        setLoading(true);
        try {
            if (uploadMode === "replace") {
                const { getDocs, collection: coll } = await import("firebase/firestore");
                const { db: fireDb } = await import("../firebase/config");
                const snap = await getDocs(coll(fireDb, "directorioCetpro"));
                const { writeBatch: wb } = await import("firebase/firestore");
                const delBatch = wb(fireDb);
                snap.docs.forEach(d => delBatch.delete(d.ref));
                await delBatch.commit();
            }
            await batchSetCetpros(uploadPreview.items, user?.uid, user?.nombre);
            alert(`${uploadPreview.items.length} instituciones CETPRO ${uploadMode === "replace" ? "reemplazadas" : "actualizadas"} exitosamente.`);
            setUploadPreview(null);
        } catch (err) {
            console.error("Error uploading CETPROs:", err);
            alert("Error al guardar las instituciones: " + err.message);
        }
        setLoading(false);
    };

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
    if (loadingData) {
        return (
            <div style={{ textAlign: "center", padding: 80, fontFamily: "'DM Sans'" }}>
                <div style={{ display: 'inline-block', width: 24, height: 24, border: `3px solid ${C.g200}`, borderTopColor: C.navy4, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: C.g500, fontSize: '0.85rem', marginTop: 10 }}>Cargando directorio CETPRO...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }



    return (
        <div onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}>
            {dragOver && (
                <div 
                    onDragLeave={() => setDragOver(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.85)", zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", border: `4px dashed ${C.gold2}`, margin: 10, borderRadius: 12, animation: "fadeIn 0.15s ease" }}
                >
                    <div style={{ animation: "pulse 1.5s infinite" }}>{Ic.upload(64, C.white)}</div>
                    <h3 style={{ color: C.white, fontSize: "1.6rem", margin: "20px 0 10px", fontFamily: "'DM Serif Display',serif" }}>Suelte el archivo del Directorio CETPRO</h3>
                    <p style={{ color: C.g300, fontSize: "0.95rem", fontFamily: "'DM Sans'" }}>Para actualizar o reemplazar los datos del directorio</p>
                    <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }`}</style>
                </div>
            )}
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Directorio CETPRO - UGEL 03</h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>Centros de Educacion Tecnico Productiva · {kpis.total} instituciones registradas</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {(isRole('admin') || isRole('jefatura')) && (
                        <button onClick={openAddCETPRO} style={S.btn(C.navy4, C.white, C.navy5)}>
                            + Agregar CETPRO
                        </button>
                    )}
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={loading} style={{ ...S.btn(C.gold2, C.white, C.gold1), opacity: loading ? 0.7 : 1 }}>{loading ? "Procesando..." : <>{Ic.upload(14, C.white)} Cargar Excel</>}</button>
                    <button onClick={handleExportPDF} disabled={exporting} style={{ ...S.btn(C.white, C.navy3, C.g200), opacity: exporting ? 0.6 : 1 }}>{exporting ? "Exportando..." : <>{Ic.download(14, C.navy3)} Descargar PDF</>}</button>
                </div>
            </div>

            {data.length === 0 ? (
                <div style={{ padding: 40, maxWidth: 640, margin: "40px auto" }}>
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        style={{
                            border: `2.5px dashed ${dragOver ? C.navy4 : C.g300}`,
                            background: dragOver ? `${C.navy4}08` : C.white,
                            borderRadius: 12,
                            padding: "60px 40px",
                            textAlign: "center",
                            transition: "all 0.2s ease",
                            boxShadow: "0 4px 12px rgba(15,23,42,0.03)"
                        }}
                    >
                        <div style={{ marginBottom: 20 }}>
                            {Ic.school(56, dragOver ? C.navy4 : C.g400)}
                        </div>
                        <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "0 0 10px", fontFamily: "'DM Serif Display',serif" }}>
                            Directorio CETPRO - UGEL 03
                        </h3>
                        <p style={{ color: C.g500, fontSize: "0.88rem", fontFamily: "'DM Sans'", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.5 }}>
                            Arrastra y suelta tu archivo Excel del Directorio CETPRO aquí, o haz click en el botón para explorar tus archivos locales.
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
                            <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "12px 28px", fontSize: 13 }}>
                                {Ic.upload(15, C.white)} Seleccionar Archivo Excel
                            </button>
                            {(isRole('admin') || isRole('jefatura')) && (
                                <button onClick={openAddCETPRO} style={{ ...S.btn(C.gold2, C.white, C.gold1), padding: "12px 28px", fontSize: 13 }}>
                                    + Cargar Manualmente
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
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
                </>
            )}

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
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {(isRole('admin') || isRole('jefatura') || (isRole('director') && user?.institucionId === selectedItem.id)) && (
                                    <button onClick={() => openEditCETPRO(selectedItem)} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "6px 12px", fontSize: 11 }}>Editar</button>
                                )}
                                {(isRole('admin') || isRole('jefatura')) && (
                                    <button onClick={() => handleDeleteCETPRO(selectedItem.id)} style={{ ...S.btn(C.red, C.white, C.red), padding: "6px 12px", fontSize: 11 }}>Eliminar</button>
                                )}
                                <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.g400, padding: 4 }}>{Ic.x(22, C.g400)}</button>
                            </div>
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
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Docentes</div>
                                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                                        <div>
                                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.navy4, textAlign: "center" }}>{selectedItem.docentesNombrados || 0}</div>
                                            <div style={{ fontSize: "0.6rem", color: C.g500, textAlign: "center" }}>Nombrados</div>
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.amber, textAlign: "center" }}>{selectedItem.docentesContratados || 0}</div>
                                            <div style={{ fontSize: "0.6rem", color: C.g500, textAlign: "center" }}>Contratados</div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "14px 18px" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>Administrativos</div>
                                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                                        <div>
                                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.navy4, textAlign: "center" }}>{selectedItem.adminNombrados || 0}</div>
                                            <div style={{ fontSize: "0.6rem", color: C.g500, textAlign: "center" }}>Nombrados</div>
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.amber, textAlign: "center" }}>{selectedItem.adminContratados || 0}</div>
                                            <div style={{ fontSize: "0.6rem", color: C.g500, textAlign: "center" }}>Contratados</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sec Inclusión y Apoyos (NEE) */}
                            <SecTitle>Inclusión y Apoyos (NEE)</SecTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.navy4 }}>{selectedItem.apoyoIntermitenteLeve || 0}</div>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Intermitente / Leve</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.teal }}>{selectedItem.apoyoContinuoModerado || 0}</div>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Continuo / Moderado</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.amber }}>{selectedItem.apoyoIntensoSevero || 0}</div>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Intenso / Severo</div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <Field label="Total Inclusivos" value={selectedItem.totalInclusivos || 0} mono />
                                <Field label="Porcentaje de Inclusión" value={`${selectedItem.porcentajeInclusion || 0}%`} mono />
                            </div>
                            <div style={{ background: `${C.navy4}08`, border: `1px solid ${C.navy4}20`, borderRadius: 8, padding: "14px 18px", fontSize: "0.78rem", color: C.g700, marginBottom: 24, lineHeight: 1.5 }}>
                                <h4 style={{ margin: "0 0 6px 0", color: C.navy3, fontSize: "0.8rem", fontWeight: 700 }}>Guía de Orientación de Inclusión (NEE):</h4>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    <li><strong>Apoyo Intermitente (Leve):</strong> Dificultades leves de aprendizaje o lenguaje.</li>
                                    <li><strong>Apoyo Continuo (Moderado):</strong> Discapacidad intelectual leve/moderada, sensorial o física.</li>
                                    <li><strong>Apoyo Intenso (Severo):</strong> Sordoceguera, multidiscapacidad o discapacidad intelectual severa.</li>
                                </ul>
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

            {/* FORM MODAL (ADD & EDIT) */}
            {formOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }}>
                    <div style={{ ...S.card, padding: 0, width: "100%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
                        
                        {/* Header */}
                        <div style={{ padding: "20px 24px", borderBottom: `2px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.white, borderRadius: "10px 10px 0 0" }}>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display', serif" }}>
                                {editingCETPRO ? `Editar CETPRO: ${editingCETPRO.nombre}` : "Agregar Nuevo CETPRO"}
                            </h3>
                            <button onClick={() => setFormOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: C.g400 }}>&times;</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", borderBottom: `1px solid ${C.g200}`, background: C.g50 }}>
                            {[
                                { id: "inst", label: "Datos Institucionales" },
                                { id: "director", label: "Director / Contacto" },
                                { id: "horarios", label: "Horarios y Turnos" },
                                { id: "ofertas", label: "Programas y Estadísticas" },
                                { id: "inclusion", label: "Inclusión (NEE)" }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setFormTab(t.id)}
                                    style={{
                                        flex: 1,
                                        padding: "12px 14px",
                                        border: "none",
                                        borderBottom: formTab === t.id ? `3px solid ${C.navy4}` : "none",
                                        background: "transparent",
                                        color: formTab === t.id ? C.navy1 : C.g500,
                                        fontWeight: formTab === t.id ? 700 : 500,
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveCETPRO} style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
                            
                            {/* Tab 1: Datos Institucionales */}
                            {formTab === "inst" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Nombre del CETPRO *</label>
                                        <input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Código Local</label>
                                        <input type="text" value={formData.codigoLocal} onChange={e => setFormData({ ...formData, codigoLocal: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Código Modular</label>
                                        <input type="text" value={formData.codigoModular} onChange={e => setFormData({ ...formData, codigoModular: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Tipo de Gestión</label>
                                        <select value={formData.tipoGestion} onChange={e => setFormData({ ...formData, tipoGestion: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }}>
                                            <option value="Estatal">Estatal</option>
                                            <option value="Convenio">Convenio</option>
                                            <option value="Parroquial">Parroquial</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Distrito *</label>
                                        <input type="text" required value={formData.distrito} onChange={e => setFormData({ ...formData, distrito: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Dirección</label>
                                        <input type="text" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Observaciones</label>
                                        <textarea value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} style={{ ...S.input, width: "100%", height: 80, boxSizing: "border-box", resize: "none" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Director / Contacto */}
                            {formTab === "director" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cargo</label>
                                        <input type="text" value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Nombres</label>
                                        <input type="text" value={formData.nombres} onChange={e => setFormData({ ...formData, nombres: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apellido Paterno</label>
                                        <input type="text" value={formData.apellidoPaterno} onChange={e => setFormData({ ...formData, apellidoPaterno: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apellido Materno</label>
                                        <input type="text" value={formData.apellidoMaterno} onChange={e => setFormData({ ...formData, apellidoMaterno: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>DNI</label>
                                        <input type="text" maxLength={8} value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Celular Personal</label>
                                        <input type="text" value={formData.celular} onChange={e => setFormData({ ...formData, celular: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Telefono Institucional</label>
                                        <input type="text" value={formData.telefonoInstitucional} onChange={e => setFormData({ ...formData, telefonoInstitucional: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Correo Institucional</label>
                                        <input type="email" value={formData.correoInstitucional} onChange={e => setFormData({ ...formData, correoInstitucional: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Correo Personal</label>
                                        <input type="email" value={formData.correoPersonal} onChange={e => setFormData({ ...formData, correoPersonal: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Horarios y Turnos */}
                            {formTab === "horarios" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Turnos</label>
                                        <input type="text" placeholder="Mañana, Tarde, Noche" value={formData.turnos} onChange={e => setFormData({ ...formData, turnos: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Permanencia Directiva</label>
                                        <input type="text" placeholder="Lunes a Viernes 8:00am - 5:00pm" value={formData.permanenciaDirectivo} onChange={e => setFormData({ ...formData, permanenciaDirectivo: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Horario Inicio</label>
                                        <input type="text" placeholder="e.g. 08:00" value={formData.horarioInicio} onChange={e => setFormData({ ...formData, horarioInicio: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Horario Término</label>
                                        <input type="text" placeholder="e.g. 17:00" value={formData.horarioTermino} onChange={e => setFormData({ ...formData, horarioTermino: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Programas y Estadísticas */}
                            {formTab === "ofertas" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Alumnos Censo</label>
                                            <input type="number" min="0" value={formData.alumnosCenso} onChange={e => setFormData({ ...formData, alumnosCenso: e.target.value })} style={{ ...S.input, width: "100%" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Docentes Censo</label>
                                            <input type="number" min="0" value={formData.docentesCenso} onChange={e => setFormData({ ...formData, docentesCenso: e.target.value })} style={{ ...S.input, width: "100%" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Talleres Censo</label>
                                            <input type="number" min="0" value={formData.talleresCenso} onChange={e => setFormData({ ...formData, talleresCenso: e.target.value })} style={{ ...S.input, width: "100%" }} />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Docentes Nombrados</label>
                                            <input type="number" min="0" value={formData.docentesNombrados} onChange={e => setFormData({ ...formData, docentesNombrados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Docentes Contratados</label>
                                            <input type="number" min="0" value={formData.docentesContratados} onChange={e => setFormData({ ...formData, docentesContratados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Admin. Nombrados</label>
                                            <input type="number" min="0" value={formData.adminNombrados} onChange={e => setFormData({ ...formData, adminNombrados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Admin. Contratados</label>
                                            <input type="number" min="0" value={formData.adminContratados} onChange={e => setFormData({ ...formData, adminContratados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>

                                    <div style={{ borderTop: `1px solid ${C.g100}`, paddingTop: 14 }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Programas de Estudio (Un elemento por línea)</label>
                                        <textarea placeholder="e.g. Peluquería y Cosmética&#10;Cocina" value={formData.ofertaFormativaRaw} onChange={e => setFormData({ ...formData, ofertaFormativaRaw: e.target.value })} style={{ ...S.input, width: "100%", height: 60, boxSizing: "border-box", resize: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Familias Productivas (Un elemento por línea)</label>
                                        <textarea placeholder="e.g. Estética Personal&#10;Hostelería y Turismo" value={formData.familiasProductivasRaw} onChange={e => setFormData({ ...formData, familiasProductivasRaw: e.target.value })} style={{ ...S.input, width: "100%", height: 60, boxSizing: "border-box", resize: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Formación Continua / OO (Un elemento por línea)</label>
                                        <textarea placeholder="e.g. Curso Corto de Manicura" value={formData.formacionContinuaRaw} onChange={e => setFormData({ ...formData, formacionContinuaRaw: e.target.value })} style={{ ...S.input, width: "100%", height: 60, boxSizing: "border-box", resize: "none" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 5: Inclusión (NEE) */}
                            {formTab === "inclusion" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: "0.9rem", color: C.navy1, fontWeight: 700 }}>Estudiantes con Necesidades Educativas Especiales (NEE)</h4>
                                    <p style={{ color: C.g500, fontSize: "0.78rem", margin: 0 }}>Registre el número de alumnos en cada nivel de apoyo requerido.</p>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apoyo Intermitente / Leve</label>
                                            <input type="number" min="0" value={formData.apoyoIntermitenteLeve} onChange={e => setFormData({ ...formData, apoyoIntermitenteLeve: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apoyo Continuo / Moderado</label>
                                            <input type="number" min="0" value={formData.apoyoContinuoModerado} onChange={e => setFormData({ ...formData, apoyoContinuoModerado: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apoyo Intenso / Severo</label>
                                            <input type="number" min="0" value={formData.apoyoIntensoSevero} onChange={e => setFormData({ ...formData, apoyoIntensoSevero: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>

                                    <div style={{ background: C.g50, borderRadius: 8, padding: 14, border: `1px solid ${C.g200}`, marginTop: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.g700 }}>Total de Estudiantes Inclusivos:</span>
                                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.navy4, fontFamily: "'JetBrains Mono'" }}>
                                                {parseInt(formData.apoyoIntermitenteLeve || 0) + parseInt(formData.apoyoContinuoModerado || 0) + parseInt(formData.apoyoIntensoSevero || 0)}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.g700 }}>Porcentaje de Inclusión (auto):</span>
                                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.green, fontFamily: "'JetBrains Mono'" }}>
                                                {formData.alumnosCenso > 0 ? (((parseInt(formData.apoyoIntermitenteLeve || 0) + parseInt(formData.apoyoContinuoModerado || 0) + parseInt(formData.apoyoIntensoSevero || 0)) / formData.alumnosCenso) * 100).toFixed(1) : "0.0"}%
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ background: `${C.navy4}08`, border: `1px solid ${C.navy4}20`, borderRadius: 8, padding: "14px 18px", fontSize: "0.78rem", color: C.g700, lineHeight: 1.5 }}>
                                        <h4 style={{ margin: "0 0 6px 0", color: C.navy3, fontSize: "0.8rem", fontWeight: 700 }}>Guía de Orientación:</h4>
                                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                                            <li><strong>Apoyo Intermitente (Leve):</strong> Dificultades leves de aprendizaje o lenguaje.</li>
                                            <li><strong>Apoyo Continuo (Moderado):</strong> Discapacidad intelectual leve/moderada, sensorial o física.</li>
                                            <li><strong>Apoyo Intenso (Severo):</strong> Sordoceguera, multidiscapacidad o discapacidad intelectual severa.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.g200}`, paddingTop: 18, marginTop: "auto" }}>
                                <button type="button" onClick={() => setFormOpen(false)} style={{ background: "#FFFFFF", border: `1px solid ${C.g200}`, borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 600, color: C.g600, cursor: "pointer" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} style={{ ...S.btn(C.navy3, C.white, C.navy4), padding: "8px 18px", fontSize: 12, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? "Guardando..." : "Guardar CETPRO"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* UPLOAD PREVIEW MODAL */}
            {uploadPreview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }}>
                    <div style={{ ...S.card, padding: 0, width: "100%", maxWidth: 560, animation: "fadeIn 0.2s ease" }}>
                        <div style={{ padding: "20px 24px", borderBottom: `2px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display', serif" }}>
                                Vista Previa de Carga CETPRO
                            </h3>
                            <button onClick={() => setUploadPreview(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: C.g400 }}>&times;</button>
                        </div>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.navy4 }}>{uploadPreview.items.length}</div>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>CETPROs</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.green }}>{uploadPreview.totalEstudiantes}</div>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Alumnos</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.amber }}>{new Set(uploadPreview.items.map(c => c.distrito).filter(Boolean)).size}</div>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Distritos</div>
                                </div>
                            </div>
                            <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 14, maxHeight: 180, overflowY: "auto", marginBottom: 20 }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", marginBottom: 8 }}>Instituciones detectadas:</div>
                                {uploadPreview.items.map((c, i) => (
                                    <div key={i} style={{ fontSize: "0.78rem", color: C.g700, padding: "4px 0", borderBottom: `1px solid ${C.g100}`, display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontWeight: 600 }}>{c.n}. {c.nombre}</span>
                                        <span style={{ color: C.g400, fontSize: "0.7rem" }}>{c.distrito} · {c.alumnosCenso || 0} alumnos</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", marginBottom: 8 }}>Modo de carga:</div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 6, border: `2px solid ${uploadMode === "merge" ? C.navy4 : C.g200}`, background: uploadMode === "merge" ? `${C.navy4}08` : C.white, cursor: "pointer" }}>
                                        <input type="radio" name="uploadModeCETPRO" value="merge" checked={uploadMode === "merge"} onChange={() => setUploadMode("merge")} style={{ accentColor: C.navy4 }} />
                                        <div>
                                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.navy1 }}>Combinar (Upsert)</div>
                                            <div style={{ fontSize: "0.7rem", color: C.g500 }}>Actualiza existentes y agrega nuevas</div>
                                        </div>
                                    </label>
                                    <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 6, border: `2px solid ${uploadMode === "replace" ? C.red : C.g200}`, background: uploadMode === "replace" ? "#FEF2F208" : C.white, cursor: "pointer" }}>
                                        <input type="radio" name="uploadModeCETPRO" value="replace" checked={uploadMode === "replace"} onChange={() => setUploadMode("replace")} style={{ accentColor: C.red }} />
                                        <div>
                                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.navy1 }}>Reemplazar todo</div>
                                            <div style={{ fontSize: "0.7rem", color: C.red }}>Borra todo y carga de nuevo</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button onClick={() => setUploadPreview(null)} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 600, color: C.g600, cursor: "pointer", fontFamily: "'DM Sans'" }}>
                                    Cancelar
                                </button>
                                <button onClick={confirmUpload} disabled={loading} style={{ ...S.btn(C.navy3, C.white, C.navy4), padding: "8px 18px", fontSize: 12, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? "Subiendo..." : `Confirmar ${uploadMode === "merge" ? "Combinación" : "Reemplazo"} (${uploadPreview.items.length} CETPRO)`}
                                </button>
                            </div>
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
