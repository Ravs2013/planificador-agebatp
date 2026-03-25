import { useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */

const LS_KEY_SEMANAL = 'agebatp_esinad_semanal';
const LS_KEY_ACUMULADO = 'agebatp_esinad_acumulado';

const C = {
    navy1: '#0C1929', navy2: '#122240', navy3: '#1B3A5C', navy4: '#1E4D7B', navy5: '#2563A0',
    gold1: '#CA8A04', gold2: '#D4A017',
    green: '#15803D', red: '#B91C1C', amber: '#B45309',
    white: '#FFFFFF', g50: '#F8FAFC', g100: '#F1F5F9', g200: '#D6DCE8', g300: '#CBD5E1',
    g400: '#94A3B8', g500: '#64748B', g600: '#475569',
    realNavy: '#1E4D7B',
    indigo: '#4338CA', teal: '#0F766E', docAmber: '#B45309', slate: '#475569',
};

const DOC_COLORS = { informes: C.indigo, oficios: C.teal, oficiosMultiples: C.docAmber, memorandums: C.slate };

const SPEC_COLORS = ['#1E4D7B', '#15803D', '#B45309', '#7C3AED', '#DC2626', '#0891B2'];

const PERSONAL = [
    { id: 1, fullNames: ['GUTIERREZ SILVA'], shortName: 'Gutierrez S.', nombre: 'Gutierrez Silva, Liz M.', rol: 'oficinista', tipo: '-' },
    { id: 2, fullNames: ['QUISPE SOLANO'], shortName: 'Quispe S.', nombre: 'Quispe Solano, Juan A.', rol: 'especialista', tipo: 'ETP' },
    { id: 3, fullNames: ['ALBINO IGREDA'], shortName: 'Albino I.', nombre: 'Albino Igreda, Nelida', rol: 'especialista', tipo: 'EBA' },
    { id: 4, fullNames: ['VILLALOBOS GONZALES'], shortName: 'Villalobos G.', nombre: 'Villalobos Gonzales, Francisco', rol: 'especialista', tipo: 'ETP' },
    { id: 5, fullNames: ['VASQUEZ ALIAGA'], shortName: 'Vasquez A.', nombre: 'Vasquez Aliaga, Lucy A.', rol: 'oficinista', tipo: '-' },
    { id: 6, fullNames: ['CUELLAR CORNELIO'], shortName: 'Cuellar C.', nombre: 'Cuellar Cornelio, Beronica O.', rol: 'oficinista', tipo: '-' },
];

const SKIP_NAMES = ['NINAMANGO', 'FBRC UGEL', 'FBRC'];

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function matchPerson(excelName) {
    if (!excelName) return null;
    const upper = excelName.toUpperCase().trim();
    if (SKIP_NAMES.some(s => upper.includes(s))) return null;
    for (const p of PERSONAL) {
        if (p.fullNames.some(fn => upper.includes(fn))) return p;
    }
    return null;
}

function classifyDoc(tipoDoc) {
    if (!tipoDoc || typeof tipoDoc !== 'string') return null;
    const t = tipoDoc.trim().toUpperCase();
    if (t.startsWith('EXPEDIENTE')) return null;
    if (t.startsWith('INFORME')) return 'informes';
    if (t.startsWith('OFICIO MULT') || t.startsWith('OFICIO MÚLT')) return 'oficiosMultiples';
    if (t.startsWith('OFICIO')) return 'oficios';
    if (t.startsWith('MEMORANDUM') || t.startsWith('MEMORÁNDUM')) return 'memorandums';
    return null;
}

function getCurrentISOWeek() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function formatWeek(w) {
    if (!w) return '';
    const [y, wk] = w.split('-W');
    return `Semana ${parseInt(wk)}, ${y}`;
}

function loadLS(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

/* ═══════════════════════════════════════════════════════
   CUSTOM TOOLTIP
   ═══════════════════════════════════════════════════════ */
const CTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: "'DM Sans'" }}>
            <p style={{ color: C.navy1, fontWeight: 700, fontSize: '0.82rem', margin: '0 0 6px' }}>{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: '0.78rem', margin: '2px 0', fontFamily: "'JetBrains Mono'" }}>{p.name}: {p.value?.toLocaleString?.() ?? p.value}</p>)}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════ */
const I = {
    upload: (s = 20, c = C.g500) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    file: (s = 20, c = C.g500) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    check: (s = 20, c = C.g500) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    trash: (s = 20, c = C.g500) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    chevDown: (s = 16, c = C.g500) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    chevUp: (s = 16, c = C.g500) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
};

