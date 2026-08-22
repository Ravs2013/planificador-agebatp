/* ═══════════════════════════════════════════════════════════════
   JUEGOS FLORALES ESCOLARES NACIONALES 2026 — ETAPA UGEL 03
   Vinculación CREDENCIAL → JURADO
   Fuentes cruzadas:
     - MATRIZ DE JURADOS DE JUEGOS FLORALES (DNI, apellidos, nombres, cargo)
     - JURADOS_2026.xlsx, Hoja2 (correo y contraseña por defecto)

   PROPÓSITO
   Al iniciar sesión, el sistema resuelve el correo a este registro y carga
   automáticamente nombre completo, DNI, cargo y número de jurado en la ficha,
   el Anexo A10 y el Anexo A11. El jurado NO digita ninguno de esos datos.
   ═══════════════════════════════════════════════════════════════ */

export const DOMINIO_JURADOS = "@ugel03.gob.pe";

/**
 * Un registro = un ASIENTO de jurado (disciplina + número).
 * Una misma persona puede ocupar varios asientos en distintas disciplinas.
 */
export const CREDENCIALES_JURADOS = [
  { disciplinaId: "teatro", disciplina: "TEATRO", numeroJurado: 1, email: "juradoteatro1@ugel03.gob.pe", passwordPorDefecto: "juradoteatro1", dni: "07841658", apellidoPaterno: "TOCTO", apellidoMaterno: "RUIZ", nombres: "MARCO TULIO", nombreCompleto: "TOCTO RUIZ, MARCO TULIO", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "teatro", disciplina: "TEATRO", numeroJurado: 2, email: "juradoteatro2@ugel03.gob.pe", passwordPorDefecto: "juradoteatro2", dni: "43519478", apellidoPaterno: "MARTINEZ", apellidoMaterno: "RAMIREZ", nombres: "EDDY MARCO", nombreCompleto: "MARTINEZ RAMIREZ, EDDY MARCO", cargo: "", celular: "936094900", asignado: true, observacion: "" },
  { disciplinaId: "teatro", disciplina: "TEATRO", numeroJurado: 3, email: "juradoteatro3@ugel03.gob.pe", passwordPorDefecto: "juradoteatro3", dni: "06261488", apellidoPaterno: "PRADO", apellidoMaterno: "LEDESMA", nombres: "JORGE EDDILBERTO", nombreCompleto: "PRADO LEDESMA, JORGE EDDILBERTO", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "baile_urbano", disciplina: "BAILE URBANO", numeroJurado: 1, email: "juradobaileurbano1@ugel03.gob.pe", passwordPorDefecto: "juradobaileurbano1", dni: "47788376", apellidoPaterno: "PALACIOS", apellidoMaterno: "ALCANTARA", nombres: "ANDREA DEL JASMIN", nombreCompleto: "PALACIOS ALCANTARA, ANDREA DEL JASMIN", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "baile_urbano", disciplina: "BAILE URBANO", numeroJurado: 2, email: "juradobaileurbano2@ugel03.gob.pe", passwordPorDefecto: "juradobaileurbano2", dni: "74993478", apellidoPaterno: "FERNANDEZ", apellidoMaterno: "PACHERRES", nombres: "JUDITH KARINA", nombreCompleto: "FERNANDEZ PACHERRES, JUDITH KARINA", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "baile_urbano", disciplina: "BAILE URBANO", numeroJurado: 3, email: "juradobaileurbano3@ugel03.gob.pe", passwordPorDefecto: "juradobaileurbano3", dni: "43519478", apellidoPaterno: "MARTINEZ", apellidoMaterno: "RAMIREZ", nombres: "EDDY MARCO", nombreCompleto: "MARTINEZ RAMIREZ, EDDY MARCO", cargo: "", celular: "936094900", asignado: true, observacion: "" },
  { disciplinaId: "danza_tradicional", disciplina: "DANZA TRADICIONAL", numeroJurado: 1, email: "juradodanzatradicional1@ugel03.gob.pe", passwordPorDefecto: "juradodanzatradicional1", dni: "47788376", apellidoPaterno: "PALACIOS", apellidoMaterno: "ALCANTARA", nombres: "ANDREA DEL JAZMIN", nombreCompleto: "PALACIOS ALCANTARA, ANDREA DEL JAZMIN", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "danza_tradicional", disciplina: "DANZA TRADICIONAL", numeroJurado: 2, email: "juradodanzatradicional2@ugel03.gob.pe", passwordPorDefecto: "juradodanzatradicional2", dni: "72386392", apellidoPaterno: "MALPARTIDA", apellidoMaterno: "PAREDES", nombres: "DANA ROCIO", nombreCompleto: "MALPARTIDA PAREDES, DANA ROCIO", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "danza_tradicional", disciplina: "DANZA TRADICIONAL", numeroJurado: 3, email: "juradodanzatradicional3@ugel03.gob.pe", passwordPorDefecto: "juradodanzatradicional3", dni: "08419206", apellidoPaterno: "SANDOVAL", apellidoMaterno: "MEDINA", nombres: "LIDIA", nombreCompleto: "SANDOVAL MEDINA, LIDIA", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["D", "E", "H"], observacion: "Jurado en categorías D, E y H" },
  { disciplinaId: "danza_tradicional", disciplina: "DANZA TRADICIONAL", numeroJurado: 3, email: "juradodanzatradicional3@ugel03.gob.pe", passwordPorDefecto: "juradodanzatradicional3", dni: "20032511", apellidoPaterno: "SALCEDO", apellidoMaterno: "ALIAGA", nombres: "URSULA ELIZABETH", nombreCompleto: "SALCEDO ALIAGA, URSULA ELIZABETH", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["F"], observacion: "Jurado exclusivo para la categoría F" },
  { disciplinaId: "canto_solista", disciplina: "CANTO SOLISTA", numeroJurado: 1, email: "juradocantosolista1@ugel03.gob.pe", passwordPorDefecto: "juradocantosolista1", dni: "40888940", apellidoPaterno: "CARLOS", apellidoMaterno: "REYES", nombres: "ROJAS", nombreCompleto: "CARLOS REYES, ROJAS", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "canto_solista", disciplina: "CANTO SOLISTA", numeroJurado: 2, email: "juradocantosolista2@ugel03.gob.pe", passwordPorDefecto: "juradocantosolista2", dni: "43480191", apellidoPaterno: "CACERES", apellidoMaterno: "CRUZ", nombres: "CESAR JAVIER", nombreCompleto: "CACERES CRUZ, CESAR JAVIER", cargo: "", celular: "976313143", asignado: true, observacion: "" },
  { disciplinaId: "canto_solista", disciplina: "CANTO SOLISTA", numeroJurado: 3, email: "juradocantosolista3@ugel03.gob.pe", passwordPorDefecto: "juradocantosolista3", dni: "06229301", apellidoPaterno: "HUALLAR", apellidoMaterno: "DIONICIO", nombres: "WILMER JUAN", nombreCompleto: "HUALLAR DIONICIO, WILMER JUAN", cargo: "JURADO CALIFICADOR", celular: "987034265", asignado: true, observacion: "" },
  { disciplinaId: "ensamble_instrumental", disciplina: "ENSAMBLE INSTRUMENTAL", numeroJurado: 1, email: "juradoensambleinstrumental1@ugel03.gob.pe", passwordPorDefecto: "juradoensambleinstrumental1", dni: "09947071", apellidoPaterno: "RODRIGUEZ", apellidoMaterno: "MONTES", nombres: "JAVIER", nombreCompleto: "RODRIGUEZ MONTES, JAVIER", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["D", "E"], observacion: "Jurado en categorías D y E" },
  { disciplinaId: "ensamble_instrumental", disciplina: "ENSAMBLE INSTRUMENTAL", numeroJurado: 2, email: "juradoensambleinstrumental2@ugel03.gob.pe", passwordPorDefecto: "juradoensambleinstrumental2", dni: "46368313", apellidoPaterno: "LA ROSA", apellidoMaterno: "RODRIGUEZ", nombres: "RENATO ENZO MIGUEL", nombreCompleto: "LA ROSA RODRIGUEZ, RENATO ENZO MIGUEL", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["D", "E"], observacion: "Jurado en categorías D y E" },
  { disciplinaId: "ensamble_instrumental", disciplina: "ENSAMBLE INSTRUMENTAL", numeroJurado: 3, email: "juradoensambleinstrumental3@ugel03.gob.pe", passwordPorDefecto: "juradoensambleinstrumental3", dni: "009730286", apellidoPaterno: "TOSKANA", apellidoMaterno: "LANZENDORFF", nombres: "VICENTE", nombreCompleto: "TOSKANA-LANZENDORFF, VICENTE", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["D", "E"], observacion: "Cédula de Extranjería / Jurado en categorías D y E" },
  { disciplinaId: "ensamble_instrumental", disciplina: "ENSAMBLE INSTRUMENTAL", numeroJurado: 1, email: "juradoensambleinstrumental1@ugel03.gob.pe", passwordPorDefecto: "juradoensambleinstrumental1", dni: "45560632", apellidoPaterno: "SALES", apellidoMaterno: "LEQQUE", nombres: "ELVIS", nombreCompleto: "SALES LEQQUE, ELVIS", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["F"], observacion: "Jurado exclusivo para la categoría F" },
  { disciplinaId: "ensamble_instrumental", disciplina: "ENSAMBLE INSTRUMENTAL", numeroJurado: 2, email: "juradoensambleinstrumental2@ugel03.gob.pe", passwordPorDefecto: "juradoensambleinstrumental2", dni: "009730286", apellidoPaterno: "TOSKANA", apellidoMaterno: "LANZENDORFF", nombres: "VICENTE", nombreCompleto: "TOSKANA-LANZENDORFF, VICENTE", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["F"], observacion: "Cédula de Extranjería / Jurado en categoría F" },
  { disciplinaId: "ensamble_instrumental", disciplina: "ENSAMBLE INSTRUMENTAL", numeroJurado: 3, email: "juradoensambleinstrumental3@ugel03.gob.pe", passwordPorDefecto: "juradoensambleinstrumental3", dni: "46779651", apellidoPaterno: "VERA", apellidoMaterno: "OTOYA", nombres: "JOSE ALEJANDRO", nombreCompleto: "VERA OTOYA, JOSE ALEJANDRO", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, categorias: ["F"], observacion: "Jurado exclusivo para la categoría F" },
  { disciplinaId: "banda_escolar", disciplina: "BANDA ESCOLAR DE MUSICA", numeroJurado: 1, email: "juradobandaescolar1@ugel03.gob.pe", passwordPorDefecto: "juradobandaescolar1", dni: "46779651", apellidoPaterno: "VERA", apellidoMaterno: "OTOYA", nombres: "JOSE ALEJANDRO", nombreCompleto: "VERA OTOYA, JOSE ALEJANDRO", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "banda_escolar", disciplina: "BANDA ESCOLAR DE MUSICA", numeroJurado: 2, email: "juradobandaescolar2@ugel03.gob.pe", passwordPorDefecto: "juradobandaescolar2", dni: "75952926", apellidoPaterno: "HUARCAYA", apellidoMaterno: "SALAZAR", nombres: "CAMILA BEATRIZ", nombreCompleto: "HUARCAYA SALAZAR, CAMILA BEATRIZ", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "banda_escolar", disciplina: "BANDA ESCOLAR DE MUSICA", numeroJurado: 3, email: "juradobandaescolar3@ugel03.gob.pe", passwordPorDefecto: "juradobandaescolar3", dni: "009730286", apellidoPaterno: "TOSKANA", apellidoMaterno: "LANZENDORFF", nombres: "VICENTE", nombreCompleto: "TOSKANA-LANZENDORFF, VICENTE", cargo: "JURADO CALIFICADOR", celular: "", asignado: true, observacion: "Cédula de Extranjería" },
  { disciplinaId: "pintura", disciplina: "PINTURA", numeroJurado: 1, email: "juradopintura1@ugel03.gob.pe", passwordPorDefecto: "juradopintura1", dni: "18093531", apellidoPaterno: "ZAVALETA", apellidoMaterno: "CABRERA", nombres: "EMILCEN CORY", nombreCompleto: "ZAVALETA CABRERA, EMILCEN CORY", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "pintura", disciplina: "PINTURA", numeroJurado: 2, email: "juradopintura2@ugel03.gob.pe", passwordPorDefecto: "juradopintura2", dni: "74993478", apellidoPaterno: "FERNANDEZ", apellidoMaterno: "PACHERRES", nombres: "JUDITH KARINA", nombreCompleto: "FERNANDEZ PACHERRES, JUDITH KARINA", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "pintura", disciplina: "PINTURA", numeroJurado: 3, email: "juradopintura3@ugel03.gob.pe", passwordPorDefecto: "juradopintura3", dni: "49012134", apellidoPaterno: "TINEO", apellidoMaterno: "CORDOVA", nombres: "AURORA", nombreCompleto: "TINEO CORDOVA, AURORA", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "escultura", disciplina: "ESCULTURA", numeroJurado: 1, email: "juradoescultura1@ugel03.gob.pe", passwordPorDefecto: "juradoescultura1", dni: "18093531", apellidoPaterno: "ZAVALETA", apellidoMaterno: "CABRERA", nombres: "EMILCEN CORY", nombreCompleto: "ZAVALETA CABRERA, EMILCEN CORY", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "escultura", disciplina: "ESCULTURA", numeroJurado: 2, email: "juradoescultura2@ugel03.gob.pe", passwordPorDefecto: "juradoescultura2", dni: "10426751", apellidoPaterno: "VEGA", apellidoMaterno: "PRINCIPE", nombres: "JORGE SIGFRIDO", nombreCompleto: "VEGA PRINCIPE, JORGE SIGFRIDO", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "escultura", disciplina: "ESCULTURA", numeroJurado: 3, email: "juradoescultura3@ugel03.gob.pe", passwordPorDefecto: "juradoescultura3", dni: "49012134", apellidoPaterno: "TINEO", apellidoMaterno: "CORDOVA", nombres: "AURORA", nombreCompleto: "TINEO CORDOVA, AURORA", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "fotografia", disciplina: "FOTOGRAFIA", numeroJurado: 1, email: "juradofotografia1@ugel03.gob.pe", passwordPorDefecto: "juradofotografia1", dni: "43574040", apellidoPaterno: "GARAY", apellidoMaterno: "AVENDAÑO", nombres: "DAVID ULISES", nombreCompleto: "GARAY AVENDAÑO, DAVID ULISES", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "fotografia", disciplina: "FOTOGRAFIA", numeroJurado: 2, email: "juradofotografia2@ugel03.gob.pe", passwordPorDefecto: "juradofotografia2", dni: "07430006", apellidoPaterno: "RAZURI", apellidoMaterno: "CLEMENTE", nombres: "ESTHER", nombreCompleto: "RAZURI CLEMENTE, ESTHER", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "fotografia", disciplina: "FOTOGRAFIA", numeroJurado: 3, email: "juradofotografia3@ugel03.gob.pe", passwordPorDefecto: "juradofotografia3", dni: "07535978", apellidoPaterno: "LOAYZA", apellidoMaterno: "OSORIO", nombres: "CARLOS RICARDO", nombreCompleto: "LOAYZA OSORIO, CARLOS RICARDO", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "arte_tradicional", disciplina: "ARTE TRADICIONAL", numeroJurado: 1, email: "juradoartetradicional1@ugel03.gob.pe", passwordPorDefecto: "juradoartetradicional1", dni: "07520981", apellidoPaterno: "VILLALOBOS", apellidoMaterno: "GONZALES", nombres: "FRANCISCO", nombreCompleto: "VILLALOBOS GONZALES, FRANCISCO", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "arte_tradicional", disciplina: "ARTE TRADICIONAL", numeroJurado: 2, email: "juradoartetradicional2@ugel03.gob.pe", passwordPorDefecto: "juradoartetradicional2", dni: "10426751", apellidoPaterno: "VEGA", apellidoMaterno: "PRINCIPE", nombres: "JORGE SIGFRIDO", nombreCompleto: "VEGA PRINCIPE, JORGE SIGFRIDO", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "arte_tradicional", disciplina: "ARTE TRADICIONAL", numeroJurado: 3, email: "juradoartetradicional3@ugel03.gob.pe", passwordPorDefecto: "juradoartetradicional3", dni: "49012134", apellidoPaterno: "TINEO", apellidoMaterno: "CORDOVA", nombres: "AURORA", nombreCompleto: "TINEO CORDOVA, AURORA", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "poesia", disciplina: "POESIA", numeroJurado: 1, email: "juradopoesia1@ugel03.gob.pe", passwordPorDefecto: "juradopoesia1", dni: "066773412", apellidoPaterno: "GONZALES", apellidoMaterno: "SANCHEZ", nombres: "ARACELLI DEL CARMEN", nombreCompleto: "GONZALES SANCHEZ, ARACELLI DEL CARMEN", cargo: "DOCTORA EN EDUCACION", celular: "", asignado: true, observacion: "DNI irregular en la matriz (9 dígitos). Verificar el número correcto." },
  { disciplinaId: "poesia", disciplina: "POESIA", numeroJurado: 2, email: "juradopoesia2@ugel03.gob.pe", passwordPorDefecto: "juradopoesia2", dni: "09072271", apellidoPaterno: "SUYO", apellidoMaterno: "VILLAR", nombres: "YSABEL INES", nombreCompleto: "SUYO VILLAR, YSABEL INES", cargo: "MAGISTER EN EDUCACION", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "poesia", disciplina: "POESIA", numeroJurado: 3, email: "juradopoesia3@ugel03.gob.pe", passwordPorDefecto: "juradopoesia3", dni: "06592334", apellidoPaterno: "MEL", apellidoMaterno: "GARAY", nombres: "DORA ANGELA", nombreCompleto: "MEL GARAY, DORA ANGELA", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "historietas_interactivas", disciplina: "HISTORIETAS INTERACTIVAS", numeroJurado: 1, email: "juradohistorietas1@ugel03.gob.pe", passwordPorDefecto: "juradohistorietas1", dni: "09760297", apellidoPaterno: "VELASQUEZ", apellidoMaterno: "LAVADO", nombres: "JOSE RAUL", nombreCompleto: "VELASQUEZ LAVADO, JOSE RAUL", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "historietas_interactivas", disciplina: "HISTORIETAS INTERACTIVAS", numeroJurado: 2, email: "juradohistorietas2@ugel03.gob.pe", passwordPorDefecto: "juradohistorietas2", dni: "07430006", apellidoPaterno: "RAZURI", apellidoMaterno: "CLEMENTE", nombres: "ESTHER", nombreCompleto: "RAZURI CLEMENTE, ESTHER", cargo: "PROMOTORA CULTURAL", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "historietas_interactivas", disciplina: "HISTORIETAS INTERACTIVAS", numeroJurado: 3, email: "juradohistorietas3@ugel03.gob.pe", passwordPorDefecto: "juradohistorietas3", dni: "43574040", apellidoPaterno: "GARAY", apellidoMaterno: "AVENDAÑO", nombres: "DAVID ULISES", nombreCompleto: "GARAY AVENDAÑO, DAVID ULISES", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "corto_audiovisual", disciplina: "CORTO AUDIOVISUAL", numeroJurado: 1, email: "juradocortoaudiovisual1@ugel03.gob.pe", passwordPorDefecto: "juradocortoaudiovisual1", dni: "43574040", apellidoPaterno: "GARAY", apellidoMaterno: "AVENDAÑO", nombres: "DAVID ULISES", nombreCompleto: "GARAY AVENDAÑO, DAVID ULISES", cargo: "DOCENTE", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "corto_audiovisual", disciplina: "CORTO AUDIOVISUAL", numeroJurado: 2, email: "juradocortoaudiovisual2@ugel03.gob.pe", passwordPorDefecto: "juradocortoaudiovisual2", dni: "47961653", apellidoPaterno: "ZEGARRA", apellidoMaterno: "REYES", nombres: "ROBERTO LUIS", nombreCompleto: "ZEGARRA REYES, ROBERTO LUIS", cargo: "", celular: "", asignado: true, observacion: "" },
  { disciplinaId: "corto_audiovisual", disciplina: "CORTO AUDIOVISUAL", numeroJurado: 3, email: "juradocortoaudiovisual3@ugel03.gob.pe", passwordPorDefecto: "juradocortoaudiovisual3", dni: "06148561", apellidoPaterno: "HUATUCO", apellidoMaterno: "MALDONADO", nombres: "YSABEL REINA", nombreCompleto: "HUATUCO MALDONADO, YSABEL REINA", cargo: "MAGISTER EN EDUCACION", celular: "", asignado: true, observacion: "" },
];

