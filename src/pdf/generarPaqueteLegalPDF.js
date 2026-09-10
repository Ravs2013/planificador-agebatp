/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — NIVEL 5 — PAQUETE LEGAL COMPLETO
   Un solo PDF listo para mesa de partes, con orientación mixta por página.

   Estructura:
     Página 1      Carátula
     Página 2      Índice de foliación
     Páginas 3..   Por cada área: Acta E20 (vertical) + Consolidado E19 (apaisado)
                   y a continuación todas las fichas E11..E18 en el orden determinista.

   El índice se rellena en una segunda pasada, cuando ya se conocen los números de página
   reales: no hay forma de saberlos por adelantado con tablas de altura variable.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import {
  M, A4, A4_APAISADO, anchoContenido, drawChromeEureka, aplicarPiePaginasEureka,
  aplicarFuentesArial, cederHilo
} from './membreteEureka';
import { RGB } from '../data/eurekaCatalogos';
import { EUREKA_CONFIG, getArea, getCategoria, getAreasDeCategoria } from '../data/eurekaConfigUGEL03';
import { dibujarUnicaFichaEureka } from './generarFichaEurekaPDF';
import { dibujarUnicoE19 } from './generarE19PDF';
import { dibujarUnicaActaE20 } from './generarE20PDF';
import { resolverPanelFirmas, esPreliminar } from '../utils/eurekaFirmas';
import {
  ordenarEvaluacionesParaCompilacion, ordenArea, rubricaDeEvaluacion, formatearFechaLarga
} from '../utils/eurekaHelpers';

const CONTENT_W = anchoContenido('portrait');

function dibujarCaratula(doc, { categoria, banner, totalAreas }) {
  const cat = getCategoria(categoria);
  const { dia, mes, anio } = formatearFechaLarga(EUREKA_CONFIG.fechaEvaluacion);

  let y = drawChromeEureka(doc, {
    orientacion: 'portrait',
    titulo: '',
    subtitulo: '',
    banner
  });

  y += 26;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...RGB.verdeOscuro);
  const titulo = doc.splitTextToSize(EUREKA_CONFIG.edicion.toUpperCase(), CONTENT_W);
  doc.text(titulo, A4.ancho / 2, y, { align: 'center' });
  y += titulo.length * 8 + 6;

  doc.setFontSize(13);
  doc.setTextColor(...RGB.navy2);
  doc.text(`EDICIÓN ${EUREKA_CONFIG.anio}`, A4.ancho / 2, y, { align: 'center' });
  y += 14;

  doc.setFillColor(...RGB.verdeEureka);
  doc.rect(M.left + 30, y, CONTENT_W - 60, 0.9, 'F');
  y += 12;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...RGB.navy2);
  doc.text('EXPEDIENTE DE EVALUACIÓN', A4.ancho / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(11);
  doc.setFont('Arial', 'normal');
  doc.text(`Etapa ${EUREKA_CONFIG.etapa} — ${EUREKA_CONFIG.ugel}`, A4.ancho / 2, y, { align: 'center' });
  y += 16;

  const datos = [
    ['Categoría', cat ? `${cat.nombre} — ${cat.grados}` : categoria],
    ['Áreas de participación', `${totalAreas} área(s)`],
    ['DRE/GRE', EUREKA_CONFIG.dre],
    ['UGEL', EUREKA_CONFIG.ugel],
    ['Región / Provincia / Distrito', `${EUREKA_CONFIG.region} / ${EUREKA_CONFIG.provincia} / ${EUREKA_CONFIG.distrito}`],
    ['Fecha de evaluación', `${dia} de ${mes} de ${anio}`]
  ];

  doc.setFontSize(10);
  datos.forEach(([k, val]) => {
    doc.setFont('Arial', 'bold');
    doc.setTextColor(...RGB.gris700);
    doc.text(`${k}:`, M.left + 24, y);
    doc.setFont('Arial', 'normal');
    doc.setTextColor(...RGB.navy2);
    doc.text(String(val), M.left + 82, y);
    y += 7;
  });

  y += 10;
  doc.setFont('Arial', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...RGB.gris500);
  const nota = doc.splitTextToSize(
    'Este expediente reúne, en orden de foliación, el acta de resultados, el formato consolidado de evaluación '
    + 'y la totalidad de las fichas individuales suscritas por el jurado calificador.',
    CONTENT_W - 40
  );
  doc.text(nota, A4.ancho / 2, y, { align: 'center' });
}

/** Entradas de índice que caben en una página reservada. */
const ENTRADAS_POR_PAGINA_INDICE = 48;

export function paginasIndiceNecesarias(totalEntradas) {
  return Math.max(1, Math.ceil(totalEntradas / ENTRADAS_POR_PAGINA_INDICE));
}

/**
 * Rellena el índice sobre páginas YA RESERVADAS.
 * No se usa addPage aquí: eso las añadiría al final del documento y rompería la foliación.
 */
