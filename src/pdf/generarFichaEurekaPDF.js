/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — PDF DE LAS FICHAS DE EVALUACIÓN (ANEXOS E11 A E18)
   A4 vertical, paleta azul. La firma se resuelve contra el Panel de Firmas Oficial; sin panel
   sellado la ficha sale con líneas en blanco y la marca de documento preliminar.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  A4, anchoContenido, drawChromeEureka, medirChromeEureka, aplicarPiePaginasEureka, aplicarFuentesArial, cederHilo
} from './membreteEureka';
import { AZUL, MARGEN, limiteInferior, tablaConCierre, asegurarEspacio, dibujarFirmaFicha, ALTO_FIRMA_FICHA } from './pdfDiseno';
import { getRubricaEureka, getItemsRubrica } from '../data/eurekaRubricas';
import { EUREKA_CONFIG, getArea, getCategoria } from '../data/eurekaConfigUGEL03';
import { resolverFirmanteDeFicha, bloqueFirmaDe, resolverPanelFirmas, esPreliminar } from '../utils/eurekaFirmas';
import {
  sumaPenalizaciones, sanitizarNombreArchivo, ordenarEvaluacionesParaCompilacion, nombresEstudiantes, rubricaDeEvaluacion
} from '../utils/eurekaHelpers';

const W = anchoContenido('portrait');
const PT = 0.3528;

const valor = v => (v === undefined || v === null || String(v).trim() === '' ? '—' : String(v));

function fechaCorta(iso) {
  const [a, m, d] = String(iso || '').slice(0, 10).split('-');
  return d ? `${d}/${m}/${a}` : valor(iso);
}

const TIPO_CS = { historico: 'Problema histórico', ambiental_territorial: 'Problema ambiental o territorial', economico: 'Problema o desafío económico' };

function encabezado(ev, r, banner) {
  const cat = getCategoria(ev.categoria);
  const area = getArea(ev.areaId);
  return {
    orientacion: 'portrait',
    titulo: `ANEXO ${r.id} — ${String(r.titulo || '').toUpperCase()}`,
    subtitulo: [cat ? `${cat.nombre}: ${cat.grados.toLowerCase()}` : `Categoría ${ev.categoria}`, area?.nombre, `Jurado N.° ${ev.jurado?.numeroJurado || 1}`]
      .filter(Boolean).join('  ·  '),
    banner
  };
}

function tablaIdentificacion(doc, ev, r, y) {
  const snap = ev.participanteSnapshot || {};
  const inst = snap.institucion || {};
  const cat = getCategoria(ev.categoria);
  const area = getArea(ev.areaId);
  const et = { fontStyle: 'bold', fillColor: AZUL.fondo, textColor: AZUL.gris700 };
  let tipo = null;
  if (r.id === 'E15') tipo = ev.varianteRubrica === 'B' ? 'Indagación científica descriptiva' : 'Indagación científica experimental';
  if ((r.id === 'E17' || r.id === 'E18') && TIPO_CS[ev.lineaId]) tipo = TIPO_CS[ev.lineaId];
  const estudiantes = nombresEstudiantes(snap) || (snap.gradoSeccion ? `Grado y sección: ${snap.gradoSeccion}` : '');

  autoTable(doc, {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right },
    tableWidth: W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.6, cellPadding: { top: 1.7, bottom: 1.7, left: 2, right: 2 }, overflow: 'linebreak', lineColor: AZUL.borde, lineWidth: 0.2, textColor: AZUL.texto, valign: 'middle' },
    columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: W / 2 - 34 }, 2: { cellWidth: 33 }, 3: { cellWidth: W / 2 - 33 } },
    body: [
      [{ content: 'Categoría', styles: et }, valor(cat ? `${cat.nombre} — ${cat.grados}` : ev.categoria), { content: 'Área de participación', styles: et }, valor(area?.nombre)],
      [{ content: 'Etapa / DRE / UGEL', styles: et }, `${ev.etapa || EUREKA_CONFIG.etapa} / ${inst.dre || EUREKA_CONFIG.dre} / ${inst.ugel || EUREKA_CONFIG.ugel}`, { content: 'Fecha', styles: et }, fechaCorta(ev.fecha || EUREKA_CONFIG.fechaEvaluacion)],
      [{ content: 'Institución educativa', styles: et }, { content: valor(inst.nombre || snap.institucionNombre), styles: { fontStyle: 'bold', textColor: AZUL.navy2 } }, { content: 'Código modular', styles: et }, valor(inst.codigoModular)],
      [{ content: 'Título del proyecto', styles: et }, { content: valor(snap.tituloProyecto), colSpan: 3, styles: { fontStyle: 'bold', textColor: AZUL.navy2 } }],
      [{ content: 'Estudiante(s)', styles: et }, { content: valor(estudiantes), colSpan: 3 }],
      [{ content: 'Docente asesor', styles: et }, valor(snap.docenteAsesor?.nombreCompleto), { content: 'Especialidad', styles: et }, valor(snap.docenteAsesor?.especialidad)],
      [{ content: 'Código SICE', styles: et }, valor(snap.codigoParticipante), { content: tipo ? 'Tipo' : 'Orden de presentación', styles: et }, valor(tipo || snap.ordenPresentacion || '')]
    ]
  });
  return doc.lastAutoTable.finalY + 4;
}

