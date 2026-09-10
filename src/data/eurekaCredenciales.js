/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — CREDENCIALES Y PADRÓN DE JURADOS OFICIALES
   UGEL 03 — Etapa UGEL (Primaria: Categorías A, B y C)
   ═══════════════════════════════════════════════════════════════ */

export const JURADOS_EUREKA_OFICIALES = [
  /* ── Categoría A (1 y 2 Grado) ── */
  {
    correo: 'eurekagrado1y2jurado1@ugel03.gob.pe',
    nombreCompleto: 'Valderrama Barrientos, Ana Rosario',
    dni: '07943895',
    telefono: '962382336',
    correoPersonal: 'avalderrama@ugel03.gob.pe',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 1
  },
  {
    correo: 'eurekagrado1y2jurado2@ugel03.gob.pe',
    nombreCompleto: 'Pacheco Tello, Milagro Odila',
    dni: '09501677',
    telefono: '966506413',
    correoPersonal: 'pachecomila@hotmail.com',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 2
  },
  {
    correo: 'eurekagrado1y2jurado3@ugel03.gob.pe',
    nombreCompleto: 'Guerra Narro, Amparo del Rosario',
    dni: '09187543',
    telefono: '959354883',
    correoPersonal: 'amparodelrosa@gmail.com',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 3
  },
  {
    correo: 'eurekagrado1y2jurado4@ugel03.gob.pe',
    nombreCompleto: 'Villalobos Quiroz, Alexsander Demetrio',
    dni: '40506347',
    telefono: '989778738',
    correoPersonal: 'advillquir_80@hotmail.com',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 4
  },

  /* ── Categoría B (3 y 4 Grado) ── */
  {
    correo: 'eurekagrado3y4jurado1@ugel03.gob.pe',
    nombreCompleto: 'González y Acosta, Margot Magdalena',
    dni: '22407181',
    telefono: '998068063',
    correoPersonal: 'mmgonzaleza@ugel03.gob.pe',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 1
  },
  {
    correo: 'eurekagrado3y4jurado2@ugel03.gob.pe',
    nombreCompleto: 'Aranguren Carbajal, Ada María Lilly',
    dni: '08048697',
    telefono: '940208993',
    correoPersonal: 'amalic2640@gmail.com',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 2
  },
  {
    correo: 'eurekagrado3y4jurado3@ugel03.gob.pe',
    nombreCompleto: 'Olivos Flores, José María',
    dni: '33589617',
    telefono: '945231618',
    correoPersonal: 'jolivos@ugel03.gob.pe',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 3
  },
  {
    correo: 'eurekagrado3y4jurado4@ugel03.gob.pe',
    nombreCompleto: 'Smith Díaz, Sandra',
    dni: '76197403',
    telefono: '932576986',
    correoPersonal: 'sandrasd54@gmail.com',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 4
  },

  /* ── Categoría C (5 y 6 Grado) ── */
  {
    correo: 'eurekagrado5y6jurado1@ugel03.gob.pe',
    nombreCompleto: 'Castillo Urday, Haldanth Lester',
    dni: '09941664',
    telefono: '993785173',
    correoPersonal: 'lcastillou@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 1
  },
  {
    correo: 'eurekagrado5y6jurado2@ugel03.gob.pe',
    nombreCompleto: 'Sánchez Ortiz, María Delfina',
    dni: '08395747',
    telefono: '989686505',
    correoPersonal: 'msanchezo@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 2
  },
  {
    correo: 'eurekagrado5y6jurado3@ugel03.gob.pe',
    nombreCompleto: 'Arana Carhuancota, Mirtha Karina',
    dni: '09616898',
    telefono: '922585542',
    correoPersonal: 'maranac@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 3
  },
  {
    correo: 'eurekagrado5y6jurado4@ugel03.gob.pe',
    nombreCompleto: 'Guzmán Britto, Martín',
    dni: '07903991',
    telefono: '959949630',
    correoPersonal: 'mguzman@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 4
  }
];

export const CREDENCIALES_EUREKA_MAP = Object.fromEntries(
  JURADOS_EUREKA_OFICIALES.map(j => [j.correo.toLowerCase(), j])
);

/**
 * Resuelve la credencial de un jurado de Eureka a partir de su correo.
 */
export function descomponerCredencialEureka(correo) {
  if (!correo) return null;
  const c = correo.trim().toLowerCase();
  if (CREDENCIALES_EUREKA_MAP[c]) {
    return { ...CREDENCIALES_EUREKA_MAP[c] };
  }

  // Patrón alternativo genérico: eurekagrado{1y2|3y4|5y6}jurado{N}@ugel03.gob.pe
  const m = c.match(/^eurekagrado([135])y([246])jurado([1-4])@ugel03\.gob\.pe$/);
  if (!m) return null;
  const g1 = m[1];
  const g2 = m[2];
  const num = Number(m[3]);
  const cat = g1 === '1' ? 'A' : (g1 === '3' ? 'B' : 'C');
  return {
    correo: c,
    nombreCompleto: `JURADO ${num} — GRADO ${g1} Y ${g2}`,
    dni: '',
    telefono: '',
    grupo: cat,
    categoria: cat,
    grados: `${g1} y ${g2} grado`,
    numeroJurado: num
  };
}
