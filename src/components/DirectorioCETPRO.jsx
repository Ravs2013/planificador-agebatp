import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ═══════════════════════════════════════════════════════════
   PALETA
   ═══════════════════════════════════════════════════════════ */
const C = {
    navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
    gold1: "#A16207", gold2: "#CA8A04",
    g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0", g100: "#F1F5F9", g50: "#F8FAFC",
    white: "#FFFFFF", green: "#15803D", amber: "#B45309",
};

const LS_KEY = "agebatp_directorio_cetpro";

/* ═══════════════════════════════════════════════════════════
   SVG ICON HELPER
   ═══════════════════════════════════════════════════════════ */
const SvgIcon = ({ children, size = 20, color = C.g500, style: s, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...s }} {...props}>{children}</svg>
);

const Icons = {
    school: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" /></SvgIcon>,
    upload: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></SvgIcon>,
    download: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SvgIcon>,
    search: (sz, cl) => <SvgIcon size={sz} color={cl}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></SvgIcon>,
    x: (sz, cl) => <SvgIcon size={sz} color={cl}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></SvgIcon>,
    mapPin: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></SvgIcon>,
    users: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></SvgIcon>,
    mail: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></SvgIcon>,
    phone: (sz, cl) => <SvgIcon size={sz} color={cl}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></SvgIcon>,
};

