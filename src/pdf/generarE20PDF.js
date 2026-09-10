/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — ANEXO E20 — ACTA DE RESULTADOS
   A4 vertical. Equivalente del Anexo A11 de Juegos Florales.

   El párrafo de cierre es CONDICIONAL según la categoría:
     A, B y C  → la participación finaliza en la etapa UGEL (tres primeros puestos).
     D y E     → el 1.er puesto clasifica a la etapa DRE.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4, anchoContenido, drawChromeEureka, aplicarPiePaginasEureka,
  aplicarFuentesArial, drawFilaFirmas, limiteCuerpo, cederHilo
} from './membreteEureka';
import { RGB, TEXTOS_LEGALES } from '../data/eurekaCatalogos';
import { EUREKA_CONFIG, getArea, getCategoria } from '../data/eurekaConfigUGEL03';
import { bloquesFirmaDePanel, firmantesOrdenados, esPreliminar, resolverPanelFirmas } from '../utils/eurekaFirmas';
import { formatearFechaLarga, sanitizarNombreArchivo, ordenArea } from '../utils/eurekaHelpers';

const CONTENT_W = anchoContenido('portrait');

/** Texto legal literal del Anexo E20, con los marcadores sustituidos. */
export function construirTextoActa(acta) {
  const { dia, mes, anio } = formatearFechaLarga(acta.fecha || EUREKA_CONFIG.fechaEvaluacion);
  const area = getArea(acta.areaId);
  return `En la región de ${acta.region || EUREKA_CONFIG.region}, provincia de ${acta.provincia || EUREKA_CONFIG.provincia}, `
    + `distrito de ${acta.distrito || EUREKA_CONFIG.distrito} con fecha ${dia} de ${mes} de ${anio}, `
    + `a horas ${acta.hora || EUREKA_CONFIG.horaActa}, durante el proceso de evaluación de la Feria Escolar Nacional `
    + `de Ciencia y Tecnología – EUREKA ${anio} de la etapa ${acta.etapa || EUREKA_CONFIG.etapa}, `
    + `de la categoría ${acta.categoria}, del área de ${area ? area.nombre : acta.areaId}, el jurado calificador, `
    + `conformado por las siguientes personalidades:`;
}

