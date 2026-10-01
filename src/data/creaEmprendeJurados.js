/* ═══════════════════════════════════════════════════════════════
   CONCURSO NACIONAL CREA Y EMPRENDE 2026 — PADRÓN Y DISTRIBUCIÓN DE JURADOS
   Fuente de datos: JURADOS_CREA_Y_EMPRENDE.xlsx, hoja JURADO (13 jurados).

   DISTRIBUCIÓN
   Grupos de perfil mixto (directivo de educación básica + educación técnico-productiva +
   perfil académico o de política educativa). Dentro de cada grupo, el número de credencial
   sigue el orden alfabético de apellidos.

   CREDENCIALES
   Usuario:    grupo{G}jurado{N}@ugel03.gob.pe
   Contraseña: la misma cadena, en minúsculas (el login solo convierte a minúsculas el correo).

   Nombres tal como los confirmó la comisión. No se incluyen teléfonos ni correos personales:
   este archivo viaja en el bundle público de la aplicación.
   ═══════════════════════════════════════════════════════════════ */

import { CYE_CONFIG, categoriasDeGrupo } from './creaEmprendeConfig';

export function credencialCYE(categoria, grupo, numero) {
  return `cyecat${String(categoria).toLowerCase()}.g${Number(grupo)}.j${Number(numero)}${CYE_CONFIG.dominioCredenciales}`;
}

const jurado = (categoria, grupo, numero, apellidos, nombres, dni, cargo, institucion, opts = {}) => ({
  categoria,
  categorias: [categoria],
  grupo,
  numeroCredencial: numero,
  correo: opts.correo || credencialCYE(categoria, grupo, numero),
  apellidos,
  nombres,
  nombreCompleto: `${apellidos}, ${nombres}`.toUpperCase(),
  dni: dni || '00000000',
  cargo,
  institucion,
  perfil: cargo,
  origen: 'padron',
  ...opts
});

export const JURADOS_CYE = [
  // ── CATEGORÍA A ──
  // Grupo 1
  jurado('A', 1, 1, 'Sifuentes León', 'Melka', '40298666', 'Directora', 'Colegio San Roque (Los Olivos)'),
  jurado('A', 1, 2, 'Díaz Díaz', 'Frida Yovanna', '09709123', 'Directora', 'Colegio Miss Frida'),
  jurado('A', 1, 3, 'Arana Carhuancota', 'Mirtha Karina', '10000001', 'Especialista en Educación', 'UGEL 03'),

  // Grupo 2
  jurado('A', 2, 1, 'Alvarez Salazar', 'Edery Leon', '45409675', 'Catedrático', 'Universidad Nacional Federico Villarreal'),
  jurado('A', 2, 2, 'Calderón Torres', 'Jossy Delina', '10747499', 'Directora', 'IEP Guadalupe Nueva Generación (Ventanilla)'),
  jurado('A', 2, 3, 'Gonzales Oliver', 'Pedro', '10000002', 'Coordinador de Gestión Educativa Dirección de Proyectos', 'Universidad San Ignacio de Loyola (USIL)', { esTitular: true }),
  // Extra para panel de firmas: Martin Guzman Britto (no evalúa, pero se incluye en panel de firmas a solicitud)
  jurado('A', 2, 4, 'Guzman Britto', 'Martin', '10000003', 'Especialista en Educación', 'UGEL 03', { soloFirmas: true, correo: 'cye.martin.guzman@ugel03.gob.pe' }),

  // ── CATEGORÍA B ──
  // Grupo 1
  jurado('B', 1, 1, 'Moscoso Pacheco de Perez', 'Silvia Yolanda', '07019505', 'Directora', "Colegio Le D' Alembert"),
  jurado('B', 1, 2, 'Zúñiga Pablo', 'Grace', '10000004', 'Subgerente de Educación, Cultura, Deporte y juventud', 'Municipalidad Distrital de Carmen de la Legua Reynoso'),
  jurado('B', 1, 3, 'Quenaya Mayo', 'Celia', '10089476', 'Especialista del sector educación', 'Oficina de la UNESCO en el Perú'),

  // Grupo 2
  jurado('B', 2, 1, 'Brañez Medrano', 'Nick Josias', '42965455', 'Director de EP de Ciencias de la Comunicación', 'Universidad Peruana Unión (UPeU)'),
  jurado('B', 2, 2, 'Zavala Querevalu', 'Maria Angelica', '10000005', 'Especialista en Educación', 'UGEL 03'),
  jurado('B', 2, 3, 'Ugarte Rojas', 'Liz Estrella', '07627730', 'Directora', 'CETPRO PROMAE Breña'),

  // ── CATEGORÍA C ──
  // Grupo 1
  jurado('C', 1, 1, 'Mendoza Retamozo', 'Noemí', '23271871', 'Catedrática', 'Universidad César Vallejo (UCV)'),
  jurado('C', 1, 2, 'Castillo Urday', 'Haldanth Lester', '10000006', 'Especialista en Educación', 'UGEL 03'),
  jurado('C', 1, 3, 'Sifuentes León', 'Melka', '40298666', 'Directora', 'Colegio San Roque (Los Olivos)')
];

