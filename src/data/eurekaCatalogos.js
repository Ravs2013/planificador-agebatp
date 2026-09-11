/* ═══════════════════════════════════════════════════════════════
   FERIA ESCOLAR NACIONAL DE CIENCIA Y TECNOLOGÍA EUREKA 2026
   Catálogos, paleta de color y textos legales del módulo
   Etapa UGEL — UGEL 03 — DRE Lima Metropolitana
   ═══════════════════════════════════════════════════════════════ */

/** Paleta institucional AGEBATP heredada. No modificar. */
export const C = {
  navy: '#0C1929',
  navy2: '#122240',
  navy3: '#1B3A5C',
  azul: '#1E4D7B',
  azulClaro: '#2E6DA4',
  dorado: '#CA8A04',
  doradoClaro: '#EAB308',
  gris900: '#111827',
  gris700: '#374151',
  gris500: '#6B7280',
  gris300: '#D1D5DB',
  gris200: '#E2E8F0',
  gris100: '#F3F4F6',
  gris50: '#F8FAFC',
  border: '#D6DCE8',
  blanco: '#FFFFFF',
  exito: '#15803D',
  alerta: '#B45309',
  error: '#B91C1C'
};

/** Acento cromático propio del módulo Eureka (logotipo oficial). */
export const CE = {
  // Los nombres se conservan por compatibilidad; los valores siguen la paleta azul
  // institucional de Juegos Florales y Crea y Emprende.
  verdeEureka: '#1B3A5C',
  verdeOscuro: '#122240',
  verdeHalo: '#BFDBFE',
  verdeFondo: '#EFF6FF',
  verdeBorde: '#BFDBFE',
  marronTexto: '#3D3128',
  acentoMorado: '#9B1B7C',
  acentoNaranja: '#E8663C',
  acentoRojo: '#D6453B',
  acentoAmbar: '#F0B429',
  acentoAzul: '#2B7BC4'
};

/** Equivalentes RGB para jsPDF (setFillColor / setTextColor). */
export const RGB = {
  // Paleta azul institucional en los PDF (sin verde), como en los demás módulos.
  verdeEureka: [27, 58, 92],
  verdeOscuro: [18, 34, 64],
  verdeHalo: [219, 234, 254],
  verdeFondo: [241, 245, 249],
  navy: [12, 25, 41],
  navy2: [18, 34, 64],
  navy3: [27, 58, 92],
  gris700: [55, 65, 81],
  gris500: [107, 114, 128],
  gris300: [209, 213, 219],
  gris100: [243, 244, 246],
  blanco: [255, 255, 255],
  error: [185, 28, 28],
  alerta: [180, 83, 9],
  exito: [21, 128, 61]
};

/** Tipos de miembro del jurado calificador (numeral 11 de las bases). */
export const TIPOS_MIEMBRO_JURADO = [
  { id: 'docente_eb', label: 'Docente de Educación Básica' },
  { id: 'profesional_academico', label: 'Profesional académico' },
  { id: 'por_definir', label: 'Por definir' }
];

/** Leyenda oficial de la escala de calificación de los anexos E15 a E18. */
export const LEYENDA_CALIFICACION_PONDERADA = {
  4: 'Evidencia un nivel superior a lo esperado respecto del criterio de evaluación.',
  3: 'Evidencia el nivel esperado, es decir cumple de manera satisfactoria con todo lo establecido en el criterio de evaluación.',
  2: 'Está próximo o cerca de cumplir lo establecido en el criterio de evaluación.',
  1: 'Muestra un nivel mínimo respecto de lo establecido en el criterio de evaluación.'
};

/**
 * Checklist de acreditación documental (numeral 7 de las bases).
 * Es informativo: registra el cumplimiento pero NO bloquea la evaluación,
 * porque las bases prevén subsanación.
 */
