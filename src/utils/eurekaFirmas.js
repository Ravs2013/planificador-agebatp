/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — SISTEMA DE FIRMA DIFERIDA CENTRALIZADA
   Resolución de paneles y firmantes.

   EL CAMBIO CRÍTICO DEL MÓDULO:
   En Juegos Florales cada jurado firmaba su propia ficha al evaluar. En Eureka evalúan
   doce personas pero firman tres, y esas tres se designan al final. Por eso la firma se
   DESACOPLA de la evaluación: se captura una sola vez en el Panel de Firmas Oficial y se
   RESUELVE EN TIEMPO DE RENDERIZADO para toda ficha, consolidado y acta.

   La firma nunca se copia dentro de una evaluación. Si un firmante corrige su trazo,
   todos los documentos quedan corregidos de inmediato sin reescribir cientos de registros.
   ═══════════════════════════════════════════════════════════════ */

import { EUREKA_CONFIG, SLOTS_JURADO } from '../data/eurekaConfigUGEL03';
import { validarDNI, nombreCompletoValido, normalizarDNI } from './eurekaHelpers';

export const ALCANCES = {
  GLOBAL: 'GLOBAL',
  CATEGORIA: 'CATEGORIA',
  CATEGORIA_AREA: 'CATEGORIA_AREA'
};

/* ───── 1. Identificadores de alcance ───── */

/** scopeId determinista de un panel. */
export function scopeIdDe({ alcance, categoria, areaId }) {
  if (alcance === ALCANCES.GLOBAL) return 'GLOBAL';
  if (alcance === ALCANCES.CATEGORIA) {
    if (!categoria) throw new Error('El alcance CATEGORIA exige una categoría.');
    return `CAT_${categoria}`;
  }
  if (alcance === ALCANCES.CATEGORIA_AREA) {
    if (!categoria || !areaId) throw new Error('El alcance CATEGORIA_AREA exige categoría y área.');
    return `CAT_${categoria}__AREA_${areaId}`;
  }
  throw new Error(`Alcance de panel no reconocido: "${alcance}".`);
}

/** Descompone un scopeId en sus partes. Inversa de scopeIdDe. */
export function parsearScopeId(scopeId) {
  if (scopeId === 'GLOBAL') return { alcance: ALCANCES.GLOBAL, categoria: null, areaId: null };
  const conArea = /^CAT_([A-E])__AREA_(.+)$/.exec(scopeId || '');
  if (conArea) return { alcance: ALCANCES.CATEGORIA_AREA, categoria: conArea[1], areaId: conArea[2] };
  const soloCat = /^CAT_([A-E])$/.exec(scopeId || '');
  if (soloCat) return { alcance: ALCANCES.CATEGORIA, categoria: soloCat[1], areaId: null };
  return null;
}

/** Candidatos de resolución, del más específico al más general. */
export function candidatosScope({ categoria, areaId }) {
  const lista = [];
  if (categoria && areaId) lista.push(`CAT_${categoria}__AREA_${areaId}`);
  if (categoria) lista.push(`CAT_${categoria}`);
  lista.push('GLOBAL');
  return lista;
}

/* ───── 2. Cascada de resolución ───── */

/**
 * Busca el panel aplicable a una combinación categoría + área.
 * Recorre del más específico al más general y devuelve el PRIMERO QUE ESTÉ SELLADO.
 * Un panel en borrador no gobierna ningún documento.
 */
export function resolverPanelFirmas(panelesMap = {}, { categoria, areaId } = {}) {
  for (const id of candidatosScope({ categoria, areaId })) {
    const p = panelesMap[id];
    if (p && p.estado === 'sellado') return p;
  }
  return null;
}

/** Panel aplicable aunque esté en borrador. Sirve para la UI, nunca para firmar un PDF. */
export function resolverPanelEditable(panelesMap = {}, { categoria, areaId } = {}) {
  for (const id of candidatosScope({ categoria, areaId })) {
    const p = panelesMap[id];
    if (p) return p;
  }
  return null;
}