function avisoRojo(doc, texto, y) {
  doc.setFillColor(...AZUL.rojoFondo);
  doc.setDrawColor(...AZUL.rojo);
  doc.setLineWidth(0.3);
  doc.rect(MARGEN.left, y, W, 8, 'FD');
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(...AZUL.rojo);
  doc.text(texto, A4.ancho / 2, y + 5.2, { align: 'center' });
  return y + 11;
}

function tablaGate(doc, ev, r, y) {
  if (!r.gate?.requerido) return y;
  const resp = ev.planificacionCurricular;
  autoTable(doc, {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right },
    tableWidth: W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.8, cellPadding: 2.2, overflow: 'linebreak', lineColor: AZUL.borde, lineWidth: 0.2, textColor: AZUL.texto, valign: 'middle' },
    columnStyles: { 0: { cellWidth: W - 42 }, 1: { cellWidth: 42, halign: 'center', fontStyle: 'bold', textColor: AZUL.navy2 } },
    body: [[
      `1.- ${r.gate.pregunta}. ${r.gate.textoPositivo} ${r.gate.textoNegativo}`,
      `SÍ (${resp === true ? 'X' : '  '})      NO (${resp === false ? 'X' : '  '})`
    ]]
  });
  let cursor = doc.lastAutoTable.finalY + 3;
  if (resp === false) cursor = avisoRojo(doc, 'NO PROSIGUE: concluye su participación conforme a la pregunta 1 del anexo.', cursor);
  return cursor;
}

function opcionesSimple(doc, ev, r, y, chrome, top) {
  const escala = r.escala;
  const anchoCriterio = 34;
  const anchoPuntaje = 13;
  const anchoNivel = (W - anchoCriterio - anchoPuntaje) / escala.length;
  const puntajes = ev.puntajes || {};
  const columnStyles = { 0: { cellWidth: anchoCriterio } };
  escala.forEach((_, i) => { columnStyles[i + 1] = { cellWidth: anchoNivel }; });
  columnStyles[escala.length + 1] = { cellWidth: anchoPuntaje };
  return {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right, top, bottom: MARGEN.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [['Criterio', ...escala.map(String), 'Ptje.']],
    headStyles: { fillColor: AZUL.navy3, textColor: AZUL.blanco, fontStyle: 'bold', fontSize: 8, halign: 'center', valign: 'middle' },
    styles: { font: 'Arial', fontSize: 6.9, cellPadding: 1.7, overflow: 'linebreak', lineColor: AZUL.borde, lineWidth: 0.2, textColor: AZUL.texto, valign: 'top' },
    columnStyles,
    rowPageBreak: 'avoid',
    body: r.criterios.map(c => {
      const elegido = Number(puntajes[c.id]);
      return [
        { content: `${c.nombre}${c.nota ? ' *' : ''}`, styles: { fontStyle: 'bold', fillColor: AZUL.fondo, textColor: AZUL.navy2 } },
        ...escala.map(n => ({
          content: c.descriptores[n] || '',
          styles: elegido === n ? { fillColor: AZUL.claro, fontStyle: 'bold', textColor: AZUL.navy2 } : {}
        })),
        { content: elegido ? String(elegido) : '—', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10, textColor: AZUL.navy2 } }
      ];
    }),
    didDrawPage: data => { if (data.pageNumber > 1) drawChromeEureka(doc, chrome); }
  };
}

