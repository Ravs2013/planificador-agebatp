/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — PADRÓN OPERATIVO DE JURADOS EVALUADORES
   Origen: RELACION_DE_JURADOS_PRIMARIA.xlsx (12 registros, solo nivel Primaria).
   Colección Firestore: eurekaJuradosEvaluadores — ID del documento: campo dni.

   ADVERTENCIAS SOBRE ESTOS DATOS:
   - Los DNI ya están normalizados a 8 dígitos. Algunos venían como número en el Excel;
     al leer cualquier fuente nueva aplicar String(v).replace(/\D/g,'').padStart(8,'0').
   - El correo 'maranac@ugel 03.gob.pe' contenía un espacio y era inválido. Se corrigió y
     se conservó el valor original en 'correoOriginal'.
   - El desglose apellidos/nombres es una INFERENCIA en 10 de los 12 registros. Los que
     tienen requiereValidacionNombre en true DEBEN ser validados por una persona antes de
     imprimirse en un anexo firmado. La pestaña Padrón incluye la pantalla de validación.
   - 'grupoAsignado' designa EQUIPOS POR CATEGORÍA (A, B, C), NO los casilleros de firma
     1/2/3 del Anexo E19. No confundirlos.
   - 'tipoMiembro' quedó en 'por_definir' en los 12 registros. Las bases (numeral 11)
     exigen 2 docentes de Educación Básica y 2 profesionales académicos por equipo. La
     comisión organizadora debe asignarlo.
   - COBERTURA PARCIAL: no hay jurados registrados para las categorías D y E (Secundaria).
     El Panel de Firmas admite alta manual para cubrir ese caso.
   ═══════════════════════════════════════════════════════════════ */

export const EQUIPOS_JURADO_PRIMARIA = [
  { grupo: 'A', etiquetaExcel: 'JURADO 1 — 1 Y 2 GRADO', categoria: 'A', grados: 'Primer y segundo grado de Primaria', miembros: 4 },
  { grupo: 'B', etiquetaExcel: 'JURADO 2 — 3 Y 4 GRADO', categoria: 'B', grados: 'Tercer y cuarto grado de Primaria', miembros: 4 },
  { grupo: 'C', etiquetaExcel: 'JURADO 3 — 5 Y 6 TO GRADO', categoria: 'C', grados: 'Quinto y sexto grado de Primaria', miembros: 4 }
];

