/* ═══════════════════════════════════════════════════════════════
   UTILIDADES CÁLCULOS PUROS — JUEGOS FLORALES JFEN 2026
   ═══════════════════════════════════════════════════════════════ */

import { getRubrica } from '../data/juegosFloralesRubricas';

/** Suma del puntaje obtenido en los indicadores */
export function calcularPuntajeBruto(puntajes = {}) {
  let total = 0;
  Object.values(puntajes).forEach(val => {
    if (typeof val === 'number' && val >= 1 && val <= 4) {
      total += val;
    }
  });
  return total;
}

/** Retorna { calificados, total } */
export function contarIndicadoresCalificados(puntajes = {}, rubrica) {
  if (!rubrica || !rubrica.criterios) return { calificados: 0, total: 0 };
  const total = rubrica.criterios.flatMap(c => c.indicadores).length;
  let calificados = 0;
  rubrica.criterios.forEach(c => {
    c.indicadores.forEach(ind => {
      const v = puntajes[ind.id];
      if (typeof v === 'number' && v >= 1 && v <= 4) {
        calificados++;
      }
    });
  });
  return { calificados, total };
}

/** Indica si todos los indicadores de la rúbrica tienen calificación (1-4) */
export function estaCompleta(puntajes = {}, rubrica) {
  const { calificados, total } = contarIndicadoresCalificados(puntajes, rubrica);
  return total > 0 && calificados === total;
}

/** Convierte una cadena "mm:ss" a segundos totales */
export function parseDuracion(duracionStr = "") {
  if (!duracionStr || typeof duracionStr !== 'string') return 0;
  const partes = duracionStr.trim().split(":");
  if (partes.length !== 2) return 0;
  const min = parseInt(partes[0], 10) || 0;
  const seg = parseInt(partes[1], 10) || 0;
  return min * 60 + seg;
}

/** Verifica si la duración ejecutada excede el tiempo máximo permitido */
export function excedeTiempo(duracionStr, tiempoMaximoStr) {
  if (!duracionStr || !tiempoMaximoStr) return false;
  const segEjecutados = parseDuracion(duracionStr);
  const segMaximos = parseDuracion(tiempoMaximoStr);
  return segEjecutados > segMaximos;
}

/** Calcula el puntaje total final (bruto menos penalizaciones, mínimo 0) */
export function calcularPuntajeTotal(puntajeBruto = 0, penalizaciones = []) {
  const sumaPenalizaciones = (penalizaciones || []).reduce((sum, p) => sum + (p.puntos || 0), 0);
  return Math.max(0, puntajeBruto - sumaPenalizaciones);
}

/** Valida documento de identidad (DNI peruano de 8 dígitos o Carné/Cédula de Extranjería de 8 a 12 dígitos) */
export function validarDNI(dni = "") {
  return /^\d{8,12}$/.test(String(dni).trim());
}

/** Convierte un entero a formato ordinal (ej. 1 -> "1.°") */
export function ordinalEs(n) {
  const num = parseInt(n, 10);
  if (isNaN(num)) return `${n}.°`;
  return `${num}.°`;
}

/** Retorna el nombre del mes en minúsculas en español (1-12 o 0-11) */
export function mesEnLetras(numMes) {
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  let idx = parseInt(numMes, 10);
  if (isNaN(idx)) return "";
  if (idx >= 1 && idx <= 12) idx = idx - 1;
  return meses[idx] || "";
}

/** Asigna orden de mérito considerando empates y orden manual si existe */
export function calcularOrdenMerito(filas = []) {
  if (!filas || filas.length === 0) return [];

  // Si hay orden manual asignado por el jurado para resolver empates, respetarlo
  const copia = [...filas];
  copia.sort((a, b) => {
    if (a.total !== b.total) {
      return b.total - a.total; // descendente por total
    }
    if (a.ordenManual != null && b.ordenManual != null) {
      return a.ordenManual - b.ordenManual;
    }
    return 0;
  });

  // Asignar puestos
  let puestoActual = 1;
  for (let i = 0; i < copia.length; i++) {
    if (i > 0 && copia[i].total < copia[i - 1].total) {
      puestoActual = i + 1;
    }
    copia[i].puesto = puestoActual;
  }
  return copia;
}

/** Detecta empates en el Top 3 (puestos 1, 2, 3) excluyendo puntaje cero (0 ptos / NSP / extemporáneo) */
export function detectarEmpatesTop3(filas = []) {
  if (!filas || filas.length < 2) return [];

  const ordenadas = calcularOrdenMerito(filas);
  const puestosEmpatados = new Set();

  for (let i = 0; i < ordenadas.length; i++) {
    const f1 = ordenadas[i];
    // Excluir si el puesto es mayor a 3 o si el puntaje total es 0 o nulo
    if (f1.puesto > 3 || !f1.total || f1.total <= 0) continue;

    for (let j = i + 1; j < ordenadas.length; j++) {
      const f2 = ordenadas[j];
      if (!f2.total || f2.total <= 0) continue;

      if (f1.total === f2.total && (f1.puesto <= 3 || f2.puesto <= 3)) {
        puestosEmpatados.add(f1.puesto);
      }
    }
  }

  return Array.from(puestosEmpatados).sort((a, b) => a - b);
}

