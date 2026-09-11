/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — ANEXO DE EVALUACIÓN DE CADA PROYECTO

   Regla de las bases (numerales 2.1, 2.2, 12 y Anexos E11 a E18):
     A, B, C · Indagación en Ciencia y Tecnología → E11 (indaga) o E12 (solución tecnológica)
     A, B, C · Indagación social                  → E13 (historia) o E14 (ambiental o territorial)
     D, E    · Indagación científica              → E15 (variante A experimental o B descriptiva)
     D, E    · Soluciones tecnológicas            → E16
     D · Ciencias Sociales → E17        E · Ciencias Sociales → E18

   El anexo es una decisión del PROYECTO, nunca de un casillero: los tres jurados califican
   con el mismo instrumento. Precedencia: decisión auditada de la comisión > recomendación
   del padrón precargado > heurística para proyectos registrados a mano.
   ═══════════════════════════════════════════════════════════════ */

import { PROYECTOS_SICE_EUREKA } from '../data/eurekaPadronSICE';
import { getRubricaEureka } from '../data/eurekaRubricas';
import { resolverAnexoPorDefecto, ordenArea } from './eurekaHelpers';

export const NOMBRE_CORTO_ANEXO = {
  E11: 'Indagación científica',
  E12: 'Alternativa de solución tecnológica',
  E13: 'Indagación basada en una pregunta relacionada a la historia',
  E14: 'Indagación basada en un problema ambiental o territorial',
  E15: 'Indagación científica',
  E16: 'Soluciones tecnológicas',
  E17: 'Ciencias Sociales, categoría D',
  E18: 'Ciencias Sociales, categoría E'
};

export const NOMBRE_VARIANTE = { A: 'experimental', B: 'descriptiva' };

export const NOMBRE_LINEA_CS = {
  historico: 'problema histórico',
  ambiental_territorial: 'problema ambiental o territorial',
  economico: 'problema o desafío económico'
};

export const MOTIVOS_ANEXO = {
  P: 'El título nombra un producto elaborado para atender una necesidad. El numeral 2.1.2 ubica estos proyectos en el diseño y construcción de una alternativa de solución tecnológica, que se evalúa con el Anexo E12.',
  D: 'El título nombra un dispositivo, sistema o prototipo construido para resolver un problema del entorno. Es una solución tecnológica (numeral 2.1.2) y se evalúa con el Anexo E12.',
  PR: 'El título propone un proceso o una técnica para resolver un problema del entorno. La competencia tecnológica abarca objetos, procesos y sistemas (numeral 2.1.2); se evalúa con el Anexo E12.',
  Q: 'El título plantea una pregunta o un fenómeno por explicar. La indagación científica parte de preguntas que pueden responderse empíricamente (numeral 2.1.1) y se evalúa con el Anexo E11.',
  F: 'El título estudia el efecto, la influencia o la relación entre factores. Es indagación científica de tipo experimental (numerales 2.1 y 2.1.1) y se evalúa con el Anexo E11.',
  X: 'El título describe o caracteriza un hecho, un organismo o un fenómeno sin construir un producto. Es indagación científica de tipo descriptiva (numerales 2.1 y 2.1.1) y se evalúa con el Anexo E11.',
  H: 'El título aborda hechos, personajes, procesos o patrimonio del pasado. Corresponde a la competencia «Construye interpretaciones históricas» (numeral 2.1.3) y se evalúa con el Anexo E13.',
  HF: 'El título gira en torno a la familia; en primaria la competencia «Construye interpretaciones históricas» incluye la historia personal y familiar (numeral 2.1.3). Se evalúa con el Anexo E13.',
  HC: 'El título relaciona el pasado con el presente o estudia cambios y permanencias, categorías propias de la competencia «Construye interpretaciones históricas» (numeral 2.1.3). Se evalúa con el Anexo E13.',
  HI: 'El título indaga una práctica del pasado para relacionarla con una situación actual; el criterio 4 del Anexo E13 evalúa precisamente esa relación (numeral 2.1.3).',
  AM: 'El título aborda un problema ambiental (residuos, agua, contaminación o entorno saludable). Corresponde a la competencia «Gestiona responsablemente el espacio y el ambiente» (numeral 2.1.4) y se evalúa con el Anexo E14.',
  RI: 'El título aborda la gestión del riesgo de desastres; el Anexo E14 cita los simulacros entre las acciones para conservar el espacio y el ambiente. Se evalúa con el Anexo E14.',
  TE: 'El título aborda un problema territorial o del espacio de la comunidad (numeral 2.1.4). Se evalúa con el Anexo E14.',
  SE: 'El título no evidencia un problema histórico ni ambiental o territorial. El Anexo E14 es el más cercano porque evalúa un problema de la vida cotidiana y la propuesta de acciones.',
  PS: 'El título describe un producto, que no corresponde a las competencias del área Indagación social. Entre E13 y E14, el E14 es el más cercano porque evalúa el aprovechamiento responsable del ambiente y la propuesta de acciones.'
};

