import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';
import FirmaDigital from './FirmaDigital';
import FichaGestionDigitalForm from './FichaGestionDigitalForm';
import { generarFichaGestionPDF } from '../pdf/generarFichaGestionPDF';
import { generarInformeDirectorPDF } from '../pdf/generarInformeDirectorPDF';
import { loadImageDataURL } from '../pdf/membrete';
import bannerAgebatpUrl from '../assets/membrete/banner_agebatp.jpeg';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useAuth } from '../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';
import { addInformeMonitoreo, updateInformeMonitoreo } from '../firebase/db';
import { getVisionModel, getChatModel } from '../firebase/config';
import { ESPECIALISTAS_MONITOREO, JEFATURA_AGEBATP, monthNames } from '../data/constants';
import { ANTECEDENTES_2026, ANALISIS_BOILERPLATE_2026 } from '../data/antecedentes2026';
import { FICHA_GESTION_ITEMS } from '../data/fichaGestionItems';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

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

async function extraerFichaDirectorConIA(images, onProgress) {
  const model = await getVisionModel("gemini-2.5-pro");
  if (onProgress) onProgress("Iniciando extracción con Gemini 2.5 Pro...", 55);

  const prompt = `Eres un extractor de datos de fichas oficiales de monitoreo/acompañamiento a la gestión directiva de la UGEL 03 (CETPRO/ETP, Perú).
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código) con el esquema detallado abajo. Si un campo no aparece o está vacío, usa null. No inventes valores.

Esquema de salida JSON:
{
  "cetpro": {
    "codigoModular": string,
    "nombre": string,
    "distrito": string,
    "ugel": string,
    "rei": string,
    "fecha": string (formato YYYY-MM-DD),
    "nVisita": number,
    "horaInicio": string,
    "horaTermino": string,
    "ofertaFormativa": { "AT": boolean, "T": boolean, "PFC": boolean }
  },
  "monitor": {
    "cargo": string,
    "nombres": string,
    "dni": string,
    "telefono": string,
    "correo": string
  },
  "directivo": {
    "nombres": string,
    "dni": string,
    "condicion": "Designado" | "Encargado" | "Encargado por funciones",
    "nResolucion": string,
    "telefono": string,
    "correo": string
  },
  "inicioOferta": {
    "2026-I": { "inicio": string, "termino": string },
    "2026-II": { "inicio": string, "termino": string }
  },
  "aspectos": {
    "01": [ { "item": "01", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "08" } ],
    "02": [
      { "item": "09", "si": boolean, "no": boolean, "evidencia": string }, ...
      { "item": "21", "si": boolean, "no": boolean, "evidencia": string }
    ],
    "03": [ { "item": "22", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "36" } ],
    "04": [ { "item": "37", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "44" } ],
    "05": [ { "item": "45", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "55" } ],
    "06": [ { "item": "56", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "59" } ],
    "07": [ { "item": "60", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "67" } ],
    "08": [ { "item": "68", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "70" } ]
  },
  "recomendaciones": string,
  "compromisos": string
}

Nota para Aspecto 02: Los ítems 13 y 21 tienen tablas de conteo de certificados y títulos. Si ves valores en esas tablas, puedes guardarlos dentro de "aspectos"["02"] en una propiedad llamada "tablasConteo" con el formato:
"tablasConteo": {
  "certificados": [
    { "prog": "Opciones Ocupacionales", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Especialidades", "y2024": number, ... },
    { "prog": "Programa de estudios Auxiliar técnico", ... },
    { "prog": "Programa de estudios técnico", ... }
  ],
  "titulos": [
    ... mismo formato ...
  ]
}
`;

  const contents = [
    prompt,
    ...images.map(b64 => ({ inlineData: { mimeType: "image/png", data: b64 } }))
  ];

  if (onProgress) onProgress("Gemini 2.5 Pro procesando OCR e interpretando el manuscrito de gestión...", 70);
  const result = await model.generateContent(contents);
  const text = typeof result.response.text === "function" ? result.response.text() : result.response.text;

  if (onProgress) onProgress("Procesando respuesta JSON...", 90);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);

  if (onProgress) onProgress("Ficha de gestión procesada exitosamente.", 100);
  return parsed;
}

async function extraerMultiplesFichasConIA(images, onProgress) {
  const model = await getVisionModel("gemini-2.5-pro");
  if (onProgress) onProgress("Iniciando extracción masiva con Gemini 2.5 Pro...", 55);

  const prompt = `Eres un extractor de datos de fichas oficiales de monitoreo/acompañamiento a la gestión directiva de la UGEL 03 (CETPRO/ETP, Perú).
El archivo PDF subido contiene MÚLTIPLES fichas de monitoreo (una ficha por cada director monitoreado).
Por favor extrae la información de CADA una de las fichas presentes en las imágenes y devuélvelas dentro de un array de JSONs.
Devuelve EXCLUSIVAMENTE un array válido en formato JSON (sin markdown, sin bloques de código, sin texto introductorio) con el siguiente esquema:
[
  {
    "cetpro": {
      "codigoModular": string,
      "nombre": string,
      "distrito": string,
      "ugel": string,
      "rei": string,
      "fecha": string (formato YYYY-MM-DD),
      "nVisita": number,
      "horaInicio": string,
      "horaTermino": string,
      "ofertaFormativa": { "AT": boolean, "T": boolean, "PFC": boolean }
    },
    "monitor": {
      "cargo": string,
      "nombres": string,
      "dni": string,
      "telefono": string,
      "correo": string
    },
    "directivo": {
      "nombres": string,
      "dni": string,
      "condicion": "Designado" | "Encargado" | "Encargado por funciones",
      "nResolucion": string,
      "telefono": string,
      "correo": string
    },
    "inicioOferta": {
      "2026-I": { "inicio": string, "termino": string },
      "2026-II": { "inicio": string, "termino": string }
    },
    "aspectos": {
      "01": [ { "item": "01", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "08" } ],
      "02": [
        { "item": "09", "si": boolean, "no": boolean, "evidencia": string }, ...
        { "item": "21", "si": boolean, "no": boolean, "evidencia": string }
      ],
      "03": [ { "item": "22", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "36" } ],
      "04": [ { "item": "37", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "44" } ],
      "05": [ { "item": "45", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "55" } ],
      "06": [ { "item": "56", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "59" } ],
      "07": [ { "item": "60", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "67" } ],
      "08": [ { "item": "68", "si": boolean, "no": boolean, "evidencia": string }, ... { "item": "70" } ]
    },
    "recomendaciones": string,
    "compromisos": string
  },
  ...
]

Nota: En el Aspecto 02, los ítems 13 y 21 tienen tablas de conteo de certificados y títulos. Si ves valores en esas tablas, puedes guardarlos dentro de "aspectos"["02"] en una propiedad llamada "tablasConteo" con el formato:
"tablasConteo": {
  "certificados": [
    { "prog": "Opciones Ocupacionales", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Especialidades", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Programa de estudios Auxiliar técnico", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Programa de estudios técnico", "y2024": number, "y2025": number, "y2026": number, "total": number }
  ],
  "titulos": [
    { "prog": "Opciones Ocupacionales", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Especialidades", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Programa de estudios Auxiliar técnico", "y2024": number, "y2025": number, "y2026": number, "total": number },
    { "prog": "Programa de estudios técnico", "y2024": number, "y2025": number, "y2026": number, "total": number }
  ]
}
`;

  const contents = [
    prompt,
    ...images.map(b64 => ({ inlineData: { mimeType: "image/png", data: b64 } }))
  ];

  if (onProgress) onProgress("Gemini 2.5 Pro procesando OCR e interpretando el manuscrito de las fichas de gestión...", 70);
  const result = await model.generateContent(contents);
  const text = typeof result.response.text === "function" ? result.response.text() : result.response.text;

  if (onProgress) onProgress("Procesando respuesta JSON...", 90);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);

  if (onProgress) onProgress("Fichas de gestión procesadas exitosamente.", 100);
  return parsed;
}

