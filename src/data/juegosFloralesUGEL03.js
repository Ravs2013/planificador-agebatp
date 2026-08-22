/* ═══════════════════════════════════════════════════════════════
   JUEGOS FLORALES ESCOLARES NACIONALES 2026 — ETAPA UGEL
   Programación oficial UGEL 03
   Fuente: COMUNICADO 01 — Etapa UGEL — Juegos Florales Escolares 2026
           Comisión Organizadora, La Victoria, 10 de agosto de 2026
   Bases:  RVM N.° 106-2026-MINEDU
   Eje temático 2026: "Sentir, pensar y crear para convivir"

   ESTE ARCHIVO DEFINE EL ALCANCE REAL DEL MÓDULO:
   solo estas 13 disciplinas y solo estas categorías habilitadas.
   ═══════════════════════════════════════════════════════════════ */

export const SEDES_UGEL03 = {
  tgf: {
    id: "tgf",
    nombre: "Auditorio I. E. Teresa Gonzales de Fanning",
    tipo: "presencial"
  },
  grau: {
    id: "grau",
    nombre: "Auditorio I. E. Miguel Grau",
    tipo: "presencial"
  },
  ugel03: {
    id: "ugel03",
    nombre: "UGEL 03",
    tipo: "no_presencial"
  }
};

export const EVENTO_UGEL03 = {
  eventoId: "JFEN-2026",
  etapa: "UGEL",
  anio: 2026,
  nombre: "Juegos Florales Escolares Nacionales 2026",
  ejeTematico: "Sentir, pensar y crear para convivir",
  dre: "DRE LIMA METROPOLITANA",
  ugel: "UGEL 03",
  region: "Lima",
  provincia: "Lima",
  baseLegal: "RVM N.° 106-2026-MINEDU",
  comunicado: "COMUNICADO 01 — Etapa UGEL",
  emitidoEn: "La Victoria",
  emitidoEl: "2026-08-10",
  plataformaInscripcion: "https://sice.minedu.gob.pe",
  fechaLimiteEnvioNoPresenciales: "2026-08-10"
};

/**
 * DISCIPLINAS HABILITADAS EN LA ETAPA UGEL 03
 * `categorias` es la lista CERRADA de categorías que compiten en esta etapa.
 * El módulo NO debe ofrecer ninguna disciplina ni categoría fuera de esta tabla.
 */
export const DISCIPLINAS_UGEL03 = [

  /* ── PRESENCIALES ── */
  {
    disciplinaId: "teatro",
    label: "TEATRO",
    modalidad: "presencial",
    categorias: ["D", "E", "F"],
    fecha: "2026-08-18",
    fechaTexto: "18 de agosto de 2026",
    sedeId: "tgf",
    horaInicio: "09:00",
    horaFin: "13:00",
    requiereSorteoOrden: true
  },
  {
    disciplinaId: "baile_urbano",
    label: "BAILE URBANO",
    modalidad: "presencial",
    categorias: ["E", "F"],
    fecha: "2026-08-18",
    fechaTexto: "18 de agosto de 2026",
    sedeId: "tgf",
    horaInicio: "14:00",
    horaFin: "16:00",
    requiereSorteoOrden: true
  },
  {
    disciplinaId: "danza_tradicional",
    label: "DANZA TRADICIONAL",
    modalidad: "presencial",
    categorias: ["D", "E", "F", "H"],
    fecha: "2026-08-19",
    fechaTexto: "19 de agosto de 2026",
    sedeId: "tgf",
    horaInicio: "09:00",
    horaFin: "13:00",
    requiereSorteoOrden: true
  },
  {
    disciplinaId: "canto_solista",
    label: "CANTO SOLISTA",
    modalidad: "presencial",
    categorias: ["D", "E", "F", "G"],
    fecha: "2026-08-20",
    fechaTexto: "20 de agosto de 2026",
    sedeId: "grau",
    horaInicio: "14:00",
    horaFin: "16:00",
    requiereSorteoOrden: true
  },
  {
    disciplinaId: "ensamble_instrumental",
    label: "ENSAMBLE INSTRUMENTAL",
    modalidad: "presencial",
    categorias: ["D", "E", "F"],
    fecha: "2026-08-21",
    fechaTexto: "21 de agosto de 2026",
    sedeId: "tgf",
    horaInicio: "09:00",
    horaFin: "13:00",
    requiereSorteoOrden: true
  },
  {
    disciplinaId: "banda_escolar",
    label: "BANDA ESCOLAR DE MÚSICA",
    modalidad: "presencial",
    categorias: ["F"],
    fecha: "2026-08-21",
    fechaTexto: "21 de agosto de 2026",
    sedeId: "tgf",
    horaInicio: "14:00",
    horaFin: "17:00",
    requiereSorteoOrden: true,
    nota: "Se inscribe en categoría F. Conforme a las bases, también se considera a estudiantes de 1.er y 2.° grado de Secundaria dentro de la agrupación."
  },

  /* ── NO PRESENCIALES ── */
  {
    disciplinaId: "pintura",
    label: "PINTURA",
    modalidad: "no_presencial",
    // Conforme al numeral 9.3.2 de las bases y a los 10 participantes inscritos en SICE, la categoría D en pintura está habilitada en la etapa UGEL 03.
    categorias: ["D", "E", "F", "G", "H"],
    fecha: "2026-08-12",
    fechaTexto: "12 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false,
    nota: "Pintura categoría D se habilita conforme al numeral 9.3.2 de las bases y a los 10 participantes inscritos en SICE, aunque no figura en el cuadro del Comunicado 01."
  },
  {
    disciplinaId: "escultura",
    label: "ESCULTURA",
    modalidad: "no_presencial",
    categorias: ["E", "F", "H"],
    fecha: "2026-08-12",
    fechaTexto: "12 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false
  },
  {
    disciplinaId: "fotografia",
    label: "FOTOGRAFÍA",
    modalidad: "no_presencial",
    categorias: ["E", "F"],
    fecha: "2026-08-13",
    fechaTexto: "13 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false
  },
  {
    disciplinaId: "arte_tradicional",
    label: "ARTE TRADICIONAL",
    modalidad: "no_presencial",
    categorias: ["E", "F", "H"],
    fecha: "2026-08-13",
    fechaTexto: "13 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false
  },
  {
    disciplinaId: "poesia",
    label: "POESÍA",
    modalidad: "no_presencial",
    categorias: ["D", "E", "F"],
    fecha: "2026-08-14",
    fechaTexto: "14 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false
  },
  {
    disciplinaId: "historietas_interactivas",
    label: "HISTORIETAS INTERACTIVAS",
    modalidad: "no_presencial",
    categorias: ["D", "E", "F"],
    fecha: "2026-08-14",
    fechaTexto: "14 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false
  },
  {
    disciplinaId: "corto_audiovisual",
    label: "CORTO AUDIOVISUAL",
    modalidad: "no_presencial",
    categorias: ["F"],
    fecha: "2026-08-14",
    fechaTexto: "14 de agosto de 2026",
    sedeId: "ugel03",
    horaInicio: null,
    horaFin: null,
    requiereSorteoOrden: false
  }
];

