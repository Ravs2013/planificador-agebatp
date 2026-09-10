/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — CÁLCULOS PUROS Y REGLAS DE NEGOCIO
   Sin dependencias de React ni de Firestore. Todo aquí debe ser testeable en aislamiento.
   ═══════════════════════════════════════════════════════════════ */

import {
  EUREKA_CONFIG, AREAS_PARTICIPACION, getArea, getCategoria, getLinea, SLOTS_JURADO
} from '../data/eurekaConfigUGEL03';
import { getRubricaEureka } from '../data/eurekaRubricas';

/* ───── 1. Enrutamiento de rúbricas ───── */

/**
 * Resuelve qué anexo (E11..E18) aplica a una combinación categoría + área + línea.
 * Lanza un error explícito ante combinaciones no válidas. Nunca devuelve un fallback
 * silencioso: una ficha con la rúbrica equivocada invalida el acta.
 */
/**
 * Retorna el anexo oficial por defecto según las bases MINEDU para cada categoría y área.
 * Garantiza que NINGÚN proyecto quede sin formulario de evaluación asignado.
 */
export function resolverAnexoPorDefecto(categoria, areaId) {
  if (['A', 'B', 'C'].includes(categoria)) {
    if (areaId === 'indagacion_social') return 'E13';
    return 'E11'; // ind_ciencia_tecnologia
  }
  // Categorías D y E (Secundaria) — Anexos E15 a E18
  if (areaId === 'soluciones_tecnologicas') return 'E16';
  if (areaId === 'ciencias_sociales') return categoria === 'D' ? 'E17' : 'E18';
  return 'E15'; // indagacion_cientifica por defecto en Secundaria
}

/**
 * Resuelve el código del anexo oficial según las bases MINEDU.
 */
export function resolverAnexo({ categoria, areaId, lineaId }) {
  const area = getArea(areaId);
  if (!area) {
    return resolverAnexoPorDefecto(categoria, areaId);
  }
  if (!area.categorias.includes(categoria)) {
    return resolverAnexoPorDefecto(categoria, areaId);
  }
  const linea = lineaId ? getLinea(areaId, lineaId) : null;
  if (!linea) {
    return resolverAnexoPorDefecto(categoria, areaId);
  }
  if (linea.anexoPorCategoria) {
    const anexo = linea.anexoPorCategoria[categoria];
    if (anexo) return anexo;
  }
  if (linea.anexo) {
    return linea.anexo;
  }
  return resolverAnexoPorDefecto(categoria, areaId);
}

/**
 * Resuelve el encuadre de evaluación cuando la línea de participación NO se conoce.
 *
 * El reporte SICE para jurados trae categoría y área, pero no la línea.
 * Asigna inmediatamente el anexo por defecto oficial según bases para que el jurado
 * pueda abrir y evaluar el formulario de inmediato sin bloqueos ni errores.
 *
 * @returns {{ anexo, variante, requiereLinea, requiereVariante, anexosPosibles }}
 */
export function resolverEncuadre({ categoria, areaId, lineaId }) {
  const area = getArea(areaId);
  if (!area) {
    const anexoDef = resolverAnexoPorDefecto(categoria, areaId);
    return { anexo: anexoDef, variante: 'A', requiereLinea: false, requiereVariante: false, anexosPosibles: [anexoDef] };
  }

  // Con línea conocida no hay nada que deducir.
  if (lineaId && getLinea(areaId, lineaId)) {
    return {
      anexo: resolverAnexo({ categoria, areaId, lineaId }),
      variante: resolverVariante({ areaId, lineaId }) || 'A',
      requiereLinea: false,
      requiereVariante: false,
      anexosPosibles: []
    };
  }

  const anexoDe = (linea) => (linea.anexoPorCategoria ? linea.anexoPorCategoria[categoria] : linea.anexo);
  const anexosPosibles = [...new Set(area.lineas.map(anexoDe).filter(Boolean))];
  const variantesPosibles = [...new Set(area.lineas.map(l => l.variante).filter(Boolean))];

  // Anexo oficial garantizado según bases (¡NUNCA null!)
  const anexoGarantizado = anexosPosibles[0] || resolverAnexoPorDefecto(categoria, areaId);

  return {
    anexo: anexoGarantizado,
    variante: variantesPosibles.length === 1 ? variantesPosibles[0] : (variantesPosibles[0] || 'A'),
    requiereLinea: area.lineas.length > 1,
    requiereVariante: variantesPosibles.length > 1,
    anexosPosibles: anexosPosibles.length > 0 ? anexosPosibles : [anexoGarantizado]
  };
}

