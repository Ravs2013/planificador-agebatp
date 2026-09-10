/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — ANEXO E19 — FORMATO CONSOLIDADO DE EVALUACIÓN
   A4 apaisado (297 x 210 mm). Equivalente del Anexo A10 de Juegos Florales.

   Las columnas de jurado se generan iterando EUREKA_CONFIG.numeroJuradosPorFicha.
   Nunca se escriben a mano: si MINEDU exige pasar a 4 firmantes debe bastar con cambiar
   ese número.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4_APAISADO, anchoContenido, drawChromeEureka, aplicarPiePaginasEureka,
  aplicarFuentesArial, drawFilaFirmas, limiteCuerpo, cederHilo
} from './membreteEureka';
import { RGB, TEXTOS_LEGALES } from '../data/eurekaCatalogos';
import { EUREKA_CONFIG, SLOTS_JURADO, getArea, getCategoria } from '../data/eurekaConfigUGEL03';
import { bloquesFirmaDePanel, esPreliminar, resolverPanelFirmas } from '../utils/eurekaFirmas';
import { sanitizarNombreArchivo, ordenArea } from '../utils/eurekaHelpers';

const CONTENT_W = anchoContenido('landscape');

function encabezadoE19(doc, consolidado, y) {
  const cat = getCategoria(consolidado.categoria);
  const area = getArea(consolidado.areaId);
  const etapa = consolidado.etapa || EUREKA_CONFIG.etapa;
  const marca = valor => (etapa === valor ? 'X' : ' ');

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 1.8, lineColor: RGB.gris300 },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold', fillColor: RGB.gris100 },
      1: { cellWidth: CONTENT_W / 2 - 26 },
      2: { cellWidth: 34, fontStyle: 'bold', fillColor: RGB.gris100 },
      3: { cellWidth: CONTENT_W / 2 - 34 }
    },
    body: [
      [
        'Categoría:', cat ? `${cat.nombre} — ${cat.grados}` : consolidado.categoria,
        'Área de Participación:', area ? area.nombre : consolidado.areaId
      ],
      [
        'Etapa:',
        `IE (${marca('IE')})   UGEL (${marca('UGEL')})   DRE (${marca('DRE')})   NACIONAL (${marca('NACIONAL')})`,
        'Fecha:', consolidado.fecha || EUREKA_CONFIG.fechaEvaluacion
      ],
      [
        'DRE/GRE:', consolidado.dre || EUREKA_CONFIG.dre,
        'UGEL:', consolidado.ugel || EUREKA_CONFIG.ugel
      ]
    ]
  });

  return doc.lastAutoTable.finalY + 3;
}

function tablaE19(doc, consolidado, y, chromeOpts) {
  const slots = SLOTS_JURADO;

  const head = [[
    'N.°', 'Título del proyecto', 'I. E.',
    ...slots.map(s => `Jurado ${s}`),
    'Puntaje total', 'Promedio', 'Puesto'
  ]];

  const filas = consolidado.filas || [];
  const body = filas.map((f, idx) => {
    const notas = slots.map(s => {
      const v = f[`jurado${s}`];
      return v != null ? String(v) : '—';
    });
    let marca = '';
    if (f.noSePresento || f.incomparecencia) marca = ' (NSP)';
    else if (f.noProsigue) marca = ' (No prosigue)';

    return [
      String(f.ordenPresentacion || idx + 1),
      (f.tituloProyecto || 'Sin título registrado') + marca,
      f.institucion || '—',
      ...notas,
      f.completo && f.suma != null ? String(f.suma) : '—',
      f.promedio != null ? f.promedio.toFixed(EUREKA_CONFIG.decimalesPromedio) : '—',
      f.puesto ? `${f.puesto}.°` : '—'
    ];
  });

  // Ancho reservado por las columnas de medida fija. El título toma el resto.
  const anchoFijo = 12 + 46 + slots.length * 20 + 24 + 22 + 18;
  const columnStyles = {
    0: { cellWidth: 12, halign: 'center' },
    1: { cellWidth: Math.max(40, CONTENT_W - anchoFijo) },
    2: { cellWidth: 46 }
  };
  slots.forEach((_, i) => { columnStyles[3 + i] = { cellWidth: 20, halign: 'center' }; });
  columnStyles[3 + slots.length] = { cellWidth: 24, halign: 'center', fontStyle: 'bold' };
  columnStyles[4 + slots.length] = { cellWidth: 22, halign: 'center', fontStyle: 'bold' };
  columnStyles[5 + slots.length] = { cellWidth: 18, halign: 'center', fontStyle: 'bold' };

  const idxPuesto = 5 + slots.length;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top: M.top + 24, bottom: M.bottom + 6 },
    tableWidth: CONTENT_W,
    theme: 'grid',
    head,
    headStyles: {
      fillColor: RGB.verdeEureka, textColor: RGB.blanco, fontStyle: 'bold',
      fontSize: 7.5, halign: 'center'
    },
    styles: { font: 'Arial', fontSize: 7.2, cellPadding: 1.6, overflow: 'linebreak', lineColor: RGB.gris300 },
    columnStyles,
    body,
    didParseCell: data => {
      if (data.section !== 'body') return;
      const puesto = data.row.raw[idxPuesto];
      if (puesto === '1.°' || puesto === '2.°' || puesto === '3.°') {
        data.cell.styles.fillColor = RGB.verdeFondo;
      }
    },
    didDrawPage: data => {
      if (data.pageNumber > 1) drawChromeEureka(doc, chromeOpts);
    }
  });

  return doc.lastAutoTable.finalY + 4;
}