/**
 * Requisitos de acreditación para DISCIPLINAS PRESENCIALES.
 * Se presentan en físico, en folder, ante la mesa de jurados,
 * antes de iniciar la participación.
 */
export const ACREDITACION_PRESENCIAL = [
  { id: "acr1", texto: "Copia impresa del registro de la Ficha de Inscripción en la plataforma SICE." },
  { id: "acr2", texto: "Formato impreso de reseña de la obra o pieza musical." },
  { id: "acr3", texto: "DNI físico de los participantes de nacionalidad peruana. Los participantes de otra nacionalidad presentan pasaporte, carné de extranjería, carné de permiso temporal de permanencia, carné de solicitante de refugio, cédula de identidad del país de origen u otro documento expedido por el Ministerio de Relaciones Exteriores." },
  { id: "acr4", texto: "Impreso del Seguro Integral de Salud (SIS) u otro seguro médico vigente." },
  { id: "acr5", texto: "Carta de compromiso debidamente firmada por la madre, el padre, el tutor o el apoderado." },
  { id: "acr6", texto: "Credencial del docente asesor debidamente firmada y sellada por el director de la I. E., CEBE o CEBA." }
];

/** Disposiciones del Comunicado 01 que el módulo debe mostrar como notas fijas */
export const NOTAS_COMUNICADO_01 = [
  "Las I. E. participantes y su docente asesor de las disciplinas presenciales deben estar 30 minutos antes de la hora establecida para efectuar el sorteo de orden de presentación.",
  "Un estudiante solo puede participar en una sola disciplina y categoría según corresponda.",
  "El docente asesor puede asesorar en más de una disciplina artística o categoría, ya sea grupal o individual, de una misma I. E.",
  "Los trabajos ganadores de la etapa I. E. de las disciplinas no presenciales debían remitirse a la UGEL en forma física, con oficio, ficha de inscripción SICE y reseña del trabajo, debidamente embalados y rotulados, hasta el 10 de agosto de 2026. De no enviarse a tiempo, no podrán ser calificados.",
  "El registro de participantes para la etapa UGEL se realiza a través de la plataforma SICE: https://sice.minedu.gob.pe"
];

/* ───── Helpers ───── */

export function getDisciplinaUGEL03(disciplinaId) {
  return DISCIPLINAS_UGEL03.find(d => d.disciplinaId === disciplinaId) || null;
}

export function getCategoriasHabilitadas(disciplinaId) {
  const d = getDisciplinaUGEL03(disciplinaId);
  return d ? d.categorias : [];
}

export function esCombinacionValida(disciplinaId, categoria) {
  return getCategoriasHabilitadas(disciplinaId).includes(categoria);
}

export function getSede(disciplinaId) {
  const d = getDisciplinaUGEL03(disciplinaId);
  return d ? SEDES_UGEL03[d.sedeId] : null;
}

/** Contexto precargado para la ficha, el A10 y el A11 */
export function getContextoEvaluacion(disciplinaId) {
  const d = getDisciplinaUGEL03(disciplinaId);
  if (!d) return null;
  const sede = SEDES_UGEL03[d.sedeId];
  return {
    etapa: "UGEL",
    dre: EVENTO_UGEL03.dre,
    ugel: EVENTO_UGEL03.ugel,
    region: EVENTO_UGEL03.region,
    provincia: EVENTO_UGEL03.provincia,
    fecha: d.fecha,
    fechaTexto: d.fechaTexto,
    lugar: sede.nombre,
    horaInicio: d.horaInicio,
    horaFin: d.horaFin,
    modalidad: d.modalidad
  };
}

/** Todas las combinaciones disciplina + categoría de la etapa UGEL 03 */
export function getCombinacionesUGEL03() {
  return DISCIPLINAS_UGEL03.flatMap(d =>
    d.categorias.map(cat => ({
      disciplinaId: d.disciplinaId,
      label: d.label,
      categoria: cat,
      modalidad: d.modalidad,
      fecha: d.fecha,
      sede: SEDES_UGEL03[d.sedeId].nombre
    }))
  );
}
