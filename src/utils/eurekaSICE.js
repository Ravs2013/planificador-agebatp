/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — PARSER DEL REPORTE SICE DE PARTICIPANTES

   Parser tolerante: la fila de encabezado se detecta buscando tokens, nunca por índice
   fijo, porque SICE antepone filas de título de longitud variable.

   ESTADO: verificado contra el reporte real "RptJurados" de la Etapa 1, exportado el
   09/09/2026 con 455 proyectos de la UGEL 03.

   Ese reporte NO trae la línea de participación, solo categoría y área. La línea decide
   el anexo en las áreas de primaria (E11 frente a E12, E13 frente a E14), así que
   rechazar las filas sin línea dejaba fuera 203 de los 455 proyectos y obligaba a
   teclearlos a mano. En su lugar se importa todo y se resuelve cuanto la línea no
   condiciona: quedan marcados los que exigen una decisión, y esa decisión la toma una
   persona en el padrón, nunca una heurística sobre el título del trabajo.

   Tampoco trae estudiantes ni docente asesor: el reporte para jurados está anonimizado
   por pseudónimo a propósito, que es como se evalúa en Eureka.
   ═══════════════════════════════════════════════════════════════ */

import { AREAS_PARTICIPACION, CATEGORIAS, getArea } from '../data/eurekaConfigUGEL03';
import { resolverEncuadre, normalizarDNI, sanearCorreo } from './eurekaHelpers';