function opcionesPonderada(doc, ev, r, y, chrome, top) {
  const items = getItemsRubrica(r, ev.varianteRubrica || 'A');
  const puntajes = ev.puntajes || {};
  const total = items.reduce((s, a) => s + (Number(puntajes[a.id]) || 0) * a.ponderacion, 0);
  const body = items.map(a => {
    const calif = Number(puntajes[a.id]) || null;
    const detalle = [a.preambulo, ...(a.descripcion || []).map(d => `- ${d}`)].filter(Boolean).join('\n');
    return [
      { content: `${a.nombre}\n${detalle}`, styles: { valign: 'top' } },
      { content: calif ? String(calif) : '—', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10, textColor: AZUL.navy2 } },
      { content: String(a.ponderacion), styles: { halign: 'center', valign: 'middle' } },
      { content: calif ? String(calif * a.ponderacion) : '—', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', textColor: AZUL.navy2 } }
    ];
  });
  body.push([
    { content: 'Total', styles: { fontStyle: 'bold', halign: 'right', fillColor: AZUL.fondo } },
    { content: '', styles: { fillColor: AZUL.fondo } },
    { content: String(r.sumaPonderaciones), styles: { halign: 'center', fontStyle: 'bold', fillColor: AZUL.fondo } },
    { content: `${total} / ${r.puntajeMaximo}`, styles: { halign: 'center', fontStyle: 'bold', fillColor: AZUL.claro, textColor: AZUL.navy2 } }
  ]);
  return {
    startY: y,
    margin: { left: MARGEN.left, right: MARGEN.right, top, bottom: MARGEN.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [['Aspectos a evaluar', 'Calificación', 'Ponderación', 'Puntos asignados']],
    headStyles: { fillColor: AZUL.navy3, textColor: AZUL.blanco, fontStyle: 'bold', fontSize: 7.8, halign: 'center', valign: 'middle' },
    styles: { font: 'Arial', fontSize: 7, cellPadding: 1.8, overflow: 'linebreak', lineColor: AZUL.borde, lineWidth: 0.2, textColor: AZUL.texto, valign: 'top' },
    columnStyles: { 0: { cellWidth: W - 72 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 28 } },
    rowPageBreak: 'avoid',
    body,
    didDrawPage: data => { if (data.pageNumber > 1) drawChromeEureka(doc, chrome); }
  };
}

/* ───── Cierre: notas, puntaje, observaciones y firma (se mide antes de dibujar) ───── */

function textosCierre(doc, ev, r) {
  const bloqueada = ev.noProsigue || ev.incomparecencia;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.6);
  let notas = [];
  if (!bloqueada && r.tipoEscala === 'simple') {
    notas = (r.criterios || []).filter(c => c.nota).map(c => doc.splitTextToSize(`* ${c.nombre}: ${c.nota}`, W));
    if (r.cierreOficial) notas.push(doc.splitTextToSize(r.cierreOficial, W));
  } else if (!bloqueada) {
    notas = [4, 3, 2, 1].map(n => doc.splitTextToSize(`${n} — ${r.leyendaCalificacion[n]}`, W - 4));
  }
  doc.setFontSize(7.2);
  const observacion = doc.splitTextToSize(ev.observacionesJurado || 'Sin observaciones registradas.', W - 5).slice(0, 8);
  const altoNotas = notas.reduce((s, l) => s + l.length * 6.6 * 1.15 * PT, 0) + (notas.length ? 4.5 : 0);
  const altoObs = Math.max(11, observacion.length * 7.2 * 1.2 * PT + 4.5);
  const duracion = ev.duracionEjecutada && ev.duracionEjecutada !== '00:00';
  const penal = sumaPenalizaciones(ev.penalizaciones);
  const alto = altoNotas + 11 + (duracion || penal ? 4.5 : 0) + 6 + altoObs + 5 + ALTO_FIRMA_FICHA;
  return { notas, observacion, altoObs, duracion, penal, alto };
}