/** Construye las filas del formato consolidado A10 desde participantes y evaluaciones */
export function construirConsolidadoA10(participantes = [], evaluaciones = []) {
  const evalMap = {}; // key: `${participanteId}__${juradoNum}`
  evaluaciones.forEach(ev => {
    const jNum = ev.jurado?.numeroJurado || 1;
    evalMap[`${ev.participanteId}__${jNum}`] = ev;
  });

  const filas = participantes.map(p => {
    const ev1 = evalMap[`${p.id}__1`];
    const ev2 = evalMap[`${p.id}__2`];
    const ev3 = evalMap[`${p.id}__3`];

    const j1Score = ev1 && ev1.estado === "firmada" ? ev1.puntajeTotal : null;
    const j2Score = ev2 && ev2.estado === "firmada" ? ev2.puntajeTotal : null;
    const j3Score = ev3 && ev3.estado === "firmada" ? ev3.puntajeTotal : null;

    const juradosFirmados = [j1Score, j2Score, j3Score].filter(v => v !== null);
    const total = juradosFirmados.reduce((sum, v) => sum + v, 0);

    const inst = p.institucion || {};
    const dreUgel = `${inst.dre || 'DRE LIMA METROPOLITANA'} / ${inst.ugel || 'UGEL 03'}`;

    return {
      participanteId: p.id,
      codigoParticipante: p.codigoParticipante || p.codigo || p.id,
      ordenPresentacion: p.ordenPresentacion || 0,
      dreUgel,
      institucion: inst.nombre || p.institucionNombre || p.iiee || 'I. E. no registrada',
      tituloObra: p.tituloObra || p.titulo || '',
      seudonimo: p.seudonimo || '',
      urlTrabajo: p.urlTrabajo || p.enlace || '',
      jurado1: j1Score,
      jurado2: j2Score,
      jurado3: j3Score,
      total: juradosFirmados.length === 3 ? total : null,
      promedio: juradosFirmados.length === 3 ? Number((total / 3).toFixed(2)) : null,
      completo: juradosFirmados.length === 3,
      puesto: null,
      ordenManual: p.ordenManual != null ? p.ordenManual : null
    };
  });

  // Si no hay puestos asignados manualmente, ordenar por orden de presentación si está disponible
  filas.sort((a, b) => {
    if (a.total !== null && b.total !== null && a.total !== b.total) {
      return b.total - a.total;
    }
    if (a.total !== null && b.total === null) return -1;
    if (a.total === null && b.total !== null) return 1;
    return (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0);
  });

  return calcularOrdenMerito(filas);
}

/** Construye la estructura básica para el Anexo A11 a partir del A10 */
export function construirActaA11(consolidado = {}) {
  const filas = (consolidado.filas || []).filter(f => f.puesto && f.puesto <= 3);
  filas.sort((a, b) => a.puesto - b.puesto);

  const resultados = filas.map(f => ({
    puesto: f.puesto,
    ordenMerito: ordinalEs(f.puesto),
    institucion: f.institucion,
    ugel: consolidado.ugel || "UGEL 03",
    dre: consolidado.dre || "DRE LIMA METROPOLITANA",
    nombreTrabajo: f.tituloObra ? f.tituloObra : (f.seudonimo ? `(seudónimo: ${f.seudonimo})` : "Sin título registrado"),
    puntajeTotal: f.total
  }));

  return {
    consolidadoId: consolidado.id,
    eventoId: consolidado.eventoId || "JFEN-2026",
    etapa: consolidado.etapa || "UGEL",
    disciplinaId: consolidado.disciplinaId,
    categoria: consolidado.categoria,
    region: consolidado.region || "Lima",
    provincia: consolidado.provincia || "Lima",
    distrito: consolidado.distrito || "Pueblo Libre",
    fecha: consolidado.fecha || new Date().toISOString().slice(0, 10),
    hora: "17:00",
    jurados: consolidado.jurados || [],
    resultados,
    incluirPuntaje: false,
    estado: "borrador"
  };
}

export const MAPA_DISCIPLINAS_SICE = {
  "teatro": "teatro",
  "baile urbano": "baile_urbano",
  "danza tradicional": "danza_tradicional",
  "canto solista": "canto_solista",
  "ensamble instrumental": "ensamble_instrumental",
  "banda escolar de musica": "banda_escolar",
  "pintura": "pintura",
  "escultura": "escultura",
  "fotografia": "fotografia",
  "arte tradicional": "arte_tradicional",
  "poesia": "poesia",
  "historietas interactivas": "historietas_interactivas",
  "corto audiovisual": "corto_audiovisual"
};

