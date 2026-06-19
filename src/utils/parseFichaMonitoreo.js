import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdf.js worker URL for Vite bundling
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

const ROMAN_MAP = { I: 1, II: 2, III: 3, IV: 4 };
const LETTER_MAP = { a: 1, b: 2, c: 3, d: 4 };

/**
 * Extracts raw text from a PDF File object.
 * @param {File} file 
 * @returns {Promise<string>}
 */
export async function extraerTextoPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let texto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texto += content.items.map(it => it.str).join('\n') + '\n';
  }
  return texto;
}

/**
 * Helper to normalize string types to integers safely.
 */
function toInt(val) {
  if (!val) return null;
  const cleaned = String(val).toLowerCase().trim();
  if (cleaned === 'null' || cleaned === '') return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * Helper to parse indicators and check for letter vs Roman numeral mismatches.
 */
function parseNivel(raw, fieldName, warnings) {
  if (!raw) {
    return { raw: '', letra: null, nivel: null, mismatch: false };
  }
  const cleanRaw = String(raw).trim();
  
  // Extract option letter (a-d)
  const letterMatch = cleanRaw.match(/^([a-d])\)/i);
  const letra = letterMatch ? letterMatch[1].toLowerCase() : null;
  
  // Extract Roman numeral (I-IV)
  const romanMatch = cleanRaw.match(/Nivel\s+(IV|III|II|I)\b/i);
  let romanNum = null;
  if (romanMatch) {
    const romanUpper = romanMatch[1].toUpperCase();
    romanNum = ROMAN_MAP[romanUpper] || null;
  }
  
  if (!letra && !romanNum) {
    return { raw: cleanRaw, letra: null, nivel: null, mismatch: false };
  }
  
  const expectedNum = letra ? LETTER_MAP[letra] : null;
  const mismatch = (expectedNum && romanNum && expectedNum !== romanNum) ? true : false;
  
  if (mismatch && romanMatch) {
    warnings.push(`Indicador ${fieldName}: la letra (${letra}) no coincide con el nivel (${romanMatch[1]}); se usó Nivel ${romanMatch[1]}.`);
  }
  
  const nivelVal = romanNum || expectedNum;
  
  return {
    raw: cleanRaw,
    letra,
    nivel: nivelVal,
    mismatch
  };
}

/**
 * Helper to parse boolean inputs (e.g. Yes/No).
 */
function parseBoolean(val) {
  if (!val) return false;
  const lower = String(val).toLowerCase();
  return lower.includes('si') || lower.includes('sí') || lower.includes('true');
}

/**
 * Extracts free-form text blocks like Compromisos, Comentarios, etc.
 */
function extractFreeFormBlocks(text) {
  const results = {
    compromisos: null,
    comentarios: null,
    observaciones: null,
    recomendaciones: null,
    fortalezas: null,
    aspectosAMejorar: null
  };

  const searchLabels = [
    { label: "COMPROMISOS", key: "compromisos" },
    { label: "COMENTARIOS", key: "comentarios" },
    { label: "OBSERVACIONES", key: "observaciones" },
    { label: "RECOMENDACIONES", key: "recomendaciones" },
    { label: "FORTALEZAS", key: "fortalezas" },
    { label: "ASPECTOS A MEJORAR", key: "aspectosAMejorar" }
  ];

  const positions = [];
  searchLabels.forEach(({ label, key }) => {
    const regex = new RegExp(`\\b${label}\\b`, 'i');
    const match = text.match(regex);
    if (match && match.index !== undefined) {
      positions.push({ key, index: match.index, length: match[0].length });
    }
  });

  positions.sort((a, b) => a.index - b.index);

  for (let i = 0; i < positions.length; i++) {
    const current = positions[i];
    const start = current.index + current.length;
    const end = (i + 1 < positions.length) ? positions[i + 1].index : text.length;
    
    let blockText = text.substring(start, end).trim();
    blockText = blockText.replace(/^[:\s\-*]+/g, '').trim();
    if (blockText) {
      results[current.key] = blockText;
    }
  }

  return results;
}

/**
 * Parses date format DD/MM/YYYY into YYYY-MM-DD.
 */
function formatFechaISO(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  return null;
}

/**
 * Creates a deterministic slug ID.
 */
export function generateSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\-]/g, "-")   // Replace non-alphanumeric with hyphen
    .replace(/-+/g, "-")             // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "");        // Trim leading/trailing hyphens
}

