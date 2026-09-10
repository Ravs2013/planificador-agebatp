/* ═══════════════════════════════════════════════════════════════
   CREA Y EMPRENDE 2026 — SISTEMA DE ESTILOS
   Paleta, tipografías y componentes idénticos al módulo de Juegos Florales:
   navy institucional, acento dorado, tarjetas con borde lateral de estado.
   ═══════════════════════════════════════════════════════════════ */

export const C = {
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
  g300: '#CBD5E1',
  g500: '#64748B',
  g700: '#334155',
  g800: '#1E293B',
  g900: '#0F172A',
  green: '#15803D',
  amber: '#B45309',
  red: '#B91C1C',
  sky: '#0284C7'
};

export const FUENTES = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', monospace"
};

export const S = {
  tarjeta: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(15,23,42,0.06)'
  },
  seccion: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(15,23,42,0.04)'
  },
  etiqueta: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: C.g500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    fontWeight: 600,
    color: C.navy2,
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    lineHeight: 1.5,
    color: C.g800,
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    minHeight: 80,
    resize: 'vertical'
  },
  th: {
    padding: '10px 10px',
    border: `1px solid ${C.border}`,
    color: C.white,
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'left',
    background: C.navy3
  },
  td: {
    padding: '8px 10px',
    border: `1px solid ${C.border}`,
    fontSize: 12,
    color: C.g800,
    verticalAlign: 'middle'
  },
  chip: (fondo, texto, borde) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 9px',
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 800,
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
    fontFamily: FUENTES.sans,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: 'none'
  };
  const variantes = {
    primario: { background: C.navy3, color: C.white },
    secundario: { background: C.white, color: C.navy2, border: `1px solid ${C.border}` },
    contorno: { background: C.white, color: C.navy3, border: `1px solid ${C.navy3}` },
    dorado: { background: C.gold, color: C.navy1 },
    exito: { background: C.green, color: C.white, boxShadow: '0 2px 6px rgba(21,128,61,0.25)' },
    real: {
      background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
      color: C.white,
      border: '1px solid #3B82F6',
      boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
    },
    indigo: {
      background: 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)',
      color: C.white,
      border: '1px solid #6366F1',
      boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)'
    },
    gris: { background: C.g100, color: C.navy2, border: `1px solid ${C.border}` },
    peligroSuave: { background: '#FFF1F2', color: C.red, border: '1px solid #FECDD3' },
    critico: { background: C.red, color: C.white },
    plano: { background: 'transparent', color: C.g500 }
  };
  return { ...base, ...(variantes[tipo] || variantes.primario), ...extra };
}

export function btnDeshabilitado(estilo) {
  return { ...estilo, opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' };
}

export function aviso(tipo = 'info') {
  const mapa = {
    info: { fondo: '#EFF6FF', borde: '#BFDBFE', texto: '#1E40AF', acento: '#3B82F6' },
    exito: { fondo: '#F0FDF4', borde: '#BBF7D0', texto: '#15803D', acento: '#22C55E' },
    alerta: { fondo: '#FFFBEB', borde: '#FDE68A', texto: '#B45309', acento: '#F59E0B' },
    error: { fondo: '#FEF2F2', borde: '#FECACA', texto: '#B91C1C', acento: '#EF4444' }
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

export function estadoCheck(ok, bloqueante) {
  if (ok) return { texto: 'ok', color: C.green, fondo: '#F0FDF4' };
  return bloqueante
    ? { texto: 'falta', color: C.red, fondo: '#FEF2F2' }
    : { texto: 'aviso', color: C.amber, fondo: '#FFFBEB' };
}

/** Contenedor modal estándar del sistema (se adapta a pantalla completa en móviles). */
export const MODAL_FONDO = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(12,25,41,0.7)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20
};

export const MODAL_CAJA = {
  background: C.white,
  borderRadius: 8,
  padding: 24,
  width: '100%',
  maxWidth: 520,
  maxHeight: '92vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
};
