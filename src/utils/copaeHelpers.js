/* ═══════════════════════════════════════════════════════════════
   PRECONGRESO DE COPAE – UGEL 03 — HELPERS Y LÓGICA DE CÁLCULO
   ═══════════════════════════════════════════════════════════════ */

import { CRITERIOS_EVALUACION_COPAE, COPAE_CONFIG } from '../data/copaeConfig';

/**
 * Calcula el puntaje total obtenido en una ficha de evaluación (máx 20).
 * Si está marcada como NSP (incomparecencia), el puntaje es 0.
 */
export function calcularPuntajeFicha(puntajes = {}, esNsp = false) {
  if (esNsp) return 0;
  let total = 0;
  CRITERIOS_EVALUACION_COPAE.forEach(c => {
    const val = Number(puntajes[c.id]);
    if (val >= 1 && val <= 4) {
      total += val;
    }
  });
  return total;
}

/**
 * Verifica si todos los criterios han sido calificados (1..4) o si es NSP.
 */
export function estaCompletaFicha(puntajes = {}, esNsp = false) {
  if (esNsp) return true;
  return CRITERIOS_EVALUACION_COPAE.every(c => {
    const val = Number(puntajes[c.id]);
    return val >= 1 && val <= 4;
  });
}

/**
 * ID determinista para una evaluación individual en Firestore:
 * {cebaId}__J{numeroJurado}
 */
export function evaluacionIdCOPAE(cebaId, numeroJurado) {
  return `${cebaId}__J${numeroJurado}`;
}

/**
 * Construye y ordena el Consolidado Oficial del Jurado para los 19 CEBAs.
 * Solamente gana el primer puesto.
 * Pasan a la siguiente ronda 7 participantes (Top 7).
 * Aparecen TODOS los puestos (1 al 19).
 */
export function calcularConsolidadoCOPAE(cebas = [], evaluaciones = []) {
  const evalMap = new Map();
  evaluaciones.forEach(ev => {
    if (ev && ev.cebaId && ev.numeroJurado) {
      evalMap.set(evaluacionIdCOPAE(ev.cebaId, ev.numeroJurado), ev);
    }
  });

  const filas = cebas.map(ceba => {
    const evJ1 = evalMap.get(evaluacionIdCOPAE(ceba.id, 1)) || null;
    const evJ2 = evalMap.get(evaluacionIdCOPAE(ceba.id, 2)) || null;

    const j1Nsp = Boolean(evJ1?.esNsp);
    const j2Nsp = Boolean(evJ2?.esNsp);

    const j1Evaluado = Boolean(evJ1 && (j1Nsp || estaCompletaFicha(evJ1.puntajes, false)));
    const j2Evaluado = Boolean(evJ2 && (j2Nsp || estaCompletaFicha(evJ2.puntajes, false)));

    const puntajeJ1 = j1Evaluado ? calcularPuntajeFicha(evJ1.puntajes, j1Nsp) : null;
    const puntajeJ2 = j2Evaluado ? calcularPuntajeFicha(evJ2.puntajes, j2Nsp) : null;

    let puntajeTotal = null;
    let promedio = null;
    if (puntajeJ1 !== null && puntajeJ2 !== null) {
      puntajeTotal = puntajeJ1 + puntajeJ2;
      promedio = Number((puntajeTotal / 2).toFixed(2));
    } else if (puntajeJ1 !== null) {
      puntajeTotal = puntajeJ1;
    } else if (puntajeJ2 !== null) {
      puntajeTotal = puntajeJ2;
    }

    const evaluacionCompleta = j1Evaluado && j2Evaluado;
    const esNspTotal = j1Nsp && j2Nsp;

    return {
      cebaId: ceba.id,
      ceba,
      nombreCeba: ceba.nombre,
      codigoModular: ceba.codigoModular || '',
      ordenInicial: ceba.orden || 99,
      evJ1,
      evJ2,
      j1Evaluado,
      j2Evaluado,
      puntajeJ1,
      puntajeJ2,
      puntajeTotal,
      promedio,
      evaluacionCompleta,
      esNspTotal
    };
  });

  // Ordenamiento por puntaje total descendente
  // Aquellos sin calificar quedan al final
  filas.sort((a, b) => {
    const ptA = a.puntajeTotal !== null ? a.puntajeTotal : -1;
    const ptB = b.puntajeTotal !== null ? b.puntajeTotal : -1;
    if (ptB !== ptA) return ptB - ptA;
    // Criterio secundario de orden: J1 mayor
    const j1A = a.puntajeJ1 !== null ? a.puntajeJ1 : -1;
    const j1B = b.puntajeJ1 !== null ? b.puntajeJ1 : -1;
    if (j1B !== j1A) return j1B - j1A;
    return (a.ordenInicial || 0) - (b.ordenInicial || 0);
  });

  // Asignación de puestos y clasificación
  let puestoActual = 1;
  const filasConPuesto = filas.map((fila, index) => {
    // Si tiene puntaje igual al anterior, comparte puesto
    if (index > 0) {
      const anterior = filas[index - 1];
      if (fila.puntajeTotal !== null && fila.puntajeTotal === anterior.puntajeTotal) {
        // Mismo puesto
      } else {
        puestoActual = index + 1;
      }
    } else {
      puestoActual = 1;
    }

    const puesto = fila.puntajeTotal !== null ? puestoActual : index + 1;
    const esGanador = index === 0 && fila.puntajeTotal !== null && fila.puntajeTotal > 0;
    const esClasificado = index < COPAE_CONFIG.cuposSiguienteRonda && fila.puntajeTotal !== null && fila.puntajeTotal > 0;

    let estadoClasificacion = 'PARTICIPANTE';
    if (fila.puntajeTotal === null) {
      estadoClasificacion = 'PENDIENTE';
    } else if (fila.esNspTotal) {
      estadoClasificacion = 'INCOMPARECENCIA (NSP)';
    } else if (esGanador) {
      estadoClasificacion = 'GANADOR — 1.° PUESTO';
    } else if (esClasificado) {
      estadoClasificacion = `CLASIFICADO (TOP ${COPAE_CONFIG.cuposSiguienteRonda})`;
    }

    return {
      ...fila,
      puesto,
      esGanador,
      esClasificado,
      estadoClasificacion
    };
  });

  // Detección de empates en el Top 1 y en el límite de los 7 clasificados
  const tieneEmpateTop1 = filasConPuesto.length > 1 &&
    filasConPuesto[0].puntajeTotal !== null &&
    filasConPuesto[0].puntajeTotal === filasConPuesto[1].puntajeTotal &&
    filasConPuesto[0].puntajeTotal > 0;

  const limiteCorte = COPAE_CONFIG.cuposSiguienteRonda; // 7
  const tieneEmpateCorteTop7 = filasConPuesto.length > limiteCorte &&
    filasConPuesto[limiteCorte - 1].puntajeTotal !== null &&
    filasConPuesto[limiteCorte - 1].puntajeTotal === filasConPuesto[limiteCorte].puntajeTotal &&
    filasConPuesto[limiteCorte - 1].puntajeTotal > 0;

  return {
    filas: filasConPuesto,
    tieneEmpateTop1,
    tieneEmpateCorteTop7,
    totalCebas: cebas.length,
    completadosCount: filasConPuesto.filter(f => f.evaluacionCompleta).length
  };
}

export function sanitizarNombreArchivo(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60);
}