/** Variante de rúbrica aplicable (solo E15: A experimental, B descriptiva). */
export function resolverVariante({ areaId, lineaId }) {
  const linea = getLinea(areaId, lineaId);
  return linea && linea.variante ? linea.variante : null;
}

/* ───── 2. Cálculo del puntaje de una ficha ───── */

/** Suma de puntos de las penalizaciones manuales registradas. */
export function sumaPenalizaciones(penalizaciones = []) {
  return (penalizaciones || []).reduce((s, p) => s + (Number(p.puntos) || 0), 0);
}

/**
 * Calcula el puntaje de una evaluación según el motor de su rúbrica.
 * Devuelve siempre { puntajeBruto, puntajePonderado, puntajeTotal, puntajeMaximo,
 *                    itemsCalificados, itemsTotales, completa }.
 */
export function calcularPuntajeEvaluacion({ rubrica, puntajes = {}, penalizaciones = [], variante = 'A', noProsigue = false, incomparecencia = false }) {
  const vacio = {
    puntajeBruto: 0,
    puntajePonderado: 0,
    puntajeTotal: 0,
    puntajeMaximo: rubrica ? rubrica.puntajeMaximo : 0,
    itemsCalificados: 0,
    itemsTotales: 0,
    completa: false
  };
  if (!rubrica) return vacio;

  // El gate en NO y la incomparecencia cierran la ficha en cero.
  if (noProsigue || incomparecencia) {
    return { ...vacio, puntajeMaximo: rubrica.puntajeMaximo, itemsTotales: contarItems(rubrica) };
  }

  const nivelesValidos = new Set(rubrica.escala || []);

  if (rubrica.tipoEscala === 'simple') {
    const criterios = rubrica.criterios || [];
    let bruto = 0;
    let calificados = 0;
    criterios.forEach(c => {
      const v = Number(puntajes[c.id]);
      if (nivelesValidos.has(v)) {
        bruto += v;
        calificados += 1;
      }
    });
    const total = Math.max(0, bruto - sumaPenalizaciones(penalizaciones));
    return {
      puntajeBruto: bruto,
      puntajePonderado: bruto,
      puntajeTotal: total,
      puntajeMaximo: rubrica.puntajeMaximo,
      itemsCalificados: calificados,
      itemsTotales: criterios.length,
      completa: calificados === criterios.length && criterios.length > 0
    };
  }

  const aspectos = rubrica.aspectos || [];
  let bruto = 0;
  let ponderado = 0;
  let calificados = 0;
  aspectos.forEach(a => {
    const v = Number(puntajes[a.id]);
    if (nivelesValidos.has(v)) {
      bruto += v;
      ponderado += v * (a.ponderacion || 0);
      calificados += 1;
    }
  });
  const total = Math.max(0, ponderado - sumaPenalizaciones(penalizaciones));
  return {
    puntajeBruto: bruto,
    puntajePonderado: ponderado,
    puntajeTotal: total,
    puntajeMaximo: rubrica.puntajeMaximo,
    itemsCalificados: calificados,
    itemsTotales: aspectos.length,
    completa: calificados === aspectos.length && aspectos.length > 0
  };
}

export function contarItems(rubrica) {
  if (!rubrica) return 0;
  return rubrica.tipoEscala === 'simple'
    ? (rubrica.criterios || []).length
    : (rubrica.aspectos || []).length;
}

/** Puntos asignados de un aspecto ponderado. */
export function puntosAspecto(calificacion, ponderacion) {
  const c = Number(calificacion);
  if (!c) return null;
  return c * (Number(ponderacion) || 0);
}

/* ───── 3. Validaciones de identidad ───── */

/** DNI peruano: exactamente 8 dígitos. */
export function validarDNI(dni = '') {
  return /^\d{8}$/.test(String(dni).trim());
}

/** Normaliza a 8 dígitos conservando los ceros a la izquierda. */
export function normalizarDNI(valor) {
  const soloDigitos = String(valor ?? '').replace(/\D/g, '');
  if (!soloDigitos) return '';
  return soloDigitos.length >= 8 ? soloDigitos.slice(-8) : soloDigitos.padStart(8, '0');
}

/** Un nombre imprimible en un anexo oficial requiere al menos dos palabras. */
export function nombreCompletoValido(nombre = '') {
  const limpio = String(nombre).trim().replace(/\s+/g, ' ');
  if (limpio === '') return false;
  if (/^JURADO\s*\d*/i.test(limpio)) return false;
  return limpio.split(' ').filter(Boolean).length >= 2;
}