async function generarInformeDirectorIA(payload, onProgress) {
  const model = await getChatModel();
  const prompt = `Actúas como ESPECIALISTA SENIOR de Educación Técnico-Productiva (ETP) de la UGEL 03 (Perú), experto en monitoreo a la gestión, redacción y argumentación de informes de gestión pública. Redacta el contenido del Informe Consolidado de Monitoreo a la Gestión en ESPAÑOL formal (Perú), con tildes y ñ, sin anglicismos, sin emojis, y SIN inventar datos: usa EXCLUSIVAMENTE los indicadores del payload.

Especialista: ${payload.especialista.nombre} (${payload.especialista.cargo})
Fecha del Informe: ${payload.fechaInforme}
Periodo: ${payload.periodo}
Número de Directores Monitoreados: ${payload.n_directores}
Directores y CETPROs: ${JSON.stringify(payload.directores)}
Cumplimiento por Aspecto: ${JSON.stringify(payload.cumplimiento_por_aspecto)}
Cumplimiento por Órgano: ${JSON.stringify(payload.cumplimiento_por_organo)}
Detalle de Cumplimiento por Ítems: ${JSON.stringify(payload.itemsCompletionDetailed)}

REGLAS DE REDACCIÓN Y ESTRUCTURA:
1. En la sección "antecedentes", utiliza EXACTAMENTE las bases legales vigentes para el año 2026. Usa la siguiente lista:
${ANTECEDENTES_2026.map((a, i) => `  * ${a}`).join('\n')}
2. En la sección "introduccionAnalisis", los primeros párrafos deben explicar el marco normativo de monitoreo como labor permanente (basado en: ${ANALISIS_BOILERPLATE_2026.join('\n')}).
3. Para CADA gráfico (el consolidado por aspecto, y uno por cada uno de los 4 órganos: directivo, académico, administración, bienestar y empleabilidad) debes redactar la descripción y el análisis como PROSA CONTINUA (uno a tres párrafos), SIN iniciar con las palabras "Análisis", "Comentario" ni "Conclusión" ni ningún rótulo. El texto debe describir lo que se observa en la figura (con las cifras reales del monitoreo), incluir la valoración del especialista y cerrar con la idea conclusiva, todo de forma corrida y con conectores naturales.
4. Identifica el nudo crítico principal (aspecto de menor porcentaje) y la fortaleza principal (mayor porcentaje). No repitas párrafos entre gráficos; sé muy preciso con las cifras.
5. "conclusiones": lista de conclusiones específicas (una por órgano/gráfico) + una conclusión integradora final.
6. "recomendaciones": lista priorizada de recomendaciones concretas, empezando por los aspectos con menor cumplimiento.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código, sin texto introductorio) con el esquema exacto siguiente:
{
  "asunto": "INFORME SOBRE LAS ACCIONES DE MONITOREO Y ACOMPAÑAMIENTO A LA GESTIÓN DE LAS INSTITUCIONES EDUCATIVAS DEL NIVEL...",
  "referencia": "Plan de Trabajo AGEBATP 2026",
  "antecedentes": [
    "Párrafo 1 de antecedentes...",
    "Párrafo 2 de antecedentes..."
  ],
  "introduccionAnalisis": "Párrafo introductorio general del análisis del monitoreo y su labor permanente...",
  "graficas": {
    "consolidado": { "texto": "Descripción y análisis continuo del gráfico consolidado..." },
    "organo_directivo": { "texto": "Descripción y análisis continuo de Directivo..." },
    "organo_academico": { "texto": "..." },
    "organo_administracion": { "texto": "..." },
    "organo_bienestar": { "texto": "..." }
  },
  "conclusionesTabla": [
    { "docente": "Nombre Director / IE", "nudoCritico": "Descripción del nudo crítico...", "alternativa": "Descripción de la alternativa de solución..." }
  ],
  "conclusiones": [
    "Conclusión 1...",
    "Conclusión 2..."
  ],
  "recomendaciones": [
    "Recomendación 1...",
    "Recomendación 2..."
  ]
}
Redacta íntegramente en español formal peruano; no uses palabras en inglés.`;

  if (onProgress) onProgress("Iniciando generación con IA...", 10);
  const resultStream = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  let text = '';
  for await (const chunk of resultStream.stream) {
    const chunkText = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || '');
    text += chunkText;
    if (onProgress) {
      const progressPercent = Math.min(90, 15 + Math.floor(text.length / 50));
      onProgress(`Recibiendo contenido (${text.length} caracteres)...`, progressPercent);
    }
  }

  if (onProgress) onProgress("Procesando respuesta JSON...", 90);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);

  if (onProgress) onProgress("Informe de gestión procesado exitosamente.", 100);
  return parsed;
}

