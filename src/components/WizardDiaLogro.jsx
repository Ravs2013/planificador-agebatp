import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';
import FirmaDigital from './FirmaDigital';
import FichaDiaLogroFormEBA from './FichaDiaLogroFormEBA';
import FichaEmprendimientoFormETP from './FichaEmprendimientoFormETP';
import { generarFichaDiaLogroPDF } from '../pdf/generarFichaDiaLogroPDF';
import { generarFichaEmprendimientoPDF } from '../pdf/generarFichaEmprendimientoPDF';
import { generarInformeDiaLogroPDF } from '../pdf/generarInformeDiaLogroPDF';
import { generarOficioPDF } from '../pdf/generarOficioPDF';
import { loadImageDataURL } from '../pdf/membrete';
import bannerAgebatpUrl from '../assets/membrete/banner_agebatp.jpeg';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useAuth } from '../context/AuthContext';
import { addInformeMonitoreo, updateInformeMonitoreo, subscribeDirectorioCeba, subscribeDirectorioCetpro } from '../firebase/db';
import { getVisionModel, getChatModel } from '../firebase/config';
import { ESPECIALISTAS_MONITOREO, JEFATURA_AGEBATP, monthNames } from '../data/constants';
import { ANTECEDENTES_2026 } from '../data/antecedentes2026';

const C = {
  navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
  g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
  g100: "#F1F5F9", g50: "#F8FAFC",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF", blueBorder: "#DBEAFE",
  white: "#FFFFFF",
};

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

async function pdfToImages(file, onProgress) {
  if (file.type !== "application/pdf") {
    if (onProgress) onProgress("Leyendo archivo de imagen...", 30);
    const base64 = await fileToBase64(file);
    return [base64];
  }
  if (onProgress) onProgress("Cargando archivo PDF...", 10);
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const images = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) onProgress(`Renderizando página ${i} de ${pdf.numPages}...`, 10 + Math.floor((i / pdf.numPages) * 40));
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const imgBase64 = canvas.toDataURL('image/png').split(',')[1];
    images.push(imgBase64);
  }
  return images;
}

async function extraerFichaDiaLogroConIA(images, programa, onProgress) {
  const model = await getVisionModel("gemini-2.5-pro");
  if (onProgress) onProgress("Iniciando extracción con Gemini 2.5 Pro...", 55);

  const prompt = programa === 'ETP'
    ? `Eres un extractor de datos de fichas oficiales de monitoreo de la Feria de Emprendimiento (CETPRO / UGEL 03, Perú).
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código \`\`\`json).
Esquema de salida JSON:
{
  "datosGeneralesCETPRO": {
    "nombreCETPRO": string,
    "codigoModular": string,
    "ugel": string,
    "red": string,
    "fecha": string,
    "cicloBasicoAuxiliar": boolean,
    "cicloMedioTecnico": boolean,
    "turnoM": boolean,
    "turnoT": boolean,
    "turnoN": boolean
  },
  "datosDirector": {
    "nombres": string,
    "dni": string,
    "celular": string,
    "correo": string
  },
  "rubricas": [
    { "criterio": "Organización y logística", "nivel": number (1, 2, 3 o 4) },
    { "criterio": "Ambientes de exposición (Stand o aulas)", "nivel": number (1-4) },
    { "criterio": "Presentación de los expositores", "nivel": number (1-4) },
    { "criterio": "Evaluadores de proyectos", "nivel": number (1-4) },
    { "criterio": "Recursos y materiales", "nivel": number (1-4) }
  ],
  "aspectosPorMejorar": string,
  "compromisoMejora": string
}`
    : `Eres un extractor de datos de fichas oficiales de monitoreo del Primer Día del Logro (CEBA / UGEL 03, Perú).
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código \`\`\`json).
Esquema de salida JSON:
{
  "datosGenerales": {
    "nombreCEBA": string,
    "codigoLocal": string,
    "ugel": string,
    "red": string,
    "fecha": string,
    "cicloAvanzado": boolean,
    "cicloInicialIntermedio": boolean,
    "turnoM": boolean,
    "turnoT": boolean,
    "turnoN": boolean
  },
  "datosInformante": {
    "nombres": string,
    "dni": string,
    "celular": string,
    "correo": string,
    "cargoDirector": boolean,
    "cargoOtro": boolean,
    "cmAvanzado": string,
    "cmInicialIntermedio": string
  },
  "criterios": [
    { "nombre": "DESARROLLO DEL PENSAMIENTO REFLEXIVO", "nivel": string ("C", "B" o "A") },
    { "nombre": "CREATIVIDAD E INNOVACIÓN Y/O USO DE TECNOLOGÍA", "nivel": string ("C", "B" o "A") },
    { "nombre": "COLABORACIÓN Y CO-CREACIÓN", "nivel": string ("C", "B" o "A") },
    { "nombre": "ALINEACIÓN DE LAS ACTIVIDADES CON EL CNEB", "nivel": string ("C", "B" o "A") },
    { "nombre": "BIENESTAR DE LA COMUNIDAD", "nivel": string ("C", "B" o "A") }
  ],
  "compromisoDirector": string
}`;

  const contents = [
    prompt,
    ...images.map(b64 => ({ inlineData: { mimeType: "image/png", data: b64 } }))
  ];

  if (onProgress) onProgress("Gemini 2.5 Pro procesando OCR e interpretando la ficha...", 70);
  const result = await model.generateContent(contents);
  const text = typeof result.response.text === "function" ? result.response.text() : result.response.text;
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);
  if (onProgress) onProgress("Ficha procesada exitosamente.", 100);
  return parsed;
}