export const ACREDITACION_EUREKA = [
  { id: 'acr_informe', label: 'Informe del proyecto (formato digital)', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_cuaderno', label: 'Cuaderno de experiencia o de campo (formato digital)', categorias: ['A', 'B', 'C', 'D', 'E'], excluirLineas: ['historico', 'ambiental_territorial', 'economico'] },
  { id: 'acr_planificacion', label: 'Evidencia de la planificación docente del proyecto', categorias: ['A', 'B', 'C'] },
  { id: 'acr_e1', label: 'Anexo E1 — Ficha de inscripción firmada y sellada', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e2', label: 'Anexo E2 — Credencial', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e3', label: 'Anexo E3 — Carta de compromiso del padre, madre o apoderado', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e4', label: 'Anexo E4 — Autorización para difundir los informes', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e5', label: 'Anexo E5 — Autorización de grabación de video y fotografías', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e7', label: 'Anexo E7 — Declaración jurada del docente asesor', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e8', label: 'Anexo E8 — Acta de compromiso del docente asesor', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e9', label: 'Anexo E9 — Declaración de ética', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_e10', label: 'Anexo E10 — Formulario de resumen del informe', categorias: ['D', 'E'] },
  { id: 'acr_titulo_docente', label: 'Título profesional o pedagógico y DNI del docente asesor', categorias: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'acr_vinculo', label: 'Documento de vínculo laboral del docente con la I. E.', categorias: ['A', 'B', 'C', 'D', 'E'] }
];

/** Devuelve los ítems de acreditación aplicables a una categoría y línea. */
export function getAcreditacionAplicable(categoria, lineaId) {
  return ACREDITACION_EUREKA.filter(item => {
    if (!item.categorias.includes(categoria)) return false;
    if (item.excluirLineas && lineaId && item.excluirLineas.includes(lineaId)) return false;
    return true;
  });
}

/** Textos legales literales que se imprimen en los anexos oficiales. */
export const TEXTOS_LEGALES = {
  declaracionEticaE19:
    'Declaro tener conocimiento de toda la información y normas generales para la evaluación de EUREKA y declaro igualmente no tener parentesco ni relación pedagógica con los participantes.',

  transicionActaE20:
    'Efectúa la calificación, en coherencia con las bases, procediéndose a declarar lo siguiente:',

  parrafoFinalizaUGEL:
    'En esta etapa finaliza la participación de la categoría {categoria}, reconociéndose a los tres primeros puestos del área de {areaNombre}, conforme a las bases específicas.',

  parrafoClasificaDRE:
    'El informe de proyecto que ocupa el primer puesto queda seleccionado como ganador y clasifica a la etapa DRE de la Feria Escolar Nacional de Ciencia y Tecnología – EUREKA {anio}.',

  pieDocumentoPreliminar:
    'DOCUMENTO PRELIMINAR — SIN SUSCRIPCIÓN DEL JURADO CALIFICADOR',

  avisoPanelPendiente:
    'El Panel de Firmas Oficial aún no ha sido sellado.',

  avisoNoProsigue:
    'Concluye su participación conforme al numeral 1 del Anexo correspondiente.',

  bannerEmpate:
    'Empate detectado en el {puesto}.° puesto. Conforme al numeral 11 de las bases, el jurado calificador debe resolverlo antes de emitir el acta.',

  pieInstitucional:
    'Bases Específicas EUREKA 2026 — XXXVI Feria Escolar Nacional de Ciencia y Tecnología — Etapa UGEL — UGEL 03'
};

/** Motivos del reclamo del Anexo E21 (Ficha Única de Reclamos). */
export const MOTIVOS_RECLAMO_E21 = [
  { id: 'mot_calificacion', label: 'Inconformidad con el resultado o calificación del jurado.' },
  { id: 'mot_organizacion', label: 'Inconformidad con la Organización por la presentación de los estudiantes.' },
  { id: 'mot_bases', label: 'Incumplimiento de las Bases de EUREKA.' },
  { id: 'mot_otro', label: 'Otro motivo del reclamo:' }
];

/** Reglas del Anexo E21 que se imprimen al pie del formato. */
export const REGLAS_E21 = [
  'El docente asesor debe llenar este formato en forma clara y legible, indicando el motivo del reclamo.',
  'El reclamo debe de ser presentado a la Comisión Organizadora, hasta veinticuatro (24) horas después de la publicación de los resultados; posteriormente al cumplimiento de dicho plazo no se aceptarán reclamos.',
  'El reclamo debe estar debidamente sustentado.'
];

/** Cronograma oficial de la etapa UGEL (Anexo del cronograma específico MINEDU). */
export const CRONOGRAMA_EUREKA_2026 = [
  { hito: 'Inscripción SICE para etapa UGEL', desde: '2026-08-24', hasta: '2026-09-04' },
  { hito: 'Desarrollo del concurso — Etapa UGEL', desde: '2026-09-07', hasta: '2026-09-11', destacado: true },
  { hito: 'Inscripción SICE para etapa DRE', desde: '2026-09-14', hasta: '2026-09-18' },
  { hito: 'Etapa DRE', desde: '2026-09-21', hasta: '2026-09-25' }
];