function ProgresoIA({ porcentaje, estado, detail }) {
  return (
    <div style={{ margin: "16px 0", padding: "16px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#1B3A5C" }}>
        <span>{estado}</span>
        <span>{porcentaje}%</span>
      </div>
      <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${porcentaje}%`, height: "100%", background: "#CA8A04", transition: "width 0.3s ease" }} />
      </div>
      {detail && <div style={{ marginTop: 6, fontSize: 11, color: "#64748B" }}>{detail}</div>}
    </div>
  );
}

export default function WizardInformeDirector({ onClose, onSaved, initialData = null }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialData?.paso || 1);
  const [saving, setSaving] = useState(false);
  const [informeId, setInformeId] = useState(initialData?.id || null);
  const [toast, setToast] = useState(null);
  
  const chartRef = useRef(null);
  const organChartRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // ── Paso 1: Datos Generales Monitoreo ──
  const [especialistaId, setEspecialistaId] = useState(initialData?.especialistaId || '');
  const [programaSeleccionado, setProgramaSeleccionado] = useState(initialData?.programa || 'ETP');
  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState(initialData?.horaInicio || '09:00');
  const [horaFin, setHoraFin] = useState(initialData?.horaFin || '12:00');
  const [informeNumero, setInformeNumero] = useState(initialData?.informe?.numero || '');

  // ── Paso 2: Directores Monitoreados ──
  const [directores, setDirectores] = useState(initialData?.directores || []);
  const [editingDirector, setEditingDirector] = useState(null);
  const [currentDirectorIdx, setCurrentDirectorIdx] = useState(null);
  const [dirModalTab, setDirModalTab] = useState('datos');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ percent: 0, status: "", detail: "" });
  const [dirFile, setDirFile] = useState(null);

  // ── Paso 3: Informe Consolidado ──
  const [informeData, setInformeData] = useState(initialData?.informe || null);
  const [informeLoading, setInformeLoading] = useState(false);
  const [informeProgress, setInformeProgress] = useState({ percent: 0, status: "", detail: "" });
  const [exportProgress, setExportProgress] = useState(null);
  
  const [masiveLoading, setMasiveLoading] = useState(false);
  const [masiveProgress, setMasiveProgress] = useState({ percent: 0, status: "", detail: "" });
  const [linkEvidencias, setLinkEvidencias] = useState(initialData?.links?.evidenciasOnedrive || '');
  
  const [bannerDataURL, setBannerDataURL] = useState(null);

  const especialistaSeleccionado = ESPECIALISTAS_MONITOREO.find(e => e.id === especialistaId);

  useEffect(() => {
    loadImageDataURL(bannerAgebatpUrl).then(url => {
      setBannerDataURL(url);
    });
  }, []);

  const initBlankDirector = () => {
    return {
      id: `director-${Date.now()}`,
      cetpro: {
        codigoModular: '',
        nombre: '',
        distrito: '',
        ugel: '03',
        rei: '',
        fecha: fecha,
        nVisita: 1,
        horaInicio: '09:00',
        horaTermino: '12:00',
        ofertaFormativa: { AT: false, T: false, PFC: false }
      },
      monitor: {
        cargo: especialistaSeleccionado?.cargo || 'Especialista UGEL/DRE',
        nombres: especialistaSeleccionado?.nombre || '',
        dni: especialistaSeleccionado?.dni || '',
        telefono: '',
        correo: especialistaSeleccionado?.email || ''
      },
      directivo: {
        nombres: '',
        dni: '',
        condicion: 'Designado',
        nResolucion: '',
        telefono: '',
        correo: ''
      },
      inicioOferta: {
        "2026-I": { inicio: '', termino: '' },
        "2026-II": { inicio: '', termino: '' }
      },
      aspectos: {},
      recomendaciones: '',
      compromisos: '',
      firmaDirector: { nombre: '', dni: '' },
      firmaEspecialista: { nombre: especialistaSeleccionado?.nombre || '', dni: especialistaSeleccionado?.dni || '' },
      firmaDirectorDataUrl: null,
      firmaEspecialistaDataUrl: null
    };
  };

  const handleAddDirectorOpen = () => {
    setEditingDirector(initBlankDirector());
    setCurrentDirectorIdx(null);
    setDirModalTab('datos');
    setDirFile(null);
  };

  const handleEditDirectorOpen = (idx) => {
    setEditingDirector(JSON.parse(JSON.stringify(directores[idx])));
    setCurrentDirectorIdx(idx);
    setDirModalTab('datos');
    setDirFile(null);
  };

  const handleRemoveDirector = (idx) => {
    if (confirm('¿Eliminar este director del monitoreo consolidado?')) {
      setDirectores(directores.filter((_, i) => i !== idx));
    }
  };

  const handleDirectorFieldChange = (section, field, val) => {
    const updated = { ...editingDirector };
    if (section === 'directivo') {
      updated.directivo = { ...updated.directivo, [field]: val };
      if (field === 'nombres') updated.firmaDirector = { ...updated.firmaDirector, nombre: val };
      if (field === 'dni') updated.firmaDirector = { ...updated.firmaDirector, dni: val };
    } else if (section === 'cetpro') {
      updated.cetpro = { ...updated.cetpro, [field]: val };
    }
    setEditingDirector(updated);
  };

  const handleDirectorFichaUpload = async (file) => {
    setDirFile(file);
    setOcrLoading(true);
    setOcrProgress({ percent: 5, status: "Iniciando extracción...", detail: "" });
    try {
      const images = await pdfToImages(file, (status, percent) => {
        setOcrProgress({ percent: Math.floor(percent * 0.5), status, detail: "" });
      });
      const parsed = await extraerFichaDirectorConIA(images, (status, percent) => {
        setOcrProgress({ percent: 50 + Math.floor(percent * 0.5), status, detail: "" });
      });

      setEditingDirector({
        ...editingDirector,
        cetpro: { ...editingDirector.cetpro, ...parsed.cetpro },
        directivo: { ...editingDirector.directivo, ...parsed.directivo },
        inicioOferta: { ...editingDirector.inicioOferta, ...parsed.inicioOferta },
        aspectos: parsed.aspectos || {},
        recomendaciones: parsed.recomendaciones || '',
        compromisos: parsed.compromisos || '',
        firmaDirector: {
          nombre: parsed.directivo?.nombres || '',
          dni: parsed.directivo?.dni || ''
        }
      });
      showToast('Ficha de gestión procesada por IA exitosamente.');
      setDirModalTab('ficha');
    } catch (err) {
      console.error(err);
      showToast(`Error de procesamiento: ${err.message}`, 'error');
    }
    setOcrLoading(false);
  };

  const handleCargaMasivaUpload = async (file) => {
    setMasiveLoading(true);
    setMasiveProgress({ percent: 5, status: "Iniciando extracción masiva...", detail: "" });
    try {
      const images = await pdfToImages(file, (status, percent) => {
        setMasiveProgress({ percent: Math.floor(percent * 0.4), status, detail: "" });
      });

      const totalPages = images.length;
      let pagesPerSheet = 5;
      if (totalPages % 5 === 0) {
        pagesPerSheet = 5;
      } else if (totalPages % 4 === 0) {
        pagesPerSheet = 4;
      } else if (totalPages % 6 === 0) {
        pagesPerSheet = 6;
      }

      const numSheets = Math.ceil(totalPages / pagesPerSheet);
      const parsedArray = [];

      for (let s = 0; s < numSheets; s++) {
        const startIdx = s * pagesPerSheet;
        const endIdx = Math.min(startIdx + pagesPerSheet, totalPages);
        const sheetImages = images.slice(startIdx, endIdx);

        const currentPct = 40 + Math.floor((s / numSheets) * 55);
        setMasiveProgress({
          percent: currentPct,
          status: `Procesando Ficha ${s + 1} de ${numSheets}...`,
          detail: `Páginas ${startIdx + 1} a ${endIdx}`
        });

        try {
          const parsed = await extraerFichaDirectorConIA(sheetImages);
          if (parsed && (parsed.cetpro || parsed.directivo)) {
            parsedArray.push(parsed);
          }
        } catch (sheetErr) {
          console.error(`Error al procesar la ficha ${s + 1}:`, sheetErr);
          showToast(`Error en ficha ${s + 1}: ${sheetErr.message}`, 'error');
        }
      }

      if (parsedArray.length > 0) {
        const list = [...directores];
        parsedArray.forEach((parsed, idx) => {
          const newDir = {
            id: `director-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            cetpro: {
              codigoModular: parsed.cetpro?.codigoModular || '',
              nombre: parsed.cetpro?.nombre || '',
              distrito: parsed.cetpro?.distrito || '',
              ugel: parsed.cetpro?.ugel || '03',
              rei: parsed.cetpro?.rei || '',
              fecha: parsed.cetpro?.fecha || fecha,
              nVisita: parsed.cetpro?.nVisita || 1,
              horaInicio: parsed.cetpro?.horaInicio || '09:00',
              horaTermino: parsed.cetpro?.horaTermino || '12:00',
              ofertaFormativa: parsed.cetpro?.ofertaFormativa || { AT: false, T: false, PFC: false }
            },
            monitor: {
              cargo: especialistaSeleccionado?.cargo || 'Especialista UGEL/DRE',
              nombres: especialistaSeleccionado?.nombre || '',
              dni: especialistaSeleccionado?.dni || '',
              telefono: '',
              correo: especialistaSeleccionado?.email || ''
            },
            directivo: {
              nombres: parsed.directivo?.nombres || '',
              dni: parsed.directivo?.dni || '',
              condicion: parsed.directivo?.condicion || 'Designado',
              nResolucion: parsed.directivo?.nResolucion || '',
              telefono: parsed.directivo?.telefono || '',
              correo: parsed.directivo?.correo || ''
            },
            inicioOferta: parsed.inicioOferta || {
              "2026-I": { inicio: '', termino: '' },
              "2026-II": { inicio: '', termino: '' }
            },
            aspectos: parsed.aspectos || {},
            recomendaciones: parsed.recomendaciones || '',
            compromisos: parsed.compromisos || '',
            firmaDirector: {
              nombre: parsed.directivo?.nombres || '',
              dni: parsed.directivo?.dni || ''
            },
            firmaEspecialista: {
              nombre: especialistaSeleccionado?.nombre || '',
              dni: especialistaSeleccionado?.dni || ''
            },
            firmaDirectorDataUrl: null,
            firmaEspecialistaDataUrl: null
          };
          list.push(newDir);
        });
        setDirectores(list);
        setMasiveProgress({ percent: 100, status: "Carga masiva completada", detail: "" });
        showToast(`Carga masiva completada: ${parsedArray.length} directores agregados.`);
      } else {
        showToast('No se pudo extraer ninguna ficha de forma válida.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(`Error en carga masiva: ${err.message}`, 'error');
    }
    setMasiveLoading(false);
  };

  const handleSaveDirectorInList = () => {
    if (!editingDirector.directivo?.nombres || !editingDirector.directivo.nombres.trim()) {
      showToast('Por favor ingrese el nombre del director.', 'error');
      return;
    }
    if (!editingDirector.cetpro?.nombre || !editingDirector.cetpro.nombre.trim()) {
      showToast('Por favor ingrese el nombre del CETPRO/CEBA.', 'error');
      return;
    }
    const list = [...directores];
    if (currentDirectorIdx !== null) {
      list[currentDirectorIdx] = editingDirector;
    } else {
      list.push(editingDirector);
    }
    setDirectores(list);
    setEditingDirector(null);
    setCurrentDirectorIdx(null);
    showToast('Director guardado en el consolidado.');
  };

  // Calculate compliance statistics for Recharts and IA report
  const aspectStats = useMemo(() => {
    if (directores.length === 0) return [];
    
    // For each aspect group (01 - 08)
    const statsList = FICHA_GESTION_ITEMS.map((aspGroup, idx) => {
      const aspKey = String(idx + 1).padStart(2, '0');
      let totalItems = 0;
      let totalSi = 0;

      directores.forEach(d => {
        const uAns = Array.isArray(d.aspectos?.[aspKey]) ? d.aspectos[aspKey] : [];
        aspGroup.items.forEach(item => {
          const ans = uAns.find(a => a.item === item.num);
          if (ans) {
            totalItems++;
            if (ans.si === true) totalSi++;
          }
        });
      });

      const pct = totalItems > 0 ? Math.round((totalSi / totalItems) * 100) : 0;
      return {
        code: `Asp. ${aspKey}`,
        name: aspGroup.aspecto,
        cumplimiento: pct,
        displayName: aspGroup.aspecto
      };
    });

    // Sort descendently by cumplimiento
    return statsList.sort((a, b) => b.cumplimiento - a.cumplimiento);
  }, [directores]);

  const aspectItemStats = useMemo(() => {
    if (directores.length === 0) return [];
    
    return FICHA_GESTION_ITEMS.map((aspGroup, idx) => {
      const aspKey = String(idx + 1).padStart(2, '0');
      
      const itemsData = aspGroup.items.map(item => {
        let totalCount = 0;
        let siCount = 0;
        
        directores.forEach(d => {
          const uAns = Array.isArray(d.aspectos?.[aspKey]) ? d.aspectos[aspKey] : [];
          const ans = uAns.find(a => a.item === item.num);
          if (ans) {
            totalCount++;
            if (ans.si === true) siCount++;
          }
        });
        
        const pct = totalCount > 0 ? Math.round((siCount / totalCount) * 100) : 0;
        return {
          num: item.num,
          name: `Ítem ${item.num}`,
          cumplimiento: pct,
          texto: item.texto
        };
      });
      
      return {
        aspectName: aspGroup.aspecto,
        itemsData
      };
    });
  }, [directores]);

  const organChartsStats = useMemo(() => {
    if (aspectStats.length === 0) return [];
    const findAspect = (code) => aspectStats.find(a => a.code === code) || { code, name: '', cumplimiento: 0 };
    return [
      {
        organo: "Órgano Directivo",
        sigla: "V",
        data: [findAspect("Asp. 01"), findAspect("Asp. 02")]
      },
      {
        organo: "Órgano Académico",
        sigla: "VI",
        data: [findAspect("Asp. 03"), findAspect("Asp. 04"), findAspect("Asp. 05")]
      },
      {
        organo: "Órgano de Administración",
        sigla: "VII",
        data: [findAspect("Asp. 06")]
      },
      {
        organo: "Órgano de Bienestar y Empleabilidad",
        sigla: "VIII",
        data: [findAspect("Asp. 07"), findAspect("Asp. 08")]
      }
    ];
  }, [aspectStats]);

  const handleGenerarInforme = async () => {
    setInformeLoading(true);
    setInformeProgress({ percent: 5, status: "Analizando fichas y generando informe...", detail: "" });
    try {
      const dateVal = new Date(fecha);
      const isInvalid = isNaN(dateVal.getTime());
      const monthStr = !isInvalid ? monthNames[dateVal.getMonth()] : '';
      const yearStr = !isInvalid ? dateVal.getFullYear() : '';

      const payload = {
        periodo: `${monthStr} ${yearStr}`.toLowerCase(),
        fechaInforme: fecha,
        especialista: { nombre: especialistaSeleccionado.nombre, cargo: especialistaSeleccionado.cargo },
        n_directores: directores.length,
        directores: directores.map(d => ({
          director: d.directivo.nombres,
          institucion: d.cetpro.nombre,
          codigoModular: d.cetpro.codigoModular,
          compromisos: d.compromisos,
          recomendaciones: d.recomendaciones
        })),
        cumplimiento_por_aspecto: aspectStats.reduce((acc, stat) => {
          const cleanName = stat.displayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
          const cleanCode = stat.code.toLowerCase().replace(/[^a-z0-9]/g, "");
          acc[`${cleanCode}_${cleanName}`] = stat.cumplimiento;
          return acc;
        }, {}),
        cumplimiento_por_organo: organChartsStats.reduce((acc, org) => {
          const sum = org.data.reduce((s, a) => s + a.cumplimiento, 0);
          const avg = org.data.length > 0 ? Math.round(sum / org.data.length) : 0;
          const cleanKey = org.organo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
          acc[cleanKey] = avg;
          return acc;
        }, {}),
        itemsCompletionDetailed: aspectItemStats.map(asp => ({
          aspecto: asp.aspectName,
          items: asp.itemsData.map(it => `Ítem ${it.num}: ${it.cumplimiento}% de cumplimiento (${it.texto.substring(0, 50)}...)`)
        }))
      };

      const data = await generarInformeDirectorIA(payload, (status, percent) => {
        setInformeProgress({ percent, status, detail: "" });
      });

      setInformeData(data);
      showToast('Informe consolidado de gestión generado.');
    } catch (err) {
      console.error(err);
      showToast(`Error al generar: ${err.message}`, 'error');
    }
    setInformeLoading(false);
  };

  const saveDraft = async (statusOverride = null) => {
    setSaving(true);
    try {
      const dataToSave = {
        tipoMonitoreo: 'director',
        programa: programaSeleccionado,
        tipo: 'consolidado_ie',
        especialistaId: especialistaSeleccionado?.id || '',
        especialistaNombre: especialistaSeleccionado?.nombre || '',
        especialistaCargo: especialistaSeleccionado?.cargo || '',
        jefaturaNombre: JEFATURA_AGEBATP.nombre,
        jefaturaCargo: JEFATURA_AGEBATP.cargo,
        institucionTipo: programaSeleccionado === 'ETP' ? 'CETPRO' : 'CEBA',
        institucionNombre: directores.map(d => d.cetpro.nombre).join(', '),
        fecha,
        horaInicio,
        horaFin,
        directores,
        informe: informeData || null,
        links: { evidenciasOnedrive: linkEvidencias || '' },
        estado: statusOverride || (initialData?.estado === 'finalizado' ? 'finalizado' : (informeData ? 'generado' : 'borrador')),
        creadoPor: user?.uid || '',
        paso: step,
        updatedAt: new Date().toISOString()
      };

      if (informeId) {
        await updateInformeMonitoreo(informeId, dataToSave);
      } else {
        const newId = await addInformeMonitoreo(dataToSave);
        setInformeId(newId);
      }
    } catch (err) {
      console.error('Error al guardar borrador:', err);
    }
    setSaving(false);
  };

  useEffect(() => {
    if (step > 1 && especialistaSeleccionado) {
      saveDraft();
    }
  }, [step]);

  const handleExportFichaPDF = (dirItem) => {
    try {
      generarFichaGestionPDF(dirItem, bannerDataURL);
      showToast(`Ficha de gestión de ${dirItem.directivo.nombres} descargada.`);
    } catch (err) {
      showToast(`Error al exportar ficha: ${err.message}`, 'error');
    }
  };

  const handleExportInformePDF = async () => {
    if (!informeData) return;
    try {
      setExportProgress("Generando gráfico consolidado por aspecto de gestión...");
      let chartImgBase64 = null;
      if (chartRef.current) {
        try {
          const canvas = await Promise.race([
            html2canvas(chartRef.current, { scale: 2, useCORS: true, logging: false, allowTaint: true }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
          ]);
          chartImgBase64 = canvas.toDataURL('image/png');
        } catch (chartErr) {
          console.error("Error or timeout capturing main chart:", chartErr);
        }
      }

      const aspectChartImages = [];
      for (let i = 0; i < 4; i++) {
        setExportProgress(`Renderizando y adaptando gráfico de órgano N°${i + 1} de 4...`);
        const ref = organChartRefs[i];
        if (ref && ref.current) {
          try {
            const canvas = await Promise.race([
              html2canvas(ref.current, { scale: 2, useCORS: true, logging: false, allowTaint: true }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
            ]);
            aspectChartImages.push(canvas.toDataURL('image/png'));
          } catch (chartErr) {
            console.error(`Error or timeout capturing chart ${i}:`, chartErr);
            aspectChartImages.push(null);
          }
        } else {
          aspectChartImages.push(null);
        }
      }

      setExportProgress("Procesando información e incrustando tipografía Arial MT...");
      const tablaInstituciones = directores.map((d, idx) => ({
        n: (idx + 1).toString(),
        monitoreo: `Monitoreo, supervisión y acompañamiento a la gestión del directivo ${d.directivo.nombres}`,
        inst: `${programaSeleccionado === 'ETP' ? 'CETPRO' : 'CEBA'} "${d.cetpro.nombre}"`
      }));

      const payload = {
        numero: informeNumero,
        destinatario: { nombre: JEFATURA_AGEBATP.nombre, cargo: JEFATURA_AGEBATP.cargo },
        remitente: { 
          nombre: especialistaSeleccionado?.nombre || initialData?.especialistaNombre || 'ESPECIALISTA MONITOR', 
          cargo: especialistaSeleccionado?.cargo || initialData?.especialistaCargo || 'Especialista de Educación Básica Alternativa' 
        },
        fecha: new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
        mes: monthNames[new Date().getMonth()].toLowerCase(),
        anio: new Date().getFullYear().toString(),
        programa: programaSeleccionado,
        directores,
        conclusionesTabla: informeData.conclusionesTabla || [],
        conclusiones: informeData.conclusiones || [],
        linkEvidencias: linkEvidencias ? { texto: "Evidencias de Gestión", url: linkEvidencias } : null,
        asunto: informeData.asunto || `INFORME DE MONITOREO Y ACOMPAÑAMIENTO A LA GESTIÓN DE INSTITUCIONES EDUCATIVAS`,
        referencia: informeData.referencia || 'Plan de Trabajo AGEBATP 2026',
        antecedentes: informeData.antecedentes || [],
        parrafoAplicacion: `Que, en el marco de las visitas de monitoreo de gestión directiva, se aplicó la ficha de monitoreo a ${directores.length} directores de las siguientes instituciones:`,
        tablaInstituciones,
        introduccionAnalisis: informeData.introduccionAnalisis || '',
        graficas: informeData.graficas || {},
        recomendaciones: informeData.recomendaciones || []
      };

      setExportProgress("Compilando estructura y descargando PDF consolidado de gestión...");
      generarInformeDirectorPDF(payload, bannerDataURL, null, chartImgBase64, aspectChartImages);
      showToast('Informe consolidado descargado exitosamente.');
    } catch (err) {
      showToast(`Error al exportar informe: ${err.message}`, 'error');
    } finally {
      setExportProgress(null);
    }
  };

  const handleFinalizarMonitoreo = async () => {
    await saveDraft('finalizado');
    showToast('Monitoreo finalizado y guardado exitosamente.');
    if (onSaved) onSaved();
    onClose();
  };

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
    btn: (bg, color, border) => ({ padding: "10px 20px", borderRadius: 8, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.15s" }),
    textarea: { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.g50, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 12.5, minHeight: 180, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 },
    stepIndicator: (active, completed) => ({
      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: completed ? C.green : active ? C.gold2 : C.g200,
      color: completed || active ? C.white : C.g500,
      fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", transition: 'all 0.2s'
    }),
  };

  const STEPS = [
    { n: 1, label: 'Datos Gestión' },
    { n: 2, label: 'Directores Monitoreados' },
    { n: 3, label: 'Informe Consolidado' }
  ];

  const canGoNext = () => {
    if (step === 1) return especialistaSeleccionado && fecha;
    if (step === 2) return directores.length > 0;
    return false;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", overflow: "auto" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "'DM Serif Display',serif", color: C.navy1 }}>
              Nuevo Monitoreo Consolidado de Gestión — {programaSeleccionado || 'AGEBATP'}
            </h2>
            {saving && <span style={{ fontSize: 11, color: C.g400 }}>Guardando borrador...</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.g500, padding: 4, display: 'flex', alignItems: 'center' }}><Icon name="x" size={20} /></button>
        </div>

        {/* Stepper */}
        <div style={{ padding: "20px 28px", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={S.stepIndicator(step === s.n, step > s.n)}>
                {step > s.n ? <Icon name="check" size={14} color={C.white} /> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? C.navy1 : C.g500, fontFamily: "'DM Sans'" }}>{s.label}</span>
              {i < STEPS.length - 1 && <div style={{ width: 30, height: 2, background: step > s.n ? C.green : C.g200, borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "0 28px 28px" }}>
          
          {/* PASO 1 */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>Paso 1 — Datos de Monitoreo de Gestión</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={S.label}>Especialista pedagógico / monitor *</label>
                  <select value={especialistaId} onChange={e => setEspecialistaId(e.target.value)} style={S.input}>
                    <option value="">Seleccione especialista...</option>
                    {ESPECIALISTAS_MONITOREO.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre} — {esp.cargo.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={S.label}>Modalidad *</label>
                  <select value={programaSeleccionado} onChange={e => setProgramaSeleccionado(e.target.value)} style={S.input}>
                    <option value="ETP">ETP (CETPRO)</option>
                    <option value="EBA">EBA (CEBA)</option>
                  </select>
                </div>

                <div>
                  <label style={S.label}>Fecha del Informe *</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={S.input} />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
                Paso 2 — Directores y Gestión Monitoreada
              </h3>
              <p style={{ color: C.g500, fontSize: "0.82rem", marginBottom: 20 }}>
                Agregue los directores de las I.E. que han sido monitoreados en su gestión. Suba la ficha en PDF para extraer datos mediante OCR o rellénela manualmente.
              </p>

              {directores.length === 0 ? (
                <div style={{ padding: 40, border: `2px dashed ${C.g200}`, borderRadius: 10, textAlign: 'center', background: C.g50 }}>
                  <Icon name="folder" size={40} color={C.g300} style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13, color: C.g500, margin: '0 0 16px' }}>No hay directores registrados aún.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button type="button" onClick={handleAddDirectorOpen} style={S.btn(C.gold2, C.white, C.gold1)}>
                      + Agregar Director Monitoreado
                    </button>
                    <button type="button" onClick={() => document.getElementById('masive-file-input')?.click()} style={S.btn(C.navy4, C.white, C.navy5)}>
                      <Icon name="upload" size={14} /> Carga Masiva (PDF con varias fichas)
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 20 }}>
                    {directores.map((d, idx) => (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: '12px 18px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy1 }}>{d.directivo?.nombres || 'Director sin nombre'}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.g500 }}>
                            CETPRO/CEBA: {d.cetpro?.nombre || '—'} | DNI: {d.directivo?.dni || '—'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => handleExportFichaPDF(d)} style={S.btn(C.white, C.navy3, C.g200)}>
                            <Icon name="download" size={12} /> Ficha PDF
                          </button>
                          <button type="button" onClick={() => handleEditDirectorOpen(idx)} style={S.btn(C.white, C.navy3, C.g200)}>
                            Editar
                          </button>
                          <button type="button" onClick={() => handleRemoveDirector(idx)} style={S.btn(C.redBg, C.red, C.redBorder)}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" onClick={handleAddDirectorOpen} style={S.btn(C.gold2, C.white, C.gold1)}>
                      + Agregar Otro Director
                    </button>
                    <button type="button" onClick={() => document.getElementById('masive-file-input')?.click()} style={S.btn(C.navy4, C.white, C.navy5)}>
                      <Icon name="upload" size={14} /> Carga Masiva (PDF con varias fichas)
                    </button>
                  </div>
                </div>
              )}

              <input id="masive-file-input" type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleCargaMasivaUpload(e.target.files[0]); }} />

              {masiveLoading && (
                <div style={{ marginTop: 16 }}>
                  <ProgresoIA porcentaje={masiveProgress.percent} estado={masiveProgress.status} detail={masiveProgress.detail} />
                </div>
              )}

              {/* Edit/Add Modal */}
              {editingDirector && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <div style={{ background: C.white, borderRadius: 12, width: '100%', maxWidth: 750, maxHeight: '90vh', overflow: 'auto', padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.g200}`, paddingBottom: 12, marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy3 }}>
                        {currentDirectorIdx !== null ? 'Editar Ficha del Director' : 'Registrar Nuevo Director'}
                      </h4>
                      <button type="button" onClick={() => setEditingDirector(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.g500 }}><Icon name="x" size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: `1px solid ${C.g200}`, paddingBottom: 8 }}>
                      {['datos', 'ficha', 'ocr'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setDirModalTab(tab)}
                          style={{
                            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none',
                            background: dirModalTab === tab ? C.gold2 : 'transparent',
                            color: dirModalTab === tab ? C.white : C.g500,
                            cursor: 'pointer'
                          }}
                        >
                          {tab === 'datos' ? '1. Datos Directivo / IE' : tab === 'ficha' ? '2. Ficha de Gestión' : '3. Cargar PDF (OCR)'}
                        </button>
                      ))}
                    </div>

                    {dirModalTab === 'datos' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={S.label}>Nombre del Director *</label>
                            <input value={editingDirector.directivo?.nombres || ''} onChange={e => handleDirectorFieldChange('directivo', 'nombres', e.target.value)} style={S.input} placeholder="Nombres del director..." />
                          </div>
                          <div>
                            <label style={S.label}>DNI Director *</label>
                            <input value={editingDirector.directivo?.dni || ''} onChange={e => handleDirectorFieldChange('directivo', 'dni', e.target.value)} style={S.input} maxLength={8} placeholder="8 dígitos..." />
                          </div>
                          <div>
                            <label style={S.label}>Nombre CETPRO/CEBA *</label>
                            <input value={editingDirector.cetpro?.nombre || ''} onChange={e => handleDirectorFieldChange('cetpro', 'nombre', e.target.value)} style={S.input} placeholder="Nombre de la IE..." />
                          </div>
                          <div>
                            <label style={S.label}>Código Modular *</label>
                            <input value={editingDirector.cetpro?.codigoModular || ''} onChange={e => handleDirectorFieldChange('cetpro', 'codigoModular', e.target.value)} style={S.input} placeholder="7 dígitos modular..." />
                          </div>
                          <div>
                            <label style={S.label}>Condición del Directivo</label>
                            <select value={editingDirector.directivo?.condicion || 'Designado'} onChange={e => handleDirectorFieldChange('directivo', 'condicion', e.target.value)} style={S.input}>
                              <option value="Designado">Designado</option>
                              <option value="Encargado">Encargado</option>
                              <option value="Encargado por funciones">Encargado por funciones</option>
                            </select>
                          </div>
                          <div>
                            <label style={S.label}>Resolución de Encargatura</label>
                            <input value={editingDirector.directivo?.nResolucion || ''} onChange={e => handleDirectorFieldChange('directivo', 'nResolucion', e.target.value)} style={S.input} placeholder="N° de R.D..." />
                          </div>
                        </div>
                      </div>
                    )}

                    {dirModalTab === 'ficha' && (
                      <div style={{ maxHeight: '55vh', overflow: 'auto', paddingRight: 10 }}>
                        <FichaGestionDigitalForm data={editingDirector} onChange={setEditingDirector} />

                        <div style={{ marginTop: 20 }}>
                          <label style={S.label}>Recomendaciones o Sugerencias</label>
                          <textarea value={editingDirector.recomendaciones || ''} onChange={e => setEditingDirector({ ...editingDirector, recomendaciones: e.target.value })} style={{ ...S.textarea, minHeight: 80 }} placeholder="Escriba recomendaciones específicas de la visita..." />
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <label style={S.label}>Compromisos</label>
                          <textarea value={editingDirector.compromisos || ''} onChange={e => setEditingDirector({ ...editingDirector, compromisos: e.target.value })} style={{ ...S.textarea, minHeight: 80 }} placeholder="Escriba compromisos firmados..." />
                        </div>

                        {/* Signature canvases */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                          <FirmaDigital
                            value={editingDirector.firmaEspecialistaDataUrl}
                            onChange={(val) => setEditingDirector({ ...editingDirector, firmaEspecialistaDataUrl: val })}
                            label="Firma Táctil Especialista Monitor"
                          />
                          <FirmaDigital
                            value={editingDirector.firmaDirectorDataUrl}
                            onChange={(val) => setEditingDirector({ ...editingDirector, firmaDirectorDataUrl: val })}
                            label="Firma Táctil del Director/a"
                          />
                        </div>
                      </div>
                    )}

                    {dirModalTab === 'ocr' && (
                      <div>
                        <div style={{ border: `2px dashed ${ocrLoading ? C.gold2 : C.g300}`, borderRadius: 10, padding: "30px 20px", textAlign: "center", background: ocrLoading ? `${C.gold2}08` : C.g50, cursor: ocrLoading ? "wait" : "pointer", marginBottom: 16 }}
                          onClick={() => !ocrLoading && document.getElementById('dir-file-input')?.click()}>
                          <Icon name="upload" size={28} color={ocrLoading ? C.gold2 : C.g400} />
                          <p style={{ color: C.g500, fontSize: "0.85rem", margin: "10px 0 0" }}>
                            {ocrLoading ? "Procesando OCR por IA..." : dirFile ? <><Icon name="check" size={12} color={C.green} /> {dirFile.name}</> : "Subir ficha escaneada de Gestión (PDF/imagen) para este director"}
                          </p>
                          <input id="dir-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                            onChange={e => { if (e.target.files[0]) handleDirectorFichaUpload(e.target.files[0]); }} />
                        </div>
                        {ocrLoading && (
                          <ProgresoIA porcentaje={ocrProgress.percent} estado={ocrProgress.status} detail={ocrProgress.detail} />
                        )}
                      </div>
                    )}

                    <div style={{ borderTop: `1px solid ${C.g200}`, paddingTop: 16, marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button type="button" onClick={() => setEditingDirector(null)} style={S.btn(C.white, C.g500, C.g300)}>
                        Cancelar
                      </button>
                      <button type="button" onClick={handleSaveDirectorInList} style={S.btn(C.gold2, C.white, C.gold1)}>
                        Guardar Ficha
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>
                Paso 3 — Generación de Informe Consolidado de Gestión
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Número de Documento (Correlativo) *</label>
                  <input value={informeNumero} onChange={e => setInformeNumero(e.target.value)} style={S.input} placeholder="Ej: 0026" />
                </div>
                <div>
                  <label style={S.label}>Enlace OneDrive de Evidencias</label>
                  <input value={linkEvidencias} onChange={e => setLinkEvidencias(e.target.value)} style={S.input} placeholder="https://onedrive.live.com/..." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button onClick={handleGenerarInforme} disabled={informeLoading} style={S.btn(C.navy4, C.white, C.navy5)}>
                  {informeLoading ? 'Generando Informe...' : 'Generar Informe con IA'}
                </button>
              </div>

              {informeLoading && <ProgresoIA porcentaje={informeProgress.percent} estado={informeProgress.status} />}

              {/* Graphic compliance preview container */}
              <div style={{ margin: "24px 0" }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Cumplimiento Consolidado por Aspecto de Gestión</h4>
                <div ref={chartRef} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 10, padding: 20, width: "100%", maxWidth: 600, marginBottom: 24 }}>
                  <div style={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aspectStats} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis dataKey="code" type="category" tick={{ fontSize: 10 }} width={60} />
                        <Tooltip formatter={(value, name, props) => [`${value}%`, props.payload.name]} />
                        <Bar dataKey="cumplimiento" fill="#CA8A04" name="% Cumplimiento" isAnimationActive={false}>
                          <LabelList dataKey="cumplimiento" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#333', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ fontSize: 9, color: C.g500, textAlign: "center", margin: "8px 0 12px" }}>Fuente: Fichas de Monitoreo a la Gestión 2026</p>
                  
                  {/* Legend Table for Codes mapping to Aspect Names */}
                  <div style={{ marginTop: 12, borderTop: `1px solid ${C.g200}`, paddingTop: 10 }}>
                    <table style={{ width: "100%", fontSize: 10, color: C.navy3, borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.g200}`, fontWeight: "bold" }}>
                          <th style={{ padding: "4px 8px" }}>Código</th>
                          <th style={{ padding: "4px 8px" }}>Aspecto de Gestión Directiva</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aspectStats.map(stat => (
                          <tr key={stat.code} style={{ borderBottom: `1px dashed ${C.g100}` }}>
                            <td style={{ padding: "4px 8px", fontWeight: "bold" }}>{stat.code}</td>
                            <td style={{ padding: "4px 8px" }}>{stat.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Detalle de Cumplimiento por Órgano Directivo</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {organChartsStats.map((org, idx) => (
                    <div key={org.organo} ref={organChartRefs[idx]} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 10, padding: 12 }}>
                      <h5 style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: C.navy3 }}>{org.sigla}. {org.organo}</h5>
                      <div style={{ height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={org.data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} unit="%" />
                            <YAxis dataKey="code" type="category" tick={{ fontSize: 9 }} width={55} />
                            <Tooltip formatter={(value, name, props) => [`${value}%`, props.payload.name]} />
                            <Bar dataKey="cumplimiento" fill="#2563A0" name="% Cumplimiento" isAnimationActive={false}>
                              <LabelList dataKey="cumplimiento" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 9, fill: '#333', fontWeight: 'bold' }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Previsualización Editable */}
              {informeData && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Previsualización del Informe de Gestión</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={S.label}>Asunto</label>
                      <input value={informeData.asunto || ''} onChange={e => setInformeData({ ...informeData, asunto: e.target.value })} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Antecedentes (párrafo consolidado)</label>
                      <textarea value={informeData.antecedentes?.join('\n') || ''} onChange={e => setInformeData({ ...informeData, antecedentes: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 120 }} />
                    </div>
                    <div>
                      <label style={S.label}>Introducción del Análisis (Monitoreo permanente)</label>
                      <textarea value={informeData.introduccionAnalisis || ''} onChange={e => setInformeData({ ...informeData, introduccionAnalisis: e.target.value })} style={{ ...S.textarea, minHeight: 120 }} />
                    </div>

                    {/* Editable Analysis & Conclusions for the 5 Charts */}
                    <div style={{ border: `1px solid ${C.g200}`, borderRadius: 10, padding: 14, background: C.g50, marginTop: 8, marginBottom: 8 }}>
                      <h5 style={{ fontSize: 12, fontWeight: 700, color: C.navy3, margin: "0 0 10px" }}>Análisis, Comentario y Conclusión por Gráfico (Regla de Oro)</h5>
                      {(() => {
                        const chartKeys = [
                          'consolidado', 'organo_directivo', 'organo_academico', 'organo_administracion', 'organo_bienestar'
                        ];
                        const labels = [
                          "Gráfico N°01: Cumplimiento Consolidado por Aspecto de Gestión",
                          "Gráfico N°02: Órgano Directivo (Aspectos 01 y 02)",
                          "Gráfico N°03: Órgano Académico (Aspectos 03, 04 y 05)",
                          "Gráfico N°04: Órgano de Administración (Aspecto 06)",
                          "Gráfico N°05: Órgano de Bienestar y Empleabilidad (Aspectos 07 y 08)"
                        ];
                        return chartKeys.map((key, idx) => (
                          <div key={key} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: C.navy2, marginBottom: 6 }}>{labels[idx]}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div>
                                <label style={{ ...S.label, textTransform: 'none', fontSize: 10, marginBottom: 2 }}>Análisis descriptivo y valoración del especialista (Prosa continua)</label>
                                <textarea 
                                  value={informeData.graficas?.[key]?.texto || [informeData.graficas?.[key]?.analisis, informeData.graficas?.[key]?.comentario, informeData.graficas?.[key]?.conclusion].filter(Boolean).join(' ')} 
                                  onChange={e => {
                                    const updatedGraficas = { ...informeData.graficas };
                                    if (!updatedGraficas[key]) updatedGraficas[key] = {};
                                    updatedGraficas[key].texto = e.target.value;
                                    // Clear deprecated fields to avoid payload bloating
                                    delete updatedGraficas[key].analisis;
                                    delete updatedGraficas[key].comentario;
                                    delete updatedGraficas[key].conclusion;
                                    setInformeData({ ...informeData, graficas: updatedGraficas });
                                  }} 
                                  style={{ ...S.textarea, minHeight: 90, fontSize: 12, padding: "6px 10px" }} 
                                />
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <div>
                      <label style={S.label}>Nudos Críticos y Alternativas de Solución (Tabla de Conclusiones)</label>
                      {(informeData.conclusionesTabla || []).map((item, idx) => (
                        <div key={idx} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                            <div>
                              <label style={{ ...S.label, textTransform: 'none', fontSize: 10 }}>IE / Director</label>
                              <input 
                                value={item.docente || ''} 
                                onChange={e => {
                                  const list = [...informeData.conclusionesTabla];
                                  list[idx].docente = e.target.value;
                                  setInformeData({ ...informeData, conclusionesTabla: list });
                                }} 
                                style={S.input} 
                              />
                            </div>
                            <div>
                              <label style={{ ...S.label, textTransform: 'none', fontSize: 10 }}>Nudo Crítico</label>
                              <textarea 
                                value={item.nudoCritico || ''} 
                                onChange={e => {
                                  const list = [...informeData.conclusionesTabla];
                                  list[idx].nudoCritico = e.target.value;
                                  setInformeData({ ...informeData, conclusionesTabla: list });
                                }} 
                                style={{ ...S.textarea, minHeight: 60, padding: "6px 10px" }} 
                              />
                            </div>
                            <div>
                              <label style={{ ...S.label, textTransform: 'none', fontSize: 10 }}>Alternativa de Solución</label>
                              <textarea 
                                value={item.alternativa || ''} 
                                onChange={e => {
                                  const list = [...informeData.conclusionesTabla];
                                  list[idx].alternativa = e.target.value;
                                  setInformeData({ ...informeData, conclusionesTabla: list });
                                }} 
                                style={{ ...S.textarea, minHeight: 60, padding: "6px 10px" }} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={S.label}>Conclusiones Numeradas (una por órgano/gráfico + integradora)</label>
                      <textarea 
                        value={informeData.conclusiones?.join('\n') || ''} 
                        onChange={e => setInformeData({ ...informeData, conclusiones: e.target.value.split('\n') })} 
                        style={{ ...S.textarea, minHeight: 120 }} 
                      />
                    </div>

                    <div>
                      <label style={S.label}>Recomendaciones</label>
                      <textarea 
                        value={informeData.recomendaciones?.join('\n') || ''} 
                        onChange={e => setInformeData({ ...informeData, recomendaciones: e.target.value.split('\n') })} 
                        style={{ ...S.textarea, minHeight: 120 }} 
                      />
                    </div>
                    <button type="button" onClick={handleExportInformePDF} style={S.btn(C.green, C.white, C.green)}>
                      <Icon name="download" size={14} /> Descargar Informe de Gestión (PDF)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div style={{ padding: "20px 28px", borderTop: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", sticky: "bottom", background: C.white }}>
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1} 
            style={S.btn(C.white, step === 1 ? C.g300 : C.navy4, step === 1 ? C.g200 : C.navy5)}
          >
            Atrás
          </button>
          
          {step < STEPS.length ? (
            <button 
              onClick={() => { saveDraft(); setStep(step + 1); }} 
              disabled={!canGoNext()} 
              style={{ ...S.btn(canGoNext() ? C.gold2 : C.g200, canGoNext() ? C.white : C.g500, canGoNext() ? C.gold2 : C.g200) }}
            >
              Siguiente
            </button>
          ) : (
            <button 
              onClick={handleFinalizarMonitoreo} 
              style={S.btn(C.green, C.white, C.green)}
            >
              Finalizar y Guardar
            </button>
          )}
        </div>
      </div>

      {exportProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12, 25, 41, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: 16,
            padding: '32px 40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center',
            maxWidth: 420,
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: `4px solid ${C.g200}`,
              borderTop: `4px solid ${C.navy5}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: C.navy1, margin: 0 }}>
              Preparando Descarga PDF
            </h4>
            <p style={{ fontSize: 13, color: C.g500, margin: 0, lineHeight: 1.5 }}>
              {exportProgress}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
