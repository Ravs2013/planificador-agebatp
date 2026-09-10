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

export function credencialCYE(grupo, numero) {
  return `grupo${Number(grupo)}jurado${Number(numero)}${CYE_CONFIG.dominioCredenciales}`;
}

const jurado = (grupo, numero, apellidos, nombres, dni, cargo, institucion, perfil) => ({
  grupo,
  numeroCredencial: numero,
  correo: credencialCYE(grupo, numero),
  apellidos,
  nombres,
  nombreCompleto: `${apellidos}, ${nombres}`.toUpperCase(),
  dni,
  cargo,
  institucion,
  perfil,
  categorias: categoriasDeGrupo(grupo),
  origen: 'padron'
});

export const JURADOS_CYE = [
  jurado(1, 1, 'Alejos Flores', 'Alex Gerardo', '40443422', 'Director', 'CETPRO Magdalena', 'Educación técnico-productiva'),
  jurado(1, 2, 'Quenaya Mayo', 'Celia', '10089476', 'Especialista del sector educación', 'Oficina de la UNESCO en el Perú', 'Política educativa'),
  jurado(1, 3, 'Sifuentes León', 'Melka', '40298666', 'Directora', 'Colegio San Roque (Los Olivos)', 'Directivo de educación básica'),

  jurado(2, 1, 'Calle Alcahuaman de Navarro', 'Eliana Elizabeth', '10294372', 'Docente', 'CETPRO Nuestra Señora de Montserrat', 'Educación técnico-productiva'),
  jurado(2, 2, 'Díaz Díaz', 'Frida Yovanna', '09709123', 'Directora', 'Colegio Miss Frida', 'Directivo de educación básica'),
  jurado(2, 3, 'Mendoza Retamozo', 'Noemí', '23271871', 'Catedrática', 'Universidad César Vallejo', 'Académico'),

  jurado(3, 1, 'Brañez Medrano', 'Nick Josias', '42965455', 'Director de la EP de Ciencias de la Comunicación', 'Universidad Peruana Unión', 'Académico'),
  jurado(3, 2, 'Calderón Torres', 'Jossy Delina', '10747499', 'Directora', 'IEP Guadalupe Nueva Generación (Ventanilla)', 'Directivo de educación básica'),
  jurado(3, 3, 'Reyes Salazar', 'Saida', '47463619', 'Docente', 'CETPRO Nuestra Señora de Montserrat', 'Educación técnico-productiva'),
  jurado(3, 4, 'Ugarte Rojas', 'Liz Estrella', '07627730', 'Directora', 'CETPRO PROMAE Breña', 'Educación técnico-productiva'),

  jurado(4, 1, 'Alvarez Salazar', 'Edery Leon', '45409675', 'Catedrático', 'Universidad Nacional Federico Villarreal', 'Académico'),
  jurado(4, 2, 'Ibarra Segura', 'Paula', '42888716', 'Docente', 'CETPRO Nuestra Señora de Montserrat', 'Educación técnico-productiva'),
  jurado(4, 3, 'Moscoso Pacheco de Perez', 'Silvia Yolanda', '07019505', 'Directora', "Colegio Le D'Alembert", 'Directivo de educación básica')
];

export const PATRON_CREDENCIAL_CYE = /^grupo(\d+)jurado(\d+)@ugel03\.gob\.pe$/i;

export function esCorreoJuradoCYE(correo) {
  return PATRON_CREDENCIAL_CYE.test(String(correo || '').trim());
}

export function descomponerCredencialCYE(correo) {
  const m = PATRON_CREDENCIAL_CYE.exec(String(correo || '').trim());
  return m ? { grupo: Number(m[1]), numeroCredencial: Number(m[2]) } : null;
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
