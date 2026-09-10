/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — SISTEMA DE ESTILOS PROFESIONAL DEL MÓDULO
   Estilo visual unificado y premium basado en Juegos Florales.
   Navy institucional, acentos dorados y esmeralda, alto contraste,
   tarjetas elevadas y botones con gradientes ejecutivos.
   ═══════════════════════════════════════════════════════════════ */

import { C, CE } from '../../data/eurekaCatalogos';

// Extender C con los tokens de Juegos Florales para compatibilidad y coherencia total
export const CJF = {
  navy1: '#0C1929',
  navy2: '#122240',
  navy3: '#1B3A5C',
  navy4: '#1E4D7B',
  gold: '#CA8A04',
  goldLight: '#FDE047',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  border: '#D6DCE8',
  g50: '#F8FAFC',
  g100: '#F1F5F9',
  g200: '#E2E8F0',
  g500: '#64748B',
  g800: '#1E293B',
  green: '#15803D',
  greenLight: '#DCFCE7',
  amber: '#B45309',
  red: '#B91C1C'
};

export { C, CE };

export const S = {
  tarjeta: {
    background: '#FFFFFF',
    border: '1px solid #D6DCE8',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
    transition: 'all 0.2s ease'
  },

  seccion: {
    background: '#FFFFFF',
    border: '1px solid #D6DCE8',
    borderRadius: 8,
    padding: '20px 22px',
    marginBottom: 20,
    boxShadow: '0 1px 4px rgba(15,23,42,0.04)'
  },

  tituloSeccion: {
    fontSize: 14,
    fontWeight: 800,
    color: '#122240',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '2px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },

  etiqueta: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5
  },

  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#122240',
    background: '#FFFFFF',
    border: '1px solid #D6DCE8',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s'
  },

  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    lineHeight: 1.5,
    color: '#1E293B',
    background: '#FFFFFF',
    border: '1px solid #D6DCE8',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    minHeight: 80,
    resize: 'vertical'
  },

  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
    border: '1px solid #D6DCE8'
  },

  th: {
    background: '#1B3A5C', // Navy profundo idéntico a Juegos Florales (Imagen 2)
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    padding: '10px 12px',
    textAlign: 'left',
    border: '1px solid #D6DCE8'
  },

  td: {
    padding: '10px 12px',
    border: '1px solid #D6DCE8',
    verticalAlign: 'middle',
    color: '#1E293B',
    fontSize: 12.5,
    lineHeight: 1.45
  },

  chip: (fondo, texto, borde) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 9px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    background: fondo,
    color: texto,
    border: `1px solid ${borde || fondo}`,
    whiteSpace: 'nowrap'
  })
};

export function btn(tipo = 'primario', extra = {}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: 'none'
  };
  const variantes = {
    primario: { background: '#1B3A5C', color: '#FFFFFF', border: 'none', boxShadow: '0 2px 4px rgba(27,58,92,0.15)' },
    secundario: { background: '#FFFFFF', color: '#122240', border: '1px solid #D6DCE8' },
    institucional: { background: '#1E4D7B', color: '#FFFFFF', border: 'none' },
    exito: { background: '#15803D', color: '#FFFFFF', border: 'none', boxShadow: '0 2px 4px rgba(21,128,61,0.2)' },
    dorado: { background: '#CA8A04', color: '#FFFFFF', border: 'none', boxShadow: '0 2px 4px rgba(202,138,4,0.2)' },
    real: {
      background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
      color: '#FFFFFF',
      border: '1px solid #3B82F6',
      boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
    },
    indigo: {
      background: 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)',
      color: '#FFFFFF',
      border: '1px solid #6366F1',
      boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)'
    },
    peligroSuave: { background: '#FFF1F2', color: '#B91C1C', border: '1px solid #FECDD3' },
    peligro: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5' },
    critico: { background: '#B91C1C', color: '#FFFFFF', border: 'none' },
    plano: { background: 'transparent', color: '#64748B', border: 'none' }
  };
  return { ...base, ...(variantes[tipo] || variantes.primario), ...extra };
}

export function btnDeshabilitado(estilo) {
  return { ...estilo, opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' };
}

/** Aviso de bloque: 'info' | 'exito' | 'alerta' | 'error' | 'eureka'. */
export function aviso(tipo = 'info') {
  const mapa = {
    info: { fondo: '#EFF6FF', borde: '#BFDBFE', texto: '#1E40AF', acento: '#3B82F6' },
    exito: { fondo: '#F0FDF4', borde: '#BBF7D0', texto: '#15803D', acento: '#22C55E' },
    alerta: { fondo: '#FFFBEB', borde: '#FDE68A', texto: '#B45309', acento: '#F59E0B' },
    error: { fondo: '#FEF2F2', borde: '#FECACA', texto: '#B91C1C', acento: '#EF4444' },
    eureka: { fondo: '#F0FDF4', borde: '#BBF7D0', texto: '#166534', acento: '#16A34A' }
  };
  const c = mapa[tipo] || mapa.info;
  return {
    background: c.fondo,
    border: `1px solid ${c.borde}`,
    borderLeft: `5px solid ${c.acento}`,
    borderRadius: 6,
    padding: '12px 16px',
    fontSize: 13,
    lineHeight: 1.5,
    color: c.texto
  };
}

/** Estado visual de una comprobación del panel de firmas. */
export function estadoCheck(ok, bloqueante) {
  if (ok) return { texto: 'ok', color: '#15803D', fondo: '#F0FDF4' };
  return bloqueante
    ? { texto: 'falta', color: '#B91C1C', fondo: '#FEF2F2' }
    : { texto: 'aviso', color: '#B45309', fondo: '#FFFBEB' };
}