/**
 * Dibuja un consolidado E19 completo. `panel` es el Panel de Firmas ya resuelto.
 */
export function dibujarUnicoE19(doc, { consolidado, panel = null, banner = null, nuevaPagina = false }) {
  const cat = getCategoria(consolidado.categoria);
  const area = getArea(consolidado.areaId);

  const chromeOpts = {
    orientacion: 'landscape',
    titulo: 'ANEXO E19 — FORMATO CONSOLIDADO DE EVALUACIÓN',
    subtitulo: `${EUREKA_CONFIG.edicion} ${EUREKA_CONFIG.anio} · Etapa ${EUREKA_CONFIG.etapa} · ${cat ? cat.nombre : consolidado.categoria} · ${area ? area.nombre : consolidado.areaId}`,
    banner
  };

  if (nuevaPagina) doc.addPage([A4_APAISADO.ancho, A4_APAISADO.alto], 'landscape');

  let y = drawChromeEureka(doc, chromeOpts);
  y = encabezadoE19(doc, consolidado, y);
  y = tablaE19(doc, consolidado, y, chromeOpts);

  // Sustento de dirimencia colegiada, si el jurado resolvió algún empate.
  const dirimencias = consolidado.dirimencias || [];
  if (dirimencias.length > 0) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...RGB.alerta);
    dirimencias.slice(0, 3).forEach(d => {
      const linea = doc.splitTextToSize(`Dirimencia del jurado calificador: ${d.motivo}`, CONTENT_W);
      doc.text(linea, M.left, y);
      y += linea.length * 3;
    });
    y += 2;
  }

  // Declaración ética, texto literal del anexo, antes de las firmas.
  const alturaFirmas = 44;
  if (y > limiteCuerpo('landscape') - alturaFirmas - 14) {
    doc.addPage([A4_APAISADO.ancho, A4_APAISADO.alto], 'landscape');
    y = drawChromeEureka(doc, chromeOpts);
  }

  doc.setFont('Arial', 'italic');
  doc.setFontSize(7.6);
  doc.setTextColor(...RGB.gris700);
  const declaracion = doc.splitTextToSize(TEXTOS_LEGALES.declaracionEticaE19, CONTENT_W);
  doc.text(declaracion, M.left, y, { maxWidth: CONTENT_W, align: 'justify' });
  y += declaracion.length * 3.4 + 4;

  drawFilaFirmas(doc, {
    bloques: bloquesFirmaDePanel(panel),
    y,
    orientacion: 'landscape',
    conInstitucion: true
  });
}

function nombreArchivoE19(consolidado) {
  const area = sanitizarNombreArchivo(getArea(consolidado.areaId)?.nombre || consolidado.areaId);
  return `AnexoE19_Consolidado_Cat${consolidado.categoria}_${area}.pdf`;
}

/** Un solo consolidado. */
export function generarE19PDF(consolidado, { panel = null, banner = null } = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarUnicoE19(doc, { consolidado, panel, banner });
  aplicarPiePaginasEureka(doc, { preliminar: esPreliminar(panel) });
  doc.save(nombreArchivoE19(consolidado));
}

/** Nivel 3 — todos los consolidados E19 de una categoría. */
export async function generarE19CategoriaCompletaPDF(consolidados = [], {
  categoria, panelesMap = {}, banner = null
} = {}) {
  if (!consolidados.length) throw new Error('No hay consolidados que compilar.');

  const ordenados = [...consolidados].sort((a, b) => ordenArea(a.areaId) - ordenArea(b.areaId));
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let algunPreliminar = false;
  for (let i = 0; i < ordenados.length; i++) {
    const cons = ordenados[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: cons.categoria, areaId: cons.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicoE19(doc, { consolidado: cons, panel, banner, nuevaPagina: i > 0 });
    } catch (err) {
      console.warn(`Consolidado omitido (${cons.id}):`, err);
    }
    if (i % 10 === 9) await cederHilo();
  }

  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  doc.save(`AnexoE19_Consolidados_Categoria_${categoria || ordenados[0].categoria}.pdf`);
  return ordenados.length;
}
