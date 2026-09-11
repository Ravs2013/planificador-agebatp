/* ═══════════════════════════════════════════════════════════════
   CREA Y EMPRENDE 2026 — PDF DE LA FICHA DE EVALUACIÓN (ANEXOS D10, D11 Y D12)
   Reproduce las tablas oficiales. En D10 y D11 solo se llena la columna "Puntaje obtenido";
   en D12 se consigna el valor en la columna de valoración que corresponde. Los descriptores
   de las rúbricas se imprimen sin marcas. La firma se resuelve contra el Panel de Firmas.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4, anchoContenido, drawChromeCYE, medirChromeCYE, aplicarPiePaginasCYE, aplicarFuentesArial,
  drawBloqueFirmaCYE, cederHilo, limiteCuerpo, RGB_CYE
} from './membreteCreaEmprende';
import { CYE_CONFIG, getCategoriaCYE } from '../data/creaEmprendeConfig';
import { getInstrumentosCategoria, NIVELES_RUBRICA_CYE, ESCALA_D12 } from '../data/creaEmprendeRubricas';
import { calcularFicha, resumenGradoSeccion, formatearFechaCorta, sanitizarNombreArchivo } from '../utils/creaEmprendeHelpers';
import { firmanteDelCasillero, bloqueFirmaCYE, resolverPanelFirmasCYE, esPreliminarCYE } from '../utils/creaEmprendeFirmas';

const W = anchoContenido('portrait');

function nuevaPaginaSiFalta(doc, y, alto, chromeOpts) {
  if (y + alto <= limiteCuerpo('portrait')) return y;
  doc.addPage([A4.ancho, A4.alto], 'portrait');
  return drawChromeCYE(doc, chromeOpts);
}

function barraSeccion(doc, texto, y) {
  doc.setFillColor(...RGB_CYE.navy3);
  doc.rect(M.left, y, W, 6, 'F');
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...RGB_CYE.blanco);
  doc.text(doc.splitTextToSize(texto, W - 4)[0], M.left + 2, y + 4.1);
  return y + 7;
}

function identificacion(doc, ev, p, y) {
  const snap = ev.participanteSnapshot || {};
  const cat = getCategoriaCYE(ev.categoria);
  const et = { fontStyle: 'bold', fillColor: RGB_CYE.gris100, textColor: RGB_CYE.gris700 };
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.2, cellPadding: 1.5, overflow: 'linebreak', lineColor: RGB_CYE.gris300, textColor: RGB_CYE.gris800 },
    columnStyles: { 0: { cellWidth: 36 }, 1: { cellWidth: W / 2 - 36 }, 2: { cellWidth: 32 }, 3: { cellWidth: W / 2 - 32 } },
    body: [
      [{ content: 'CATEGORÍA', styles: et }, { content: cat ? `${cat.nombre} — ${cat.grados} (${cat.modalidad})` : ev.categoria, colSpan: 3 }],
      [{ content: 'ETAPA / DRE / UGEL', styles: et }, `${CYE_CONFIG.etapa} / ${CYE_CONFIG.dre} / ${CYE_CONFIG.ugel}`, { content: 'FECHA', styles: et }, formatearFechaCorta(ev.fecha || CYE_CONFIG.fechaEvaluacion)],
      [{ content: 'INSTITUCIÓN EDUCATIVA', styles: et }, { content: p?.institucion?.nombre || snap.institucionNombre || '', styles: { fontStyle: 'bold', textColor: RGB_CYE.navy2 } }, { content: 'CÓDIGO MODULAR', styles: et }, p?.institucion?.codigoModular || snap.codigoModular || ''],
      [{ content: 'TÍTULO DEL PROYECTO', styles: et }, { content: p?.tituloProyecto || snap.tituloProyecto || '', colSpan: 3, styles: { fontStyle: 'bold', textColor: RGB_CYE.navy2 } }],
      [{ content: 'GRADO Y SECCIÓN', styles: et }, resumenGradoSeccion(p?.integrantes) || snap.gradoSeccion || '', { content: 'N.° / GRUPO', styles: et }, `${p?.numero || snap.numero || '—'} / ${p?.grupo || snap.grupo || '—'}`],
      [{ content: 'DOCENTE ASESOR', styles: et }, { content: p?.docenteAsesor?.nombreCompleto || '—', colSpan: 3 }],
      [{ content: 'CASILLERO', styles: et }, `Jurado N.° ${ev.jurado?.numeroJurado || 1}`, { content: 'ESTADO DE LA FICHA', styles: et }, ev.estado === 'registrada' ? 'Registrada' : 'En borrador']
    ]
  });
  return doc.lastAutoTable.finalY + 3;
}

function tablaRubrica(doc, rubrica, puntajes = {}, y, chromeOpts, margenSuperior) {
  y = nuevaPaginaSiFalta(doc, y, 40, chromeOpts);
  y = barraSeccion(doc, `ANEXO ${rubrica.anexo} — ${rubrica.titulo.toUpperCase()}`, y);
  const anchoCriterio = 34;
  const anchoPuntaje = 16;
  const anchoNivel = (W - anchoCriterio - anchoPuntaje) / 4;
  let subtotal = 0;
  const body = rubrica.criterios.map(c => {
    const v = Number(puntajes[c.id]);
    if (v >= 1 && v <= 4) subtotal += v;
    return [
      { content: `${c.numero}. ${c.nombre}\n(${c.pregunta || c.alcance})`, styles: { fontStyle: 'bold', fillColor: RGB_CYE.gris50 } },
      c.niveles[1], c.niveles[2], c.niveles[3], c.niveles[4],
      { content: v >= 1 && v <= 4 ? String(v) : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10, textColor: RGB_CYE.navy2 } }
    ];
  });
  body.push([
    { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: RGB_CYE.gris100 } },
    { content: `${subtotal} / ${rubrica.maximo}`, styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB_CYE.gris100, fontSize: 7.6 } }
  ]);
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top: margenSuperior, bottom: M.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [['Criterios', ...NIVELES_RUBRICA_CYE.map(n => n.encabezado), 'Puntaje obtenido']],
    headStyles: { fillColor: RGB_CYE.navy2, textColor: RGB_CYE.blanco, fontStyle: 'bold', fontSize: 6.6, halign: 'center', valign: 'middle' },
    styles: { font: 'Arial', fontSize: 6.2, cellPadding: 1.2, overflow: 'linebreak', lineColor: RGB_CYE.gris300, textColor: RGB_CYE.gris800, valign: 'top' },
    columnStyles: { 0: { cellWidth: anchoCriterio }, 1: { cellWidth: anchoNivel }, 2: { cellWidth: anchoNivel }, 3: { cellWidth: anchoNivel }, 4: { cellWidth: anchoNivel }, 5: { cellWidth: anchoPuntaje } },
    rowPageBreak: 'avoid',
    body,
    didDrawPage: data => { if (data.pageNumber > 1) drawChromeCYE(doc, chromeOpts); }
  });
  return doc.lastAutoTable.finalY + 3;
}

function tablaEscala(doc, rubrica, puntajes = {}, y, chromeOpts, margenSuperior) {
  y = nuevaPaginaSiFalta(doc, y, 50, chromeOpts);
  y = barraSeccion(doc, `ANEXO D12 — ${rubrica.titulo.toUpperCase()}`, y);
  let subtotal = 0;
  const marca = { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 9, textColor: RGB_CYE.navy2 };
  const body = rubrica.criterios.map(c => {
    const v = Number(puntajes[c.id]);
    if (v >= 1 && v <= 4) subtotal += v;
    return [
      { content: `${c.numero}. ${c.nombre}`, styles: { fontStyle: 'bold', fillColor: RGB_CYE.gris50 } },
      c.pregunta, `- ${c.evidencia}`, c.tiempo,
      ...[4, 3, 2, 1].map(n => ({ content: v === n ? String(n) : '', styles: marca }))
    ];
  });
  body.push([
    { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: RGB_CYE.gris100 } },
    { content: `${subtotal} / ${rubrica.maximo}`, colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB_CYE.gris100 } }
  ]);
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top: margenSuperior, bottom: M.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [
      [{ content: 'Criterios', rowSpan: 2 }, { content: 'Pregunta orientadora', rowSpan: 2 }, { content: 'Evidencia', rowSpan: 2 }, { content: 'Tiempo sugerido', rowSpan: 2 }, { content: 'VALORACIÓN (*)', colSpan: 4 }],
      ['4', '3', '2', '1']
    ],
    headStyles: { fillColor: RGB_CYE.navy2, textColor: RGB_CYE.blanco, fontStyle: 'bold', fontSize: 6.8, halign: 'center', valign: 'middle' },
    styles: { font: 'Arial', fontSize: 6.6, cellPadding: 1.3, overflow: 'linebreak', lineColor: RGB_CYE.gris300, textColor: RGB_CYE.gris800, valign: 'top' },
    columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 38 }, 2: { cellWidth: 60 }, 3: { cellWidth: 18 }, 4: { cellWidth: 9 }, 5: { cellWidth: 9 }, 6: { cellWidth: 9 }, 7: { cellWidth: 9 } },
    rowPageBreak: 'avoid',
    body,
    didDrawPage: data => { if (data.pageNumber > 1) drawChromeCYE(doc, chromeOpts); }
  });
  let cursor = doc.lastAutoTable.finalY + 2.5;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...RGB_CYE.gris700);
  ESCALA_D12.forEach(e => {
    const lineas = doc.splitTextToSize(`(*) ${e.valor}: ${e.descripcion}`, W);
    doc.text(lineas, M.left, cursor);
    cursor += lineas.length * 2.7;
  });
  return cursor + 2;
}

function resumen(doc, calc, y) {
  const celda = (etiqueta, a) => ({ content: `${etiqueta}\n${a.subtotal} / ${a.maximo}`, styles: { fillColor: RGB_CYE.gris100 } });
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2, halign: 'center', fontStyle: 'bold', lineColor: RGB_CYE.gris300, textColor: RGB_CYE.navy2 },
    body: [[
      celda('D10 PROYECTO', calc.anexos.D10),
      celda('D11 PORTAFOLIO', calc.anexos.D11),
      celda('D12 EXPOFERIA', calc.anexos.D12),
      { content: `PUNTAJE TOTAL\n${calc.puntajeTotal} / ${calc.maximoTotal}`, styles: { fillColor: RGB_CYE.navy2, textColor: RGB_CYE.blanco, fontSize: 9 } }
    ]]
  });
  return doc.lastAutoTable.finalY + 3;
}

function observaciones(doc, ev, y) {
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...RGB_CYE.navy2);
  doc.text('OBSERVACIONES DEL JURADO CALIFICADOR:', M.left, y);
  const lineas = doc.splitTextToSize(ev.observacionesJurado || 'Sin observaciones.', W - 4);
  const alto = Math.min(26, Math.max(9, lineas.length * 3 + 3));
  doc.setDrawColor(...RGB_CYE.gris300);
  doc.setFillColor(250, 250, 250);
  doc.rect(M.left, y + 2, W, alto, 'FD');
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.9);
  doc.setTextColor(...RGB_CYE.gris700);
  doc.text(lineas.slice(0, 8), M.left + 2, y + 5.3);
  return y + alto + 5;
}

/** Dibuja una ficha completa en el documento recibido. */
export function dibujarFichaCYE(doc, { evaluacion, participante, panel = null, banner = null, nuevaPagina = false }) {
  const slot = Number(evaluacion.jurado?.numeroJurado) || 1;
  const cat = getCategoriaCYE(evaluacion.categoria);
  const chromeOpts = {
    orientacion: 'portrait',
    titulo: 'FICHA DE EVALUACIÓN DEL JURADO CALIFICADOR — ANEXOS D10, D11 Y D12',
    subtitulo: `Concurso Nacional Crea y Emprende 2026 · Etapa UGEL · ${cat ? cat.nombre : ''} · Jurado N.° ${slot}`,
    banner
  };
  if (nuevaPagina) doc.addPage([A4.ancho, A4.alto], 'portrait');
  let y = drawChromeCYE(doc, chromeOpts);
  const margenSuperior = medirChromeCYE(doc, chromeOpts);
  y = identificacion(doc, evaluacion, participante, y);

  const puntajes = evaluacion.puntajes || {};
  getInstrumentosCategoria(evaluacion.categoria).forEach(r => {
    y = r.tipo === 'escala'
      ? tablaEscala(doc, r, puntajes[r.anexo], y, chromeOpts, margenSuperior)
      : tablaRubrica(doc, r, puntajes[r.anexo], y, chromeOpts, margenSuperior);
  });

  const calc = calcularFicha(evaluacion.categoria, puntajes);
  // Resumen, observaciones y firma se mueven juntos: la firma nunca queda sola en una hoja.
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.9);
  const lineasObs = doc.splitTextToSize(evaluacion.observacionesJurado || 'Sin observaciones.', W - 4).length;
  const altoCierre = 16 + Math.min(26, Math.max(9, lineasObs * 3 + 3)) + 5 + 40;
  y = nuevaPaginaSiFalta(doc, y, altoCierre, chromeOpts);
  y = resumen(doc, calc, y);
  y = observaciones(doc, evaluacion, y);
  drawBloqueFirmaCYE(doc, {
    x: A4.ancho / 2 - 42, y: y + 2, ancho: 84,
    firmante: bloqueFirmaCYE(firmanteDelCasillero(panel, slot), slot),
    numeroJurado: slot, conInstitucion: true, conFecha: true,
    fecha: formatearFechaCorta(evaluacion.fecha || CYE_CONFIG.fechaEvaluacion)
  });
}