function dibujarIndice(doc, entradas, { banner, paginasReservadas = [] }) {
  let idxPagina = 0;
  let y = 0;

  const abrirPagina = (continuacion) => {
    doc.setPage(paginasReservadas[idxPagina]);
    y = drawChromeEureka(doc, {
      orientacion: 'portrait',
      titulo: continuacion ? 'ÍNDICE DE FOLIACIÓN (continuación)' : 'ÍNDICE DE FOLIACIÓN',
      subtitulo: `Etapa ${EUREKA_CONFIG.etapa} · ${EUREKA_CONFIG.ugel}`,
      banner
    });
    y += 4;
    doc.setFont('Arial', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...RGB.navy2);
    doc.text('DOCUMENTO', M.left, y);
    doc.text('PÁGINA', A4.ancho - M.right, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(...RGB.gris300);
    doc.line(M.left, y, A4.ancho - M.right, y);
    y += 4.5;
    idxPagina += 1;
  };

  abrirPagina(false);

  entradas.forEach(e => {
    const sinEspacio = y > A4.alto - M.bottom - 10;
    if (sinEspacio && idxPagina < paginasReservadas.length) {
      abrirPagina(true);
    } else if (sinEspacio) {
      return; // Sin páginas reservadas disponibles: no se desplaza la foliación.
    }
    doc.setTextColor(...(e.destacado ? RGB.verdeOscuro : RGB.gris700));
    doc.setFont('Arial', e.destacado ? 'bold' : 'normal');
    doc.setFontSize(8);
    const texto = doc.splitTextToSize(e.etiqueta, CONTENT_W - 26)[0];
    doc.text(`${e.sangria ? '     ' : ''}${texto}`, M.left, y);
    doc.text(e.pagina != null ? String(e.pagina) : '—', A4.ancho - M.right, y, { align: 'right' });
    y += 4.4;
  });
}

/**
 * Construye las etiquetas del índice ANTES de renderizar, para saber cuántas páginas
 * reservar. Los folios se completan durante el renderizado.
 */
function planificarEntradas({ areasConDatos, areasSinDatos, actas, consolidados, evaluaciones }) {
  const entradas = [
    { etiqueta: 'Carátula del expediente', destacado: true },
    { etiqueta: 'Índice de foliación', destacado: true }
  ];

  areasConDatos.forEach(areaId => {
    const area = getArea(areaId);
    entradas.push({ etiqueta: `ÁREA: ${(area ? area.nombre : areaId).toUpperCase()}`, destacado: true, marcaArea: areaId });
    entradas.push({
      etiqueta: actas.some(a => a.areaId === areaId)
        ? 'Anexo E20 — Acta de resultados'
        : 'Anexo E20 — Acta de resultados (no emitida)',
      sangria: true, tipo: 'acta', areaId
    });
    entradas.push({
      etiqueta: consolidados.some(c => c.areaId === areaId)
        ? 'Anexo E19 — Formato consolidado de evaluación'
        : 'Anexo E19 — Formato consolidado de evaluación (no emitido)',
      sangria: true, tipo: 'consolidado', areaId
    });

    const fichas = ordenarEvaluacionesParaCompilacion(evaluaciones.filter(ev => ev.areaId === areaId));
    if (fichas.length === 0) {
      entradas.push({ etiqueta: 'Fichas de evaluación (sin registros)', sangria: true, tipo: 'vacio', areaId });
    }
    fichas.forEach(ev => {
      const snap = ev.participanteSnapshot || {};
      entradas.push({
        etiqueta: `Anexo ${ev.anexoEvaluacion} — ${snap.institucionNombre || snap.institucion?.nombre || 'I. E.'} — Jurado N.° ${ev.jurado?.numeroJurado || 1}`,
        sangria: true, tipo: 'ficha', areaId, evaluacionId: ev.id
      });
    });
  });

  areasSinDatos.forEach(areaId => {
    const area = getArea(areaId);
    entradas.push({
      etiqueta: `ÁREA: ${(area ? area.nombre : areaId).toUpperCase()} — sin participantes registrados`,
      destacado: true, tipo: 'area_vacia'
    });
  });

  return entradas;
}

/**
 * Nivel 5 — Paquete Legal Completo de una categoría.
 *
 * @param {Object}   opciones
 * @param {string}   opciones.categoria
 * @param {Array}    opciones.consolidados  consolidados E19 de la categoría
 * @param {Array}    opciones.actas         actas E20 de la categoría
 * @param {Array}    opciones.evaluaciones  todas las evaluaciones de la categoría
 * @param {Object}   opciones.panelesMap
 */
export async function generarPaqueteLegalPDF({
  categoria,
  consolidados = [],
  actas = [],
  evaluaciones = [],
  panelesMap = {},
  banner = null,
  onProgreso = null
}) {
  const areasCategoria = getAreasDeCategoria(categoria).map(a => a.id);
  const areasConDatos = areasCategoria.filter(areaId =>
    evaluaciones.some(ev => ev.areaId === areaId)
    || consolidados.some(c => c.areaId === areaId)
    || actas.some(a => a.areaId === areaId)
  );
  const areasSinDatos = areasCategoria.filter(a => !areasConDatos.includes(a));

  if (areasConDatos.length === 0) {
    throw new Error(`No hay información registrada en la categoría ${categoria} para compilar el paquete legal.`);
  }

  const areasOrdenadas = [...areasConDatos].sort((a, b) => ordenArea(a) - ordenArea(b));

  // Primera pasada: se planifican las entradas para saber cuántas páginas reservar al
  // índice. Con las páginas reservadas por adelantado la foliación no se desplaza.
  const entradas = planificarEntradas({
    areasConDatos: areasOrdenadas, areasSinDatos, actas, consolidados, evaluaciones
  });
  const numPaginasIndice = paginasIndiceNecesarias(entradas.length);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  // Página 1 — carátula.
  dibujarCaratula(doc, { categoria, banner, totalAreas: areasOrdenadas.length });
  entradas[0].pagina = 1;

  // Páginas reservadas para el índice.
  const paginasReservadas = [];
  for (let i = 0; i < numPaginasIndice; i++) {
    doc.addPage([A4.ancho, A4.alto], 'portrait');
    paginasReservadas.push(doc.internal.getNumberOfPages());
  }
  entradas[1].pagina = paginasReservadas[0];

  const indicePorClave = new Map();
  entradas.forEach(e => {
    if (e.tipo === 'ficha') indicePorClave.set(`ficha:${e.evaluacionId}`, e);
    else if (e.tipo === 'acta') indicePorClave.set(`acta:${e.areaId}`, e);
    else if (e.tipo === 'consolidado') indicePorClave.set(`consolidado:${e.areaId}`, e);
  });

  let algunPreliminar = false;
  let procesadas = 0;
  const evaluacionesTotales = evaluaciones.length;

  for (const areaId of areasOrdenadas) {
    const panel = resolverPanelFirmas(panelesMap, { categoria, areaId });
    if (esPreliminar(panel)) algunPreliminar = true;

    // Acta E20 (vertical).
    const acta = actas.find(a => a.areaId === areaId);
    if (acta) {
      doc.addPage([A4.ancho, A4.alto], 'portrait');
      const pag = doc.internal.getNumberOfPages();
      try {
        dibujarUnicaActaE20(doc, { acta, panel, banner });
      } catch (err) {
        console.warn(`Acta omitida en el paquete legal (${areaId}):`, err);
      }
      const entrada = indicePorClave.get(`acta:${areaId}`);
      if (entrada) entrada.pagina = pag;
    }

    // Consolidado E19 (apaisado). jsPDF admite orientación mixta por página.
    const consolidado = consolidados.find(c => c.areaId === areaId);
    if (consolidado) {
      doc.addPage([A4_APAISADO.ancho, A4_APAISADO.alto], 'landscape');
      const pag = doc.internal.getNumberOfPages();
      try {
        dibujarUnicoE19(doc, { consolidado, panel, banner });
      } catch (err) {
        console.warn(`Consolidado omitido en el paquete legal (${areaId}):`, err);
      }
      const entrada = indicePorClave.get(`consolidado:${areaId}`);
      if (entrada) entrada.pagina = pag;
    }

    // Fichas E11 a E18 en el orden determinista.
    const fichasArea = ordenarEvaluacionesParaCompilacion(
      evaluaciones.filter(ev => ev.areaId === areaId)
    );

    for (let i = 0; i < fichasArea.length; i++) {
      const ev = fichasArea[i];
      doc.addPage([A4.ancho, A4.alto], 'portrait');
      const pag = doc.internal.getNumberOfPages();
      try {
        dibujarUnicaFichaEureka(doc, {
          evaluacion: ev,
          rubrica: rubricaDeEvaluacion(ev),
          panel,
          banner
        });
      } catch (err) {
        console.warn(`Ficha omitida en el paquete legal (${ev.id}):`, err);
      }
      const entrada = indicePorClave.get(`ficha:${ev.id}`);
      if (entrada) entrada.pagina = pag;

      procesadas += 1;
      if (onProgreso) onProgreso(procesadas, evaluacionesTotales);
      if (procesadas % 25 === 0) await cederHilo();
    }
  }

  // Segunda pasada: rellenar el índice ya con los folios reales.
  dibujarIndice(doc, entradas, { banner, paginasReservadas });

  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  doc.save(`PaqueteLegal_Eureka_${EUREKA_CONFIG.anio}_Cat${categoria}_${EUREKA_CONFIG.ugel.replace(/\s+/g, '')}.pdf`);

  return { paginas: doc.internal.getNumberOfPages(), fichas: procesadas, areas: areasConDatos.length };
}
