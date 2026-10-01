/* ═══════════════════════════════════════════════════════════════
   JURADOS EVALUADORES OFICIALES — PRECONGRESO COPAE UGEL 03
   Credenciales para los 2 jurados oficiales
   ═══════════════════════════════════════════════════════════════ */

export const JURADOS_OFICIALES_COPAE = [
  {
    numeroJurado: 1,
    slot: 1,
    correo: 'jurado1copae@ugel03.gob.pe',
    nombreCompleto: 'Jurado Evaluador N.° 1',
    cargo: 'Jurado Evaluador 1 — Precongreso COPAE UGEL 03',
    dni: ''
  },
  {
    numeroJurado: 2,
    slot: 2,
    correo: 'jurado2copae@ugel03.gob.pe',
    nombreCompleto: 'Jurado Evaluador N.° 2',
    cargo: 'Jurado Evaluador 2 — Precongreso COPAE UGEL 03',
    dni: ''
  }
];

export function esCorreoJuradoCOPAE(correo) {
  if (!correo || typeof correo !== 'string') return false;
  const c = correo.trim().toLowerCase();
  return c === 'jurado1copae@ugel03.gob.pe' || c === 'jurado2copae@ugel03.gob.pe' || (c.startsWith('jurado') && c.includes('copae'));
}

export function descomponerCredencialCOPAE(correo) {
  if (!esCorreoJuradoCOPAE(correo)) return null;
  const c = correo.trim().toLowerCase();
  const m = c.match(/^jurado([12])copae@ugel03\.gob\.pe$/);
  const numeroJurado = m ? Number(m[1]) : (c.includes('1') ? 1 : 2);
  const jurado = JURADOS_OFICIALES_COPAE.find(j => j.numeroJurado === numeroJurado) || {
    numeroJurado,
    slot: numeroJurado,
    correo: c,
    nombreCompleto: `Jurado Evaluador N.° ${numeroJurado}`,
    cargo: `Jurado Evaluador ${numeroJurado} — Precongreso COPAE UGEL 03`,
    dni: ''
  };
  return jurado;
}