export function generarFichaCYEPDF(evaluacion, { participante = null, panel = null, banner = null, guardar = true } = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarFichaCYE(doc, { evaluacion, participante, panel, banner });
  aplicarPiePaginasCYE(doc, { preliminar: esPreliminarCYE(panel) });
  const slot = evaluacion.jurado?.numeroJurado || 1;
  const nombre = `Ficha_CYE2026_Cat${evaluacion.categoria}_N${participante?.numero || ''}_${sanitizarNombreArchivo(participante?.institucion?.nombre || '')}_J${slot}.pdf`;
  if (guardar) doc.save(nombre);
  return doc;
}

/** Todas las fichas de una categoría en un solo PDF. */
export async function generarFichasCYEPDF(evaluaciones = [], { categoria, participantes = [], panelesMap = {}, banner = null, onProgreso = null, guardar = true } = {}) {
  if (!evaluaciones.length) throw new Error('No hay fichas para descargar.');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  let algunPreliminar = false;
  for (let i = 0; i < evaluaciones.length; i += 1) {
    const ev = evaluaciones[i];
    const panel = resolverPanelFirmasCYE(panelesMap, { categoria: ev.categoria });
    if (esPreliminarCYE(panel)) algunPreliminar = true;
    try {
      dibujarFichaCYE(doc, { evaluacion: ev, participante: participantes.find(p => p.id === ev.participanteId), panel, banner, nuevaPagina: i > 0 });
    } catch (err) {
      console.warn(`Ficha omitida (${ev.id}):`, err);
    }
    if (onProgreso) onProgreso(i + 1, evaluaciones.length);
    if (i % 20 === 19) await cederHilo();
  }
  aplicarPiePaginasCYE(doc, { preliminar: algunPreliminar });
  if (guardar) doc.save(`Fichas_CYE2026_Categoria${categoria || evaluaciones[0].categoria}.pdf`);
  return doc;
}