export const PATRON_CREDENCIAL_CYE = /^(?:cye\.?)?cat([abc])\.?g(\d+)\.?j(\d+)@ugel03\.gob\.pe$/i;
export const PATRON_CREDENCIAL_CYE_LEGACY = /^grupo(\d+)jurado(\d+)@ugel03\.gob\.pe$/i;

export function esCorreoJuradoCYE(correo) {
  const c = String(correo || '').trim().toLowerCase();
  if (PATRON_CREDENCIAL_CYE.test(c) || PATRON_CREDENCIAL_CYE_LEGACY.test(c)) return true;
  return JURADOS_CYE.some(j => j.correo.toLowerCase() === c);
}

export function descomponerCredencialCYE(correo) {
  const c = String(correo || '').trim().toLowerCase();
  const m = PATRON_CREDENCIAL_CYE.exec(c);
  if (m) {
    return {
      categoria: m[1].toUpperCase(),
      grupo: Number(m[2]),
      numeroCredencial: Number(m[3])
    };
  }
  const mLeg = PATRON_CREDENCIAL_CYE_LEGACY.exec(c);
  if (mLeg) {
    return {
      grupo: Number(mLeg[1]),
      numeroCredencial: Number(mLeg[2])
    };
  }
  const j = JURADOS_CYE.find(x => x.correo.toLowerCase() === c);
  if (j) {
    return {
      categoria: j.categoria,
      grupo: j.grupo,
      numeroCredencial: j.numeroCredencial
    };
  }
  return null;
}

/** Padrón completo: base del Excel + altas registradas en Firestore (estas prevalecen). */
export function combinarJuradosCYE(juradosFirestore = []) {
  const mapa = new Map();
  JURADOS_CYE.forEach(j => mapa.set(j.correo, j));
  juradosFirestore.forEach(j => {
    const clave = j.correo || `dni-${j.dni}`;
    mapa.set(clave, { ...mapa.get(clave), ...j, origen: j.origen || 'alta' });
  });
  return Array.from(mapa.values()).sort((a, b) =>
    (a.grupo - b.grupo) || ((a.numeroCredencial || 99) - (b.numeroCredencial || 99)));
}

export function getJuradoCYEPorCorreo(correo, juradosFirestore = []) {
  const c = String(correo || '').trim().toLowerCase();
  return combinarJuradosCYE(juradosFirestore).find(j => String(j.correo || '').toLowerCase() === c) || null;
}

export function juradosDeGrupo(grupo, juradosFirestore = []) {
  return combinarJuradosCYE(juradosFirestore).filter(j => Number(j.grupo) === Number(grupo));
}

export function siguienteNumeroCredencial(grupo, juradosFirestore = []) {
  const usados = juradosDeGrupo(grupo, juradosFirestore).map(j => Number(j.numeroCredencial) || 0);
  return usados.length ? Math.max(...usados) + 1 : 1;
}

export function bloqueFirmanteDesdeJurado(j) {
  if (!j) return null;
  return {
    apellidos: j.apellidos || '',
    nombres: j.nombres || '',
    nombreCompleto: j.nombreCompleto || `${j.apellidos || ''}, ${j.nombres || ''}`.toUpperCase(),
    dni: j.dni || '',
    institucion: j.institucion || '',
    cargo: j.cargo || '',
    correo: j.correo || '',
    grupo: j.grupo || null,
    juradoRef: j.dni || j.correo || ''
  };
}