/** Normalizador tolerante para matching */
function norm(str) {
  return String(str || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

/** Parsea un archivo Excel .xls o .xlsx exportado de SICE buscando dinámicamente el encabezado Nro */
export function parsearExcelSICE(aoaRows = []) {
  if (!aoaRows || aoaRows.length === 0) {
    return { error: "El archivo está vacío.", registros: [], noReconocidas: [] };
  }

  // Buscar fila de encabezado donde alguna celda contenga "Nro"
  let headerIndex = -1;
  for (let i = 0; i < Math.min(aoaRows.length, 30); i++) {
    const row = aoaRows[i] || [];
    const hasNro = row.some(cell => norm(cell) === "nro" || norm(cell).startsWith("nro"));
    if (hasNro) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return { error: "No se encontró la fila de encabezado 'Nro' en el archivo.", registros: [], noReconocidas: [] };
  }

  const dataRows = aoaRows.slice(headerIndex + 1);
  const registros = [];
  const noReconocidasSet = new Set();

  dataRows.forEach((row, rIdx) => {
    if (!row || row.length === 0) return;
    const nro = row[0] || row[1];
    if (!nro && !row[7]) return; // saltar filas vacías

    const dre = String(row[2] || row[3] || "DRE LIMA METROPOLITANA").trim();
    const ugel = String(row[6] || row[7] || "UGEL 03").trim();
    const nombreIE = String(row[7] || row[8] || "").trim();
    let catRaw = String(row[8] || row[9] || "").trim();
    let cat = catRaw.replace(/^Categoría\s+/i, "").trim().toUpperCase();

    const discRaw = String(row[9] || row[10] || "").trim();
    const discNorm = norm(discRaw);
    const discId = MAPA_DISCIPLINAS_SICE[discNorm] || null;

    if (!discId && discRaw) {
      noReconocidasSet.add(discRaw);
    }

    const tituloObra = String(row[13] || row[14] || "").trim();
    const seudonimo = String(row[16] || row[17] || "").trim();
    const urlTrabajo = String(row[17] || row[18] || "").trim();

    if (nombreIE) {
      registros.push({
        codigo: `SICE-IMP-${Date.now()}-${rIdx}`,
        iiee: nombreIE,
        categoria: cat,
        disciplinaId: discId,
        disciplinaRaw: discRaw,
        tituloObra,
        seudonimo,
        urlTrabajo,
        dre,
        ugel,
        origen: "sice_excel"
      });
    }
  });

  return {
    error: null,
    headerFoundIndex: headerIndex,
    registros,
    noReconocidas: Array.from(noReconocidasSet)
  };
}

/**
 * Filtra y desduplica las evaluaciones para una disciplina y categoría,
 * garantizando que solo pertenezcan a participantes activos y exista a lo sumo 1 por (participante, jurado).
 */
export function filtrarEvaluacionesValidas(evaluaciones = [], disciplinaId = null, categoria = null, participantes = []) {
  if (!evaluaciones || evaluaciones.length === 0) return [];

  const partIdsSet = new Set(participantes.map(p => p.id).filter(Boolean));
  const partCodigosSet = new Set(participantes.map(p => p.codigoParticipante || p.codigo).filter(Boolean));

  // 1. Filtrar las evaluaciones pertenecientes a participantes válidos activos
  const validas = evaluaciones.filter(ev => {
    // Si se especifica disciplina o categoría, validar concordancia
    if (disciplinaId) {
      const matchDisc = ev.disciplinaId === disciplinaId || ev.id?.includes(disciplinaId);
      if (!matchDisc) return false;
    }
    if (categoria) {
      const matchCat = ev.categoria === categoria || ev.participanteSnapshot?.categoria === categoria;
      if (!matchCat) return false;
    }

    // Si no hay lista de participantes pasada, se deja pasar la evaluación
    if (!participantes || participantes.length === 0) return true;

    // Verificar si pertenece a un participante activo
    const pId = ev.participanteId || ev.participanteSnapshot?.id || ev.id?.split('__')[0];
    const pCod = ev.codigoParticipante || ev.participanteSnapshot?.codigoParticipante || ev.participanteSnapshot?.codigo;

    const existePorId = pId && partIdsSet.has(pId);
    const existePorCod = pCod && partCodigosSet.has(pCod);

    return existePorId || existePorCod;
  });

  // 2. Desduplicar: Para cada (participanteId, numeroJurado), conservar solo 1 evaluación (la firmada o más reciente)
  const dedupMap = new Map();
  validas.forEach(ev => {
    const pId = ev.participanteId || ev.participanteSnapshot?.id || ev.id?.split('__')[0];
    const jurNum = ev.jurado?.numeroJurado || ev.juradoId || 1;
    const key = `${pId}__jurado_${jurNum}`;

    if (!dedupMap.has(key)) {
      dedupMap.set(key, ev);
    } else {
      const prev = dedupMap.get(key);
      const prevTieneFirma = Boolean(prev.jurado?.firmaDataUrl);
      const currTieneFirma = Boolean(ev.jurado?.firmaDataUrl);
      if (!prevTieneFirma && currTieneFirma) {
        dedupMap.set(key, ev);
      } else if (prevTieneFirma === currTieneFirma) {
        const prevTime = new Date(prev.updatedAt || prev.firmadaEn || 0).getTime();
        const currTime = new Date(ev.updatedAt || ev.firmadaEn || 0).getTime();
        if (currTime > prevTime) {
          dedupMap.set(key, ev);
        }
      }
    }
  });

  return Array.from(dedupMap.values());
}