/** Normaliza un texto: mayúsculas, sin tildes, sin espacios dobles. */
export function norm(valor) {
  return String(valor ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/* ───── Diccionarios de reconocimiento ───── */

const TOKENS_ENCABEZADO = [
  'CODIGO', 'MODULAR', 'APELLIDO', 'CATEGORIA', 'INSTITUCION',
  // Columnas del reporte para jurados, que no comparte casi ninguna con el de inscripcion.
  'NRO', 'AREA', 'TITULO', 'PSEUDONIMO', 'SEUDONIMO', 'ENLACE', 'IIEE', 'UGEL', 'DRE'
];

const MAPA_AREAS_SICE = {
  'INDAGACION EN CIENCIA Y TECNOLOGIA': 'ind_ciencia_tecnologia',
  'INDAGACION EN CIENCIA Y TECNOLOGIA (PRIMARIA)': 'ind_ciencia_tecnologia',
  'INDAGACION SOCIAL': 'indagacion_social',
  'INDAGACION CIENTIFICA': 'indagacion_cientifica',
  // Cadena literal del reporte para jurados. La coincidencia parcial ya la resolvia,
  // pero dejarla escrita evita que un cambio en el orden de las claves la rompa.
  'INDAGACION CIENTIFICA (INDAGACION DE TIPO DESCRIPTIVA Y EXPERIMENTAL)': 'indagacion_cientifica',
  'SOLUCIONES TECNOLOGICAS': 'soluciones_tecnologicas',
  'SOLUCION TECNOLOGICA': 'soluciones_tecnologicas',
  'CIENCIAS SOCIALES': 'ciencias_sociales'
};

const MAPA_LINEAS_SICE = {
  'INDAGACION CIENTIFICA': 'indagacion_cientifica',
  'INDAGA MEDIANTE METODOS CIENTIFICOS': 'indagacion_cientifica',
  'SOLUCION TECNOLOGICA': 'solucion_tecnologica',
  'ALTERNATIVA DE SOLUCION TECNOLOGICA': 'solucion_tecnologica',
  'DISENA Y CONSTRUYE SOLUCIONES TECNOLOGICAS': 'solucion_tecnologica',
  'HISTORIA': 'historia',
  'CONSTRUYE INTERPRETACIONES HISTORICAS': 'historia',
  'PROBLEMA HISTORICO': 'historico',
  'HISTORICO': 'historico',
  'AMBIENTAL O TERRITORIAL': 'ambiental_territorial',
  'PROBLEMA AMBIENTAL O TERRITORIAL': 'ambiental_territorial',
  'AMBIENTAL/TERRITORIAL': 'ambiental_territorial',
  'GESTIONA RESPONSABLEMENTE EL ESPACIO Y EL AMBIENTE': 'ambiental_territorial',
  'ECONOMICO': 'economico',
  'PROBLEMA O DESAFIO ECONOMICO': 'economico',
  'EXPERIMENTAL': 'experimental',
  'INDAGACION CIENTIFICA EXPERIMENTAL': 'experimental',
  'DESCRIPTIVA': 'descriptiva',
  'INDAGACION CIENTIFICA DESCRIPTIVA': 'descriptiva'
};

/** Alias de nombre de columna → clave canónica. */
const ALIAS_COLUMNAS = {
  codigoParticipante: ['CODIGO', 'CODIGO PARTICIPANTE', 'CODIGO DE PARTICIPANTE', 'COD PARTICIPANTE', 'CODIGO SICE', 'CODIGO INSCRIPCION'],
  nroOrden: ['NRO', 'N°', 'ITEM', 'ORDEN'],
  pseudonimo: ['PSEUDONIMO', 'SEUDONIMO', 'LEMA'],
  categoria: ['CATEGORIA', 'CATEGORIA DE PARTICIPACION'],
  area: ['AREA', 'AREA DE PARTICIPACION', 'AREA PARTICIPACION'],
  linea: ['LINEA', 'LINEA DE PARTICIPACION', 'TIPO DE INDAGACION', 'COMPETENCIA', 'SUBAREA'],
  tituloProyecto: ['TITULO', 'TITULO DEL TRABAJO', 'TITULO DEL PROYECTO', 'NOMBRE DEL PROYECTO', 'PROYECTO', 'TRABAJO'],
  institucionNombre: ['NOMBRE IIEE', 'IIEE', 'INSTITUCION EDUCATIVA', 'INSTITUCION', 'I.E.', 'IE', 'NOMBRE IE', 'NOMBRE DE LA IE'],
  codigoModular: ['CODIGO MODULAR', 'MODULAR', 'COD MODULAR'],
  tipoGestion: ['GESTION', 'TIPO DE GESTION'],
  distrito: ['DISTRITO'],
  provincia: ['PROVINCIA'],
  region: ['REGION'],
  ugel: ['UGEL'],
  dre: ['DRE', 'DRE/GRE', 'DRE GRE'],
  urlTrabajo: ['ENLACE WEB', 'ENLACE', 'ENLACE DEL INFORME', 'URL', 'LINK', 'ENLACE DEL TRABAJO'],
  urlCuadernoCampo: ['ENLACE CUADERNO', 'CUADERNO DE CAMPO', 'ENLACE DEL CUADERNO'],
  estNombres: ['NOMBRES DEL ESTUDIANTE', 'NOMBRES ESTUDIANTE', 'NOMBRES', 'ESTUDIANTE NOMBRES'],
  estApellidoPaterno: ['APELLIDO PATERNO', 'APELLIDO PATERNO DEL ESTUDIANTE', 'AP PATERNO'],
  estApellidoMaterno: ['APELLIDO MATERNO', 'APELLIDO MATERNO DEL ESTUDIANTE', 'AP MATERNO'],
  estDocumento: ['DNI', 'NUMERO DE DOCUMENTO', 'DOCUMENTO', 'DNI DEL ESTUDIANTE', 'NRO DOCUMENTO'],
  estGrado: ['GRADO'],
  estSeccion: ['SECCION'],
  estNivel: ['NIVEL'],
  estSexo: ['SEXO'],
  docNombres: ['NOMBRES DEL DOCENTE', 'DOCENTE NOMBRES', 'NOMBRES DEL ASESOR'],
  docApellidoPaterno: ['APELLIDO PATERNO DEL DOCENTE', 'APELLIDO PATERNO ASESOR'],
  docApellidoMaterno: ['APELLIDO MATERNO DEL DOCENTE', 'APELLIDO MATERNO ASESOR'],
  docNombreCompleto: ['DOCENTE ASESOR', 'NOMBRE DEL DOCENTE ASESOR', 'ASESOR'],
  docDocumento: ['DNI DEL DOCENTE', 'DNI DOCENTE', 'DOCUMENTO DEL DOCENTE', 'DNI ASESOR'],
  docEspecialidad: ['ESPECIALIDAD', 'ESPECIALIDAD DEL DOCENTE'],
  docTelefono: ['TELEFONO', 'CELULAR', 'TELEFONO DEL DOCENTE'],
  docCorreo: ['CORREO', 'EMAIL', 'CORREO ELECTRONICO', 'CORREO DEL DOCENTE']
};

/* ───── Detección de encabezado y mapeo de columnas ───── */

/**
 * Localiza la fila de encabezado sin depender de un indice fijo.
 *
 * El preambulo de SICE es la trampa: trae filas como ["DRE", ": DRE Lima Metropolitana",
 * "UGEL", ": UGEL 03 Cercado"], que aciertan dos tokens y se harian pasar por el
 * encabezado. Lo que las delata es el valor con dos puntos delante, que es como SICE
 * imprime los filtros del reporte y que un encabezado real nunca tiene.
 */
export function detectarFilaEncabezado(filas = []) {
  const limite = Math.min(filas.length, 40);
  for (let i = 0; i < limite; i++) {
    const celdas = (filas[i] || []).map(norm).filter(Boolean);
    if (celdas.length < 4) continue;
    if (celdas.some(c => c.startsWith(':'))) continue;
    const aciertos = TOKENS_ENCABEZADO.filter(t => celdas.some(c => c.includes(t))).length;
    if (aciertos >= 2) return i;
  }
  return -1;
}

export function mapearColumnas(filaEncabezado = []) {
  const normalizadas = filaEncabezado.map(norm);
  const mapa = {};
  Object.entries(ALIAS_COLUMNAS).forEach(([clave, alias]) => {
    // Coincidencia exacta primero; si no, la primera columna que contenga el alias.
    let idx = normalizadas.findIndex(c => alias.includes(c));
    if (idx === -1) {
      idx = normalizadas.findIndex(c => c && alias.some(a => c.includes(a)));
    }
    if (idx !== -1) mapa[clave] = idx;
  });
  return mapa;
}

function celda(fila, mapa, clave) {
  const idx = mapa[clave];
  if (idx == null) return '';
  return String(fila[idx] ?? '').trim();
}

/**
 * Huella corta y determinista de un texto.
 *
 * El reporte no trae codigo de participante, asi que la clave se deriva del contenido.
 * Truncar institucion y titulo a diez caracteres, como se hacia antes, colisiona en
 * cuanto dos proyectos de la misma escuela empiezan igual, y una colision aqui fusiona
 * silenciosamente dos trabajos distintos en uno.
 */
function huellaCorta(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0').slice(-7);
}

/**
 * Codigo estable de un proyecto.
 *
 * Se deriva del contenido y no del numero de orden del reporte a proposito: si SICE
 * reexporta despues de un retiro, los numeros se corren y una clave posicional
 * duplicaria los 455 registros en la siguiente importacion.
 */
export function codigoDerivado({ categoria, institucionNombre, tituloProyecto }) {
  const base = `${categoria}|${norm(institucionNombre)}|${norm(tituloProyecto)}`;
  return `EK26-${categoria}-${huellaCorta(base)}`;
}

/* ───── Resolución de dominio ───── */

export function resolverCategoria(valor) {
  const n = norm(valor).replace(/^CATEGORIA\s*/, '');
  const directa = CATEGORIAS.find(c => c.id === n);
  if (directa) return directa.id;
  const match = /\b([A-E])\b/.exec(n);
  return match ? match[1] : null;
}

export function resolverAreaId(valor, categoria) {
  const n = norm(valor);
  if (MAPA_AREAS_SICE[n]) return MAPA_AREAS_SICE[n];
  const parcial = Object.keys(MAPA_AREAS_SICE).find(k => n.includes(k) || k.includes(n));
  if (parcial) return MAPA_AREAS_SICE[parcial];
  // Último recurso: si la categoría solo admite un área, no hay ambigüedad.
  if (categoria) {
    const candidatas = AREAS_PARTICIPACION.filter(a => a.categorias.includes(categoria));
    if (candidatas.length === 1) return candidatas[0].id;
  }
  return null;
}

export function resolverLineaId(valor, areaId) {
  const area = getArea(areaId);
  if (!area) return null;
  const n = norm(valor);
  if (n) {
    const directa = MAPA_LINEAS_SICE[n];
    if (directa && area.lineas.some(l => l.id === directa)) return directa;
    const parcial = Object.keys(MAPA_LINEAS_SICE).find(k => n.includes(k));
    if (parcial) {
      const id = MAPA_LINEAS_SICE[parcial];
      if (area.lineas.some(l => l.id === id)) return id;
    }
    const porNombre = area.lineas.find(l => norm(l.nombre).includes(n) || n.includes(norm(l.nombre)));
    if (porNombre) return porNombre.id;
  }
  // Si el área tiene una sola línea, se resuelve sin ambigüedad.
  if (area.lineas.length === 1) return area.lineas[0].id;
  return null;
}

/* ───── Parser principal ───── */

/**
 * Convierte la matriz de celdas de un reporte SICE en participantes de Eureka.
 * Agrupa las dos filas de estudiante de un mismo proyecto en un solo participante.
 *
 * @returns {{ error, headerFoundIndex, columnas, participantes, rechazados, avisos }}
 */
export function parsearReporteSICE(aoaRows = []) {
  if (!aoaRows || aoaRows.length === 0) {
    return { error: 'El archivo está vacío.', participantes: [], rechazados: [], avisos: [] };
  }

  const headerIndex = detectarFilaEncabezado(aoaRows);
  if (headerIndex === -1) {
    return {
      error: 'No se encontró la fila de encabezado del reporte. Exporte el reporte de participantes desde SICE en formato Excel.',
      participantes: [], rechazados: [], avisos: []
    };
  }

  const columnas = mapearColumnas(aoaRows[headerIndex]);
  if (columnas.categoria == null && columnas.institucionNombre == null) {
    return {
      error: 'El archivo no contiene las columnas mínimas (categoría e institución educativa).',
      participantes: [], rechazados: [], avisos: [], headerFoundIndex: headerIndex, columnas
    };
  }

  const filas = aoaRows.slice(headerIndex + 1);
  const porProyecto = new Map();
  const rechazados = [];
  const avisos = new Set();

  filas.forEach((fila, i) => {
    if (!fila || fila.every(c => String(c ?? '').trim() === '')) return;
    const numeroFila = headerIndex + 2 + i;

    const institucionNombre = celda(fila, columnas, 'institucionNombre');
    const categoria = resolverCategoria(celda(fila, columnas, 'categoria'));

    if (!institucionNombre && !categoria) return; // Fila de relleno.

    if (!categoria) {
      rechazados.push({ fila: numeroFila, motivo: 'No se pudo determinar la categoría (A a E).' });
      return;
    }

    const areaId = resolverAreaId(celda(fila, columnas, 'area'), categoria);
    if (!areaId) {
      rechazados.push({
        fila: numeroFila,
        motivo: `Área de participación no reconocida: "${celda(fila, columnas, 'area') || '(vacía)'}".`
      });
      return;
    }

    // La linea puede no venir en el reporte. Eso no siempre impide evaluar: hay areas
    // donde todas las lineas llevan al mismo anexo y la linea es solo un dato del acta.
    const lineaId = resolverLineaId(celda(fila, columnas, 'linea'), areaId);

    let encuadre;
    try {
      encuadre = resolverEncuadre({ categoria, areaId, lineaId });
    } catch (err) {
      rechazados.push({ fila: numeroFila, motivo: err.message });
      return;
    }

    const tituloProyecto = celda(fila, columnas, 'tituloProyecto');
    const codigoParticipante = celda(fila, columnas, 'codigoParticipante')
      || codigoDerivado({ categoria, institucionNombre, tituloProyecto });

    const clave = codigoParticipante;

    // Datos del estudiante de esta fila.
    const estudiante = {
      nombres: celda(fila, columnas, 'estNombres'),
      apellidoPaterno: celda(fila, columnas, 'estApellidoPaterno'),
      apellidoMaterno: celda(fila, columnas, 'estApellidoMaterno'),
      tipoDocumento: 'DNI',
      numeroDocumento: normalizarDNI(celda(fila, columnas, 'estDocumento')),
      sexo: celda(fila, columnas, 'estSexo').toUpperCase().startsWith('F') ? 'F' : (celda(fila, columnas, 'estSexo') ? 'M' : undefined),
      nivel: celda(fila, columnas, 'estNivel'),
      grado: celda(fila, columnas, 'estGrado'),
      seccion: celda(fila, columnas, 'estSeccion')
    };
    const tieneEstudiante = Boolean(estudiante.nombres || estudiante.apellidoPaterno || estudiante.numeroDocumento);

    if (porProyecto.has(clave)) {
      // Segunda fila del mismo proyecto: solo agrega el estudiante.
      const existente = porProyecto.get(clave);
      if (tieneEstudiante && existente.estudiantes.length < 2) {
        existente.estudiantes.push(estudiante);
      } else if (tieneEstudiante) {
        avisos.add(`El proyecto ${clave} trae más de dos estudiantes; las bases admiten un máximo de dos. Se conservaron los dos primeros.`);
      }
      return;
    }

    const correoDocente = sanearCorreo(celda(fila, columnas, 'docCorreo'));
    if (celda(fila, columnas, 'docCorreo') !== correoDocente && correoDocente) {
      avisos.add('Se sanearon correos con espacios internos.');
    }

    const docNombreCompleto = celda(fila, columnas, 'docNombreCompleto')
      || [
        celda(fila, columnas, 'docApellidoPaterno'),
        celda(fila, columnas, 'docApellidoMaterno'),
        celda(fila, columnas, 'docNombres')
      ].filter(Boolean).join(' ');

    porProyecto.set(clave, {
      codigoParticipante,
      categoria,
      areaId,
      lineaId: lineaId || null,
      anexoEvaluacion: encuadre.anexo,
      varianteRubrica: encuadre.variante,
      // Marcas de lo que falta decidir. `requiereLinea` con anexo en null es bloqueante:
      // sin anexo no hay ficha que entregar al jurado. `requiereVariante` no lo es,
      // porque el anexo y el puntaje maximo son los mismos y solo cambia la redaccion
      // de algunos aspectos.
      requiereLinea: encuadre.requiereLinea,
      requiereVariante: encuadre.requiereVariante,
      anexosPosibles: encuadre.anexosPosibles,
      tituloProyecto,
      // El pseudonimo es como el jurado identifica el trabajo: la evaluacion de Eureka
      // es anonima y en la sala no se menciona la escuela.
      pseudonimo: celda(fila, columnas, 'pseudonimo'),
      urlTrabajo: celda(fila, columnas, 'urlTrabajo'),
      urlCuadernoCampo: celda(fila, columnas, 'urlCuadernoCampo'),
      institucionNombre,
      institucion: {
        nombre: institucionNombre,
        codigoModular: celda(fila, columnas, 'codigoModular'),
        tipoGestion: celda(fila, columnas, 'tipoGestion'),
        ugel: celda(fila, columnas, 'ugel') || 'UGEL 03',
        dre: celda(fila, columnas, 'dre') || 'DRE LIMA METROPOLITANA',
        region: celda(fila, columnas, 'region') || 'Lima',
        provincia: celda(fila, columnas, 'provincia') || 'Lima',
        distrito: celda(fila, columnas, 'distrito')
      },
      estudiantes: tieneEstudiante ? [estudiante] : [],
      docenteAsesor: {
        nombres: celda(fila, columnas, 'docNombres'),
        apellidoPaterno: celda(fila, columnas, 'docApellidoPaterno'),
        apellidoMaterno: celda(fila, columnas, 'docApellidoMaterno'),
        nombreCompleto: docNombreCompleto,
        tipoDocumento: 'DNI',
        numeroDocumento: normalizarDNI(celda(fila, columnas, 'docDocumento')),
        especialidad: celda(fila, columnas, 'docEspecialidad'),
        telefono: celda(fila, columnas, 'docTelefono'),
        correo: correoDocente
      },
      ordenPresentacion: Number(celda(fila, columnas, 'nroOrden')) || 0,
      estado: 'pendiente',
      origen: 'sice_excel',
      filaOrigen: numeroFila
    });
  });

  const participantes = Array.from(porProyecto.values());

  // Un aviso por proyecto sin estudiantes seria una lista de cientos de lineas en el
  // reporte para jurados, que viene anonimizado por diseno. Se resume en uno.
  const sinEstudiantes = participantes.filter(p => p.estudiantes.length === 0).length;
  if (sinEstudiantes > 0) {
    avisos.add(
      `${sinEstudiantes} proyecto(s) se importan sin estudiantes ni docente asesor. ` +
      'El reporte para jurados esta anonimizado; complete esos datos desde el padron si los necesita en el acta.'
    );
  }

  const sinAnexo = participantes.filter(p => !p.anexoEvaluacion).length;
  if (sinAnexo > 0) {
    avisos.add(
      `${sinAnexo} proyecto(s) no traen la linea de participacion y en su area la linea decide el anexo. ` +
      'Elija la linea en el padron antes de generar sus fichas: sin anexo no hay ficha que entregar al jurado.'
    );
  }

  const sinVariante = participantes.filter(p => p.requiereVariante).length;
  if (sinVariante > 0) {
    avisos.add(
      `${sinVariante} proyecto(s) usan el anexo E15 sin saber si la indagacion es experimental o descriptiva. ` +
      'Se puede evaluar igual, pero la redaccion de cinco aspectos cambia segun la variante.'
    );
  }

  return {
    error: null,
    headerFoundIndex: headerIndex,
    columnas,
    participantes,
    rechazados,
    avisos: Array.from(avisos)
  };
}

/** Resumen para la vista previa previa a la confirmación. */
export function resumenImportacion(resultado, codigosExistentes = new Set()) {
  const nuevos = resultado.participantes.filter(p => !codigosExistentes.has(p.codigoParticipante));
  const actualizaciones = resultado.participantes.length - nuevos.length;
  return {
    total: resultado.participantes.length,
    altas: nuevos.length,
    actualizaciones,
    rechazadas: resultado.rechazados.length,
    // Lo que hay que decidir a mano despues de importar. Separado del recuento de
    // rechazos porque estos registros SI entran: les falta una eleccion, no son basura.
    sinAnexo: resultado.participantes.filter(p => !p.anexoEvaluacion).length,
    sinVariante: resultado.participantes.filter(p => p.requiereVariante).length,
    avisos: resultado.avisos
  };
}
