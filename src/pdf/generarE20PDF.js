/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — ANEXO E20 — ACTA DE RESULTADOS
   A4 vertical, con el diseño del Anexo A11 de Juegos Florales.
   Párrafo de cierre condicional: en A, B y C la etapa UGEL es la última; en D y E el primer
   puesto de cada área es seleccionado como ganador (numeral 4).
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { A4, anchoContenido, drawChromeEureka, medirChromeEureka, aplicarPiePaginasEureka, aplicarFuentesArial, cederHilo } from './membreteEureka';
import { AZUL, MARGEN, asegurarEspacio, tablaConCierre, dibujarFirmasJurado, alturaFirmasJurado } from './pdfDiseno';
import { TEXTOS_LEGALES } from '../data/eurekaCatalogos';
import { EUREKA_CONFIG, getArea, getCategoria } from '../data/eurekaConfigUGEL03';
import { bloquesFirmaDePanel, firmantesOrdenados, esPreliminar, resolverPanelFirmas } from '../utils/eurekaFirmas';
import { formatearFechaLarga, sanitizarNombreArchivo, ordenArea } from '../utils/eurekaHelpers';

const W = anchoContenido('portrait');
const PT = 0.3528;

/** Texto legal literal del Anexo E20, con los marcadores sustituidos. */
export function construirTextoActa(acta) {
  const { dia, mes, anio } = formatearFechaLarga(acta.fecha || EUREKA_CONFIG.fechaEvaluacion);
  const area = getArea(acta.areaId);
  return `En la región de ${acta.region || EUREKA_CONFIG.region}, provincia de ${acta.provincia || EUREKA_CONFIG.provincia}, `
    + `distrito de ${acta.distrito || EUREKA_CONFIG.distrito} con fecha ${dia} de ${mes} de ${anio}, `
    + `a horas ${acta.hora || EUREKA_CONFIG.horaActa}, durante el proceso de evaluación de la Feria Escolar Nacional `
    + `de Ciencia y Tecnología – EUREKA ${anio} de la etapa ${acta.etapa || EUREKA_CONFIG.etapa}, `
    + `de la categoría ${acta.categoria}, del área de ${area ? area.nombre : acta.areaId}, el jurado calificador, `
    + 'conformado por las siguientes personalidades:';
}

/** Párrafo condicional de clasificación. */
export function construirParrafoClasificacion(acta) {
  const cat = getCategoria(acta.categoria);
  const area = getArea(acta.areaId);
  const anio = String(acta.fecha || EUREKA_CONFIG.fechaEvaluacion).slice(0, 4);
  if (cat && cat.finalizaEnUGEL) {
    return TEXTOS_LEGALES.parrafoFinalizaUGEL
      .replace('{categoria}', acta.categoria)
      .replace('{areaNombre}', area ? area.nombre : acta.areaId);
  }
  return TEXTOS_LEGALES.parrafoClasificaDRE.replace('{anio}', anio);
}