async function generarInformeDiaLogroIA(payload, onProgress) {
  const model = await getChatModel();
  const prompt = `Eres un especialista pedagógico del AGEBATP de la UGEL 03 (Perú).
Genera un informe detallado sobre el ${payload.programa === 'ETP' ? 'Día del Emprendimiento (Feria de Emprendimiento CETPRO)' : 'Primer Día del Logro (CEBA)'}.
Especialista: ${payload.especialista.nombre} (${payload.especialista.cargo})
Programa: ${payload.programa}
Fichas monitoreadas (${payload.fichas.length}): ${JSON.stringify(payload.fichas)}

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código) con la estructura:
{
  "asunto": "MONITOREO Y ACOMPAÑAMIENTO AL DÍA DEL LOGRO / FERIA DE EMPRENDIMIENTO...",
  "referencia": "Plan de Trabajo AGEBATP 2026",
  "antecedentes": [ "Párrafo 1 antecedente...", "Párrafo 2 antecedente..." ],
  "analisis": [ "Párrafo 1 análisis...", "Párrafo 2 análisis..." ],
  "conclusiones": [ "Conclusión 1...", "Conclusión 2..." ],
  "recomendaciones": [ "Recomendación 1...", "Recomendación 2..." ]
}`;

  if (onProgress) onProgress("Iniciando redacción con IA...", 20);
  const result = await model.generateContent(prompt);
  const text = typeof result.response.text === "function" ? result.response.text() : result.response.text;
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);
  if (onProgress) onProgress("Informe estructurado correctamente.", 100);
  return parsed;
}