/** Párrafo condicional de clasificación, derivado de finalizaEnUGEL. */
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
  const cat = getCategoria(acta.categoria);
  const area = getArea(acta.areaId);

  const chromeOpts = {
    orientacion: 'portrait',
    titulo: 'ANEXO E20 — ACTA DE RESULTADOS',
    subtitulo: `${EUREKA_CONFIG.edicion} ${EUREKA_CONFIG.anio} · Etapa ${EUREKA_CONFIG.etapa} · ${cat ? cat.nombre : acta.categoria} · ${area ? area.nombre : acta.areaId}`,
    banner
  };

  if (nuevaPagina) doc.addPage([A4.ancho, A4.alto], 'portrait');

  let y = drawChromeEureka(doc, chromeOpts);

  // 1. Texto legal.
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(...RGB.gris700);
  const parrafo = doc.splitTextToSize(construirTextoActa(acta), CONTENT_W);
  doc.text(parrafo, M.left, y, { maxWidth: CONTENT_W, align: 'justify', lineHeightFactor: 1.35 });
  y += parrafo.length * 4.6 + 4;

  // 2. Los tres jurados designados, resueltos desde el panel.
  const firmantes = firmantesOrdenados(panel);
  doc.setFont('Arial', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(...RGB.navy2);
  firmantes.forEach((f, i) => {
    const nombre = f && f.nombreCompleto
      ? f.nombreCompleto.toUpperCase()
      : '________________________________________';
    const dni = f && f.dni ? `  (DNI ${f.dni})` : '';
    const presidente = f && f.presidente ? '  — Presidente del jurado' : '';
    doc.text(`${i + 1}. ${nombre}${dni}${presidente}`, M.left + 6, y);
    y += 5;
  });
  y += 2;

  // 3. Frase de transición literal.
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(...RGB.gris700);
  const transicion = doc.splitTextToSize(TEXTOS_LEGALES.transicionActaE20, CONTENT_W);
  doc.text(transicion, M.left, y);
  y += transicion.length * 4.4 + 3;

  // 4. Tabla oficial de resultados.
  const incluirPuntaje = Boolean(acta.incluirPuntaje);
  const head = ['Orden de mérito', 'I. E.', 'UGEL', 'DRE/GRE', 'Nombre del proyecto'];
  if (incluirPuntaje) head.push('Puntaje total');

  const body = (acta.resultados || []).map(r => {
    const fila = [
      r.ordenMerito || '',
      r.institucion || '—',
      r.ugel || EUREKA_CONFIG.ugel,
      r.dre || EUREKA_CONFIG.dre,
      r.nombreProyecto || 'Sin título registrado'
    ];
    if (incluirPuntaje) fila.push(r.puntajeTotal != null ? String(r.puntajeTotal) : '—');
    return fila;
  });

  const columnStyles = incluirPuntaje
    ? {
      0: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 34, halign: 'center' },
      4: { cellWidth: CONTENT_W - 140 },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    }
    : {
      0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 46 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: CONTENT_W - 130 }
    };

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top: M.top + 24, bottom: M.bottom + 6 },
    tableWidth: CONTENT_W,
    theme: 'grid',
    head: [head],
    headStyles: { fillColor: RGB.verdeEureka, textColor: RGB.blanco, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2.2, overflow: 'linebreak', lineColor: RGB.gris300 },
    columnStyles,
    body,
    didDrawPage: data => {
      if (data.pageNumber > 1) drawChromeEureka(doc, chromeOpts);
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  // 5. Párrafo condicional de clasificación.
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...RGB.gris700);
  const clasif = doc.splitTextToSize(construirParrafoClasificacion(acta), CONTENT_W);
  doc.text(clasif, M.left, y, { maxWidth: CONTENT_W, align: 'justify', lineHeightFactor: 1.3 });
  y += clasif.length * 4.4 + 6;

  // 6. Bloque de tres firmas.
  const alturaFirmas = 46;
  if (y > limiteCuerpo('portrait') - alturaFirmas) {
    doc.addPage([A4.ancho, A4.alto], 'portrait');
    y = drawChromeEureka(doc, chromeOpts);
  }

  drawFilaFirmas(doc, {
    bloques: bloquesFirmaDePanel(panel),
    y,
    orientacion: 'portrait',
    conInstitucion: false
  });
}

function nombreArchivoE20(acta) {
  const area = sanitizarNombreArchivo(getArea(acta.areaId)?.nombre || acta.areaId);
  return `AnexoE20_Acta_Cat${acta.categoria}_${area}.pdf`;
}

export function generarE20PDF(acta, { panel = null, banner = null } = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarUnicaActaE20(doc, { acta, panel, banner });
  aplicarPiePaginasEureka(doc, { preliminar: esPreliminar(panel) });
  doc.save(nombreArchivoE20(acta));
}

/** Nivel 4 — todas las actas E20 de una categoría. */
export async function generarE20CategoriaCompletaPDF(actas = [], { categoria, panelesMap = {}, banner = null } = {}) {
  if (!actas.length) throw new Error('No hay actas que compilar.');

  const ordenadas = [...actas].sort((a, b) => ordenArea(a.areaId) - ordenArea(b.areaId));
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let algunPreliminar = false;
  for (let i = 0; i < ordenadas.length; i++) {
    const acta = ordenadas[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: acta.categoria, areaId: acta.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicaActaE20(doc, { acta, panel, banner, nuevaPagina: i > 0 });
    } catch (err) {
      console.warn(`Acta omitida (${acta.id}):`, err);
    }
    if (i % 10 === 9) await cederHilo();
  }

  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  doc.save(`AnexoE20_Actas_Categoria_${categoria || ordenadas[0].categoria}.pdf`);
  return ordenadas.length;
}
