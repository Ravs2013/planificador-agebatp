/* ════════════════════════════════════════════════════════════════
   E-SINAD Shared Helpers — AGEBATP UGEL 03
   Funciones y constantes compartidas entre MonitoreoModule, db.js
   y la Herramienta E-SINAD (Node.js).
   ════════════════════════════════════════════════════════════════ */

// ── PERSONAL E-SINAD ──
export const PERSONAL_ESINAD = [
  { id: 1, fullNames: ["GUTIERREZ SILVA"],    shortName: "Gutierrez S.",  nombre: "Gutierrez Silva, Liz M.",        rol: "oficinista",   tipo: "-" },
  { id: 2, fullNames: ["QUISPE SOLANO"],      shortName: "Quispe S.",     nombre: "Quispe Solano, Juan A.",         rol: "especialista", tipo: "ETP" },
  { id: 3, fullNames: ["ALBINO IGREDA"],      shortName: "Albino I.",     nombre: "Albino Igreda, Nelida",          rol: "especialista", tipo: "EBA" },
  { id: 4, fullNames: ["VILLALOBOS GONZALES"],shortName: "Villalobos G.", nombre: "Villalobos Gonzales, Francisco", rol: "especialista", tipo: "ETP" },
  { id: 5, fullNames: ["VASQUEZ ALIAGA"],     shortName: "Vasquez A.",    nombre: "Vasquez Aliaga, Lucy A.",        rol: "oficinista",   tipo: "-" },
  { id: 6, fullNames: ["CUELLAR CORNELIO"],   shortName: "Cuellar C.",    nombre: "Cuellar Cornelio, Beronica O.",  rol: "oficinista",   tipo: "-" },
];

export const SKIP_NAMES = ["NINAMANGO", "FBRC UGEL", "FBRC"];

// ── CATEGORÍAS ──
export const CAT_LABEL = { informes: "Informes", oficios: "Oficios", oficiosMultiples: "Of. Multiples", memorandums: "Memorandums" };
export const CAT_KEY   = { "Informes": "informes", "Oficios": "oficios", "Of. Multiples": "oficiosMultiples", "Memorandums": "memorandums" };

// ── matchPerson ──
export function matchPerson(excelName) {
  if (!excelName) return null;
  const up = String(excelName).toUpperCase().trim();
  if (SKIP_NAMES.some(s => up.includes(s))) return null;
  return PERSONAL_ESINAD.find(p => p.fullNames.some(fn => up.includes(fn))) || null;
}

// ── classifyDoc ──
export function classifyDoc(tipoDoc) {
  if (!tipoDoc || typeof tipoDoc !== "string") return null;
  const t = tipoDoc.trim().toUpperCase();
  if (t.startsWith("EXPEDIENTE")) return null;
  if (t.startsWith("INFORME")) return "informes";
  if (t.startsWith("OFICIO MULT") || t.startsWith("OFICIO MÚLT")) return "oficiosMultiples";
  if (t.startsWith("OFICIO")) return "oficios";
  if (t.startsWith("MEMORANDUM") || t.startsWith("MEMORÁNDUM")) return "memorandums";
  return null;
}

// ── Semana ISO 8601 (base jueves) — VERIFICADA: 2026-06-05 → "2026-W23" ──
export function isoWeekId(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ── Normalizar fecha (serial de Excel, "DD/MM/AAAA" o "AAAA-MM-DD") ──
export function parseFlexibleDate(val) {
  if (val == null || val === "") return null;
  if (val instanceof Date && !isNaN(val)) return val;
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d;
  }
  const s = String(val).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) { let y = +m[3]; if (y < 100) y += 2000; return new Date(Date.UTC(y, +m[2]-1, +m[1])); }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2]-1, +m[3]));
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ── A "YYYY-MM-DD" ──
export function toYMD(val) {
  const d = parseFlexibleDate(val);
  return d ? d.toISOString().split("T")[0] : "";
}

// ── Semana de una fila: por fechaDerivacion (fallback: fechaIngreso; fallback: hoy) ──
export function semanaDeFila(row) {
  const d = parseFlexibleDate(row.fechaDerivacion) || parseFlexibleDate(row.fechaIngreso) || new Date();
  return isoWeekId(d);
}

// ── Hash de movimiento (para contar "procesados" sin duplicar) ──
export function movimientoHash(row) {
  return [row.expediente, row.tipoDocumento, row.fechaDerivacion, row.fechaIngreso, row.destino, row.remiteOficina]
    .map(x => String(x || "").trim().toUpperCase()).join("|");
}

// ── Clave de documento para fusión ──
export function claveDoc(d) {
  return (d.tipoDocumento || "").trim().toUpperCase() || ("EXP-" + (d.expediente || ""));
}

// ── Recalcular `personas` (idempotente, conserva métricas) ──
export function computePersonas(documentos, movimientos) {
  const stats = {};
  PERSONAL_ESINAD.forEach(p => {
    stats[p.id] = { procesadosSinad: 0, informes: 0, oficios: 0, oficiosMultiples: 0, memorandums: 0, totalReal: 0 };
  });
  // procesadosSinad = nº de movimientos (filas) por persona
  (movimientos || []).forEach(m => {
    const s = stats[m.personId];
    if (s) s.procesadosSinad++;
  });
  // informes/oficios/.../totalReal = documentos únicos clasificados por persona
  (documentos || []).forEach(d => {
    const s = stats[d.personId];
    if (!s) return;
    const k = CAT_KEY[d.categoria];
    if (k) { s[k]++; s.totalReal++; }
  });
  return PERSONAL_ESINAD.map(p => ({
    personId: p.id,
    nombreExcel: "",
    shortName: p.shortName,
    rol: p.rol,
    tipo: p.tipo,
    ...stats[p.id]
  }));
}
