import { useState, useMemo, useRef, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis
} from "recharts";
import * as XLSX from "xlsx";

/* ═══════════════════════════════════════════════════════════
   PALETA — Reutiliza los colores del planificador
   ═══════════════════════════════════════════════════════════ */
const C = {
    navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
    gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
    g900: "#0F172A", g800: "#1E293B", g700: "#334155", g600: "#475569",
    g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
    g100: "#F1F5F9", g50: "#F8FAFC",
    white: "#FFFFFF",
    red: "#B91C1C", amber: "#B45309", green: "#15803D",
    indigo: "#4338CA", teal: "#0F766E", purple: "#7C3AED",
};

const CAT_COLORS = {
    "Maquinaria y Equipo": C.navy4,
    "Materiales de Oficina": C.indigo,
    "Materiales de Limpieza": C.teal,
    "Otros": C.g500,
};

const PRIORITY_LABELS = { 1: "Alta", 2: "Media", 3: "Baja" };
const PRIORITY_COLORS = { 1: C.red, 2: C.amber, 3: C.green };

/* ═══════════════════════════════════════════════════════════
   LOCAL STORAGE
   ═══════════════════════════════════════════════════════════ */
const LS_CEBA = "agebatp_requerimientos_ceba";
const LS_MATRIZ = "agebatp_matriz_referencia";