const S = {
    card: { background: C.white, border: `1px solid ${C.g200}`, borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(15,23,42,0.06)" },
    badge: (bg, color, border) => ({ fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: bg, color, border: `1px solid ${border || color + "30"}`, letterSpacing: 0.3, fontFamily: "'JetBrains Mono'" }),
    input: { padding: "9px 14px", borderRadius: 6, border: "1px solid #D6DCE8", fontFamily: "'DM Sans'", fontSize: 13, background: C.white, color: "#1E293B", outline: "none" },
    btn: (bg, color, border) => ({ padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s" }),
};

/* ═══════════════════════════════════════════════════════════
   FLEXIBLE EXCEL PARSER
   ═══════════════════════════════════════════════════════════ */
function parseDirectorioCETPRO(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                // Try to auto-detect header row (first row with >= 8 non-empty cells)
                let headerIdx = -1;
                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                    const nonEmpty = (rows[i] || []).filter(c => c !== "" && c !== null && c !== undefined).length;
                    if (nonEmpty >= 8) { headerIdx = i; break; }
                }
                if (headerIdx === -1) headerIdx = 3; // fallback to row 4 like CEBA

                const headers = (rows[headerIdx] || []).map(h => String(h).trim().toUpperCase());
                const dataRows = rows.slice(headerIdx + 1);

                // Build column index map
                const findCol = (...keywords) => {
                    return headers.findIndex(h => keywords.some(kw => h.includes(kw.toUpperCase())));
                };

                const colN = findCol("N");
                const colNombre = findCol("NOMBRE", "CETPRO", "INSTITUCION");
                const colDistrito = findCol("DISTRITO");
                const colGestion = findCol("GESTION");
                const colDireccion = findCol("DIRECCION", "DIRECCIÓN");
                const colCargo = findCol("CARGO");
                const colApPat = findCol("PATERNO");
                const colApMat = findCol("MATERNO");
                const colNombres = findCol("NOMBRES");
                const colDNI = findCol("DNI");
                const colCorreoInst = findCol("CORREO INST", "EMAIL INST");
                const colCorreoPers = findCol("CORREO PERS", "EMAIL PERS");
                const colCelular = findCol("CELULAR", "TELEFONO");

                const cetpros = [];
                let current = null;

                for (let i = 0; i < dataRows.length; i++) {
                    const r = dataRows[i];
                    if (!r || r.length < 3) continue;

                    const nVal = colN >= 0 ? r[colN] : r[0];
                    const isMain = nVal !== "" && nVal !== null && nVal !== undefined && Number.isInteger(Number(nVal)) && Number(nVal) > 0;

                    if (isMain) {
                        if (current) cetpros.push(current);
                        const toStr = (idx) => idx >= 0 && r[idx] != null ? String(r[idx]).trim() : "";
                        current = {
                            n: parseInt(nVal) || 0,
                            nombre: toStr(colNombre),
                            distrito: toStr(colDistrito),
                            tipoGestion: toStr(colGestion),
                            direccion: toStr(colDireccion),
                            cargo: toStr(colCargo),
                            apellidoPaterno: toStr(colApPat),
                            apellidoMaterno: toStr(colApMat),
                            nombres: toStr(colNombres),
                            dni: toStr(colDNI),
                            correoInstitucional: toStr(colCorreoInst),
                            correoPersonal: toStr(colCorreoPers),
                            celular: toStr(colCelular),
                            // Store all raw fields for future flexibility
                            rawFields: {},
                        };
                        // Store remaining columns as rawFields
                        headers.forEach((h, idx) => {
                            if (idx !== colN && r[idx] != null && String(r[idx]).trim()) {
                                current.rawFields[h] = String(r[idx]).trim();
                            }
                        });
                    }
                }
                if (current) cetpros.push(current);
                resolve(cetpros);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsArrayBuffer(file);
    });
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
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function DirectorioCETPRO() {
    const [data, setData] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [distritoFilter, setDistritoFilter] = useState("todos");
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const fileRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        if (data.length > 0) localStorage.setItem(LS_KEY, JSON.stringify(data));
    }, [data]);

    const distritos = useMemo(() => {
        const set = new Set(data.map(c => c.distrito).filter(Boolean));
        return [...set].sort();
    }, [data]);

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
        if (distritoFilter !== "todos") f = f.filter(c => c.distrito === distritoFilter);
        return f;
    }, [data, searchTerm, distritoFilter]);

    const kpis = useMemo(() => ({
        total: data.length,
        distritosUnicos: new Set(data.map(c => c.distrito).filter(Boolean)).size,
    }), [data]);

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const parsed = await parseDirectorioCETPRO(file);
            setData(parsed);
        } catch (err) {
            console.error("Error parsing CETPRO Excel:", err);
            alert("Error al parsear el archivo Excel. Verifique el formato.");
        }
        setLoading(false);
        if (fileRef.current) fileRef.current.value = "";
    }, []);

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
            pdf.save("Directorio_CETPRO_UGEL03.pdf");
        } catch (err) { console.error("Error exporting PDF:", err); }
        setExporting(false);
    }, []);

    const directorName = (c) => [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");

    /* EMPTY STATE */
    if (data.length === 0 && !loading) {
        return (
            <div style={{ textAlign: "center", padding: 80 }}>
                {Icons.school(56, C.g300)}
                <h3 style={{ color: C.navy1, fontSize: "1.3rem", margin: "20px 0 10px", fontFamily: "'DM Serif Display',serif" }}>
                    Directorio CETPRO - UGEL 03
                </h3>
                <p style={{ color: C.g500, fontSize: "0.9rem", fontFamily: "'DM Sans'", maxWidth: 460, margin: "0 auto 24px" }}>
                    No hay datos de CETPRO cargados. Suba el archivo Excel del directorio CETPRO.
                </p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
                <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(C.navy4, C.white, C.navy5), padding: "12px 28px", fontSize: 14, margin: "0 auto" }}>
                    {Icons.upload(16, C.white)} Cargar Excel del Directorio CETPRO
                </button>
            </div>
        );
    }

    /* MAIN RENDER */
    return (
        <div>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ color: C.navy1, fontSize: "1.4rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>
                        Directorio CETPRO - UGEL 03
                    </h2>
                    <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0", fontFamily: "'DM Sans'" }}>
                        Centros de Educacion Tecnico Productiva · {kpis.total} instituciones registradas
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

            <div ref={contentRef}>
                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <StatCard icon={Icons.school(20, C.navy4)} label="Total CETPRO" value={kpis.total} sub="Instituciones registradas" border={C.navy4} />
                    <StatCard icon={Icons.mapPin(20, "#0F766E")} label="Distritos" value={kpis.distritosUnicos} sub="Distritos atendidos" border="#0F766E" />
                </div>

                {/* CARD GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
                    {filtered.map((item, idx) => {
                        const isEstatal = (item.tipoGestion || "").toUpperCase().includes("ESTATAL");
                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                style={{ ...S.card, cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.12)"; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,0.06)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Sans'", lineHeight: 1.3, flex: 1 }}>{item.nombre}</h4>
                                    <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap" }}>
                                        {item.tipoGestion && <span style={S.badge(isEstatal ? "#F0FDF4" : "#FFFBEB", isEstatal ? C.green : C.amber, isEstatal ? "#BBF7D0" : "#FDE68A")}>{isEstatal ? "ESTATAL" : "CONVENIO"}</span>}
                                        {item.distrito && <span style={S.badge(`${C.navy5}15`, C.navy5, `${C.navy5}30`)}>{item.distrito}</span>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 6, background: C.navy3, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0, fontFamily: "'JetBrains Mono'" }}>
                                        {(item.nombres || "D")[0]}{(item.apellidoPaterno || "R")[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.navy1, fontFamily: "'DM Sans'" }}>{directorName(item) || "Sin responsable"}</div>
                                        <div style={{ fontSize: "0.68rem", color: C.g500, fontFamily: "'DM Sans'" }}>{item.cargo || ""}</div>
                                    </div>
                                </div>
                                {item.correoInstitucional && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginBottom: 4 }}>{Icons.mail(11, C.g400)}<span>{item.correoInstitucional}</span></div>}
                                {item.celular && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'", marginBottom: 4 }}>{Icons.phone(11, C.g400)}<span>{item.celular}</span></div>}
                                {item.direccion && <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.72rem", color: C.g500, fontFamily: "'DM Sans'" }}>{Icons.mapPin(11, C.g400)}<span style={{ lineHeight: 1.3 }}>{item.direccion}</span></div>}
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

            {/* DETAIL MODAL */}
            {selectedItem && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease" }} onClick={() => setSelectedItem(null)}>
                    <div style={{ ...S.card, padding: 28, width: "100%", maxWidth: 600, maxHeight: "85vh", overflowY: "auto", animation: "fadeIn 0.2s ease" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                            <div>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                    {selectedItem.tipoGestion && <span style={S.badge((selectedItem.tipoGestion || "").toUpperCase().includes("ESTATAL") ? "#F0FDF4" : "#FFFBEB", (selectedItem.tipoGestion || "").toUpperCase().includes("ESTATAL") ? C.green : C.amber)}>{selectedItem.tipoGestion}</span>}
                                    {selectedItem.distrito && <span style={S.badge(`${C.navy5}15`, C.navy5)}>{selectedItem.distrito}</span>}
                                </div>
                                <h2 style={{ fontSize: "1.3rem", fontFamily: "'DM Serif Display',serif", color: C.navy1, margin: 0 }}>{selectedItem.nombre}</h2>
                            </div>
                            <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.g400, padding: 4 }}>{Icons.x(22, C.g400)}</button>
                        </div>

                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy1, textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 10, marginBottom: 14, borderBottom: `2px solid ${C.g100}`, fontFamily: "'DM Sans'" }}>Responsable</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                            {selectedItem.cargo && <FieldRow label="Cargo" value={selectedItem.cargo} />}
                            <FieldRow label="Nombre Completo" value={directorName(selectedItem)} />
                            {selectedItem.dni && <FieldRow label="DNI" value={selectedItem.dni} mono />}
                            {selectedItem.correoInstitucional && <FieldRow label="Correo Institucional" value={selectedItem.correoInstitucional} />}
                            {selectedItem.correoPersonal && <FieldRow label="Correo Personal" value={selectedItem.correoPersonal} />}
                            {selectedItem.celular && <FieldRow label="Celular" value={selectedItem.celular} mono />}
                        </div>

                        {selectedItem.direccion && (
                            <>
                                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy1, textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 10, marginBottom: 14, borderBottom: `2px solid ${C.g100}`, fontFamily: "'DM Sans'" }}>Ubicacion</div>
                                <div style={{ fontSize: "0.82rem", color: "#334155", fontFamily: "'DM Sans'", marginBottom: 24 }}>{selectedItem.direccion}</div>
                            </>
                        )}

                        {/* Additional raw fields */}
                        {Object.keys(selectedItem.rawFields || {}).length > 0 && (
                            <>
                                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.navy1, textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 10, marginBottom: 14, borderBottom: `2px solid ${C.g100}`, fontFamily: "'DM Sans'" }}>Datos Adicionales</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 24 }}>
                                    {Object.entries(selectedItem.rawFields).map(([k, v]) => (
                                        <FieldRow key={k} label={k} value={v} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* SUB-COMPONENTS */
function FieldRow({ label, value, mono }) {
    return (
        <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2, fontFamily: "'DM Sans'" }}>{label}</div>
            <div style={{ fontSize: "0.82rem", color: value ? "#1E293B" : "#94A3B8", fontFamily: mono ? "'JetBrains Mono'" : "'DM Sans'", fontWeight: value ? 500 : 400 }}>{value || "—"}</div>
        </div>
    );
}