export const ALERTAS_PADRON = {
  SOCIAL_EN_CYT: 'El tema se relaciona con la competencia «Gestiona responsablemente el espacio y el ambiente» (Indagación social). Se evalúa en el área inscrita en SICE.',
  PROD_SOCIAL: 'Parece un producto o una elaboración: las bases ubican estos proyectos en Indagación en Ciencia y Tecnología. Se evalúa en el área inscrita en SICE; la comisión decide si corresponde otra medida.',
  SIN_ENCAJE: 'El título no evidencia un problema histórico ni ambiental o territorial, que son las competencias del área Indagación social (numerales 2.1.3 y 2.1.4). Revise el informe.',
  CIENCIA_EN_CS: 'El título corresponde a una indagación científica (Anexo E15), no a Ciencias Sociales. Se evalúa en el área inscrita en SICE; la comisión decide si corresponde otra medida.',
  TECNO_EN_CS: 'El título incluye una propuesta tecnológica, propia del Anexo E16. Se evalúa en el área inscrita en SICE.',
  SIN_ENCAJE_CS: 'El título no evidencia un problema histórico, ambiental o territorial, ni económico (numeral 2.2.3). Revise el informe.',
  TECNO_EN_IC: 'El título describe un dispositivo o sistema, propio de Soluciones tecnológicas (Anexo E16). Se evalúa en el área inscrita en SICE con el Anexo E15.',
  IND_EN_ST: 'El título se formula como una indagación y no como una solución tecnológica. Se evalúa en el área inscrita en SICE con el Anexo E16.',
  FUERA_PLAZO: 'Inscripción registrada en SICE el 05/09/2026 a las 00:01:50, después del cierre (04/09/2026, 11:59 p. m., numeral 16 y cronograma específico). Apto de forma provisional hasta la decisión de la comisión.'
};

export const CONFIANZA_ANEXO = {
  alta: { etiqueta: 'Confianza alta', fondo: '#F0FDF4', texto: '#15803D', borde: '#BBF7D0' },
  media: { etiqueta: 'Confianza media', fondo: '#EFF6FF', texto: '#1E40AF', borde: '#BFDBFE' },
  baja: { etiqueta: 'Confianza baja: revisar informe', fondo: '#FFFBEB', texto: '#B45309', borde: '#FDE68A' }
};

export const ESTADOS_ADMISION_EK = {
  apto: { etiqueta: 'Apto', detalle: 'Se evalúa y entra al orden de mérito.', fondo: '#F0FDF4', texto: '#15803D', borde: '#BBF7D0' },
  observado: { etiqueta: 'Observado', detalle: 'Se evalúa de forma provisional y queda marcado para la comisión.', fondo: '#FFFBEB', texto: '#B45309', borde: '#FDE68A' },
  retirado: { etiqueta: 'Retirado', detalle: 'No se evalúa: sale de las fichas, consolidados y actas.', fondo: '#FEF2F2', texto: '#B91C1C', borde: '#FECACA' }
};

const LINEA_DE_ANEXO = {
  E11: 'indagacion_cientifica', E12: 'solucion_tecnologica', E13: 'historia', E14: 'ambiental_territorial', E16: 'solucion_tecnologica'
};

const COMPATIBLES_POR_AREA = {
  ind_ciencia_tecnologia: ['E11', 'E12'],
  indagacion_social: ['E13', 'E14'],
  indagacion_cientifica: ['E15-A', 'E15-B'],
  soluciones_tecnologicas: ['E16']
};

