import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';
import FirmaDigital from './FirmaDigital';
import FichaDigitalForm from './FichaDigitalForm';
import FichaDigitalFormETP from './FichaDigitalFormETP';
import { generarFichaPDF } from '../pdf/generarFichaPDF';
import { generarFichaETPPDF } from '../pdf/generarFichaETPPDF';
import { generarInformePDF } from '../pdf/generarInformePDF';
import { generarOficioPDF } from '../pdf/generarOficioPDF';
import { generarActaMonitoreoPDF } from '../pdf/generarActaPDF';
import { loadImageDataURL } from '../pdf/membrete';
import bannerAgebatpUrl from '../assets/membrete/banner_agebatp.jpeg';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useAuth } from '../context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';
import { addInformeMonitoreo, updateInformeMonitoreo, subscribeDirectorioCeba, subscribeDirectorioCetpro } from '../firebase/db';
import { getVisionModel, getChatModel } from '../firebase/config';
import { ESPECIALISTAS_MONITOREO, JEFATURA_AGEBATP, monthNames } from '../data/constants';
import { ANTECEDENTES_2026, ANALISIS_BOILERPLATE_2026 } from '../data/antecedentes2026';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList, Cell } from 'recharts';

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

const LEVEL_COLORS = {
  1: C.red,
  2: C.amber,
  3: C.blue,
  4: C.green
};

function formatLevel(lvl) {
  if (lvl === 1) return 'I';
  if (lvl === 2) return 'II';
  if (lvl === 3) return 'III';
  if (lvl === 4) return 'IV';
  return '—';
}

function getNivelesIndividualesText(doc, programa) {
  if (!doc || !doc.ficha) return '—';
  if (programa === 'ETP') {
    const rubricas = doc.ficha.rubricasETP || [];
    return rubricas.map((r, i) => `R${i + 1}:${formatLevel(r.nivel)}`).join('  ');
  } else {
    const criterios = doc.ficha.instrumento1?.criterios || [];
    return criterios.map((c, i) => `R${i + 1}:${formatLevel(c.nivel)}`).join('  ');
  }
}

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

const functions = getFunctions(app);
const subirDocumentoMonitoreoCall = httpsCallable(functions, 'subirDocumentoMonitoreo');

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

async function extraerFichaConIA(images, tipoMonitoreo, programa, onProgress) {
  const model = await getVisionModel("gemini-2.5-pro");
  if (onProgress) onProgress("Iniciando extracción con Gemini 2.5 Pro...", 55);
  
  const prompt = programa === 'ETP'
    ? `Eres un extractor de datos de fichas oficiales de monitoreo/acompañamiento pedagógico de la UGEL 03 (CETPRO/ETP, Perú).
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código \`\`\`json) con el esquema detallado abajo. Si un campo no aparece o está vacío, usa null. No inventes valores.

Esquema de salida JSON:
{
  "datosGeneralesCETPRO": {
    "nombreCETPRO": string,
    "codigoModular": string,
    "ugel": string,
    "rei": string,
    "docenteNombre": string,
    "docenteDNI": string,
    "docenteTelefono": string,
    "docenteCorreo": string,
    "monitorNombre": string,
    "monitorDNI": string,
    "monitorTelefono": string,
    "instancia": string,
    "observadorNombre": string,
    "observadorDNI": string,
    "observadorTelefono": string,
    "observadorCargo": string
  },
  "datosSesion": {
    "ciclo": string,
    "opcionOcupacional": string,
    "programaEstudio": string,
    "especialidad": string,
    "moduloFormativo": string,
    "unidadDidactica": string,
    "nombreActividad": string,
    "matriculados": number,
    "presentes": number,
    "turno": string,
    "fechaObservacion": string,
    "horaInicio": string,
    "horaTermino": string
  },
  "documentosPedagogicos": {
    "planEstudios": boolean,
    "unidadDidactica": boolean,
    "sesionAprendizaje": boolean,
    "silabo": boolean
  },
  "rubricasETP": [
    {
      "titulo": "Planifica el proceso de enseñanza y aprendizaje.",
      "nivel": number (1, 2, 3, o 4. Busca una marca X, círculo o checkmark en los casilleros de nivel I, II, III o IV para esta rúbrica),
      "evidencias": string
    },
    {
      "titulo": "Promueve el involucramiento de los estudiantes en el proceso de aprendizaje.",
      "nivel": number (1-4),
      "evidencias": string
    },
    {
      "titulo": "Promueve el dominio de procedimientos para la realización de trabajos técnicos.",
      "nivel": number (1-4),
      "evidencias": string
    },
    {
      "titulo": "Acompaña el proceso de aprendizaje de los estudiantes.",
      "nivel": number (1-4),
      "evidencias": string
    },
    {
      "titulo": "Promueve un clima propicio para el aprendizaje.",
      "nivel": number (1-4),
      "evidencias": string
    }
  ],
  "compromisosMejora": [
    {
      "desempenoPorMejorar": string,
      "compromisoMejora": string
    }
  ],
  "observacionesFicha": string,
  "declaracion": {
    "hora": string,
    "dia": string,
    "mes": string,
    "anio": string
  },
  "firmas": {
    "docente": { "nombre": string, "dni": string },
    "observador": { "nombre": string, "dni": string }
  }
}`
    : `Eres un extractor de datos de fichas oficiales de monitoreo/acompañamiento pedagógico de la UGEL 03 (Perú).
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código \`\`\`json) con el esquema detallado abajo. Si un campo no aparece, usa null. No inventes valores.
Tipo de monitoreo: ${tipoMonitoreo} (${programa}).

Esquema de salida JSON:
{
  "datosGenerales": {
    "institucionEducativa": string,
    "codigoModular": string,
    "rei": string,
    "docenteObservado": string,
    "nivelEducativo": string,
    "grado": string,
    "seccion": string,
    "areaCurricular": string,
    "fecha": string,
    "horaInicio": string,
    "horaFin": string,
    "estudiantesMatriculados": number,
    "estudiantesAsistentes": number,
    "estudiantesDiscapacidad": number,
    "nombreMonitor": string
  },
  "documentosPedagogicos": {
    "planEstudios": boolean,
    "unidadDidactica": boolean,
    "sesionAprendizaje": boolean,
    "silabo": boolean
  },
  "instrumento1": {
    "criterios": [
      {
        "titulo": "Involucra activamente a los estudiantes en el proceso de aprendizaje.",
        "nivel": number (1, 2, 3, o 4. Busca marcas como X, círculos o checkmarks en los casilleros de los niveles I, II, III o IV),
        "conductasObservables": string
      },
      {
        "titulo": "Promueve el razonamiento, la creatividad y/o el pensamiento crítico.",
        "nivel": number (1-4),
        "conductasObservables": string
      },
      {
        "titulo": "Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes y adecuar su enseñanza.",
        "nivel": number (1-4),
        "conductasObservables": string
      },
      {
        "titulo": "Propicia un ambiente de respeto y proximidad.",
        "nivel": number (1-4),
        "conductasObservables": string
      },
      {
        "titulo": "Regula positivamente la conducta de los estudiantes.",
        "nivel": number (1-4),
        "conductasObservables": string
      }
    ]
  },
  "compromisosMejora": [
    {
      "desempenoPorMejorar": string,
      "compromisoMejora": string
    }
  ],
  "declaracion": {
    "hora": string,
    "dia": string,
    "mes": string,
    "anio": string
  },
  "firmas": {
    "docente": {
      "nombre": string,
      "dni": string
    },
    "observador": {
      "nombre": string,
      "dni": string
    }
  }
}`;

  const contents = [
    prompt,
    ...images.map(b64 => ({ inlineData: { mimeType: "image/png", data: b64 } }))
  ];
  
  if (onProgress) onProgress("Gemini 2.5 Pro procesando OCR e interpretando el manuscrito...", 70);
  
  const result = await model.generateContent(contents);
  const text = typeof result.response.text === "function" ? result.response.text() : result.response.text;
  
  if (onProgress) onProgress("Procesando respuesta JSON...", 90);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);
  
  if (onProgress) onProgress("Ficha procesada exitosamente.", 100);
  return parsed;
}

