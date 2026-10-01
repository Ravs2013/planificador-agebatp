/* ═══════════════════════════════════════════════════════════════
   CONCURSO NACIONAL CREA Y EMPRENDE 2026 — FIRMA DIFERIDA CENTRALIZADA
   Mismo modelo del Panel de Firmas Oficial de Eureka.

   Evalúan varios grupos, pero los formatos D14 y D15 tienen tres firmas. Las firmas se
   capturan UNA SOLA VEZ en el Panel de Firmas Oficial y se resuelven al generar cada ficha,
   D13, D14 y D15. Nunca se copian dentro de una evaluación: si un firmante corrige su trazo,
   todos los documentos quedan corregidos sin reescribir registros.

   Alcances: GLOBAL (todo el concurso) o CATEGORIA (A, B o C). La resolución va de lo
   específico a lo general y solo un panel SELLADO gobierna documentos.
   ═══════════════════════════════════════════════════════════════ */

import { CYE_CONFIG, SLOTS_JURADO } from '../data/creaEmprendeConfig';
import { validarDNI, nombreCompletoValido, soloDigitos } from './creaEmprendeHelpers';

export const ALCANCES_CYE = {
  GLOBAL: 'GLOBAL',
  CATEGORIA: 'CATEGORIA'
};

export function scopeIdCYE({ alcance, categoria }) {
  if (alcance === ALCANCES_CYE.GLOBAL) return 'GLOBAL';
  if (alcance === ALCANCES_CYE.CATEGORIA) {
    if (!categoria) throw new Error('El alcance por categoría exige una categoría.');
    return `CAT_${categoria}`;
  }
  throw new Error(`Alcance de panel no reconocido: "${alcance}".`);
}

export function candidatosScopeCYE({ categoria } = {}) {
  if (!categoria) return ['GLOBAL'];
  const cat = String(categoria).toUpperCase();
  if (cat === 'A') return ['CAT_A', 'A', 'GLOBAL'];
  if (cat === 'B') return ['CAT_B', 'B'];
  if (cat === 'C') return ['CAT_C', 'C'];
  return [`CAT_${cat}`, cat];
}

/**
 * Resuelve el panel de firmas aplicable a una categoría.
 * Prioriza panel sellado con firmas, luego panel sellado, y finalmente panel en borrador que tenga firmas registradas.
 */
export function resolverPanelFirmasCYE(panelesMap = {}, { categoria } = {}) {
  const candidatos = candidatosScopeCYE({ categoria });
  // 1. Primer panel sellado que contenga firmas
  for (const id of candidatos) {
    const p = panelesMap[id];
    if (p && p.estado === 'sellado' && Array.isArray(p.firmantes) && p.firmantes.some(f => f?.firmaDataUrl)) {
      return p;
    }
  }
  // 2. Cualquier panel sellado
  for (const id of candidatos) {
    const p = panelesMap[id];
    if (p && p.estado === 'sellado') return p;
  }
  // 3. Panel en borrador que tenga al menos una firma registrada
  for (const id of candidatos) {
    const p = panelesMap[id];
    if (p && Array.isArray(p.firmantes) && p.firmantes.some(f => f?.firmaDataUrl)) {
      return p;
    }
  }
  // 4. Panel existente aunque esté en borrador inicial
  for (const id of candidatos) {
    const p = panelesMap[id];
    if (p && Array.isArray(p.firmantes) && p.firmantes.length > 0) return p;
  }
  return null;
}

/** Firmante del casillero indicado (1, 2 o 3) del panel resuelto. */
export function firmanteDelCasillero(panel, numeroJurado) {
  if (!panel) return null;
  const slot = Number(numeroJurado);
  if (!SLOTS_JURADO.includes(slot)) return null;
  return (panel.firmantes || []).find(f => Number(f.numeroJurado || f.slot) === slot) || null;
}

export function firmantesOrdenadosCYE(panel) {
  return SLOTS_JURADO.map(slot => firmanteDelCasillero(panel, slot));
}

export function esPreliminarCYE(panel) {
  if (!panel) return true;
  if (panel.estado === 'sellado') return false;
  const firmantes = panel.firmantes || [];
  const conFirma = firmantes.filter(f => f && f.firmaDataUrl && String(f.firmaDataUrl).startsWith('data:image'));
  if (conFirma.length >= SLOTS_JURADO.length) return false;
  return true;
}