/** Jurados designados en la matriz que no tienen asiento con credencial. */
export const JURADOS_SIN_CREDENCIAL = [
  { disciplinaId: "escultura", disciplina: "ESCULTURA", dni: "09590982", nombreCompleto: "CENTENO NOVOA, JORGE BENIGNO", cargo: "DOCENTE", motivo: "Cuarto jurado; solo existen 3 credenciales." },
  { disciplinaId: "arte_tradicional", disciplina: "ARTE TRADICIONAL", dni: "09590982", nombreCompleto: "CENTENO NOVOA, JORGE BENIGNO", cargo: "DOCENTE", motivo: "Cuarto jurado; solo existen 3 credenciales." },
  { disciplinaId: "teatro", disciplina: "TEATRO", dni: "10426751", nombreCompleto: "VEGA PRINCIPE, JORGE SIGFRIDO", cargo: "DOCENTE", motivo: "Cuarto jurado; solo existen 3 credenciales." }
];

/** Personal de apoyo que no califica. No recibe credencial de jurado. */
export const PERSONAL_APOYO = [
  { rol: "MAESTRO DE CEREMONIA", dni: "06229301", nombreCompleto: "HUALLAR DIONICIO, WILMER JUAN", celular: "987034265" }
];

/* ───── Helpers ───── */