async function generarInformeIA(payload, onProgress) {
  const model = await getChatModel();
  const prompt = `Eres un especialista pedagógico del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP) de la UGEL 03 (Perú).
Genera un informe detallado e institucional en base a los siguientes datos de monitoreo pedagógico realizado a una Institución Educativa.
Especialista: ${payload.especialista.nombre} (${payload.especialista.cargo})
Institución: ${payload.acta.institucion}
Director: ${payload.acta.director} (${payload.acta.directorCargo})
Fecha: ${payload.acta.fecha}
Docentes Monitoreados: ${JSON.stringify(payload.docentes)}

REGLAS OBLIGATORIAS:
- En la sección "antecedentes", utiliza EXACTAMENTE las bases legales vigentes para el año 2026. No inventes otras leyes, usa la siguiente lista:
${ANTECEDENTES_2026.map((a, i) => `  * ${a}`).join('\n')}
- En la sección "analisis" (II. ANÁLISIS), los primeros párrafos deben explicar el marco normativo de monitoreo como labor permanente (basado en: ${ANALISIS_BOILERPLATE_2026.join('\n')}).
- Luego, debes detallar los hallazgos para cada uno de los docentes monitoreados.
- Dejar constancia del estado de su documentación pedagógica obligatoria (Plan de estudios, Unidad didáctica, Sesión de aprendizaje y Sílabo sellado).
- Redacta de forma formal y justificada.
- Si algún docente no cuenta con sesión de aprendizaje, indícalo expresamente.
- NO incluyas referencias al Buen Inicio del Año Escolar (BIAE) ni a Memorándums Múltiples antiguos, ya que el monitoreo es permanente en 2026.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código \`\`\`json) con el siguiente esquema:
{
  "asunto": "MONITOREO Y ACOMPAÑAMIENTO PEDAGÓGICO A LA INSTITUCIÓN EDUCATIVA...",
  "referencia": "Plan de Trabajo AGEBATP 2026",
  "antecedentes": [
    "Párrafo 1 de antecedentes...",
    "Párrafo 2 de antecedentes..."
  ],
  "analisis": [
    "Párrafo 1 de análisis...",
    "Párrafo 2 de análisis..."
  ],
  "conclusionesTabla": [
    { "docente": "Nombre Docente", "nudoCritico": "Descripción del nudo crítico...", "alternativa": "Descripción de la alternativa de solución..." }
  ],
  "recomendaciones": [
    "Recomendación 1...",
    "Recomendación 2..."
  ]
}
Usa un lenguaje formal, técnico, administrativo, de acuerdo a las normas de la UGEL 03 (MINEDU). Redacta íntegramente en español formal peruano; no incluyas palabras en inglés.`;

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

  if (onProgress) onProgress("Estructurando informe...", 95);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);
  if (onProgress) onProgress("Informe completado.", 100);
  return parsed;
}

async function generarOficioIA(payload, onProgress) {
  const model = await getChatModel();
  const prompt = `Eres un especialista del AGEBATP de la UGEL 03.
Genera un Oficio de ${payload.tono} en base a los siguientes datos:
Destinatario: ${payload.destinatario.nombre} (${payload.destinatario.cargo}) del ${payload.destinatario.institucion}
Remitente: ${payload.remitente.nombre} (${payload.remitente.cargo})
Docentes Monitoreados: ${JSON.stringify(payload.docentes)}
Conclusiones: ${JSON.stringify(payload.conclusiones)}
Recomendaciones: ${JSON.stringify(payload.recomendaciones)}

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código \`\`\`json) con el siguiente esquema:
{
  "asunto": "RECOMENDACIÓN O FELICITACIÓN...",
  "cuerpo": [
    "Párrafo 1 del cuerpo...",
    "Párrafo 2 del cuerpo..."
  ],
  "despedida": "Hago propicia la ocasión para expresarle los sentimientos de mi especial consideración y estima."
}
Usa un tono formal, de acuerdo a las directivas de la UGEL 03 (MINEDU). Redacta íntegramente en español formal peruano; no incluyas palabras en inglés.`;

  if (onProgress) onProgress("Iniciando generación de oficio...", 10);

  const resultStream = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  let text = '';
  for await (const chunk of resultStream.stream) {
    const chunkText = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || '');
    text += chunkText;
    if (onProgress) {
      const progressPercent = Math.min(90, 15 + Math.floor(text.length / 30));
      onProgress(`Recibiendo oficio (${text.length} caracteres)...`, progressPercent);
    }
  }

  if (onProgress) onProgress("Estructurando oficio...", 95);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);
  if (onProgress) onProgress("Oficio completado.", 100);
  return parsed;
}

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