/* ═══════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════ */
const StatCard = ({ icon, label, value, sub, border }) => (
    <div style={{ background: C.white, borderRadius: 8, padding: '16px 18px', border: `1px solid ${C.g200}`, borderLeft: `4px solid ${border}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>{icon}<span style={{ color: C.g500, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans'" }}>{label}</span></div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '1.6rem', fontWeight: 700, color: C.navy1, letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ color: C.g400, fontSize: '0.68rem', marginTop: 4, fontFamily: "'DM Sans'" }}>{sub}</div>}
    </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function EsinadExpedientes() {
    const [esinadWeeks, setEsinadWeeks] = useState(() => loadLS(LS_KEY_SEMANAL, []));
    const [selectedWeek, setSelectedWeek] = useState(getCurrentISOWeek());
    const [viewMode, setViewMode] = useState('semana'); // semana | acumulado
    const [expandedPerson, setExpandedPerson] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    /* ── Persist ── */
    const persist = useCallback((weeks) => {
        localStorage.setItem(LS_KEY_SEMANAL, JSON.stringify(weeks));
        // Recalculate acumulado
        const acum = {};
        PERSONAL.forEach(p => { acum[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 }; });
        weeks.forEach(w => {
            w.personas.forEach(pe => {
                if (acum[pe.personId]) {
                    acum[pe.personId].procesadosSinad += pe.procesadosSinad || 0;
                    acum[pe.personId].informes += pe.informes || 0;
                    acum[pe.personId].oficios += pe.oficios || 0;
                    acum[pe.personId].oficiosMultiples += pe.oficiosMultiples || 0;
                    acum[pe.personId].memorandums += pe.memorandums || 0;
                    acum[pe.personId].totalReal += pe.totalReal || 0;
                }
            });
        });
        localStorage.setItem(LS_KEY_ACUMULADO, JSON.stringify(acum));
    }, []);

    /* ── Process Excel ── */
    const processExcel = useCallback((file) => {
        setProcessing(true);
        setError('');
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

                // Find header row
                let headerIdx = -1;
                for (let i = 0; i < Math.min(rows.length, 15); i++) {
                    const row = rows[i];
                    if (row && row.some(c => String(c).toUpperCase().includes('ESPECIALISTA')) && row.some(c => String(c).toUpperCase().includes('EXPEDIENTE'))) {
                        headerIdx = i;
                        break;
                    }
                }
                if (headerIdx === -1) { setError('No se encontro la fila de encabezados (debe contener "Especialista" y "Expediente").'); setProcessing(false); return; }

                const dataRows = rows.slice(headerIdx + 1).filter(r => r && r.length > 2 && String(r[1] || '').trim());

                // Build per-person stats
                const personStats = {};
                PERSONAL.forEach(p => {
                    personStats[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 };
                });

                const allDocs = [];
                const seenDocs = new Set();

                dataRows.forEach(r => {
                    const especialista = String(r[1] || '').trim(); // col B
                    const expediente = String(r[2] || '').trim();   // col C
                    const tipoDoc = String(r[14] || '').trim();     // col O (0-indexed = 14)
                    const asuntoResp = String(r[13] || '').trim();  // col N
                    const fechaDeriv = String(r[20] || '').trim();  // col U

                    const person = matchPerson(especialista);
                    if (!person) return;

                    // Count brute E-SINAD
                    personStats[person.id].procesadosSinad++;

                    // Check for real production document
                    if (tipoDoc && !seenDocs.has(tipoDoc)) {
                        const cat = classifyDoc(tipoDoc);
                        if (cat) {
                            seenDocs.add(tipoDoc);
                            personStats[person.id][cat]++;
                            personStats[person.id].totalReal++;
                            allDocs.push({
                                tipoDocumento: tipoDoc,
                                categoria: cat === 'informes' ? 'Informes' : cat === 'oficios' ? 'Oficios' : cat === 'oficiosMultiples' ? 'Of. Multiples' : 'Memorandums',
                                especialista: especialista,
                                personId: person.id,
                                expediente: expediente,
                                asuntoRespuesta: asuntoResp,
                                fechaDerivacion: fechaDeriv,
                            });
                        }
                    }
                });

                const weekRecord = {
                    semana: selectedWeek,
                    fechaCarga: new Date().toISOString(),
                    nombreArchivo: file.name,
                    totalFilas: dataRows.length,
                    personas: PERSONAL.map(p => ({
                        personId: p.id,
                        nombreExcel: '',
                        shortName: p.shortName,
                        rol: p.rol,
                        tipo: p.tipo,
                        ...personStats[p.id],
                    })),
                    documentos: allDocs,
                };

                // Replace or add week
                const updated = esinadWeeks.filter(w => w.semana !== selectedWeek);
                updated.push(weekRecord);
                updated.sort((a, b) => a.semana.localeCompare(b.semana));
                setEsinadWeeks(updated);
                persist(updated);
                setError('');
            } catch (err) {
                setError(`Error procesando el archivo: ${err.message}`);
            }
            setProcessing(false);
        };
        reader.onerror = () => { setError('Error leyendo el archivo.'); setProcessing(false); };
        reader.readAsArrayBuffer(file);
    }, [selectedWeek, esinadWeeks, persist]);

    /* ── File handling ── */
    const handleFile = useCallback((file) => {
        if (!file) return;
        if (!file.name.match(/\.xlsx?$/i)) { setError('Solo archivos .xlsx o .xls'); return; }
        processExcel(file);
    }, [processExcel]);

    const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);
    const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
    const handleDragLeave = useCallback(() => setDragOver(false), []);

    /* ── Delete week ── */
    const deleteWeek = useCallback((sem) => {
        const updated = esinadWeeks.filter(w => w.semana !== sem);
        setEsinadWeeks(updated);
        persist(updated);
    }, [esinadWeeks, persist]);

    /* ── Derived data ── */
    const currentWeekData = useMemo(() => esinadWeeks.find(w => w.semana === selectedWeek), [esinadWeeks, selectedWeek]);

    const acumulado = useMemo(() => {
        const acum = {};
        PERSONAL.forEach(p => { acum[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 }; });
        esinadWeeks.forEach(w => {
            w.personas.forEach(pe => {
                if (acum[pe.personId]) {
                    acum[pe.personId].procesadosSinad += pe.procesadosSinad || 0;
                    acum[pe.personId].informes += pe.informes || 0;
                    acum[pe.personId].oficios += pe.oficios || 0;
                    acum[pe.personId].oficiosMultiples += pe.oficiosMultiples || 0;
                    acum[pe.personId].memorandums += pe.memorandums || 0;
                    acum[pe.personId].totalReal += pe.totalReal || 0;
                }
            });
        });
        return acum;
    }, [esinadWeeks]);

    const activeData = useMemo(() => {
        if (viewMode === 'semana' && currentWeekData) return currentWeekData.personas;
        if (viewMode === 'acumulado') return PERSONAL.map(p => ({ personId: p.id, shortName: p.shortName, rol: p.rol, tipo: p.tipo, ...acumulado[p.id] }));
        return [];
    }, [viewMode, currentWeekData, acumulado]);

    const activeDocs = useMemo(() => {
        if (viewMode === 'semana' && currentWeekData) return currentWeekData.documentos || [];
        if (viewMode === 'acumulado') return esinadWeeks.flatMap(w => w.documentos || []);
        return [];
    }, [viewMode, currentWeekData, esinadWeeks]);

    const kpis = useMemo(() => {
        const totalSinad = activeData.reduce((s, d) => s + (d.procesadosSinad || 0), 0);
        const totalReal = activeData.reduce((s, d) => s + (d.totalReal || 0), 0);
        return { totalSinad, totalReal, eficiencia: totalSinad > 0 ? Math.round(totalReal / totalSinad * 100) : 0, semanasCount: esinadWeeks.length };
    }, [activeData, esinadWeeks.length]);

    const barData = useMemo(() => activeData.map(d => ({
        nombre: d.shortName,
        'E-SINAD': d.procesadosSinad || 0,
        'Prod. Real': d.totalReal || 0,
    })), [activeData]);

    const barDataDesglose = useMemo(() => activeData.map(d => ({
        nombre: d.shortName,
        Informes: d.informes || 0,
        Oficios: d.oficios || 0,
        'Of. Multiples': d.oficiosMultiples || 0,
        Memorandums: d.memorandums || 0,
    })), [activeData]);

    /* ── Styles ── */
    const card = { background: C.white, borderRadius: 8, padding: 20, border: `1px solid ${C.g200}`, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' };
    const h3s = { color: C.navy1, fontSize: '1rem', margin: '0 0 16px', fontFamily: "'DM Serif Display',serif" };
    const labelStyle = { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans'" };
    const inputStyle = { width: '100%', padding: '9px 14px', borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: '#1E293B', fontFamily: "'DM Sans'", fontSize: 13, boxSizing: 'border-box' };

    const hasData = activeData.length > 0 && activeData.some(d => d.procesadosSinad > 0);

    return (
        <div>
            {/* ── Upload Panel ── */}
            <div style={{ ...card, marginBottom: 20 }}>
                <h3 style={h3s}>Carga Semanal E-SINAD</h3>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
                    <div style={{ flex: '0 0 auto' }}>
                        <label style={labelStyle}>Semana</label>
                        <input type="week" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={{ ...inputStyle, width: 210 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setViewMode('semana')} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${viewMode === 'semana' ? C.navy4 : C.g200}`, background: viewMode === 'semana' ? C.navy4 : C.white, color: viewMode === 'semana' ? C.white : C.g600, cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600 }}>Semana</button>
                        <button onClick={() => setViewMode('acumulado')} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${viewMode === 'acumulado' ? C.navy4 : C.g200}`, background: viewMode === 'acumulado' ? C.navy4 : C.white, color: viewMode === 'acumulado' ? C.white : C.g600, cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600 }}>Acumulado</button>
                    </div>
                    {esinadWeeks.length > 0 && (
                        <div style={{ flex: '0 0 auto' }}>
                            <label style={labelStyle}>Semanas cargadas</label>
                            <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={{ ...inputStyle, width: 200 }}>
                                {esinadWeeks.map(w => <option key={w.semana} value={w.semana}>{formatWeek(w.semana)}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Current week info */}
                {currentWeekData && (
                    <div style={{ padding: '10px 14px', background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 6, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {I.check(16, C.green)}
                            <span style={{ fontSize: 12, color: C.green, fontWeight: 600, fontFamily: "'DM Sans'" }}>Datos cargados: {new Date(currentWeekData.fechaCarga).toLocaleDateString()} — {currentWeekData.nombreArchivo} ({currentWeekData.totalFilas} filas)</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => fileRef.current?.click()} style={{ padding: '5px 12px', borderRadius: 5, border: `1px solid ${C.amber}`, background: C.white, color: C.amber, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans'" }}>Reemplazar</button>
                            <button onClick={() => deleteWeek(selectedWeek)} style={{ padding: '5px 12px', borderRadius: 5, border: `1px solid ${C.red}`, background: C.white, color: C.red, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 4 }}>{I.trash(13, C.red)} Eliminar</button>
                        </div>
                    </div>
                )}

                {/* Drop zone */}
                <div
                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? C.navy4 : C.g300}`, borderRadius: 8,
                        padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                        background: dragOver ? `${C.navy4}08` : C.g50,
                        transition: 'all 0.2s',
                    }}
                >
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
                    {processing ? (
                        <div style={{ color: C.navy4, fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600 }}>Procesando archivo...</div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 8 }}>{I.upload(32, dragOver ? C.navy4 : C.g400)}</div>
                            <div style={{ color: C.navy1, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'", marginBottom: 4 }}>Arrastra el Excel del E-SINAD aqui</div>
                            <div style={{ color: C.g400, fontSize: 11, fontFamily: "'DM Sans'" }}>o haz click para seleccionar (.xlsx)</div>
                        </>
                    )}
                </div>
                {error && <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: C.red, fontSize: 12, fontFamily: "'DM Sans'" }}>{error}</div>}
            </div>

            {/* ── KPIs ── */}
            {hasData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
                    <StatCard icon={I.file(18, C.green)} label="Total E-SINAD" value={kpis.totalSinad.toLocaleString()} sub={viewMode === 'semana' ? formatWeek(selectedWeek) : 'Acumulado total'} border={C.green} />
                    <StatCard icon={I.file(18, C.realNavy)} label="Prod. Real" value={kpis.totalReal.toLocaleString()} sub="Documentos unicos" border={C.realNavy} />
                    <StatCard icon={I.check(18, kpis.eficiencia >= 30 ? C.green : kpis.eficiencia >= 15 ? C.amber : C.red)} label="Eficiencia" value={`${kpis.eficiencia}%`} sub="Real / E-SINAD" border={kpis.eficiencia >= 30 ? C.green : kpis.eficiencia >= 15 ? C.amber : C.red} />
                    <StatCard icon={I.file(18, C.navy4)} label="Semanas Cargadas" value={kpis.semanasCount} sub="Total de semanas" border={C.navy4} />
                </div>
            )}

            {/* ── Charts ── */}
            {hasData && (
                <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
                    {/* Bar: E-SINAD vs Real */}
                    <div style={card}>
                        <h3 style={h3s}>E-SINAD vs Produccion Real — {viewMode === 'semana' ? formatWeek(selectedWeek) : 'Acumulado'}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="E-SINAD" fill={C.green} radius={[4, 4, 0, 0]} /><Bar dataKey="Prod. Real" fill={C.realNavy} radius={[4, 4, 0, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stacked: Desglose */}
                    <div style={card}>
                        <h3 style={h3s}>Desglose Produccion Real — {viewMode === 'semana' ? formatWeek(selectedWeek) : 'Acumulado'}</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barDataDesglose} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.g200} /><XAxis dataKey="nombre" tick={{ fill: C.g500, fontSize: 10, fontFamily: "'DM Sans'" }} /><YAxis tick={{ fill: C.g500, fontSize: 11, fontFamily: "'JetBrains Mono'" }} /><Tooltip content={<CTip />} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} /><Bar dataKey="Informes" stackId="real" fill={DOC_COLORS.informes} /><Bar dataKey="Oficios" stackId="real" fill={DOC_COLORS.oficios} /><Bar dataKey="Of. Multiples" stackId="real" fill={DOC_COLORS.oficiosMultiples} /><Bar dataKey="Memorandums" stackId="real" fill={DOC_COLORS.memorandums} radius={[4, 4, 0, 0]} /></BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Detail Table ── */}
            {hasData && (
                <div style={{ ...card, padding: 0, overflow: 'auto', marginBottom: 20 }}>
                    <div style={{ padding: '14px 18px', background: `${C.navy4}08`, borderBottom: `2px solid ${C.navy4}25` }}>
                        <h3 style={{ color: C.navy1, fontSize: '1rem', margin: 0, fontFamily: "'DM Serif Display',serif" }}>Detalle por Especialista — {viewMode === 'semana' ? formatWeek(selectedWeek) : 'Acumulado'}</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 70px 80px 60px 60px 60px 65px 70px 70px', padding: '10px 14px', gap: 6, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 750 }}>
                            {['#', 'Especialista', 'Rol', 'E-SINAD', 'Inf.', 'Ofi.', 'Of.M.', 'Memo.', 'Total Real', 'Eficiencia'].map(h => <p key={h} style={{ color: C.g500, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontFamily: "'DM Sans'", textAlign: h === '#' || h === 'Especialista' ? 'left' : 'center' }}>{h}</p>)}
                        </div>
                        {activeData.map((d, i) => {
                            const eff = d.procesadosSinad > 0 ? Math.round(d.totalReal / d.procesadosSinad * 100) : 0;
                            const effColor = eff >= 30 ? C.green : eff >= 15 ? C.amber : C.red;
                            return (
                                <div key={d.personId || i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 70px 80px 60px 60px 60px 65px 70px 70px', alignItems: 'center', padding: '12px 14px', gap: 6, borderBottom: `1px solid ${C.g100}`, transition: 'background 0.15s', minWidth: 750 }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${C.gold2}18`, color: C.gold1, fontWeight: 700, fontSize: '0.75rem', fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
                                    <div><p style={{ color: C.navy1, fontWeight: 600, fontSize: '0.82rem', margin: 0, fontFamily: "'DM Sans'" }}>{d.shortName}</p></div>
                                    <p style={{ textAlign: 'center', color: C.g600, fontSize: '0.7rem', margin: 0, fontFamily: "'DM Sans'", textTransform: 'capitalize' }}>{d.rol}</p>
                                    <p style={{ textAlign: 'center', color: C.green, fontWeight: 700, fontSize: '0.88rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.procesadosSinad || 0}</p>
                                    <p style={{ textAlign: 'center', color: DOC_COLORS.informes, fontWeight: 600, fontSize: '0.82rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.informes || 0}</p>
                                    <p style={{ textAlign: 'center', color: DOC_COLORS.oficios, fontWeight: 600, fontSize: '0.82rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.oficios || 0}</p>
                                    <p style={{ textAlign: 'center', color: DOC_COLORS.oficiosMultiples, fontWeight: 600, fontSize: '0.82rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.oficiosMultiples || 0}</p>
                                    <p style={{ textAlign: 'center', color: DOC_COLORS.memorandums, fontWeight: 600, fontSize: '0.82rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.memorandums || 0}</p>
                                    <p style={{ textAlign: 'center', color: C.realNavy, fontWeight: 700, fontSize: '0.88rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{d.totalReal || 0}</p>
                                    <p style={{ textAlign: 'center', color: effColor, fontWeight: 700, fontSize: '0.82rem', margin: 0, fontFamily: "'JetBrains Mono'" }}>{eff}%</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Documents List (expandable) ── */}
            {hasData && activeDocs.length > 0 && (
                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', background: `${C.indigo}08`, borderBottom: `2px solid ${C.indigo}25` }}>
                        <h3 style={{ color: C.navy1, fontSize: '1rem', margin: 0, fontFamily: "'DM Serif Display',serif" }}>Documentos Generados ({activeDocs.length})</h3>
                    </div>
                    {PERSONAL.map(p => {
                        const docs = activeDocs.filter(d => d.personId === p.id);
                        if (docs.length === 0) return null;
                        const isExpanded = expandedPerson === p.id;
                        return (
                            <div key={p.id}>
                                <div
                                    onClick={() => setExpandedPerson(isExpanded ? null : p.id)}
                                    style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: `1px solid ${C.g100}`, background: isExpanded ? C.g50 : 'transparent', transition: 'background 0.15s' }}
                                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.g50; }}
                                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', fontFamily: "'JetBrains Mono'", background: p.tipo === 'EBA' ? `${C.navy5}15` : p.tipo === 'ETP' ? `${C.gold2}15` : `${C.g500}15`, color: p.tipo === 'EBA' ? C.navy5 : p.tipo === 'ETP' ? C.gold1 : C.g600 }}>{p.tipo === '-' ? 'OFIC' : p.tipo}</span>
                                        <span style={{ fontSize: '0.85rem', color: C.navy1, fontWeight: 600, fontFamily: "'DM Sans'" }}>{p.shortName}</span>
                                        <span style={{ fontSize: '0.72rem', color: C.g400, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>({docs.length} doc{docs.length !== 1 ? 's' : ''})</span>
                                    </div>
                                    {isExpanded ? I.chevUp(16, C.g500) : I.chevDown(16, C.g500)}
                                </div>
                                {isExpanded && (
                                    <div style={{ padding: '0 18px 12px' }}>
                                        {docs.map((doc, di) => (
                                            <div key={di} style={{ padding: '10px 14px', borderRadius: 6, background: C.g50, marginTop: 8, border: `1px solid ${C.g100}` }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: DOC_COLORS[doc.categoria === 'Informes' ? 'informes' : doc.categoria === 'Oficios' ? 'oficios' : doc.categoria === 'Of. Multiples' ? 'oficiosMultiples' : 'memorandums'] + '18', color: DOC_COLORS[doc.categoria === 'Informes' ? 'informes' : doc.categoria === 'Oficios' ? 'oficios' : doc.categoria === 'Of. Multiples' ? 'oficiosMultiples' : 'memorandums'], fontFamily: "'JetBrains Mono'", letterSpacing: '0.04em' }}>{doc.categoria.toUpperCase()}</span>
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: C.navy1, fontWeight: 600, fontFamily: "'JetBrains Mono'", marginBottom: 4, wordBreak: 'break-all' }}>{doc.tipoDocumento}</div>
                                                {doc.expediente && <div style={{ fontSize: '0.72rem', color: C.g500, fontFamily: "'DM Sans'" }}>Expediente: {doc.expediente}</div>}
                                                {doc.asuntoRespuesta && <div style={{ fontSize: '0.72rem', color: C.g500, fontFamily: "'DM Sans'", marginTop: 2 }}>{doc.asuntoRespuesta.substring(0, 120)}{doc.asuntoRespuesta.length > 120 ? '...' : ''}</div>}
                                                {doc.fechaDerivacion && <div style={{ fontSize: '0.68rem', color: C.g400, fontFamily: "'JetBrains Mono'", marginTop: 2 }}>Derivado: {doc.fechaDerivacion}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Empty State ── */}
            {!hasData && (
                <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                    {I.file(48, C.g300)}
                    <h3 style={{ color: C.navy1, fontSize: '1.2rem', margin: '16px 0 8px', fontFamily: "'DM Serif Display',serif" }}>
                        {viewMode === 'semana' ? `Sin datos para ${formatWeek(selectedWeek)}` : 'Sin datos acumulados'}
                    </h3>
                    <p style={{ color: C.g500, fontSize: '0.85rem', fontFamily: "'DM Sans'" }}>
                        Sube un archivo Excel del E-SINAD usando el panel de carga superior.
                    </p>
                </div>
            )}
        </div>
    );
}