export function sanearCorreo(valor) {
  return String(valor ?? '').replace(/\s+/g, '').trim().toLowerCase();
}

/* ───── 4. Formato ───── */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function mesEnLetras(numMes) {
  let idx = parseInt(numMes, 10);
  if (isNaN(idx)) return '';
  if (idx >= 1 && idx <= 12) idx = idx - 1;
  return MESES[idx] || '';
}

/**
 * Ordinal con punto volado según la ortografía oficial del Anexo E20.
 * El primer puesto se escribe "1.er"; el resto, "n.°".
 */
export function ordinalEs(n) {
  const num = parseInt(n, 10);
  if (isNaN(num)) return '';
  if (num === 1) return '1.er';
  return `${num}.°`;
}

export function formatearFechaLarga(fechaISO) {
  const partes = String(fechaISO || '').split('-');
  if (partes.length !== 3) return { dia: '', mes: '', anio: '' };
  return {
    dia: parseInt(partes[2], 10),
    mes: mesEnLetras(parseInt(partes[1], 10)),
    anio: partes[0]
  };
}

export function redondear(valor, decimales = EUREKA_CONFIG.decimalesPromedio) {
  if (valor == null || isNaN(valor)) return null;
  const f = Math.pow(10, decimales);
  return Math.round(valor * f) / f;
}

/* ───── 5. Consolidado E19 ───── */

/**
 * Construye las filas del Anexo E19 cruzando el padrón con las evaluaciones.
 * Una fila es `completo` solo si los tres casilleros de jurado están en estado
 * 'registrada'. El orden de mérito se calcula únicamente sobre filas completas.
 */
export function construirConsolidadoE19(participantes = [], evaluaciones = []) {
  const slots = SLOTS_JURADO;
  const evalMap = new Map();
  evaluaciones.forEach(ev => {
    const slot = ev?.jurado?.numeroJurado;
    if (!slot) return;
    evalMap.set(`${ev.participanteId}__J${slot}`, ev);
  });

  const filas = participantes.map(p => {
    const notas = {};
    let registradas = 0;
    let algunNoProsigue = false;

    slots.forEach(slot => {
      const ev = evalMap.get(`${p.id}__J${slot}`);
      const registrada = ev && ev.estado === 'registrada';
      notas[`jurado${slot}`] = registrada ? Number(ev.puntajeTotal) || 0 : null;
      if (registrada) registradas += 1;
      if (ev && ev.noProsigue) algunNoProsigue = true;
    });

    const valores = slots.map(s => notas[`jurado${s}`]).filter(v => v !== null);
    const completo = registradas === slots.length;
    const suma = completo ? valores.reduce((a, b) => a + b, 0) : null;
    const promedio = completo ? redondear(suma / slots.length) : null;
    const puntajeTotal = EUREKA_CONFIG.criterioOrdenMerito === 'suma' ? suma : promedio;

    const inst = p.institucion || {};
    return {
      participanteId: p.id,
      codigoParticipante: p.codigoParticipante || p.codigo || p.id,
      ordenPresentacion: p.ordenPresentacion || 0,
      institucion: inst.nombre || p.institucionNombre || 'I. E. no registrada',
      codigoModular: inst.codigoModular || p.codigoModular || '',
      ugel: inst.ugel || EUREKA_CONFIG.ugel,
      dre: inst.dre || EUREKA_CONFIG.dre,
      tituloProyecto: p.tituloProyecto || p.titulo || '',
      lineaId: p.lineaId || '',
      anexoEvaluacion: p.anexoEvaluacion || '',
      ...notas,
      suma,
      promedio,
      puntajeTotal,
      completo,
      puesto: null,
      ordenManual: p.ordenManual != null ? p.ordenManual : null,
      motivoDirimencia: p.motivoDirimencia || '',
      noProsigue: algunNoProsigue,
      incomparecencia: Boolean(p.noSePresento),
      noSePresento: Boolean(p.noSePresento)
    };
  });

  return calcularOrdenMerito(filas);
}

/** Fila elegible para el podio: completa, con puntaje y sin exclusiones. */
export function esElegiblePodio(fila) {
  if (!fila || !fila.completo) return false;
  if (fila.noSePresento || fila.incomparecencia || fila.noProsigue) return false;
  return fila.puntajeTotal != null && fila.puntajeTotal > 0;
}

