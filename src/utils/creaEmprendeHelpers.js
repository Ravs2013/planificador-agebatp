/* ═══════════════════════════════════════════════════════════════
   CONCURSO NACIONAL CREA Y EMPRENDE 2026 — LÓGICA DE DOMINIO
   Funciones puras: sin Firebase ni React, para poder probarlas de forma aislada.
   ═══════════════════════════════════════════════════════════════ */

import { CYE_CONFIG, SLOTS_JURADO, GRUPOS_BASE_CYE, getCategoriaCYE } from '../data/creaEmprendeConfig';
import { getInstrumentosCategoria, maximoCategoria } from '../data/creaEmprendeRubricas';
import { DISTRIBUCION_CYE, ROTACION_CYE } from '../data/creaEmprendeDistribucion';

/* ───── 1. Texto, documentos y fechas ───── */

export function normalizarTexto(valor) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim();
}

export function soloDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function validarDNI(dni) {
  return /^\d{8}$/.test(String(dni ?? '').trim());
}

export function nombreCompletoValido(nombre) {
  return normalizarTexto(nombre).replace(/,/g, ' ').split(' ').filter(Boolean).length >= 2;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

export function mesEnLetras(numeroMes) {
  return MESES[(Number(numeroMes) || 1) - 1] || '';
}

export function formatearFechaLarga(iso) {
  const [anio, mes, dia] = String(iso || '').slice(0, 10).split('-').map(Number);
  return { dia: dia || '', mes: mesEnLetras(mes), anio: anio || '' };
}

export function formatearFechaCorta(iso) {
  const [anio, mes, dia] = String(iso || '').slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : '';
}

export function formatearFechaHora(iso) {
  const s = String(iso || '');
  const hora = s.length >= 16 ? s.slice(11, 16) : '';
  return `${formatearFechaCorta(s)}${hora ? ` ${hora}` : ''}`;
}

export function etiquetaPuesto(n) {
  if (n === 1) return '1.er puesto';
  if (n === 3) return '3.er puesto';
  return `${n}.° puesto`;
}

export function sanitizarNombreArchivo(texto = '') {
  return String(texto)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

/* ───── 2. Grado y sección ───── */

const GRADOS_NUMERO = { PRIMERO: 1, SEGUNDO: 2, TERCERO: 3, CUARTO: 4, QUINTO: 5 };

export function gradoCorto(grado) {
  const g = normalizarTexto(grado).toUpperCase();
  return GRADOS_NUMERO[g] ? `${GRADOS_NUMERO[g]}.°` : g;
}

/** Limpia la sección tal como la escriben las I. E. en el SICE ("1 C", "2D", "CUARTO A SECUNDARIA"). */
export function seccionLimpia(seccion) {
  let s = normalizarTexto(seccion).toUpperCase();
  if (s === '-' || s === '—') return '';
  s = s.replace(/\b(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO)\b/g, ' ');
  s = s.replace(/\bSECUNDARIA\b/g, ' ');
  s = normalizarTexto(s);
  s = s.replace(/^\d\s*(TO|RO|ER|DO)?\s+(?=\S)/, '');
  s = s.replace(/^\d(?=[A-Z]$)/, '');
  return normalizarTexto(s);
}

/** Pares únicos grado + sección de un equipo, en el orden en que aparecen. */
export function paresGradoSeccion(integrantes = []) {
  const vistos = [];
  integrantes.forEach(i => {
    const par = normalizarTexto(`${gradoCorto(i.grado)} ${seccionLimpia(i.seccion)}`);
    if (par && !vistos.includes(par)) vistos.push(par);
  });
  return vistos;
}

export function resumenGradoSeccion(integrantes = []) {
  return paresGradoSeccion(integrantes).join(', ');
}

export function nombresIntegrantes(p) {
  return (p?.integrantes || []).map(i => i.nombreCompleto).filter(Boolean);
}

/* ───── 3. Enlace del portafolio ───── */

const HOSTS_CONOCIDOS = [
  'drive.google.com', 'docs.google.com', 'sites.google.com', 'onedrive.live.com', '1drv.ms',
  'canva.com', 'canva.link', 'dropbox.com', 'youtube.com', 'youtu.be'
];

export function evaluarEnlace(url) {
  const u = normalizarTexto(url);
  if (!u) return { abrible: false, alerta: 'No registró enlace del portafolio.' };
  let host = '';
  try {
    host = new URL(u).hostname.toLowerCase();
  } catch (e) {
    return { abrible: false, alerta: 'El enlace registrado no es una dirección web válida.' };
  }
  const conocido = HOSTS_CONOCIDOS.some(h => host === h || host.endsWith(`.${h}`)) || host.endsWith('.sharepoint.com');
  if (conocido) return { abrible: true, alerta: null };
  if (/goo?g|drive\./.test(host)) {
    return { abrible: false, alerta: `El enlace está mal escrito (${host}) y no abrirá. Solicitar el enlace correcto al docente asesor.` };
  }
  return { abrible: true, alerta: `El enlace apunta a ${host}. Verificar que abra el portafolio compartido.` };
}

/* ───── 4. Admisión según las bases ───── */

function motivo(codigo, tipo, texto) {
  return { codigo, tipo, texto };
}

/**
 * Evalúa un proyecto contra las reglas de las bases que pueden verificarse con el reporte SICE.
 * no_apto: incumple una regla expresa. observado: requiere decisión de la comisión.
 */
export function evaluarAdmision(proyecto, { todos = [] } = {}) {
  const cat = getCategoriaCYE(proyecto.categoria);
  const motivos = [];
  const alertas = [];
  if (!cat) {
    return { estado: 'no_apto', motivos: [motivo('CATEGORIA', 'no_apto', `Categoría no reconocida: ${proyecto.categoria}.`)], alertas };
  }

  const integrantes = proyecto.integrantes || [];
  const n = integrantes.length;
  const plural = n === 1 ? 'integrante' : 'integrantes';

  if (cat.modalidad === 'EBR' && n < cat.minIntegrantes) {
    motivos.push(motivo('EQUIPO_CINCO', 'no_apto',
      `El equipo registra ${n} ${plural}. El criterio de admisión exige un mínimo de cinco (5) integrantes del mismo grado y sección (Anexo D, numeral 4).`));
  }
  if (cat.modalidad === 'EBR' && n > cat.maxIntegrantes) {
    motivos.push(motivo('EQUIPO_EXCEDE', 'observado',
      `El equipo registra ${n} integrantes; las bases describen equipos de cinco (5) integrantes (Anexo D, numeral 4).`));
  }
  if (cat.modalidad === 'EBA' && (n < cat.minIntegrantes || n > cat.maxIntegrantes)) {
    motivos.push(motivo('EQUIPO_CEBA', 'no_apto',
      `El equipo registra ${n} ${plural}. En los CEBA los equipos tienen un mínimo de tres (3) y un máximo de cinco (5) estudiantes (Anexo D, numeral 4).`));
  }

  const modalidad = normalizarTexto(proyecto.institucion?.modalidad).toUpperCase();
  if (modalidad) {
    const esEBA = modalidad.includes('ALTERNATIVA');
    if ((cat.modalidad === 'EBA') !== esEBA) {
      motivos.push(motivo('MODALIDAD', 'no_apto',
        `La modalidad registrada (${normalizarTexto(proyecto.institucion?.modalidad)}) no corresponde a la ${cat.nombre} (Anexo D, numeral 3).`));
    }
  }

  const gradosFuera = [...new Set(integrantes
    .map(i => normalizarTexto(i.grado).toUpperCase())
    .filter(g => g && !cat.gradosValidos.includes(g)))];
  if (gradosFuera.length > 0) {
    motivos.push(motivo('GRADO_CATEGORIA', 'no_apto',
      `Grado que no corresponde a la ${cat.nombre}: ${gradosFuera.join(', ')} (Anexo D, numeral 3).`));
  }

  const pares = paresGradoSeccion(integrantes);
  if (pares.length > 1) {
    motivos.push(motivo('GRADO_SECCION', cat.modalidad === 'EBR' ? 'no_apto' : 'observado',
      `Los integrantes no son del mismo grado y sección (${pares.join(', ')}). Las bases exigen equipos del mismo grado y sección (Anexo D, numeral 4).`));
  }

  if (proyecto.fechaRegistro && String(proyecto.fechaRegistro) > CYE_CONFIG.cierreInscripcionUGEL) {
    motivos.push(motivo('FUERA_PLAZO', 'observado',
      `Inscripción registrada el ${formatearFechaHora(proyecto.fechaRegistro)}, después del cierre del 9 de setiembre a las 11:59 p. m. Verificar si se reportó dificultad técnica conforme al numeral 10.`));
  }

  if (Number(proyecto.estudiantesEnOtrosEquipos) > 0) {
    motivos.push(motivo('ESTUDIANTE_REPETIDO', 'observado',
      `${proyecto.estudiantesEnOtrosEquipos} estudiante(s) figuran también en otro equipo. Un estudiante solo puede participar en un equipo y categoría (Anexo D, numeral 6).`));
  }

  const mismaIE = todos.filter(p =>
    p.categoria === proyecto.categoria
    && p.institucion?.codigoModular
    && p.institucion?.codigoModular === proyecto.institucion?.codigoModular
  );
  if (mismaIE.length > 2) {
    motivos.push(motivo('IE_MAS_DE_DOS', 'observado',
      `La I. E. registra ${mismaIE.length} proyectos en la ${cat.nombre}; solo se inscriben en la etapa UGEL el 1.er y 2.° puesto (Anexo D, numeral 4).`));
  }
  const puesto = Number(proyecto.puestoIE) || 0;
  if (puesto && ![1, 2].includes(puesto)) {
    motivos.push(motivo('PUESTO_IE', 'observado',
      `Registrado con el ${puesto}.° puesto de la etapa I. E.; solo se inscriben el 1.er y 2.° puesto (Anexo D, numeral 4).`));
  }
  if (puesto && mismaIE.filter(p => Number(p.puestoIE) === puesto).length > 1) {
    motivos.push(motivo('PUESTO_REPETIDO', 'observado',
      `La I. E. registra más de un proyecto con el ${puesto}.° puesto en la ${cat.nombre}.`));
  }

  const enlace = evaluarEnlace(proyecto.enlaceWeb);
  if (enlace.alerta) alertas.push({ codigo: 'ENLACE', texto: enlace.alerta, bloqueaApertura: !enlace.abrible });

  const estado = motivos.some(m => m.tipo === 'no_apto')
    ? 'no_apto'
    : (motivos.some(m => m.tipo === 'observado') ? 'observado' : 'apto');

  return { estado, motivos, alertas };
}

/* ───── 5. Participantes efectivos: semilla + importación + decisiones de la comisión ───── */

/**
 * Distribución equilibrada de proyectos según la cuota de cada grupo. Los proyectos de una
 * misma I. E. van al mismo grupo, para que los compare el mismo jurado.
 */
export function generarDistribucionCYE(participantes = [], grupos = GRUPOS_BASE_CYE) {
  const mapa = {};
  ['A', 'B', 'C'].forEach(cat => {
    const gruposCat = grupos.filter(g => g.categorias.includes(cat));
    if (gruposCat.length === 0) return;
    const porIE = new Map();
    participantes.filter(p => p.categoria === cat && p.estadoAdmision !== 'no_apto').forEach(p => {
      const clave = p.institucion?.codigoModular || p.id;
      if (!porIE.has(clave)) porIE.set(clave, []);
      porIE.get(clave).push(p);
    });
    const unidades = Array.from(porIE.values()).sort((a, b) =>
      (b.length - a.length) || String(a[0].institucion?.nombre).localeCompare(String(b[0].institucion?.nombre)));
    const asignados = Object.fromEntries(gruposCat.map(g => [g.grupo, 0]));
    unidades.forEach(u => {
      const libres = gruposCat.map(g => ({ grupo: g.grupo, libre: (g.cuota?.[cat] ?? 999) - asignados[g.grupo] }));
      const caben = libres.filter(x => x.libre >= u.length);
      const elegido = (caben.length ? caben : libres).sort((a, b) => (b.libre - a.libre) || (a.grupo - b.grupo))[0];
      u.forEach(p => { mapa[p.id] = elegido.grupo; });
      asignados[elegido.grupo] += u.length;
    });
  });
  return mapa;
}

/** Rotación de grupos con más de tres integrantes: en cada proyecto descansa uno y los demás ocupan J1, J2 y J3. */
export function generarRotacionCYE(participantes = [], distribucion = {}, grupos = GRUPOS_BASE_CYE) {
  const rotacion = {};
  grupos.filter(g => (g.miembros || 3) > SLOTS_JURADO.length).forEach(g => {
    participantes
      .filter(p => distribucion[p.id] === g.grupo)
      .sort((a, b) => String(a.institucion?.nombre).localeCompare(String(b.institucion?.nombre)) || (a.puestoIE - b.puestoIE))
      .forEach((p, i) => {
        const descansa = (i % g.miembros) + 1;
        const casilleros = {};
        let slot = 1;
        for (let n = 1; n <= g.miembros; n += 1) {
          if (n !== descansa && slot <= SLOTS_JURADO.length) { casilleros[n] = slot; slot += 1; }
        }
        rotacion[p.id] = { grupo: g.grupo, descansa, casilleros };
      });
  });
  return rotacion;
}

/** Casillero que corresponde a una credencial en un proyecto (null si descansa por rotación). */
export function casilleroPlanificado(participante, numeroCredencial, rotacion = ROTACION_CYE) {
  const n = Number(numeroCredencial);
  if (!participante || !n) return null;
  const rot = rotacion[participante.id];
  if (rot && Number(rot.grupo) === Number(participante.grupo)) return rot.casilleros?.[n] || null;
  return n <= SLOTS_JURADO.length ? n : null;
}

export function descansaEnRotacion(participante, numeroCredencial, rotacion = ROTACION_CYE) {
  const rot = rotacion[participante?.id];
  return Boolean(rot && Number(rot.grupo) === Number(participante.grupo) && Number(rot.descansa) === Number(numeroCredencial));
}

/**
 * Lista final de proyectos con estado de admisión efectivo, grupo, inasistencia y N.°.
 * `estados` es el mapa de cyeProyectoEstado: { [id]: { admision, grupo, noSePresento } }.
 */
export function construirParticipantesCYE({ semilla = [], importados = [], estados = {}, distribucion = DISTRIBUCION_CYE } = {}) {
  const porId = new Map();
  semilla.forEach(p => porId.set(p.id, { ...p, origen: 'padron' }));
  importados.forEach(p => porId.set(p.id, { ...porId.get(p.id), ...p, origen: 'sice' }));
  const todos = Array.from(porId.values());

  const lista = todos.map(p => {
    const calculada = evaluarAdmision(p, { todos });
    const est = estados[p.id] || {};
    const decision = est.admision && est.admision.estado ? est.admision : null;
    const estadoAdmision = decision ? decision.estado : calculada.estado;
    return {
      ...p,
      admisionCalculada: calculada.estado,
      estadoAdmision,
      decisionComision: decision,
      motivosAdmision: calculada.motivos,
      alertas: calculada.alertas,
      grupo: est.grupo != null ? Number(est.grupo) : (distribucion[p.id] ?? null),
      noSePresento: Boolean(est.noSePresento),
      numero: null
    };
  });

  ['A', 'B', 'C'].forEach(cat => {
    const gruposCat = GRUPOS_BASE_CYE.filter(g => g.categorias.includes(cat));
    const evaluablesCat = lista.filter(p => p.categoria === cat && p.estadoAdmision !== 'no_apto');
    if (gruposCat.length > 0) {
      const conteo = Object.fromEntries(gruposCat.map(g => [g.grupo, evaluablesCat.filter(p => p.grupo === g.grupo).length]));
      evaluablesCat.filter(p => !p.grupo).forEach(p => {
        const elegido = gruposCat
          .map(g => ({ grupo: g.grupo, libre: (g.cuota?.[cat] ?? 999) - conteo[g.grupo] }))
          .sort((a, b) => (b.libre - a.libre) || (a.grupo - b.grupo))[0];
        p.grupo = elegido.grupo;
        conteo[elegido.grupo] += 1;
      });
    }
    evaluablesCat
      .sort((x, y) => String(x.institucion?.nombre).localeCompare(String(y.institucion?.nombre)) || (x.puestoIE - y.puestoIE))
      .forEach((p, i) => { p.numero = i + 1; });
  });

  return lista.sort((x, y) =>
    x.categoria.localeCompare(y.categoria) || ((x.numero || 999) - (y.numero || 999))
    || String(x.institucion?.nombre).localeCompare(String(y.institucion?.nombre)));
}

/** Proyectos que se evalúan: aptos y observados (la comisión resuelve los observados antes del cierre). */
export function esEvaluable(p) {
  return p && p.estadoAdmision !== 'no_apto';
}

export function resumenAdmision(participantes = [], categoria = null) {
  const lista = categoria ? participantes.filter(p => p.categoria === categoria) : participantes;
  return {
    total: lista.length,
    apto: lista.filter(p => p.estadoAdmision === 'apto').length,
    observado: lista.filter(p => p.estadoAdmision === 'observado').length,
    no_apto: lista.filter(p => p.estadoAdmision === 'no_apto').length
  };
}

/* ───── 6. Puntajes de la ficha ───── */

export function calcularAnexo(rubrica, puntajesAnexo = {}) {
  const criterios = rubrica?.criterios || [];
  let subtotal = 0;
  let calificados = 0;
  const pendientes = [];
  criterios.forEach(c => {
    const v = Number(puntajesAnexo?.[c.id]);
    if (v >= 1 && v <= 4) {
      subtotal += v;
      calificados += 1;
    } else {
      pendientes.push(c.id);
    }
  });
  return {
    anexo: rubrica?.anexo,
    subtotal,
    calificados,
    total: criterios.length,
    maximo: rubrica?.maximo || 0,
    completo: criterios.length > 0 && calificados === criterios.length,
    pendientes
  };
}

export function calcularFicha(categoria, puntajes = {}) {
  const instrumentos = getInstrumentosCategoria(categoria);
  const anexos = {};
  let puntajeTotal = 0;
  let maximoTotal = 0;
  let anexosCompletos = 0;
  let criteriosPendientes = 0;
  instrumentos.forEach(r => {
    const a = calcularAnexo(r, puntajes?.[r.anexo] || {});
    anexos[r.anexo] = a;
    puntajeTotal += a.subtotal;
    maximoTotal += a.maximo;
    if (a.completo) anexosCompletos += 1;
    criteriosPendientes += a.total - a.calificados;
  });
  return {
    anexos,
    puntajeTotal,
    maximoTotal,
    anexosCompletos,
    totalAnexos: instrumentos.length,
    completa: instrumentos.length > 0 && anexosCompletos === instrumentos.length,
    criteriosPendientes
  };
}

/* ───── 7. Evaluaciones ───── */

export function evaluacionIdCYE(participanteId, numeroJurado) {
  return `${participanteId}__J${numeroJurado}`;
}

/** Descarta evaluaciones huérfanas, de casillero inválido o con identificador no canónico. */
export function filtrarEvaluacionesValidasCYE(evaluaciones = [], participantes = []) {
  const ids = new Set(participantes.map(p => p.id));
  const salida = new Map();
  evaluaciones.forEach(ev => {
    const slot = Number(ev?.jurado?.numeroJurado);
    if (!ids.has(ev?.participanteId) || !SLOTS_JURADO.includes(slot)) return;
    const canonico = evaluacionIdCYE(ev.participanteId, slot);
    if (ev.id && ev.id !== canonico) return;
    salida.set(canonico, ev);
  });
  return Array.from(salida.values());
}

function indexar(evaluaciones = []) {
  const m = new Map();
  evaluaciones.forEach(ev => {
    const slot = Number(ev?.jurado?.numeroJurado);
    if (ev?.participanteId && slot) m.set(evaluacionIdCYE(ev.participanteId, slot), ev);
  });
  return m;
}

/* ───── 8. Anexo D13 — consolidado por cada jurado ───── */

export function construirD13(participantes = [], evaluaciones = [], numeroJurado = 1) {
  const idx = indexar(evaluaciones);
  return participantes
    .filter(esEvaluable)
    .sort((a, b) => (a.numero || 0) - (b.numero || 0))
    .map(p => {
      const ev = idx.get(evaluacionIdCYE(p.id, numeroJurado));
      const registrada = ev?.estado === 'registrada';
      const calc = registrada ? calcularFicha(p.categoria, ev.puntajes) : null;
      return {
        numero: p.numero,
        participanteId: p.id,
        tituloProyecto: p.tituloProyecto,
        institucion: p.institucion?.nombre || '',
        gradoSeccion: resumenGradoSeccion(p.integrantes),
        ugel: p.institucion?.ugel || CYE_CONFIG.ugel,
        dre: p.institucion?.dre || CYE_CONFIG.dre,
        d10: calc ? calc.anexos.D10.subtotal : null,
        d11: calc ? calc.anexos.D11.subtotal : null,
        d12: calc ? calc.anexos.D12.subtotal : null,
        total: calc ? calc.puntajeTotal : null,
        registrada,
        noSePresento: p.noSePresento
      };
    });
}

/* ───── 9. Anexo D14 — consolidado, orden de mérito y empates ───── */

export function esElegiblePodio(fila) {
  if (!fila || !fila.completo || fila.total == null) return false;
  if (CYE_CONFIG.inasistenciaExcluyeDelPodio && fila.noSePresento) return false;
  return true;
}

/**
 * Orden de mérito por puntaje total (sumatoria de los tres jurados).
 * Un empate queda resuelto solo si el jurado asignó un orden distinto a cada proyecto empatado.
 */
export function calcularOrdenMeritoCYE(filas = []) {
  filas.forEach(f => { f.puesto = null; f.empatado = false; f.dirimido = false; });
  const elegibles = filas.filter(esElegiblePodio).sort((a, b) => b.total - a.total);

  let posicion = 1;
  let i = 0;
  while (i < elegibles.length) {
    let j = i;
    while (j < elegibles.length && elegibles[j].total === elegibles[i].total) j += 1;
    const grupo = elegibles.slice(i, j);

    if (grupo.length === 1) {
      grupo[0].puesto = posicion;
    } else {
      const ordenes = grupo.map(f => f.ordenDirimencia).filter(v => v != null && v !== '');
      const resuelto = ordenes.length === grupo.length && new Set(ordenes.map(Number)).size === grupo.length;
      if (resuelto) {
        [...grupo].sort((a, b) => Number(a.ordenDirimencia) - Number(b.ordenDirimencia))
          .forEach((f, k) => { f.puesto = posicion + k; f.dirimido = true; });
      } else {
        grupo.forEach(f => { f.puesto = posicion; f.empatado = true; });
      }
    }
    posicion += grupo.length;
    i = j;
  }

  return [...filas].sort((a, b) => {
    if (a.puesto && b.puesto) return (a.puesto - b.puesto) || ((a.numero || 0) - (b.numero || 0));
    if (a.puesto) return -1;
    if (b.puesto) return 1;
    return (a.numero || 0) - (b.numero || 0);
  });
}

export function construirD14(participantes = [], evaluaciones = [], { dirimencia = null } = {}) {
  const idx = indexar(evaluaciones);
  const filas = participantes.filter(esEvaluable).map(p => {
    const notas = {};
    const sumas = { D10: 0, D11: 0, D12: 0 };
    let registradas = 0;
    SLOTS_JURADO.forEach(slot => {
      const ev = idx.get(evaluacionIdCYE(p.id, slot));
      const calc = ev?.estado === 'registrada' ? calcularFicha(p.categoria, ev.puntajes) : null;
      notas[`jurado${slot}`] = calc ? calc.puntajeTotal : null;
      if (calc) {
        registradas += 1;
        sumas.D10 += calc.anexos.D10?.subtotal || 0;
        sumas.D11 += calc.anexos.D11?.subtotal || 0;
        sumas.D12 += calc.anexos.D12?.subtotal || 0;
      }
    });
    const completo = registradas === SLOTS_JURADO.length;
    const orden = dirimencia?.orden?.[p.id];
    return {
      numero: p.numero,
      participanteId: p.id,
      categoria: p.categoria,
      institucion: p.institucion?.nombre || '',
      codigoModular: p.institucion?.codigoModular || '',
      tituloProyecto: p.tituloProyecto || '',
      ugel: p.institucion?.ugel || CYE_CONFIG.ugel,
      dre: p.institucion?.dre || CYE_CONFIG.dre,
      ...notas,
      registradas,
      completo,
      total: completo ? SLOTS_JURADO.reduce((s, slot) => s + notas[`jurado${slot}`], 0) : null,
      d10Suma: completo ? sumas.D10 : null,
      d11Suma: completo ? sumas.D11 : null,
      d12Suma: completo ? sumas.D12 : null,
      grupo: p.grupo || null,
      noSePresento: Boolean(p.noSePresento),
      estadoAdmision: p.estadoAdmision,
      ordenDirimencia: orden != null && orden !== '' ? Number(orden) : null
    };
  });
  return calcularOrdenMeritoCYE(filas);
}

/** Empates sin resolver que tocan el podio (1.°, 2.° o 3.° puesto). */
export function detectarEmpatesPodioCYE(filas = []) {
  const mapa = new Map();
  filas.filter(f => f.empatado && f.puesto && f.puesto <= 3).forEach(f => {
    if (!mapa.has(f.puesto)) mapa.set(f.puesto, []);
    mapa.get(f.puesto).push(f);
  });
  return Array.from(mapa.entries())
    .map(([puesto, grupo]) => ({ puesto, filas: grupo }))
    .sort((a, b) => a.puesto - b.puesto);
}

/** Tres primeros puestos para el Anexo D15. */
export function construirResultadosD15(filas = []) {
  return filas
    .filter(f => f.puesto && f.puesto <= 3 && !f.empatado)
    .sort((a, b) => a.puesto - b.puesto)
    .slice(0, 3)
    .map(f => ({
      puesto: f.puesto,
      ordenMerito: `${f.puesto}°`,
      institucion: f.institucion,
      ugel: f.ugel,
      dre: f.dre,
      nombreProyecto: f.tituloProyecto,
      total: f.total,
      participanteId: f.participanteId
    }));
}

/* ───── 10. Compilación de PDF ───── */

export function ordenarEvaluacionesParaCompilacion(evaluaciones = [], participantes = []) {
  const numero = new Map(participantes.map(p => [p.id, p.numero || 999]));
  return [...evaluaciones].sort((a, b) =>
    String(a.categoria).localeCompare(String(b.categoria))
    || ((numero.get(a.participanteId) || 999) - (numero.get(b.participanteId) || 999))
    || ((a.jurado?.numeroJurado || 1) - (b.jurado?.numeroJurado || 1))
  );
}

export function describirAlcanceCYE(alcance, categoria) {
  if (alcance === 'CATEGORIA') return `Categoría ${categoria || '—'}`;
  return 'Todo el concurso (categorías A, B y C)';
}

/* ───── 11. Importación del reporte SICE (misma estructura que el padrón precargado) ───── */

function aFechaISO(valor) {
  if (valor == null || valor === '') return '';
  const dos = n => String(n).padStart(2, '0');
  if (valor instanceof Date && !isNaN(valor)) {
    return `${valor.getFullYear()}-${dos(valor.getMonth() + 1)}-${dos(valor.getDate())}T${dos(valor.getHours())}:${dos(valor.getMinutes())}:${dos(valor.getSeconds())}`;
  }
  if (typeof valor === 'number') {
    const ms = Math.round((valor - 25569) * 86400000);
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}T${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}:${dos(d.getUTCSeconds())}`;
  }
  const s = normalizarTexto(valor);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}T${dos(m[4] || 0)}:${m[5] || '00'}:${m[6] || '00'}`;
  return s.replace(' ', 'T').slice(0, 19);
}

/**
 * Convierte las filas de uno o varios reportes SICE de Crea y Emprende en proyectos.
 * Los documentos de identidad se usan solo en memoria para detectar estudiantes repetidos;
 * no forman parte del resultado.
 */
export function parsearReportesSICECYE(hojas = []) {
  const filas = [];
  const errores = [];

  hojas.forEach(({ nombre, filas: aoa }) => {
    const idxCab = (aoa || []).findIndex(r => Array.isArray(r) && normalizarTexto(r[0]) === 'Nro');
    if (idxCab < 0) {
      errores.push(`${nombre || 'Archivo'}: no se encontró la fila de cabecera con la columna "Nro".`);
      return;
    }
    aoa.slice(idxCab + 1).forEach(r => {
      if (!Array.isArray(r) || r[0] == null || normalizarTexto(r[0]) === '') return;
      const categoriaTexto = normalizarTexto(r[17]);
      const cat = (/Categor[ií]a\s+([ABC])/i.exec(categoriaTexto) || [])[1];
      if (!cat) {
        errores.push(`${nombre || 'Archivo'}: fila ${normalizarTexto(r[0])} con categoría no reconocida ("${categoriaTexto}").`);
        return;
      }
      const cod = soloDigitos(r[9]).padStart(7, '0');
      filas.push({
        cat,
        cod,
        ie: normalizarTexto(r[4]),
        gestion: normalizarTexto(r[3]),
        modalidad: normalizarTexto(r[5]),
        nivel: normalizarTexto(r[7]),
        distrito: normalizarTexto(r[8]),
        fecha: aFechaISO(r[14]),
        puesto: Number(r[15]) || 0,
        titulo: normalizarTexto(r[19]),
        tematica: normalizarTexto(r[20]),
        enlace: normalizarTexto(r[21]),
        doc: soloDigitos(r[23]) || normalizarTexto(r[23]),
        nombreEst: normalizarTexto(`${normalizarTexto(r[24])} ${normalizarTexto(r[25])}, ${normalizarTexto(r[26])}`).toUpperCase(),
        grado: normalizarTexto(r[29]).toUpperCase(),
        seccion: normalizarTexto(r[30]).toUpperCase(),
        docente: normalizarTexto(`${normalizarTexto(r[35])} ${normalizarTexto(r[36])}, ${normalizarTexto(r[37])}`).toUpperCase(),
        especialidad: normalizarTexto(r[42])
      });
    });
  });

  const conteoDocs = new Map();
  filas.forEach(f => { if (f.doc) conteoDocs.set(f.doc, (conteoDocs.get(f.doc) || 0) + 1); });

  const grupos = new Map();
  filas.forEach(f => {
    const clave = [f.cat, f.cod, f.titulo, f.fecha].join('||');
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(f);
  });

  const usados = new Set();
  const proyectos = [];
  grupos.forEach(g => {
    const f0 = g[0];
    const base = `CYE26-${f0.cat}-${f0.cod}-P${f0.puesto}`;
    let id = base;
    let k = 2;
    while (usados.has(id)) { id = `${base}-${k}`; k += 1; }
    usados.add(id);
    proyectos.push({
      id,
      categoria: f0.cat,
      institucion: {
        nombre: f0.ie, codigoModular: f0.cod, tipoGestion: f0.gestion, distrito: f0.distrito,
        modalidad: f0.modalidad, nivel: f0.nivel, ugel: CYE_CONFIG.ugel, dre: CYE_CONFIG.dre
      },
      puestoIE: f0.puesto,
      tituloProyecto: f0.titulo,
      tematica: f0.tematica,
      enlaceWeb: f0.enlace,
      fechaRegistro: f0.fecha,
      integrantes: g.map(x => ({ grado: x.grado, seccion: x.seccion, nombreCompleto: x.nombreEst })),
      estudiantesEnOtrosEquipos: g.filter(x => x.doc && conteoDocs.get(x.doc) > 1).length,
      docenteAsesor: { nombreCompleto: f0.docente.replace(/^,\s*/, ''), especialidad: f0.especialidad }
    });
  });

  return { proyectos, totalFilas: filas.length, errores };
}

/* ───── 12. Desempate con la jerarquía aprobada ───── */

/**
 * Propone el orden de los proyectos empatados en el podio: mayor D11 acumulado, luego D10,
 * luego D12. El jurado confirma la propuesta al registrar la dirimencia.
 */
export function sugerirDirimenciaCYE(filas = []) {
  const empates = detectarEmpatesPodioCYE(filas);
  if (empates.length === 0) return null;
  const orden = {};
  let completo = true;
  empates.forEach(({ filas: grupo }) => {
    const ordenados = [...grupo].sort((a, b) =>
      ((b.d11Suma || 0) - (a.d11Suma || 0)) || ((b.d10Suma || 0) - (a.d10Suma || 0)) || ((b.d12Suma || 0) - (a.d12Suma || 0)));
    for (let i = 1; i < ordenados.length; i += 1) {
      const a = ordenados[i - 1];
      const b = ordenados[i];
      if (a.d11Suma === b.d11Suma && a.d10Suma === b.d10Suma && a.d12Suma === b.d12Suma) completo = false;
    }
    ordenados.forEach((f, k) => { orden[f.participanteId] = k + 1; });
  });
  return { orden, completo, criterio: CYE_CONFIG.criterioDesempate, empates };
}

/* ───── 13. Calibración previa entre grupos ───── */

export function claveAcuerdo(anexo, numero) {
  return `${anexo}_${numero}`;
}

/** La categoría C se calibra con el proyecto de la categoría A (sus rúbricas coinciden en los criterios comunes). */
export function categoriaDeCalibracion(categoria) {
  return categoria === 'C' ? 'A' : categoria;
}

/** Acuerdos visibles en las fichas oficiales. C hereda los de A y suma los propios. */
export function acuerdosParaCategoria(config, categoria) {
  const propios = config?.acuerdos?.[categoria] || {};
  return categoria === 'C' ? { ...(config?.acuerdos?.A || {}), ...propios } : propios;
}

/**
 * Proyectos que pueden servir de ancla: no aptos (no compiten), con enlace que abre y sin
 * observaciones pendientes de decisión. Primero los equipos más completos.
 */
export function candidatosAnclaCalibracion(participantes = [], categoria) {
  return participantes
    .filter(p => p.categoria === categoria && p.estadoAdmision === 'no_apto' && p.enlaceWeb)
    .filter(p => !(p.motivosAdmision || []).some(m => m.codigo === 'GRADO_SECCION'))
    .filter(p => !(p.alertas || []).some(a => a.codigo === 'ENLACE'))
    .sort((a, b) => ((b.integrantes || []).length - (a.integrantes || []).length)
      || String(a.institucion?.nombre).localeCompare(String(b.institucion?.nombre)));
}

function promedio(valores) {
  return valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
}

function mediana(valores) {
  if (!valores.length) return null;
  const o = [...valores].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/** Dispersión por criterio y por grupo de las calificaciones de calibración enviadas. */
export function calcularCalibracionCYE(fichas = [], categoria) {
  const rubricas = getInstrumentosCategoria(categoria);
  const maximo = maximoCategoria(categoria);
  const enviadas = fichas.filter(f => f.categoria === categoria && f.estado === 'enviada');
  const totalDe = f => calcularFicha(categoria, f.puntajes).puntajeTotal;
  const totales = enviadas.map(totalDe);
  const med = mediana(totales);
  const grupos = [...new Set(enviadas.map(f => Number(f.jurado?.grupo)).filter(Boolean))].sort((a, b) => a - b);

  const porGrupo = grupos.map(g => {
    const ts = enviadas.filter(f => Number(f.jurado?.grupo) === g).map(totalDe);
    return { grupo: g, n: ts.length, promedio: promedio(ts) };
  });
  const promediosGrupo = porGrupo.map(g => g.promedio).filter(v => v != null);
  const brechaGrupos = promediosGrupo.length > 1 ? Math.max(...promediosGrupo) - Math.min(...promediosGrupo) : 0;
  const u = CYE_CONFIG.calibracion;
  const estadoBrecha = promediosGrupo.length < 2
    ? 'sin_datos'
    : (brechaGrupos <= maximo * u.brechaAlineada ? 'acuerdo' : (brechaGrupos <= maximo * u.brechaRevisar ? 'revisar' : 'discrepancia'));

  const criterios = rubricas.flatMap(r => r.criterios.map(c => {
    const valorDe = f => Number(f.puntajes?.[r.anexo]?.[c.id]);
    const valores = enviadas.map(valorDe).filter(v => v >= 1 && v <= 4);
    const conteo = { 1: 0, 2: 0, 3: 0, 4: 0 };
    valores.forEach(v => { conteo[v] += 1; });
    const min = valores.length ? Math.min(...valores) : null;
    const max = valores.length ? Math.max(...valores) : null;
    const rango = valores.length ? max - min : null;
    const promediosPorGrupo = {};
    grupos.forEach(g => {
      promediosPorGrupo[g] = promedio(enviadas.filter(f => Number(f.jurado?.grupo) === g).map(valorDe).filter(v => v >= 1 && v <= 4));
    });
    const gp = Object.values(promediosPorGrupo).filter(v => v != null);
    const brecha = gp.length > 1 ? Math.max(...gp) - Math.min(...gp) : 0;
    let estado = 'sin_datos';
    if (valores.length) {
      estado = (rango >= 3 || brecha >= 1.5) ? 'discrepancia' : ((rango === 2 || brecha >= 1) ? 'revisar' : 'acuerdo');
    }
    return {
      id: c.id, clave: claveAcuerdo(r.anexo, c.numero), anexo: r.anexo, numero: c.numero, nombre: c.nombre,
      n: valores.length, conteo, min, max, rango, promedio: promedio(valores), promediosPorGrupo, brechaGrupos: brecha, estado
    };
  }));

  const jurados = enviadas.map(f => {
    const total = totalDe(f);
    const desvio = med != null ? total - med : 0;
    return {
      uid: f.jurado?.uid, nombre: f.jurado?.nombre || f.jurado?.correo || '', grupo: Number(f.jurado?.grupo) || null,
      total, desvio, alerta: Math.abs(desvio) > maximo * u.brechaRevisar
    };
  }).sort((a, b) => ((a.grupo || 99) - (b.grupo || 99)) || a.nombre.localeCompare(b.nombre));

  return { categoria, n: enviadas.length, maximo, mediana: med, grupos, porGrupo, brechaGrupos, estadoBrecha, criterios, jurados };
}