export const JURADOS_EVALUADORES_EUREKA = [
  {
    "dni": "07943895",
    "nombreOriginal": "Valderrama barrientos Ana Rosario",
    "apellidos": "Valderrama Barrientos",
    "nombres": "Ana Rosario",
    "nombreCompleto": "Valderrama Barrientos, Ana Rosario",
    "correo": "avalderrama@ugel03.gob.pe",
    "correoOriginal": "avalderrama@ugel03.gob.pe",
    "celular": "962382336",
    "grupoAsignado": "A",
    "categoriasAsignadas": [
      "A"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "09501677",
    "nombreOriginal": "Pacheco Tello Milagro Odila",
    "apellidos": "Pacheco Tello",
    "nombres": "Milagro Odila",
    "nombreCompleto": "Pacheco Tello, Milagro Odila",
    "correo": "pachecomila@hotmail.com",
    "correoOriginal": "pachecomila@hotmail.com",
    "celular": "966506413",
    "grupoAsignado": "A",
    "categoriasAsignadas": [
      "A"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "",
    "correoInstitucional": false,
    "requiereValidacionNombre": true,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "09187543",
    "nombreOriginal": "Guerra Narro, Amparo del Rosario",
    "apellidos": "Guerra Narro",
    "nombres": "Amparo del Rosario",
    "nombreCompleto": "Guerra Narro, Amparo del Rosario",
    "correo": "amparodelrosa@gmail.com",
    "correoOriginal": "amparodelrosa@gmail.com",
    "celular": "959354883",
    "grupoAsignado": "A",
    "categoriasAsignadas": [
      "A"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "",
    "correoInstitucional": false,
    "requiereValidacionNombre": false,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "40506347",
    "nombreOriginal": "VILLALOBOS QUIROZ Alexsander Demetrio",
    "apellidos": "Villalobos Quiroz",
    "nombres": "Alexsander Demetrio",
    "nombreCompleto": "Villalobos Quiroz, Alexsander Demetrio",
    "correo": "advillquir_80@hotmail.com",
    "correoOriginal": "advillquir_80@hotmail.com",
    "celular": "989778738",
    "grupoAsignado": "A",
    "categoriasAsignadas": [
      "A"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "",
    "correoInstitucional": false,
    "requiereValidacionNombre": true,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "22407181",
    "nombreOriginal": "GONZALEZ Y ACOSTA MARGOT MAGDALENA",
    "apellidos": "González y Acosta",
    "nombres": "Margot Magdalena",
    "nombreCompleto": "González y Acosta, Margot Magdalena",
    "correo": "mmgonzaleza@ugel03.gob.pe",
    "correoOriginal": "mmgonzaleza@ugel03.gob.pe",
    "celular": "998068063",
    "grupoAsignado": "B",
    "categoriasAsignadas": [
      "B"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": true,
    "activo": true
  },
  {
    "dni": "08048697",
    "nombreOriginal": "ARANGUREN CARBAJAL, Ada María Lilly",
    "apellidos": "Aranguren Carbajal",
    "nombres": "Ada María Lilly",
    "nombreCompleto": "Aranguren Carbajal, Ada María Lilly",
    "correo": "amalic2640@gmail.com",
    "correoOriginal": "amalic2640@gmail.com",
    "celular": "940208993",
    "grupoAsignado": "B",
    "categoriasAsignadas": [
      "B"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "",
    "correoInstitucional": false,
    "requiereValidacionNombre": false,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "33589617",
    "nombreOriginal": "Olivos Flores José María",
    "apellidos": "Olivos Flores",
    "nombres": "José María",
    "nombreCompleto": "Olivos Flores, José María",
    "correo": "jolivos@ugel03.gob.pe",
    "correoOriginal": "jolivos@ugel03.gob.pe",
    "celular": "945231618",
    "grupoAsignado": "B",
    "categoriasAsignadas": [
      "B"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "76197403",
    "nombreOriginal": "Smith Diaz Sandra",
    "apellidos": "Smith Díaz",
    "nombres": "Sandra",
    "nombreCompleto": "Smith Díaz, Sandra",
    "correo": "sandrasd54@gmail.com",
    "correoOriginal": "sandrasd54@gmail.com",
    "celular": "932576986",
    "grupoAsignado": "B",
    "categoriasAsignadas": [
      "B"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "",
    "correoInstitucional": false,
    "requiereValidacionNombre": true,
    "tildesInferidas": true,
    "activo": true
  },
  {
    "dni": "09941664",
    "nombreOriginal": "Castillo Urday Haldanth Lester",
    "apellidos": "Castillo Urday",
    "nombres": "Haldanth Lester",
    "nombreCompleto": "Castillo Urday, Haldanth Lester",
    "correo": "lcastillou@ugel03.gob.pe",
    "correoOriginal": "lcastillou@ugel03.gob.pe ",
    "celular": "993785173",
    "grupoAsignado": "C",
    "categoriasAsignadas": [
      "C"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "08395747",
    "nombreOriginal": "SANCHEZ ORTIZ MARIA DELFINA",
    "apellidos": "Sánchez Ortiz",
    "nombres": "María Delfina",
    "nombreCompleto": "Sánchez Ortiz, María Delfina",
    "correo": "msanchezo@ugel03.gob.pe",
    "correoOriginal": "msanchezo@ugel03.gob.pe",
    "celular": "989686505",
    "grupoAsignado": "C",
    "categoriasAsignadas": [
      "C"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": true,
    "activo": true
  },
  {
    "dni": "09616898",
    "nombreOriginal": "arana carhuancota mirtha karina",
    "apellidos": "Arana Carhuancota",
    "nombres": "Mirtha Karina",
    "nombreCompleto": "Arana Carhuancota, Mirtha Karina",
    "correo": "maranac@ugel03.gob.pe",
    "correoOriginal": "maranac@ugel 03.gob.pe",
    "celular": "922585542",
    "grupoAsignado": "C",
    "categoriasAsignadas": [
      "C"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": false,
    "activo": true
  },
  {
    "dni": "07903991",
    "nombreOriginal": "GUZMAN BRITTO MARTIN",
    "apellidos": "Guzmán Britto",
    "nombres": "Martín",
    "nombreCompleto": "Guzmán Britto, Martín",
    "correo": "mguzman@ugel03.gob.pe",
    "correoOriginal": "mguzman@ugel03.gob.pe",
    "celular": "959949630",
    "grupoAsignado": "C",
    "categoriasAsignadas": [
      "C"
    ],
    "tipoMiembro": "por_definir",
    "institucion": "UGEL 03",
    "correoInstitucional": true,
    "requiereValidacionNombre": true,
    "tildesInferidas": true,
    "activo": true
  }
];

/* ───── Helpers de acceso ───── */

/** Normaliza cualquier DNI a 8 dígitos conservando los ceros a la izquierda. */
export function normalizarDNI(valor) {
  const soloDigitos = String(valor ?? '').replace(/\D/g, '');
  if (!soloDigitos) return '';
  return soloDigitos.length >= 8 ? soloDigitos.slice(-8) : soloDigitos.padStart(8, '0');
}

/** Elimina espacios internos de un correo. En el padrón real existía uno inválido. */
export function sanearCorreo(valor) {
  return String(valor ?? '').replace(/\s+/g, '').trim().toLowerCase();
}

export function getJuradoPorDNI(dni) {
  const d = normalizarDNI(dni);
  return JURADOS_EVALUADORES_EUREKA.find(j => j.dni === d) || null;
}

export function getJuradoPorCorreo(correo) {
  const c = sanearCorreo(correo);
  if (!c) return null;
  return JURADOS_EVALUADORES_EUREKA.find(j => sanearCorreo(j.correo) === c) || null;
}

/** Jurados operativos asignados a una categoría. */
export function getJuradosDeCategoria(categoria) {
  if (!categoria) return JURADOS_EVALUADORES_EUREKA.filter(j => j.activo);
  return JURADOS_EVALUADORES_EUREKA.filter(
    j => j.activo && (j.categoriasAsignadas || []).includes(categoria)
  );
}

/** Registros cuyo desglose apellidos/nombres aún no ha sido validado por una persona. */
export function getJuradosPendientesValidacion() {
  return JURADOS_EVALUADORES_EUREKA.filter(j => j.requiereValidacionNombre || j.tildesInferidas);
}

/**
 * Bloque de datos del jurado para autocompletar el Panel de Firmas.
 * Nunca devuelve un nombre genérico tipo "JURADO 1": si el valor coincide con ese patrón
 * de marcador de posición, se descarta.
 */
const PATRON_PLACEHOLDER = /^JURADO\s*\d*/i;

export function construirBloqueFirmanteEureka(dniOCorreo) {
  const j = getJuradoPorDNI(dniOCorreo) || getJuradoPorCorreo(dniOCorreo);
  if (!j) return null;
  const nombreCompleto = PATRON_PLACEHOLDER.test(j.nombreCompleto || '') ? '' : (j.nombreCompleto || '');
  return {
    apellidos: j.apellidos || '',
    nombres: j.nombres || '',
    nombreCompleto,
    dni: j.dni,
    correo: j.correo || '',
    institucion: j.institucion || '',
    tipoMiembro: j.tipoMiembro && j.tipoMiembro !== 'por_definir' ? j.tipoMiembro : 'docente_eb',
    cargo: '',
    juradoOperativoRef: j.dni,
    requiereValidacionNombre: Boolean(j.requiereValidacionNombre)
  };
}