/**
 * Extracts performance level (Roman or Arabic) from an ETP Rubric block.
 * Handles multiline layout.
 */
function extractETPNivel(text, rubricKey) {
  const rubricRegex = new RegExp(`\\b${rubricKey}\\b([\\s\\S]*?)(?:\\bR[1-5]\\b|\\b4\\.\\s+RETROALIMENTACION|\\b4\\.\\s+RETROALIMENTACIÓN|$)`, 'i');
  const match = text.match(rubricRegex);
  if (match) {
    const block = match[1];
    const levelMatch = block.match(/Nivel\s*de\s*logro:\s*[\r\n]*\s*Nivel\s*([0-9a-fivx]+)/i);
    if (levelMatch) {
      const val = levelMatch[1].trim().toUpperCase();
      if (ROMAN_MAP[val]) return ROMAN_MAP[val];
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= 4) return num;
    }
  }
  return null;
}

/**
 * Extracts multiple commitments from ETP Section 4.
 */
function extractETPCompromisos(text) {
  const match = text.match(/4\.\s+RETROALIMENTACI[OÓ]N Y COMPROMISOS DE MEJORA:([\s\S]+)$/i);
  if (match) {
    const secText = match[1];
    const compromisos = [];
    const regMatches = secText.matchAll(/Registra:\s*([^\n]+(?:\n(?!\bSelecciona\b|\bRegistra\b)[^\n]+)*)/gi);
    for (const m of regMatches) {
      compromisos.push(m[1].trim());
    }
    return compromisos.length > 0 ? compromisos.join(" | ") : null;
  }
  return null;
}

/**
 * Special parser for ETP (CETPRO) PDF structure.
 * Robust against multiline layout with newlines and spaces.
 */