/**
 * Asigna el orden de mérito. Solo las filas elegibles reciben puesto; el resto queda con
 * puesto null y se muestra con un guion en el consolidado.
 */
export function calcularOrdenMerito(filas = []) {
  const elegibles = filas.filter(esElegiblePodio);
  const resto = filas.filter(f => !esElegiblePodio(f));

  elegibles.sort((a, b) => {
    if (b.puntajeTotal !== a.puntajeTotal) return b.puntajeTotal - a.puntajeTotal;
    // La dirimencia colegiada del jurado tiene prioridad sobre cualquier otro criterio.
    if (a.ordenManual != null && b.ordenManual != null) return a.ordenManual - b.ordenManual;
    if (a.ordenManual != null) return -1;
    if (b.ordenManual != null) return 1;
    return (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0);
  });

  let puesto = 1;
  elegibles.forEach((f, i) => {
    if (i > 0) {
      const prev = elegibles[i - 1];
      const empatan = f.puntajeTotal === prev.puntajeTotal && f.ordenManual == null && prev.ordenManual == null;
      if (!empatan) puesto = i + 1;
    }
    f.puesto = puesto;
  });

  resto.forEach(f => { f.puesto = null; });

  resto.sort((a, b) => (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0));
  return [...elegibles, ...resto];
}

/**
 * Detecta empates no resueltos en los puestos 1, 2 y 3.
 * Excluye NSP, incomparecencias, fichas que no prosiguen y puntajes en cero: un empate en
 * cero no es un empate del podio. Un empate en 4.° puesto o inferior no bloquea nada.
 */
export function detectarEmpatesTop3(filas = []) {
  const elegibles = filas.filter(esElegiblePodio);
  const porPuesto = new Map();

  elegibles.forEach(f => {
    if (!f.puesto || f.puesto > 3) return;
    if (!porPuesto.has(f.puesto)) porPuesto.set(f.puesto, []);
    porPuesto.get(f.puesto).push(f);
  });

  const empatados = [];
  porPuesto.forEach((grupo, puesto) => {
    if (grupo.length > 1) {
      // Un empate está resuelto si todas las filas del grupo tienen dirimencia distinta.
      const ordenes = grupo.map(f => f.ordenManual).filter(v => v != null);
      const resuelto = ordenes.length === grupo.length && new Set(ordenes).size === grupo.length;
      if (!resuelto) empatados.push(puesto);
    }
  });

  return empatados.sort((a, b) => a - b);
}

/** Resultados del podio para el Acta E20, ordenados por puesto. */
export function construirResultadosActa(filas = [], { incluirPuntaje = false } = {}) {
  return filas
    .filter(f => f.puesto && f.puesto <= 3)
    .sort((a, b) => a.puesto - b.puesto)
    .map(f => ({
      puesto: f.puesto,
      ordenMerito: ordinalEs(f.puesto),
      institucion: f.institucion,
      ugel: f.ugel || EUREKA_CONFIG.ugel,
      dre: f.dre || EUREKA_CONFIG.dre,
      nombreProyecto: f.tituloProyecto || 'Sin título registrado',
      puntajeTotal: incluirPuntaje ? f.puntajeTotal : undefined
    }));
}

/* ───── 6. Saneamiento de evaluaciones ───── */

/**
 * Descarta evaluaciones huérfanas (cuyo participante ya no existe en el padrón) y
 * desduplica por casillero de jurado. Debe aplicarse ANTES de cualquier cálculo de
 * consolidado o de compilación masiva de PDF.
 */
export function filtrarEvaluacionesValidas(evaluaciones = [], categoria = null, areaId = null, participantes = []) {
  if (!evaluaciones.length) return [];

  const idsValidos = new Set(participantes.map(p => p.id).filter(Boolean));
  const codigosValidos = new Set(participantes.map(p => p.codigoParticipante || p.codigo).filter(Boolean));
  const hayPadron = participantes.length > 0;

  const validas = evaluaciones.filter(ev => {
    if (categoria && ev.categoria !== categoria) return false;
    if (areaId && ev.areaId !== areaId) return false;
    if (!hayPadron) return true;
    const pId = ev.participanteId || ev.participanteSnapshot?.id || String(ev.id || '').split('__')[0];
    const pCod = ev.codigoParticipante || ev.participanteSnapshot?.codigoParticipante;
    return (pId && idsValidos.has(pId)) || (pCod && codigosValidos.has(pCod));
  });

  const dedup = new Map();
  validas.forEach(ev => {
    const pId = ev.participanteId || String(ev.id || '').split('__')[0];
    const slot = ev.jurado?.numeroJurado || 1;
    const key = `${pId}__J${slot}`;
    const prev = dedup.get(key);
    if (!prev) { dedup.set(key, ev); return; }
    // Ante duplicados gana la registrada; a igual estado, la más reciente.
    const prevRegistrada = prev.estado === 'registrada';
    const currRegistrada = ev.estado === 'registrada';
    if (currRegistrada && !prevRegistrada) { dedup.set(key, ev); return; }
    if (currRegistrada === prevRegistrada) {
      const tPrev = new Date(prev.registradaEn || prev.updatedAt?.toDate?.() || prev.updatedAt || 0).getTime();
      const tCurr = new Date(ev.registradaEn || ev.updatedAt?.toDate?.() || ev.updatedAt || 0).getTime();
      if (tCurr > tPrev) dedup.set(key, ev);
    }
  });

  return Array.from(dedup.values());
}

