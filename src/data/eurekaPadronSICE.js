/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — PADRÓN DE PARTICIPANTES SICE (fallback offline)
   Etapa UGEL — UGEL 03

   ESTADO: VACÍO A PROPÓSITO, y así se queda.

   El reporte SICE ya está disponible ("RptJurados", exportado el 09/09/2026, 455 proyectos
   de la UGEL 03) y la ruta correcta es importarlo desde la pestaña Padrón, que lo valida
   fila por fila y escribe a Firestore con writeBatch.

   Precargarlo aquí sería peor: son 455 registros que quedarían congelados en el bundle y
   que se desincronizarían en cuanto SICE reexporte tras un retiro o una corrección. El
   archivo se conserva solo por si algún día hace falta un respaldo sin conexión.
   ═══════════════════════════════════════════════════════════════ */

export const PARTICIPANTES_SICE_EUREKA = [];

/** Participantes precargados de una combinación categoría + área. */
export function getParticipantesPrecargados(categoria, areaId) {
  return PARTICIPANTES_SICE_EUREKA.filter(
    p => (!categoria || p.categoria === categoria) && (!areaId || p.areaId === areaId)
  );
}

export const PADRON_SICE_DISPONIBLE = PARTICIPANTES_SICE_EUREKA.length > 0;