function dibujarCierre(doc, ev, r, y, panel, t) {
  let cursor = y;
  if (t.notas.length) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...AZUL.gris700);
    doc.text(r.tipoEscala === 'simple' ? 'Notas del anexo:' : 'Escala de calificación:', MARGEN.left, cursor + 1);
    cursor += 3.8;
    doc.setFont('Arial', 'normal');
    doc.setFontSize(6.6);
    t.notas.forEach(lineas => {
      doc.text(lineas, MARGEN.left + (r.tipoEscala === 'simple' ? 0 : 2), cursor, { lineHeightFactor: 1.15 });
      cursor += lineas.length * 6.6 * 1.15 * PT;
    });
    cursor += 0.8;
  }

  autoTable(doc, {
    startY: cursor,
    margin: { left: MARGEN.left, right: MARGEN.right },
    tableWidth: W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 9, cellPadding: 2.2, lineColor: AZUL.navy3, lineWidth: 0.2, halign: 'center', fontStyle: 'bold' },
    body: [[{
      content: ev.incomparecencia
        ? `PUNTAJE TOTAL: 0 / ${r.puntajeMaximo} (no se presentó)`
        : (ev.noProsigue ? `PUNTAJE TOTAL: 0 / ${r.puntajeMaximo} (no prosigue)` : `PUNTAJE TOTAL: ${ev.puntajeTotal || 0} / ${r.puntajeMaximo}`),
      styles: { fillColor: AZUL.navy3, textColor: AZUL.blanco }
    }]]
  });
  cursor = doc.lastAutoTable.finalY + 3.5;

  if (t.duracion || t.penal) {
    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...AZUL.gris700);
    const partes = [];
    if (t.duracion) partes.push(`Duración de la exposición: ${ev.duracionEjecutada}${ev.excedioTiempo ? ` (superó los ${EUREKA_CONFIG.tiempoExposicionMin} minutos; dato informativo)` : ''}`);
    if (t.penal) partes.push(`Penalización registrada: −${t.penal}`);
    doc.text(partes.join('   ·   '), MARGEN.left, cursor + 1);
    cursor += 4.5;
  }

  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...AZUL.navy2);
  doc.text('OBSERVACIONES DEL JURADO CALIFICADOR', MARGEN.left, cursor + 1.5);
  cursor += 3.5;
  doc.setDrawColor(...AZUL.borde);
  doc.setFillColor(...AZUL.fondoSuave);
  doc.setLineWidth(0.25);
  doc.rect(MARGEN.left, cursor, W, t.altoObs, 'FD');
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...AZUL.texto);
  doc.text(t.observacion, MARGEN.left + 2.5, cursor + 4, { lineHeightFactor: 1.2 });
  cursor += t.altoObs + 6;

  const slot = ev.jurado?.numeroJurado || 1;
  dibujarFirmaFicha(doc, {
    y: cursor,
    bloque: bloqueFirmaDe(resolverFirmanteDeFicha(ev, panel), slot),
    numeroJurado: slot,
    fecha: fechaCorta(ev.fecha || EUREKA_CONFIG.fechaEvaluacion)
  });
}

