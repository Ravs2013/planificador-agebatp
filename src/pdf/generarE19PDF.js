/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — ANEXO E19 — FORMATO CONSOLIDADO DE EVALUACIÓN
   A4 apaisado, con el diseño del Anexo A10 de Juegos Florales. Las columnas de jurado se
   generan desde SLOTS_JURADO y el bloque de firmas nunca queda solo en una hoja.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  A4_APAISADO, anchoContenido, drawChromeEureka, medirChromeEureka, aplicarPiePaginasEureka, aplicarFuentesArial, cederHilo
} from './membreteEureka';
import { AZUL, MARGEN, tablaConCierre, dibujarFirmasJurado, alturaFirmasJurado } from './pdfDiseno';
import { TEXTOS_LEGALES } from '../data/eurekaCatalogos';
import { EUREKA_CONFIG, SLOTS_JURADO, getArea, getCategoria } from '../data/eurekaConfigUGEL03';
import { bloquesFirmaDePanel, esPreliminar, resolverPanelFirmas } from '../utils/eurekaFirmas';
import { sanitizarNombreArchivo, ordenArea } from '../utils/eurekaHelpers';

const O = 'landscape';
const W = anchoContenido(O);
const PT = 0.3528;

function fechaCorta(iso) {
  const [a, m, d] = String(iso || '').slice(0, 10).split('-');
  return d ? `${d}/${m}/${a}` : String(iso || '');
}

export function dibujarUnicoE19(doc, { consolidado, panel = null, banner = null, nuevaPagina = false }) {
  const cat = getCategoria(consolidado.categoria);
  const area = getArea(consolidado.areaId);
  const chrome = {
    orientacion: O,
    titulo: 'ANEXO E19 — FORMATO CONSOLIDADO DE EVALUACIÓN',
    subtitulo: `${EUREKA_CONFIG.edicion} ${EUREKA_CONFIG.anio}`,
    banner
  };
  if (nuevaPagina) doc.addPage([A4_APAISADO.ancho, A4_APAISADO.alto], 'landscape');
  let y = drawChromeEureka(doc, chrome);
  const top = medirChromeEureka(doc, chrome);

  const etapa = consolidado.etapa || EUREKA_CONFIG.etapa;
  const marca = v => (etapa === v ? 'X' : '  ');
  autoTable(doc, {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right },
    tableWidth: W,
    theme: 'plain',
    styles: { font: 'Arial', fontSize: 8.6, cellPadding: { top: 0.9, bottom: 0.9, left: 0, right: 3 }, textColor: AZUL.texto },
    columnStyles: { 0: { cellWidth: W * 0.44 }, 1: { cellWidth: W * 0.34 }, 2: { cellWidth: W * 0.22 } },
    body: [
      [`Categoría: ${cat ? `${cat.nombre} — ${cat.grados}` : consolidado.categoria}`, `Área de participación: ${area?.nombre || consolidado.areaId}`, `Fecha: ${fechaCorta(consolidado.fecha || EUREKA_CONFIG.fechaEvaluacion)}`],
      [`Etapa: IE (${marca('IE')})   UGEL (${marca('UGEL')})   DRE (${marca('DRE')})   NACIONAL (${marca('NACIONAL')})`, `DRE/GRE: ${consolidado.dre || EUREKA_CONFIG.dre}`, `UGEL: ${consolidado.ugel || EUREKA_CONFIG.ugel}`]
    ]
  });
  y = doc.lastAutoTable.finalY + 3;

  const slots = SLOTS_JURADO;
  const filas = consolidado.filas || [];
  const idxPuesto = 5 + slots.length;
  const body = filas.map((f, i) => {
    let marcaFila = '';
    if (f.noSePresento || f.incomparecencia) marcaFila = ' (no se presentó)';
    else if (f.noProsigue) marcaFila = ' (no prosigue)';
    return [
      String(f.ordenPresentacion || i + 1),
      `${f.tituloProyecto || 'Sin título registrado'}${marcaFila}`,
      f.institucion || '—',
      ...slots.map(s => (f[`jurado${s}`] != null ? String(f[`jurado${s}`]) : '—')),
      f.completo && f.suma != null ? String(f.suma) : '—',
      f.promedio != null ? Number(f.promedio).toFixed(EUREKA_CONFIG.decimalesPromedio) : '—',
      f.puesto ? `${f.puesto}.°` : '—'
    ];
  });
  const anchoFijo = 11 + 58 + slots.length * 19 + 22 + 20 + 16;
  const columnStyles = { 0: { cellWidth: 11, halign: 'center' }, 1: { cellWidth: W - anchoFijo }, 2: { cellWidth: 58 } };
  slots.forEach((_, i) => { columnStyles[3 + i] = { cellWidth: 19, halign: 'center' }; });
  columnStyles[3 + slots.length] = { cellWidth: 22, halign: 'center', fontStyle: 'bold' };
  columnStyles[4 + slots.length] = { cellWidth: 20, halign: 'center', fontStyle: 'bold' };
  columnStyles[5 + slots.length] = { cellWidth: 16, halign: 'center', fontStyle: 'bold' };

  const opciones = {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right, top, bottom: MARGEN.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [['N.°', 'Título del proyecto', 'I. E.', ...slots.map(s => `Jurado ${s}`), 'Puntaje total', 'Promedio', 'Puesto']],
    headStyles: { fillColor: AZUL.navy3, textColor: AZUL.blanco, fontStyle: 'bold', fontSize: 8, halign: 'center', valign: 'middle' },
    styles: { font: 'Arial', fontSize: 7.8, cellPadding: 1.9, overflow: 'linebreak', lineColor: AZUL.borde, lineWidth: 0.2, textColor: AZUL.texto, valign: 'middle' },
    columnStyles,
    rowPageBreak: 'avoid',
    body,
    didParseCell: dato => {
      if (dato.section !== 'body') return;
      const puesto = dato.row.raw[idxPuesto];
      if (puesto === '1.°' || puesto === '2.°' || puesto === '3.°') dato.cell.styles.fillColor = AZUL.fondo;
    },
    didDrawPage: dato => { if (dato.pageNumber > 1) drawChromeEureka(doc, chrome); }
  };

  doc.setFont('Arial', 'italic');
  doc.setFontSize(8);
  const declaracion = doc.splitTextToSize(TEXTOS_LEGALES.declaracionEticaE19, W);
  doc.setFontSize(7.6);
  const dirimencias = (consolidado.dirimencias || []).slice(0, 3).map(d => doc.splitTextToSize(`Dirimencia del jurado calificador: ${d.motivo}`, W));
  const altoDirimencias = dirimencias.reduce((s, l) => s + l.length * 7.6 * 1.2 * PT, 0) + (dirimencias.length ? 2 : 0);
  const altoCierre = 6 + altoDirimencias + declaracion.length * 8 * 1.25 * PT + 6 + alturaFirmasJurado(slots.length);

  y = tablaConCierre(doc, { opciones, orientacion: O, alturaCierre: altoCierre, encabezado: d => drawChromeEureka(d, chrome) }).y + 5;

  if (dirimencias.length) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7.6);
    doc.setTextColor(...AZUL.ambar);
    dirimencias.forEach(l => { doc.text(l, MARGEN.left, y, { lineHeightFactor: 1.2 }); y += l.length * 7.6 * 1.2 * PT; });
    y += 2;
  }
  doc.setFont('Arial', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...AZUL.gris700);
  doc.text(declaracion, MARGEN.left, y, { maxWidth: W, lineHeightFactor: 1.25 });
  y += declaracion.length * 8 * 1.25 * PT + 6;

  dibujarFirmasJurado(doc, { y, bloques: bloquesFirmaDePanel(panel), orientacion: O });
}

