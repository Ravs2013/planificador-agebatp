import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ESPECIALISTAS_MONITOREO, JEFATURA_AGEBATP, monthNames } from '../data/constants';
import { subscribeMonitoreoDocente } from '../firebase/db';
import { generarInforme } from '../api/monitoreoApi';
import { exportContainerToPDF } from '../utils/pdfGenerator';
import Icon from './Icon';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const C = {
  navy1: "#0C1929", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  gold1: "#A16207", gold2: "#CA8A04",
  g500: "#64748B", g400: "#94A3B8", g200: "#E2E8F0", g100: "#F1F5F9", g50: "#F8FAFC",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF",
  white: "#FFFFFF",
};

const LEVEL_COLORS = { 1: C.red, 2: C.amber, 3: C.blue, 4: C.green };

export default function InformeConsolidado({ onClose }) {
  const { user } = useAuth();
  const reportRef = useRef(null);

  const [programa, setPrograma] = useState('EBA');
  const [mesIdx, setMesIdx] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consolidado, setConsolidado] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [toast, setToast] = useState(null);
  const [informeNumero, setInformeNumero] = useState('');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const mesStr = useMemo(() => monthNames[mesIdx], [mesIdx]);
  const mesKey = useMemo(() => {
    const m = String(mesIdx + 1).padStart(2, '0');
    return `${anio}-${m}`;
  }, [mesIdx, anio]);

  // Subscribe to all fichas
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeMonitoreoDocente(programa, (list) => {
      setFichas(list || []);
      setLoading(false);
    });
    return () => unsub();
  }, [programa]);

  // Filter fichas by month/year
  const fichasDelMes = useMemo(() => {
    return fichas.filter(f => {
      const iso = f.fechaEjecucionISO || '';
      return iso.startsWith(mesKey);
    });
  }, [fichas, mesKey]);

  // KPIs for the month
  const kpis = useMemo(() => {
    const total = fichasDelMes.length;
    const docentesUnicos = new Set(fichasDelMes.map(f => f.docenteNombre)).size;
    const ieUnicas = new Set(fichasDelMes.map(f => f.institucionCodigo)).size;
    const sumG = fichasDelMes.reduce((s, f) => s + (f.promedioGeneral || 0), 0);
    const promG = total > 0 ? parseFloat((sumG / total).toFixed(2)) : 0;

    const getAvg = (key) => {
      const valid = fichasDelMes.filter(f => typeof f.desempeno?.[key]?.nivel === 'number');
      return valid.length > 0 ? parseFloat((valid.reduce((s, f) => s + f.desempeno[key].nivel, 0) / valid.length).toFixed(2)) : 0;
    };

    return {
      total, docentesUnicos, ieUnicas, promG,
      promInvolucra: getAvg('involucraEstudiantes'),
      promRazonamiento: getAvg('promueveRazonamiento'),
      promEvalua: getAvg('evaluaProgreso'),
      promRespeto: getAvg('ambienteRespeto'),
      promRegula: getAvg('regulaComportamiento'),
    };
  }, [fichasDelMes]);

  const chartIndicatorData = useMemo(() => {
    const indicators = [
      { key: 'involucraEstudiantes', label: 'Involucra' },
      { key: 'promueveRazonamiento', label: 'Razonamiento' },
      { key: 'evaluaProgreso', label: 'Evalúa' },
      { key: 'ambienteRespeto', label: 'Respeto' },
      { key: 'regulaComportamiento', label: 'Regula' }
    ];
    return indicators.map(ind => {
      const counts = { I: 0, II: 0, III: 0, IV: 0 };
      fichasDelMes.forEach(f => {
        const lvl = f.desempeno?.[ind.key]?.nivel;
        if (lvl === 1) counts.I++; else if (lvl === 2) counts.II++; else if (lvl === 3) counts.III++; else if (lvl === 4) counts.IV++;
      });
      return { name: ind.label, "Nivel I": counts.I, "Nivel II": counts.II, "Nivel III": counts.III, "Nivel IV": counts.IV };
    });
  }, [fichasDelMes]);

  const chartPieData = useMemo(() => {
    const counts = { "Nivel I": 0, "Nivel II": 0, "Nivel III": 0, "Nivel IV": 0 };
    fichasDelMes.forEach(f => { if (counts[f.nivelGeneralLabel] !== undefined) counts[f.nivelGeneralLabel]++; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [fichasDelMes]);

  // Generate consolidated report via AI
  const handleGenerar = async () => {
    if (fichasDelMes.length === 0) { showToast('No hay fichas para este mes.', 'error'); return; }
    setGenerando(true);
    try {
      const esp = programa === 'EBA'
        ? ESPECIALISTAS_MONITOREO.find(e => e.programa === 'EBA')
        : ESPECIALISTAS_MONITOREO.find(e => e.programa === 'ETP');

      const payload = {
        tipo: 'consolidado',
        tipoMonitoreo: 'docente',
        programa,
        especialista: { nombre: esp?.nombre || 'Especialista', cargo: esp?.cargo || 'Especialista' },
        jefatura: JEFATURA_AGEBATP,
        periodo: { mes: mesStr.toLowerCase(), anio },
        fichas: fichasDelMes.map(f => ({
          docenteNombre: f.docenteNombre,
          institucionNombre: f.institucionNombre,
          institucionCodigo: f.institucionCodigo,
          desempeno: f.desempeno,
          promedioGeneral: f.promedioGeneral,
          nivelGeneralLabel: f.nivelGeneralLabel,
          fechaEjecucion: f.fechaEjecucion,
        })),
        kpis,
      };

      const result = await generarInforme(payload);
      if (result.ok) {
        setConsolidado(result.informe);
        showToast('Informe consolidado generado exitosamente.');
      } else {
        showToast(`Error: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setGenerando(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      await exportContainerToPDF(reportRef.current, `Informe_Consolidado_${programa}_${mesStr}_${anio}.pdf`);
      showToast('PDF descargado correctamente.');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
    btn: (bg, color, border) => ({ padding: "10px 20px", borderRadius: 8, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.15s" }),
    textarea: { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.g50, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 12.5, minHeight: 120, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 },
    statCard: (border) => ({ background: C.white, borderRadius: 10, padding: "14px 16px", borderLeft: `4px solid ${border}`, boxShadow: "0 1px 3px rgba(15,23,42,0.06)", border: `1px solid ${C.g100}` })
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", overflow: "auto" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 950, maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "'DM Serif Display',serif", color: C.navy1 }}>
            Informe Consolidado Mensual — {programa}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g500 }}>✕</button>
        </div>

        {toast && (
          <div style={{ margin: "12px 28px 0", padding: "10px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? C.greenBg : C.redBg, border: `1px solid ${toast.type === "success" ? C.greenBorder : C.redBorder}` }}>
            {toast.msg}
          </div>
        )}

        <div style={{ padding: "20px 28px" }}>
          {/* Selectors */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={S.label}>Programa</label>
              <div style={{ display: "flex", background: C.g100, padding: 3, borderRadius: 6 }}>
                {['EBA', 'ETP'].map(p => (
                  <button key={p} onClick={() => setPrograma(p)} style={{ padding: "5px 14px", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 12, background: programa === p ? C.white : "transparent", color: programa === p ? C.navy3 : C.g500, cursor: "pointer" }}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Mes</label>
              <select value={mesIdx} onChange={e => setMesIdx(parseInt(e.target.value))} style={{ ...S.input, width: 150 }}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Año</label>
              <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} style={{ ...S.input, width: 100 }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={handleGenerar} disabled={generando || fichasDelMes.length === 0} style={{ ...S.btn(C.navy4, C.white, C.navy5), opacity: generando || fichasDelMes.length === 0 ? 0.5 : 1 }}>
              {generando ? 'Generando...' : '🤖 Generar Consolidado con IA'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: C.g500 }}>Cargando fichas...</div>
          ) : fichasDelMes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.g500 }}>
              <Icon name="folder" size={48} color={C.g200} />
              <p style={{ marginTop: 12, fontSize: "0.85rem" }}>No hay fichas de monitoreo docente ({programa}) para {mesStr} {anio}.</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                <div style={S.statCard(C.navy4)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: C.navy4 }}>{kpis.total}</div>
                  <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>Fichas</div>
                </div>
                <div style={S.statCard(C.blue)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: C.blue }}>{kpis.docentesUnicos}</div>
                  <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>Docentes</div>
                </div>
                <div style={S.statCard(C.gold2)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: C.gold1 }}>{kpis.ieUnicas}</div>
                  <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>IE</div>
                </div>
                <div style={S.statCard(C.green)}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: C.green }}>{kpis.promG} / 4</div>
                  <div style={{ fontSize: 10, color: C.g500, fontWeight: 700, textTransform: "uppercase" }}>Prom. Gral</div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={S.card}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 8 }}>Distribución por Criterio</h4>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartIndicatorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Bar dataKey="Nivel I" stackId="a" fill={C.red} />
                        <Bar dataKey="Nivel II" stackId="a" fill={C.amber} />
                        <Bar dataKey="Nivel III" stackId="a" fill={C.blue} />
                        <Bar dataKey="Nivel IV" stackId="a" fill={C.green} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={S.card}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 8 }}>Distribución General</h4>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartPieData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                          <Cell fill={C.red} /><Cell fill={C.amber} /><Cell fill={C.blue} /><Cell fill={C.green} />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Consolidated Report Content */}
              {consolidado && (
                <div ref={reportRef} style={{ ...S.card, marginBottom: 20 }}>
                  <div style={{ textAlign: "center", marginBottom: 16, fontSize: 9, color: C.g500, fontStyle: "italic", lineHeight: 1.5 }}>
                    Documento electrónico firmado digitalmente en el marco de la Ley N° 27269...<br/>
                    Decenio de la Igualdad de oportunidades para mujeres y hombres<br/>
                    Año de la Esperanza y el Fortalecimiento de la Democracia
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Número de Informe</label>
                    <input value={informeNumero} onChange={e => setInformeNumero(e.target.value)} placeholder="Ej: 001" style={{ ...S.input, maxWidth: 200 }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.navy1, marginTop: 4 }}>
                      INFORME CONSOLIDADO N.° {informeNumero || '____'}-{anio}-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "4px 12px", marginBottom: 16, fontSize: 12 }}>
                    <strong>A:</strong><span>{JEFATURA_AGEBATP.nombre}, {JEFATURA_AGEBATP.cargo}</span>
                    <strong>Asunto:</strong>
                    <input value={consolidado.asunto || `Informe Consolidado de Monitoreo ${programa} — ${mesStr} ${anio}`} onChange={e => setConsolidado(prev => ({ ...prev, asunto: e.target.value }))} style={{ ...S.input, fontSize: 12 }} />
                    <strong>Fecha:</strong><span>Lima, {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>I. ANTECEDENTES</h4>
                    <textarea value={(consolidado.antecedentes || []).join('\n')} onChange={e => setConsolidado(prev => ({ ...prev, antecedentes: e.target.value.split('\n') }))} style={S.textarea} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>II. ANÁLISIS DE RESULTADOS</h4>
                    <textarea value={(consolidado.analisis || []).join('\n')} onChange={e => setConsolidado(prev => ({ ...prev, analisis: e.target.value.split('\n') }))} style={S.textarea} />
                  </div>

                  {/* Data summary table */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>Resumen por Criterio de Desempeño</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Criterio</th>
                          <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: '2.1 Involucra Estudiantes', val: kpis.promInvolucra },
                          { label: '2.2 Promueve Razonamiento', val: kpis.promRazonamiento },
                          { label: '2.3 Evalúa Progreso', val: kpis.promEvalua },
                          { label: '2.4 Ambiente de Respeto', val: kpis.promRespeto },
                          { label: '2.5 Regula Comportamiento', val: kpis.promRegula },
                        ].map(({ label, val }) => (
                          <tr key={label}>
                            <td style={{ border: `1px solid ${C.g200}`, padding: 8 }}>{label}</td>
                            <td style={{ border: `1px solid ${C.g200}`, padding: 8, fontWeight: 700, color: LEVEL_COLORS[Math.round(val)] || C.navy1, fontFamily: "'JetBrains Mono'" }}>{val.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td style={{ border: `1px solid ${C.g200}`, padding: 8, fontWeight: 700 }}>PROMEDIO GENERAL</td>
                          <td style={{ border: `1px solid ${C.g200}`, padding: 8, fontWeight: 700, color: C.navy4, fontFamily: "'JetBrains Mono'" }}>{kpis.promG.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>III. CONCLUSIONES</h4>
                    <textarea value={(consolidado.conclusiones || []).join('\n')} onChange={e => setConsolidado(prev => ({ ...prev, conclusiones: e.target.value.split('\n') }))} style={S.textarea} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>IV. RECOMENDACIONES</h4>
                    <textarea value={(consolidado.recomendaciones || []).join('\n')} onChange={e => setConsolidado(prev => ({ ...prev, recomendaciones: e.target.value.split('\n') }))} style={S.textarea} />
                  </div>
                </div>
              )}

              {consolidado && (
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleExportPDF} style={S.btn(C.navy4, C.white, C.navy5)}>📥 Descargar PDF</button>
                  <button onClick={handleGenerar} disabled={generando} style={S.btn(C.g50, C.navy3, C.g200)}>↻ Regenerar</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