function ProgresoIA({ porcentaje, estado, detail }) {
  return (
    <div style={{ margin: "16px 0", padding: "16px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#1B3A5C" }}>
        <span>{estado}</span>
        <span>{porcentaje}%</span>
      </div>
      <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${porcentaje}%`, height: "100%", background: "#2563A0", transition: "width 0.3s ease" }} />
      </div>
      {detail && <div style={{ marginTop: 6, fontSize: 11, color: "#64748B" }}>{detail}</div>}
    </div>
  );
}

export default function WizardInformeIndividual({ tipoMonitoreo = 'docente', onClose, onSaved, initialData = null }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialData?.paso || 1);
  const [saving, setSaving] = useState(false);
  const [informeId, setInformeId] = useState(initialData?.id || null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // ── Paso 1: Datos IE ──
  const [especialistaId, setEspecialistaId] = useState(initialData?.especialistaId || '');
  const [programaSeleccionado, setProgramaSeleccionado] = useState(initialData?.programa || '');
  const [institucionNombre, setInstitucionNombre] = useState(initialData?.institucionNombre || '');
  const [directorNombre, setDirectorNombre] = useState(initialData?.directorNombre || '');
  const [cargoDirector, setCargoDirector] = useState(initialData?.cargoDirector || 'Director(a)');
  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState(initialData?.horaInicio || '09:00');
  const [horaFin, setHoraFin] = useState(initialData?.horaFin || '12:00');

  const [cebas, setCebas] = useState([]);
  const [cetpros, setCetpros] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const chartAttendanceRef = useRef(null);
  const chartLevelsRef = useRef(null);

  const [codigoModular, setCodigoModular] = useState(initialData?.codigoModular || '');
  const [codigoModularInicialIntermedio, setCodigoModularInicialIntermedio] = useState(initialData?.codigoModularInicialIntermedio || '');
  const [codigoModularAvanzado, setCodigoModularAvanzado] = useState(initialData?.codigoModularAvanzado || '');

  // ── Paso 2: Docentes ──
  const [docentes, setDocentes] = useState(initialData?.docentes || []);
  const [editingDocente, setEditingDocente] = useState(null);
  const [currentDocenteIdx, setCurrentDocenteIdx] = useState(null);
  const [docenteModalTab, setDocenteModalTab] = useState('datos');
  const [docenteFile, setDocenteFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ percent: 0, status: "", detail: "" });

  // ── Paso 3: Acta Consolidada ──
  const [actaObservaciones, setActaObservaciones] = useState(initialData?.acta?.observaciones || '');
  const [actaHoraCierre, setActaHoraCierre] = useState(initialData?.acta?.horaCierre || initialData?.horaFin || '12:00');
  const [especialistaDNI, setEspecialistaDNI] = useState(initialData?.acta?.especialistaDNI || '');
  const [directorDNI, setDirectorDNI] = useState(initialData?.acta?.directorDNI || '');
  const [firmaMonitorDataUrl, setFirmaMonitorDataUrl] = useState(initialData?.acta?.firmaMonitorDataUrl || null);
  const [firmaDirectorDataUrl, setFirmaDirectorDataUrl] = useState(initialData?.acta?.firmaDirectorDataUrl || null);
  const [actaCompromisosGenerales, setActaCompromisosGenerales] = useState(() => {
    if (initialData?.acta?.compromisosGenerales) {
      return initialData.acta.compromisosGenerales;
    }
    return [
      "El docente se compromete a implementar las recomendaciones brindadas por el monitor en la sesión de aprendizaje."
    ];
  });

  // ── Paso 4: Informe + Oficio ──
  const [informeData, setInformeData] = useState(initialData?.informe || null);
  const [oficioData, setOficioData] = useState(initialData?.oficio || null);
  const [informeLoading, setInformeLoading] = useState(false);
  const [informeProgress, setInformeProgress] = useState({ percent: 0, status: "", detail: "" });
  const [oficioLoading, setOficioLoading] = useState(false);
  const [oficioProgress, setOficioProgress] = useState({ percent: 0, status: "", detail: "" });
  const [linkEvidencias, setLinkEvidencias] = useState(initialData?.links?.evidenciasOnedrive || '');
  const [uploading, setUploading] = useState(false);
  const [informeNumero, setInformeNumero] = useState(initialData?.informe?.numero || '');
  const [bannerDataURL, setBannerDataURL] = useState(null);
  const [qrDataURL, setQrDataURL] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);

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

  // Subscribe to directories
  useEffect(() => {
    const unsubCeba = subscribeDirectorioCeba(setCebas);
    const unsubCetpro = subscribeDirectorioCetpro(setCetpros);
    return () => {
      unsubCeba();
      unsubCetpro();
    };
  }, []);

  // Handle click outside suggestions to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredInstitutions = useMemo(() => {
    if (programaFinal === 'EBA') return cebas;
    if (programaFinal === 'ETP') return cetpros;
    return [
      ...cebas.map(c => ({ ...c, type: 'CEBA' })),
      ...cetpros.map(c => ({ ...c, type: 'CETPRO' }))
    ];
  }, [cebas, cetpros, programaFinal]);

  const suggestions = useMemo(() => {
    const query = (institucionNombre || '').trim().toLowerCase();
    if (!query) return filteredInstitutions;
    return filteredInstitutions.filter(item => 
      item.nombre.toLowerCase().includes(query)
    );
  }, [filteredInstitutions, institucionNombre]);

  const handleSelectInstitution = (item) => {
    setInstitucionNombre(item.nombre);
    const nombres = item.nombres || '';
    const apePat = item.apellidoPaterno || '';
    const apeMat = item.apellidoMaterno || '';
    const fullName = `${nombres} ${apePat} ${apeMat}`.trim();
    setDirectorNombre(fullName);
    setCargoDirector('Director(a)');
    if (item.dni) {
      setDirectorDNI(item.dni);
    }

    if (programaFinal === 'ETP') {
      setCodigoModular(item.codigoModular || '');
      setCodigoModularInicialIntermedio('');
      setCodigoModularAvanzado('');
    } else {
      setCodigoModular('');
      setCodigoModularInicialIntermedio(item.codigoModularInicialIntermedio || '');
      setCodigoModularAvanzado(item.codigoModularAvanzado || '');
    }

    setShowSuggestions(false);
  };

  useEffect(() => {
    loadImageDataURL(bannerAgebatpUrl).then(url => {
      setBannerDataURL(url);
    });
  }, []);

  useEffect(() => {
    if (especialistaSeleccionado?.dni) {
      setEspecialistaDNI(especialistaSeleccionado.dni);
    }
  }, [especialistaSeleccionado]);

  const parseFechaPartes = (fechaStr) => {
    if (!fechaStr) return { dia: '', mes: '', anio: '' };
    const parts = fechaStr.split('-');
    if (parts.length !== 3) return { dia: '', mes: '', anio: '' };
    const [yyyy, mm, dd] = parts;
    const mesNombre = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][parseInt(mm, 10) - 1] || '';
    return { dia: dd, mes: mesNombre, anio: yyyy };
  };

  const initBlankFichaEBA = () => {
    const fechaPartes = parseFechaPartes(fecha);
    return {
      datosGenerales: {
        institucionEducativa: institucionNombre,
        codigoModular: codigoModularInicialIntermedio || codigoModularAvanzado || '',
        rei: '',
        docenteObservado: '',
        nivelEducativo: 'Educación Básica Alternativa',
        grado: '',
        seccion: '',
        areaCurricular: '',
        fecha: fecha,
        horaInicio: '09:00',
        horaFin: '12:00',
        estudiantesMatriculados: 0,
        estudiantesAsistentes: 0,
        estudiantesDiscapacidad: 0,
        nombreMonitor: especialistaSeleccionado?.nombre || ''
      },
      documentosPedagogicos: { planEstudios: false, unidadDidactica: false, sesionAprendizaje: false, silabo: false },
      instrumento1: {
        criterios: [
          { titulo: 'Involucra activamente a los estudiantes en el proceso de aprendizaje.', nivel: null, conductasObservables: '' },
          { titulo: 'Promueve el razonamiento, la creatividad y/o el pensamiento crítico.', nivel: null, conductasObservables: '' },
          { titulo: 'Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes y adecuar su enseñanza.', nivel: null, conductasObservables: '' },
          { titulo: 'Propicia un ambiente de respeto y proximidad.', nivel: null, conductasObservables: '' },
          { titulo: 'Regula positivamente el comportamiento de los estudiantes.', nivel: null, conductasObservables: '' }
        ]
      },
      compromisosMejora: [
        { desempenoPorMejorar: '', compromisoMejora: '' }
      ],
      declaracion: { hora: '12:00', dia: fechaPartes.dia, mes: fechaPartes.mes, anio: fechaPartes.anio || '2026' },
      firmas: {
        docente: { nombre: '', dni: '' },
        observador: { nombre: especialistaSeleccionado?.nombre || '', dni: especialistaSeleccionado?.dni || '' }
      }
    };
  };

  const initBlankFichaETP = () => {
    const fechaPartes = parseFechaPartes(fecha);
    return {
      datosGeneralesCETPRO: {
        nombreCETPRO: institucionNombre,
        codigoModular: codigoModular || '',
        ugel: '03',
        rei: '',
        docenteNombre: '',
        docenteDNI: '',
        docenteTelefono: '',
        docenteCorreo: '',
        monitorNombre: especialistaSeleccionado?.nombre || '',
        monitorDNI: especialistaSeleccionado?.dni || '',
        monitorTelefono: '',
        instancia: 'UGEL',
        observadorNombre: '',
        observadorDNI: '',
        observadorTelefono: '',
        observadorCargo: ''
      },
      datosSesion: {
        ciclo: '',
        opcionOcupacional: '',
        programaEstudio: '',
        especialidad: '',
        moduloFormativo: '',
        unidadDidactica: '',
        nombreActividad: '',
        matriculados: 0,
        presentes: 0,
        turno: '',
        fechaObservacion: fecha,
        horaInicio: '09:00',
        horaTermino: '12:00'
      },
      documentosPedagogicos: { planEstudios: false, unidadDidactica: false, sesionAprendizaje: false, silabo: false },
      rubricasETP: [
        { titulo: 'Planifica el proceso de enseñanza y aprendizaje.', evidencias: '', nivel: null },
        { titulo: 'Promueve el involucramiento de los estudiantes en el proceso de aprendizaje.', evidencias: '', nivel: null },
        { titulo: 'Promueve el dominio de procedimientos para la realización de trabajos técnicos.', evidencias: '', nivel: null },
        { titulo: 'Acompaña el proceso de aprendizaje de los estudiantes.', evidencias: '', nivel: null },
        { titulo: 'Promueve un clima propicio para el aprendizaje.', evidencias: '', nivel: null }
      ],
      compromisosMejora: [
        { desempenoPorMejorar: '', compromisoMejora: '' }
      ],
      declaracion: { hora: '12:00', dia: fechaPartes.dia, mes: fechaPartes.mes, anio: fechaPartes.anio || '2026' },
      firmas: {
        docente: { nombre: '', dni: '' },
        observador: { nombre: especialistaSeleccionado?.nombre || '', dni: especialistaSeleccionado?.dni || '' }
      }
    };
  };

  const initBlankDocente = () => {
    const blankFicha = programaFinal === 'ETP' ? initBlankFichaETP() : initBlankFichaEBA();
    const fechaPartes = parseFechaPartes(fecha);
    return {
      id: `docente-${Date.now()}`,
      nombre: '',
      dni: '',
      telefono: '',
      correo: '',
      documentosPedagogicos: { planEstudios: false, unidadDidactica: false, sesionAprendizaje: false, silabo: false },
      datosSesion: {
        ciclo: '',
        opcionOcupacional: '',
        programaEstudio: '',
        especialidad: '',
        moduloFormativo: '',
        unidadDidactica: '',
        nombreActividad: '',
        matriculados: 0,
        presentes: 0,
        turno: '',
        fechaObservacion: fecha,
        horaInicio: '09:00',
        horaTermino: '12:00'
      },
      ficha: blankFicha,
      compromisosMejora: [
        { desempenoPorMejorar: '', compromisoMejora: '' }
      ],
      firmaDocenteDataUrl: null,
      firmaMonitorDataUrl: null,
      observacionesFicha: '',
      declaracion: { hora: '12:00', dia: fechaPartes.dia, mes: fechaPartes.mes, anio: fechaPartes.anio || '2026' },
      firmas: {
        docente: { nombre: '', dni: '' },
        observador: { nombre: especialistaSeleccionado?.nombre || '', dni: '' }
      },
      promedioGeneral: 0,
      nivelGeneralLabel: 'Nivel I'
    };
  };

  const handleAddDocenteOpen = () => {
    setEditingDocente(initBlankDocente());
    setCurrentDocenteIdx(null);
    setDocenteModalTab('datos');
    setDocenteFile(null);
  };

  const handleEditDocenteOpen = (idx) => {
    setEditingDocente(JSON.parse(JSON.stringify(docentes[idx])));
    setCurrentDocenteIdx(idx);
    setDocenteModalTab('datos');
    setDocenteFile(null);
  };

  const handleRemoveDocente = (idx) => {
    if (confirm('¿Eliminar este docente del monitoreo?')) {
      setDocentes(docentes.filter((_, i) => i !== idx));
    }
  };

  const handleDocenteFieldChange = (field, val) => {
    const updated = { ...editingDocente, [field]: val };
    
    // Sync with inner Ficha General values
    if (programaFinal === 'ETP') {
      if (!updated.ficha.datosGeneralesCETPRO) updated.ficha.datosGeneralesCETPRO = {};
      if (!updated.ficha.firmas) updated.ficha.firmas = {};
      if (!updated.ficha.firmas.docente) updated.ficha.firmas.docente = {};

      if (field === 'nombre') {
        updated.ficha.datosGeneralesCETPRO.docenteNombre = val;
        updated.ficha.firmas.docente.nombre = val;
      }
      if (field === 'dni') {
        updated.ficha.datosGeneralesCETPRO.docenteDNI = val;
        updated.ficha.firmas.docente.dni = val;
      }
      if (field === 'telefono') updated.ficha.datosGeneralesCETPRO.docenteTelefono = val;
      if (field === 'correo') updated.ficha.datosGeneralesCETPRO.docenteCorreo = val;
    } else {
      if (!updated.ficha.datosGenerales) updated.ficha.datosGenerales = {};
      if (!updated.ficha.firmas) updated.ficha.firmas = {};
      if (!updated.ficha.firmas.docente) updated.ficha.firmas.docente = {};

      if (field === 'nombre') {
        updated.ficha.datosGenerales.docenteObservado = val;
        updated.ficha.firmas.docente.nombre = val;
      }
      if (field === 'dni') {
        updated.ficha.firmas.docente.dni = val;
      }
    }
    
    setEditingDocente(updated);
  };

  const handleEditingDocenteFichaChange = (updatedFicha) => {
    const updated = { ...editingDocente, ficha: updatedFicha };
    
    // Sync fields back to top-level object
    if (programaFinal === 'ETP') {
      const dgCETPRO = updatedFicha.datosGeneralesCETPRO || {};
      if (updated.ficha.datosGeneralesCETPRO) {
        updated.ficha.datosGeneralesCETPRO.codigoModular = updated.ficha.datosGeneralesCETPRO.codigoModular || codigoModular;
        updated.ficha.datosGeneralesCETPRO.nombreCETPRO = updated.ficha.datosGeneralesCETPRO.nombreCETPRO || institucionNombre;
      }
      updated.nombre = dgCETPRO.docenteNombre || '';
      updated.dni = dgCETPRO.docenteDNI || '';
      updated.telefono = dgCETPRO.docenteTelefono || '';
      updated.correo = dgCETPRO.docenteCorreo || '';
      updated.documentosPedagogicos = updatedFicha.documentosPedagogicos || {};
      updated.datosSesion = updatedFicha.datosSesion || {};
      updated.compromisosMejora = updatedFicha.compromisosMejora || [];
      updated.observacionesFicha = updatedFicha.observacionesFicha || '';
      updated.declaracion = updatedFicha.declaracion || {};
      updated.firmas = updatedFicha.firmas || {};
      updated.firmaDocenteDataUrl = updatedFicha.firmaDocenteDataUrl || null;
      updated.firmaMonitorDataUrl = updatedFicha.firmaMonitorDataUrl || null;

      // Calculate level rating averages
      const rubricVals = (updatedFicha.rubricasETP || [])
        .map(r => r.nivel)
        .filter(v => typeof v === 'number' && v >= 1 && v <= 4);
      const promedio = rubricVals.length > 0
        ? parseFloat((rubricVals.reduce((s, v) => s + v, 0) / rubricVals.length).toFixed(2))
        : 0;
      const rounded = Math.round(promedio);
      const labels = { 1: 'Nivel I', 2: 'Nivel II', 3: 'Nivel III', 4: 'Nivel IV' };
      updated.promedioGeneral = promedio;
      updated.nivelGeneralLabel = labels[rounded] || 'Nivel I';
    } else {
      const dgEBA = updatedFicha.datosGenerales || {};
      
      const normCycle = (dgEBA.grado || '').trim().toLowerCase();
      const autoCode = normCycle.includes('avanzado') ? codigoModularAvanzado : codigoModularInicialIntermedio;
      if (!dgEBA.codigoModular || dgEBA.codigoModular === codigoModularInicialIntermedio || dgEBA.codigoModular === codigoModularAvanzado) {
        dgEBA.codigoModular = autoCode;
      }
      if (!dgEBA.institucionEducativa) {
        dgEBA.institucionEducativa = institucionNombre;
      }

      updated.nombre = dgEBA.docenteObservado || '';
      updated.dni = updatedFicha.firmas?.docente?.dni || '';
      updated.telefono = '';
      updated.correo = '';
      updated.documentosPedagogicos = updatedFicha.documentosPedagogicos || {};
      
      const session = {
        ciclo: dgEBA.grado || '',
        opcionOcupacional: dgEBA.areaCurricular || '',
        programaEstudio: dgEBA.areaCurricular || '',
        especialidad: dgEBA.areaCurricular || '',
        moduloFormativo: dgEBA.areaCurricular || '',
        unidadDidactica: dgEBA.areaCurricular || '',
        nombreActividad: '',
        matriculados: dgEBA.estudiantesMatriculados || 0,
        presentes: dgEBA.estudiantesAsistentes || 0,
        turno: dgEBA.seccion || '',
        fechaObservacion: dgEBA.fecha || fecha,
        horaInicio: dgEBA.horaInicio || '09:00',
        horaTermino: dgEBA.horaFin || '12:00'
      };
      updated.datosSesion = session;
      updated.compromisosMejora = updatedFicha.compromisosMejora || [];
      updated.observacionesFicha = updatedFicha.observacionesFicha || '';
      updated.declaracion = updatedFicha.declaracion || {};
      updated.firmas = updatedFicha.firmas || {};
      updated.firmaDocenteDataUrl = updatedFicha.firmaDocenteDataUrl || null;
      updated.firmaMonitorDataUrl = updatedFicha.firmaMonitorDataUrl || null;

      // Calculate level rating averages
      const desVals = (updatedFicha.instrumento1?.criterios || []).map(c => c.nivel).filter(v => v !== null);
      const promedio = desVals.length > 0 ? desVals.reduce((s, v) => s + v, 0) / desVals.length : 0;
      const rounded = Math.round(promedio);
      const labels = { 1: 'Nivel I', 2: 'Nivel II', 3: 'Nivel III', 4: 'Nivel IV' };
      updated.promedioGeneral = promedio;
      updated.nivelGeneralLabel = labels[rounded] || 'Nivel I';
    }

    setEditingDocente(updated);
  };

  const handleDocenteFichaUpload = async (file) => {
    setDocenteFile(file);
    setOcrLoading(true);
    setOcrProgress({ percent: 5, status: "Iniciando extracción...", detail: "" });
    try {
      const images = await pdfToImages(file, (status, percent) => {
        setOcrProgress({ percent: Math.floor(percent * 0.5), status, detail: "" });
      });
      const parsed = await extraerFichaConIA(images, tipoMonitoreo, programaFinal, (status, percent) => {
        setOcrProgress({ percent: 50 + Math.floor(percent * 0.5), status, detail: "" });
      });

      // Recalculate score averages
      let promedio = 0;
      let label = 'Nivel I';
      if (programaFinal === 'ETP') {
        const rubricVals = (parsed.rubricasETP || [])
          .map(r => r.nivel)
          .filter(v => typeof v === 'number' && v >= 1 && v <= 4);
        promedio = rubricVals.length > 0
          ? parseFloat((rubricVals.reduce((s, v) => s + v, 0) / rubricVals.length).toFixed(2))
          : 0;
        const rounded = Math.round(promedio);
        const labels = { 1: 'Nivel I', 2: 'Nivel II', 3: 'Nivel III', 4: 'Nivel IV' };
        label = labels[rounded] || 'Nivel I';
      } else {
        const desVals = (parsed.instrumento1?.criterios || []).map(c => c.nivel).filter(v => v !== null);
        promedio = desVals.length > 0 ? desVals.reduce((s, v) => s + v, 0) / desVals.length : 0;
        const rounded = Math.round(promedio);
        const labels = { 1: 'Nivel I', 2: 'Nivel II', 3: 'Nivel III', 4: 'Nivel IV' };
        label = labels[rounded] || 'Nivel I';
      }

      setEditingDocente({
        ...editingDocente,
        nombre: programaFinal === 'ETP' ? parsed.datosGeneralesCETPRO?.docenteNombre : parsed.datosGenerales?.docenteObservado,
        dni: programaFinal === 'ETP' ? parsed.datosGeneralesCETPRO?.docenteDNI : parsed.firmas?.docente?.dni,
        ficha: parsed,
        promedioGeneral: promedio,
        nivelGeneralLabel: label
      });
      showToast('Ficha procesada exitosamente.');
      setDocenteModalTab('datos');
    } catch (err) {
      console.error(err);
      showToast(`Error al procesar: ${err.message}`, 'error');
    }
    setOcrLoading(false);
  };

  const handleSaveDocenteInList = () => {
    if (!editingDocente.nombre || !editingDocente.nombre.trim()) {
      showToast('Por favor ingrese el nombre del docente.', 'error');
      return;
    }
    const list = [...docentes];
    if (currentDocenteIdx !== null) {
      list[currentDocenteIdx] = editingDocente;
    } else {
      list.push(editingDocente);
    }
    setDocentes(list);
    setEditingDocente(null);
    setCurrentDocenteIdx(null);
    showToast('Docente guardado en la lista.');
  };

  // Generate Report consolidated IA text
  const handleGenerarInforme = async () => {
    setInformeLoading(true);
    setInformeProgress({ percent: 5, status: "Iniciando generación...", detail: "" });
    try {
      const now = new Date();
      const payload = {
        especialista: { nombre: especialistaSeleccionado.nombre, cargo: especialistaSeleccionado.cargo },
        acta: { institucion: institucionNombre, director: directorNombre, directorCargo: cargoDirector, fecha },
        docentes
      };

      const data = await generarInformeIA(payload, (status, percent) => {
        setInformeProgress({ percent, status, detail: "" });
      });
      if (data && data.asunto) {
        data.asunto = data.asunto.replace(/^INFORME DE\s+/i, '').replace(/^INFORME CONSOLIDADO DE\s+/i, '');
      }
      setInformeData(data);
      showToast('Informe consolidado generado exitosamente.');
    } catch (err) {
      console.error('Error al generar informe:', err);
      showToast(`Error al generar informe: ${err.message}`, 'error');
    }
    setInformeLoading(false);
  };

  const handleGenerarOficio = async () => {
    setOficioLoading(true);
    setOficioProgress({ percent: 5, status: "Iniciando generación de Oficio...", detail: "" });
    try {
      // Felicitación only if all teachers scored >= III and have 0 commitments
      const tieneCompromisos = docentes.some(d => (d.compromisosMejora || []).some(c => c.desempenoPorMejorar?.trim() || c.compromisoMejora?.trim()));
      const esFelicitacion = docentes.every(d => d.promedioGeneral >= 3) && !tieneCompromisos;
      const tono = esFelicitacion ? 'felicitacion' : 'recomendacion';

      const payload = {
        destinatario: { nombre: directorNombre, cargo: cargoDirector, institucion: `${institucionTipo} ${institucionNombre}` },
        remitente: { nombre: especialistaSeleccionado.nombre, cargo: especialistaSeleccionado.cargo },
        tono,
        docentes,
        conclusiones: informeData?.conclusionesTabla || [],
        recomendaciones: informeData?.recomendaciones || []
      };

      const data = await generarOficioIA(payload, (status, percent) => {
        setOficioProgress({ percent, status, detail: "" });
      });

      const asuntoText = `${esFelicitacion ? 'FELICITACIÓN' : 'RECOMENDACIÓN'} PEDAGÓGICA EN EL MARCO DEL MONITOREO Y ACOMPAÑAMIENTO AL ${institucionTipo.toUpperCase()} "${institucionNombre.toUpperCase()}".`;
      setOficioData({
        ...data,
        asunto: asuntoText
      });
      showToast('Oficio consolidado generado exitosamente.');
    } catch (err) {
      console.error('Error al generar oficio:', err);
      showToast(`Error al generar oficio: ${err.message}`, 'error');
    }
    setOficioLoading(false);
  };

  const saveDraft = async (statusOverride = null) => {
    setSaving(true);
    try {
      const dataToSave = {
        tipoMonitoreo,
        programa: programaFinal,
        tipo: 'consolidado_ie',
        especialistaId: especialistaSeleccionado?.id || '',
        especialistaNombre: especialistaSeleccionado?.nombre || '',
        especialistaCargo: especialistaSeleccionado?.cargo || '',
        jefaturaNombre: JEFATURA_AGEBATP.nombre,
        jefaturaCargo: JEFATURA_AGEBATP.cargo,
        institucionTipo,
        institucionNombre,
        directorNombre,
        cargoDirector,
        codigoModular,
        codigoModularInicialIntermedio,
        codigoModularAvanzado,
        fecha,
        horaInicio,
        horaFin,
        docentes,
        acta: {
          especialista: especialistaSeleccionado?.nombre || '',
          especialistaCargo: especialistaSeleccionado?.cargo || '',
          especialistaDNI,
          director: directorNombre,
          directorCargo: cargoDirector,
          directorDNI,
          fecha,
          horaInicio,
          horaFin,
          horaCierre: actaHoraCierre,
          observaciones: actaObservaciones,
          firmaMonitorDataUrl,
          firmaDirectorDataUrl,
          compromisosGenerales: actaCompromisosGenerales
        },
        informe: informeData || null,
        oficio: oficioData || null,
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

  const handleExportActaPDF = async () => {
    try {
      setExportProgress("Renderizando gráficas de asistencia y niveles...");
      const chartImages = [];

      // Chart 1: Attendance
      if (chartAttendanceRef.current) {
        try {
          const canvas = await Promise.race([
            html2canvas(chartAttendanceRef.current, { scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#FFFFFF' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          chartImages.push({
            base64: canvas.toDataURL('image/png'),
            title: 'Asistencia de Estudiantes — Matriculados vs. Presentes',
            caption: 'Fuente: Sistema de Monitoreo AGEBATP (2026).'
          });
        } catch (e) {
          console.error('Error capturing attendance chart for Acta:', e);
        }
      }

      // Chart 2: Levels distribution
      if (chartLevelsRef.current) {
        try {
          const canvas = await Promise.race([
            html2canvas(chartLevelsRef.current, { scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#FFFFFF' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          chartImages.push({
            base64: canvas.toDataURL('image/png'),
            title: 'Distribución de Niveles Alcanzados por Rúbrica',
            caption: 'Fuente: Sistema de Monitoreo AGEBATP (2026).'
          });
        } catch (e) {
          console.error('Error capturing levels chart for Acta:', e);
        }
      }

      setExportProgress("Procesando firmas y estructurando acta...");
      const actaPayload = {
        especialista: especialistaSeleccionado?.nombre,
        especialistaCargo: especialistaSeleccionado?.cargo,
        especialistaDNI,
        institucion: institucionNombre,
        institucionTipo,
        director: directorNombre,
        directorCargo: cargoDirector,
        directorDNI,
        fecha,
        horaCierre: actaHoraCierre,
        observaciones: actaObservaciones,
        programa: programaFinal,
        docentes,
        firmaMonitorDataUrl,
        firmaDirectorDataUrl,
        compromisosGenerales: actaCompromisosGenerales
      };
      setExportProgress("Generando archivo PDF y descargando acta consolidada...");
      generarActaMonitoreoPDF(actaPayload, bannerDataURL, chartImages.length > 0 ? chartImages : null);
      showToast('Acta PDF descargada correctamente.');
    } catch (err) {
      showToast(`Error al exportar acta: ${err.message}`, 'error');
    } finally {
      setExportProgress(null);
    }
  };

  const handleExportFichaPDF = (docenteItem) => {
    if (!docenteItem.ficha) return;
    try {
      setExportProgress(`Preparando ficha de monitoreo de ${docenteItem.nombre}...`);
      if (programaFinal === 'ETP') {
        generarFichaETPPDF(docenteItem.ficha, bannerDataURL);
      } else {
        generarFichaPDF(docenteItem.ficha, bannerDataURL);
      }
      showToast(`Ficha de ${docenteItem.nombre} descargada.`);
    } catch (err) {
      showToast(`Error al exportar ficha: ${err.message}`, 'error');
    } finally {
      setExportProgress(null);
    }
  };

  const handleExportInformePDF = async () => {
    if (!informeData) return;
    try {
      setExportProgress("Iniciando compilación de informe docente...");
      // Build tablaInstituciones from docentes
      const tablaInstituciones = docentes.map((doc, idx) => ({
        n: (idx + 1).toString(),
        monitoreo: `Monitoreo y acompañamiento pedagógico en aula al docente ${doc.nombre} en el módulo/área/especialidad ${doc.datosSesion?.moduloFormativo || doc.datosSesion?.programaEstudio || doc.datosSesion?.opcionOcuracional || doc.datosSesion?.areaCurricular || '—'}`,
        inst: `${institucionTipo} "${institucionNombre}"`
      }));

      // Capture charts (Addendum v28)
      setExportProgress("Renderizando gráficas de asistencia y niveles...");
      const chartImages = [];

      // Chart 1: Attendance
      if (chartAttendanceRef.current) {
        try {
          const canvas = await Promise.race([
            html2canvas(chartAttendanceRef.current, { scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#FFFFFF' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          chartImages.push({
            base64: canvas.toDataURL('image/png'),
            title: 'Asistencia de Estudiantes — Matriculados vs. Presentes',
            caption: 'Fuente: Sistema de Monitoreo AGEBATP (2026).'
          });
        } catch (e) {
          console.error('Error capturing attendance chart:', e);
        }
      }

      // Chart 2: Levels distribution
      if (chartLevelsRef.current) {
        try {
          const canvas = await Promise.race([
            html2canvas(chartLevelsRef.current, { scale: 2, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#FFFFFF' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          chartImages.push({
            base64: canvas.toDataURL('image/png'),
            title: 'Distribución de Niveles Alcanzados por Rúbrica (R1–R5)',
            caption: 'Fuente: Sistema de Monitoreo AGEBATP (2026).'
          });
        } catch (e) {
          console.error('Error capturing levels chart:', e);
        }
      }

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
        programa: programaFinal,
        institucionNombre,
        institucionTipo,
        docentes,
        conclusiones: informeData.conclusionesTabla || [],
        linkEvidencias: linkEvidencias ? { texto: "Evidencias de Monitoreo", url: linkEvidencias } : null,
        asunto: informeData.asunto || `INFORME DE MONITOREO Y ACOMPAÑAMIENTO PEDAGÓGICO AL ${institucionTipo.toUpperCase()} "${institucionNombre.toUpperCase()}"`,
        referencia: informeData.referencia || 'Plan de Trabajo AGEBATP 2026',
        antecedentes: informeData.antecedentes || [],
        parrafoAplicacion: `Que, dentro de las acciones de monitoreo y acompañamiento pedagógico, se aplicó la ficha de monitoreo a ${docentes.length} docente(s) de la institución educativa, conforme al siguiente detalle:`,
        tablaInstituciones,
        resultados: informeData.analisis || []
      };

      setExportProgress("Generando archivo PDF y descargando informe...");
      generarInformePDF(payload, bannerDataURL, qrDataURL, chartImages.length > 0 ? chartImages : null);
      showToast('Informe PDF descargado correctamente.');
    } catch (err) {
      showToast(`Error al exportar informe PDF: ${err.message}`, 'error');
    } finally {
      setExportProgress(null);
    }
  };

  const handleExportOficioPDF = () => {
    if (!oficioData) return;
    try {
      setExportProgress("Iniciando compilación de oficio de monitoreo...");
      const payload = {
        numero: informeNumero,
        destinatario: { nombre: directorNombre, cargo: cargoDirector, institucion: `${institucionTipo} "${institucionNombre}"` },
        remitente: { 
          nombre: especialistaSeleccionado?.nombre || initialData?.especialistaNombre || 'ESPECIALISTA MONITOR', 
          cargo: especialistaSeleccionado?.cargo || initialData?.especialistaCargo || 'Especialista de Educación Básica Alternativa' 
        },
        fecha: new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
        programa: programaFinal,
        institucionNombre,
        institucionTipo,
        docentes,
        cuerpo: oficioData.cuerpo || [],
        asunto: oficioData.asunto || 'REMITIR ACCIONES DEL MONITOREO PEDAGÓGICO',
        referencia: oficioData.referencia || 'Plan de Trabajo AGEBATP 2026'
      };
      setExportProgress("Generando archivo PDF y descargando oficio...");
      generarOficioPDF(payload, bannerDataURL, qrDataURL);
      showToast('Oficio PDF descargado correctamente.');
    } catch (err) {
      showToast(`Error al exportar oficio PDF: ${err.message}`, 'error');
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
    { n: 1, label: 'Datos IE' },
    { n: 2, label: 'Docentes Monitoreados' },
    { n: 3, label: 'Acta Consolidada' },
    { n: 4, label: 'Informe + Oficio' },
  ];

  const canGoNext = () => {
    if (step === 1) return especialistaSeleccionado && programaFinal && institucionNombre && directorNombre && fecha;
    if (step === 2) return docentes.length > 0;
    if (step === 3) return true;
    return false;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", overflow: "auto" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "'DM Serif Display',serif", color: C.navy1 }}>
              Nuevo Monitoreo Consolidado por IE — {programaFinal || 'AGEBATP'}
            </h2>
            {saving && <span style={{ fontSize: 11, color: C.g400 }}>Guardando borrador...</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.g500, padding: 4, display: 'flex', alignItems: 'center' }}><Icon name="x" size={20} /></button>
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
                {step > s.n ? <Icon name="check" size={14} color={C.white} /> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? C.navy1 : C.g500, fontFamily: "'DM Sans'" }}>{s.label}</span>
              {i < STEPS.length - 1 && <div style={{ width: 30, height: 2, background: step > s.n ? C.green : C.g200, borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "0 28px 28px" }}>
          {/* ══ PASO 1: DATOS IE ══ */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>Paso 1 — Datos de la Institución Educativa</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={S.label}>Especialista pedagógico / monitor *</label>
                  <select value={especialistaId} onChange={e => { setEspecialistaId(e.target.value); setProgramaSeleccionado(''); }} style={S.input}>
                    <option value="">Seleccione especialista...</option>
                    {ESPECIALISTAS_MONITOREO.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre} — {esp.cargo.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {especialistaSeleccionado?.puedeElegirPrograma && (
                  <div>
                    <label style={S.label}>Programa / Modalidad *</label>
                    <select value={programaSeleccionado} onChange={e => setProgramaSeleccionado(e.target.value)} style={S.input}>
                      <option value="">Seleccione...</option>
                      <option value="EBA">EBA (CEBA)</option>
                      <option value="ETP">ETP (CETPRO)</option>
                    </select>
                  </div>
                )}

                {programaFinal && (
                  <div>
                    <label style={S.label}>Tipo de Institución</label>
                    <input value={institucionTipo} disabled style={{ ...S.input, background: C.g100, color: C.g500 }} />
                  </div>
                )}

                <div style={{ gridColumn: "span 2", position: "relative" }}>
                  <label style={S.label}>Nombre de la Institución ({institucionTipo || 'CEBA/CETPRO'}) *</label>
                  <input 
                    value={institucionNombre} 
                    onChange={e => { 
                      setInstitucionNombre(e.target.value); 
                      setShowSuggestions(true); 
                    }} 
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={`Ej: ${institucionTipo || 'CEBA'} "República de Panamá"`} 
                    style={S.input} 
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        maxHeight: 180,
                        overflowY: "auto",
                        background: C.white,
                        border: `1px solid ${C.g200}`,
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                        borderRadius: 4,
                        marginTop: 2
                      }}
                    >
                      {suggestions.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => handleSelectInstitution(item)}
                          style={{ 
                            padding: "8px 12px", 
                            cursor: "pointer", 
                            fontSize: 12.5, 
                            borderBottom: `1px solid ${C.g100}`,
                            background: C.white,
                            color: C.navy1,
                            textAlign: "left"
                          }}
                          onMouseEnter={e => e.target.style.background = C.g50}
                          onMouseLeave={e => e.target.style.background = C.white}
                        >
                          <strong>{item.nombre}</strong> {item.distrito ? `— ${item.distrito}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {programaFinal === 'ETP' && (
                  <div>
                    <label style={S.label}>Código Modular *</label>
                    <input value={codigoModular} onChange={e => setCodigoModular(e.target.value)} placeholder="Código Modular CETPRO" style={S.input} />
                  </div>
                )}

                {programaFinal === 'EBA' && (
                  <>
                    <div>
                      <label style={S.label}>Código Modular Inicial-Intermedio *</label>
                      <input value={codigoModularInicialIntermedio} onChange={e => setCodigoModularInicialIntermedio(e.target.value)} placeholder="Código Modular Inicial-Intermedio" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Código Modular Avanzado *</label>
                      <input value={codigoModularAvanzado} onChange={e => setCodigoModularAvanzado(e.target.value)} placeholder="Código Modular Avanzado" style={S.input} />
                    </div>
                  </>
                )}

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
                  <label style={S.label}>Fecha del Monitoreo *</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={S.input} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={S.label}>Hora de Inicio</label>
                    <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Hora de Fin</label>
                    <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Duración</label>
                    <input value={calcDuracion(horaInicio, horaFin)} disabled style={{ ...S.input, background: C.g100 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 2: DOCENTES MONITOREADOS ══ */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
                Paso 2 — Personal Docente Monitoreado
              </h3>
              <p style={{ color: C.g500, fontSize: "0.82rem", marginBottom: 20 }}>
                Agregue los docentes que han sido acompañados en esta visita de monitoreo a la IE. Complete su ficha digital u OCR y sus firmas táctiles correspondientes.
              </p>

              {docentes.length === 0 ? (
                <div style={{ padding: 40, border: `2px dashed ${C.g200}`, borderRadius: 10, textAlign: 'center', background: C.g50 }}>
                  <Icon name="folder" size={40} color={C.g300} style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13, color: C.g500, margin: '0 0 16px' }}>Aún no se han registrado docentes para esta visita.</p>
                  <button type="button" onClick={handleAddDocenteOpen} style={S.btn(C.navy4, C.white, C.navy5)}>
                    + Agregar Docente Monitoreado
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 20 }}>
                    {docentes.map((doc, idx) => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8, padding: '12px 18px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy1 }}>{doc.nombre || 'Docente sin nombre'}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.g500 }}>
                            DNI: {doc.dni || '—'} | Área: {doc.datosSesion?.moduloFormativo || doc.datosSesion?.areaCurricular || '—'}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: C.navy3 }}>
                            Rúbricas: {getNivelesIndividualesText(doc, programaFinal)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => handleExportFichaPDF(doc)} style={S.btn(C.white, C.navy3, C.g200)} title="Descargar Ficha individual del docente en PDF">
                            <Icon name="download" size={12} /> PDF
                          </button>
                          <button type="button" onClick={() => handleEditDocenteOpen(idx)} style={S.btn(C.white, C.navy3, C.g200)}>
                            Editar
                          </button>
                          <button type="button" onClick={() => handleRemoveDocente(idx)} style={S.btn(C.redBg, C.red, C.redBorder)}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleAddDocenteOpen} style={S.btn(C.navy4, C.white, C.navy5)}>
                    + Agregar Otro Docente
                  </button>
                </div>
              )}

              {/* Editing Docente Modal / Slideover */}
              {editingDocente && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <div style={{ background: C.white, borderRadius: 12, width: '100%', maxWidth: 750, maxHeight: '90vh', overflow: 'auto', padding: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.g200}`, paddingBottom: 12, marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy3 }}>
                        {currentDocenteIdx !== null ? 'Editar Ficha y Datos del Docente' : 'Registrar Nuevo Docente'}
                      </h4>
                      <button type="button" onClick={() => setEditingDocente(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.g500 }}><Icon name="x" size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: `1px solid ${C.g200}`, paddingBottom: 8 }}>
                      {['datos', 'ocr'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setDocenteModalTab(tab)}
                          style={{
                            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none',
                            background: docenteModalTab === tab ? C.navy3 : 'transparent',
                            color: docenteModalTab === tab ? C.white : C.g500,
                            cursor: 'pointer'
                          }}
                        >
                          {tab === 'datos' ? '1. Datos & Ficha Digital' : '2. Cargar Ficha PDF (OCR)'}
                        </button>
                      ))}
                    </div>

                    {docenteModalTab === 'datos' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={S.label}>Apellidos y Nombres del Docente *</label>
                            <input value={editingDocente.nombre || ''} onChange={e => handleDocenteFieldChange('nombre', e.target.value)} style={S.input} placeholder="Nombres del docente..." />
                          </div>
                          <div>
                            <label style={S.label}>DNI *</label>
                            <input value={editingDocente.dni || ''} onChange={e => handleDocenteFieldChange('dni', e.target.value)} style={S.input} maxLength={8} placeholder="8 dígitos..." />
                          </div>
                          <div>
                            <label style={S.label}>Teléfono</label>
                            <input value={editingDocente.telefono || ''} onChange={e => handleDocenteFieldChange('telefono', e.target.value)} style={S.input} />
                          </div>
                          <div>
                            <label style={S.label}>Correo Electrónico</label>
                            <input value={editingDocente.correo || ''} onChange={e => handleDocenteFieldChange('correo', e.target.value)} style={S.input} type="email" />
                          </div>
                        </div>
                        
                        {programaFinal === 'ETP' ? (
                          <FichaDigitalFormETP data={editingDocente.ficha} onChange={handleEditingDocenteFichaChange} />
                        ) : (
                          <FichaDigitalForm data={editingDocente.ficha} onChange={handleEditingDocenteFichaChange} programa={programaFinal} />
                        )}
                      </div>
                    )}

                    {docenteModalTab === 'ocr' && (
                      <div>
                        <div style={{ border: `2px dashed ${ocrLoading ? C.navy5 : C.g300}`, borderRadius: 10, padding: "30px 20px", textAlign: "center", background: ocrLoading ? `${C.navy5}08` : C.g50, cursor: ocrLoading ? "wait" : "pointer", marginBottom: 16 }}
                          onClick={() => !ocrLoading && document.getElementById('docente-file-input')?.click()}>
                          <Icon name="upload" size={28} color={ocrLoading ? C.navy5 : C.g400} />
                          <p style={{ color: C.g500, fontSize: "0.85rem", margin: "10px 0 0" }}>
                            {ocrLoading ? "Procesando OCR por IA..." : docenteFile ? <><Icon name="check" size={12} color={C.green} /> {docenteFile.name}</> : "Subir ficha escaneada (PDF/imagen) para este docente"}
                          </p>
                          <input id="docente-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                            onChange={e => { if (e.target.files[0]) handleDocenteFichaUpload(e.target.files[0]); }} />
                        </div>
                        {ocrLoading && (
                          <ProgresoIA porcentaje={ocrProgress.percent} estado={ocrProgress.status} detail={ocrProgress.detail} />
                        )}
                      </div>
                    )}

                    <div style={{ borderTop: `1px solid ${C.g200}`, paddingTop: 16, marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button type="button" onClick={() => setEditingDocente(null)} style={S.btn(C.white, C.g500, C.g300)}>
                        Cancelar
                      </button>
                      <button type="button" onClick={handleSaveDocenteInList} style={S.btn(C.navy4, C.white, C.navy5)}>
                        Guardar Docente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PASO 3: ACTA CONSOLIDADA ══ */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>
                Paso 3 — Acta Consolidada de Monitoreo y Acompañamiento
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Hora de Cierre del Acta *</label>
                  <input type="time" value={actaHoraCierre} onChange={e => setActaHoraCierre(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Especialista DNI *</label>
                  <input value={especialistaDNI} onChange={e => setEspecialistaDNI(e.target.value)} style={S.input} maxLength={8} placeholder="8 dígitos..." />
                </div>
                <div>
                  <label style={S.label}>Director DNI *</label>
                  <input value={directorDNI} onChange={e => setDirectorDNI(e.target.value)} style={S.input} maxLength={8} placeholder="8 dígitos..." />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Observaciones del Acta</label>
                <textarea value={actaObservaciones} onChange={e => setActaObservaciones(e.target.value)} style={S.textarea} placeholder="Escriba aquí observaciones del acta..." />
              </div>

              {/* v30: IV. COMPROMISOS Y ACUERDOS DE MEJORA CONTINUA (Generales y Editables) */}
              <div style={{ ...S.card, marginBottom: 20, padding: 16 }}>
                <label style={{ ...S.label, fontWeight: 700, marginBottom: 10, display: 'block' }}>
                  IV. COMPROMISOS Y ACUERDOS DE MEJORA CONTINUA (Generales de la Visita)
                </label>
                <p style={{ fontSize: 12, color: C.g500, margin: '0 0 12px 0' }}>
                  Defina los acuerdos generales de esta visita de monitoreo. Se incluirán de forma numerada en el Acta de Monitoreo.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {actaCompromisosGenerales.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 'bold', color: C.navy3, width: 20 }}>{idx + 1}.</span>
                      <input
                        value={item}
                        onChange={e => {
                          const newComps = [...actaCompromisosGenerales];
                          newComps[idx] = e.target.value;
                          setActaCompromisosGenerales(newComps);
                        }}
                        style={{ ...S.input, flex: 1 }}
                        placeholder={`Compromiso general ${idx + 1}...`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newComps = actaCompromisosGenerales.filter((_, i) => i !== idx);
                          setActaCompromisosGenerales(newComps);
                        }}
                        style={{
                          background: C.white,
                          border: `1px solid ${C.red}`,
                          color: C.red,
                          borderRadius: 6,
                          width: 36,
                          height: 36,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar compromiso"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActaCompromisosGenerales([...actaCompromisosGenerales, ''])}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.navy5}`,
                    color: C.navy5,
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="plus" size={12} /> Agregar Compromiso General
                </button>
              </div>

              {/* Digital tactile signature pads for monitor and director */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <FirmaDigital
                  value={firmaMonitorDataUrl}
                  onChange={setFirmaMonitorDataUrl}
                  label="Firma Táctil del Especialista Monitor"
                />
                <FirmaDigital
                  value={firmaDirectorDataUrl}
                  onChange={setFirmaDirectorDataUrl}
                  label="Firma Táctil del Director / Coordinador"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={handleExportActaPDF} style={S.btn(C.navy4, C.white, C.navy5)}>
                  <Icon name="download" size={14} /> Descargar Acta Consolidada (PDF)
                </button>
              </div>
            </div>
          )}

          {/* ══ PASO 4: INFORME + OFICIO (WORD) ══ */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>
                Paso 4 — Generación de Informe y Oficio Consolidado (PDF)
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Número de Documento (Correlativo)</label>
                  <input value={informeNumero} onChange={e => setInformeNumero(e.target.value)} style={S.input} placeholder="Ej: 0027" />
                </div>
                <div>
                  <label style={S.label}>Enlace OneDrive de Evidencias</label>
                  <input value={linkEvidencias} onChange={e => setLinkEvidencias(e.target.value)} style={S.input} placeholder="https://onedrive.live.com/..." />
                </div>
              </div>

              {/* Gen buttons */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button onClick={handleGenerarInforme} disabled={informeLoading} style={S.btn(C.navy4, C.white, C.navy5)}>
                  {informeLoading ? 'Generando Informe...' : 'Generar Informe con IA'}
                </button>
                <button onClick={handleGenerarOficio} disabled={oficioLoading} style={S.btn(C.gold2, C.white, C.gold1)}>
                  {oficioLoading ? 'Generando Oficio...' : 'Generar Oficio con IA'}
                </button>
              </div>

              {/* Progress visualizers */}
              {informeLoading && <ProgresoIA porcentaje={informeProgress.percent} estado={informeProgress.status} />}
              {oficioLoading && <ProgresoIA porcentaje={oficioProgress.percent} estado={oficioProgress.status} />}

              {/* Editor visual block */}
              {informeData && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Previsualización del Informe</h4>
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
                      <label style={S.label}>Análisis (párrafo consolidado)</label>
                      <textarea value={informeData.analisis?.join('\n') || ''} onChange={e => setInformeData({ ...informeData, analisis: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 180 }} />
                    </div>
                    <button type="button" onClick={handleExportInformePDF} style={S.btn(C.green, C.white, C.green)}>
                      <Icon name="download" size={14} /> Descargar Informe (PDF)
                    </button>
                  </div>
                </div>
              )}

              {oficioData && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Previsualización del Oficio</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={S.label}>Asunto</label>
                      <input value={oficioData.asunto || ''} onChange={e => setOficioData({ ...oficioData, asunto: e.target.value })} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Cuerpo del Oficio</label>
                      <textarea value={oficioData.cuerpo?.join('\n') || ''} onChange={e => setOficioData({ ...oficioData, cuerpo: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 180 }} />
                    </div>
                    <button type="button" onClick={handleExportOficioPDF} style={S.btn(C.green, C.white, C.green)}>
                      <Icon name="download" size={14} /> Descargar Oficio (PDF)
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
              style={{ ...S.btn(canGoNext() ? C.navy4 : C.g200, canGoNext() ? C.white : C.g500, canGoNext() ? C.navy5 : C.g200) }}
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
      {/* ── Hidden Recharts for PDF capture (Addendum v28) ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {/* Chart 1: Matriculados vs. Presentes */}
        <div ref={chartAttendanceRef} style={{ width: 600, height: 320, background: '#fff', padding: 16 }}>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Asistencia de Estudiantes — Matriculados vs. Presentes</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={docentes.map(d => ({
              name: (d.nombre || 'Docente').split(' ').slice(0, 2).join(' '),
              Matriculados: Number(d.datosSesion?.matriculados) || 0,
              Presentes: Number(d.datosSesion?.presentes) || 0
            }))} margin={{ top: 10, right: 20, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" tick={{ fontSize: 10 }} height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="Matriculados" fill="#2563A0" radius={[4,4,0,0]}>
                <LabelList dataKey="Matriculados" position="top" style={{ fontSize: 10 }} />
              </Bar>
              <Bar dataKey="Presentes" fill="#15803D" radius={[4,4,0,0]}>
                <LabelList dataKey="Presentes" position="top" style={{ fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Level Distribution per R (frequency, not averaged) */}
        <div ref={chartLevelsRef} style={{ width: 600, height: 320, background: '#fff', padding: 16 }}>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Distribución de Niveles Alcanzados por Rúbrica</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(() => {
              const isEtp = programaFinal === 'ETP';
              const result = [];
              for (let r = 0; r < 5; r++) {
                const name = isEtp
                  ? ["Planifica", "Involucra", "Procedimientos", "Acompaña", "Clima"][r]
                  : ["Involucra", "Razonamiento", "Evalúa", "Respeto", "Regula"][r];
                const counts = { name, 'Nivel I': 0, 'Nivel II': 0, 'Nivel III': 0, 'Nivel IV': 0 };
                docentes.forEach(d => {
                  let lvl;
                  if (isEtp) {
                    lvl = d.ficha?.rubricasETP?.[r]?.nivel;
                  } else {
                    lvl = d.ficha?.instrumento1?.criterios?.[r]?.nivel;
                  }
                  if (lvl === 1) counts['Nivel I']++;
                  else if (lvl === 2) counts['Nivel II']++;
                  else if (lvl === 3) counts['Nivel III']++;
                  else if (lvl === 4) counts['Nivel IV']++;
                });
                result.push(counts);
              }
              return result;
            })()} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} label={{ value: 'N° Docentes', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Nivel I" stackId="a" fill="#B91C1C">
                <LabelList dataKey="Nivel I" position="inside" formatter={(val) => val > 0 ? val : ''} style={{ fontSize: 9, fill: '#fff', fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="Nivel II" stackId="a" fill="#B45309">
                <LabelList dataKey="Nivel II" position="inside" formatter={(val) => val > 0 ? val : ''} style={{ fontSize: 9, fill: '#fff', fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="Nivel III" stackId="a" fill="#2563A0">
                <LabelList dataKey="Nivel III" position="inside" formatter={(val) => val > 0 ? val : ''} style={{ fontSize: 9, fill: '#fff', fontWeight: 'bold' }} />
              </Bar>
              <Bar dataKey="Nivel IV" stackId="a" fill="#15803D">
                <LabelList dataKey="Nivel IV" position="inside" formatter={(val) => val > 0 ? val : ''} style={{ fontSize: 9, fill: '#fff', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