/** Resuelve la credencial a partir del correo de inicio de sesión y categoría opcional. */
export function getJuradoPorEmail(email, categoria = "") {
  const e = String(email || "").trim().toLowerCase();
  const catNorm = String(categoria || "").trim().toUpperCase();
  const matches = CREDENCIALES_JURADOS.filter(j => j.email.toLowerCase() === e);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  if (catNorm) {
    const catMatch = matches.find(j => Array.isArray(j.categorias) && j.categorias.map(c => String(c).toUpperCase()).includes(catNorm));
    if (catMatch) return catMatch;
  }

  return matches.find(j => !j.categorias || j.categorias.length === 0) || matches[0];
}

/** Asientos de una disciplina, ordenados por número de jurado, filtrados opcionalmente por categoría. */
export function getJuradosDeDisciplina(disciplinaId, categoria = "") {
  const catNorm = String(categoria || "").trim().toUpperCase();
  const list = CREDENCIALES_JURADOS.filter(j => j.disciplinaId === disciplinaId);
  const juradosMap = new Map();

  list.forEach(j => {
    const num = j.numeroJurado;
    const tieneCategorias = Array.isArray(j.categorias) && j.categorias.length > 0;

    if (!juradosMap.has(num)) {
      juradosMap.set(num, j);
    } else {
      if (catNorm && tieneCategorias && j.categorias.map(c => String(c).toUpperCase()).includes(catNorm)) {
        juradosMap.set(num, j);
      } else if (!catNorm && !tieneCategorias) {
        juradosMap.set(num, j);
      }
    }
  });

  return Array.from(juradosMap.values()).sort((a, b) => a.numeroJurado - b.numeroJurado);
}