/** Dibuja una ficha completa. `panel` es el Panel de Firmas ya resuelto para la evaluación. */
export function dibujarUnicaFichaEureka(doc, { evaluacion, rubrica, panel = null, banner = null, nuevaPagina = false }) {
  const r = rubrica || rubricaDeEvaluacion(evaluacion) || getRubricaEureka(evaluacion.anexoEvaluacion);
  if (!r) throw new Error(`No se pudo resolver la rúbrica de la evaluación ${evaluacion.id}.`);
  if (nuevaPagina) doc.addPage([A4.ancho, A4.alto], 'portrait');

  const chrome = encabezado(evaluacion, r, banner);
  let y = drawChromeEureka(doc, chrome);
  const top = medirChromeEureka(doc, chrome);
  y = tablaIdentificacion(doc, evaluacion, r, y);
  if (evaluacion.incomparecencia) y = avisoRojo(doc, 'NO SE PRESENTÓ: el participante no asistió a la evaluación.', y);
  y = tablaGate(doc, evaluacion, r, y);

  const cierre = textosCierre(doc, evaluacion, r);
  if (!evaluacion.noProsigue && !evaluacion.incomparecencia) {
    const opciones = r.tipoEscala === 'simple' ? opcionesSimple(doc, evaluacion, r, y, chrome, top) : opcionesPonderada(doc, evaluacion, r, y, chrome, top);
    y = tablaConCierre(doc, { opciones, orientacion: 'portrait', alturaCierre: cierre.alto + 3, encabezado: d => drawChromeEureka(d, chrome) }).y + 3;
  } else {
    y = asegurarEspacio(doc, { y, alto: cierre.alto, orientacion: 'portrait', encabezado: chrome });
  }
  if (y + cierre.alto > limiteInferior('portrait')) {
    y = asegurarEspacio(doc, { y, alto: cierre.alto, orientacion: 'portrait', encabezado: d => drawChromeEureka(d, chrome) });
  }
  dibujarCierre(doc, evaluacion, r, y, panel, cierre);
}

function nombreArchivoFicha(ev, r) {
  const snap = ev.participanteSnapshot || {};
  const area = sanitizarNombreArchivo(getArea(ev.areaId)?.nombre || ev.areaId);
  const cod = sanitizarNombreArchivo(snap.codigoParticipante || ev.participanteId || 'PROYECTO');
  return `Anexo${r.id}_Ficha_Cat${ev.categoria}_${area}_${cod}_J${ev.jurado?.numeroJurado || 1}.pdf`;
}

/** Una sola ficha. */
export function generarFichaEurekaPDF(evaluacion, { rubrica = null, panel = null, banner = null, guardar = true } = {}) {
  const r = rubrica || rubricaDeEvaluacion(evaluacion);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarUnicaFichaEureka(doc, { evaluacion, rubrica: r, panel, banner });
  aplicarPiePaginasEureka(doc, { preliminar: esPreliminar(panel) });
  if (guardar) doc.save(nombreArchivoFicha(evaluacion, r));
  return doc;
}

async function compilarFichas(evaluaciones, { panelesMap = {}, banner = null, onProgreso = null }) {
  const ordenadas = ordenarEvaluacionesParaCompilacion(evaluaciones);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  let algunPreliminar = false;
  let dibujadas = 0;
  for (let i = 0; i < ordenadas.length; i += 1) {
    const ev = ordenadas[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: ev.categoria, areaId: ev.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicaFichaEureka(doc, { evaluacion: ev, rubrica: rubricaDeEvaluacion(ev), panel, banner, nuevaPagina: dibujadas > 0 });
      dibujadas += 1;
    } catch (err) {
      console.warn(`Ficha omitida (${ev.id}):`, err);
    }
    if (onProgreso) onProgreso(i + 1, ordenadas.length);
    if (i % 20 === 19) await cederHilo();
  }
  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  return { doc, ordenadas };
}

/** Todas las fichas de una categoría y un área. */
export async function generarTodasFichasCategoriaAreaPDF(evaluaciones = [], opciones = {}) {
  if (!evaluaciones.length) throw new Error('No hay fichas registradas para descargar.');
  const { doc, ordenadas } = await compilarFichas(evaluaciones, opciones);
  const primera = ordenadas[0];
  const area = sanitizarNombreArchivo(getArea(primera.areaId)?.nombre || primera.areaId);
  if (opciones.guardar !== false) doc.save(`Fichas_Eureka_Cat${primera.categoria}_${area}.pdf`);
  return ordenadas.length;
}

/** Todas las fichas de una categoría, en todas sus áreas. */
export async function generarFichasCategoriaCompletaPDF(evaluaciones = [], opciones = {}) {
  if (!evaluaciones.length) throw new Error('No hay fichas registradas para descargar.');
  const { doc, ordenadas } = await compilarFichas(evaluaciones, opciones);
  if (opciones.guardar !== false) doc.save(`Fichas_Eureka_Categoria_${opciones.categoria || ordenadas[0].categoria}_TODAS_LAS_AREAS.pdf`);
  return ordenadas.length;
}
