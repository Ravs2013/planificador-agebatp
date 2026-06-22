import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ESPECIALISTAS_MONITOREO, JEFATURA_AGEBATP, monthNames } from '../data/constants';
import { ocrFicha, generarInforme, generarOficio, subirDocumento, fileToBase64 } from '../api/monitoreoApi';
import { addInformeMonitoreo, updateInformeMonitoreo } from '../firebase/db';
import { recalcularPromedios, exportContainerToPDF } from '../utils/pdfGenerator';
import Icon from './Icon';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const C = {
  navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
  g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
  g100: "#F1F5F9", g50: "#F8FAFC",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF",
  white: "#FFFFFF",
};

const LEVEL_COLORS = { 1: C.red, 2: C.amber, 3: C.blue, 4: C.green };

const ACTA_DOCENTE_TEMPLATE = (data) => `ACTA DE INICIO DE MONITOREO Y ACOMPAÑAMIENTO PEDAGÓGICO

En el ${data.institucionTipo} "${data.institucionNombre}", siendo las ${data.horaInicio} horas del ${data.fecha}, el(la) especialista ${data.especialistaNombre}, ${data.especialistaCargo} del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP) de la UGEL 03, da inicio a la aplicación del instrumento de recojo de información (ficha de monitoreo y acompañamiento pedagógico), con una duración prevista desde las ${data.horaInicio} hasta las ${data.horaFin} horas.

La selección del aula/taller a ser acompañado(a) se realiza de manera ALEATORIA (por sorteo), en presencia y con la conformidad del(de la) ${data.cargoDirector || 'Director(a)'} ${data.directorNombre}, quien da fe del presente acto.

Al concluir la intervención, el(la) especialista elaborará un informe cuyas conclusiones y recomendaciones —o felicitaciones, de ser el caso— serán remitidas mediante oficio a la dirección de la institución educativa.

OBSERVACIONES: ${data.observaciones || '(Sin observaciones)'}`;

const ACTA_DIRECTOR_TEMPLATE = (data) => `ACTA DE INICIO DE MONITOREO DE LA GESTIÓN Y ACOMPAÑAMIENTO AL DIRECTIVO

En el ${data.institucionTipo} "${data.institucionNombre}", siendo las ${data.horaInicio} horas del ${data.fecha}, el(la) especialista ${data.especialistaNombre}, ${data.especialistaCargo} del AGEBATP de la UGEL 03, da inicio al monitoreo de la gestión mediante la aplicación de la ficha correspondiente, seguido de una hora de reflexión crítica y reflexiva como parte del acompañamiento al(a la) directivo(a) ${data.directorNombre}.

Al concluir, se elaborará un informe cuyas recomendaciones —de ser el caso— serán remitidas mediante oficio a la instancia correspondiente.

OBSERVACIONES: ${data.observaciones || '(Sin observaciones)'}`;

