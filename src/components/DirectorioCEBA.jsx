import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { subscribeDirectorioCeba, addCeba, updateCeba, deleteCeba, batchSetCebas } from "../firebase/db";
import { useAuth } from "../context/AuthContext";

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

function parseDirectorioCEBA(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const isMega = wb.SheetNames.includes("PORTADA") || wb.SheetNames.some(name => /^\d+_/i.test(name));

                if (isMega) {
                    const cebas = [];
                    const sheetNames = wb.SheetNames.filter(name => 
                        !["PORTADA", "RESUMEN GENERAL", "GUÍA EBA", "GUÍA GENERAL", "GUÍA DE INCLUSIÓN", "CATÁLOGO DE PROGRAMAS"].includes(name.toUpperCase().trim())
                    );

                    sheetNames.forEach(sheetName => {
                        const ws = wb.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                        if (rows.length < 15) return;

                        const val = (r, c) => (rows[r] && rows[r][c] !== undefined ? String(rows[r][c]).trim() : "");
                        const valNum = (r, c) => parseInt(rows[r] && rows[r][c]) || 0;
                        const valBool = (r, c) => {
                            const s = val(r, c).toUpperCase();
                            return s === "SI" || s === "SÍ" || s === "S" || s === "X";
                        };

                        const rawName = val(0, 0);
                        const cleanName = rawName.split("·")[0].trim();
                        const fullName = val(7, 3);
                        const nameParts = splitName(fullName);

                        const totalAlumnosGrados = valNum(34, 6) + 
                                                   valNum(35, 6) + valNum(36, 6) + valNum(37, 6) +
                                                   valNum(38, 6) + valNum(39, 6) + valNum(40, 6) + valNum(41, 6);

                        const censoVal = valNum(15, 4);
                        const finalAlumnosCenso = totalAlumnosGrados > 0 ? totalAlumnosGrados : censoVal;

                        const sedes = [];
                        for (let r = 64; r < 72; r++) {
                            if (rows[r]) {
                                const sede = val(r, 1);
                                const direccion = val(r, 5);
                                const formaAtencion = val(r, 11);
                                const dias = val(r, 15);
                                const horario = val(r, 18);
                                if (sede || direccion || formaAtencion || dias || horario) {
                                    sedes.push({ sede, direccion, formaAtencion, dias, horario });
                                }
                            }
                        }

                        cebas.push({
                            nombre: cleanName,
                            codigoLocal: val(4, 3),
                            codigoModularInicialIntermedio: val(4, 14),
                            codigoModularAvanzado: val(5, 3),
                            tipoGestion: val(5, 14) || "Estatal",
                            distrito: val(6, 3),
                            cantidadPerifericos: valNum(6, 14),
                            apellidoPaterno: nameParts.apellidoPaterno,
                            apellidoMaterno: nameParts.apellidoMaterno,
                            nombres: nameParts.nombres,
                            cargo: val(8, 3) || "Director",
                            dni: val(8, 14),
                            correoInstitucional: val(9, 3),
                            correoPersonal: val(9, 14),
                            celular: val(10, 3),
                            turnos: val(10, 14) || val(27, 4) || "",
                            direccion: val(11, 3),
                            presencial: valBool(21, 4),
                            semipresencial: valBool(22, 4),
                            aDistancia: valBool(23, 4),
                            cicloInicial: valBool(24, 4),
                            cicloIntermedio: valBool(25, 4),
                            cicloAvanzado: valBool(26, 4),
                            alumnosCenso: finalAlumnosCenso,
                            alumnosInicial: valNum(34, 6),
                            alumnosIntermedio: valNum(35, 6) + valNum(36, 6) + valNum(37, 6),
                            alumnosAvanzado: valNum(38, 6) + valNum(39, 6) + valNum(40, 6) + valNum(41, 6),
                            docentesInicial: 0,
                            docentesIntermedio: 0,
                            docentesAvanzado: 0,
                            aulasInicial: 0,
                            aulasIntermedio: 0,
                            aulasAvanzado: 0,
                            adminNombrados: 0,
                            adminContratados: 0,
                            totalInclusivos: valNum(17, 4),
                            apoyoIntermitenteLeve: 0,
                            apoyoContinuoModerado: 0,
                            apoyoIntensoSevero: 0,
                            porcentajeInclusion: finalAlumnosCenso > 0 ? Number(((valNum(17, 4) / finalAlumnosCenso) * 100).toFixed(1)) : 0,
                            observaciones: val(73, 0),
                            sedes: sedes
                        });
                    });
                    resolve(cebas);
                } else {
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                    let startIdx = 4;
                    if (rows.length > 3 && rows[3] && String(rows[3][0] || '').match(/^\d+$/)) {
                        startIdx = 3;
                    }
                    const dataRows = rows.slice(startIdx);
                    const cebas = [];
                    let current = null;

                    for (let i = 0; i < dataRows.length; i++) {
                        const r = dataRows[i];
                        if (!r || r.length < 5) continue;

                        const nVal = r[0];
                        const isMainRow = nVal !== "" && nVal !== null && nVal !== undefined && Number.isInteger(Number(nVal)) && Number(nVal) > 0;

                        if (isMainRow) {
                            if (current) cebas.push(current);

                            const toNum = (v) => parseInt(v) || 0;
                            const toStr = (v) => (v != null ? String(v).trim() : "");
                            const toBool = (v) => { const s = toStr(v).toUpperCase(); return s === "SI" || s === "SÍ" || s === "S" || s === "X"; };
                            const safeNum = (idx) => r.length > idx ? toNum(r[idx]) : 0;

                            current = {
                                n: toNum(nVal),
                                codigoLocal: toStr(r[1]),
                                codigoModularInicialIntermedio: toStr(r[2]),
                                codigoModularAvanzado: toStr(r[3]),
                                nombre: toStr(r[4]),
                                tipoGestion: toStr(r[5]) || "Estatal",
                                distrito: toStr(r[6]),
                                cargo: toStr(r[7]) || "Director",
                                apellidoPaterno: toStr(r[8]),
                                apellidoMaterno: toStr(r[9]),
                                nombres: toStr(r[10]),
                                dni: toStr(r[11]),
                                correoInstitucional: toStr(r[12]),
                                correoPersonal: toStr(r[13]),
                                celular: toStr(r[14]),
                                direccion: toStr(r[15]),
                                cantidadPerifericos: toNum(r[16]),
                                presencial: r.length > 22 ? toBool(r[22]) : false,
                                semipresencial: r.length > 23 ? toBool(r[23]) : false,
                                aDistancia: r.length > 24 ? toBool(r[24]) : false,
                                cicloInicial: r.length > 25 ? toBool(r[25]) : false,
                                cicloIntermedio: r.length > 26 ? toBool(r[26]) : false,
                                cicloAvanzado: r.length > 27 ? toBool(r[27]) : false,
                                turnos: r.length > 28 ? toStr(r[28]) : "",
                                alumnosCenso: r.length > 29 ? toNum(r[29]) : 0,
                                observaciones: r.length > 30 ? toStr(r[30]) : "",
                                alumnosInicial: safeNum(31),
                                alumnosIntermedio: safeNum(32),
                                alumnosAvanzado: safeNum(33),
                                docentesInicial: safeNum(34),
                                docentesIntermedio: safeNum(35),
                                docentesAvanzado: safeNum(36),
                                aulasInicial: safeNum(37),
                                aulasIntermedio: safeNum(38),
                                aulasAvanzado: safeNum(39),
                                adminNombrados: safeNum(40),
                                adminContratados: safeNum(41),
                                totalInclusivos: 0,
                                apoyoIntermitenteLeve: 0,
                                apoyoContinuoModerado: 0,
                                apoyoIntensoSevero: 0,
                                porcentajeInclusion: 0,
                                sedes: [],
                            };

                            const sede = toStr(r[17]);
                            const dirSede = toStr(r[18]);
                            const formaAtencion = toStr(r[19]);
                            const dias = toStr(r[20]);
                            const horario = toStr(r[21]);
                            if (sede || dirSede || formaAtencion || dias || horario) {
                                current.sedes.push({ sede, direccion: dirSede, formaAtencion, dias, horario });
                            }
                        } else if (current) {
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
                    if (current) cebas.push(current);
                    resolve(cebas);
                }
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
    const { user, isRole } = useAuth();
    const [data, setData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [distritoFilter, setDistritoFilter] = useState("todos");
    const [selectedCEBA, setSelectedCEBA] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const fileRef = useRef(null);

    // CRUD & Form State
    const [formOpen, setFormOpen] = useState(false);
    const [formTab, setFormTab] = useState("inst"); // inst, director, ciclos, sedes
    const [editingCEBA, setEditingCEBA] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        codigoLocal: "",
        codigoModularInicialIntermedio: "",
        codigoModularAvanzado: "",
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
        cantidadPerifericos: 0,
        presencial: false,
        semipresencial: false,
        aDistancia: false,
        cicloInicial: false,
        cicloIntermedio: false,
        cicloAvanzado: false,
        turnos: "",
        alumnosCenso: 0,
        observaciones: "",
        alumnosInicial: 0,
        alumnosIntermedio: 0,
        alumnosAvanzado: 0,
        docentesInicial: 0,
        docentesIntermedio: 0,
        docentesAvanzado: 0,
        aulasInicial: 0,
        aulasIntermedio: 0,
        aulasAvanzado: 0,
        adminNombrados: 0,
        adminContratados: 0,
        apoyoIntermitenteLeve: 0,
        apoyoContinuoModerado: 0,
        apoyoIntensoSevero: 0,
        totalInclusivos: 0,
        porcentajeInclusion: 0,
        sedes: []
    });

    const openAddCEBA = () => {
        setEditingCEBA(null);
        setFormData({
            nombre: "",
            codigoLocal: "",
            codigoModularInicialIntermedio: "",
            codigoModularAvanzado: "",
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
            cantidadPerifericos: 0,
            presencial: false,
            semipresencial: false,
            aDistancia: false,
            cicloInicial: false,
            cicloIntermedio: false,
            cicloAvanzado: false,
            turnos: "",
            alumnosCenso: 0,
            observaciones: "",
            alumnosInicial: 0,
            alumnosIntermedio: 0,
            alumnosAvanzado: 0,
            docentesInicial: 0,
            docentesIntermedio: 0,
            docentesAvanzado: 0,
            aulasInicial: 0,
            aulasIntermedio: 0,
            aulasAvanzado: 0,
            adminNombrados: 0,
            adminContratados: 0,
            apoyoIntermitenteLeve: 0,
            apoyoContinuoModerado: 0,
            apoyoIntensoSevero: 0,
            totalInclusivos: 0,
            porcentajeInclusion: 0,
            sedes: []
        });
        setFormTab("inst");
        setFormOpen(true);
    };

    const openEditCEBA = (ceba) => {
        setEditingCEBA(ceba);
        setFormData({
            ...ceba,
            apoyoIntermitenteLeve: ceba.apoyoIntermitenteLeve || 0,
            apoyoContinuoModerado: ceba.apoyoContinuoModerado || 0,
            apoyoIntensoSevero: ceba.apoyoIntensoSevero || 0,
            totalInclusivos: ceba.totalInclusivos || 0,
            porcentajeInclusion: ceba.porcentajeInclusion || 0,
            sedes: ceba.sedes || []
        });
        setFormTab("inst");
        setFormOpen(true);
        setSelectedCEBA(null);
    };

    const handleDeleteCEBA = async (id) => {
        if (window.confirm("¿Está seguro de eliminar este CEBA del directorio?")) {
            setLoading(true);
            try {
                await deleteCeba(id);
                setSelectedCEBA(null);
                alert("CEBA eliminado exitosamente.");
            } catch (err) {
                console.error("Error deleting CEBA:", err);
                alert("Error al eliminar el CEBA.");
            }
            setLoading(false);
        }
    };

    const handleSaveCEBA = async (e) => {
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
            alumnosInicial: parseInt(formData.alumnosInicial) || 0,
            alumnosIntermedio: parseInt(formData.alumnosIntermedio) || 0,
            alumnosAvanzado: parseInt(formData.alumnosAvanzado) || 0,
            docentesInicial: parseInt(formData.docentesInicial) || 0,
            docentesIntermedio: parseInt(formData.docentesIntermedio) || 0,
            docentesAvanzado: parseInt(formData.docentesAvanzado) || 0,
            aulasInicial: parseInt(formData.aulasInicial) || 0,
            aulasIntermedio: parseInt(formData.aulasIntermedio) || 0,
            aulasAvanzado: parseInt(formData.aulasAvanzado) || 0,
            adminNombrados: parseInt(formData.adminNombrados) || 0,
            adminContratados: parseInt(formData.adminContratados) || 0,
            cantidadPerifericos: parseInt(formData.cantidadPerifericos) || 0,
            apoyoIntermitenteLeve: parseInt(formData.apoyoIntermitenteLeve) || 0,
            apoyoContinuoModerado: parseInt(formData.apoyoContinuoModerado) || 0,
            apoyoIntensoSevero: parseInt(formData.apoyoIntensoSevero) || 0,
            actualizadoPor: user?.nombre || user?.email || 'sistema',
            actualizadoEn: new Date().toISOString()
        };
        // Auto-calculate total students
        parsed.alumnosCenso = parsed.alumnosInicial + parsed.alumnosIntermedio + parsed.alumnosAvanzado;

        // Auto-calculate inclusion totals
        parsed.totalInclusivos = parsed.apoyoIntermitenteLeve + parsed.apoyoContinuoModerado + parsed.apoyoIntensoSevero;
        if (parsed.totalInclusivos === 0 && (parseInt(formData.totalInclusivos) || 0) > 0) {
            parsed.totalInclusivos = parseInt(formData.totalInclusivos) || 0;
        }
        parsed.porcentajeInclusion = parsed.alumnosCenso > 0 ? Number(((parsed.totalInclusivos / parsed.alumnosCenso) * 100).toFixed(1)) : 0;

        try {
            if (editingCEBA) {
                await updateCeba(editingCEBA.id, parsed);
                alert("CEBA actualizado exitosamente.");
            } else {
                await addCeba(parsed);
                alert("CEBA registrado exitosamente.");
            }
            setFormOpen(false);
            setEditingCEBA(null);
        } catch (err) {
            console.error("Error saving CEBA:", err);
            alert("Error al guardar el CEBA.");
        }
        setLoading(false);
    };

    const addSedeRow = () => {
        setFormData(prev => ({
            ...prev,
            sedes: [...prev.sedes, { sede: "", direccion: "", formaAtencion: "", dias: "", horario: "" }]
        }));
    };

    const removeSedeRow = (idx) => {
        setFormData(prev => ({
            ...prev,
            sedes: prev.sedes.filter((_, i) => i !== idx)
        }));
    };

    const updateSedeRow = (idx, field, val) => {
        setFormData(prev => {
            const copy = [...prev.sedes];
            copy[idx] = { ...copy[idx], [field]: val };
            return { ...prev, sedes: copy };
        });
    };

    // ── Drag-and-drop / Upload state ──
    const [dragOver, setDragOver] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null); // { items: [], totalSedes: 0 }
    const [uploadMode, setUploadMode] = useState("merge"); // "merge" or "replace"

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const parsed = await parseDirectorioCEBA(file);
            if (parsed.length === 0) {
                alert("No se detectaron instituciones en el archivo. Verifique el formato.");
                setLoading(false);
                return;
            }
            const totalSedes = parsed.reduce((s, c) => s + (c.sedes?.length || 0), 0);
            setUploadPreview({ items: parsed, totalSedes });
        } catch (err) {
            console.error("Error parsing file:", err);
            alert("Error al procesar el archivo Excel: " + err.message);
        }
        setLoading(false);
        // Reset file input
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
                // Delete all existing before inserting
                const { getDocs, collection: coll } = await import("firebase/firestore");
                const { db: fireDb } = await import("../firebase/config");
                const snap = await getDocs(coll(fireDb, "directorioCeba"));
                const { writeBatch: wb, doc: docRef } = await import("firebase/firestore");
                const delBatch = wb(fireDb);
                snap.docs.forEach(d => delBatch.delete(d.ref));
                await delBatch.commit();
            }
            await batchSetCebas(uploadPreview.items, user?.uid, user?.nombre);
            alert(`${uploadPreview.items.length} instituciones CEBA ${uploadMode === "replace" ? "reemplazadas" : "actualizadas"} exitosamente.`);
            setUploadPreview(null);
        } catch (err) {
            console.error("Error uploading CEBAs:", err);
            alert("Error al guardar las instituciones: " + err.message);
        }
        setLoading(false);
    };


    // Subscribirse a los CEBAs desde Firestore
    useEffect(() => {
        const unsubscribe = subscribeDirectorioCeba((list) => {
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
                setSelectedCEBA(mySchool);
            }
        }
    }, [data, user]);

    // Unique districts
    const distritos = useMemo(() => {
        const set = new Set(data.map(c => c.distrito).filter(Boolean));
        return [...set].sort();
    }, [data]);

    // Filtered data
    const filtered = useMemo(() => {
        let f = [...data];
        if (user && user.rol === "director") {
            f = f.filter(c => c.id === user.institucionId);
        } else {
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
        }
        return f;
    }, [data, searchTerm, distritoFilter, user]);

    // KPIs
    const kpis = useMemo(() => {
        const totalCEBA = data.length;
        const totalEstudiantes = data.reduce((s, c) => s + (c.alumnosCenso || 0), 0);
        const totalDocentes = data.reduce((s, c) => s + (c.docentesInicial || 0) + (c.docentesIntermedio || 0) + (c.docentesAvanzado || 0), 0);
        const totalAulas = data.reduce((s, c) => s + (c.aulasInicial || 0) + (c.aulasIntermedio || 0) + (c.aulasAvanzado || 0), 0);
        const totalAdmin = data.reduce((s, c) => s + (parseInt(c.adminNombrados) || 0) + (parseInt(c.adminContratados) || 0), 0);
        const distritosUnicos = new Set(data.map(c => c.distrito).filter(Boolean)).size;

        return {
            totalCEBA,
            totalEstudiantes,
            totalDocentes,
            totalAulas,
            totalAdmin,
            distritosUnicos
        };
    }, [data]);

    // Export PDF — scaled multi-page A1 vertical
    const handleExportPDF = useCallback(() => {
        setExporting(true);
        try {
            const pdf = new jsPDF("portrait", "mm", "a1");
            const W = 594, H = 841, MX = 40, MY = 40, pw = W - 2 * MX;
            let y = MY;
            let pageNum = 1;
            const checkPage = (need) => { if (y + need > H - MY - 22) { pdf.addPage(); pageNum++; y = MY; } };

            // Header
            pdf.setFontSize(45); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
            pdf.text("Directorio CEBA - UGEL 03", MX, y + 17); y += 28;
            pdf.setFontSize(25); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 116, 139);
            pdf.text(`Centros de Educacion Basica Alternativa | Generado: ${new Date().toLocaleDateString("es-PE")}`, MX, y + 11); y += 28;

            // KPI row
            pdf.setFillColor(241, 245, 249); pdf.roundedRect(MX, y, pw, 40, 6, 6, "F");
            pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 77, 123);
            const kpiItems = [`CEBA: ${kpis.totalCEBA}`, `Estudiantes: ${kpis.totalEstudiantes.toLocaleString()}`, `Docentes: ${kpis.totalDocentes}`, `Aulas: ${kpis.totalAulas}`, `Admin: ${kpis.totalAdmin}`, `Distritos: ${kpis.distritosUnicos}`];
            const kpiW = pw / kpiItems.length;
            kpiItems.forEach((t, i) => { pdf.text(t, MX + i * kpiW + kpiW / 2, y + 25, { align: "center" }); });
            y += 56;

            // CEBAs
            filtered.forEach((c, idx) => {
                checkPage(127);
                const isEstatal = (c.tipoGestion || "").toUpperCase().includes("ESTATAL");
                const totalDoc = (c.docentesInicial || 0) + (c.docentesIntermedio || 0) + (c.docentesAvanzado || 0);
                const totalAul = (c.aulasInicial || 0) + (c.aulasIntermedio || 0) + (c.aulasAvanzado || 0);

                // Name bar
                pdf.setFillColor(27, 58, 92); pdf.roundedRect(MX, y, pw, 22, 3, 3, "F");
                pdf.setFontSize(28); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
                pdf.text(`${idx + 1}. ${c.nombre}`, MX + 8, y + 15);
                pdf.setFontSize(20); pdf.text(`${isEstatal ? "ESTATAL" : "CONVENIO"} | ${c.distrito}`, MX + pw - 8, y + 15, { align: "right" });
                y += 31;

                // Director
                pdf.setFontSize(24); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
                const fullName = [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");
                pdf.text(`${c.cargo || "Director"}: ${fullName}`, MX + 6, y + 8); y += 14;

                // Contact
                pdf.setFont("helvetica", "normal"); pdf.setFontSize(22); pdf.setTextColor(71, 85, 105);
                const contact = [c.correoInstitucional, c.celular, c.direccion].filter(Boolean).join(" | ");
                if (contact) { const lines = pdf.splitTextToSize(contact, pw - 12); pdf.text(lines, MX + 6, y + 8); y += lines.length * 10 + 3; }

                // Stats
                pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(21, 128, 61);
                pdf.text(`Alumnos: ${c.alumnosCenso || 0}`, MX + 6, y + 8);
                pdf.setTextColor(67, 56, 202); pdf.text(`Docentes: ${totalDoc}`, MX + 127, y + 8);
                pdf.setTextColor(179, 69, 9); pdf.text(`Aulas: ${totalAul}`, MX + 240, y + 8);
                pdf.setTextColor(15, 118, 110); pdf.text(`Perifericos: ${c.cantidadPerifericos || 0}`, MX + 325, y + 8);
                y += 14;

                // Sedes summary
                if (c.sedes && c.sedes.length > 0) {
                    checkPage(22);
                    pdf.setFontSize(21); pdf.setFont("helvetica", "italic"); pdf.setTextColor(100, 116, 139);
                    const SedeNames = c.sedes.map(s => s.sede).filter(Boolean).slice(0, 3).join(", ");
                    const extra = c.sedes.length > 3 ? ` ...y ${c.sedes.length - 3} mas` : "";
                    if (SedeNames) { pdf.text(`Sedes: ${SedeNames}${extra}`, MX + 6, y + 8); y += 11; }
                }

                pdf.setDrawColor(226, 232, 240); pdf.line(MX, y + 3, MX + pw, y + 3); y += 14;
            });

            // Page numbers
            const total = pdf.getNumberOfPages();
            for (let i = 1; i <= total; i++) {
                pdf.setPage(i);
                pdf.setFontSize(20); pdf.setFont("helvetica", "normal"); pdf.setTextColor(148, 163, 184);
                pdf.text(`Pagina ${i} de ${total}`, W / 2, H - 17, { align: "center" });
            }

            const today = new Date().toISOString().split("T")[0];
            pdf.save(`Directorio_CEBA_UGEL03_${today}.pdf`);
        } catch (err) { console.error("Error exporting PDF:", err); }
        setExporting(false);
    }, [filtered, kpis]);

    // Full name of director
    const directorName = (c) => [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");

    /* ═══════════════════════════════════════════════════════
       EMPTY STATE
       ═══════════════════════════════════════════════════════ */
    if (loadingData) {
        return (
            <div style={{ textAlign: "center", padding: 80, fontFamily: "'DM Sans'" }}>
                <div style={{ display: 'inline-block', width: 24, height: 24, border: `3px solid ${C.g200}`, borderTopColor: C.navy4, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: C.g500, fontSize: '0.85rem', marginTop: 10 }}>Cargando directorio CEBA...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (data.length === 0 && !loading) {
        return (
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
                        {Icons.school(56, dragOver ? C.navy4 : C.g400)}
                    </div>
                    <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "0 0 10px", fontFamily: "'DM Serif Display',serif" }}>
                        Directorio CEBA - UGEL 03
                    </h3>
                    <p style={{ color: C.g500, fontSize: "0.88rem", fontFamily: "'DM Sans'", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.5 }}>
                        Arrastra y suelta tu archivo Excel del Directorio CEBA aquí, o haz click en el botón para explorar tus archivos locales.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                        <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "12px 28px", fontSize: 13 }}>
                            {Icons.upload(15, C.white)} Seleccionar Archivo Excel
                        </button>
                        {(isRole('admin') || isRole('jefatura')) && (
                            <button onClick={openAddCEBA} style={{ ...S.btn(C.gold2, C.white, C.gold1), padding: "12px 28px", fontSize: 13 }}>
                                + Cargar Manualmente
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════
       MAIN RENDER
       ═══════════════════════════════════════════════════════ */
    return (
        <div onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}>
            {dragOver && (
                <div 
                    onDragLeave={() => setDragOver(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.85)", zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", border: `4px dashed ${C.gold2}`, margin: 10, borderRadius: 12, animation: "fadeIn 0.15s ease" }}
                >
                    <div style={{ animation: "pulse 1.5s infinite" }}>{Icons.upload(64, C.white)}</div>
                    <h3 style={{ color: C.white, fontSize: "1.6rem", margin: "20px 0 10px", fontFamily: "'DM Serif Display',serif" }}>Suelte el archivo del Directorio CEBA</h3>
                    <p style={{ color: C.g300, fontSize: "0.95rem", fontFamily: "'DM Sans'" }}>Para actualizar o reemplazar los datos del directorio</p>
                    <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }`}</style>
                </div>
            )}
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
                    {(isRole('admin') || isRole('jefatura')) && (
                        <button onClick={openAddCEBA} style={S.btn(C.navy4, C.white, C.navy5)}>
                            + Agregar CEBA
                        </button>
                    )}
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
            <div>
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
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {(isRole('admin') || isRole('jefatura') || (isRole('director') && user?.institucionId === selectedCEBA.id)) && (
                                    <button onClick={() => openEditCEBA(selectedCEBA)} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "6px 12px", fontSize: 11 }}>
                                        Editar
                                    </button>
                                )}
                                {(isRole('admin') || isRole('jefatura')) && (
                                    <button onClick={() => handleDeleteCEBA(selectedCEBA.id)} style={{ ...S.btn(C.red, C.white, C.red), padding: "6px 12px", fontSize: 11 }}>
                                        Eliminar
                                    </button>
                                )}
                                <button onClick={() => setSelectedCEBA(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.g400, padding: 4 }}>
                                    {Icons.x(22, C.g400)}
                                </button>
                            </div>
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

                            {/* Section 7: Inclusión y Apoyos (NEE) */}
                            <SectionTitle>Inclusión y Apoyos (NEE)</SectionTitle>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.navy4 }}>{selectedCEBA.apoyoIntermitenteLeve || 0}</div>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Intermitente / Leve</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.teal }}>{selectedCEBA.apoyoContinuoModerado || 0}</div>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Continuo / Moderado</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.3rem", fontWeight: 700, color: C.amber }}>{selectedCEBA.apoyoIntensoSevero || 0}</div>
                                    <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Intenso / Severo</div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <FieldRow label="Total Inclusivos" value={selectedCEBA.totalInclusivos || 0} mono />
                                <FieldRow label="Porcentaje de Inclusión" value={`${selectedCEBA.porcentajeInclusion || 0}%`} mono />
                            </div>
                            <div style={{ background: `${C.navy4}08`, border: `1px solid ${C.navy4}20`, borderRadius: 8, padding: "14px 18px", fontSize: "0.78rem", color: C.g700, marginBottom: 24, lineHeight: 1.5 }}>
                                <h4 style={{ margin: "0 0 6px 0", color: C.navy3, fontSize: "0.8rem", fontWeight: 700 }}>Guía de Orientación de Inclusión (NEE):</h4>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                    <li><strong>Apoyo Intermitente (Leve):</strong> Dificultades leves de aprendizaje o lenguaje.</li>
                                    <li><strong>Apoyo Continuo (Moderado):</strong> Discapacidad intelectual leve/moderada, sensorial o física.</li>
                                    <li><strong>Apoyo Intenso (Severo):</strong> Sordoceguera, multidiscapacidad o discapacidad intelectual severa.</li>
                                </ul>
                            </div>

                            {/* Section 8: Observaciones */}
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

            {/* FORM MODAL (ADD & EDIT) */}
            {formOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }}>
                    <div style={{ ...S.card, padding: 0, width: "100%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
                        
                        {/* Header */}
                        <div style={{ padding: "20px 24px", borderBottom: `2px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.white, borderRadius: "10px 10px 0 0" }}>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display', serif" }}>
                                {editingCEBA ? `Editar CEBA: ${editingCEBA.nombre}` : "Agregar Nuevo CEBA"}
                            </h3>
                            <button onClick={() => setFormOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: C.g400 }}>&times;</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", borderBottom: `1px solid ${C.g200}`, background: C.g50 }}>
                            {[
                                { id: "inst", label: "Datos Institucionales" },
                                { id: "director", label: "Director / Contacto" },
                                { id: "ciclos", label: "Ciclos, Alumnos y Personal" },
                                { id: "inclusion", label: "Inclusión (NEE)" },
                                { id: "sedes", label: `Sedes (${formData.sedes.length})` }
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
                        <form onSubmit={handleSaveCEBA} style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
                            
                            {/* Tab 1: Datos Institucionales */}
                            {formTab === "inst" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Nombre del CEBA *</label>
                                        <input type="text" required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Código Local</label>
                                        <input type="text" value={formData.codigoLocal} onChange={e => setFormData({ ...formData, codigoLocal: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Tipo de Gestión</label>
                                        <select value={formData.tipoGestion} onChange={e => setFormData({ ...formData, tipoGestion: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }}>
                                            <option value="Estatal">Estatal</option>
                                            <option value="Convenio">Convenio</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cod. Modular Inicial-Intermedio</label>
                                        <input type="text" value={formData.codigoModularInicialIntermedio} onChange={e => setFormData({ ...formData, codigoModularInicialIntermedio: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cod. Modular Avanzado</label>
                                        <input type="text" value={formData.codigoModularAvanzado} onChange={e => setFormData({ ...formData, codigoModularAvanzado: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Distrito *</label>
                                        <input type="text" required value={formData.distrito} onChange={e => setFormData({ ...formData, distrito: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
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
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Celular</label>
                                        <input type="text" value={formData.celular} onChange={e => setFormData({ ...formData, celular: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Correo Institucional</label>
                                        <input type="email" value={formData.correoInstitucional} onChange={e => setFormData({ ...formData, correoInstitucional: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Correo Personal</label>
                                        <input type="email" value={formData.correoPersonal} onChange={e => setFormData({ ...formData, correoPersonal: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Ciclos, Alumnos y Personal */}
                            {formTab === "ciclos" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={formData.presencial} onChange={e => setFormData({ ...formData, presencial: e.target.checked })} />
                                            <span style={{ fontSize: "0.8rem", color: C.g700 }}>Presencial</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={formData.semipresencial} onChange={e => setFormData({ ...formData, semipresencial: e.target.checked })} />
                                            <span style={{ fontSize: "0.8rem", color: C.g700 }}>Semipresencial</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={formData.aDistancia} onChange={e => setFormData({ ...formData, aDistancia: e.target.checked })} />
                                            <span style={{ fontSize: "0.8rem", color: C.g700 }}>A Distancia</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={formData.cicloInicial} onChange={e => setFormData({ ...formData, cicloInicial: e.target.checked })} />
                                            <span style={{ fontSize: "0.8rem", color: C.g700 }}>Ciclo Inicial</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={formData.cicloIntermedio} onChange={e => setFormData({ ...formData, cicloIntermedio: e.target.checked })} />
                                            <span style={{ fontSize: "0.8rem", color: C.g700 }}>Ciclo Intermedio</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input type="checkbox" checked={formData.cicloAvanzado} onChange={e => setFormData({ ...formData, cicloAvanzado: e.target.checked })} />
                                            <span style={{ fontSize: "0.8rem", color: C.g700 }}>Ciclo Avanzado</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Turnos</label>
                                            <input type="text" placeholder="Mañana, Tarde, Noche" value={formData.turnos} onChange={e => setFormData({ ...formData, turnos: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cantidad Periféricos</label>
                                            <input type="number" min="0" value={formData.cantidadPerifericos} onChange={e => setFormData({ ...formData, cantidadPerifericos: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>

                                    <div style={{ borderTop: `1px solid ${C.g100}`, paddingTop: 14 }}>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "0.82rem", color: C.navy1, fontWeight: 700 }}>Matrícula y Recursos por Ciclo</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                                            <div />
                                            <div style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: C.g500 }}>Inicial</div>
                                            <div style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: C.g500 }}>Intermedio</div>
                                            <div style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: C.g500 }}>Avanzado</div>

                                            <div style={{ fontSize: "0.75rem", alignSelf: "center", color: C.g700, fontWeight: 600 }}>Alumnos:</div>
                                            <input type="number" min="0" value={formData.alumnosInicial} onChange={e => setFormData({ ...formData, alumnosInicial: e.target.value })} style={S.input} />
                                            <input type="number" min="0" value={formData.alumnosIntermedio} onChange={e => setFormData({ ...formData, alumnosIntermedio: e.target.value })} style={S.input} />
                                            <input type="number" min="0" value={formData.alumnosAvanzado} onChange={e => setFormData({ ...formData, alumnosAvanzado: e.target.value })} style={S.input} />

                                            <div style={{ fontSize: "0.75rem", alignSelf: "center", color: C.g700, fontWeight: 600 }}>Docentes:</div>
                                            <input type="number" min="0" value={formData.docentesInicial} onChange={e => setFormData({ ...formData, docentesInicial: e.target.value })} style={S.input} />
                                            <input type="number" min="0" value={formData.docentesIntermedio} onChange={e => setFormData({ ...formData, docentesIntermedio: e.target.value })} style={S.input} />
                                            <input type="number" min="0" value={formData.docentesAvanzado} onChange={e => setFormData({ ...formData, docentesAvanzado: e.target.value })} style={S.input} />

                                            <div style={{ fontSize: "0.75rem", alignSelf: "center", color: C.g700, fontWeight: 600 }}>Aulas:</div>
                                            <input type="number" min="0" value={formData.aulasInicial} onChange={e => setFormData({ ...formData, aulasInicial: e.target.value })} style={S.input} />
                                            <input type="number" min="0" value={formData.aulasIntermedio} onChange={e => setFormData({ ...formData, aulasIntermedio: e.target.value })} style={S.input} />
                                            <input type="number" min="0" value={formData.aulasAvanzado} onChange={e => setFormData({ ...formData, aulasAvanzado: e.target.value })} style={S.input} />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderTop: `1px solid ${C.g100}`, paddingTop: 14 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Admin. Nombrados</label>
                                            <input type="number" min="0" value={formData.adminNombrados} onChange={e => setFormData({ ...formData, adminNombrados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Admin. Contratados</label>
                                            <input type="number" min="0" value={formData.adminContratados} onChange={e => setFormData({ ...formData, adminContratados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3.5: Inclusión (NEE) */}
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

                            {/* Tab 4: Sedes y Horarios */}
                            {formTab === "sedes" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "0.82rem", color: C.g500 }}>Registre las sedes anexas y sus horarios.</span>
                                        <button type="button" onClick={addSedeRow} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "6px 12px", fontSize: 11 }}>
                                            + Agregar Fila Sede
                                        </button>
                                    </div>

                                    {formData.sedes.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: 24, border: `1px dashed ${C.g300}`, borderRadius: 8, color: C.g400, fontSize: "0.8rem" }}>
                                            No hay sedes registradas.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "40vh", overflowY: "auto", paddingRight: 4 }}>
                                            {formData.sedes.map((s, idx) => (
                                                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr 1fr 1.2fr auto", gap: 10, background: C.g50, padding: 12, borderRadius: 6, border: `1px solid ${C.g200}`, alignItems: "center" }}>
                                                    <input type="text" placeholder="Sede/Nombre" value={s.sede} onChange={e => updateSedeRow(idx, "sede", e.target.value)} style={{ ...S.input, padding: "6px 10px" }} />
                                                    <input type="text" placeholder="Dirección" value={s.direccion} onChange={e => updateSedeRow(idx, "direccion", e.target.value)} style={{ ...S.input, padding: "6px 10px" }} />
                                                    <input type="text" placeholder="Forma Atención" value={s.formaAtencion} onChange={e => updateSedeRow(idx, "formaAtencion", e.target.value)} style={{ ...S.input, padding: "6px 10px" }} />
                                                    <input type="text" placeholder="Días" value={s.dias} onChange={e => updateSedeRow(idx, "dias", e.target.value)} style={{ ...S.input, padding: "6px 10px" }} />
                                                    <input type="text" placeholder="Horario" value={s.horario} onChange={e => updateSedeRow(idx, "horario", e.target.value)} style={{ ...S.input, padding: "6px 10px" }} />
                                                    <button type="button" onClick={() => removeSedeRow(idx)} style={{ background: "none", border: "none", color: C.red, fontSize: 16, cursor: "pointer" }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${C.g200}`, paddingTop: 18, marginTop: "auto" }}>
                                <button type="button" onClick={() => setFormOpen(false)} style={{ background: "#FFFFFF", border: `1px solid ${C.g200}`, borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 600, color: C.g600, cursor: "pointer" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading} style={{ ...S.btn(C.navy3, C.white, C.navy4), padding: "8px 18px", fontSize: 12, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? "Guardando..." : "Guardar Institución"}
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
                                Vista Previa de Carga
                            </h3>
                            <button onClick={() => setUploadPreview(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: C.g400 }}>&times;</button>
                        </div>
                        <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.navy4 }}>{uploadPreview.items.length}</div>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Instituciones</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1.6rem", fontWeight: 700, color: C.green }}>{uploadPreview.totalSedes}</div>
                                    <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Sedes</div>
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
                                        <span style={{ color: C.g400, fontSize: "0.7rem" }}>{c.distrito} · {c.sedes?.length || 0} sedes</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", marginBottom: 8 }}>Modo de carga:</div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 6, border: `2px solid ${uploadMode === "merge" ? C.navy4 : C.g200}`, background: uploadMode === "merge" ? `${C.navy4}08` : C.white, cursor: "pointer" }}>
                                        <input type="radio" name="uploadMode" value="merge" checked={uploadMode === "merge"} onChange={() => setUploadMode("merge")} style={{ accentColor: C.navy4 }} />
                                        <div>
                                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.navy1 }}>Combinar (Upsert)</div>
                                            <div style={{ fontSize: "0.7rem", color: C.g500 }}>Actualiza existentes y agrega nuevas</div>
                                        </div>
                                    </label>
                                    <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 6, border: `2px solid ${uploadMode === "replace" ? C.red : C.g200}`, background: uploadMode === "replace" ? "#FEF2F208" : C.white, cursor: "pointer" }}>
                                        <input type="radio" name="uploadMode" value="replace" checked={uploadMode === "replace"} onChange={() => setUploadMode("replace")} style={{ accentColor: C.red }} />
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
                                    {loading ? "Subiendo..." : `Confirmar ${uploadMode === "merge" ? "Combinación" : "Reemplazo"} (${uploadPreview.items.length} CEBA)`}
                                </button>
                            </div>
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
