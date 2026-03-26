import { useState, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════
   CONSTANTS & PALETA
   ═══════════════════════════════════════════════════════ */
const LS_KEY = 'agebatp_esinad_semanal';

const C = {
    navy1: '#0C1929', navy2: '#122240', navy3: '#1B3A5C', navy4: '#1E4D7B', navy5: '#2563A0',
    gold1: '#CA8A04', gold2: '#D4A017',
    green: '#15803D', red: '#B91C1C', amber: '#B45309',
    white: '#FFFFFF', g50: '#F8FAFC', g100: '#F1F5F9', g200: '#D6DCE8', g300: '#CBD5E1',
    g400: '#94A3B8', g500: '#64748B', g600: '#475569',
    indigo: '#4338CA', teal: '#0F766E', docAmber: '#B45309', slate: '#475569',
};

const DOC_BORDER = { Informes: '#4338CA', Oficios: '#0F766E', 'Of. Multiples': '#B45309', Memorandums: '#475569' };
const DOC_BG = { Informes: '#EEF2FF', Oficios: '#F0FDFA', 'Of. Multiples': '#FFFBEB', Memorandums: '#F8FAFC' };

const TIPO_BADGE = {
    ETP: { bg: '#FEF9C3', color: '#A16207', border: '#FDE68A' },
    EBA: { bg: '#DBEAFE', color: '#1E4D7B', border: '#BFDBFE' },
    '-': { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
};

/* Unique color per person id — visually distinct */
const PERSON_COLORS = {
    1: '#1E4D7B', 2: '#7C3AED', 3: '#0F766E', 4: '#B45309', 5: '#DC2626', 6: '#0891B2',
};

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function loadData() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

function formatDateDMY(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
}

function fmtWeek(w) {
    if (!w) return '';
    const [y, wk] = w.split('-W');
    return `Semana ${parseInt(wk)}, ${y}`;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function EsinadExpedientes() {
    const [weeks] = useState(loadData);
    const [filterTipo, setFilterTipo] = useState('todos');
    const [filterPersonal, setFilterPersonal] = useState('todos');
    const [filterSemana, setFilterSemana] = useState('todas');
    const [searchText, setSearchText] = useState('');
    const [sortByDate, setSortByDate] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);

    /* Gather all documents across all weeks */
    const allDocs = useMemo(() => {
        const docs = [];
        weeks.forEach(w => {
            (w.documentos || []).forEach(d => {
                docs.push({ ...d, semana: w.semana });
            });
        });
        return docs;
    }, [weeks]);

    /* Unique persons for filter */
    const personOptions = useMemo(() => {
        const map = new Map();
        allDocs.forEach(d => { if (d.personId && d.shortName) map.set(d.personId, d.shortName); });
        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [allDocs]);

    /* Available weeks */
    const weekOptions = useMemo(() => [...new Set(weeks.map(w => w.semana))].sort(), [weeks]);

    /* Filter & sort */
    const filtered = useMemo(() => {
        let f = [...allDocs];
        if (filterTipo !== 'todos') f = f.filter(d => d.categoria === filterTipo);
        if (filterPersonal !== 'todos') f = f.filter(d => String(d.personId) === filterPersonal);
        if (filterSemana !== 'todas') f = f.filter(d => d.semana === filterSemana);
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            f = f.filter(d =>
                (d.tipoDocumento || '').toLowerCase().includes(q) ||
                (d.expediente || '').toLowerCase().includes(q) ||
                (d.asuntoRespuesta || '').toLowerCase().includes(q) ||
                (d.asuntoExpediente || '').toLowerCase().includes(q) ||
                (d.especialista || '').toLowerCase().includes(q) ||
                (d.shortName || '').toLowerCase().includes(q)
            );
        }
        if (sortByDate) {
            f.sort((a, b) => (b.fechaDerivacion || '').localeCompare(a.fechaDerivacion || ''));
        }
        return f;
    }, [allDocs, filterTipo, filterPersonal, filterSemana, searchText, sortByDate]);

    /* Counters */
    const counts = useMemo(() => {
        const c = { total: filtered.length, Informes: 0, Oficios: 0, 'Of. Multiples': 0, Memorandums: 0 };
        filtered.forEach(d => { if (c[d.categoria] !== undefined) c[d.categoria]++; });
        return c;
    }, [filtered]);

    /* Styles */
    const card = { background: C.white, borderRadius: 10, border: `1px solid ${C.g200}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
    const inputS = { padding: '9px 14px', borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: '#1E293B', fontFamily: "'DM Sans'", fontSize: 13, outline: 'none' };

    /* Empty state */
    if (allDocs.length === 0) {
        return (
            <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={C.g300} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3 style={{ color: C.navy1, fontSize: '1.2rem', margin: '0 0 8px', fontFamily: "'DM Serif Display',serif" }}>No hay expedientes cargados</h3>
                <p style={{ color: C.g500, fontSize: '0.85rem', fontFamily: "'DM Sans'", maxWidth: 400, margin: '0 auto' }}>
                    Sube un Excel E-SINAD desde el tab <strong>Monitoreo</strong> (vista E-SINAD) para ver los documentos procesados aqui.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ color: C.navy1, fontSize: '1.3rem', margin: '0 0 4px', fontFamily: "'DM Serif Display',serif" }}>Expedientes</h2>
                <p style={{ color: C.g500, fontSize: '0.82rem', margin: 0, fontFamily: "'DM Sans'" }}>Documentos procesados del E-SINAD</p>
            </div>

            {/* Counters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, padding: '12px 18px', borderLeft: `4px solid ${C.navy4}`, minWidth: 100 }}>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '1.4rem', fontWeight: 700, color: C.navy1 }}>{counts.total}</div>
                    <div style={{ fontSize: '0.68rem', color: C.g500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Documentos</div>
                </div>
                {[['Informes', C.indigo], ['Oficios', C.teal], ['Of. Multiples', C.docAmber], ['Memorandums', C.slate]].map(([cat, color]) => (
                    <div key={cat} style={{ ...card, padding: '12px 18px', borderLeft: `4px solid ${color}`, minWidth: 90 }}>
                        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '1.4rem', fontWeight: 700, color }}>{counts[cat]}</div>
                        <div style={{ fontSize: '0.68rem', color: C.g500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{cat}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ ...inputS, minWidth: 150 }}>
                    <option value="todos">Todos los tipos</option>
                    <option value="Informes">Informes</option>
                    <option value="Oficios">Oficios</option>
                    <option value="Of. Multiples">Oficios Multiples</option>
                    <option value="Memorandums">Memorandums</option>
                </select>
                <select value={filterPersonal} onChange={e => setFilterPersonal(e.target.value)} style={{ ...inputS, minWidth: 160 }}>
                    <option value="todos">Todo el personal</option>
                    {personOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                <select value={filterSemana} onChange={e => setFilterSemana(e.target.value)} style={{ ...inputS, minWidth: 170 }}>
                    <option value="todas">Todas las semanas</option>
                    {weekOptions.map(w => <option key={w} value={w}>{fmtWeek(w)}</option>)}
                </select>
                <input
                    placeholder="Buscar por asunto, expediente, especialista..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ ...inputS, flex: 1, minWidth: 200 }}
                />
                <button
                    onClick={() => setSortByDate(s => !s)}
                    style={{ padding: '9px 14px', borderRadius: 6, border: `1px solid ${sortByDate ? C.navy4 : C.g200}`, background: sortByDate ? C.navy4 : C.white, color: sortByDate ? C.white : C.g600, cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                    {sortByDate ? 'Fecha (desc)' : 'Sin orden'}
                </button>
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: 40 }}>
                    <p style={{ color: C.g400, fontSize: '0.88rem', fontFamily: "'DM Sans'" }}>No se encontraron documentos con los filtros seleccionados.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="expedientes-grid">
                    <style>{`
                        @media (max-width: 1100px) { .expedientes-grid { grid-template-columns: repeat(2, 1fr) !important; } }
                        @media (max-width: 700px) { .expedientes-grid { grid-template-columns: 1fr !important; } }
                    `}</style>
                    {filtered.map((doc, i) => {
                        const borderColor = DOC_BORDER[doc.categoria] || C.g300;
                        const bgColor = DOC_BG[doc.categoria] || C.g50;
                        const tipoBadge = TIPO_BADGE[doc.tipo] || TIPO_BADGE['-'];
                        const personColor = PERSON_COLORS[doc.personId] || C.navy3;
                        const initials = (doc.shortName || '').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase();

                        return (
                            <div
                                key={`${doc.tipoDocumento}-${i}`}
                                onClick={() => setSelectedDoc(doc)}
                                style={{
                                    ...card,
                                    borderLeft: `5px solid ${borderColor}`,
                                    padding: '16px 18px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${borderColor}20`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {/* Top badges */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{
                                        fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                                        background: `${borderColor}15`, color: borderColor,
                                        fontFamily: "'JetBrains Mono'", letterSpacing: '0.04em', textTransform: 'uppercase',
                                    }}>
                                        {doc.categoria === 'Of. Multiples' ? 'OFICIO MULTIPLE' : doc.categoria === 'Informes' ? 'INFORME' : doc.categoria === 'Oficios' ? 'OFICIO' : 'MEMORANDUM'}
                                    </span>
                                    <span style={{
                                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                                        background: tipoBadge.bg, color: tipoBadge.color, border: `1px solid ${tipoBadge.border}`,
                                        fontFamily: "'JetBrains Mono'", letterSpacing: '0.04em',
                                    }}>
                                        {doc.tipo === '-' ? 'OFIC' : doc.tipo}
                                    </span>
                                </div>

                                {/* Document number */}
                                <div style={{
                                    fontSize: '0.76rem', fontWeight: 600, color: C.navy1,
                                    fontFamily: "'JetBrains Mono'", marginBottom: 6,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }} title={doc.tipoDocumento}>
                                    {doc.tipoDocumento}
                                </div>

                                {/* Asunto */}
                                <div style={{
                                    fontSize: '0.78rem', color: C.g600, fontFamily: "'DM Sans'",
                                    lineHeight: 1.5, marginBottom: 10,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                    {doc.asuntoRespuesta || doc.asuntoExpediente || 'Sin asunto'}
                                </div>

                                {/* Meta info */}
                                <div style={{ fontSize: '0.7rem', color: C.g500, fontFamily: "'DM Sans'", lineHeight: 1.8 }}>
                                    {doc.expediente && <div><span style={{ fontWeight: 600, color: C.g600 }}>Expediente:</span> {doc.expediente}</div>}
                                    {doc.remiteOficina && <div><span style={{ fontWeight: 600, color: C.g600 }}>Oficina:</span> {doc.remiteOficina}</div>}
                                    {doc.fechaDerivacion && <div><span style={{ fontWeight: 600, color: C.g600 }}>Fecha:</span> {formatDateDMY(doc.fechaDerivacion)}</div>}
                                </div>

                                {/* Specialist */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.g100}` }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 6,
                                        background: personColor, color: C.white,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.6rem', fontWeight: 700, fontFamily: "'JetBrains Mono'",
                                        flexShrink: 0,
                                    }}>
                                        {initials}
                                    </div>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: C.navy1, fontFamily: "'DM Sans'" }}>
                                        {doc.shortName}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selectedDoc && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
                    onClick={() => setSelectedDoc(null)}
                >
                    <div
                        style={{ ...card, padding: 0, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease', borderRadius: 12 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ background: DOC_BORDER[selectedDoc.categoria] || C.navy3, padding: '18px 24px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.2)', color: C.white, fontFamily: "'JetBrains Mono'" }}>
                                        {selectedDoc.categoria === 'Of. Multiples' ? 'OFICIO MULTIPLE' : selectedDoc.categoria === 'Informes' ? 'INFORME' : selectedDoc.categoria === 'Oficios' ? 'OFICIO' : 'MEMORANDUM'}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.15)', color: C.white, fontFamily: "'JetBrains Mono'" }}>
                                        {selectedDoc.tipo === '-' ? 'OFIC' : selectedDoc.tipo}
                                    </span>
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all' }}>{selectedDoc.tipoDocumento}</div>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1 }}>&times;</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px 24px' }}>
                            {/* Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                                {[
                                    ['Expediente', selectedDoc.expediente],
                                    ['Categoria', selectedDoc.categoria],
                                    ['Oficina Remitente', selectedDoc.remiteOficina],
                                    ['Destino', selectedDoc.destino],
                                    ['Fecha Ingreso', formatDateDMY(selectedDoc.fechaIngreso)],
                                    ['Fecha Derivacion', formatDateDMY(selectedDoc.fechaDerivacion)],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <div style={{ fontSize: 10, color: C.g500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'DM Sans'" }}>{label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy1, marginTop: 2, fontFamily: "'DM Sans'" }}>{val || '--'}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Asunto expediente */}
                            {selectedDoc.asuntoExpediente && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: C.g500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: "'DM Sans'" }}>Asunto del Expediente</div>
                                    <div style={{ fontSize: 13, color: C.g600, lineHeight: 1.6, padding: '10px 14px', background: C.g50, borderRadius: 6, border: `1px solid ${C.g100}`, fontFamily: "'DM Sans'" }}>{selectedDoc.asuntoExpediente}</div>
                                </div>
                            )}

                            {/* Asunto respuesta */}
                            {selectedDoc.asuntoRespuesta && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 10, color: C.g500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: "'DM Sans'" }}>Asunto de Respuesta</div>
                                    <div style={{ fontSize: 13, color: C.g600, lineHeight: 1.6, padding: '10px 14px', background: C.g50, borderRadius: 6, border: `1px solid ${C.g100}`, fontFamily: "'DM Sans'" }}>{selectedDoc.asuntoRespuesta}</div>
                                </div>
                            )}

                            {/* Specialist */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.g50, borderRadius: 8, border: `1px solid ${C.g100}`, marginBottom: 16 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 8,
                                    background: PERSON_COLORS[selectedDoc.personId] || C.navy3, color: C.white,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.72rem', fontWeight: 700, fontFamily: "'JetBrains Mono'",
                                }}>
                                    {(selectedDoc.shortName || '').split(' ').map(w => w[0] || '').slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy1, fontFamily: "'DM Sans'" }}>{selectedDoc.especialista}</div>
                                    <div style={{ fontSize: 11, color: C.g500, fontFamily: "'DM Sans'" }}>{selectedDoc.rol} {selectedDoc.tipo !== '-' ? `- ${selectedDoc.tipo}` : ''}</div>
                                </div>
                            </div>

                            {/* Week */}
                            {selectedDoc.semana && (
                                <div style={{ fontSize: 11, color: C.g400, fontFamily: "'DM Sans'", textAlign: 'center' }}>
                                    Cargado en: {fmtWeek(selectedDoc.semana)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
