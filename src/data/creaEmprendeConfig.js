/* ═══════════════════════════════════════════════════════════════
   CONCURSO NACIONAL CREA Y EMPRENDE 2026 — CONFIGURACIÓN DE DOMINIO
   Etapa UGEL — UGEL 03 — DRE Lima Metropolitana
   Fuente: Bases Específicas 2026 — Anexo D y Cronograma específico CYE
   Decisiones de la Comisión Organizadora incorporadas (setiembre 2026).
   ═══════════════════════════════════════════════════════════════ */

export const CYE_CONFIG = {
  eventoId: 'CYE-2026',
  concurso: 'Concurso Nacional Crea y Emprende',
  anio: 2026,
  etapa: 'UGEL',
  dre: 'DRE LIMA METROPOLITANA',
  ugel: 'UGEL 03',
  region: 'Lima',
  provincia: 'Lima',
  distrito: 'Jesús María',
  sede: 'Auditorio de la I. E. Teresa Gonzales de Fanning',
  direccionSede: 'Av. Francisco Javier Mariátegui 1063, Jesús María',

  // Fecha de evaluación confirmada por la comisión.
  fechaEvaluacion: '2026-09-16',
  horaActa: '16:00',

  // Cronograma específico: inscripción de ganadores de la etapa I. E. hasta el 09/09.
  cierreInscripcionUGEL: '2026-09-09T23:59:59',

  // Los formatos D14 y D15 tienen exactamente tres casilleros de jurado.
  numeroJuradosPorFicha: 3,

  // Cada jurado ve por defecto los proyectos de su grupo.
  filtrarProyectosPorGrupo: true,

  alcanceFirmaPorDefecto: 'GLOBAL',
  dominioCredenciales: '@ugel03.gob.pe',

  // Aprobado por la comisión: el equipo que no se presenta a la Expoferia queda fuera del orden de mérito.
  inasistenciaExcluyeDelPodio: true,

  // Aprobado por la comisión: jerarquía para resolver empates en el podio.
  criterioDesempate: 'Jerarquía aprobada por la Comisión Organizadora: mayor puntaje acumulado en la rúbrica del portafolio (D11); de persistir, en la rúbrica del proyecto (D10); de persistir, en la escala de la Expoferia (D12).',

  // Umbrales de la calibración entre grupos (proporción del puntaje máximo de la categoría).
  calibracion: { brechaAlineada: 0.05, brechaRevisar: 0.10 }
};

export const SLOTS_JURADO = Array.from({ length: CYE_CONFIG.numeroJuradosPorFicha }, (_, i) => i + 1);

export const ANEXOS_CYE = [
  { id: 'D10', corto: 'Proyecto', titulo: 'Rúbrica de evaluación del proyecto de emprendimiento' },
  { id: 'D11', corto: 'Portafolio', titulo: 'Rúbrica de evaluación del portafolio del proyecto de emprendimiento' },
  { id: 'D12', corto: 'Expoferia', titulo: 'Escala de valoración de la presentación del proyecto de emprendimiento en la Expoferia' }
];

/**
 * CATEGORÍAS (numeral 3) y criterio de admisión de equipos aprobado por la comisión:
 * EBR con un mínimo de cinco integrantes del mismo grado y sección; CEBA de tres a cinco.
 */
export const CATEGORIAS_CYE = [
  {
    id: 'A', nombre: 'Categoría A', ciclo: 'VI ciclo de la EBR', grados: '1.er y 2.° grado de Educación Secundaria',
    modalidad: 'EBR', modalidadTexto: 'Educación Básica Regular', gradosValidos: ['PRIMERO', 'SEGUNDO'],
    minIntegrantes: 5, maxIntegrantes: 5,
    contexto: 'Soluciones a problemas económicos o sociales del contexto de las familias del equipo emprendedor o de las personas de su barrio.'
  },
  {
    id: 'B', nombre: 'Categoría B', ciclo: 'VII ciclo de la EBR', grados: '3.er, 4.° y 5.° grado de Educación Secundaria',
    modalidad: 'EBR', modalidadTexto: 'Educación Básica Regular', gradosValidos: ['TERCERO', 'CUARTO', 'QUINTO'],
    minIntegrantes: 5, maxIntegrantes: 5,
    contexto: 'Soluciones a problemas económicos o sociales de las personas de una comunidad, una ciudad, un distrito, una provincia, una región o del país.'
  },
  {
    id: 'C', nombre: 'Categoría C', ciclo: 'Ciclo avanzado de la EBA', grados: '1.er al 4.° grado del ciclo avanzado',
    modalidad: 'EBA', modalidadTexto: 'Educación Básica Alternativa', gradosValidos: ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO'],
    minIntegrantes: 3, maxIntegrantes: 5,
    contexto: 'Soluciones a problemas económicos o sociales de sus familias, de su barrio, comunidad, ciudad, distrito o a problemas globales.'
  }
];

/**
 * DISTRIBUCIÓN DE JURADOS (definida por la especialista a cargo del módulo).
 * Cuatro grupos de perfil mixto: en cada uno hay un directivo de educación básica, un
 * especialista de educación técnico-productiva y un perfil académico o de política educativa.
 * Las cuotas igualan la carga: Grupo 1 y Grupo 2 evalúan 15 proyectos cada uno; en la
 * categoría B, el Grupo 3 tiene cuatro integrantes y rota para que cada uno califique 16 o 17.
 */