function normTexto(v) {
  return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

export function claveOpcion(anexo, variante) {
  if (!anexo) return null;
  return anexo === 'E15' ? `E15-${variante === 'B' ? 'B' : 'A'}` : anexo;
}

export function etiquetaOpcion(anexo, variante) {
  if (!anexo) return 'Anexo sin asignar';
  if (anexo === 'E15') return `Anexo E15 — Indagación científica ${NOMBRE_VARIANTE[variante === 'B' ? 'B' : 'A']}`;
  return `Anexo ${anexo} — ${NOMBRE_CORTO_ANEXO[anexo] || ''}`;
}

/** Anexos que la comisión puede asignar al proyecto, marcando los compatibles con el área inscrita. */
export function opcionesAnexo(p) {
  const cat = p?.categoria;
  const primaria = ['A', 'B', 'C'].includes(cat);
  const base = primaria
    ? [['E11'], ['E12'], ['E13'], ['E14']]
    : [['E15', 'A'], ['E15', 'B'], ['E16'], [cat === 'D' ? 'E17' : 'E18']];
  const compatibles = p?.areaId === 'ciencias_sociales'
    ? [cat === 'D' ? 'E17' : 'E18']
    : (COMPATIBLES_POR_AREA[p?.areaId] || []);
  return base.map(([anexo, variante]) => {
    const clave = claveOpcion(anexo, variante);
    return { clave, anexo, variante: anexo === 'E15' ? variante : null, etiqueta: etiquetaOpcion(anexo, variante), compatible: compatibles.includes(clave) };
  });
}

/* ───── Heurística para proyectos que no están en el padrón precargado ───── */

const RE_TECNOLOGIA = /\b(GOMITA|JABON|REPELENTE|PURIFICADOR|FILTRO|MACETA|PANEL|GENERADOR|SISTEMA|RIEGO|NEBULIZADOR|CREMA|POMADA|UNGUENTO|PASTA|SHAMPOO|DETERGENTE|TALCO|DESODORANTE|INSECTICIDA|VELA|CUPCAKE|TORTILLA|TRUFA|JARABE|BARRA|GEL|ADHESIVO|PEGAMENTO|PAPEL|BOLSA|BIOPLASTICO|CUADERNO|SEMAFORO|ROBOT|BASURERO|TABLERO|VIVERO|INVERNADERO|BATERIA|REFRIGERADORA|ESPANTADOR|LOCION|PROTECTOR|FERTILIZANTE|ABONO|DESHIDRATADOR|MERMELADA|GALLETA|DISPOSITIVO|PROTOTIPO|ALARMA|DETECTOR|MEDIDOR|ELABORACION|DISENO|CONSTRUCCION)/;
const RE_INDAGACION = /(EFECTO|INFLUENCIA|IMPACTO|RELACION|ANALISIS|CARACTERISTICA|CUANT|^QUE |POR QUE|^COMO |GERMINACION|OXIDACION|FACTORES|PROPIEDADES|BENEFICIOS|CONSUMO|COMPARACION|NIVELES|PERCEPCION|CONOCIMIENTO)/;
const RE_HISTORIA = /(HISTORI|PASADO|INDEPENDENCIA|INCA|PATRIMONIO|HUACA|PERMANENCIA|EVOLUCION|TRADICION|ANCESTRAL|HEROE|HEROINA|VIRREIN|COLONIA|REPUBLICA|CULTURA)/;
const RE_DESCRIPTIVA = /(RELACION ENTRE|CONOCIMIENTO|PERCEPCION|CALIDAD DE|NIVELES DE|FACTORES ASOCIADOS|USO DE|USO DEL|CARACTERIZACION|ENCUESTA|HABITOS)/;

export function recomendarAnexo({ categoria, areaId, tituloProyecto }) {
  const t = normTexto(tituloProyecto);
  switch (areaId) {
    case 'ind_ciencia_tecnologia': {
      const tecno = RE_TECNOLOGIA.test(t) && !RE_INDAGACION.test(t);
      return { anexo: tecno ? 'E12' : 'E11', variante: null, confianza: 'baja', motivoClave: tecno ? 'P' : 'Q' };
    }
    case 'indagacion_social': {
      const historia = RE_HISTORIA.test(t);
      return { anexo: historia ? 'E13' : 'E14', variante: null, confianza: 'baja', motivoClave: historia ? 'H' : 'AM' };
    }
    case 'indagacion_cientifica':
      return { anexo: 'E15', variante: RE_DESCRIPTIVA.test(t) ? 'B' : 'A', confianza: 'media', motivoClave: 'IC' };
    case 'soluciones_tecnologicas':
      return { anexo: 'E16', variante: null, confianza: 'alta', motivoClave: 'ST' };
    case 'ciencias_sociales':
      return { anexo: categoria === 'D' ? 'E17' : 'E18', variante: null, confianza: 'alta', motivoClave: 'CS' };
    default:
      return { anexo: resolverAnexoPorDefecto(categoria, areaId), variante: null, confianza: 'baja', motivoClave: null };
  }
}

/** Anexo con el que se califica HOY el proyecto y de dónde sale esa decisión. */
export function anexoVigente(p) {
  if (!p) return { anexo: null, variante: null, origen: null, clave: null };
  const aplicado = p.anexoAplicado;
  if (aplicado && aplicado.anexo && getRubricaEureka(aplicado.anexo)) {
    const variante = aplicado.anexo === 'E15' ? (aplicado.variante === 'B' ? 'B' : 'A') : null;
    return { anexo: aplicado.anexo, variante, origen: 'comision', clave: claveOpcion(aplicado.anexo, variante) };
  }
  const rec = p.anexoRecomendado
    ? { anexo: p.anexoRecomendado, variante: p.varianteRecomendada }
    : recomendarAnexo(p);
  if (rec.anexo && getRubricaEureka(rec.anexo)) {
    const variante = rec.anexo === 'E15' ? (rec.variante === 'B' ? 'B' : 'A') : null;
    return { anexo: rec.anexo, variante, origen: 'recomendado', clave: claveOpcion(rec.anexo, variante) };
  }
  const def = resolverAnexoPorDefecto(p.categoria, p.areaId);
  return { anexo: def, variante: def === 'E15' ? 'A' : null, origen: 'padron', clave: claveOpcion(def, 'A') };
}

export function claveRecomendada(p) {
  if (!p) return null;
  const rec = p.anexoRecomendado ? { anexo: p.anexoRecomendado, variante: p.varianteRecomendada } : recomendarAnexo(p);
  return claveOpcion(rec.anexo, rec.variante);
}

function lineaDeVigente(vig, p) {
  if (vig.anexo === 'E15') return vig.variante === 'B' ? 'descriptiva' : 'experimental';
  if (LINEA_DE_ANEXO[vig.anexo]) return LINEA_DE_ANEXO[vig.anexo];
  return p.lineaRecomendada || p.lineaId || null;
}

/** Explicación legible del anexo vigente, para la ficha y el padrón. */
export function motivoAnexoTexto(p) {
  if (!p) return '';
  const vig = anexoVigente(p);
  if (vig.origen === 'comision') {
    const a = p.anexoAplicado || {};
    const quien = a.nombre || a.correo || 'la comisión';
    const cuando = a.en ? ` el ${new Date(a.en).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : '';
    return `Asignado por ${quien}${cuando}. Motivo: ${a.motivo || 'sin motivo registrado'}.`;
  }
  const clave = p.motivoClave || recomendarAnexo(p).motivoClave;
  if (clave === 'IC') {
    const b = vig.variante === 'B';
    return `Área inscrita en SICE: Indagación científica. En las categorías D y E el anexo lo fija el área (Anexo E15). Variante ${b ? 'B, descriptiva: el título observa, describe o relaciona un hecho sin manipular variables' : 'A, experimental: el título manipula, compara o pone a prueba variables'}; solo cambia la redacción de cinco aspectos, no el puntaje.`;
  }
  if (clave === 'ST') return 'Área inscrita en SICE: Soluciones tecnológicas. En las categorías D y E el anexo lo fija el área (Anexo E16).';
  if (clave === 'CS') {
    const linea = p.lineaRecomendada ? ` Tipo de problema: ${NOMBRE_LINEA_CS[p.lineaRecomendada]}; aplique los aspectos de análisis y de conclusiones que corresponden a ese tipo.` : ' El tipo de problema no se deduce del título: revise el informe.';
    return `Área inscrita en SICE: Ciencias Sociales. En la categoría ${p.categoria} corresponde el Anexo ${p.categoria === 'D' ? 'E17' : 'E18'}.${linea}`;
  }
  const base = MOTIVOS_ANEXO[clave] || 'Anexo asignado según la categoría y el área de participación inscritas.';
  const confianza = p.confianzaAnexo || (p.anexoRecomendado ? 'alta' : 'baja');
  return confianza === 'baja' ? `${base} La confianza es baja: confirme con el informe del proyecto antes de evaluar.` : base;
}

/* ───── Padrón combinado: semilla + Firestore ───── */

function sinVacios(obj = {}) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

function tieneNombres(lista) {
  return Array.isArray(lista) && lista.some(e => e && (e.nombres || e.apellidoPaterno || e.nombreCompleto));
}

export function esEvaluableEK(p) {
  return Boolean(p) && p.estadoAdmision !== 'retirado';
}

export function tienePuntajes(ev) {
  return Boolean(ev) && Object.values(ev.puntajes || {}).some(v => Number(v) > 0);
}

/**
 * Une el padrón precargado con los documentos de Firestore.
 * Identidad y recomendación vienen de la semilla; lo que cambia en la jornada (orden, NSP,
 * anexo asignado, admisión, estudiantes importados) viene de Firestore.
 */
export function construirParticipantesEK({ semilla = PROYECTOS_SICE_EUREKA, importados = [] } = {}) {
  const porId = new Map();
  semilla.forEach(s => porId.set(s.id, { ...s, enFirestore: false }));

  importados.forEach(fs => {
    if (!fs || !fs.id) return;
    const base = porId.get(fs.id);
    if (!base) {
      porId.set(fs.id, { ...fs, origen: fs.origen || 'manual', enFirestore: true });
      return;
    }
    porId.set(fs.id, {
      ...fs,
      ...base,
      institucion: { ...(fs.institucion || {}), ...base.institucion },
      estudiantes: tieneNombres(fs.estudiantes) ? fs.estudiantes : [],
      docenteAsesor: { ...(base.docenteAsesor || {}), ...sinVacios(fs.docenteAsesor) },
      ordenPresentacion: Number(fs.ordenPresentacion) || 0,
      noSePresento: Boolean(fs.noSePresento),
      anexoAplicado: fs.anexoAplicado || null,
      historialAnexo: Array.isArray(fs.historialAnexo) ? fs.historialAnexo : [],
      admision: fs.admision || null,
      historialAdmision: Array.isArray(fs.historialAdmision) ? fs.historialAdmision : [],
      urlCuadernoCampo: fs.urlCuadernoCampo || '',
      ordenManual: fs.ordenManual != null ? fs.ordenManual : null,
      motivoDirimencia: fs.motivoDirimencia || '',
      datosSICE: fs.datosSICE || null,
      enFirestore: true
    });
  });

  const lista = Array.from(porId.values()).map(p => {
    const vig = anexoVigente(p);
    const decision = p.admision && p.admision.estado ? p.admision : null;
    const rec = p.anexoRecomendado ? null : recomendarAnexo(p);
    return {
      ...p,
      confianzaAnexo: p.confianzaAnexo || rec?.confianza || 'baja',
      motivoClave: p.motivoClave || rec?.motivoClave || null,
      alertas: Array.isArray(p.alertas) ? p.alertas : [],
      anexoEvaluacion: vig.anexo,
      varianteRubrica: vig.variante,
      anexoOrigen: vig.origen,
      anexoClave: vig.clave,
      lineaId: lineaDeVigente(vig, p),
      estadoAdmision: decision ? decision.estado : (p.admisionInicial?.estado || 'apto'),
      decisionComision: decision,
      ordenPresentacion: Number(p.ordenPresentacion) || 0
    };
  });

  return lista.sort((a, b) =>
    String(a.categoria).localeCompare(String(b.categoria))
    || ordenArea(a.areaId) - ordenArea(b.areaId)
    || (a.ordenPresentacion || 9999) - (b.ordenPresentacion || 9999)
    || (a.numero || 0) - (b.numero || 0));
}

/** Conteo de anexos vigentes de una lista, para la barra de la bandeja y el padrón. */
export function resumenAnexos(lista = []) {
  const conteo = {};
  lista.forEach(p => { conteo[p.anexoClave] = (conteo[p.anexoClave] || 0) + 1; });
  return Object.entries(conteo).sort(([a], [b]) => a.localeCompare(b));
}

export function requiereRevision(p) {
  return p.estadoAdmision === 'observado'
    || (['A', 'B', 'C'].includes(p.categoria) && p.confianzaAnexo === 'baja' && p.anexoOrigen !== 'comision')
    || (p.alertas || []).length > 0;
}