function nombreArchivoE19(consolidado) {
  const area = sanitizarNombreArchivo(getArea(consolidado.areaId)?.nombre || consolidado.areaId);
  return `AnexoE19_Consolidado_Cat${consolidado.categoria}_${area}.pdf`;
}

export function generarE19PDF(consolidado, { panel = null, banner = null, guardar = true } = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarUnicoE19(doc, { consolidado, panel, banner });
  aplicarPiePaginasEureka(doc, { preliminar: esPreliminar(panel) });
  if (guardar) doc.save(nombreArchivoE19(consolidado));
  return doc;
}

export async function generarE19CategoriaCompletaPDF(consolidados = [], { categoria, panelesMap = {}, banner = null, guardar = true } = {}) {
  if (!consolidados.length) throw new Error('No hay consolidados que compilar.');
  const ordenados = [...consolidados].sort((a, b) => ordenArea(a.areaId) - ordenArea(b.areaId));
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  let algunPreliminar = false;
  for (let i = 0; i < ordenados.length; i += 1) {
    const cons = ordenados[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: cons.categoria, areaId: cons.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicoE19(doc, { consolidado: cons, panel, banner, nuevaPagina: i > 0 });
    } catch (err) {
      console.warn(`Consolidado omitido (${cons.areaId}):`, err);
    }
    if (i % 10 === 9) await cederHilo();
  }
  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  if (guardar) doc.save(`AnexoE19_Consolidados_Categoria_${categoria || ordenados[0].categoria}.pdf`);
  return ordenados.length;
}