export default function WizardDiaLogro({ onClose, onSaved, initialData = null }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialData?.paso || 1);
  const [saving, setSaving] = useState(false);
  const [informeId, setInformeId] = useState(initialData?.id || null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // Paso 1: Datos Actividad e IE
  const [programa, setPrograma] = useState(initialData?.programa || 'EBA');
  const [especialistaId, setEspecialistaId] = useState(initialData?.especialistaId || '');
  const [especialistaNombre, setEspecialistaNombre] = useState(initialData?.especialistaNombre || user?.displayName || '');
  const [especialistaCargo, setEspecialistaCargo] = useState(initialData?.especialistaCargo || 'Especialista AGEBATP');

  const [directorio, setDirectorio] = useState([]);
  const [selectedIEId, setSelectedIEId] = useState(initialData?.institucionId || '');
  const [nombreIE, setNombreIE] = useState(initialData?.institucionNombre || '');
  const [directorNombre, setDirectorNombre] = useState(initialData?.directorNombre || '');

  const [fechaActividad, setFechaActividad] = useState(initialData?.fecha || new Date().toISOString().split('T')[0]);
  const [asunto, setAsunto] = useState(initialData?.asunto || '');

  // Paso 2: Múltiples Fichas de Monitoreo
  const [fichas, setFichas] = useState(initialData?.fichas || []);
  const [selectedFichaIdx, setSelectedFichaIdx] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ pct: 0, text: '', detail: '' });

  // Paso 3: Informe e IA
  const [iaLoading, setIaLoading] = useState(false);
  const [iaProgress, setIaProgress] = useState({ pct: 0, text: '' });
  const [antecedentes, setAntecedentes] = useState(initialData?.antecedentes || ANTECEDENTES_2026);
  const [analisis, setAnalisis] = useState(initialData?.analisis || []);
  const [conclusiones, setConclusiones] = useState(initialData?.conclusiones || []);
  const [recomendaciones, setRecomendaciones] = useState(initialData?.recomendaciones || []);

  // Firmas
  const [firmaEspecialista, setFirmaEspecialista] = useState(initialData?.firmaEspecialista || null);
  const [bannerDataURL, setBannerDataURL] = useState(null);

  // Cargar Directorio (CEBA / CETPRO)
  useEffect(() => {
    const unsub = programa === 'ETP'
      ? subscribeDirectorioCetpro(list => setDirectorio(list || []))
      : subscribeDirectorioCeba(list => setDirectorio(list || []));
    return () => unsub();
  }, [programa]);

  // Cargar Banner Membrete
  useEffect(() => {
    loadImageDataURL(bannerAgebatpUrl).then(url => setBannerDataURL(url)).catch(() => {});
  }, []);

  // Si no hay fichas, agregar una ficha vacía por defecto
  useEffect(() => {
    if (fichas.length === 0) {
      const nuevaFicha = programa === 'ETP'
        ? { datosGeneralesCETPRO: { nombreCETPRO: nombreIE, fecha: fechaActividad }, datosDirector: { nombres: directorNombre }, rubricas: [] }
        : { datosGenerales: { nombreCEBA: nombreIE, fecha: fechaActividad }, datosInformante: { nombres: directorNombre }, criterios: [] };
      setFichas([nuevaFicha]);
    }
  }, [programa]);

  // Manejar selección de IE
  const handleSelectIE = (e) => {
    const id = e.target.value;
    setSelectedIEId(id);
    const item = directorio.find(d => d.id === id);
    if (item) {
      const nIE = item.nombre || item.nombreCETPRO || item.nombreCEBA || '';
      const nDir = item.directorNombre || item.director || '';
      setNombreIE(nIE);
      setDirectorNombre(nDir);

      // Actualizar la ficha activa si corresponde
      if (fichas[selectedFichaIdx]) {
        const copy = [...fichas];
        if (programa === 'ETP') {
          copy[selectedFichaIdx].datosGeneralesCETPRO = { ...copy[selectedFichaIdx].datosGeneralesCETPRO, nombreCETPRO: nIE, codigoModular: item.codigoModular || '' };
          copy[selectedFichaIdx].datosDirector = { ...copy[selectedFichaIdx].datosDirector, nombres: nDir, dni: item.directorDni || '' };
        } else {
          copy[selectedFichaIdx].datosGenerales = { ...copy[selectedFichaIdx].datosGenerales, nombreCEBA: nIE, codigoLocal: item.codigoLocal || '' };
          copy[selectedFichaIdx].datosInformante = { ...copy[selectedFichaIdx].datosInformante, nombres: nDir, dni: item.directorDni || '' };
        }
        setFichas(copy);
      }
    }
  };

  const handleAddFicha = () => {
    const nuevaFicha = programa === 'ETP'
      ? { datosGeneralesCETPRO: { nombreCETPRO: nombreIE, fecha: fechaActividad }, datosDirector: { nombres: directorNombre }, rubricas: [] }
      : { datosGenerales: { nombreCEBA: nombreIE, fecha: fechaActividad }, datosInformante: { nombres: directorNombre }, criterios: [] };
    const updated = [...fichas, nuevaFicha];
    setFichas(updated);
    setSelectedFichaIdx(updated.length - 1);
  };

  const handleRemoveFicha = (idx) => {
    if (fichas.length <= 1) {
      showToast("Debe existir al menos una ficha de monitoreo.", "error");
      return;
    }
    const updated = fichas.filter((_, i) => i !== idx);
    setFichas(updated);
    setSelectedFichaIdx(Math.max(0, idx - 1));
  };

  const handleUploadOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const imgs = await pdfToImages(file, (t, p) => setOcrProgress({ pct: p, text: t }));
      const extracted = await extraerFichaDiaLogroConIA(imgs, programa, (t, p) => setOcrProgress({ pct: p, text: t }));
      
      const copy = [...fichas];
      copy[selectedFichaIdx] = { ...copy[selectedFichaIdx], ...extracted };
      setFichas(copy);
      showToast("Ficha procesada con éxito vía Gemini IA.");
    } catch (err) {
      showToast(`Error al procesar archivo: ${err.message}`, "error");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleGenerarIA = async () => {
    setIaLoading(true);
    try {
      const espObj = {
        nombre: especialistaNombre,
        cargo: especialistaCargo
      };
      const res = await generarInformeDiaLogroIA({ programa, especialista: espObj, fichas }, (t, p) => setIaProgress({ pct: p, text: t }));
      if (res.asunto) setAsunto(res.asunto);
      if (res.antecedentes) setAntecedentes(res.antecedentes);
      if (res.analisis) setAnalisis(res.analisis);
      if (res.conclusiones) setConclusiones(res.conclusiones);
      if (res.recomendaciones) setRecomendaciones(res.recomendaciones);
      showToast("Informe redactado autónomamente con IA.");
    } catch (err) {
      showToast(`Error en IA: ${err.message}`, "error");
    } finally {
      setIaLoading(false);
    }
  };

  const handleSave = async (estado = 'borrador') => {
    setSaving(true);
    try {
      const payload = {
        tipoMonitoreo: 'dia_logro_emprendimiento',
        tipo: 'dia_logro_emprendimiento',
        programa,
        especialistaId,
        especialistaNombre,
        especialistaCargo,
        institucionId: selectedIEId,
        institucionNombre: nombreIE,
        directorNombre,
        fecha: fechaActividad,
        asunto,
        fichas,
        antecedentes,
        analisis,
        conclusiones,
        recomendaciones,
        firmaEspecialista,
        estado,
        paso: step
      };

      if (informeId) {
        await updateInformeMonitoreo(informeId, payload);
      } else {
        const newId = await addInformeMonitoreo(payload);
        setInformeId(newId);
      }
      showToast(estado === 'finalizado' ? 'Informe finalizado con éxito.' : 'Borrador guardado.');
      if (onSaved) onSaved();
    } catch (err) {
      showToast(`Error al guardar: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  // Descargas PDF
  const handleDownloadFicha = (idx) => {
    const fData = fichas[idx];
    if (!fData) return;
    const doc = programa === 'ETP'
      ? generarFichaEmprendimientoPDF({ ...fData, monitorNombre: especialistaNombre }, bannerDataURL)
      : generarFichaDiaLogroPDF({ ...fData, monitorNombre: especialistaNombre }, bannerDataURL);
    doc.save(`Ficha_Monitoreo_${programa}_${idx + 1}.pdf`);
  };

  const handleDownloadInforme = () => {
    const payload = {
      numeroInforme: "001",
      programa,
      especialista: { nombre: especialistaNombre, cargo: especialistaCargo },
      jefatura: JEFATURA_AGEBATP,
      asunto,
      fecha: fechaActividad,
      antecedentes,
      analisis,
      fichas,
      conclusiones,
      recomendaciones
    };
    const doc = generarInformeDiaLogroPDF(payload, bannerDataURL);
    doc.save(`Informe_${programa}_Dia_Logro_Emprendedor.pdf`);
  };

  const S = {
    overlay: { position: "fixed", inset: 0, background: "rgba(12,25,41,0.7)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 },
    modal: { background: C.white, width: "100%", maxWidth: 1000, height: "90vh", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" },
    header: { padding: "16px 24px", background: C.navy1, color: C.white, display: "flex", justifyContent: "space-between", alignItems: "center" },
    body: { flex: 1, padding: 24, overflowY: "auto", background: C.g50 },
    footer: { padding: "16px 24px", background: C.white, borderTop: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
    btn: (bg, color, border) => ({ padding: "8px 18px", borderRadius: 8, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: "'DM Sans'" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase" }
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Toast */}
        {toast && (
          <div style={{ position: "absolute", top: 70, right: 24, zIndex: 220, padding: "10px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? C.greenBg : C.redBg, border: `1px solid ${toast.type === "success" ? C.greenBorder : C.redBorder}` }}>
            {toast.msg}
          </div>
        )}

        {/* Modal Header */}
        <div style={S.header}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontFamily: "'DM Serif Display',serif" }}>
              Informe — {programa === 'ETP' ? 'Día del Emprendimiento (CETPRO)' : 'Primer Día del Logro (CEBA)'}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: C.g400 }}>Wizard de 4 pasos (Sin Actas)</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.white, cursor: "pointer" }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Stepper Header */}
        <div style={{ display: "flex", background: C.navy2, borderBottom: `1px solid ${C.navy3}`, padding: "0 24px" }}>
          {[
            { num: 1, title: "1. Datos IE y Evento" },
            { num: 2, title: `2. Fichas Monitoreo (${fichas.length})` },
            { num: 3, title: "3. Redacción & IA" },
            { num: 4, title: "4. Exportar PDFs" }
          ].map(st => (
            <div
              key={st.num}
              onClick={() => setStep(st.num)}
              style={{
                flex: 1, padding: "12px 10px", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700,
                color: step === st.num ? C.gold2 : C.g400,
                borderBottom: step === st.num ? `3px solid ${C.gold2}` : "3px solid transparent"
              }}
            >
              {st.title}
            </div>
          ))}
        </div>

        {/* Body Steps */}
        <div style={S.body}>
          {/* PASO 1: Datos IE & Evento */}
          {step === 1 && (
            <div>
              <div style={{ background: C.white, padding: 20, borderRadius: 10, border: `1px solid ${C.g200}`, marginBottom: 20 }}>
                <h4 style={{ margin: "0 0 16px", color: C.navy1, fontFamily: "'DM Serif Display',serif" }}>Paso 1: Configuración del Evento e Institución</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={S.label}>Programa Educativo</label>
                    <select style={S.input} value={programa} onChange={e => setPrograma(e.target.value)}>
                      <option value="EBA">EBA — Primer Día del Logro</option>
                      <option value="ETP">ETP — Día del Emprendimiento (CETPRO)</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Seleccionar Institución Educativa</label>
                    <select style={S.input} value={selectedIEId} onChange={handleSelectIE}>
                      <option value="">-- Seleccione una IE del directorio --</option>
                      {directorio.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.nombre || d.nombreCETPRO || d.nombreCEBA} (Cod: {d.codigoLocal || d.codigoModular || '—'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Fecha de la Actividad</label>
                    <input style={S.input} type="date" value={fechaActividad} onChange={e => setFechaActividad(e.target.value)} />
                  </div>

                  <div>
                    <label style={S.label}>Especialista Monitor</label>
                    <input style={S.input} type="text" value={especialistaNombre} onChange={e => setEspecialistaNombre(e.target.value)} placeholder="Nombre del especialista..." />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={S.label}>Asunto del Informe</label>
                  <input
                    style={S.input}
                    type="text"
                    value={asunto}
                    onChange={e => setAsunto(e.target.value)}
                    placeholder={`MONITOREO Y ACOMPAÑAMIENTO AL ${programa === 'ETP' ? 'DÍA DEL EMPRENDIMIENTO 2026' : 'PRIMER DÍA DEL LOGRO 2026'}...`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Fichas de Monitoreo */}
          {step === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, color: C.navy1, fontFamily: "'DM Serif Display',serif" }}>Paso 2: Fichas de Monitoreo ({programa})</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.g500 }}>Puede incorporar múltiples fichas digitales o procesarlas mediante OCR con Gemini IA.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <label style={S.btn(C.navy5, C.white, C.navy5)}>
                    <Icon name="upload" size={14} /> Importar Ficha OCR (Gemini)
                    <input type="file" accept="image/*,application/pdf" onChange={handleUploadOCR} style={{ display: "none" }} />
                  </label>
                  <button onClick={handleAddFicha} style={S.btn(C.gold2, C.white, C.gold1)}>
                    <Icon name="plus" size={14} /> Agregar Otra Ficha
                  </button>
                </div>
              </div>

              {ocrLoading && (
                <div style={{ padding: 14, background: C.blueBg, borderRadius: 8, border: `1px solid ${C.blueBorder}`, marginBottom: 16, fontSize: 12, color: C.navy3 }}>
                  ⏳ {ocrProgress.text || 'Procesando archivo con Gemini IA...'} ({ocrProgress.pct}%)
                </div>
              )}

              {/* Tabs de Fichas */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
                {fichas.map((f, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFichaIdx(idx)}
                    style={{
                      padding: "8px 14px", borderRadius: 8, border: `1px solid ${selectedFichaIdx === idx ? C.navy5 : C.g300}`,
                      background: selectedFichaIdx === idx ? C.navy5 : C.white, color: selectedFichaIdx === idx ? C.white : C.navy1,
                      cursor: "pointer", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    Ficha N° {idx + 1}
                    {fichas.length > 1 && (
                      <span onClick={(e) => { e.stopPropagation(); handleRemoveFicha(idx); }} style={{ color: selectedFichaIdx === idx ? C.white : C.red, marginLeft: 4 }}>×</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Formulario Ficha Activa */}
              {fichas[selectedFichaIdx] && (
                programa === 'ETP' ? (
                  <FichaEmprendimientoFormETP
                    data={fichas[selectedFichaIdx]}
                    onChange={(updated) => {
                      const copy = [...fichas];
                      copy[selectedFichaIdx] = updated;
                      setFichas(copy);
                    }}
                  />
                ) : (
                  <FichaDiaLogroFormEBA
                    data={fichas[selectedFichaIdx]}
                    onChange={(updated) => {
                      const copy = [...fichas];
                      copy[selectedFichaIdx] = updated;
                      setFichas(copy);
                    }}
                  />
                )
              )}
            </div>
          )}

          {/* PASO 3: Redacción e IA */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, color: C.navy1, fontFamily: "'DM Serif Display',serif" }}>Paso 3: Redacción del Informe Institucional</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.g500 }}>Genere o ajuste los párrafos de análisis, conclusiones y recomendaciones.</p>
                </div>
                <button onClick={handleGenerarIA} disabled={iaLoading} style={S.btn(C.blue, C.white, C.blue)}>
                  <Icon name="sparkles" size={14} /> Redactar Autónoma con IA
                </button>
              </div>

              {iaLoading && (
                <div style={{ padding: 14, background: C.blueBg, borderRadius: 8, border: `1px solid ${C.blueBorder}`, marginBottom: 16, fontSize: 12, color: C.navy3 }}>
                  🤖 {iaProgress.text || 'Generando informe...'} ({iaProgress.pct}%)
                </div>
              )}

              {/* Antecedentes */}
              <div style={{ background: C.white, padding: 18, borderRadius: 10, border: `1px solid ${C.g200}`, marginBottom: 16 }}>
                <h5 style={{ margin: "0 0 8px", color: C.navy1 }}>I. Antecedentes (Bases Legales 2026)</h5>
                <textarea
                  style={{ ...S.input, minHeight: 90 }}
                  value={antecedentes.join('\n\n')}
                  onChange={e => setAntecedentes(e.target.value.split('\n\n'))}
                />
              </div>

              {/* Análisis */}
              <div style={{ background: C.white, padding: 18, borderRadius: 10, border: `1px solid ${C.g200}`, marginBottom: 16 }}>
                <h5 style={{ margin: "0 0 8px", color: C.navy1 }}>II. Análisis y Resultados del Monitoreo</h5>
                <textarea
                  style={{ ...S.input, minHeight: 110 }}
                  value={analisis.join('\n\n')}
                  onChange={e => setAnalisis(e.target.value.split('\n\n'))}
                  placeholder="Detalle de las observaciones realizadas durante las visitas..."
                />
              </div>

              {/* Conclusiones y Recomendaciones */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                <div style={{ background: C.white, padding: 18, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                  <h5 style={{ margin: "0 0 8px", color: C.navy1 }}>III. Conclusiones y Nudos Críticos</h5>
                  <textarea
                    style={{ ...S.input, minHeight: 90 }}
                    value={conclusiones.join('\n')}
                    onChange={e => setConclusiones(e.target.value.split('\n'))}
                    placeholder="Una conclusión por línea..."
                  />
                </div>
                <div style={{ background: C.white, padding: 18, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                  <h5 style={{ margin: "0 0 8px", color: C.navy1 }}>IV. Recomendaciones</h5>
                  <textarea
                    style={{ ...S.input, minHeight: 90 }}
                    value={recomendaciones.join('\n')}
                    onChange={e => setRecomendaciones(e.target.value.split('\n'))}
                    placeholder="Una recomendación por línea..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Exportar PDFs */}
          {step === 4 && (
            <div>
              <h4 style={{ margin: "0 0 16px", color: C.navy1, fontFamily: "'DM Serif Display',serif" }}>Paso 4: Descarga de Documentos Oficiales</h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
                {/* Descargar Informe */}
                <div style={{ background: C.white, padding: 20, borderRadius: 10, border: `1px solid ${C.g200}`, borderTop: `4px solid ${C.navy5}` }}>
                  <h5 style={{ margin: "0 0 8px", color: C.navy1, fontSize: "1rem" }}>Informe Institucional Día del Logro / Emprendimiento</h5>
                  <p style={{ fontSize: 12, color: C.g500, marginBottom: 16 }}>PDF completo consolidando el análisis, tabla de resultados y antecedentes 2026.</p>
                  <button onClick={handleDownloadInforme} style={S.btn(C.navy5, C.white, C.navy5)}>
                    <Icon name="download" size={14} /> Descargar Informe PDF
                  </button>
                </div>

                {/* Descargar Fichas PDF */}
                {fichas.map((f, idx) => (
                  <div key={idx} style={{ background: C.white, padding: 20, borderRadius: 10, border: `1px solid ${C.g200}`, borderTop: `4px solid ${C.gold2}` }}>
                    <h5 style={{ margin: "0 0 8px", color: C.navy1, fontSize: "1rem" }}>Ficha N° {idx + 1} ({programa})</h5>
                    <p style={{ fontSize: 12, color: C.g500, marginBottom: 16 }}>Formato oficial firmado de la Ficha de Monitoreo.</p>
                    <button onClick={() => handleDownloadFicha(idx)} style={S.btn(C.gold2, C.white, C.gold1)}>
                      <Icon name="download" size={14} /> Descargar Ficha {idx + 1} PDF
                    </button>
                  </div>
                ))}
              </div>

              {/* Firma Digital Especialista */}
              <div style={{ background: C.white, padding: 20, borderRadius: 10, border: `1px solid ${C.g200}` }}>
                <h5 style={{ margin: "0 0 12px", color: C.navy1 }}>Firma Digital del Especialista</h5>
                <FirmaDigital
                  initialValue={firmaEspecialista}
                  onSave={url => setFirmaEspecialista(url)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={S.footer}>
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={S.btn(C.white, C.navy1, C.g300)}>
                Anterior
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handleSave('borrador')} disabled={saving} style={S.btn(C.white, C.navy5, C.navy5)}>
              {saving ? 'Guardando...' : 'Guardar Borrador'}
            </button>

            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} style={S.btn(C.navy5, C.white, C.navy5)}>
                Siguiente
              </button>
            ) : (
              <button onClick={() => handleSave('finalizado')} disabled={saving} style={S.btn(C.green, C.white, C.green)}>
                Finalizar Informe
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