export function dibujarUnicaActaE20(doc, { acta, panel = null, banner = null, nuevaPagina = false }) {
  const chrome = {
    orientacion: 'portrait',
    titulo: 'ANEXO E20 — ACTA DE RESULTADOS',
    subtitulo: `${EUREKA_CONFIG.edicion} ${EUREKA_CONFIG.anio}`,
    banner
  };
  if (nuevaPagina) doc.addPage([A4.ancho, A4.alto], 'portrait');
  let y = drawChromeEureka(doc, chrome) + 2;

  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.6);
  doc.setTextColor(...AZUL.texto);
  const parrafo = doc.splitTextToSize(construirTextoActa(acta), W);
  doc.text(parrafo, MARGEN.left, y, { maxWidth: W, align: 'justify', lineHeightFactor: 1.4 });
  y += parrafo.length * 9.6 * 1.4 * PT + 3;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(9.6);
  doc.setTextColor(...AZUL.navy2);
  firmantesOrdenados(panel).forEach((f, i) => {
    const nombre = f && f.nombreCompleto ? f.nombreCompleto.toUpperCase() : '__________________________________________';
    const dni = f && f.dni ? ` (DNI ${f.dni})` : '';
    doc.text(`${i + 1}. ${nombre}${dni}${f && f.presidente ? ' — Presidente del jurado' : ''}`, MARGEN.left + 8, y);
    y += 5.4;
  });
  y += 2;

  doc.setFont('Arial', 'normal');
  doc.setTextColor(...AZUL.texto);
  doc.text(TEXTOS_LEGALES.transicionActaE20, MARGEN.left, y);
  y += 6;

  const incluirPuntaje = Boolean(acta.incluirPuntaje);
  const head = ['Orden de mérito', 'I. E.', 'UGEL', 'DRE/GRE', 'Nombre del proyecto'];
  if (incluirPuntaje) head.push('Puntaje total');
  const resultados = acta.resultados || [];
  const body = (resultados.length ? resultados : [1, 2, 3].map(p => ({ ordenMerito: p === 1 ? '1.er' : `${p}.°` }))).map(r => {
    const fila = [r.ordenMerito || '', r.institucion || '', r.ugel || (r.institucion ? EUREKA_CONFIG.ugel : ''), r.dre || (r.institucion ? EUREKA_CONFIG.dre : ''), r.nombreProyecto || ''];
    if (incluirPuntaje) fila.push(r.puntajeTotal != null ? String(r.puntajeTotal) : '');
    return fila;
  });
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.2);
  const clasificacion = doc.splitTextToSize(construirParrafoClasificacion(acta), W);
  const altoCierre = 6 + clasificacion.length * 9.2 * 1.35 * PT + 10 + alturaFirmasJurado(3);
  const top = medirChromeEureka(doc, chrome);
  const opcionesTabla = {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right, top, bottom: MARGEN.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    rowPageBreak: 'avoid',
    didDrawPage: dato => { if (dato.pageNumber > 1) drawChromeEureka(doc, chrome); },
    head: [head],
    headStyles: { fillColor: AZUL.navy3, textColor: AZUL.blanco, fontStyle: 'bold', fontSize: 8.6, halign: 'center', valign: 'middle' },
    styles: { font: 'Arial', fontSize: 8.6, cellPadding: 2.8, overflow: 'linebreak', lineColor: AZUL.borde, lineWidth: 0.2, textColor: AZUL.texto, valign: 'middle', minCellHeight: 11 },
    columnStyles: incluirPuntaje
      ? { 0: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 44 }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 34, halign: 'center' }, 4: { cellWidth: W - 142 }, 5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' } }
      : { 0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 48 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 36, halign: 'center' }, 4: { cellWidth: W - 132 } },
    body
  };
  y = tablaConCierre(doc, { opciones: opcionesTabla, orientacion: 'portrait', alturaCierre: altoCierre, encabezado: d => drawChromeEureka(d, chrome) }).y + 6;
  y = asegurarEspacio(doc, { y, alto: altoCierre - 6, orientacion: 'portrait', encabezado: d => drawChromeEureka(d, chrome) });
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(...AZUL.texto);
  doc.text(clasificacion, MARGEN.left, y, { maxWidth: W, align: 'justify', lineHeightFactor: 1.35 });
  y += clasificacion.length * 9.2 * 1.35 * PT + 10;

  dibujarFirmasJurado(doc, { y, bloques: bloquesFirmaDePanel(panel), orientacion: 'portrait' });
}

function nombreArchivoE20(acta) {
  const area = sanitizarNombreArchivo(getArea(acta.areaId)?.nombre || acta.areaId);
  return `AnexoE20_Acta_Cat${acta.categoria}_${area}.pdf`;
}

export function generarE20PDF(acta, { panel = null, banner = null, guardar = true } = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarUnicaActaE20(doc, { acta, panel, banner });
  aplicarPiePaginasEureka(doc, { preliminar: esPreliminar(panel) });
  if (guardar) doc.save(nombreArchivoE20(acta));
  return doc;
}

export async function generarE20CategoriaCompletaPDF(actas = [], { categoria, panelesMap = {}, banner = null, guardar = true } = {}) {
  if (!actas.length) throw new Error('No hay actas que compilar.');
  const ordenadas = [...actas].sort((a, b) => ordenArea(a.areaId) - ordenArea(b.areaId));
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  let algunPreliminar = false;
  for (let i = 0; i < ordenadas.length; i += 1) {
    const acta = ordenadas[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: acta.categoria, areaId: acta.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicaActaE20(doc, { acta, panel, banner, nuevaPagina: i > 0 });
    } catch (err) {
      console.warn(`Acta omitida (${acta.areaId}):`, err);
    }
    if (i % 10 === 9) await cederHilo();
  }
  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  if (guardar) doc.save(`AnexoE20_Actas_Categoria_${categoria || ordenadas[0].categoria}.pdf`);
  return ordenadas.length;
}