function calcDuracion(hi, hf) {
  if (!hi || !hf) return '';
  const [h1, m1] = hi.split(':').map(Number);
  const [h2, m2] = hf.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function WizardInformeIndividual({ tipoMonitoreo = 'docente', onClose, onSaved }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [informeId, setInformeId] = useState(null);
  const [toast, setToast] = useState(null);
  const informeRef = useRef(null);
  const oficioRef = useRef(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // ── Paso 1: Acta ──
  const [especialistaId, setEspecialistaId] = useState('');
  const [programaSeleccionado, setProgramaSeleccionado] = useState('');
  const [institucionNombre, setInstitucionNombre] = useState('');
  const [directorNombre, setDirectorNombre] = useState('');
  const [cargoDirector, setCargoDirector] = useState('Director(a)');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [observaciones, setObservaciones] = useState('');
  const [actaTexto, setActaTexto] = useState('');

  const especialistaSeleccionado = ESPECIALISTAS_MONITOREO.find(e => e.id === especialistaId);
  const institucionTipo = useMemo(() => {
    if (!especialistaSeleccionado) return '';
    if (especialistaSeleccionado.puedeElegirPrograma) return programaSeleccionado === 'EBA' ? 'CEBA' : 'CETPRO';
    return especialistaSeleccionado.institucionTipo;
  }, [especialistaSeleccionado, programaSeleccionado]);

  const programaFinal = useMemo(() => {
    if (!especialistaSeleccionado) return '';
    if (especialistaSeleccionado.puedeElegirPrograma) return programaSeleccionado;
    return especialistaSeleccionado.programa;
  }, [especialistaSeleccionado, programaSeleccionado]);

  // Auto-generate acta text when fields change
  useEffect(() => {
    if (!especialistaSeleccionado || !institucionNombre) return;
    const templateFn = tipoMonitoreo === 'director' ? ACTA_DIRECTOR_TEMPLATE : ACTA_DOCENTE_TEMPLATE;
    setActaTexto(templateFn({
      institucionTipo: institucionTipo || 'CEBA',
      institucionNombre: institucionNombre || '[NOMBRE_INSTITUCIÓN]',
      horaInicio: horaInicio || '[HORA_INICIO]',
      horaFin: horaFin || '[HORA_FIN]',
      fecha: fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '[FECHA]',
      especialistaNombre: especialistaSeleccionado.nombre,
      especialistaCargo: especialistaSeleccionado.cargo,
      directorNombre: directorNombre || '[NOMBRE_DIRECTOR]',
      cargoDirector: cargoDirector,
      observaciones
    }));
  }, [especialistaSeleccionado, institucionNombre, directorNombre, cargoDirector, fecha, horaInicio, horaFin, observaciones, tipoMonitoreo, institucionTipo]);

  // ── Paso 2: Sección de clase ──
  const [seccionPresente, setSeccionPresente] = useState(true);
  const [seccionNoDisponible, setSeccionNoDisponible] = useState(false);
  const [seccionFile, setSeccionFile] = useState(null);

  // ── Paso 3: Ficha OCR ──
  const [fichaFile, setFichaFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [fichaConfirmada, setFichaConfirmada] = useState(false);

  // ── Paso 4: Informe + Oficio ──
  const [informeData, setInformeData] = useState(null);
  const [oficioData, setOficioData] = useState(null);
  const [informeLoading, setInformeLoading] = useState(false);
  const [oficioLoading, setOficioLoading] = useState(false);
  const [linkEvidencias, setLinkEvidencias] = useState('');
  const [uploading, setUploading] = useState(false);
  const [informeNumero, setInformeNumero] = useState('');

  // Handle OCR upload
  const handleFichaUpload = async (file) => {
    setFichaFile(file);
    setOcrLoading(true);
    setOcrResult(null);
    setFichaConfirmada(false);
    try {
      const archivo = await fileToBase64(file);
      const result = await ocrFicha({
        tipoFicha: tipoMonitoreo,
        programa: programaFinal,
        archivo
      });
      if (result.ok) {
        setOcrResult(result.data);
        showToast('Ficha extraída por IA exitosamente. Revise y corrija los datos.');
      } else {
        showToast(`Error en OCR: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setOcrLoading(false);
  };

  const handleConfirmarFicha = () => {
    if (ocrResult) {
      const promedios = recalcularPromedios(ocrResult);
      setOcrResult(prev => ({ ...prev, ...promedios }));
      setFichaConfirmada(true);
      showToast('Ficha confirmada. Puede continuar al siguiente paso.');
    }
  };

  // Generate Informe
  const handleGenerarInforme = async () => {
    setInformeLoading(true);
    try {
      const now = new Date();
      const payload = {
        tipo: 'individual',
        tipoMonitoreo,
        programa: programaFinal,
        especialista: {
          nombre: especialistaSeleccionado.nombre,
          cargo: especialistaSeleccionado.cargo
        },
        jefatura: JEFATURA_AGEBATP,
        periodo: {
          mes: monthNames[now.getMonth()].toLowerCase(),
          anio: now.getFullYear()
        },
        acta: {
          especialista: especialistaSeleccionado.nombre,
          institucion: institucionNombre,
          director: directorNombre,
          fecha,
          horaInicio,
          horaFin,
          duracion: calcDuracion(horaInicio, horaFin),
          observaciones,
          texto: actaTexto
        },
        seccionClase: {
          presente: seccionPresente && !seccionNoDisponible,
          detalle: seccionNoDisponible ? 'El docente no cuenta con sección de clase' : null
        },
        fichas: [ocrResult],
        linkEvidenciasOnedrive: linkEvidencias || ''
      };

      const result = await generarInforme(payload);
      if (result.ok) {
        setInformeData(result.informe);
        showToast('Informe generado exitosamente. Edite y ajuste antes de exportar.');
      } else {
        showToast(`Error al generar informe: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setInformeLoading(false);
  };

  // Generate Oficio
  const handleGenerarOficio = async () => {
    setOficioLoading(true);
    try {
      const tono = (ocrResult?.promedioGeneral >= 3.5) ? 'felicitacion' : 'recomendacion';
      const payload = {
        programa: programaFinal,
        destinatario: { nombre: directorNombre, cargo: cargoDirector, institucion: `${institucionTipo} ${institucionNombre}` },
        remitente: { nombre: especialistaSeleccionado.nombre, cargo: especialistaSeleccionado.cargo },
        tono,
        conclusiones: informeData?.conclusionesTabla || [],
        recomendaciones: informeData?.recomendaciones || [],
        linkEvidenciasOnedrive: linkEvidencias || ''
      };
      const result = await generarOficio(payload);
      if (result.ok) {
        setOficioData(result.oficio);
        showToast(`Oficio de ${tono} generado exitosamente.`);
      } else {
        showToast(`Error al generar oficio: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
    setOficioLoading(false);
  };

  // Save draft to Firestore
  const saveDraft = async () => {
    setSaving(true);
    try {
      const data = {
        tipoMonitoreo,
        programa: programaFinal,
        tipo: 'individual',
        especialistaId: especialistaSeleccionado?.id,
        especialistaNombre: especialistaSeleccionado?.nombre,
        especialistaCargo: especialistaSeleccionado?.cargo,
        jefaturaNombre: JEFATURA_AGEBATP.nombre,
        jefaturaCargo: JEFATURA_AGEBATP.cargo,
        institucionTipo,
        institucionNombre,
        directorNombre,
        periodo: { mes: monthNames[new Date().getMonth()].toLowerCase(), anio: new Date().getFullYear() },
        acta: { especialista: especialistaSeleccionado?.nombre, institucion: institucionNombre, director: directorNombre, fecha, horaInicio, horaFin, duracion: calcDuracion(horaInicio, horaFin), observaciones, texto: actaTexto },
        seccionClase: { presente: seccionPresente && !seccionNoDisponible, detalle: seccionNoDisponible ? 'No cuenta con sección' : null },
        ficha: ocrResult || null,
        informe: informeData || null,
        oficio: oficioData || null,
        links: { evidenciasOnedrive: linkEvidencias || '' },
        estado: informeData ? (oficioData ? 'generado' : 'generado') : 'borrador',
        creadoPor: user?.uid || '',
        paso: step,
      };

      if (informeId) {
        await updateInformeMonitoreo(informeId, data);
      } else {
        const newId = await addInformeMonitoreo(data);
        setInformeId(newId);
      }
    } catch (err) {
      console.error('Error al guardar borrador:', err);
    }
    setSaving(false);
  };

  // Auto-save on step change
  useEffect(() => {
    if (step > 1 && especialistaSeleccionado) {
      saveDraft();
    }
  }, [step]);

  // Export PDF
  const handleExportInformePDF = async () => {
    if (!informeRef.current) return;
    try {
      const result = await exportContainerToPDF(informeRef.current, `Informe_Monitoreo_${tipoMonitoreo}_${fecha}.pdf`);
      showToast('Informe PDF descargado correctamente.');
      
      // Try uploading to OneDrive
      try {
        setUploading(true);
        const uploadResult = await subirDocumento({
          categoria: 'informe',
          tipoMonitoreo,
          programa: programaFinal,
          institucionNombre,
          fecha,
          archivo: { name: `Informe_${tipoMonitoreo}_${fecha}.pdf`, mimeType: 'application/pdf', base64: result.base64 }
        });
        if (uploadResult.ok && uploadResult.linkOnedrive) {
          setLinkEvidencias(uploadResult.linkOnedrive);
          showToast('Informe subido a OneDrive correctamente.');
        } else if (uploadResult.ok && !uploadResult.linkOnedrive) {
          showToast('Subido exitosamente pero sin link OneDrive. Configurar STORAGE_PROVIDERS.', 'error');
        }
      } catch (e) {
        console.warn('Upload failed (backend may not be configured):', e);
      }
      setUploading(false);
    } catch (err) {
      showToast(`Error al exportar PDF: ${err.message}`, 'error');
    }
  };

  const handleExportOficioPDF = async () => {
    if (!oficioRef.current) return;
    try {
      await exportContainerToPDF(oficioRef.current, `Oficio_Monitoreo_${tipoMonitoreo}_${fecha}.pdf`);
      showToast('Oficio PDF descargado correctamente.');
    } catch (err) {
      showToast(`Error al exportar PDF: ${err.message}`, 'error');
    }
  };

  // Inline styles
  const S = {
    card: { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
    btn: (bg, color, border) => ({ padding: "10px 20px", borderRadius: 8, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.15s" }),
    textarea: { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.g50, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 12.5, minHeight: 180, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 },
    stepIndicator: (active, completed) => ({
      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: completed ? C.green : active ? C.navy4 : C.g200,
      color: completed || active ? C.white : C.g500,
      fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", transition: 'all 0.2s'
    }),
  };

  const STEPS = [
    { n: 1, label: 'Acta de Inicio' },
    { n: 2, label: 'Sección de Clase' },
    { n: 3, label: 'Ficha de Monitoreo (OCR IA)' },
    { n: 4, label: 'Informe + Oficio' },
  ];

  const canGoNext = () => {
    if (step === 1) return especialistaSeleccionado && (programaFinal) && institucionNombre && directorNombre && fecha;
    if (step === 2) return true;
    if (step === 3) return fichaConfirmada;
    return false;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", overflow: "auto" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "'DM Serif Display',serif", color: C.navy1 }}>
              Nuevo Informe — Monitoreo {tipoMonitoreo === 'director' ? 'Director' : 'Docente'}
            </h2>
            {saving && <span style={{ fontSize: 11, color: C.g400 }}>Guardando borrador...</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g500, padding: 4 }}>✕</button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ margin: "12px 28px 0", padding: "10px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? C.greenBg : C.redBg, border: `1px solid ${toast.type === "success" ? C.greenBorder : C.redBorder}` }}>
            {toast.msg}
          </div>
        )}

        {/* Stepper */}
        <div style={{ padding: "20px 28px", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={S.stepIndicator(step === s.n, step > s.n)}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? C.navy1 : C.g500, fontFamily: "'DM Sans'", display: i < STEPS.length - 1 ? 'block' : 'block' }}>{s.label}</span>
              {i < STEPS.length - 1 && <div style={{ width: 30, height: 2, background: step > s.n ? C.green : C.g200, borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "0 28px 28px" }}>
          {/* ══ PASO 1: ACTA ══ */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>Paso 1 — Acta de Inicio</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={S.label}>Especialista *</label>
                  <select value={especialistaId} onChange={e => { setEspecialistaId(e.target.value); setProgramaSeleccionado(''); }} style={S.input}>
                    <option value="">Seleccione especialista...</option>
                    {ESPECIALISTAS_MONITOREO.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre} — {esp.cargoCorto}</option>
                    ))}
                  </select>
                </div>

                {especialistaSeleccionado?.puedeElegirPrograma && (
                  <div>
                    <label style={S.label}>Programa *</label>
                    <select value={programaSeleccionado} onChange={e => setProgramaSeleccionado(e.target.value)} style={S.input}>
                      <option value="">Seleccione...</option>
                      <option value="EBA">EBA (CEBA)</option>
                      <option value="ETP">ETP (CETPRO)</option>
                    </select>
                  </div>
                )}

                {programaFinal && (
                  <div>
                    <label style={S.label}>Tipo Institución</label>
                    <input value={institucionTipo} disabled style={{ ...S.input, background: C.g100, color: C.g500 }} />
                  </div>
                )}

                <div style={{ gridColumn: "span 2" }}>
                  <label style={S.label}>Nombre de la Institución ({institucionTipo || 'CEBA/CETPRO'}) *</label>
                  <input value={institucionNombre} onChange={e => setInstitucionNombre(e.target.value)} placeholder={`Ej: ${institucionTipo || 'CEBA'} "República de Panamá"`} style={S.input} />
                </div>

                <div>
                  <label style={S.label}>Nombre del Director/Coordinador *</label>
                  <input value={directorNombre} onChange={e => setDirectorNombre(e.target.value)} placeholder="Nombre completo del director(a)" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Cargo del Director</label>
                  <select value={cargoDirector} onChange={e => setCargoDirector(e.target.value)} style={S.input}>
                    <option value="Director(a)">Director(a)</option>
                    <option value="Coordinador(a)">Coordinador(a)</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Fecha *</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={S.input} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={S.label}>Hora Inicio</label>
                    <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Hora Fin</label>
                    <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Duración</label>
                    <input value={calcDuracion(horaInicio, horaFin)} disabled style={{ ...S.input, background: C.g100 }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Observaciones</label>
                <input value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Ej: No se pudo dar inicio al monitoreo por..." style={S.input} />
              </div>

              <div>
                <label style={S.label}>Texto del Acta (Editable)</label>
                <textarea value={actaTexto} onChange={e => setActaTexto(e.target.value)} style={S.textarea} />
              </div>
            </div>
          )}

          {/* ══ PASO 2: SECCIÓN DE CLASE ══ */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>
                Paso 2 — Sección de Clase del {tipoMonitoreo === 'director' ? 'Director' : 'Docente'}
              </h3>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 16px", borderRadius: 8, background: seccionNoDisponible ? C.amberBg : C.g50, border: `1px solid ${seccionNoDisponible ? C.amberBorder : C.g200}`, transition: "all 0.15s" }}>
                  <input type="checkbox" checked={seccionNoDisponible} onChange={e => { setSeccionNoDisponible(e.target.checked); if (e.target.checked) setSeccionFile(null); }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: seccionNoDisponible ? C.amber : C.navy1 }}>
                    El {tipoMonitoreo === 'director' ? 'director' : 'docente'} no cuenta con sección de clase
                  </span>
                </label>
              </div>

              {!seccionNoDisponible && (
                <div style={{ border: `2px dashed ${C.g300}`, borderRadius: 10, padding: "40px 20px", textAlign: "center", background: C.g50, cursor: "pointer" }}
                  onClick={() => document.getElementById('seccion-file-input')?.click()}>
                  <Icon name="upload" size={32} color={C.g400} />
                  <p style={{ color: C.g500, fontSize: "0.85rem", margin: "12px 0 4px" }}>
                    {seccionFile ? `✓ ${seccionFile.name}` : "Subir archivo de sección de clase (PDF/imagen)"}
                  </p>
                  <input id="seccion-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                    onChange={e => { if (e.target.files[0]) setSeccionFile(e.target.files[0]); }} />
                </div>
              )}
            </div>
          )}

          {/* ══ PASO 3: FICHA OCR ══ */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
                Paso 3 — Ficha de Monitoreo (Extracción por IA)
              </h3>
              <p style={{ color: C.g500, fontSize: "0.82rem", marginBottom: 20 }}>Suba la ficha escaneada (PDF/imagen). La IA extraerá los datos automáticamente. Revise y corrija antes de confirmar.</p>

              <div style={{ border: `2px dashed ${ocrLoading ? C.navy5 : C.g300}`, borderRadius: 10, padding: "30px 20px", textAlign: "center", background: ocrLoading ? `${C.navy5}08` : C.g50, cursor: ocrLoading ? "wait" : "pointer", marginBottom: 20 }}
                onClick={() => !ocrLoading && document.getElementById('ficha-file-input')?.click()}>
                <Icon name="upload" size={28} color={ocrLoading ? C.navy5 : C.g400} />
                <p style={{ color: C.g500, fontSize: "0.85rem", margin: "10px 0 0" }}>
                  {ocrLoading ? "Procesando OCR por IA... Esto puede tardar unos segundos" : fichaFile ? `✓ ${fichaFile.name} — Clic para reemplazar` : "Subir ficha escaneada (PDF/imagen)"}
                </p>
                <input id="ficha-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) handleFichaUpload(e.target.files[0]); }} />
              </div>

              {/* OCR Result Preview - Editable */}
              {ocrResult && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: C.navy3, marginBottom: 16 }}>Datos Extraídos — Revise y Corrija</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={S.label}>Docente/Director</label>
                      <input value={ocrResult.docenteNombre || ''} onChange={e => setOcrResult(prev => ({ ...prev, docenteNombre: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>DNI</label>
                      <input value={ocrResult.docenteDni || ''} onChange={e => setOcrResult(prev => ({ ...prev, docenteDni: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Institución</label>
                      <input value={ocrResult.institucionNombre || ''} onChange={e => setOcrResult(prev => ({ ...prev, institucionNombre: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Código Modular</label>
                      <input value={ocrResult.institucionCodigo || ''} onChange={e => setOcrResult(prev => ({ ...prev, institucionCodigo: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Monitor</label>
                      <input value={ocrResult.monitorNombre || ''} onChange={e => setOcrResult(prev => ({ ...prev, monitorNombre: e.target.value }))} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Fecha Ejecución</label>
                      <input value={ocrResult.fechaEjecucionISO || ocrResult.fechaEjecucion || ''} onChange={e => setOcrResult(prev => ({ ...prev, fechaEjecucionISO: e.target.value, fechaEjecucion: e.target.value }))} style={S.input} />
                    </div>
                  </div>

                  {/* Desempeño Rúbricas */}
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 8 }}>Criterios de Desempeño (Nivel 1-4)</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { key: 'involucraEstudiantes', label: '2.1 Involucra Estudiantes' },
                      { key: 'promueveRazonamiento', label: '2.2 Promueve Razonamiento' },
                      { key: 'evaluaProgreso', label: '2.3 Evalúa Progreso' },
                      { key: 'ambienteRespeto', label: '2.4 Ambiente de Respeto' },
                      { key: 'regulaComportamiento', label: '2.5 Regula Comportamiento' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: C.g600, flex: 1 }}>{label}</span>
                        <select
                          value={ocrResult.desempeno?.[key]?.nivel || ''}
                          onChange={e => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            setOcrResult(prev => ({
                              ...prev,
                              desempeno: { ...prev.desempeno, [key]: { ...prev.desempeno?.[key], nivel: val, raw: val ? `Nivel ${val}` : '' } }
                            }));
                          }}
                          style={{ ...S.input, width: 80, textAlign: "center" }}
                        >
                          <option value="">—</option>
                          <option value="1">I</option>
                          <option value="2">II</option>
                          <option value="3">III</option>
                          <option value="4">IV</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={S.label}>Compromisos</label>
                      <input value={ocrResult.compromisos || ''} onChange={e => setOcrResult(prev => ({ ...prev, compromisos: e.target.value }))} style={{ ...S.input, width: 400 }} />
                    </div>
                  </div>

                  {ocrResult.advertencias?.length > 0 && (
                    <div style={{ padding: "8px 12px", borderRadius: 6, background: C.amberBg, border: `1px solid ${C.amberBorder}`, marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.amber, fontWeight: 600 }}>Advertencias de la IA:</p>
                      {ocrResult.advertencias.map((w, i) => <p key={i} style={{ margin: "2px 0 0", fontSize: 11, color: C.amber }}>{w}</p>)}
                    </div>
                  )}

                  <button onClick={handleConfirmarFicha} disabled={fichaConfirmada} style={{ ...S.btn(fichaConfirmada ? C.green : C.navy4, C.white, fichaConfirmada ? C.green : C.navy5), opacity: fichaConfirmada ? 0.8 : 1 }}>
                    {fichaConfirmada ? '✓ Ficha Confirmada' : 'Confirmar Datos de la Ficha'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ PASO 4: INFORME + OFICIO ══ */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>
                Paso 4 — Generar Informe y Oficio
              </h3>

              {/* Generate buttons */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <button onClick={handleGenerarInforme} disabled={informeLoading} style={{ ...S.btn(C.navy4, C.white, C.navy5), opacity: informeLoading ? 0.6 : 1 }}>
                  {informeLoading ? 'Generando...' : informeData ? '↻ Regenerar Informe' : '🤖 Generar Informe con IA'}
                </button>
                {informeData && (
                  <button onClick={handleGenerarOficio} disabled={oficioLoading} style={{ ...S.btn(C.gold2, C.white, C.gold1), opacity: oficioLoading ? 0.6 : 1 }}>
                    {oficioLoading ? 'Generando...' : oficioData ? '↻ Regenerar Oficio' : '📄 Generar Oficio'}
                  </button>
                )}
              </div>

              {/* Charts from ficha */}
              {ocrResult && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Gráficos del Monitoreo</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(ocrResult.desempeno || {}).map(([k, v]) => ({
                          name: k.replace(/([A-Z])/g, ' $1').substring(0, 12),
                          nivel: v?.nivel || 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                          <YAxis domain={[0, 4]} />
                          <Tooltip />
                          <Bar dataKey="nivel" fill={C.navy4} radius={[4, 4, 0, 0]}>
                            {Object.values(ocrResult.desempeno || {}).map((v, i) => (
                              <Cell key={i} fill={LEVEL_COLORS[v?.nivel] || C.g300} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      <div style={{ fontSize: 36, fontWeight: 700, color: LEVEL_COLORS[Math.round(ocrResult.promedioGeneral)] || C.navy1, fontFamily: "'JetBrains Mono'" }}>
                        {ocrResult.promedioGeneral?.toFixed(2) || '0.00'}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy3 }}>{ocrResult.nivelGeneralLabel || 'Nivel I'}</div>
                      <div style={{ fontSize: 11, color: C.g500, marginTop: 4 }}>Promedio General</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Informe */}
              {informeData && (
                <div ref={informeRef} style={{ ...S.card, marginBottom: 20, background: C.white }}>
                  <div style={{ textAlign: "center", marginBottom: 16, fontSize: 9, color: C.g500, fontStyle: "italic", lineHeight: 1.5 }}>
                    Documento electrónico firmado digitalmente en el marco de la Ley N° 27269...<br/>
                    Decenio de la Igualdad de oportunidades para mujeres y hombres<br/>
                    Año de la Esperanza y el Fortalecimiento de la Democracia
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={S.label}>Número de Informe</label>
                    <input value={informeNumero} onChange={e => setInformeNumero(e.target.value)} placeholder="Ej: 001" style={{ ...S.input, maxWidth: 200 }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.navy1, marginTop: 4 }}>
                      INFORME N.° {informeNumero || '____'}-2026-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "4px 12px", marginBottom: 16, fontSize: 12 }}>
                    <strong>A:</strong><span>{JEFATURA_AGEBATP.nombre}, {JEFATURA_AGEBATP.cargo}</span>
                    <strong>De:</strong><span>{especialistaSeleccionado?.nombre}, {especialistaSeleccionado?.cargo}</span>
                    <strong>Asunto:</strong>
                    <input value={informeData.asunto || ''} onChange={e => setInformeData(prev => ({ ...prev, asunto: e.target.value }))} style={{ ...S.input, fontSize: 12 }} />
                    <strong>Ref.:</strong><span>{informeData.referencia || 'Plan de Trabajo AGEBATP 2026'}</span>
                    <strong>Fecha:</strong><span>Lima, {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>

                  {/* Antecedentes */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>I. ANTECEDENTES</h4>
                    <textarea value={(informeData.antecedentes || []).join('\n')} onChange={e => setInformeData(prev => ({ ...prev, antecedentes: e.target.value.split('\n') }))} style={{ ...S.textarea, minHeight: 80 }} />
                  </div>

                  {/* Análisis */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>II. ANÁLISIS</h4>
                    <textarea value={(informeData.analisis || []).join('\n')} onChange={e => setInformeData(prev => ({ ...prev, analisis: e.target.value.split('\n') }))} style={{ ...S.textarea, minHeight: 80 }} />
                  </div>

                  {/* Resultados */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>Resultados</h4>
                    <textarea value={(informeData.resultados || []).join('\n')} onChange={e => setInformeData(prev => ({ ...prev, resultados: e.target.value.split('\n') }))} style={{ ...S.textarea, minHeight: 60 }} />
                  </div>

                  {/* Conclusiones */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>III. CONCLUSIONES</h4>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr><th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Nudo Crítico</th><th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Alternativa de Solución</th></tr>
                        </thead>
                        <tbody>
                          {(informeData.conclusionesTabla || []).map((row, i) => (
                            <tr key={i}>
                              <td style={{ border: `1px solid ${C.g200}`, padding: 6 }}>
                                <input value={row.nudoCritico || ''} onChange={e => {
                                  const updated = [...(informeData.conclusionesTabla || [])];
                                  updated[i] = { ...updated[i], nudoCritico: e.target.value };
                                  setInformeData(prev => ({ ...prev, conclusionesTabla: updated }));
                                }} style={{ ...S.input, border: "none", padding: 4 }} />
                              </td>
                              <td style={{ border: `1px solid ${C.g200}`, padding: 6 }}>
                                <input value={row.alternativa || ''} onChange={e => {
                                  const updated = [...(informeData.conclusionesTabla || [])];
                                  updated[i] = { ...updated[i], alternativa: e.target.value };
                                  setInformeData(prev => ({ ...prev, conclusionesTabla: updated }));
                                }} style={{ ...S.input, border: "none", padding: 4 }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={() => setInformeData(prev => ({ ...prev, conclusionesTabla: [...(prev.conclusionesTabla || []), { nudoCritico: '', alternativa: '' }] }))} style={{ ...S.btn(C.g50, C.navy3, C.g200), marginTop: 8, fontSize: 11 }}>+ Agregar fila</button>
                  </div>

                  {/* Recomendaciones */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy1, margin: "0 0 8px" }}>IV. RECOMENDACIONES</h4>
                    <textarea value={(informeData.recomendaciones || []).join('\n')} onChange={e => setInformeData(prev => ({ ...prev, recomendaciones: e.target.value.split('\n') }))} style={{ ...S.textarea, minHeight: 60 }} />
                  </div>

                  {/* Link evidencias */}
                  {linkEvidencias && (
                    <div style={{ padding: "8px 12px", borderRadius: 6, background: C.greenBg, border: `1px solid ${C.greenBorder}`, marginBottom: 12, fontSize: 12 }}>
                      <strong>Link de evidencias OneDrive:</strong> <a href={linkEvidencias} target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>{linkEvidencias}</a>
                    </div>
                  )}
                  {!linkEvidencias && (
                    <div style={{ padding: "8px 12px", borderRadius: 6, background: C.amberBg, border: `1px solid ${C.amberBorder}`, marginBottom: 12, fontSize: 11, color: C.amber }}>
                      ⚠ Link de evidencias OneDrive se generará al exportar el PDF (requiere backend configurado con STORAGE_PROVIDERS=onedrive).
                    </div>
                  )}

                  {/* Firma */}
                  <div style={{ marginTop: 24, textAlign: "center", fontSize: 12 }}>
                    <p style={{ marginBottom: 4 }}>Atentamente,</p>
                    <p style={{ fontStyle: "italic", color: C.g500, fontSize: 10, marginBottom: 12 }}>Documento firmado digitalmente</p>
                    <p style={{ fontWeight: 700 }}>{especialistaSeleccionado?.nombre}</p>
                    <p style={{ color: C.g600 }}>{especialistaSeleccionado?.cargo}</p>
                  </div>
                </div>
              )}

              {/* Editable Oficio */}
              {oficioData && (
                <div ref={oficioRef} style={{ ...S.card, marginBottom: 20, background: C.white }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: C.navy1, marginBottom: 12 }}>
                    OFICIO N.° {informeNumero || '____'}-2026-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP
                  </h4>
                  <div style={{ fontSize: 12, marginBottom: 12 }}>
                    <p style={{ margin: "2px 0" }}>Señor(a):</p>
                    <p style={{ margin: "2px 0", fontWeight: 600 }}>{directorNombre}</p>
                    <p style={{ margin: "2px 0" }}>{cargoDirector} del {institucionTipo} "{institucionNombre}"</p>
                    <p style={{ margin: "2px 0" }}>Presente.-</p>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Asunto</label>
                    <input value={oficioData.asunto || ''} onChange={e => setOficioData(prev => ({ ...prev, asunto: e.target.value }))} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Cuerpo del Oficio</label>
                    <textarea value={(oficioData.cuerpo || []).join('\n\n')} onChange={e => setOficioData(prev => ({ ...prev, cuerpo: e.target.value.split('\n\n') }))} style={{ ...S.textarea, minHeight: 160 }} />
                  </div>
                  {linkEvidencias && (
                    <p style={{ fontSize: 12, margin: "12px 0" }}>Las evidencias se encuentran disponibles en: <a href={linkEvidencias} target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>{linkEvidencias}</a></p>
                  )}
                  <div style={{ marginTop: 16, fontSize: 12 }}>
                    <p>{oficioData.despedida || 'Hago propicia la ocasión para expresarle los sentimientos de mi especial consideración.'}</p>
                    <p style={{ fontWeight: 700, marginTop: 16 }}>{especialistaSeleccionado?.nombre}</p>
                    <p style={{ color: C.g600 }}>{especialistaSeleccionado?.cargo}</p>
                  </div>
                </div>
              )}

              {/* Export buttons */}
              {(informeData || oficioData) && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {informeData && (
                    <button onClick={handleExportInformePDF} disabled={uploading} style={S.btn(C.navy4, C.white, C.navy5)}>
                      {uploading ? 'Subiendo...' : '📥 Descargar Informe (PDF)'}
                    </button>
                  )}
                  {oficioData && (
                    <button onClick={handleExportOficioPDF} style={S.btn(C.gold2, C.white, C.gold1)}>
                      📥 Descargar Oficio (PDF)
                    </button>
                  )}
                  <button onClick={async () => { await saveDraft(); showToast('Guardado en Firestore.'); if (onSaved) onSaved(); }} style={S.btn(C.green, C.white, C.green)}>
                    💾 Guardar Final
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.g200}` }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} style={S.btn(C.white, C.navy3, C.g200)}>
              {step === 1 ? 'Cancelar' : '← Anterior'}
            </button>
            {step < 4 && (
              <button onClick={() => setStep(step + 1)} disabled={!canGoNext()} style={{ ...S.btn(C.navy4, C.white, C.navy5), opacity: canGoNext() ? 1 : 0.5 }}>
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