function parsearFichaETP(text, archivoNombre, warnings) {
  // 1. Parse Cabecera
  let docenteNombre = null;
  const docenteFilaMatch = text.match(/Docente\s*\(fila\):\s*[\r\n]*\s*(\d+)\s*-\s*([^\r\n]+)/i);
  if (docenteFilaMatch) {
    docenteNombre = docenteFilaMatch[2].trim();
  } else {
    const docSecMatch = text.match(/Datos del docente monitoreado[\s\S]*?Apellidos y nombres:\s*[\r\n]*\s*([^\r\n]+)/i);
    if (docSecMatch) docenteNombre = docSecMatch[1].trim();
  }

  let dni = null;
  const DniMatch = text.match(/Datos del docente monitoreado[\s\S]*?DNI:\s*[\r\n]*\s*(\d+)/i);
  if (DniMatch) {
    dni = DniMatch[1].trim();
  } else {
    const docFilaDni = text.match(/Docente\s*\(fila\):\s*[\r\n]*\s*(\d+)/i);
    if (docFilaDni) dni = docFilaDni[1].trim();
  }

  let institucionNombre = null;
  const cetproMatch = text.match(/Institución\s*\/\s*CETPRO:\s*[\r\n]*\s*([^\r\n]+)/i);
  if (cetproMatch) {
    institucionNombre = cetproMatch[1].trim();
  } else {
    const cetproSecMatch = text.match(/Datos del CETPRO[\s\S]*?Nombre:\s*[\r\n]*\s*([^\r\n]+)/i);
    if (cetproSecMatch) institucionNombre = cetproSecMatch[1].trim();
  }

  let institucionCodigo = null;
  const codModMatch = text.match(/(?:Cód\.|Código)\s*modular:\s*[\r\n]*\s*(\d+)/i);
  if (codModMatch) {
    institucionCodigo = codModMatch[1].trim();
  } else {
    const codModSecMatch = text.match(/Datos del CETPRO[\s\S]*?Código modular:\s*[\r\n]*\s*(\d+)/i);
    if (codModSecMatch) institucionCodigo = codModSecMatch[1].trim();
  }

  let monitorNombre = null;
  const monitorMatch = text.match(/Datos del monitor \(Especialista o Director\)[\s\S]*?Apellidos y nombres:\s*[\r\n]*\s*([^\r\n]+)/i);
  if (monitorMatch) monitorNombre = monitorMatch[1].trim();

  const ugelMatch = text.match(/UGEL:\s*[\r\n]*\s*([^\r\n]+)/i);
  const ugel = ugelMatch ? ugelMatch[1].trim() : null;

  let fechaEjecucion = null;
  const fechaMatch = text.match(/Fecha de observación:\s*[\r\n]*\s*([\d\-]+)/i);
  if (fechaMatch) {
    fechaEjecucion = fechaMatch[1].trim();
  }
  const fechaEjecucionISO = fechaEjecucion;

  const visita = 1;
  const estado = "Ejecutado";

  // Validate critical headers
  if (!docenteNombre) warnings.push("No se pudo extraer el nombre del docente.");
  if (!institucionCodigo) warnings.push("No se pudo extraer el código modular de la IE/CETPRO.");
  if (!fechaEjecucionISO) warnings.push("No se pudo procesar la fecha de ejecución.");

  // 2. Session Data
  const ciclo = (text.match(/Ciclo:\s*[\r\n]*\s*([^\r\n]+)/i) || [])[1]?.trim() || null;
  const programaEstudio = (text.match(/Programa de estudio:\s*[\r\n]*\s*([^\r\n]+)/i) || [])[1]?.trim() || null;
  const modulo = (text.match(/Módulo:\s*[\r\n]*\s*([^\r\n]+)/i) || [])[1]?.trim() || null;
  const unidadDidactica = (text.match(/Unidad didáctica:\s*[\r\n]*\s*([^\r\n]+)/i) || [])[1]?.trim() || null;
  const actividad = (text.match(/Nombre de la actividad:\s*[\r\n]*\s*([^\r\n]+)/i) || [])[1]?.trim() || null;
  
  const estudiantesMatriculados = toInt((text.match(/Estudiantes matriculados:\s*[\r\n]*\s*(\d+)/i) || [])[1]);
  const estudiantesAsistentes = toInt((text.match(/Estudiantes presentes:\s*[\r\n]*\s*(\d+)/i) || [])[1]);
  const turno = (text.match(/Turno:\s*[\r\n]*\s*([^\r\n]+)/i) || [])[1]?.trim() || null;

  // 3. Rubrics R1 - R5
  const r1Lvl = extractETPNivel(text, 'R1');
  const r2Lvl = extractETPNivel(text, 'R2');
  const r3Lvl = extractETPNivel(text, 'R3');
  const r4Lvl = extractETPNivel(text, 'R4');
  const r5Lvl = extractETPNivel(text, 'R5');

  const desempeno = {
    involucraEstudiantes: { raw: r2Lvl ? `Nivel ${r2Lvl}` : '', letra: null, nivel: r2Lvl, mismatch: false },
    promueveRazonamiento: { raw: r3Lvl ? `Nivel ${r3Lvl}` : '', letra: null, nivel: r3Lvl, mismatch: false },
    evaluaProgreso: { raw: r4Lvl ? `Nivel ${r4Lvl}` : '', letra: null, nivel: r4Lvl, mismatch: false },
    ambienteRespeto: { raw: r5Lvl ? `Nivel ${r5Lvl}` : '', letra: null, nivel: r5Lvl, mismatch: false },
    regulaComportamiento: { raw: r1Lvl ? `Nivel ${r1Lvl}` : '', letra: null, nivel: r1Lvl, mismatch: false }
  };

  const planificacion = {
    presentaDocumentacion: false,
    planificaConUso: null,
    sesionEjecutada: false,
    planificacionAnual: { raw: '', letra: null, nivel: null, mismatch: false },
    situacionSignificativa: { raw: '', letra: null, nivel: null, mismatch: false },
    secuenciaMetodologica: { raw: '', letra: null, nivel: null, mismatch: false },
    metodologiaActiva: { raw: '', letra: null, nivel: null, mismatch: false },
    usoPedagogicoRecursos: { raw: '', letra: null, nivel: null, mismatch: false }
  };

  // 4. Calculations
  const desVals = Object.values(desempeno).map(d => d.nivel).filter(v => v !== null);
  const promedioDesempeno = desVals.length > 0
    ? parseFloat((desVals.reduce((sum, v) => sum + v, 0) / desVals.length).toFixed(2))
    : 0;

  const promedioPlanificacion = 0;
  const promedioGeneral = promedioDesempeno;

  const rounded = Math.round(promedioGeneral);
  const labels = { 1: "Nivel I", 2: "Nivel II", 3: "Nivel III", 4: "Nivel IV" };
  const nivelGeneralLabel = labels[rounded] || "Nivel I";

  const docIdName = generateSlug(`${institucionCodigo}-${docenteNombre}-${fechaEjecucionISO || fechaEjecucion}-v${visita}`);

  // Free Form Blocks
  const compromisos = extractETPCompromisos(text);

  return {
    id: docIdName || `ficha-etp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    programa: 'ETP',
    plan: ciclo,
    instrumento: programaEstudio,
    visita,
    institucionCodigo,
    institucionNombre,
    monitorNombre,
    docenteNombre,
    fechaProgramacion: fechaEjecucion,
    fechaEjecucion,
    fechaEjecucionISO,
    estado,

    reiACargo: null,
    grado: ciclo,
    seccion: turno,
    areaCurricular: programaEstudio,
    estudiantesMatriculados,
    estudiantesAsistentes,
    estudiantesDiscapacidad: null,

    desempeno,
    cuadernilloMonitoreoRef: modulo,

    planificacion,
    sesionObservadaRef: unidadDidactica,

    compromisos,
    comentarios: null,
    observaciones: null,
    recomendaciones: null,
    fortalezas: null,
    aspectosAMejorar: null,
    seccionesAdicionales: {},

    promedioDesempeno,
    promedioPlanificacion,
    promedioGeneral,
    nivelGeneralLabel,

    advertencias: warnings,
    archivoOrigen: archivoNombre,
    cargadoPor: "",
    cargadoPorUid: ""
  };
}

/**
 * Parses the extracted PDF text into a structured JSON object.
 * @param {string} rawText 
 * @param {string} archivoNombre 
 * @param {string} programa 
 * @returns {object}
 */
export function parsearFicha(rawText, archivoNombre, programa = 'EBA') {
  const warnings = [];
  
  // Normalize whitespaces and line endings
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/  +/g, ' ');

  if (programa === 'ETP') {
    return parsearFichaETP(text, archivoNombre, warnings);
  }

  // 1. Parse Cabecera (EBA)
  const plan = (text.match(/PLAN\s*:\s*(.+)/i) || [])[1]?.trim() || null;
  const instrumento = (text.match(/INSTRUMENTO\s*:\s*(.+)/i) || [])[1]?.trim() || null;
  const monitorNombre = (text.match(/MONITOR\s*:\s*(.+)/i) || [])[1]?.trim() || null;
  const docenteNombre = (text.match(/DOCENTE\s*:\s*(.+)/i) || [])[1]?.trim() || null;
  const fechaProgramacion = (text.match(/FECHA DE PROGRAMACIÓN\s*:\s*(.+)/i) || [])[1]?.trim() || null;
  const fechaEjecucion = (text.match(/FECHA DE EJECUCIÓN\s*:\s*(.+)/i) || [])[1]?.trim() || null;
  const estado = (text.match(/ESTADO\s*:\s*(.+)/i) || [])[1]?.trim() || null;

  const visitaMatch = text.match(/VISITA\s*:\s*(\d+)/i);
  const visita = visitaMatch ? parseInt(visitaMatch[1], 10) : 1;

  const ieMatch = text.match(/INSTITUCIÓN EDUCATIVA:\s*(\d+)\s*-\s*(.+)/i);
  const institucionCodigo = ieMatch ? ieMatch[1].trim() : null;
  const institucionNombre = ieMatch ? ieMatch[2].split('\n')[0].trim() : null;

  const fechaEjecucionISO = formatFechaISO(fechaEjecucion);

  // Validate critical headers (EBA)
  if (!docenteNombre) warnings.push("No se pudo extraer el nombre del docente.");
  if (!institucionCodigo) warnings.push("No se pudo extraer el código modular de la IE.");
  if (!fechaEjecucionISO) warnings.push("No se pudo procesar la fecha de ejecución.");

  // 2. Parse Numbered Items (N.N) pregunta \n - respuesta (EBA)
  const itemMap = {};
  const re = /(\d+\.\d+)\)([\s\S]*?)\n\s*-\s*([^\n]+)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const num = match[1];
    const respuesta = match[3].trim();
    itemMap[num] = respuesta;
  }

  // 3. Structure AR01 (Datos Informativos - EBA)
  const reiACargo = toInt(itemMap['1.1']);
  const grado = itemMap['1.2'] || null;
  const seccion = itemMap['1.3'] || null;
  const areaCurricular = itemMap['1.4'] || null;
  const estudiantesMatriculados = toInt(itemMap['1.5']);
  const estudiantesAsistentes = toInt(itemMap['1.6']);
  const estudiantesDiscapacidad = toInt(itemMap['1.7']);

  // 4. Structure AR02 (Desempeño Docente - EBA)
  const desempeno = {
    involucraEstudiantes: parseNivel(itemMap['2.1'], '2.1', warnings),
    promueveRazonamiento: parseNivel(itemMap['2.2'], '2.2', warnings),
    evaluaProgreso: parseNivel(itemMap['2.3'], '2.3', warnings),
    ambienteRespeto: parseNivel(itemMap['2.4'], '2.4', warnings),
    regulaComportamiento: parseNivel(itemMap['2.5'], '2.5', warnings)
  };
  const cuadernilloMonitoreoRef = itemMap['2.6'] || null;

  // 5. Structure AR03 (Planificación Curricular - EBA)
  const planificacion = {
    presentaDocumentacion: parseBoolean(itemMap['3.1']),
    planificaConUso: itemMap['3.2'] || null,
    sesionEjecutada: parseBoolean(itemMap['3.3']),
    planificacionAnual: parseNivel(itemMap['3.4'], '3.4', warnings),
    situacionSignificativa: parseNivel(itemMap['3.5'], '3.5', warnings),
    secuenciaMetodologica: parseNivel(itemMap['3.6'], '3.6', warnings),
    metodologiaActiva: parseNivel(itemMap['3.7'], '3.7', warnings),
    usoPedagogicoRecursos: parseNivel(itemMap['3.8'], '3.8', warnings)
  };
  const sesionObservadaRef = itemMap['3.9'] || null;

  // 6. Capture Sections >= 4.0 (EBA)
  const seccionesAdicionales = {};
  Object.keys(itemMap).forEach(num => {
    if (!num.startsWith('1.') && !num.startsWith('2.') && !num.startsWith('3.')) {
      seccionesAdicionales[num] = {
        pregunta: "",
        respuesta: itemMap[num]
      };
    }
  });

  // 7. Parse Free Form Blocks (EBA)
  const freeForm = extractFreeFormBlocks(text);

  // 8. Calculations (EBA)
  const desVals = Object.values(desempeno).map(d => d.nivel).filter(v => v !== null);
  const promedioDesempeno = desVals.length > 0
    ? parseFloat((desVals.reduce((sum, v) => sum + v, 0) / desVals.length).toFixed(2))
    : 0;

  const planIndicators = [
    planificacion.planificacionAnual,
    planificacion.situacionSignificativa,
    planificacion.secuenciaMetodologica,
    planificacion.metodologiaActiva,
    planificacion.usoPedagogicoRecursos
  ];
  const planVals = planIndicators.map(p => p.nivel).filter(v => v !== null);
  const promedioPlanificacion = planVals.length > 0
    ? parseFloat((planVals.reduce((sum, v) => sum + v, 0) / planVals.length).toFixed(2))
    : 0;

  const allVals = [...desVals, ...planVals];
  const promedioGeneral = allVals.length > 0
    ? parseFloat((allVals.reduce((sum, v) => sum + v, 0) / allVals.length).toFixed(2))
    : 0;

  const rounded = Math.round(promedioGeneral);
  const labels = { 1: "Nivel I", 2: "Nivel II", 3: "Nivel III", 4: "Nivel IV" };
  const nivelGeneralLabel = labels[rounded] || "Nivel I";

  // Create slug ID (EBA)
  const docIdName = generateSlug(`${institucionCodigo}-${docenteNombre}-${fechaEjecucionISO || fechaEjecucion}-v${visita}`);

  return {
    id: docIdName || `ficha-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    programa,
    plan,
    instrumento,
    visita,
    institucionCodigo,
    institucionNombre,
    monitorNombre,
    docenteNombre,
    fechaProgramacion,
    fechaEjecucion,
    fechaEjecucionISO,
    estado,

    reiACargo,
    grado,
    seccion,
    areaCurricular,
    estudiantesMatriculados,
    estudiantesAsistentes,
    estudiantesDiscapacidad,

    desempeno,
    cuadernilloMonitoreoRef,

    planificacion,
    sesionObservadaRef,

    ...freeForm,
    seccionesAdicionales,

    promedioDesempeno,
    promedioPlanificacion,
    promedioGeneral,
    nivelGeneralLabel,

    advertencias: warnings,
    archivoOrigen: archivoNombre,
    cargadoPor: "",
    cargadoPorUid: ""
  };
}