export function etiquetaGobernanzaCYE(panel) {
  if (!panel) return 'Sin panel de firmas sellado. Los documentos se emiten como preliminares.';
  if (panel.estado !== 'sellado') return `Panel ${panel.id} en borrador. Los documentos se emiten como preliminares.`;
  const fecha = panel.selladoEn ? new Date(panel.selladoEn) : null;
  const cuando = fecha && !isNaN(fecha)
    ? `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()} a las ${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
    : 'fecha no registrada';
  return `Firmas gobernadas por el panel ${panel.id}, sellado el ${cuando} por ${panel.selladoPor?.correo || 'responsable no registrado'}.`;
}

/* ───── Estructuras vacías ───── */

export function firmanteVacioCYE(numeroJurado) {
  return {
    numeroJurado,
    apellidos: '',
    nombres: '',
    nombreCompleto: '',
    dni: '',
    institucion: '',
    cargo: '',
    correo: '',
    presidente: false,
    firmaDataUrl: null,
    juradoRef: ''
  };
}

export function panelVacioCYE({ alcance = CYE_CONFIG.alcanceFirmaPorDefecto, categoria = null } = {}) {
  return {
    id: scopeIdCYE({ alcance, categoria }),
    eventoId: CYE_CONFIG.eventoId,
    etapa: CYE_CONFIG.etapa,
    alcance,
    categoria: alcance === ALCANCES_CYE.GLOBAL ? null : categoria,
    firmantes: SLOTS_JURADO.map(firmanteVacioCYE),
    estado: 'borrador',
    historial: []
  };
}

/* ───── Verificación previa al sellado ───── */

export function verificarPanelCYE(panel, { evaluacionesDelAlcance = [], participantesDelAlcance = [] } = {}) {
  const firmantes = panel?.firmantes || [];
  const checks = [];

  const sinNombre = firmantes.filter(f => !nombreCompletoValido(f.nombreCompleto));
  checks.push({
    id: 'nombres', bloqueante: true, ok: sinNombre.length === 0 && firmantes.length === SLOTS_JURADO.length,
    label: `Los ${SLOTS_JURADO.length} firmantes tienen nombres y apellidos completos`,
    detalle: sinNombre.map(f => `Jurado N.° ${f.numeroJurado}: falta el nombre completo.`)
  });

  const dnis = firmantes.map(f => soloDigitos(f.dni));
  const dnisInvalidos = firmantes.filter(f => !validarDNI(f.dni));
  const repetidos = dnisInvalidos.length === 0 && new Set(dnis).size < dnis.length;
  checks.push({
    id: 'dni', bloqueante: true, ok: dnisInvalidos.length === 0 && !repetidos,
    label: `Los ${SLOTS_JURADO.length} DNI son válidos (8 dígitos) y distintos`,
    detalle: [
      ...dnisInvalidos.map(f => `Jurado N.° ${f.numeroJurado}: el DNI debe tener exactamente 8 dígitos.`),
      ...(repetidos ? ['Hay DNI repetidos entre los firmantes.'] : [])
    ]
  });

  const sinFirma = firmantes.filter(f => !(f.firmaDataUrl && String(f.firmaDataUrl).startsWith('data:image')));
  checks.push({
    id: 'firmas', bloqueante: true, ok: sinFirma.length === 0,
    label: `Los ${SLOTS_JURADO.length} firmantes registraron su firma`,
    detalle: sinFirma.map(f => `El Jurado N.° ${f.numeroJurado} no ha registrado su firma.`)
  });

  const presidentes = firmantes.filter(f => f.presidente);
  checks.push({
    id: 'presidente', bloqueante: false, ok: presidentes.length === 1,
    label: 'Se indicó quién preside el jurado calificador',
    detalle: presidentes.length > 1
      ? ['Solo un firmante puede presidir el jurado.']
      : (presidentes.length === 0 ? ['Las bases sugieren que presida el jefe del área de Gestión Pedagógica de la UGEL o quien designe (numeral 7).'] : [])
  });

  const esperadas = participantesDelAlcance.length * SLOTS_JURADO.length;
  const registradas = evaluacionesDelAlcance.filter(ev => ev.estado === 'registrada').length;
  checks.push({
    id: 'fichas', bloqueante: false, ok: esperadas > 0 && registradas >= esperadas,
    label: 'Todas las fichas del alcance están registradas',
    detalle: registradas < esperadas ? [`${registradas} de ${esperadas} fichas registradas.`] : []
  });

  const bloqueantesFallidos = checks.filter(c => c.bloqueante && !c.ok);
  const advertencias = checks.filter(c => !c.bloqueante && !c.ok);
  return { checks, puedeSellar: bloqueantesFallidos.length === 0, bloqueantesFallidos, advertencias };
}

/* ───── Validación del trazo (evita firmas vacías o de un solo punto) ───── */

export function firmaEsValidaCYE(dataUrl, { minPixelesTinta = 400 } = {}) {
  return new Promise(resolve => {
    if (!dataUrl || !String(dataUrl).startsWith('data:image')) {
      resolve({ valida: false, motivo: 'No se registró ningún trazo de firma.' });
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
          for (let i = 0; i < data.length; i += 4) {
            const alfa = data[i + 3];
            const oscuro = data[i] + data[i + 1] + data[i + 2] < 600;
            if (alfa > 0 && oscuro) {
              tinta += 1;
              if (tinta >= minPixelesTinta) break;
            }
          }
          resolve(tinta >= minPixelesTinta
            ? { valida: true }
            : { valida: false, motivo: 'El trazo de firma es insuficiente. Vuelva a firmar.' });
        } catch (e) {
          resolve({ valida: true });
        }
      };
      img.onerror = () => resolve({ valida: false, motivo: 'La imagen de firma no pudo leerse.' });
      img.src = dataUrl;
    } catch (e) {
      resolve({ valida: false, motivo: 'La imagen de firma no pudo procesarse.' });
    }
  });
}

/* ───── Caché local de firma, aislada por alcance, casillero y DNI ───── */

export function claveCacheFirmaCYE(scopeId, numeroJurado, dni) {
  const d = soloDigitos(dni);
  if (!scopeId || !numeroJurado || d.length !== 8) return null;
  return `cye_sig_${scopeId}_j${numeroJurado}_dni_${d}`;
}

export function guardarFirmaEnCacheCYE(scopeId, numeroJurado, dni, dataUrl) {
  const clave = claveCacheFirmaCYE(scopeId, numeroJurado, dni);
  if (!clave || !dataUrl) return false;
  try { localStorage.setItem(clave, dataUrl); return true; } catch (e) { return false; }
}

export function leerFirmaDeCacheCYE(scopeId, numeroJurado, dni) {
  const clave = claveCacheFirmaCYE(scopeId, numeroJurado, dni);
  if (!clave) return null;
  try {
    const v = localStorage.getItem(clave);
    return v && v.startsWith('data:image') ? v : null;
  } catch (e) {
    return null;
  }
}

export function invalidarCacheDeScopeCYE(scopeId) {
  if (!scopeId) return 0;
  const prefijo = `cye_sig_${scopeId}_`;
  let borradas = 0;
  try {
    const claves = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefijo)) claves.push(k);
    }
    claves.forEach(k => { localStorage.removeItem(k); borradas += 1; });
  } catch (e) {
    return borradas;
  }
  return borradas;
}

/* ───── Bloques para los generadores de PDF ───── */

export function bloqueFirmaCYE(firmante, numeroJurado) {
  if (!firmante) {
    return { numeroJurado, pendiente: true, nombreCompleto: '', dni: '', institucion: '', cargo: '', presidente: false, firmaDataUrl: null };
  }
  return {
    numeroJurado: Number(firmante.numeroJurado) || numeroJurado,
    pendiente: false,
    nombreCompleto: firmante.nombreCompleto || '',
    dni: firmante.dni || '',
    institucion: firmante.institucion || '',
    cargo: firmante.cargo || '',
    presidente: Boolean(firmante.presidente),
    firmaDataUrl: firmante.firmaDataUrl || null
  };
}

export function bloquesFirmaDePanelCYE(panel) {
  return firmantesOrdenadosCYE(panel).map((f, i) => bloqueFirmaCYE(f, SLOTS_JURADO[i]));
}