/** Valida DNI o Cédula/Carné de Extranjería (8 a 12 dígitos). */
export function dniEsValido(dni) {
  return /^\d{8,12}$/.test(String(dni || "").trim());
}

/** Asientos que aún no tienen jurado designado. */
export function getAsientosSinAsignar() {
  return CREDENCIALES_JURADOS.filter(j => !j.asignado);
}

/** Registros con DNI ausente o irregular. */
export function getJuradosConDNIIrregular() {
  return CREDENCIALES_JURADOS.filter(j => j.asignado && !dniEsValido(j.dni));
}

/** Personas únicas por DNI, con todos los asientos que ocupan. */
export function getPersonasUnicas() {
  const m = new Map();
  CREDENCIALES_JURADOS.filter(j => j.asignado).forEach(j => {
    const k = j.dni || j.nombreCompleto;
    if (!m.has(k)) m.set(k, { dni: j.dni, nombreCompleto: j.nombreCompleto, cargo: j.cargo, celular: j.celular, asientos: [] });
    m.get(k).asientos.push({ disciplinaId: j.disciplinaId, disciplina: j.disciplina, numeroJurado: j.numeroJurado, email: j.email });
  });
  return Array.from(m.values());
}

/** Bloque listo para incrustar en la ficha, el A10 y el A11. */
export function construirBloqueJurado(email, categoria = "") {
  const j = getJuradoPorEmail(email, categoria);
  if (!j) return null;
  return {
    email: j.email,
    numeroJurado: j.numeroJurado,
    disciplinaId: j.disciplinaId,
    nombreCompleto: j.nombreCompleto,
    apellidoPaterno: j.apellidoPaterno,
    apellidoMaterno: j.apellidoMaterno,
    nombres: j.nombres,
    dni: j.dni,
    cargo: j.cargo,
    celular: j.celular,
    dniValido: dniEsValido(j.dni),
    requiereCompletarDatos: !j.asignado || !dniEsValido(j.dni),
    categorias: j.categorias || []
  };
}
