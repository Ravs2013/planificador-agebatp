import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { subscribeDirectorioCeba, addCeba, updateCeba, deleteCeba, batchSetCebas } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import {
    hayDato,
    metricaVisible,
    fmt,
    numeroFormulario,
    gestionMeta,
    nombreDirector,
    resumenSituacionPersonal,
    situacionBadgeStyle,
    cobertura
} from "../utils/directorioFormato";
import {
    detectarFormato,
    parseDirectorioCebaV2,
    parseDirectorioCEBA,
    FORMATOS
} from "../utils/directorioExcel";
import TablaDirectorio from "./directorio/TablaDirectorio";
import PestanasDetalle from "./directorio/PestanasDetalle";

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
    check: (sz, cl) => <SvgIcon size={sz} color={cl}><polyline points="20 6 9 17 4 12" /></SvgIcon>,
    layers: (sz, cl) => <SvgIcon size={sz} color={cl}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></SvgIcon>,
    globe: (sz, cl) => <SvgIcon size={sz} color={cl}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></SvgIcon>,
};

/* ═══════════════════════════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════════════════════════ */
function CTip({ active, payload, label }) {
    if (!active || !payload) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: "'DM Sans', sans-serif" }}>
            <p style={{ color: C.g600, fontSize: "0.78rem", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.fill, fontSize: "0.8rem", margin: "2px 0", fontWeight: 600 }}>
                    {p.name}: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(p.value) ?? p.value}</span>
                </p>
            ))}
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
                    <p style={{ color: C.g500, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                    <p style={{ color: C.navy1, fontSize: "1.8rem", margin: "6px 0 2px", fontFamily: "'DM Serif Display', serif" }}>{value}</p>
                    {sub && <p style={{ color: C.g500, fontSize: "0.78rem", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>}
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
    badge: (bg, color, border) => ({ fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: bg, color, border: `1px solid ${border || color + "30"}`, letterSpacing: 0.3, fontFamily: "'JetBrains Mono', monospace" }),
    input: { padding: "9px 14px", borderRadius: 6, border: "1px solid #D6DCE8", fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: C.white, color: C.g800, outline: "none" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
};

/** Normaliza documentos existentes y nuevos desde Firestore. */
function normalizarCeba(d) {
    if (!d) return null;
    const legacyDocentes = (d.docentesInicial ?? 0) + (d.docentesIntermedio ?? 0) + (d.docentesAvanzado ?? 0);
    return {
        ...d,
        totalDocentes: d.totalDocentes ?? (legacyDocentes > 0 ? legacyDocentes : null),
        sedes: (d.sedes || []).map(s => ({ ...s, tipoSede: s.tipoSede ?? s.sede ?? null })),
        areas: d.areas || [],
        personal: d.personal || [],
        atencionDistancia: d.atencionDistancia || null,
    };
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function DirectorioCEBA() {
    const { user, isRole } = useAuth();
    const [data, setData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [distritoFilter, setDistritoFilter] = useState("todos");
    const [gestionFilter, setGestionFilter] = useState("todos");
    const [selectedCEBA, setSelectedCEBA] = useState(null);
    const [modalTab, setModalTab] = useState("resumen");
    const [personalSearch, setPersonalSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const fileRef = useRef(null);

    // CRUD & Form State
    const [formOpen, setFormOpen] = useState(false);
    const [formTab, setFormTab] = useState("inst"); // inst, director, estadisticas, inclusion, sedes, areas, distancia
    const [editingCEBA, setEditingCEBA] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        codigoLocal: "",
        codigoModularInicialIntermedio: "",
        codigoModularAvanzado: "",
        tipoGestion: "ESTATAL",
        distrito: "",
        direccion: "",
        cargo: "SUB-DIRECTOR I.E.",
        apellidoPaterno: "",
        apellidoMaterno: "",
        nombres: "",
        dni: "",
        correoInstitucional: "",
        correoPersonal: "",
        celular: "",
        cantidadPerifericos: null,
        presencial: false,
        semipresencial: false,
        aDistancia: false,
        cicloInicial: false,
        cicloIntermedio: false,
        cicloAvanzado: false,
        turnos: "",
        alumnosCenso: null,
        docentesNombrados: null,
        docentesContratados: null,
        directivosJerarquicos: null,
        observaciones: "",
        apoyoIntermitenteLeve: null,
        apoyoContinuoModerado: null,
        apoyoIntensoSevero: null,
        totalInclusivos: null,
        porcentajeInclusion: null,
        sedes: [],
        areas: [],
        atencionDistancia: null,
    });

    // Subscripcion en tiempo real con normalizacion
    useEffect(() => {
        const unsubscribe = subscribeDirectorioCeba((list) => {
            const normalizados = (list || []).map(normalizarCeba);
            setData(normalizados);
            setLoadingData(false);
        });
        return () => unsubscribe();
    }, []);

    // Auto-seleccion para rol director
    useEffect(() => {
        if (user && user.rol === "director" && data.length > 0) {
            const mySchool = data.find(c => c.id === user.institucionId);
            if (mySchool) setSelectedCEBA(mySchool);
        }
    }, [data, user]);

    // Resumen de fichas pendientes
    const pendientesCount = useMemo(() => {
        return data.filter(c => c.fichaPendiente).length;
    }, [data]);

    // Distritos unicos validos (excluyendo centinela 'Por confirmar')
    const distritos = useMemo(() => {
        const set = new Set(data.map(c => c.distrito).filter(d => d && d !== "Por confirmar"));
        return [...set].sort();
    }, [data]);

    // Datos filtrados por busqueda y selectores
    const filtered = useMemo(() => {
        let f = [...data];
        if (user && user.rol === "director") {
            f = f.filter(c => c.id === user.institucionId);
        } else {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                f = f.filter(c => {
                    const matchDirect = (c.nombre || "").toLowerCase().includes(term) ||
                        (c.distrito || "").toLowerCase().includes(term) ||
                        (nombreDirector(c) || "").toLowerCase().includes(term) ||
                        (c.correoInstitucional || "").toLowerCase().includes(term) ||
                        (c.codigoLocal || "").toLowerCase().includes(term) ||
                        (c.codigoModularAvanzado || "").toLowerCase().includes(term) ||
                        (c.codigoModularInicialIntermedio || "").toLowerCase().includes(term) ||
                        (c.direccion || "").toLowerCase().includes(term);
                    if (matchDirect) return true;
                    const matchArea = (c.areas || []).some(a => (a.area || "").toLowerCase().includes(term));
                    if (matchArea) return true;
                    const matchPerson = (c.personal || []).some(p => (p.nombreCompleto || "").toLowerCase().includes(term));
                    return matchPerson;
                });
            }
            if (distritoFilter !== "todos") {
                f = f.filter(c => c.distrito === distritoFilter);
            }
            if (gestionFilter !== "todos") {
                f = f.filter(c => gestionMeta(c.tipoGestion).etiqueta === gestionFilter);
            }
        }
        return f;
    }, [data, searchTerm, distritoFilter, gestionFilter, user]);

    // KPIs con regla R-3f (solo se muestran si agregado > 0)
    const kpis = useMemo(() => {
        const totalCEBA = data.length;
        const totalEstudiantes = data.reduce((s, c) => s + (c.alumnosCenso || 0), 0);
        const totalDocentes = data.reduce((s, c) => s + (c.totalDocentes || 0), 0);
        const totalPerifericos = data.reduce((s, c) => s + (c.cantidadPerifericos || 0), 0);
        const totalSedes = data.reduce((s, c) => s + (c.sedes?.length || 0), 0);
        const distritosUnicos = new Set(data.map(c => c.distrito).filter(d => d && d !== "Por confirmar")).size;

        return {
            totalCEBA,
            totalEstudiantes,
            totalDocentes,
            totalPerifericos,
            totalSedes,
            distritosUnicos
        };
    }, [data]);

    // Datos para graficos
    const barData = useMemo(() => {
        return [...data]
            .filter(c => metricaVisible(c.alumnosCenso))
            .sort((a, b) => (b.alumnosCenso || 0) - (a.alumnosCenso || 0))
            .map(c => ({
                nombre: c.nombre?.length > 28 ? c.nombre.substring(0, 28) + "..." : c.nombre,
                Estudiantes: c.alumnosCenso || 0
            }));
    }, [data]);

    const pieData = useMemo(() => {
        const m = {};
        data.forEach(c => {
            const d = c.distrito || "Por confirmar";
            m[d] = (m[d] || 0) + 1;
        });
        const regular = [];
        let porConfirmarItem = null;
        Object.entries(m).forEach(([name, value]) => {
            if (name === "Por confirmar") {
                porConfirmarItem = { name, value };
            } else {
                regular.push({ name, value });
            }
        });
        if (porConfirmarItem) regular.push(porConfirmarItem);
        return regular;
    }, [data]);

    // ── Drag-and-drop / Upload state ──
    const [dragOver, setDragOver] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null); // { items, formato, incidencias, stats }
    const [uploadMode, setUploadMode] = useState("merge"); // "merge" or "replace"

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const dataBuffer = await file.arrayBuffer();
            const wb = XLSX.read(new Uint8Array(dataBuffer), { type: "array" });
            const formatoDetectado = detectarFormato(wb);

            // Proteccion cruzada de archivos
            if (formatoDetectado === FORMATOS.CETPRO_V2) {
                alert("Este archivo corresponde al directorio CETPRO. Cárgalo desde la pestaña CETPRO.");
                setLoading(false);
                if (fileRef.current) fileRef.current.value = "";
                return;
            }

            if (formatoDetectado === FORMATOS.CEBA_V2) {
                const res = parseDirectorioCebaV2(wb, { nombreArchivo: file.name, userName: user?.nombre });
                if (res.instituciones.length === 0) {
                    alert("No se detectaron instituciones en el archivo. Verifique el formato.");
                    setLoading(false);
                    return;
                }
                const stats = {
                    estudiantes: res.instituciones.reduce((s, c) => s + (c.alumnosCenso || 0), 0),
                    docentes: res.instituciones.reduce((s, c) => s + (c.totalDocentes || 0), 0),
                    areas: res.instituciones.reduce((s, c) => s + c.areas.length, 0),
                    sedes: res.instituciones.reduce((s, c) => s + c.sedes.length, 0),
                    personal: res.instituciones.reduce((s, c) => s + c.personal.length, 0),
                    distancia: res.instituciones.filter(c => c.atencionDistancia !== null).length,
                };
                setUploadPreview({
                    formato: formatoDetectado,
                    items: res.instituciones,
                    incidencias: res.incidencias,
                    stats,
                    nombreArchivo: file.name,
                    tieneErrores: res.incidencias.some(i => i.nivel === "error")
                });
            } else {
                // Formato legacy
                const items = await parseDirectorioCEBA(file);
                if (items.length === 0) {
                    alert("No se detectaron instituciones en el archivo. Verifique el formato.");
                    setLoading(false);
                    return;
                }
                setUploadPreview({
                    formato: formatoDetectado,
                    items,
                    incidencias: [{ nivel: "aviso", codigo: "FORMATO_ANTIGUO", mensaje: "Formato antiguo detectado. Se recomienda usar la plantilla F-07 vigente." }],
                    stats: {
                        estudiantes: items.reduce((s, c) => s + (c.alumnosCenso || 0), 0),
                        docentes: items.reduce((s, c) => s + (c.totalDocentes || 0), 0),
                        sedes: items.reduce((s, c) => s + (c.sedes?.length || 0), 0),
                        personal: 0,
                    },
                    nombreArchivo: file.name,
                    tieneErrores: false
                });
            }
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
                const { getDocs, collection: coll, writeBatch: wb } = await import("firebase/firestore");
                const { db: fireDb } = await import("../firebase/config");
                const snap = await getDocs(coll(fireDb, "directorioCeba"));
                const delBatch = wb(fireDb);
                snap.docs.forEach(d => delBatch.delete(d.ref));
                await delBatch.commit();
            }

            const esV2 = uploadPreview.formato === FORMATOS.CEBA_V2;
            await batchSetCebas(uploadPreview.items, user?.uid, user?.nombre, { limpiarLegacy: esV2 });

            const s = uploadPreview.stats;
            const accion = uploadMode === "replace" ? "reemplazadas" : "actualizadas";
            let msg = `${uploadPreview.items.length} instituciones CEBA ${accion} exitosamente.`;
            if (s.areas || s.sedes || s.personal) {
                msg += ` ${s.areas || 0} áreas, ${s.sedes || 0} sedes, ${s.personal || 0} registros de personal y ${s.distancia || 0} fichas de atención a distancia.`;
            }
            alert(msg);
            setUploadPreview(null);
        } catch (err) {
            console.error("Error uploading CEBAs:", err);
            alert("Error al guardar las instituciones: " + err.message);
        }
        setLoading(false);
    };

    // CRUD Handlers
    const openAddCEBA = () => {
        setEditingCEBA(null);
        setFormData({
            nombre: "",
            codigoLocal: "",
            codigoModularInicialIntermedio: "",
            codigoModularAvanzado: "",
            tipoGestion: "ESTATAL",
            distrito: "",
            direccion: "",
            cargo: "SUB-DIRECTOR I.E.",
            apellidoPaterno: "",
            apellidoMaterno: "",
            nombres: "",
            dni: "",
            correoInstitucional: "",
            correoPersonal: "",
            celular: "",
            cantidadPerifericos: null,
            presencial: false,
            semipresencial: false,
            aDistancia: false,
            cicloInicial: false,
            cicloIntermedio: false,
            cicloAvanzado: false,
            turnos: "",
            alumnosCenso: null,
            docentesNombrados: null,
            docentesContratados: null,
            directivosJerarquicos: null,
            observaciones: "",
            apoyoIntermitenteLeve: null,
            apoyoContinuoModerado: null,
            apoyoIntensoSevero: null,
            totalInclusivos: null,
            porcentajeInclusion: null,
            sedes: [],
            areas: [],
            atencionDistancia: null,
        });
        setFormTab("inst");
        setFormOpen(true);
    };

    const openEditCEBA = (ceba) => {
        setEditingCEBA(ceba);
        setFormData({
            ...ceba,
            sedes: ceba.sedes || [],
            areas: ceba.areas || [],
            atencionDistancia: ceba.atencionDistancia || null,
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

        const nomb = numeroFormulario(formData.docentesNombrados);
        const cont = numeroFormulario(formData.docentesContratados);
        const dirJer = numeroFormulario(formData.directivosJerarquicos);
        let totalDoc = null;
        if (nomb !== null || cont !== null || dirJer !== null) {
            totalDoc = (nomb || 0) + (cont || 0) + (dirJer || 0);
        }

        const apLeve = numeroFormulario(formData.apoyoIntermitenteLeve);
        const apMod = numeroFormulario(formData.apoyoContinuoModerado);
        const apSev = numeroFormulario(formData.apoyoIntensoSevero);
        let totInc = null;
        if (apLeve !== null || apMod !== null || apSev !== null) {
            totInc = (apLeve || 0) + (apMod || 0) + (apSev || 0);
        } else if (numeroFormulario(formData.totalInclusivos) !== null) {
            totInc = numeroFormulario(formData.totalInclusivos);
        }

        const alumnos = numeroFormulario(formData.alumnosCenso);
        let pctInc = null;
        if (totInc !== null && alumnos !== null && alumnos > 0) {
            pctInc = Number(((totInc / alumnos) * 100).toFixed(1));
        }

        const parsed = {
            ...formData,
            nombre: formData.nombre.trim(),
            distrito: formData.distrito.trim(),
            alumnosCenso: alumnos,
            docentesNombrados: nomb,
            docentesContratados: cont,
            directivosJerarquicos: dirJer,
            totalDocentes: totalDoc,
            cantidadPerifericos: numeroFormulario(formData.cantidadPerifericos),
            apoyoIntermitenteLeve: apLeve,
            apoyoContinuoModerado: apMod,
            apoyoIntensoSevero: apSev,
            totalInclusivos: totInc,
            porcentajeInclusion: pctInc,
            actualizadoPor: user?.nombre || user?.email || 'sistema',
            actualizadoEn: new Date().toISOString()
        };

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

    // Sub-row editors
    const addSedeRow = () => {
        setFormData(prev => ({
            ...prev,
            sedes: [...prev.sedes, { tipoSede: "", direccion: "", formaAtencion: "", dias: "", horario: "" }]
        }));
    };
    const removeSedeRow = (idx) => {
        setFormData(prev => ({ ...prev, sedes: prev.sedes.filter((_, i) => i !== idx) }));
    };
    const updateSedeRow = (idx, field, val) => {
        setFormData(prev => {
            const copy = [...prev.sedes];
            copy[idx] = { ...copy[idx], [field]: val, ...(field === "tipoSede" ? { sede: val } : {}) };
            return { ...prev, sedes: copy };
        });
    };

    const addAreaRow = () => {
        setFormData(prev => ({
            ...prev,
            areas: [...prev.areas, { area: "", ciclos: "", turnos: "", docentes: null, estudiantes: null }]
        }));
    };
    const removeAreaRow = (idx) => {
        setFormData(prev => ({ ...prev, areas: prev.areas.filter((_, i) => i !== idx) }));
    };
    const updateAreaRow = (idx, field, val) => {
        setFormData(prev => {
            const copy = [...prev.areas];
            copy[idx] = { ...copy[idx], [field]: (field === "docentes" || field === "estudiantes") ? numeroFormulario(val) : val };
            return { ...prev, areas: copy };
        });
    };

    // Export PDF
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

            // KPI row (filtered by R-3f)
            pdf.setFillColor(241, 245, 249); pdf.roundedRect(MX, y, pw, 40, 6, 6, "F");
            pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(30, 77, 123);
            const kpiItems = [
                `CEBA: ${kpis.totalCEBA}`,
                `Estudiantes: ${kpis.totalEstudiantes.toLocaleString()}`,
                `Docentes: ${kpis.totalDocentes}`,
                `Perifericos: ${kpis.totalPerifericos}`,
                `Sedes: ${kpis.totalSedes}`,
                `Distritos: ${kpis.distritosUnicos}`
            ];
            const kpiW = pw / kpiItems.length;
            kpiItems.forEach((t, i) => { pdf.text(t, MX + i * kpiW + kpiW / 2, y + 25, { align: "center" }); });
            y += 56;

            // CEBAs
            filtered.forEach((c, idx) => {
                checkPage(135);
                const gMeta = gestionMeta(c.tipoGestion);

                // Name bar
                pdf.setFillColor(27, 58, 92); pdf.roundedRect(MX, y, pw, 22, 3, 3, "F");
                pdf.setFontSize(28); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
                pdf.text(`${idx + 1}. ${c.nombre}`, MX + 8, y + 15);
                pdf.setFontSize(20); pdf.text(`${gMeta.etiqueta} | ${c.distrito}`, MX + pw - 8, y + 15, { align: "right" });
                y += 31;

                // Director
                pdf.setFontSize(24); pdf.setFont("helvetica", "bold"); pdf.setTextColor(12, 25, 41);
                const dirNom = nombreDirector(c) || "Director por registrar";
                pdf.text(`${c.cargo || "Director"}: ${dirNom}`, MX + 6, y + 8); y += 14;

                // Contact
                pdf.setFont("helvetica", "normal"); pdf.setFontSize(22); pdf.setTextColor(71, 85, 105);
                const contact = [c.correoInstitucional, c.celular, c.direccion].filter(Boolean).join(" | ");
                if (contact) { const lines = pdf.splitTextToSize(contact, pw - 12); pdf.text(lines, MX + 6, y + 8); y += lines.length * 10 + 3; }

                // Stats (strictly omitting empty/zeros)
                const metricasPDF = [];
                if (metricaVisible(c.alumnosCenso)) metricasPDF.push(`Alumnos: ${fmt(c.alumnosCenso)}`);
                if (metricaVisible(c.totalDocentes)) metricasPDF.push(`Docentes: ${fmt(c.totalDocentes)}`);
                if (metricaVisible(c.cantidadPerifericos)) metricasPDF.push(`Perifericos: ${fmt(c.cantidadPerifericos)}`);
                if (metricaVisible(c.sedes?.length)) metricasPDF.push(`Sedes: ${c.sedes.length}`);

                if (metricasPDF.length > 0) {
                    pdf.setFontSize(22); pdf.setFont("helvetica", "bold"); pdf.setTextColor(21, 128, 61);
                    pdf.text(metricasPDF.join("   |   "), MX + 6, y + 8);
                    y += 14;
                } else if (c.fichaPendiente) {
                    pdf.setFontSize(20); pdf.setFont("helvetica", "italic"); pdf.setTextColor(180, 83, 9);
                    pdf.text("Ficha pendiente de devolucion", MX + 6, y + 8);
                    y += 14;
                }

                // Docentes composicion
                const compDoc = [];
                if (metricaVisible(c.docentesNombrados)) compDoc.push(`Nombrados: ${c.docentesNombrados}`);
                if (metricaVisible(c.docentesContratados)) compDoc.push(`Contratados: ${c.docentesContratados}`);
                if (metricaVisible(c.directivosJerarquicos)) compDoc.push(`Directivos: ${c.directivosJerarquicos}`);
                if (compDoc.length > 0) {
                    pdf.setFontSize(19); pdf.setFont("helvetica", "normal"); pdf.setTextColor(71, 85, 105);
                    pdf.text(compDoc.join("  |  "), MX + 6, y + 7);
                    y += 12;
                }

                // Sedes summary
                if (c.sedes && c.sedes.length > 0) {
                    checkPage(22);
                    pdf.setFontSize(20); pdf.setFont("helvetica", "italic"); pdf.setTextColor(100, 116, 139);
                    const SedeNames = c.sedes.map(s => s.tipoSede || s.sede).filter(Boolean).slice(0, 3).join(", ");
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

    if (loadingData) {
        return (
            <div style={{ textAlign: "center", padding: 80, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ display: 'inline-block', width: 24, height: 24, border: `3px solid ${C.g200}`, borderTopColor: C.navy4, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: C.g500, fontSize: '0.85rem', marginTop: 10 }}>Cargando directorio CEBA...</p>
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
                    <div style={{ animation: "pulse 1.5s infinite" }}>{Icons.upload(64, C.white)}</div>
                    <h3 style={{ color: C.white, fontSize: "1.6rem", margin: "20px 0 10px", fontFamily: "'DM Serif Display', serif" }}>Suelte el archivo del Directorio CEBA</h3>
                    <p style={{ color: C.g300, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif" }}>Para actualizar o reemplazar los datos del directorio</p>
                    <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }`}</style>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display', serif" }}>
                        Directorio CEBA - UGEL 03
                    </h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                        Centros de Educacion Basica Alternativa · {kpis.totalCEBA} instituciones registradas
                        {pendientesCount > 0 && (
                            <span style={{ color: C.amber, fontWeight: 600 }}> · {pendientesCount} con ficha pendiente</span>
                        )}
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
                            {Icons.school(56, dragOver ? C.navy4 : C.g400)}
                        </div>
                        <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "0 0 10px", fontFamily: "'DM Serif Display', serif" }}>
                            Directorio CEBA - UGEL 03
                        </h3>
                        <p style={{ color: C.g500, fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.5 }}>
                            Arrastra y suelta tu archivo Excel del Directorio CEBA aquí, o haz click en el botón para explorar tus archivos locales.
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
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
            ) : (
                <>
                    {/* SEARCH & FILTERS */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: 400 }}>
                            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>{Icons.search(14, C.g400)}</div>
                            <input
                                placeholder="Buscar por nombre, distrito, director, correo, área..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ ...S.input, width: "100%", paddingLeft: 34, boxSizing: "border-box" }}
                            />
                        </div>
                        <select value={distritoFilter} onChange={e => setDistritoFilter(e.target.value)} style={{ ...S.input, minWidth: 170 }}>
                            <option value="todos">Todos los distritos</option>
                            {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={gestionFilter} onChange={e => setGestionFilter(e.target.value)} style={{ ...S.input, minWidth: 150 }}>
                            <option value="todos">Toda gestion</option>
                            <option value="ESTATAL">Estatal</option>
                            <option value="PARROQUIAL">Parroquial</option>
                            <option value="CONVENIO">Convenio</option>
                        </select>
                    </div>

                    {/* KPIs con regla R-3f */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                        <StatCard icon={Icons.school(20, C.navy4)} label="TOTAL CEBA" value={kpis.totalCEBA} sub="Instituciones registradas" border={C.navy4} />
                        {kpis.totalEstudiantes > 0 && (
                            <StatCard icon={Icons.users(20, C.green)} label="TOTAL ESTUDIANTES" value={kpis.totalEstudiantes.toLocaleString("es-PE")} sub="Alumnos matriculados (censo)" border={C.green} />
                        )}
                        {kpis.totalDocentes > 0 && (
                            <StatCard icon={Icons.book(20, C.indigo)} label="TOTAL DOCENTES" value={kpis.totalDocentes.toLocaleString("es-PE")} sub="Nombrados, contratados y directivos" border={C.indigo} />
                        )}
                        {kpis.totalPerifericos > 0 && (
                            <StatCard icon={Icons.mapPin(20, C.amber)} label="PERIFERICOS" value={kpis.totalPerifericos} sub="Locales periféricos" border={C.amber} />
                        )}
                        {kpis.totalSedes > 0 && (
                            <StatCard icon={Icons.layers(20, C.purple)} label="SEDES DE ATENCION" value={kpis.totalSedes} sub="Locales registrados" border={C.purple} />
                        )}
                        <StatCard icon={Icons.mapPin(20, C.teal)} label="DISTRITOS" value={kpis.distritosUnicos} sub="Distritos atendidos" border={C.teal} />
                    </div>

                    {/* CHARTS */}
                    {data.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }} className="grid-calendar">
                            {/* Bar Chart */}
                            <div style={S.card}>
                                <div style={{ marginBottom: 14 }}>
                                    <h3 style={{ color: C.navy1, fontSize: "1rem", margin: 0, fontFamily: "'DM Serif Display', serif" }}>
                                        Estudiantes por CEBA
                                    </h3>
                                    <p style={{ color: C.g500, fontSize: "0.72rem", margin: "2px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                                        {cobertura(data, "alumnosCenso", "matrícula reportada")}
                                    </p>
                                </div>
                                <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 34)}>
                                    <BarChart data={barData} layout="vertical" barSize={18} margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={C.g200} />
                                        <XAxis type="number" tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                                        <YAxis type="category" dataKey="nombre" width={180} tick={{ fill: C.g600, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} />
                                        <Tooltip content={<CTip />} />
                                        <Bar dataKey="Estudiantes" fill={C.navy4} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Pie Chart */}
                            <div style={S.card}>
                                <h3 style={{ color: C.navy1, fontSize: "1rem", margin: "0 0 16px", fontFamily: "'DM Serif Display', serif" }}>
                                    Distribucion por Distrito
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: C.g300 }}>
                                            {pieData.map((entry, idx) => (
                                                <Cell
                                                    key={idx}
                                                    fill={entry.name === "Por confirmar" ? C.g300 : PIE_COLORS[idx % PIE_COLORS.length]}
                                                />
                                            ))}
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
                            const gMeta = gestionMeta(ceba.tipoGestion);
                            const dirNom = nombreDirector(ceba);

                            // Baldosas filtradas por metricaVisible (R-3c)
                            const baldosas = [
                                { etiqueta: "ESTUDIANTES", valor: ceba.alumnosCenso, color: C.green },
                                { etiqueta: "DOCENTES", valor: ceba.totalDocentes, color: C.indigo },
                                { etiqueta: "PERIFERICOS", valor: ceba.cantidadPerifericos, color: C.teal },
                                { etiqueta: "SEDES", valor: ceba.sedes?.length, color: C.amber },
                            ].filter(b => metricaVisible(b.valor));

                            return (
                                <div
                                    key={ceba.id || idx}
                                    onClick={() => { setSelectedCEBA(ceba); setModalTab("resumen"); setPersonalSearch(""); }}
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
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3, flex: 1 }}>
                                            {ceba.nombre}
                                        </h4>
                                        <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                            <span style={S.badge(gMeta.bg, gMeta.color, gMeta.borde)}>
                                                {gMeta.etiqueta}
                                            </span>
                                            {ceba.distrito && (
                                                <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>
                                                    {ceba.distrito}
                                                </span>
                                            )}
                                            {ceba.fichaPendiente && (
                                                <span style={S.badge(C.gold3, C.gold1, "#FDE68A")}>
                                                    FICHA PENDIENTE
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Director */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 6,
                                            background: dirNom ? C.navy3 : C.g100,
                                            color: dirNom ? C.white : C.g400,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: 10, flexShrink: 0,
                                            fontFamily: "'JetBrains Mono', monospace"
                                        }}>
                                            {dirNom ? `${(ceba.nombres || "D")[0]}${(ceba.apellidoPaterno || "R")[0]}` : "-"}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontSize: "0.78rem",
                                                fontWeight: dirNom ? 600 : 400,
                                                color: dirNom ? C.navy1 : C.g400,
                                                fontFamily: "'DM Sans', sans-serif",
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                            }}>
                                                {dirNom || "Director por registrar"}
                                            </div>
                                            {ceba.cargo && <div style={{ fontSize: "0.68rem", color: C.g500, fontFamily: "'DM Sans', sans-serif" }}>{ceba.cargo}</div>}
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    {ceba.correoInstitucional && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                                            {Icons.mail(11, C.g400)}
                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ceba.correoInstitucional}</span>
                                        </div>
                                    )}
                                    {ceba.celular && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                                            {Icons.phone(11, C.g400)}
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{ceba.celular}</span>
                                        </div>
                                    )}

                                    {/* Address */}
                                    {ceba.direccion && (
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                                            {Icons.mapPin(11, C.g400)}
                                            <span style={{ lineHeight: 1.3 }}>{ceba.direccion}</span>
                                        </div>
                                    )}

                                    {/* Turnos */}
                                    {hayDato(ceba.turnos) && (
                                        <div style={{ fontSize: "0.68rem", color: C.g400, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
                                            Turnos: {ceba.turnos}
                                        </div>
                                    )}

                                    {/* Mini Stats (R-3h & R-3j) */}
                                    <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${C.g100}`, paddingTop: 10 }}>
                                        {baldosas.length > 0 ? (
                                            baldosas.map((st, i) => (
                                                <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < baldosas.length - 1 ? `1px solid ${C.g100}` : "none" }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 700, color: st.color }}>
                                                        {fmt(st.valor)}
                                                    </div>
                                                    <div style={{ fontSize: "0.58rem", color: C.g500, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}>
                                                        {st.etiqueta}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ width: "100%", padding: "6px 0", textAlign: "center", color: C.g400, fontSize: "0.7rem", fontStyle: "italic", fontFamily: "'DM Sans', sans-serif" }}>
                                                Sin datos estadisticos reportados
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && data.length > 0 && (
                        <div style={{ textAlign: "center", padding: 48, color: C.g400, fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif" }}>
                            No se encontraron resultados con los filtros aplicados.
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════════════════
               DETAIL MODAL (REESTRUCTURADO CON PESTAÑAS)
               ═══════════════════════════════════════════════════ */}
            {selectedCEBA && (
                <div
                    style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease" }}
                    onClick={() => setSelectedCEBA(null)}
                >
                    <div
                        style={{ ...S.card, padding: 0, width: "100%", maxWidth: 780, maxHeight: "88vh", overflowY: "auto", animation: "fadeIn 0.2s ease", display: "flex", flexDirection: "column" }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, position: "sticky", top: 0, background: C.white, zIndex: 11, borderRadius: "10px 10px 0 0" }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                                    <span style={S.badge(gestionMeta(selectedCEBA.tipoGestion).bg, gestionMeta(selectedCEBA.tipoGestion).color, gestionMeta(selectedCEBA.tipoGestion).borde)}>
                                        {gestionMeta(selectedCEBA.tipoGestion).etiqueta}
                                    </span>
                                    {selectedCEBA.distrito && (
                                        <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>{selectedCEBA.distrito}</span>
                                    )}
                                    {selectedCEBA.fichaPendiente && (
                                        <span style={S.badge(C.gold3, C.gold1, "#FDE68A")}>FICHA PENDIENTE</span>
                                    )}
                                </div>
                                <h2 style={{ fontSize: "1.25rem", fontFamily: "'DM Serif Display', serif", color: C.navy1, margin: 0 }}>
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

                        {/* Modal Body with internal tabs */}
                        <div style={{ padding: "16px 24px 28px", flex: 1 }}>
                            <PestanasDetalle
                                activa={modalTab}
                                onCambiar={setModalTab}
                                pestanas={[
                                    { id: "resumen", label: "Resumen" },
                                    { id: "sedes", label: "Sedes", conteo: selectedCEBA.sedes?.length || 0, visible: (selectedCEBA.sedes?.length || 0) > 0 },
                                    { id: "areas", label: "Areas", conteo: selectedCEBA.areas?.length || 0, visible: (selectedCEBA.areas?.length || 0) > 0 },
                                    { id: "personal", label: "Personal", conteo: selectedCEBA.personal?.length || 0, visible: (selectedCEBA.personal?.length || 0) > 0 },
                                    { id: "distancia", label: "A distancia", visible: selectedCEBA.atencionDistancia !== null },
                                ]}
                            />

                            {/* PESTAÑA: RESUMEN */}
                            {modalTab === "resumen" && (
                                <div>
                                    {/* S1: Datos Institucionales */}
                                    <SectionTitle>Datos Institucionales</SectionTitle>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 20 }}>
                                        <FieldRow label="Codigo de Local" value={selectedCEBA.codigoLocal} mono />
                                        <FieldRow label="Cod. Modular Inicial-Intermedio" value={selectedCEBA.codigoModularInicialIntermedio} mono />
                                        <FieldRow label="Cod. Modular Avanzado" value={selectedCEBA.codigoModularAvanzado} mono />
                                        <FieldRow label="Tipo de Gestion" value={selectedCEBA.tipoGestion} />
                                        <FieldRow label="Distrito" value={selectedCEBA.distrito} />
                                        <FieldRow label="Direccion" value={selectedCEBA.direccion} span />
                                    </div>

                                    {/* S2: Responsable */}
                                    <SectionTitle>Responsable</SectionTitle>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 20 }}>
                                        <FieldRow label="Cargo" value={selectedCEBA.cargo} />
                                        <FieldRow label="Nombre Completo" value={nombreDirector(selectedCEBA)} />
                                        <FieldRow label="DNI" value={selectedCEBA.dni} mono />
                                        <FieldRow label="Correo Institucional" value={selectedCEBA.correoInstitucional} />
                                        <FieldRow label="Correo Personal" value={selectedCEBA.correoPersonal} />
                                        <FieldRow label="Celular" value={selectedCEBA.celular} mono />
                                    </div>

                                    {/* S3: Modalidades y Ciclos */}
                                    {(selectedCEBA.presencial !== null || selectedCEBA.semipresencial !== null || selectedCEBA.aDistancia !== null ||
                                      selectedCEBA.cicloInicial !== null || selectedCEBA.cicloIntermedio !== null || selectedCEBA.cicloAvanzado !== null) && (
                                        <>
                                            <SectionTitle>Modalidades y Ciclos</SectionTitle>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
                                                {selectedCEBA.presencial !== null && <BoolBadge label="Presencial" value={selectedCEBA.presencial} />}
                                                {selectedCEBA.semipresencial !== null && <BoolBadge label="Semipresencial" value={selectedCEBA.semipresencial} />}
                                                {selectedCEBA.aDistancia !== null && <BoolBadge label="A Distancia" value={selectedCEBA.aDistancia} />}
                                                {selectedCEBA.cicloInicial !== null && <BoolBadge label="Ciclo Inicial" value={selectedCEBA.cicloInicial} />}
                                                {selectedCEBA.cicloIntermedio !== null && <BoolBadge label="Ciclo Intermedio" value={selectedCEBA.cicloIntermedio} />}
                                                {selectedCEBA.cicloAvanzado !== null && <BoolBadge label="Ciclo Avanzado" value={selectedCEBA.cicloAvanzado} />}
                                            </div>
                                            {hayDato(selectedCEBA.turnos) && (
                                                <div style={{ marginBottom: 20 }}>
                                                    <FieldRow label="Turnos" value={selectedCEBA.turnos} />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* S4: Composicion del Personal (BigStats con R-3c) */}
                                    {(metricaVisible(selectedCEBA.docentesNombrados) || metricaVisible(selectedCEBA.docentesContratados) ||
                                      metricaVisible(selectedCEBA.directivosJerarquicos) || metricaVisible(selectedCEBA.totalDocentes)) && (
                                        <>
                                            <SectionTitle>Composicion del Personal</SectionTitle>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                                                {metricaVisible(selectedCEBA.docentesNombrados) && (
                                                    <BigStat label="Nombrados" value={selectedCEBA.docentesNombrados} color={C.navy4} />
                                                )}
                                                {metricaVisible(selectedCEBA.docentesContratados) && (
                                                    <BigStat label="Contratados" value={selectedCEBA.docentesContratados} color={C.amber} />
                                                )}
                                                {metricaVisible(selectedCEBA.directivosJerarquicos) && (
                                                    <BigStat label="Directivos" value={selectedCEBA.directivosJerarquicos} color={C.purple} />
                                                )}
                                                {metricaVisible(selectedCEBA.totalDocentes) && (
                                                    <BigStat label="Total Docentes" value={selectedCEBA.totalDocentes} color={C.indigo} destacado />
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* S5: Inclusion NEE (R-3e: solo si totalInclusivos > 0) */}
                                    {metricaVisible(selectedCEBA.totalInclusivos) && (
                                        <>
                                            <SectionTitle>Inclusion y Apoyos (NEE)</SectionTitle>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 700, color: C.navy4 }}>{fmt(selectedCEBA.apoyoIntermitenteLeve) ?? "-"}</div>
                                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Intermitente / Leve</div>
                                                </div>
                                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 700, color: C.teal }}>{fmt(selectedCEBA.apoyoContinuoModerado) ?? "-"}</div>
                                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Continuo / Moderado</div>
                                                </div>
                                                <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", fontWeight: 700, color: C.amber }}>{fmt(selectedCEBA.apoyoIntensoSevero) ?? "-"}</div>
                                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Intenso / Severo</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                                <FieldRow label="Total Inclusivos" value={fmt(selectedCEBA.totalInclusivos)} mono />
                                                <FieldRow label="Porcentaje de Inclusion" value={selectedCEBA.porcentajeInclusion !== null ? `${selectedCEBA.porcentajeInclusion}%` : null} mono />
                                            </div>
                                        </>
                                    )}

                                    {/* S6: Observaciones */}
                                    {hayDato(selectedCEBA.observaciones) && (
                                        <>
                                            <SectionTitle>Observaciones</SectionTitle>
                                            <div style={{ background: C.g50, border: `1px solid ${C.g100}`, borderRadius: 8, padding: "12px 16px", fontSize: "0.82rem", color: C.g700, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                                                {selectedCEBA.observaciones}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* PESTAÑA: SEDES */}
                            {modalTab === "sedes" && (
                                <div>
                                    <TablaDirectorio
                                        columnas={[
                                            { key: "tipoSede", label: "Tipo de Sede", render: (v, r) => v || r.sede || "-" },
                                            { key: "direccion", label: "Dirección Exacta" },
                                            { key: "formaAtencion", label: "Forma de Atención" },
                                            { key: "dias", label: "Días" },
                                            { key: "horario", label: "Horario", isNum: true },
                                        ]}
                                        filas={selectedCEBA.sedes || []}
                                        vacioMensaje="No hay sedes registradas para esta institución."
                                    />
                                </div>
                            )}

                            {/* PESTAÑA: AREAS */}
                            {modalTab === "areas" && (
                                <div>
                                    <TablaDirectorio
                                        columnas={[
                                            { key: "area", label: "Área Curricular" },
                                            { key: "ciclos", label: "Ciclo(s)" },
                                            { key: "turnos", label: "Turno(s)" },
                                            { key: "docentes", label: "Docentes", isNum: true },
                                            { key: "estudiantes", label: "Estudiantes", isNum: true },
                                        ]}
                                        filas={selectedCEBA.areas || []}
                                        totales={{
                                            area: "TOTAL CONSOLIDADO",
                                            docentes: (selectedCEBA.areas || []).reduce((s, a) => s + (a.docentes || 0), 0),
                                            estudiantes: (selectedCEBA.areas || []).reduce((s, a) => s + (a.estudiantes || 0), 0),
                                        }}
                                        vacioMensaje="No hay áreas curriculares reportadas."
                                    />
                                </div>
                            )}

                            {/* PESTAÑA: PERSONAL */}
                            {modalTab === "personal" && (
                                <div>
                                    {/* Chips de situacion */}
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                                        {resumenSituacionPersonal(selectedCEBA.personal || []).map((sit, i) => {
                                            const st = situacionBadgeStyle(sit.situacion);
                                            return (
                                                <span key={i} style={S.badge(st.bg, st.color, st.borde)}>
                                                    {sit.situacion}: {sit.cantidad}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* Buscador interno */}
                                    <div style={{ marginBottom: 12 }}>
                                        <input
                                            placeholder="Filtrar por apellidos, nombres, DNI, área o cargo..."
                                            value={personalSearch}
                                            onChange={e => setPersonalSearch(e.target.value)}
                                            style={{ ...S.input, width: "100%", padding: "7px 12px", fontSize: 12, boxSizing: "border-box" }}
                                        />
                                    </div>

                                    <TablaDirectorio
                                        columnas={[
                                            { key: "nombreCompleto", label: "Apellidos y Nombres" },
                                            { key: "dni", label: "DNI", isNum: true },
                                            { key: "cargo", label: "Cargo" },
                                            {
                                                key: "situacion",
                                                label: "Situación",
                                                render: (v) => {
                                                    const st = situacionBadgeStyle(v);
                                                    return <span style={S.badge(st.bg, st.color, st.borde)}>{v || "Sin dato"}</span>;
                                                }
                                            },
                                            { key: "area", label: "Área que Enseña" },
                                            { key: "cicloGrado", label: "Ciclo / Grado" },
                                            { key: "turno", label: "Turno" },
                                            { key: "observacion", label: "Observación" },
                                        ]}
                                        filas={(selectedCEBA.personal || []).filter(p => {
                                            if (!personalSearch.trim()) return true;
                                            const q = personalSearch.toLowerCase();
                                            return (p.nombreCompleto || "").toLowerCase().includes(q) ||
                                                (p.dni || "").includes(q) ||
                                                (p.area || "").toLowerCase().includes(q) ||
                                                (p.cargo || "").toLowerCase().includes(q) ||
                                                (p.situacion || "").toLowerCase().includes(q);
                                        })}
                                        vacioMensaje="No se encontraron registros de personal docente."
                                    />
                                    <p style={{ color: C.g500, fontSize: "0.72rem", marginTop: 10, fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
                                        El personal nominal se actualiza mediante la carga masiva del Excel.
                                    </p>
                                </div>
                            )}

                            {/* PESTAÑA: DISTANCIA */}
                            {modalTab === "distancia" && selectedCEBA.atencionDistancia && (
                                <div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 16 }}>
                                        <FieldRow label="RD de Autorizacion" value={selectedCEBA.atencionDistancia.rd} />
                                        <FieldRow label="Estudiantes a Distancia" value={fmt(selectedCEBA.atencionDistancia.estudiantes)} mono />
                                    </div>

                                    {/* Plataformas */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Plataformas / Canales</div>
                                        {selectedCEBA.atencionDistancia.plataformas && selectedCEBA.atencionDistancia.plataformas.length > 0 ? (
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                {selectedCEBA.atencionDistancia.plataformas.map((plat, i) => (
                                                    <span key={i} style={S.badge("#EFF6FF", C.navy4, "#BFDBFE")}>
                                                        {plat}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: "0.82rem", color: C.g800, fontFamily: "'DM Sans', sans-serif" }}>
                                                {selectedCEBA.atencionDistancia.plataformasTexto || "No declaradas"}
                                            </div>
                                        )}
                                    </div>

                                    {/* Horarios y Docentes con saltos de linea */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                        <div>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Días y Horarios</div>
                                            <div style={{ background: C.g50, padding: 12, borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: "0.8rem", color: C.g800, whiteSpace: "pre-line", fontFamily: "'DM Sans', sans-serif" }}>
                                                {selectedCEBA.atencionDistancia.diasHorario || "Sin información reportada."}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Docentes que Atienden</div>
                                            <div style={{ background: C.g50, padding: 12, borderRadius: 6, border: `1px solid ${C.g200}`, fontSize: "0.8rem", color: C.g800, whiteSpace: "pre-line", fontFamily: "'DM Sans', sans-serif" }}>
                                                {selectedCEBA.atencionDistancia.docentesTexto || "Sin información reportada."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
               FORM MODAL (ADD & EDIT)
               ═══════════════════════════════════════════════════ */}
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
                        <div style={{ display: "flex", borderBottom: `1px solid ${C.g200}`, background: C.g50, overflowX: "auto" }}>
                            {[
                                { id: "inst", label: "Datos Institucionales" },
                                { id: "director", label: "Director / Contacto" },
                                { id: "estadisticas", label: "Estadísticas y Personal" },
                                { id: "inclusion", label: "Inclusión (NEE)" },
                                { id: "sedes", label: `Sedes (${formData.sedes.length})` },
                                { id: "areas", label: `Áreas (${formData.areas.length})` },
                                { id: "distancia", label: "A distancia" }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setFormTab(t.id)}
                                    style={{
                                        flex: "1 0 auto",
                                        padding: "12px 14px",
                                        border: "none",
                                        borderBottom: formTab === t.id ? `3px solid ${C.navy4}` : "none",
                                        background: "transparent",
                                        color: formTab === t.id ? C.navy1 : C.g500,
                                        fontWeight: formTab === t.id ? 700 : 500,
                                        fontSize: "0.78rem",
                                        cursor: "pointer",
                                        fontFamily: "'DM Sans', sans-serif",
                                        whiteSpace: "nowrap",
                                        transition: "all 0.15s"
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Form Body */}
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
                                        <input type="text" value={formData.codigoLocal || ""} onChange={e => setFormData({ ...formData, codigoLocal: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Tipo de Gestión</label>
                                        <select value={formData.tipoGestion} onChange={e => setFormData({ ...formData, tipoGestion: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }}>
                                            <option value="ESTATAL">ESTATAL</option>
                                            <option value="PARROQUIAL - ESTATAL">PARROQUIAL - ESTATAL</option>
                                            <option value="CONVENIO - OTROS">CONVENIO - OTROS</option>
                                            {formData.tipoGestion && !["ESTATAL", "PARROQUIAL - ESTATAL", "CONVENIO - OTROS"].includes(formData.tipoGestion) && (
                                                <option value={formData.tipoGestion}>{formData.tipoGestion}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cod. Modular Inicial-Intermedio</label>
                                        <input type="text" value={formData.codigoModularInicialIntermedio || ""} onChange={e => setFormData({ ...formData, codigoModularInicialIntermedio: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cod. Modular Avanzado</label>
                                        <input type="text" value={formData.codigoModularAvanzado || ""} onChange={e => setFormData({ ...formData, codigoModularAvanzado: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Distrito *</label>
                                        <input type="text" required value={formData.distrito} onChange={e => setFormData({ ...formData, distrito: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Dirección</label>
                                        <input type="text" value={formData.direccion || ""} onChange={e => setFormData({ ...formData, direccion: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Observaciones</label>
                                        <textarea value={formData.observaciones || ""} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} style={{ ...S.input, width: "100%", height: 70, boxSizing: "border-box", resize: "none" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Director / Contacto */}
                            {formTab === "director" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cargo</label>
                                        <input type="text" value={formData.cargo || ""} onChange={e => setFormData({ ...formData, cargo: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Nombres</label>
                                        <input type="text" value={formData.nombres || ""} onChange={e => setFormData({ ...formData, nombres: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apellido Paterno</label>
                                        <input type="text" value={formData.apellidoPaterno || ""} onChange={e => setFormData({ ...formData, apellidoPaterno: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apellido Materno</label>
                                        <input type="text" value={formData.apellidoMaterno || ""} onChange={e => setFormData({ ...formData, apellidoMaterno: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>DNI</label>
                                        <input type="text" maxLength={8} value={formData.dni || ""} onChange={e => setFormData({ ...formData, dni: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Celular</label>
                                        <input type="text" value={formData.celular || ""} onChange={e => setFormData({ ...formData, celular: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Correo Institucional</label>
                                        <input type="email" value={formData.correoInstitucional || ""} onChange={e => setFormData({ ...formData, correoInstitucional: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Correo Personal</label>
                                        <input type="text" value={formData.correoPersonal || ""} onChange={e => setFormData({ ...formData, correoPersonal: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Estadisticas y Personal */}
                            {formTab === "estadisticas" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: C.g700, cursor: "pointer" }}>
                                            <input type="checkbox" checked={Boolean(formData.presencial)} onChange={e => setFormData({ ...formData, presencial: e.target.checked })} />
                                            Presencial
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: C.g700, cursor: "pointer" }}>
                                            <input type="checkbox" checked={Boolean(formData.semipresencial)} onChange={e => setFormData({ ...formData, semipresencial: e.target.checked })} />
                                            Semipresencial
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: C.g700, cursor: "pointer" }}>
                                            <input type="checkbox" checked={Boolean(formData.aDistancia)} onChange={e => setFormData({ ...formData, aDistancia: e.target.checked })} />
                                            A Distancia
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: C.g700, cursor: "pointer" }}>
                                            <input type="checkbox" checked={Boolean(formData.cicloInicial)} onChange={e => setFormData({ ...formData, cicloInicial: e.target.checked })} />
                                            Ciclo Inicial
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: C.g700, cursor: "pointer" }}>
                                            <input type="checkbox" checked={Boolean(formData.cicloIntermedio)} onChange={e => setFormData({ ...formData, cicloIntermedio: e.target.checked })} />
                                            Ciclo Intermedio
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: C.g700, cursor: "pointer" }}>
                                            <input type="checkbox" checked={Boolean(formData.cicloAvanzado)} onChange={e => setFormData({ ...formData, cicloAvanzado: e.target.checked })} />
                                            Ciclo Avanzado
                                        </label>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Turnos</label>
                                            <input type="text" placeholder="Tarde / Noche" value={formData.turnos || ""} onChange={e => setFormData({ ...formData, turnos: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Cantidad Periféricos</label>
                                            <input type="number" min="0" value={formData.cantidadPerifericos ?? ""} onChange={e => setFormData({ ...formData, cantidadPerifericos: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>

                                    <div style={{ borderTop: `1px solid ${C.g100}`, paddingTop: 14 }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Estudiantes Matriculados (Censo)</label>
                                                <input type="number" min="0" value={formData.alumnosCenso ?? ""} onChange={e => setFormData({ ...formData, alumnosCenso: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Directivos y Jerárquicos</label>
                                                <input type="number" min="0" value={formData.directivosJerarquicos ?? ""} onChange={e => setFormData({ ...formData, directivosJerarquicos: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Docentes Nombrados</label>
                                                <input type="number" min="0" value={formData.docentesNombrados ?? ""} onChange={e => setFormData({ ...formData, docentesNombrados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Docentes Contratados</label>
                                                <input type="number" min="0" value={formData.docentesContratados ?? ""} onChange={e => setFormData({ ...formData, docentesContratados: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                            </div>
                                        </div>

                                        <div style={{ background: C.g50, borderRadius: 8, padding: 14, border: `1px solid ${C.g200}`, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: C.g700 }}>Total de Docentes (calculado):</span>
                                            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: C.navy4, fontFamily: "'JetBrains Mono', monospace" }}>
                                                {(numeroFormulario(formData.docentesNombrados) || 0) + (numeroFormulario(formData.docentesContratados) || 0) + (numeroFormulario(formData.directivosJerarquicos) || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Inclusion NEE */}
                            {formTab === "inclusion" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <h4 style={{ margin: 0, fontSize: "0.9rem", color: C.navy1, fontWeight: 700 }}>Estudiantes con Necesidades Educativas Especiales (NEE)</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apoyo Intermitente / Leve</label>
                                            <input type="number" min="0" value={formData.apoyoIntermitenteLeve ?? ""} onChange={e => setFormData({ ...formData, apoyoIntermitenteLeve: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apoyo Continuo / Moderado</label>
                                            <input type="number" min="0" value={formData.apoyoContinuoModerado ?? ""} onChange={e => setFormData({ ...formData, apoyoContinuoModerado: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Apoyo Intenso / Severo</label>
                                            <input type="number" min="0" value={formData.apoyoIntensoSevero ?? ""} onChange={e => setFormData({ ...formData, apoyoIntensoSevero: e.target.value })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 5: Sedes */}
                            {formTab === "sedes" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "0.82rem", color: C.g500 }}>Registre las sedes y locales anexos.</span>
                                        <button type="button" onClick={addSedeRow} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "6px 12px", fontSize: 11 }}>
                                            + Agregar Sede
                                        </button>
                                    </div>
                                    {formData.sedes.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: 24, border: `1px dashed ${C.g300}`, borderRadius: 8, color: C.g400, fontSize: "0.8rem" }}>
                                            No hay sedes registradas.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "35vh", overflowY: "auto" }}>
                                            {formData.sedes.map((s, idx) => (
                                                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr 1fr 1fr auto", gap: 8, background: C.g50, padding: 10, borderRadius: 6, border: `1px solid ${C.g200}`, alignItems: "center" }}>
                                                    <input type="text" placeholder="Tipo Sede" value={s.tipoSede || s.sede || ""} onChange={e => updateSedeRow(idx, "tipoSede", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="text" placeholder="Dirección" value={s.direccion || ""} onChange={e => updateSedeRow(idx, "direccion", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="text" placeholder="Atención" value={s.formaAtencion || ""} onChange={e => updateSedeRow(idx, "formaAtencion", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="text" placeholder="Días" value={s.dias || ""} onChange={e => updateSedeRow(idx, "dias", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="text" placeholder="Horario" value={s.horario || ""} onChange={e => updateSedeRow(idx, "horario", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <button type="button" onClick={() => removeSedeRow(idx)} style={{ background: "none", border: "none", color: C.red, fontSize: 16, cursor: "pointer" }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 6: Areas */}
                            {formTab === "areas" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "0.82rem", color: C.g500 }}>Registre las áreas curriculares y matrícula correspondiente.</span>
                                        <button type="button" onClick={addAreaRow} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "6px 12px", fontSize: 11 }}>
                                            + Agregar Área
                                        </button>
                                    </div>
                                    {formData.areas.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: 24, border: `1px dashed ${C.g300}`, borderRadius: 8, color: C.g400, fontSize: "0.8rem" }}>
                                            No hay áreas registradas.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "35vh", overflowY: "auto" }}>
                                            {formData.areas.map((a, idx) => (
                                                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 0.8fr auto", gap: 8, background: C.g50, padding: 10, borderRadius: 6, border: `1px solid ${C.g200}`, alignItems: "center" }}>
                                                    <input type="text" placeholder="Área Curricular" value={a.area || ""} onChange={e => updateAreaRow(idx, "area", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="text" placeholder="Ciclos" value={a.ciclos || ""} onChange={e => updateAreaRow(idx, "ciclos", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="text" placeholder="Turnos" value={a.turnos || ""} onChange={e => updateAreaRow(idx, "turnos", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="number" placeholder="Docentes" value={a.docentes ?? ""} onChange={e => updateAreaRow(idx, "docentes", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <input type="number" placeholder="Alumnos" value={a.estudiantes ?? ""} onChange={e => updateAreaRow(idx, "estudiantes", e.target.value)} style={{ ...S.input, padding: "5px 8px" }} />
                                                    <button type="button" onClick={() => removeAreaRow(idx)} style={{ background: "none", border: "none", color: C.red, fontSize: 16, cursor: "pointer" }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 7: A distancia */}
                            {formTab === "distancia" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>RD que autoriza</label>
                                        <input type="text" value={formData.atencionDistancia?.rd || ""} onChange={e => setFormData({ ...formData, atencionDistancia: { ...formData.atencionDistancia, rd: e.target.value } })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Estudiantes a distancia</label>
                                        <input type="number" value={formData.atencionDistancia?.estudiantes ?? ""} onChange={e => setFormData({ ...formData, atencionDistancia: { ...formData.atencionDistancia, estudiantes: numeroFormulario(e.target.value) } })} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Plataformas (separadas por coma o punto y coma)</label>
                                        <input type="text" value={formData.atencionDistancia?.plataformasTexto || (formData.atencionDistancia?.plataformas || []).join("; ") || ""} onChange={e => {
                                            const txtVal = e.target.value;
                                            const list = txtVal.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
                                            setFormData({ ...formData, atencionDistancia: { ...formData.atencionDistancia, plataformasTexto: txtVal, plataformas: list } });
                                        }} style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Días y Horario</label>
                                        <textarea value={formData.atencionDistancia?.diasHorario || ""} onChange={e => setFormData({ ...formData, atencionDistancia: { ...formData.atencionDistancia, diasHorario: e.target.value } })} style={{ ...S.input, width: "100%", height: 70, boxSizing: "border-box", resize: "none" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: C.g600, textTransform: "uppercase", marginBottom: 6 }}>Docentes que atienden</label>
                                        <textarea value={formData.atencionDistancia?.docentesTexto || ""} onChange={e => setFormData({ ...formData, atencionDistancia: { ...formData.atencionDistancia, docentesTexto: e.target.value } })} style={{ ...S.input, width: "100%", height: 70, boxSizing: "border-box", resize: "none" }} />
                                    </div>
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

            {/* ═══════════════════════════════════════════════════
               UPLOAD PREVIEW MODAL (4 BLOQUES REDISEÑADOS)
               ═══════════════════════════════════════════════════ */}
            {uploadPreview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }}>
                    <div style={{ ...S.card, padding: 0, width: "100%", maxWidth: 620, animation: "fadeIn 0.2s ease" }}>
                        <div style={{ padding: "20px 24px", borderBottom: `2px solid ${C.g100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display', serif" }}>
                                Vista Previa de Carga CEBA
                            </h3>
                            <button onClick={() => setUploadPreview(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: C.g400 }}>&times;</button>
                        </div>
                        <div style={{ padding: "20px 24px" }}>
                            {/* Bloque 1: Formato detectado */}
                            <div style={{ background: C.g50, padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.g200}`, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", color: C.navy3, fontWeight: 700 }}>
                                    Formato: {uploadPreview.formato === FORMATOS.CEBA_V2 ? "F-07-v2 (Directorio consolidado CEBA)" : "Legacy / Antiguo"}
                                </span>
                                <span style={{ fontSize: "0.72rem", color: C.g500 }}>{uploadPreview.nombreArchivo}</span>
                            </div>

                            {/* Bloque 2: Totales a cargar */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 16 }}>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "10px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: C.navy4 }}>{uploadPreview.items.length}</div>
                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>CEBAs</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "10px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: C.green }}>{fmt(uploadPreview.stats.estudiantes)}</div>
                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Estudiantes</div>
                                </div>
                                <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "10px", textAlign: "center" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: C.indigo }}>{fmt(uploadPreview.stats.docentes)}</div>
                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Docentes</div>
                                </div>
                                {uploadPreview.stats.areas > 0 && (
                                    <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "10px", textAlign: "center" }}>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: C.teal }}>{uploadPreview.stats.areas}</div>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Áreas</div>
                                    </div>
                                )}
                                {uploadPreview.stats.sedes > 0 && (
                                    <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "10px", textAlign: "center" }}>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: C.purple }}>{uploadPreview.stats.sedes}</div>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Sedes</div>
                                    </div>
                                )}
                                {uploadPreview.stats.personal > 0 && (
                                    <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "10px", textAlign: "center" }}>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: C.amber }}>{uploadPreview.stats.personal}</div>
                                        <div style={{ fontSize: "0.62rem", fontWeight: 600, color: C.g500, textTransform: "uppercase" }}>Personal</div>
                                    </div>
                                )}
                            </div>

                            {/* Bloque 3: Incidencias */}
                            <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, maxHeight: 150, overflowY: "auto", marginBottom: 16 }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", marginBottom: 6 }}>
                                    Incidencias y Validaciones ({uploadPreview.incidencias.length}):
                                </div>
                                {uploadPreview.incidencias.length === 0 ? (
                                    <div style={{ fontSize: "0.75rem", color: C.green }}>Archivo validado sin advertencias.</div>
                                ) : (
                                    uploadPreview.incidencias.map((inc, i) => (
                                        <div key={i} style={{ fontSize: "0.75rem", padding: "3px 0", borderBottom: `1px solid ${C.g100}`, display: "flex", gap: 8, alignItems: "center" }}>
                                            <span style={S.badge(
                                                inc.nivel === "error" ? "#FEF2F2" : (inc.nivel === "aviso" ? "#FFFBEB" : "#F1F5F9"),
                                                inc.nivel === "error" ? C.red : (inc.nivel === "aviso" ? C.amber : C.g600),
                                                inc.nivel === "error" ? "#FECACA" : (inc.nivel === "aviso" ? "#FDE68A" : "#E2E8F0")
                                            )}>
                                                {inc.nivel.toUpperCase()}
                                            </span>
                                            <span style={{ color: inc.nivel === "error" ? C.red : C.g700, flex: 1 }}>{inc.mensaje}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Bloque 4: Modo de carga */}
                            <div style={{ marginBottom: 18 }}>
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
                                            <div style={{ fontSize: "0.7rem", color: C.red }}>Borra todas las {data.length} instituciones</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button onClick={() => setUploadPreview(null)} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 6, padding: "8px 18px", fontSize: 12, fontWeight: 600, color: C.g600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmUpload}
                                    disabled={loading || uploadPreview.tieneErrores}
                                    style={{
                                        ...S.btn(uploadPreview.tieneErrores ? C.g400 : C.navy3, C.white, uploadPreview.tieneErrores ? C.g400 : C.navy4),
                                        padding: "8px 18px",
                                        fontSize: 12,
                                        opacity: (loading || uploadPreview.tieneErrores) ? 0.7 : 1,
                                        cursor: uploadPreview.tieneErrores ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {uploadPreview.tieneErrores ? "Corrija el archivo para continuar" : (loading ? "Subiendo..." : `Confirmar ${uploadMode === "merge" ? "Combinación" : "Reemplazo"}`)}
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
   SUB-COMPONENTES AUXILIARES
   ═══════════════════════════════════════════════════════════ */
function SectionTitle({ children }) {
    return (
        <div style={{
            fontSize: "0.75rem", fontWeight: 700, color: C.navy1, textTransform: "uppercase",
            letterSpacing: "0.06em", paddingBottom: 6, marginBottom: 12,
            borderBottom: `2px solid ${C.g100}`, fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 8
        }}>
            {children}
        </div>
    );
}

function FieldRow({ label, value, mono, span }) {
    if (!hayDato(value)) return null;
    return (
        <div style={span ? { gridColumn: "1 / -1" } : {}}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: C.g500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
            <div style={{ fontSize: "0.82rem", color: C.g800, fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif", fontWeight: 500 }}>
                {String(value)}
            </div>
        </div>
    );
}

function BoolBadge({ label, value }) {
    if (value === null || value === undefined) return null;
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px", borderRadius: 6,
            background: value ? "#F0FDF4" : C.g50,
            border: `1px solid ${value ? "#BBF7D0" : C.g200}`,
        }}>
            <div style={{
                width: 16, height: 16, borderRadius: 4,
                border: `2px solid ${value ? C.green : C.g300}`,
                background: value ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                {value && Icons.check(10, C.white)}
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: value ? C.green : C.g500, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        </div>
    );
}

function BigStat({ label, value, color, destacado }) {
    return (
        <div style={{
            background: `${color}08`,
            border: `1px solid ${destacado ? color : color + "20"}`,
            borderRadius: 8,
            padding: "12px 14px",
            textAlign: "center"
        }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, color }}>
                {fmt(value) ?? value}
            </div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: C.g600, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}>
                {label}
            </div>
        </div>
    );
}