export const GRUPOS_BASE_CYE = [
  { grupo: 1, categorias: ['A', 'C'], miembros: 3, cuota: { A: 13, C: 2 } },
  { grupo: 2, categorias: ['A'], miembros: 3, cuota: { A: 15 } },
  { grupo: 3, categorias: ['B'], miembros: 4, cuota: { B: 22 } },
  { grupo: 4, categorias: ['B'], miembros: 3, cuota: { B: 21 } }
];

export const ESTADOS_ADMISION = {
  apto: { id: 'apto', etiqueta: 'Apto', fondo: '#F0FDF4', texto: '#15803D', borde: '#BBF7D0' },
  observado: { id: 'observado', etiqueta: 'Observado', fondo: '#FFFBEB', texto: '#B45309', borde: '#FDE68A' },
  no_apto: { id: 'no_apto', etiqueta: 'No apto', fondo: '#FEF2F2', texto: '#B91C1C', borde: '#FECACA' }
};

export const TEXTOS_LEGALES_CYE = {
  transicionActa: 'Efectúa la calificación, en coherencia con las bases, procediéndose a declarar lo siguiente:',
  pieInstitucional: 'Bases Específicas 2026 — Concurso Nacional Crea y Emprende — Etapa UGEL — UGEL 03',
  pieDocumentoPreliminar: 'DOCUMENTO PRELIMINAR — SIN SUSCRIPCIÓN DEL JURADO CALIFICADOR',
  avisoPanelPendiente: 'El Panel de Firmas Oficial aún no ha sido sellado.'
};

export const DISPOSICIONES_BASES_CYE = [
  'Categoría A: 1.er y 2.° grado de secundaria. Categoría B: 3.er, 4.° y 5.° grado. Categoría C: ciclo avanzado de la EBA.',
  'Equipos de un mínimo de cinco (5) integrantes del mismo grado y sección. En los CEBA, de tres (3) a cinco (5) estudiantes.',
  'El resultado es la sumatoria de la rúbrica del proyecto (D10), la rúbrica del portafolio (D11) y la escala de valoración de la presentación en la Expoferia (D12).',
  'Se declaran ganadores los tres (3) proyectos con mayor puntaje por categoría. El 1.er y 2.° puesto se inscriben en la etapa DRE del 21 al 25 de setiembre.',
  'El fallo del Jurado Calificador es inapelable. Los reclamos (Anexo D16) se presentan hasta 24 horas después de publicados los resultados.'
];

/** Protocolo de la calibración previa entre grupos. */
export const PROTOCOLO_CALIBRACION_CYE = [
  'Cada jurado revisa el portafolio del proyecto de calibración y lo califica de forma individual en el módulo, sin conversar con los demás (20 a 30 minutos).',
  'La comisión proyecta los resultados: criterios con acuerdo, criterios por revisar, criterios con discrepancia y diferencia de puntaje entre grupos.',
  'Empezando por las discrepancias, cada jurado explica qué evidencia del portafolio o de la presentación lo llevó a elegir su nivel (20 a 30 minutos).',
  'El jurado acuerda una interpretación común por criterio. La comisión la registra y queda visible como guía debajo de ese criterio en las fichas oficiales.',
  'Si la diferencia entre grupos supera el 10 % del puntaje máximo, se vuelve a calificar el proyecto de calibración. Estas calificaciones no forman parte de los resultados.'
];

/**
 * Propuestas de interpretación para discutir en la calibración, derivadas de las
 * inconsistencias detectadas en las bases. La comisión las confirma o las reemplaza.
 * Clave: `${anexo}_${numero de criterio}`.
 */
export const PROPUESTAS_CALIBRACION_CYE = {
  A: {
    D11_3: 'La estructura del portafolio de la categoría A (Anexo D9) no pide análisis tecnológico. "Todos los análisis" se entiende como los que exige el D9: funcional, de usabilidad, morfológico, estructural y comparativo.',
    D12_4: 'La evidencia exige señalar el precio de venta. Si el equipo describe al cliente sin precio, no corresponde el nivel esperado (3).'
  },
  B: {
    D10_5: 'La categoría B evalúa la IA generativa en dos instrumentos. En el D10 se valora la estrategia de promoción con IA; en el D11 (criterio 8), la evidencia documentada en el portafolio.',
    D11_8: 'Los descriptores de los niveles 2 y 3 no son progresivos. Acordar antes de evaluar qué evidencia distingue cada nivel; por ejemplo, nivel 2: textos o imágenes hechos con IA sin difusión; nivel 3: piezas publicitarias digitales hechas con IA y difundidas.',
    D12_4: 'La evidencia exige señalar el precio de venta. Si el equipo describe al cliente sin precio, no corresponde el nivel esperado (3).'
  },
  C: {
    D10_2: 'En la categoría C las bases admiten problemas de la familia, el barrio, la comunidad, la ciudad, el distrito o problemas globales (numeral 3). Se valora la relación con el problema del contexto que declara el proyecto.',
    D11_3: 'La estructura del portafolio de la categoría C (Anexo D9) no pide análisis tecnológico. "Todos los análisis" se entiende como los que exige el D9.'
  }
};

/* ───── Helpers de dominio ───── */

export function getCategoriaCYE(id) {
  return CATEGORIAS_CYE.find(c => c.id === id) || null;
}

export function consolidadoIdCYE(categoria) {
  return `${CYE_CONFIG.eventoId}__${CYE_CONFIG.etapa}__${categoria}`;
}

export function categoriasDeGrupo(grupo) {
  const g = GRUPOS_BASE_CYE.find(x => Number(x.grupo) === Number(grupo));
  return g ? g.categorias : [];
}

export function gruposDeCategoria(categoria) {
  return GRUPOS_BASE_CYE.filter(g => g.categorias.includes(categoria)).map(g => g.grupo);
}