function loadLS(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
function saveLS(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

/* ═══════════════════════════════════════════════════════════
   ICON HELPER
   ═══════════════════════════════════════════════════════════ */
const Ico = ({ children, size = 18, color = C.g500 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>{children}</svg>
);
const Icons = {
    upload: (s, c) => <Ico size={s} color={c}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Ico>,
    file: (s, c) => <Ico size={s} color={c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></Ico>,
    check: (s, c) => <Ico size={s} color={c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Ico>,
    alert: (s, c) => <Ico size={s} color={c}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Ico>,
    users: (s, c) => <Ico size={s} color={c}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></Ico>,
    bar: (s, c) => <Ico size={s} color={c}><path d="M12 20V10M18 20V4M6 20v-4" /></Ico>,
    search: (s, c) => <Ico size={s} color={c}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Ico>,
    eye: (s, c) => <Ico size={s} color={c}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Ico>,
    trash: (s, c) => <Ico size={s} color={c}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Ico>,
    x: (s, c) => <Ico size={s} color={c}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Ico>,
    shield: (s, c) => <Ico size={s} color={c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Ico>,
    trend: (s, c) => <Ico size={s} color={c}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Ico>,
    grid: (s, c) => <Ico size={s} color={c}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></Ico>,
};

/* ═══════════════════════════════════════════════════════════
   EXCEL PARSER — Handles both Excel formats
   ═══════════════════════════════════════════════════════════ */
function parseExcelCEBA(data, fileName) {
    const wb = XLSX.read(data, { type: "array" });
    const results = [];

    for (const sname of wb.SheetNames) {
        const ws = wb.Sheets[sname];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!rows || rows.length < 15) continue;

        // Detect offset (some files have col 0 empty)
        let off = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const r = rows[i];
            if (r && r[0] === "" && r[1] && String(r[1]).includes("FICHA")) { off = 1; break; }
            if (r && String(r[0]).includes("FICHA")) { off = 0; break; }
        }

        // Extract CEBA info
        let nombre = "", distrito = "", direccion = "", codigoLocal = "", codigoModular = "";
        let director = "", dniDirector = "", celular = "", correo = "";
        let estudiantes = { inicial: 0, intermedio: 0, avanzado: 0, total: 0 };
        let docentes = { inicial: 0, intermedio: 0, avanzado: 0, total: 0 };
        let aulas = { inicial: 0, intermedio: 0, avanzado: 0, total: 0 };

        for (let i = 0; i < Math.min(rows.length, 25); i++) {
            const r = rows[i];
            if (!r) continue;
            const c0 = String(r[off] || "").toUpperCase().trim();
            const c1 = String(r[off + 1] || "").trim();

            if (c0 === "NOMBRE DEL CEBA") nombre = c1;
            if (c0 === "DISTRITO") distrito = c1;
            if (c0 === "DIRECCIÓN" || c0 === "DIRECCION") direccion = c1;
            if (c0 === "CODIGO LOCAL") codigoLocal = c1;
            if (c0.includes("NOMBRE DIRECTOR")) director = c1;
            if (c0.includes("DNI DEL DIRECTOR")) { dniDirector = c1; celular = String(r[off + 4] || r[off + 5] || "").trim(); }
            if (c0.includes("CORREO")) correo = c1;
            if (c0.includes("CODIGO LOCAL")) {
                const modIdx = r.findIndex((x, j) => j > off && String(x).toUpperCase().includes("CODIGO MODULAR"));
                if (modIdx > -1) codigoModular = String(r[modIdx + 1] || "").trim();
            }

            if (c0 === "INICIAL" || c0 === "INTERMEDIO" || c0 === "AVANZADO") {
                const key = c0.toLowerCase();
                estudiantes[key] = parseInt(r[off + 1]) || 0;
                docentes[key] = parseInt(r[off + 2]) || 0;
                // Aulas can be at different positions
                const aulaVal = parseInt(r[off + 5]) || parseInt(r[off + 6]) || parseInt(r[off + 4]) || 0;
                aulas[key] = aulaVal;
            }
        }

        estudiantes.total = estudiantes.inicial + estudiantes.intermedio + estudiantes.avanzado;
        docentes.total = docentes.inicial + docentes.intermedio + docentes.avanzado;
        aulas.total = aulas.inicial + aulas.intermedio + aulas.avanzado;

        // Extract items
        const items = [];
        let currentCategory = "Otros";
        const headerPatterns = ["DENOMINACIÓN", "DENOMINACION"];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (!r) continue;
            const c0 = String(r[off] || "").toUpperCase().trim();
            const c1 = String(r[off + 1] || "").toUpperCase().trim();
            const joined = c0 + " " + c1;

            // Detect category headers
            if (joined.includes("MAQUINARIA") || c0.includes("MAQUINARIA") || c1.includes("MAQUINARIA")) {
                currentCategory = "Maquinaria y Equipo"; continue;
            }
            if (joined.includes("MATERIALES DE OFICINA") || c0.includes("MATERIALES DE OFICINA") || c1.includes("MATERIALES DE OFICINA")) {
                currentCategory = "Materiales de Oficina"; continue;
            }
            if (joined.includes("MATERIALES DE LIMPIEZA") || c0.includes("MATERIALES DE LIMPIEZA") || c1.includes("MATERIALES DE LIMPIEZA")) {
                currentCategory = "Materiales de Limpieza"; continue;
            }

            // Skip header rows
            if (headerPatterns.some(p => c0.includes(p) || c1.includes(p))) continue;
            if (c0.includes("REQUERIMIENTO") || c1.includes("REQUERIMIENTO")) continue;
            if (c0.includes("ESPECIFICACIONES") || c1.includes("ESPECIFICACIONES")) continue;

            // Parse item rows
            const nombre_bien = String(r[off] || "").trim();
            if (!nombre_bien || nombre_bien.length < 3) continue;
            const cant = parseInt(r[off + 3]) || 0;
            if (cant === 0) continue;
            const unidad = String(r[off + 2] || "").trim();
            const prioridad = parseInt(r[off + 4]) || 0;
            const justificacion = String(r[off + 5] || "").trim();
            const specs = String(r[off + 1] || "").trim();

            items.push({
                bien: nombre_bien,
                especificaciones: specs,
                unidad: unidad || "unidad",
                cantidad: cant,
                prioridad: prioridad >= 1 && prioridad <= 3 ? prioridad : 0,
                justificacion,
                categoria: currentCategory,
            });
        }

        if (nombre || items.length > 0) {
            results.push({
                id: `CEBA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                nombre: nombre || fileName.replace(/\.xlsx?$/i, ""),
                distrito, direccion, codigoLocal, codigoModular,
                director, dniDirector, celular, correo,
                estudiantes, docentes, aulas,
                items,
                fileName,
                fechaCarga: new Date().toISOString(),
                sheet: sname,
            });
        }
    }

    return results;
}

/* Parse PRONOEPSA-style files (separate sheets) */
function parsePronoepsaStyle(data, fileName) {
    const wb = XLSX.read(data, { type: "array" });
    if (!wb.SheetNames.includes("Datos CEBA")) return [];

    const wsDatos = wb.Sheets["Datos CEBA"];
    const datosRows = XLSX.utils.sheet_to_json(wsDatos, { header: 1, defval: "" });

    let nombre = "", distrito = "", direccion = "", codigoLocal = "", codigoModular = "";
    let director = "", dniDirector = "", celular = "", correo = "";
    let estudiantes = { inicial: 0, intermedio: 0, avanzado: 0, total: 0 };
    let docentes = { inicial: 0, intermedio: 0, avanzado: 0, total: 0 };
    let aulas = { inicial: 0, intermedio: 0, avanzado: 0, total: 0 };

    if (datosRows.length > 1) {
        nombre = String(datosRows[1]?.[0] || "").trim();
        distrito = String(datosRows[1]?.[1] || "").trim();
        direccion = String(datosRows[1]?.[2] || "").trim();
        codigoLocal = String(datosRows[1]?.[3] || "").trim();
        codigoModular = String(datosRows[1]?.[4] || "").trim();
    }
    if (datosRows.length > 4) {
        director = String(datosRows[4]?.[0] || "").trim();
        dniDirector = String(datosRows[4]?.[1] || "").trim();
        correo = String(datosRows[4]?.[2] || "").trim();
        celular = String(datosRows[4]?.[3] || "").trim();
    }

    for (let i = 7; i < Math.min(datosRows.length, 12); i++) {
        const r = datosRows[i];
        const ciclo = String(r?.[0] || "").toUpperCase().trim();
        if (ciclo === "INICIAL" || ciclo === "INTERMEDIO" || ciclo === "AVANZADO") {
            const key = ciclo.toLowerCase();
            estudiantes[key] = parseInt(r[1]) || 0;
            docentes[key] = parseInt(r[2]) || 0;
            aulas[key] = parseInt(r[4]) || 0;
        }
    }
    estudiantes.total = estudiantes.inicial + estudiantes.intermedio + estudiantes.avanzado;
    docentes.total = docentes.inicial + docentes.intermedio + docentes.avanzado;
    aulas.total = aulas.inicial + aulas.intermedio + aulas.avanzado;

    // Parse items from other sheets
    const items = [];
    for (const sname of wb.SheetNames) {
        if (sname === "Datos CEBA") continue;
        const ws2 = wb.Sheets[sname];
        const rows2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: "" });
        let currentCategory = sname.includes("Maquinaria") ? "Maquinaria y Equipo" : sname.includes("Oficina") ? "Materiales de Oficina" : sname.includes("Limpieza") ? "Materiales de Limpieza" : "Otros";

        for (let i = 0; i < rows2.length; i++) {
            const r = rows2[i];
            const c0 = String(r[0] || "").toUpperCase().trim();
            if (c0.includes("DENOMINACIÓN") || c0.includes("DENOMINACION") || c0.includes("ESPECIFICACIONES")) continue;
            if (c0.includes("MATERIALES DE OFICINA")) { currentCategory = "Materiales de Oficina"; continue; }
            if (c0.includes("MATERIALES DE LIMPIEZA")) { currentCategory = "Materiales de Limpieza"; continue; }
            if (c0.includes("MAQUINARIA")) { currentCategory = "Maquinaria y Equipo"; continue; }

            const bien = String(r[0] || "").trim();
            if (!bien || bien.length < 3) continue;
            const cant = parseInt(r[3]) || 0;
            if (cant === 0) continue;

            items.push({
                bien,
                especificaciones: String(r[1] || "").trim(),
                unidad: String(r[2] || "unidad").trim(),
                cantidad: cant,
                prioridad: parseInt(r[4]) || 0,
                justificacion: String(r[5] || "").trim(),
                categoria: currentCategory,
            });
        }
    }

    return [{
        id: `CEBA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        nombre: nombre || fileName.replace(/\.xlsx?$/i, ""),
        distrito, direccion, codigoLocal, codigoModular,
        director, dniDirector, celular, correo,
        estudiantes, docentes, aulas,
        items, fileName,
        fechaCarga: new Date().toISOString(),
        sheet: "multi",
    }];
}

/* ═══════════════════════════════════════════════════════════
   NORMALIZE ITEM NAME for matching with reference matrix
   ═══════════════════════════════════════════════════════════ */
function normalizeItemName(name) {
    return String(name).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/* ═══════════════════════════════════════════════════════════
   TOOLTIP COMPONENT
   ═══════════════════════════════════════════════════════════ */
function CTip({ active, payload, label }) {
    if (!active || !payload) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'" }}>
            <p style={{ color: C.g600, fontSize: "0.78rem", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill, fontSize: "0.8rem", margin: "2px 0", fontWeight: 600 }}>{p.name}: <span style={{ fontFamily: "'JetBrains Mono'" }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span></p>)}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function RequerimientosCEBA() {
    const [cebas, setCebas] = useState(() => loadLS(LS_CEBA) || []);
    const [matriz, setMatriz] = useState(() => loadLS(LS_MATRIZ) || []);
    const [view, setView] = useState("dashboard");
    const [selectedCeba, setSelectedCeba] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [filterCategoria, setFilterCategoria] = useState("todas");
    const [filterDistrito, setFilterDistrito] = useState("todos");
    const [showViabilidad, setShowViabilidad] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [matrizDragOver, setMatrizDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const fileRef = useRef(null);
    const matrizRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    /* ── Persist ── */
    const saveCebas = useCallback((data) => {
        setCebas(data);
        saveLS(LS_CEBA, data);
    }, []);

    const saveMatriz = useCallback((data) => {
        setMatriz(data);
        saveLS(LS_MATRIZ, data);
    }, []);

    /* ── Upload CEBA Excel ── */
    const processFile = useCallback((file) => {
        if (!file || !file.name.match(/\.xlsx?$/i)) { setError("Solo archivos .xlsx o .xls"); return; }
        setProcessing(true); setError("");
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                let parsed;
                // Detect PRONOEPSA style
                const wb = XLSX.read(data, { type: "array", bookSheets: true });
                if (wb.SheetNames.includes("Datos CEBA")) {
                    parsed = parsePronoepsaStyle(data, file.name);
                } else {
                    parsed = parseExcelCEBA(data, file.name);
                }
                if (parsed.length === 0) {
                    setError("No se pudo extraer datos del archivo. Verifique el formato.");
                } else {
                    const updated = [...cebas.filter(c => c.nombre !== parsed[0].nombre), ...parsed];
                    saveCebas(updated);
                    showToast(`${parsed.length} CEBA procesado: ${parsed[0].nombre} (${parsed[0].items.length} items)`);
                }
            } catch (err) {
                setError(`Error procesando archivo: ${err.message}`);
            }
            setProcessing(false);
        };
        reader.onerror = () => { setError("Error leyendo el archivo"); setProcessing(false); };
        reader.readAsArrayBuffer(file);
    }, [cebas, saveCebas]);

    /* ── Upload Matriz Referencia ── */
    const processMatriz = useCallback((file) => {
        if (!file || !file.name.match(/\.xlsx?$/i)) { setError("Solo archivos .xlsx o .xls"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                const items = [];
                for (let i = 1; i < rows.length; i++) {
                    const r = rows[i];
                    const nombre = String(r[0] || "").trim();
                    const precio = parseFloat(r[1]) || 0;
                    if (nombre && precio > 0) {
                        items.push({ nombre, nombreNorm: normalizeItemName(nombre), precio, categoria: String(r[2] || "").trim() });
                    }
                }
                saveMatriz(items);
                showToast(`Matriz de referencia cargada: ${items.length} bienes con precio unitario`);
            } catch (err) { setError(`Error en matriz: ${err.message}`); }
        };
        reader.readAsArrayBuffer(file);
    }, [saveMatriz]);

    /* ── Match items with reference matrix ── */
    const getRefPrice = useCallback((itemName) => {
        if (matriz.length === 0) return null;
        const norm = normalizeItemName(itemName);
        // Exact match
        let match = matriz.find(m => m.nombreNorm === norm);
        if (match) return match.precio;
        // Partial match
        match = matriz.find(m => norm.includes(m.nombreNorm) || m.nombreNorm.includes(norm));
        if (match) return match.precio;
        // Word match
        const words = norm.split(" ").filter(w => w.length > 3);
        for (const m of matriz) {
            const mWords = m.nombreNorm.split(" ").filter(w => w.length > 3);
            const commonWords = words.filter(w => mWords.some(mw => mw.includes(w) || w.includes(mw)));
            if (commonWords.length >= Math.max(1, Math.min(words.length, mWords.length) * 0.5)) return m.precio;
        }
        return null;
    }, [matriz]);

    /* ── Computed data ── */
    const distritos = useMemo(() => [...new Set(cebas.map(c => c.distrito).filter(Boolean))].sort(), [cebas]);

    const filteredCebas = useMemo(() => {
        let f = [...cebas];
        if (filterDistrito !== "todos") f = f.filter(c => c.distrito === filterDistrito);
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            f = f.filter(c => c.nombre.toLowerCase().includes(q) || c.distrito.toLowerCase().includes(q) || c.director.toLowerCase().includes(q));
        }
        return f;
    }, [cebas, filterDistrito, searchText]);

    const allItems = useMemo(() => {
        return filteredCebas.flatMap(c => c.items.map(it => ({ ...it, cebaId: c.id, cebaNombre: c.nombre, cebaDistrito: c.distrito, cebaEstudiantes: c.estudiantes.total, cebaAulas: c.aulas.total })));
    }, [filteredCebas]);

    const filteredItems = useMemo(() => {
        if (filterCategoria === "todas") return allItems;
        return allItems.filter(it => it.categoria === filterCategoria);
    }, [allItems, filterCategoria]);

    /* ── KPIs ── */
    const kpis = useMemo(() => {
        const totalCebas = filteredCebas.length;
        const totalEstudiantes = filteredCebas.reduce((s, c) => s + c.estudiantes.total, 0);
        const totalDocentes = filteredCebas.reduce((s, c) => s + c.docentes.total, 0);
        const totalAulas = filteredCebas.reduce((s, c) => s + c.aulas.total, 0);
        const totalItems = filteredItems.length;
        const totalCantidad = filteredItems.reduce((s, it) => s + it.cantidad, 0);

        // Viabilidad
        let totalImpacto = 0;
        let itemsConPrecio = 0;
        filteredItems.forEach(it => {
            const precio = getRefPrice(it.bien);
            if (precio) { totalImpacto += precio * it.cantidad; itemsConPrecio++; }
        });

        // Anomalies
        const anomalias = [];
        filteredCebas.forEach(c => {
            const cebaItems = c.items;
            const equipos = cebaItems.filter(it => it.categoria === "Maquinaria y Equipo");
            const totalEquipos = equipos.reduce((s, it) => s + it.cantidad, 0);
            if (c.estudiantes.total > 0 && totalEquipos > c.estudiantes.total * 0.5) {
                anomalias.push({ ceba: c.nombre, tipo: "Exceso equipos", detalle: `${totalEquipos} equipos para ${c.estudiantes.total} estudiantes (ratio ${(totalEquipos / c.estudiantes.total).toFixed(1)})`, severidad: "alta" });
            }
            const laptops = cebaItems.filter(it => normalizeItemName(it.bien).includes("laptop"));
            const totalLaptops = laptops.reduce((s, it) => s + it.cantidad, 0);
            if (c.estudiantes.total > 0 && totalLaptops > c.estudiantes.total * 0.3) {
                anomalias.push({ ceba: c.nombre, tipo: "Laptops desproporcionadas", detalle: `${totalLaptops} laptops para ${c.estudiantes.total} estudiantes`, severidad: "alta" });
            }
            if (c.aulas.total > 0) {
                const tvs = cebaItems.filter(it => normalizeItemName(it.bien).includes("televisor") || normalizeItemName(it.bien).includes("tv"));
                const totalTvs = tvs.reduce((s, it) => s + it.cantidad, 0);
                if (totalTvs > c.aulas.total * 1.5) {
                    anomalias.push({ ceba: c.nombre, tipo: "TVs exceden aulas", detalle: `${totalTvs} televisores para ${c.aulas.total} aulas`, severidad: "media" });
                }
            }
        });

        return { totalCebas, totalEstudiantes, totalDocentes, totalAulas, totalItems, totalCantidad, totalImpacto, itemsConPrecio, anomalias };
    }, [filteredCebas, filteredItems, getRefPrice]);

    /* ── Chart data ── */
    const cebaComparisonData = useMemo(() => {
        return filteredCebas.map(c => ({
            nombre: c.nombre.length > 20 ? c.nombre.substring(0, 20) + "..." : c.nombre,
            fullName: c.nombre,
            Estudiantes: c.estudiantes.total,
            "Items Solicitados": c.items.length,
            "Cant. Total": c.items.reduce((s, it) => s + it.cantidad, 0),
        })).sort((a, b) => b.Estudiantes - a.Estudiantes);
    }, [filteredCebas]);

    const categoriaDistribution = useMemo(() => {
        const cats = {};
        filteredItems.forEach(it => {
            if (!cats[it.categoria]) cats[it.categoria] = { name: it.categoria, value: 0, count: 0 };
            cats[it.categoria].value += it.cantidad;
            cats[it.categoria].count++;
        });
        return Object.values(cats);
    }, [filteredItems]);

    const scatterData = useMemo(() => {
        return filteredCebas.map(c => ({
            name: c.nombre,
            x: c.estudiantes.total,
            y: c.items.reduce((s, it) => s + it.cantidad, 0),
            z: c.aulas.total || 1,
        }));
    }, [filteredCebas]);

    const impactoData = useMemo(() => {
        if (!showViabilidad || matriz.length === 0) return [];
        return filteredCebas.map(c => {
            let impacto = 0;
            c.items.forEach(it => {
                const precio = getRefPrice(it.bien);
                if (precio) impacto += precio * it.cantidad;
            });
            return { nombre: c.nombre.length > 18 ? c.nombre.substring(0, 18) + "..." : c.nombre, "Indice de Impacto": Math.round(impacto) };
        }).filter(d => d["Indice de Impacto"] > 0).sort((a, b) => b["Indice de Impacto"] - a["Indice de Impacto"]);
    }, [filteredCebas, showViabilidad, matriz, getRefPrice]);

    const distritoData = useMemo(() => {
        const map = {};
        filteredCebas.forEach(c => {
            const d = c.distrito || "Sin distrito";
            if (!map[d]) map[d] = { distrito: d, cebas: 0, estudiantes: 0, items: 0 };
            map[d].cebas++;
            map[d].estudiantes += c.estudiantes.total;
            map[d].items += c.items.reduce((s, it) => s + it.cantidad, 0);
        });
        return Object.values(map).sort((a, b) => b.estudiantes - a.estudiantes);
    }, [filteredCebas]);

    /* ── Delete CEBA ── */
    const deleteCeba = (id) => {
        const updated = cebas.filter(c => c.id !== id);
        saveCebas(updated);
        if (selectedCeba?.id === id) setSelectedCeba(null);
        showToast("CEBA eliminado");
    };

    /* ── Styles ── */
    const card = { background: C.white, borderRadius: 10, border: `1px solid ${C.g200}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };
    const h3s = { color: C.navy1, fontSize: "1.05rem", margin: "0 0 16px", fontFamily: "'DM Serif Display',serif" };
    const inputS = { padding: "9px 14px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.g900, fontFamily: "'DM Sans'", fontSize: 13, outline: "none", boxSizing: "border-box" };
    const btnTab = (on) => ({ padding: "7px 16px", border: "none", cursor: "pointer", background: on ? C.navy3 : "transparent", color: on ? C.white : C.g500, fontSize: "0.78rem", fontWeight: on ? 700 : 500, fontFamily: "'DM Sans'", borderRadius: 0, transition: "all 0.15s" });
    const badge = (bg, fg, bdr) => ({ fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: bg, color: fg, border: `1px solid ${bdr || fg + "30"}`, fontFamily: "'JetBrains Mono'", letterSpacing: "0.04em" });

    const PIE_COLORS = [C.navy4, C.indigo, C.teal, C.gold2, C.purple, C.red];

    return (
        <div>
            {/* Toast */}
            {toast && <div style={{ position: "fixed", top: 80, right: 28, zIndex: 200, padding: "10px 20px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECACA"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'", animation: "fadeIn 0.2s ease" }}>{toast.msg}</div>}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.35rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Requerimientos CEBA</h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>Analisis de requerimientos anuales — {cebas.length} CEBA registrados — {new Date().getFullYear()}</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.g200}` }}>
                        {[["dashboard", "Dashboard"], ["cebas", "CEBA"], ["items", "Items"], ["carga", "Carga"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} style={btnTab(view === v)}>{l}</button>)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            {view !== "carga" && cebas.length > 0 && (
                <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                        <input placeholder="Buscar CEBA, distrito, director..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ ...inputS, width: "100%", paddingLeft: 36 }} />
                        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>{Icons.search(16, C.g400)}</div>
                    </div>
                    <select value={filterDistrito} onChange={e => setFilterDistrito(e.target.value)} style={{ ...inputS, minWidth: 160 }}>
                        <option value="todos">Todos los distritos</option>
                        {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} style={{ ...inputS, minWidth: 180 }}>
                        <option value="todas">Todas las categorias</option>
                        <option value="Maquinaria y Equipo">Maquinaria y Equipo</option>
                        <option value="Materiales de Oficina">Materiales de Oficina</option>
                        <option value="Materiales de Limpieza">Materiales de Limpieza</option>
                    </select>
                    {matriz.length > 0 && (
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: showViabilidad ? C.navy4 : C.g500, fontFamily: "'DM Sans'", padding: "7px 14px", borderRadius: 8, border: `1px solid ${showViabilidad ? C.navy4 : C.g200}`, background: showViabilidad ? `${C.navy4}08` : C.white, transition: "all 0.2s", userSelect: "none" }}>
                            <input type="checkbox" checked={showViabilidad} onChange={e => setShowViabilidad(e.target.checked)} style={{ accentColor: C.navy4, width: 16, height: 16 }} />
                            {Icons.shield(14, showViabilidad ? C.navy4 : C.g400)}
                            Proyeccion de Viabilidad
                        </label>
                    )}
                </div>
            )}

            {/* ══════ VISTA DASHBOARD ══════ */}
            {view === "dashboard" && cebas.length > 0 && (
                <div>
                    {/* KPIs */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12, marginBottom: 20 }}>
                        {[
                            { label: "CEBA Registrados", value: kpis.totalCebas, border: C.navy4, icon: Icons.grid },
                            { label: "Total Estudiantes", value: kpis.totalEstudiantes.toLocaleString(), border: C.green, icon: Icons.users },
                            { label: "Total Docentes", value: kpis.totalDocentes.toLocaleString(), border: C.teal, icon: Icons.users },
                            { label: "Total Aulas", value: kpis.totalAulas, border: C.indigo, icon: Icons.grid },
                            { label: "Items Solicitados", value: kpis.totalItems.toLocaleString(), border: C.gold2, icon: Icons.file },
                            { label: "Cantidad Total", value: kpis.totalCantidad.toLocaleString(), border: C.amber, icon: Icons.bar },
                        ].map((k, i) => (
                            <div key={i} style={{ ...card, padding: "18px 16px", borderLeft: `4px solid ${k.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <p style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'" }}>{k.label}</p>
                                        <p style={{ color: C.navy1, fontSize: "1.5rem", margin: "4px 0 0", fontFamily: "'DM Serif Display',serif" }}>{k.value}</p>
                                    </div>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${k.border}12` }}>{k.icon(16, k.border)}</div>
                                </div>
                            </div>
                        ))}
                        {showViabilidad && kpis.totalImpacto > 0 && (
                            <div style={{ ...card, padding: "18px 16px", borderLeft: `4px solid ${C.purple}`, gridColumn: "span 2" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <p style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans'" }}>Indice de Impacto Presupuestal</p>
                                        <p style={{ color: C.purple, fontSize: "1.5rem", margin: "4px 0 0", fontFamily: "'DM Serif Display',serif" }}>S/ {kpis.totalImpacto.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                                        <p style={{ color: C.g400, fontSize: "0.7rem", margin: "2px 0 0", fontFamily: "'DM Sans'" }}>{kpis.itemsConPrecio} items con referencia de {kpis.totalItems} totales</p>
                                    </div>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.purple}12` }}>{Icons.shield(16, C.purple)}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Anomalías */}
                    {kpis.anomalias.length > 0 && (
                        <div style={{ ...card, padding: 16, marginBottom: 20, borderLeft: `4px solid ${C.red}` }}>
                            <h3 style={{ ...h3s, color: C.red, fontSize: "0.9rem", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>{Icons.alert(16, C.red)} Alertas de Proporcionalidad ({kpis.anomalias.length})</h3>
                            {kpis.anomalias.map((a, i) => (
                                <div key={i} style={{ padding: "8px 12px", background: a.severidad === "alta" ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${a.severidad === "alta" ? "#FECACA" : "#FDE68A"}`, borderRadius: 6, marginBottom: 6, fontSize: "0.78rem", fontFamily: "'DM Sans'" }}>
                                    <span style={{ fontWeight: 700, color: a.severidad === "alta" ? C.red : C.amber }}>{a.ceba}</span>
                                    <span style={{ color: C.g600 }}> — {a.tipo}: {a.detalle}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Charts */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }} className="grid-calendar">
                        <div style={{ ...card, padding: 20 }}>
                            <h3 style={h3s}>Comparativo por CEBA — Estudiantes vs Requerimientos</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={cebaComparisonData} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                    <XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 9, fontFamily: "'DM Sans'" }} angle={-20} textAnchor="end" height={60} />
                                    <YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                    <Tooltip content={<CTip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                    <Bar dataKey="Estudiantes" fill={C.green} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Cant. Total" fill={C.navy4} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ ...card, padding: 20 }}>
                            <h3 style={h3s}>Distribucion por Categoria</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={categoriaDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                                        {categoriaDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CTip />} />
                                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'DM Sans'" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Scatter + Distrito */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="grid-calendar">
                        <div style={{ ...card, padding: 20 }}>
                            <h3 style={h3s}>Estudiantes vs Cantidad Solicitada</h3>
                            <p style={{ color: C.g400, fontSize: "0.72rem", margin: "-10px 0 12px", fontFamily: "'DM Sans'" }}>Tamano del punto = numero de aulas</p>
                            <ResponsiveContainer width="100%" height={260}>
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                    <XAxis dataKey="x" name="Estudiantes" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                    <YAxis dataKey="y" name="Cant. Solicitada" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                    <ZAxis dataKey="z" range={[40, 400]} />
                                    <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                                        if (!active || !payload?.[0]) return null;
                                        const d = payload[0].payload;
                                        return <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'", fontSize: "0.78rem" }}><p style={{ fontWeight: 700, color: C.navy1, margin: "0 0 4px" }}>{d.name}</p><p style={{ color: C.g600, margin: "2px 0" }}>Estudiantes: {d.x}</p><p style={{ color: C.g600, margin: "2px 0" }}>Items solicitados: {d.y}</p><p style={{ color: C.g600, margin: "2px 0" }}>Aulas: {d.z}</p></div>;
                                    }} />
                                    <Scatter data={scatterData} fill={C.navy4} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ ...card, padding: 20 }}>
                            <h3 style={h3s}>Distribucion por Distrito</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={distritoData} layout="vertical" barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                    <XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                                    <YAxis dataKey="distrito" type="category" width={100} tick={{ fill: C.g500, fontSize: 9, fontFamily: "'DM Sans'" }} />
                                    <Tooltip content={<CTip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
                                    <Bar dataKey="estudiantes" name="Estudiantes" fill={C.green} radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="items" name="Items" fill={C.navy4} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Impacto chart (solo si viabilidad activo) */}
                    {showViabilidad && impactoData.length > 0 && (
                        <div style={{ ...card, padding: 20, marginBottom: 16, borderTop: `3px solid ${C.purple}` }}>
                            <h3 style={{ ...h3s, display: "flex", alignItems: "center", gap: 8 }}>{Icons.shield(16, C.purple)} Indice de Impacto Presupuestal por CEBA</h3>
                            <p style={{ color: C.g400, fontSize: "0.72rem", margin: "-10px 0 12px", fontFamily: "'DM Sans'" }}>Proyeccion referencial basada en la matriz de precios unitarios — Solo fines de analisis interno</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={impactoData} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                    <XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 9, fontFamily: "'DM Sans'" }} angle={-15} textAnchor="end" height={60} />
                                    <YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload?.[0]) return null;
                                        return <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans'" }}><p style={{ fontWeight: 600, color: C.g600, fontSize: "0.78rem", margin: "0 0 4px" }}>{label}</p><p style={{ color: C.purple, fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>Indice: S/ {payload[0].value.toLocaleString("es-PE")}</p></div>;
                                    }} />
                                    <Bar dataKey="Indice de Impacto" fill={C.purple} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* ══════ VISTA CEBAS ══════ */}
            {view === "cebas" && (
                <div>
                    {filteredCebas.length === 0 ? (
                        <div style={{ ...card, textAlign: "center", padding: 60 }}>
                            {Icons.file(48, C.g300)}
                            <h3 style={{ color: C.navy1, fontSize: "1.15rem", margin: "16px 0 8px", fontFamily: "'DM Serif Display',serif" }}>Sin CEBA registrados</h3>
                            <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>Sube archivos Excel de requerimientos desde la vista "Carga"</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                            {filteredCebas.map(c => {
                                const totalItems = c.items.reduce((s, it) => s + it.cantidad, 0);
                                const ratio = c.estudiantes.total > 0 ? (totalItems / c.estudiantes.total).toFixed(1) : "N/A";
                                let impacto = 0;
                                if (showViabilidad) c.items.forEach(it => { const p = getRefPrice(it.bien); if (p) impacto += p * it.cantidad; });

                                return (
                                    <div key={c.id} onClick={() => setSelectedCeba(c)} style={{ ...card, padding: 18, cursor: "pointer", transition: "all 0.2s", borderLeft: `4px solid ${C.navy4}` }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${C.navy4}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Sans'" }}>{c.nombre}</div>
                                                <div style={{ fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginTop: 2 }}>{c.distrito} — {c.director}</div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteCeba(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>{Icons.trash(14, C.g400)}</button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                                            {[
                                                ["Estudiantes", c.estudiantes.total, C.green],
                                                ["Docentes", c.docentes.total, C.teal],
                                                ["Aulas", c.aulas.total, C.indigo],
                                            ].map(([l, v, cl]) => (
                                                <div key={l} style={{ textAlign: "center", padding: "6px 0", background: C.g50, borderRadius: 6 }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "1rem", fontWeight: 700, color: cl }}>{v}</div>
                                                    <div style={{ fontSize: "0.6rem", color: C.g500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: C.g600, fontFamily: "'DM Sans'" }}>
                                            <span>{c.items.length} items — {totalItems} unidades</span>
                                            <span style={badge(ratio > 5 ? "#FEF2F2" : "#F0FDF4", ratio > 5 ? C.red : C.green)}>Ratio: {ratio}</span>
                                        </div>
                                        {showViabilidad && impacto > 0 && (
                                            <div style={{ marginTop: 8, padding: "6px 10px", background: `${C.purple}08`, border: `1px solid ${C.purple}20`, borderRadius: 6, fontSize: "0.72rem", color: C.purple, fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>
                                                Indice: S/ {impacto.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════ VISTA ITEMS ══════ */}
            {view === "items" && (
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", background: `${C.navy4}08`, borderBottom: `2px solid ${C.navy4}20` }}>
                        <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Todos los Items Solicitados ({filteredItems.length})</h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 70px 70px 55px 150px", padding: "10px 14px", gap: 6, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 700 }}>
                            {["#", "Bien", "CEBA", "Cant.", "Unidad", "Prior.", "Categoria"].map(h => <p key={h} style={{ color: C.g500, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, fontFamily: "'DM Sans'" }}>{h}</p>)}
                        </div>
                        {filteredItems.slice(0, 200).map((it, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 70px 70px 55px 150px", alignItems: "center", padding: "10px 14px", gap: 6, borderBottom: `1px solid ${C.g100}`, minWidth: 700, transition: "background 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.72rem", color: C.g400, fontWeight: 600 }}>{i + 1}</div>
                                <div>
                                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: C.navy1, margin: 0, fontFamily: "'DM Sans'" }}>{it.bien}</p>
                                    {it.especificaciones && <p style={{ fontSize: "0.68rem", color: C.g400, margin: "2px 0 0", fontFamily: "'DM Sans'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{it.especificaciones}</p>}
                                </div>
                                <p style={{ fontSize: "0.72rem", color: C.g600, margin: 0, fontFamily: "'DM Sans'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.cebaNombre}</p>
                                <p style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.82rem", fontWeight: 700, color: C.navy1, margin: 0, textAlign: "center" }}>{it.cantidad}</p>
                                <p style={{ fontSize: "0.68rem", color: C.g500, margin: 0, fontFamily: "'DM Sans'" }}>{it.unidad}</p>
                                <div style={{ textAlign: "center" }}>
                                    {it.prioridad >= 1 && it.prioridad <= 3 ? (
                                        <span style={badge(it.prioridad === 1 ? "#FEF2F2" : it.prioridad === 2 ? "#FFFBEB" : "#F0FDF4", PRIORITY_COLORS[it.prioridad])}>{PRIORITY_LABELS[it.prioridad]}</span>
                                    ) : <span style={{ color: C.g400, fontSize: "0.65rem" }}>—</span>}
                                </div>
                                <span style={badge(`${CAT_COLORS[it.categoria] || C.g500}12`, CAT_COLORS[it.categoria] || C.g500)}>{it.categoria}</span>
                            </div>
                        ))}
                        {filteredItems.length > 200 && <div style={{ padding: 14, textAlign: "center", color: C.g400, fontSize: "0.82rem" }}>Mostrando 200 de {filteredItems.length} items</div>}
                    </div>
                </div>
            )}

            {/* ══════ VISTA CARGA ══════ */}
            {view === "carga" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="grid-calendar">
                    {/* Upload CEBA */}
                    <div style={{ ...card, padding: 24 }}>
                        <h3 style={h3s}>Carga de Requerimientos CEBA</h3>
                        <p style={{ color: C.g500, fontSize: "0.78rem", margin: "-10px 0 16px", fontFamily: "'DM Sans'" }}>Suba los archivos Excel (.xlsx) enviados por los CEBA con sus fichas de requerimientos.</p>
                        <div
                            onDrop={e => { e.preventDefault(); setDragOver(false); const files = [...e.dataTransfer.files]; files.forEach(f => processFile(f)); }}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileRef.current?.click()}
                            style={{ border: `2px dashed ${dragOver ? C.navy4 : C.g300}`, borderRadius: 8, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? `${C.navy4}08` : C.g50, transition: "all 0.2s" }}
                        >
                            <input ref={fileRef} type="file" accept=".xlsx,.xls" multiple onChange={e => { [...(e.target.files || [])].forEach(f => processFile(f)); e.target.value = ""; }} style={{ display: "none" }} />
                            {processing ? (
                                <div style={{ color: C.navy4, fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600 }}>Procesando archivo...</div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 8 }}>{Icons.upload(32, dragOver ? C.navy4 : C.g400)}</div>
                                    <div style={{ color: C.navy1, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'", marginBottom: 4 }}>Arrastre archivos Excel de CEBA aqui</div>
                                    <div style={{ color: C.g400, fontSize: 11, fontFamily: "'DM Sans'" }}>o haga click para seleccionar (.xlsx) — Multiples archivos permitidos</div>
                                </>
                            )}
                        </div>
                        {error && <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA", color: C.red, fontSize: 12, fontFamily: "'DM Sans'" }}>{error}</div>}

                        {/* Lista de CEBA cargados */}
                        {cebas.length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'DM Sans'" }}>CEBA Cargados ({cebas.length})</div>
                                {cebas.map(c => (
                                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 6, marginBottom: 4, fontSize: "0.78rem", fontFamily: "'DM Sans'" }}>
                                        {Icons.check(14, C.green)}
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 600, color: C.navy1 }}>{c.nombre}</span>
                                            <span style={{ color: C.g400, marginLeft: 8 }}>— {c.items.length} items — {c.estudiantes.total} est.</span>
                                        </div>
                                        <button onClick={() => deleteCeba(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>{Icons.trash(14, C.g400)}</button>
                                    </div>
                                ))}
                                <button onClick={() => { saveCebas([]); showToast("Todos los datos eliminados"); }} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.red}`, background: C.white, color: C.red, fontSize: "0.72rem", fontWeight: 600, fontFamily: "'DM Sans'", cursor: "pointer" }}>Limpiar todos los datos</button>
                            </div>
                        )}
                    </div>

                    {/* Upload Matriz Referencia */}
                    <div style={{ ...card, padding: 24 }}>
                        <h3 style={{ ...h3s, display: "flex", alignItems: "center", gap: 8 }}>{Icons.shield(16, C.navy4)} Matriz de Referencia (Opcional)</h3>
                        <p style={{ color: C.g500, fontSize: "0.78rem", margin: "-10px 0 16px", fontFamily: "'DM Sans'" }}>
                            Excel con precios unitarios referenciales. Columnas: Nombre del Bien | Precio Unitario | Categoria (opcional).
                            Esto habilita el "Indice de Impacto Presupuestal" para analisis interno.
                        </p>
                        <div
                            onDrop={e => { e.preventDefault(); setMatrizDragOver(false); processMatriz(e.dataTransfer.files[0]); }}
                            onDragOver={e => { e.preventDefault(); setMatrizDragOver(true); }}
                            onDragLeave={() => setMatrizDragOver(false)}
                            onClick={() => matrizRef.current?.click()}
                            style={{ border: `2px dashed ${matrizDragOver ? C.purple : C.g300}`, borderRadius: 8, padding: "30px 20px", textAlign: "center", cursor: "pointer", background: matrizDragOver ? `${C.purple}08` : C.g50, transition: "all 0.2s" }}
                        >
                            <input ref={matrizRef} type="file" accept=".xlsx,.xls" onChange={e => { if (e.target.files?.[0]) processMatriz(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
                            <div style={{ marginBottom: 6 }}>{Icons.upload(24, matrizDragOver ? C.purple : C.g400)}</div>
                            <div style={{ color: C.navy1, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans'" }}>Subir Matriz de Referencia (.xlsx)</div>
                        </div>
                        {matriz.length > 0 && (
                            <div style={{ marginTop: 14, padding: "10px 14px", background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    {Icons.check(14, C.green)}
                                    <span style={{ fontSize: "0.78rem", color: C.green, fontWeight: 600, fontFamily: "'DM Sans'" }}>Matriz cargada: {matriz.length} bienes con precio</span>
                                </div>
                                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                    {matriz.slice(0, 20).map((m, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "0.72rem", color: C.g600, fontFamily: "'DM Sans'", borderBottom: `1px solid ${C.g100}` }}>
                                            <span>{m.nombre}</span>
                                            <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: C.navy1 }}>S/ {m.precio.toLocaleString("es-PE")}</span>
                                        </div>
                                    ))}
                                    {matriz.length > 20 && <div style={{ fontSize: "0.68rem", color: C.g400, textAlign: "center", padding: 4 }}>...y {matriz.length - 20} mas</div>}
                                </div>
                                <button onClick={() => { saveMatriz([]); setShowViabilidad(false); showToast("Matriz eliminada"); }} style={{ marginTop: 8, padding: "4px 12px", borderRadius: 4, border: `1px solid ${C.g300}`, background: C.white, color: C.g600, fontSize: "0.68rem", fontFamily: "'DM Sans'", cursor: "pointer" }}>Eliminar matriz</button>
                            </div>
                        )}

                        {/* Instructions */}
                        <div style={{ marginTop: 20, padding: 16, background: C.g50, borderRadius: 8, border: `1px solid ${C.g100}` }}>
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy1, marginBottom: 8, fontFamily: "'DM Sans'" }}>Formato esperado de la Matriz</div>
                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "0.68rem", color: C.g600, lineHeight: 2 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: 4, padding: "4px 8px", background: C.white, borderRadius: 4, border: `1px solid ${C.g200}`, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700 }}>Nombre del Bien</span><span style={{ fontWeight: 700 }}>Precio</span><span style={{ fontWeight: 700 }}>Categoria</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: 4, padding: "4px 8px" }}>
                                    <span>Laptop</span><span>2500</span><span>Equipo</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: 4, padding: "4px 8px" }}>
                                    <span>Papel Bond A4</span><span>25</span><span>Oficina</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: 4, padding: "4px 8px" }}>
                                    <span>Escoba</span><span>12</span><span>Limpieza</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state for dashboard */}
            {view === "dashboard" && cebas.length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 60 }}>
                    {Icons.file(48, C.g300)}
                    <h3 style={{ color: C.navy1, fontSize: "1.2rem", margin: "16px 0 8px", fontFamily: "'DM Serif Display',serif" }}>Sin datos de requerimientos</h3>
                    <p style={{ color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'", maxWidth: 420, margin: "0 auto" }}>
                        Suba los archivos Excel de requerimientos de los CEBA desde la vista "Carga" para ver el dashboard de analisis.
                    </p>
                    <button onClick={() => setView("carga")} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "none", background: C.navy3, color: C.white, fontSize: "0.85rem", fontWeight: 600, fontFamily: "'DM Sans'", cursor: "pointer" }}>Ir a Carga de Datos</button>
                </div>
            )}

            {/* ══════ MODAL DETALLE CEBA ══════ */}
            {selectedCeba && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }} onClick={() => setSelectedCeba(null)}>
                    <div style={{ ...card, padding: 0, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto", borderRadius: 12 }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ background: C.navy3, padding: "20px 24px", borderRadius: "12px 12px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div style={{ color: C.white, fontSize: "1.1rem", fontWeight: 700, fontFamily: "'DM Serif Display',serif" }}>{selectedCeba.nombre}</div>
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.78rem", marginTop: 4, fontFamily: "'DM Sans'" }}>{selectedCeba.distrito} — {selectedCeba.direccion}</div>
                            </div>
                            <button onClick={() => setSelectedCeba(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1 }}>&times;</button>
                        </div>

                        <div style={{ padding: "20px 24px" }}>
                            {/* Info grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                {[
                                    ["Director(a)", selectedCeba.director],
                                    ["Correo", selectedCeba.correo],
                                    ["Celular", selectedCeba.celular],
                                    ["Codigo Local", selectedCeba.codigoLocal],
                                ].map(([l, v]) => (
                                    <div key={l}>
                                        <div style={{ fontSize: 10, color: C.g500, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans'" }}>{l}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy1, marginTop: 2, fontFamily: "'DM Sans'" }}>{v || "--"}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Demographics */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
                                {[
                                    ["Ciclo", "Inicial", "Intermedio", "Avanzado"],
                                    ["Estudiantes", selectedCeba.estudiantes.inicial, selectedCeba.estudiantes.intermedio, selectedCeba.estudiantes.avanzado],
                                    ["Docentes", selectedCeba.docentes.inicial, selectedCeba.docentes.intermedio, selectedCeba.docentes.avanzado],
                                    ["Aulas", selectedCeba.aulas.inicial, selectedCeba.aulas.intermedio, selectedCeba.aulas.avanzado],
                                ].map((row, ri) => row.map((cell, ci) => (
                                    <div key={`${ri}-${ci}`} style={{ textAlign: "center", padding: "6px 4px", background: ri === 0 ? C.navy3 : C.g50, borderRadius: ri === 0 ? (ci === 0 ? "6px 0 0 0" : ci === 3 ? "0 6px 0 0" : 0) : 0, color: ri === 0 ? C.white : C.navy1, fontSize: ri === 0 ? "0.65rem" : "0.82rem", fontWeight: ri === 0 ? 700 : 600, fontFamily: ri === 0 ? "'DM Sans'" : "'JetBrains Mono'", letterSpacing: ri === 0 ? "0.06em" : 0, textTransform: ri === 0 ? "uppercase" : "none" }}>{cell}</div>
                                )))}
                                <div style={{ textAlign: "center", padding: "6px 4px", background: C.navy4, borderRadius: "0 0 0 6px", color: C.white, fontSize: "0.65rem", fontWeight: 700, fontFamily: "'DM Sans'", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
                                <div style={{ textAlign: "center", padding: "6px 4px", background: `${C.green}15`, fontFamily: "'JetBrains Mono'", fontSize: "0.82rem", fontWeight: 700, color: C.green }}>{selectedCeba.estudiantes.total}</div>
                                <div style={{ textAlign: "center", padding: "6px 4px", background: `${C.teal}15`, fontFamily: "'JetBrains Mono'", fontSize: "0.82rem", fontWeight: 700, color: C.teal }}>{selectedCeba.docentes.total}</div>
                                <div style={{ textAlign: "center", padding: "6px 4px", background: `${C.indigo}15`, borderRadius: "0 0 6px 0", fontFamily: "'JetBrains Mono'", fontSize: "0.82rem", fontWeight: 700, color: C.indigo }}>{selectedCeba.aulas.total}</div>
                            </div>

                            {/* Items table */}
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy1, marginBottom: 8, fontFamily: "'DM Sans'", textTransform: "uppercase", letterSpacing: "0.06em" }}>Requerimientos ({selectedCeba.items.length} items)</div>
                            {["Maquinaria y Equipo", "Materiales de Oficina", "Materiales de Limpieza", "Otros"].map(cat => {
                                const catItems = selectedCeba.items.filter(it => it.categoria === cat);
                                if (catItems.length === 0) return null;
                                return (
                                    <div key={cat} style={{ marginBottom: 12 }}>
                                        <div style={{ ...badge(`${CAT_COLORS[cat] || C.g500}15`, CAT_COLORS[cat] || C.g500), display: "inline-block", marginBottom: 6 }}>{cat.toUpperCase()}</div>
                                        {catItems.map((it, i) => (
                                            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 60px", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${C.g100}`, fontSize: "0.78rem", fontFamily: "'DM Sans'" }}>
                                                <span style={{ color: C.g700 }}>{it.bien}</span>
                                                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.navy1, textAlign: "center" }}>{it.cantidad}</span>
                                                <span style={{ color: C.g500, fontSize: "0.68rem" }}>{it.unidad}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}

                            {/* Impacto detalle */}
                            {showViabilidad && matriz.length > 0 && (() => {
                                let total = 0;
                                const matched = selectedCeba.items.map(it => {
                                    const p = getRefPrice(it.bien);
                                    if (p) { total += p * it.cantidad; return { ...it, precioRef: p, subtotal: p * it.cantidad }; }
                                    return { ...it, precioRef: null, subtotal: 0 };
                                }).filter(it => it.precioRef);

                                if (matched.length === 0) return null;
                                return (
                                    <div style={{ marginTop: 16, padding: 14, background: `${C.purple}06`, border: `1px solid ${C.purple}20`, borderRadius: 8 }}>
                                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'DM Sans'", display: "flex", alignItems: "center", gap: 6 }}>{Icons.shield(14, C.purple)} Proyeccion de Viabilidad — {matched.length} items con referencia</div>
                                        {matched.map((it, i) => (
                                            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 50px 70px 80px", gap: 6, padding: "4px 0", fontSize: "0.72rem", borderBottom: `1px solid ${C.g100}`, fontFamily: "'DM Sans'" }}>
                                                <span style={{ color: C.g600 }}>{it.bien}</span>
                                                <span style={{ textAlign: "center", fontFamily: "'JetBrains Mono'", fontWeight: 600, color: C.navy1 }}>{it.cantidad}</span>
                                                <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono'", color: C.g500 }}>S/ {it.precioRef.toLocaleString("es-PE")}</span>
                                                <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.purple }}>S/ {it.subtotal.toLocaleString("es-PE")}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: `2px solid ${C.purple}30` }}>
                                            <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: "1rem", color: C.purple }}>Total: S/ {total.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