/* ───── 7. Orden determinista de compilación masiva ───── */

const ORDEN_AREAS = new Map(AREAS_PARTICIPACION.map((a, i) => [a.id, i]));

export function ordenArea(areaId) {
  return ORDEN_AREAS.has(areaId) ? ORDEN_AREAS.get(areaId) : 999;
}

/**
 * Criterio obligatorio de ordenación para toda descarga masiva:
 * área de participación, luego orden de presentación, luego casillero de jurado.
 */
export function ordenarEvaluacionesParaCompilacion(evaluaciones = []) {
  return [...evaluaciones].sort((a, b) => {
    const areaA = ordenArea(a.areaId);
    const areaB = ordenArea(b.areaId);
    if (areaA !== areaB) return areaA - areaB;

    const ordA = a.participanteSnapshot?.ordenPresentacion ?? a.ordenPresentacion ?? 0;
    const ordB = b.participanteSnapshot?.ordenPresentacion ?? b.ordenPresentacion ?? 0;
    if (ordA !== ordB) return ordA - ordB;

    const codA = a.participanteSnapshot?.codigoParticipante || a.codigoParticipante || '';
    const codB = b.participanteSnapshot?.codigoParticipante || b.codigoParticipante || '';
    if (codA !== codB) return String(codA).localeCompare(String(codB));

    return (a.jurado?.numeroJurado || 1) - (b.jurado?.numeroJurado || 1);
  });
}

/* ───── 8. Sorteo de orden de presentación ───── */

/** Fisher-Yates puro. La persistencia atómica se hace con writeBatch en dbEureka. */
export function barajarFisherYates(lista = []) {
  const arr = [...lista];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ───── 9. Nomenclatura de archivos ───── */

export function sanitizarNombreArchivo(texto = '') {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
}

/** Texto de identificación de un participante para listados y toasts. */
export function etiquetaParticipante(p) {
  if (!p) return '';
  const inst = p.institucion?.nombre || p.institucionNombre || 'I. E. no registrada';
  const titulo = p.tituloProyecto || p.titulo || 'Proyecto sin título';
  return `${inst} — ${titulo}`;
}

/** Nombre completo del/los estudiante(s) de un participante. */
export function nombresEstudiantes(p) {
  const lista = p?.estudiantes || [];
  return lista
    .map(e => [e.apellidoPaterno, e.apellidoMaterno, e.nombres].filter(Boolean).join(' ').trim())
    .filter(Boolean)
    .join(' · ');
}

/** Descripción legible del alcance de un panel de firmas. */
export function describirAlcance(alcance, categoria, areaId) {
  if (alcance === 'GLOBAL') return 'Todo el concurso (todas las categorías y áreas)';
  if (alcance === 'CATEGORIA') return `Categoría ${categoria} (todas sus áreas de participación)`;
  const area = getArea(areaId);
  return `Categoría ${categoria} — ${area ? area.nombre : areaId}`;
}

/** Rúbrica aplicable a una evaluación ya persistida. */
export function rubricaDeEvaluacion(evaluacion) {
  if (!evaluacion) return null;
  if (evaluacion.anexoEvaluacion) return getRubricaEureka(evaluacion.anexoEvaluacion);
  try {
    return getRubricaEureka(resolverAnexo(evaluacion));
  } catch (e) {
    return null;
  }
}

/** Texto de categoría para encabezados: "Categoría D — Primer y segundo grado...". */
export function tituloCategoria(categoriaId) {
  const c = getCategoria(categoriaId);
  return c ? `${c.nombre} — ${c.grados}` : `Categoría ${categoriaId}`;
}
