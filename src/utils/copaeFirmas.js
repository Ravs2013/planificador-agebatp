/* ═══════════════════════════════════════════════════════════════
   PRECONGRESO COPAE UGEL 03 — PANEL DE FIRMAS OFICIAL (2 JURADOS)
   Gobernanza centralizada de firmas diferidas.
   Las firmas y datos de los 2 jurados se registran una sola vez y se
   aplican automáticamente a todas las fichas de evaluación y al consolidado.
   ═══════════════════════════════════════════════════════════════ */

import { SLOTS_JURADO_COPAE } from '../data/copaeConfig';
import { JURADOS_OFICIALES_COPAE } from '../data/copaeJurados';

export const SCOPE_COPAE_GLOBAL = 'GLOBAL';

export function panelVacioCOPAE() {
  return {
    id: SCOPE_COPAE_GLOBAL,
    alcance: 'GLOBAL',
    estado: 'borrador', // 'borrador' | 'sellado'
    firmantes: SLOTS_JURADO_COPAE.map(slot => {
      const jOficial = JURADOS_OFICIALES_COPAE.find(j => j.numeroJurado === slot);
      return {
        numeroJurado: slot,
        slot,
        nombreCompleto: jOficial?.nombreCompleto || `Jurado Evaluador N.° ${slot}`,
        cargo: jOficial?.cargo || `Jurado Evaluador ${slot} — Precongreso COPAE UGEL 03`,
        dni: '',
        correo: jOficial?.correo || `jurado${slot}copae@ugel03.gob.pe`,
        firmaDataUrl: null,
        actualizadoEn: null
      };
    }),
    createdAt: null,
    updatedAt: null,
    selladoEn: null,
    selladoPor: null
  };
}

/**
 * Resuelve el panel de firmas oficial de COPAE.
 */
export function resolverPanelFirmasCOPAE(panelRemoto) {
  if (!panelRemoto) return null;
  const vacio = panelVacioCOPAE();
  return {
    ...vacio,
    ...panelRemoto,
    firmantes: SLOTS_JURADO_COPAE.map(slot => {
      const enc = (panelRemoto.firmantes || []).find(f => Number(f.numeroJurado || f.slot) === slot);
      return enc ? { ...enc, slot, numeroJurado: slot } : vacio.firmantes[slot - 1];
    })
  };
}

/**
 * Obtiene el firmante del casillero indicado (1 o 2).
 */
export function firmanteDelCasilleroCOPAE(panel, numeroJurado) {
  const slot = Number(numeroJurado);
  if (!SLOTS_JURADO_COPAE.includes(slot)) return null;
  const p = resolverPanelFirmasCOPAE(panel);
  if (!p) return null;
  return (p.firmantes || []).find(f => Number(f.numeroJurado || f.slot) === slot) || null;
}

/**
 * Devuelve los 2 firmantes ordenados por número de jurado.
 */
export function firmantesOrdenadosCOPAE(panel) {
  const p = resolverPanelFirmasCOPAE(panel);
  if (!p) return [];
  return SLOTS_JURADO_COPAE.map(slot => firmanteDelCasilleroCOPAE(p, slot));
}

/**
 * Determina si el panel está en estado preliminar (no sellado o sin firmas).
 */
export function esPreliminarCOPAE(panel) {
  if (!panel) return true;
  if (panel.estado === 'sellado') return false;
  const firmantes = panel.firmantes || [];
  const conFirma = firmantes.filter(f => f && f.firmaDataUrl && String(f.firmaDataUrl).startsWith('data:image'));
  if (conFirma.length >= SLOTS_JURADO_COPAE.length) return false;
  return true;
}

export function validarDNICOPAE(dni) {
  if (!dni) return false;
  const limpio = String(dni).trim();
  return /^\d{8}$/.test(limpio);
}