/**
 * Firmante que corresponde a una ficha individual.
 * La evaluación lleva un `numeroJurado` (1, 2 o 3) que indica QUÉ CASILLERO del panel le
 * toca. La ficha del Jurado 1 de cualquier participante la suscribe el firmante 1.
 */
export function resolverFirmanteDeFicha(evaluacion, panel) {
  if (!panel || panel.estado !== 'sellado') return null;
  const slot = evaluacion?.jurado?.numeroJurado;
  if (!SLOTS_JURADO.includes(slot)) return null;
  return (panel.firmantes || []).find(f => f.numeroJurado === slot) || null;
}

/** Los tres firmantes ordenados por casillero. Devuelve huecos como null. */
export function firmantesOrdenados(panel) {
  if (!panel || panel.estado !== 'sellado') return SLOTS_JURADO.map(() => null);
  return SLOTS_JURADO.map(
    slot => (panel.firmantes || []).find(f => f.numeroJurado === slot) || null
  );
}

/** Un documento es preliminar mientras no exista panel sellado aplicable. */
export function esPreliminar(panel) {
  return !panel || panel.estado !== 'sellado';
}

/** Etiqueta de gobernanza que la UI debe mostrar siempre. */
export function etiquetaGobernanza(panel) {
  if (!panel) return 'Sin panel de firmas aplicable. Los documentos se emitirán como preliminares.';
  if (panel.estado !== 'sellado') {
    return `Panel ${panel.id} en BORRADOR. Los documentos se emitirán como preliminares.`;
  }
  const fecha = panel.selladoEn ? new Date(panel.selladoEn) : null;
  const cuando = fecha && !isNaN(fecha)
    ? `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()} a las ${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
    : 'fecha no registrada';
  const quien = panel.selladoPor?.correo || panel.selladoPor?.uid || 'responsable no registrado';
  return `Firmas gobernadas por: Panel ${panel.id} — sellado el ${cuando} por ${quien}`;
}

/* ───── 3. Firmante en blanco y validación del panel ───── */

export function firmanteVacio(numeroJurado) {
  return {
    numeroJurado,
    nombreCompleto: '',
    apellidos: '',
    nombres: '',
    dni: '',
    institucion: '',
    cargo: '',
    tipoMiembro: 'docente_eb',
    correo: '',
    presidente: false,
    firmaDataUrl: null,
    juradoOperativoRef: ''
  };
}

export function panelVacio({ alcance = EUREKA_CONFIG.alcanceFirmaPorDefecto, categoria = null, areaId = null } = {}) {
  const id = scopeIdDe({ alcance, categoria, areaId });
  return {
    id,
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    alcance,
    categoria: alcance === ALCANCES.GLOBAL ? null : categoria,
    areaId: alcance === ALCANCES.CATEGORIA_AREA ? areaId : null,
    firmantes: SLOTS_JURADO.map(firmanteVacio),
    estado: 'borrador',
    historial: []
  };
}

/**
 * Verificaciones previas al sellado.
 * Devuelve una lista de comprobaciones con estado, que la UI pinta en vivo.
 * `bloqueante: true` impide sellar. Las advertencias permiten sellar con confirmación
 * explícita: hay casos legítimos, como un participante que no se presentó.
 */
export function verificarPanel(panel, { evaluacionesDelAlcance = [], participantesDelAlcance = [] } = {}) {
  const firmantes = panel?.firmantes || [];
  const checks = [];

  const conNombre = firmantes.filter(f => nombreCompletoValido(f.nombreCompleto));
  checks.push({
    id: 'nombres',
    bloqueante: true,
    ok: conNombre.length === SLOTS_JURADO.length,
    label: `Los ${SLOTS_JURADO.length} firmantes tienen nombres y apellidos completos`,
    detalle: firmantes
      .filter(f => !nombreCompletoValido(f.nombreCompleto))
      .map(f => `Jurado N.° ${f.numeroJurado}: falta el nombre completo (mínimo dos palabras).`)
  });

  const dnisValidos = firmantes.filter(f => validarDNI(f.dni));
  const dnisUnicos = new Set(firmantes.map(f => normalizarDNI(f.dni)).filter(Boolean));
  const dniOk = dnisValidos.length === SLOTS_JURADO.length && dnisUnicos.size === SLOTS_JURADO.length;
  checks.push({
    id: 'dni',
    bloqueante: true,
    ok: dniOk,
    label: `Los ${SLOTS_JURADO.length} DNI son válidos (8 dígitos) y distintos entre sí`,
    detalle: [
      ...firmantes.filter(f => !validarDNI(f.dni)).map(f => `Jurado N.° ${f.numeroJurado}: el DNI debe tener exactamente 8 dígitos.`),
      ...(dnisValidos.length === SLOTS_JURADO.length && dnisUnicos.size < SLOTS_JURADO.length
        ? ['Hay DNI repetidos entre los firmantes designados.'] : [])
    ]
  });

  const conFirma = firmantes.filter(f => f.firmaDataUrl && String(f.firmaDataUrl).startsWith('data:image'));
  checks.push({
    id: 'firmas',
    bloqueante: true,
    ok: conFirma.length === SLOTS_JURADO.length,
    label: `Los ${SLOTS_JURADO.length} firmantes registraron su firma`,
    detalle: firmantes
      .filter(f => !(f.firmaDataUrl && String(f.firmaDataUrl).startsWith('data:image')))
      .map(f => `El Jurado N.° ${f.numeroJurado} no ha registrado su firma.`)
  });

  const presidentes = firmantes.filter(f => f.presidente);
  checks.push({
    id: 'presidente',
    bloqueante: true,
    ok: presidentes.length === 1,
    label: 'Se designó exactamente un presidente del jurado',
    detalle: presidentes.length === 0
      ? ['Las bases exigen que los miembros del jurado elijan a su presidente.']
      : (presidentes.length > 1 ? ['Solo un firmante puede estar marcado como presidente.'] : [])
  });

  const conInstitucion = firmantes.filter(f => String(f.institucion || '').trim() !== '');
  checks.push({
    id: 'institucion',
    bloqueante: false,
    ok: conInstitucion.length === SLOTS_JURADO.length,
    label: 'Los firmantes declararon su institución',
    detalle: firmantes
      .filter(f => String(f.institucion || '').trim() === '')
      .map(f => `Jurado N.° ${f.numeroJurado}: el pie de los anexos E15 a E18 imprime la institución.`)
  });

  const registradas = evaluacionesDelAlcance.filter(ev => ev.estado === 'registrada');
  const enBorrador = evaluacionesDelAlcance.filter(ev => ev.estado !== 'registrada');
  const esperadas = participantesDelAlcance.length * SLOTS_JURADO.length;
  const faltantes = Math.max(0, esperadas - registradas.length);
  checks.push({
    id: 'fichas',
    bloqueante: false,
    ok: enBorrador.length === 0 && faltantes === 0,
    label: 'Todas las fichas del alcance están registradas',
    detalle: [
      ...(enBorrador.length > 0 ? [`${enBorrador.length} ficha(s) aún en borrador.`] : []),
      ...(faltantes > 0 ? [`Faltan ${faltantes} evaluación(es) por capturar de ${esperadas} esperadas.`] : [])
    ]
  });

  const bloqueantesFallidos = checks.filter(c => c.bloqueante && !c.ok);
  const advertencias = checks.filter(c => !c.bloqueante && !c.ok);

  return {
    checks,
    puedeSellar: bloqueantesFallidos.length === 0,
    bloqueantesFallidos,
    advertencias,
    requiereConfirmacionExtra: advertencias.length > 0
  };
}

/* ───── 4. Validación anti-canvas-vacío ───── */

/**
 * Un canvas "firmado" con un punto accidental produce un PNG casi vacío que en el PDF se
 * ve como una mancha. Se exige un mínimo de píxeles con tinta antes de aceptar el trazo.
 * Se resuelve de forma asíncrona porque necesita decodificar la imagen.
 */
export function firmaEsValida(dataUrl, { minPixelesTinta = 400, minTrazos = 2, trazos = null } = {}) {
  return new Promise(resolve => {
    if (!dataUrl || !String(dataUrl).startsWith('data:image')) {
      resolve({ valida: false, motivo: 'No se registró ningún trazo de firma.' });
      return;
    }
    if (trazos != null && trazos < minTrazos) {
      resolve({ valida: false, motivo: 'El trazo de firma es insuficiente.' });
      return;
    }
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let tinta = 0;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) {
              tinta += 1;
              if (tinta >= minPixelesTinta) break;
            }
          }
          if (tinta >= minPixelesTinta) {
            resolve({ valida: true, pixeles: tinta });
          } else {
            resolve({ valida: false, motivo: 'El trazo de firma es insuficiente.', pixeles: tinta });
          }
        } catch (e) {
          // Una firma cargada desde archivo puede marcar el canvas como contaminado.
          // En ese caso se acepta: el usuario aportó una imagen real de su firma.
          resolve({ valida: true, pixeles: null, notaTecnica: 'No se pudo inspeccionar el mapa de píxeles.' });
        }
      };
      img.onerror = () => resolve({ valida: false, motivo: 'La imagen de firma no pudo leerse.' });
      img.src = dataUrl;
    } catch (e) {
      resolve({ valida: false, motivo: 'La imagen de firma no pudo procesarse.' });
    }
  });
}

/* ───── 5. Caché de firma en localStorage ───── */

/**
 * Clave aislada por alcance, casillero y DNI. Nunca una clave global: un firmante no debe
 * poder heredar accidentalmente el trazo de otro.
 */
export function claveCacheFirma(scopeId, numeroJurado, dni) {
  const d = normalizarDNI(dni);
  if (!scopeId || !numeroJurado || !d) return null;
  return `ek_sig_${scopeId}_j${numeroJurado}_dni_${d}`;
}

export function guardarFirmaEnCache(scopeId, numeroJurado, dni, dataUrl) {
  const key = claveCacheFirma(scopeId, numeroJurado, dni);
  if (!key || !dataUrl) return false;
  try {
    localStorage.setItem(key, dataUrl);
    return true;
  } catch (e) {
    return false;
  }
}

export function leerFirmaDeCache(scopeId, numeroJurado, dni) {
  const key = claveCacheFirma(scopeId, numeroJurado, dni);
  if (!key) return null;
  try {
    const v = localStorage.getItem(key);
    return v && v.startsWith('data:image') ? v : null;
  } catch (e) {
    return null;
  }
}

/** Al reabrir un panel se invalidan todas las claves de su scopeId. */
export function invalidarCacheDeScope(scopeId) {
  if (!scopeId) return 0;
  const prefijo = `ek_sig_${scopeId}_`;
  let borradas = 0;
  try {
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefijo)) claves.push(k);
    }
    claves.forEach(k => { localStorage.removeItem(k); borradas += 1; });
  } catch (e) {
    return borradas;
  }
  return borradas;
}

/* ───── 6. Bloque de firma para los generadores de PDF ───── */

/**
 * Normaliza los datos que necesita drawBloqueFirma, resuelva o no contra un panel sellado.
 * Devolver siempre un objeto (nunca null) evita ramas condicionales en los generadores.
 */
export function bloqueFirmaDe(firmante, numeroJurado) {
  if (!firmante) {
    return {
      numeroJurado,
      pendiente: true,
      nombreCompleto: '',
      dni: '',
      institucion: '',
      cargo: '',
      presidente: false,
      firmaDataUrl: null
    };
  }
  return {
    numeroJurado: firmante.numeroJurado || numeroJurado,
    pendiente: false,
    nombreCompleto: firmante.nombreCompleto || '',
    dni: firmante.dni || '',
    institucion: firmante.institucion || '',
    cargo: firmante.cargo || '',
    presidente: Boolean(firmante.presidente),
    firmaDataUrl: firmante.firmaDataUrl || null
  };
}

/** Los tres bloques de firma de un consolidado o acta, resueltos contra el panel. */
export function bloquesFirmaDePanel(panel) {
  return firmantesOrdenados(panel).map((f, i) => bloqueFirmaDe(f, SLOTS_JURADO[i]));
}
