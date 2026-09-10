/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — GENERADOR PDF DE LAS FICHAS DE EVALUACIÓN
   Anexos E11 a E18. A4 vertical. Una ficha puede ocupar de 1 a 3 páginas.

   El bloque de firma NO vive en la evaluación: se resuelve en tiempo de renderizado
   contra el Panel de Firmas Oficial. Sin panel sellado la ficha se emite con el bloque en
   modo pendiente y la marca "DOCUMENTO PRELIMINAR". La descarga nunca se bloquea.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4, anchoContenido, drawChromeEureka, aplicarPiePaginasEureka,
  aplicarFuentesArial, drawBloqueFirma, cederHilo, limiteCuerpo
} from './membreteEureka';
import { RGB, getAcreditacionAplicable } from '../data/eurekaCatalogos';
import { getRubricaEureka, getItemsRubrica } from '../data/eurekaRubricas';
import { EUREKA_CONFIG, getArea, getLinea, getCategoria } from '../data/eurekaConfigUGEL03';
import {
  resolverFirmanteDeFicha, bloqueFirmaDe, resolverPanelFirmas, esPreliminar
} from '../utils/eurekaFirmas';
import {
  sumaPenalizaciones, sanitizarNombreArchivo, ordenarEvaluacionesParaCompilacion,
  nombresEstudiantes, rubricaDeEvaluacion
} from '../utils/eurekaHelpers';

const CONTENT_W = anchoContenido('portrait');

function tituloAnexo(rubrica) {
  return `ANEXO ${rubrica.id} — ${(rubrica.titulo || '').toUpperCase()}`;
}

function subtituloFicha(evaluacion) {
  const area = getArea(evaluacion.areaId);
  const linea = getLinea(evaluacion.areaId, evaluacion.lineaId);
  const cat = getCategoria(evaluacion.categoria);
  const partes = [
    cat ? `${cat.nombre} (${cat.grados})` : `Categoría ${evaluacion.categoria}`,
    area ? area.nombre : '',
    linea ? linea.nombre : ''
  ].filter(Boolean);
  return partes.join(' · ');
}

/* ───── Tabla de identificación ───── */

function dibujarIdentificacion(doc, evaluacion, y) {
  const snap = evaluacion.participanteSnapshot || {};
  const inst = snap.institucion || {};
  const area = getArea(evaluacion.areaId);
  const linea = getLinea(evaluacion.areaId, evaluacion.lineaId);
  const cat = getCategoria(evaluacion.categoria);

  const celdaEtiqueta = { fontStyle: 'bold', fillColor: RGB.gris100, textColor: RGB.gris700 };

  const filas = [
    [
      { content: 'CATEGORÍA', styles: celdaEtiqueta },
      { content: cat ? `${cat.nombre} — ${cat.grados}` : evaluacion.categoria, colSpan: 3 }
    ],
    [
      { content: 'ÁREA DE PARTICIPACIÓN', styles: celdaEtiqueta },
      { content: area ? area.nombre : evaluacion.areaId },
      { content: 'LÍNEA', styles: celdaEtiqueta },
      { content: linea ? linea.nombre : evaluacion.lineaId }
    ],
    [
      { content: 'ETAPA / DRE / UGEL', styles: celdaEtiqueta },
      { content: `${evaluacion.etapa || EUREKA_CONFIG.etapa} / ${inst.dre || EUREKA_CONFIG.dre} / ${inst.ugel || EUREKA_CONFIG.ugel}` },
      { content: 'FECHA', styles: celdaEtiqueta },
      { content: evaluacion.fecha || EUREKA_CONFIG.fechaEvaluacion }
    ],
    [
      { content: 'CÓDIGO SICE', styles: celdaEtiqueta },
      { content: snap.codigoParticipante || evaluacion.codigoParticipante || '—' },
      { content: 'ORDEN DE PRESENTACIÓN', styles: celdaEtiqueta },
      { content: snap.ordenPresentacion ? String(snap.ordenPresentacion) : '—' }
    ],
    [
      { content: 'INSTITUCIÓN EDUCATIVA', styles: celdaEtiqueta },
      { content: inst.nombre || snap.institucionNombre || 'No registrada', styles: { fontStyle: 'bold', textColor: RGB.navy2 } },
      { content: 'CÓDIGO MODULAR', styles: celdaEtiqueta },
      { content: inst.codigoModular || '—' }
    ],
    [
      { content: 'TÍTULO DEL PROYECTO', styles: celdaEtiqueta },
      { content: snap.tituloProyecto || '—', colSpan: 3, styles: { fontStyle: 'bold', textColor: RGB.verdeOscuro } }
    ],
    [
      { content: 'ESTUDIANTE(S)', styles: celdaEtiqueta },
      { content: nombresEstudiantes(snap) || '—', colSpan: 3 }
    ],
    [
      { content: 'DOCENTE ASESOR', styles: celdaEtiqueta },
      { content: snap.docenteAsesor?.nombreCompleto || '—' },
      { content: 'DNI / ESPECIALIDAD', styles: celdaEtiqueta },
      { content: `${snap.docenteAsesor?.numeroDocumento || '—'} / ${snap.docenteAsesor?.especialidad || '—'}` }
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.2, cellPadding: 1.6, overflow: 'linebreak', lineColor: RGB.gris300 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: CONTENT_W / 2 - 38 },
      2: { cellWidth: 36 },
      3: { cellWidth: CONTENT_W / 2 - 36 }
    },
    body: filas
  });

  return doc.lastAutoTable.finalY + 3;
}

/* ───── Gate de planificación curricular (solo E11 a E14) ───── */

function dibujarGate(doc, evaluacion, rubrica, y) {
  if (!rubrica.gate?.requerido) return y;

  const respuesta = evaluacion.planificacionCurricular;
  const marcaSi = respuesta === true ? 'X' : ' ';
  const marcaNo = respuesta === false ? 'X' : ' ';

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.2, cellPadding: 2, overflow: 'linebreak', lineColor: RGB.gris300 },
    columnStyles: { 0: { cellWidth: CONTENT_W - 34 }, 1: { cellWidth: 34, halign: 'center', fontStyle: 'bold' } },
    body: [[
      { content: `1.- ${rubrica.gate.pregunta}. ${rubrica.gate.textoPositivo} ${rubrica.gate.textoNegativo}` },
      { content: `SÍ (${marcaSi})   NO (${marcaNo})` }
    ]]
  });

  let cursor = doc.lastAutoTable.finalY + 2;

  if (respuesta === false) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(...RGB.error);
    doc.setLineWidth(0.3);
    doc.rect(M.left, cursor, CONTENT_W, 7, 'FD');
    doc.setFont('Arial', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...RGB.error);
    doc.text(
      'NO PROSIGUE — Concluye su participación conforme al numeral 1 del Anexo correspondiente.',
      A4.ancho / 2, cursor + 4.6, { align: 'center' }
    );
    cursor += 10;
  }

  return cursor;
}

/* ───── Motor A: rúbrica simple (E11 a E14) ───── */

function dibujarRubricaSimple(doc, evaluacion, rubrica, y, chromeOpts) {
  const escala = rubrica.escala;
  const anchoCriterio = 34;
  const anchoPuntaje = 18;
  const anchoNivel = (CONTENT_W - anchoCriterio - anchoPuntaje) / escala.length;
  const puntajes = evaluacion.puntajes || {};

  const head = [['CRITERIO', ...escala.map(n => String(n)), 'PTJE.']];
  const body = (rubrica.criterios || []).map(c => {
    const elegido = Number(puntajes[c.id]);
    const fila = [{
      content: c.nombre + (c.nota ? `\n\n${c.nota}` : ''),
      styles: { fontStyle: 'bold', fillColor: RGB.gris100, valign: 'top' }
    }];
    escala.forEach(nivel => {
      fila.push({
        content: c.descriptores[nivel] || '',
        styles: elegido === nivel
          ? { fillColor: RGB.verdeHalo, fontStyle: 'bold', textColor: RGB.navy2 }
          : {}
      });
    });
    fila.push({
      content: elegido ? String(elegido) : '—',
      styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 9 }
    });
    return fila;
  });

  const columnStyles = { 0: { cellWidth: anchoCriterio } };
  escala.forEach((_, i) => { columnStyles[i + 1] = { cellWidth: anchoNivel }; });
  columnStyles[escala.length + 1] = { cellWidth: anchoPuntaje };

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top: M.top + 26, bottom: M.bottom + 6 },
    tableWidth: CONTENT_W,
    theme: 'grid',
    head,
    headStyles: {
      fillColor: RGB.verdeEureka, textColor: RGB.blanco, fontStyle: 'bold',
      fontSize: 7.5, halign: 'center'
    },
    styles: { font: 'Arial', fontSize: 6.4, cellPadding: 1.4, overflow: 'linebreak', lineColor: RGB.gris300, valign: 'top' },
    columnStyles,
    body,
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawChromeEureka(doc, chromeOpts);
    }
  });

  return doc.lastAutoTable.finalY + 3;
}

/* ───── Motor B: rúbrica ponderada (E15 a E18) ───── */

function dibujarRubricaPonderada(doc, evaluacion, rubrica, y, chromeOpts) {
  const variante = evaluacion.varianteRubrica || 'A';
  const items = getItemsRubrica(rubrica, variante);
  const puntajes = evaluacion.puntajes || {};

  const body = items.map(a => {
    const calif = Number(puntajes[a.id]) || null;
    const asignados = calif ? calif * a.ponderacion : null;
    const detalle = [
      a.preambulo || null,
      ...(a.descripcion || []).map(d => `• ${d}`)
    ].filter(Boolean).join('\n');

    return [
      { content: `${a.nombre}\n${detalle}`, styles: { valign: 'top' } },
      { content: calif ? String(calif) : '—', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 9 } },
      { content: String(a.ponderacion), styles: { halign: 'center', valign: 'middle' } },
      { content: asignados != null ? String(asignados) : '—', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } }
    ];
  });

  const totalPonderado = items.reduce((s, a) => {
    const c = Number(puntajes[a.id]) || 0;
    return s + c * a.ponderacion;
  }, 0);

  body.push([
    { content: 'Total', styles: { fontStyle: 'bold', halign: 'right', fillColor: RGB.gris100 } },
    { content: '', styles: { fillColor: RGB.gris100 } },
    { content: String(rubrica.sumaPonderaciones), styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB.gris100 } },
    { content: `${totalPonderado} / ${rubrica.puntajeMaximo}`, styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB.verdeHalo } }
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top: M.top + 26, bottom: M.bottom + 6 },
    tableWidth: CONTENT_W,
    theme: 'grid',
    head: [['ASPECTOS A EVALUAR', 'CALIFICACIÓN', 'PONDERACIÓN', 'PUNTOS ASIGNADOS']],
    headStyles: {
      fillColor: RGB.verdeEureka, textColor: RGB.blanco, fontStyle: 'bold',
      fontSize: 7.2, halign: 'center'
    },
    styles: { font: 'Arial', fontSize: 6.6, cellPadding: 1.5, overflow: 'linebreak', lineColor: RGB.gris300, valign: 'top' },
    columnStyles: {
      0: { cellWidth: CONTENT_W - 78 },
      1: { cellWidth: 24 },
      2: { cellWidth: 24 },
      3: { cellWidth: 30 }
    },
    body,
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawChromeEureka(doc, chromeOpts);
    }
  });

  let cursor = doc.lastAutoTable.finalY + 2.5;

  // Leyenda oficial de la escala de calificación.
  doc.setFont('Arial', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(...RGB.gris700);
  doc.text('Escala de calificación:', M.left, cursor);
  cursor += 3;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.2);
  [4, 3, 2, 1].forEach(n => {
    const linea = doc.splitTextToSize(`${n} — ${rubrica.leyendaCalificacion[n]}`, CONTENT_W - 4);
    doc.text(linea, M.left + 2, cursor);
    cursor += linea.length * 2.6;
  });

  return cursor + 2;
}

/* ───── Bloques de cierre ───── */

function dibujarResumenPuntaje(doc, evaluacion, rubrica, y) {
  const penal = sumaPenalizaciones(evaluacion.penalizaciones);
  const bruto = rubrica.tipoEscala === 'simple' ? (evaluacion.puntajeBruto || 0) : (evaluacion.puntajePonderado || 0);

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2, lineColor: RGB.gris300 },
    columnStyles: {
      0: { cellWidth: CONTENT_W * 0.36, fontStyle: 'bold', halign: 'center', fillColor: RGB.gris100 },
      1: { cellWidth: CONTENT_W * 0.30, fontStyle: 'bold', halign: 'center', fillColor: RGB.gris100 },
      2: { cellWidth: CONTENT_W * 0.34, fontStyle: 'bold', halign: 'center', fillColor: RGB.verdeEureka, textColor: RGB.blanco, fontSize: 9 }
    },
    body: [[
      rubrica.tipoEscala === 'simple'
        ? `PUNTAJE BRUTO: ${bruto} / ${rubrica.puntajeMaximo}`
        : `PUNTAJE PONDERADO: ${bruto} / ${rubrica.puntajeMaximo}`,
      `PENALIZACIÓN: −${penal}`,
      `PUNTAJE TOTAL: ${evaluacion.puntajeTotal || 0} / ${rubrica.puntajeMaximo}`
    ]]
  });

  return doc.lastAutoTable.finalY + 3;
}

function dibujarTiempoYPenalizaciones(doc, evaluacion, y) {
  let cursor = y;

  doc.setFont('Arial', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...RGB.gris700);
  const duracion = evaluacion.duracionEjecutada || '00:00';
  const excedio = evaluacion.excedioTiempo
    ? `  ·  Excedió el tiempo máximo de ${EUREKA_CONFIG.tiempoExposicionMin} minutos (dato informativo, sin descuento de puntaje).`
    : '';
  doc.text(`Duración de la exposición: ${duracion}${excedio}`, M.left, cursor);
  cursor += 3.6;

  const penalizaciones = evaluacion.penalizaciones || [];
  if (penalizaciones.length > 0) {
    autoTable(doc, {
      startY: cursor,
      margin: { left: M.left, right: M.right },
      tableWidth: CONTENT_W,
      theme: 'grid',
      head: [['PENALIZACIÓN APLICADA', 'PUNTOS', 'MOTIVO']],
      headStyles: { fillColor: RGB.alerta, textColor: RGB.blanco, fontSize: 7, fontStyle: 'bold' },
      styles: { font: 'Arial', fontSize: 6.8, cellPadding: 1.4, overflow: 'linebreak', lineColor: RGB.gris300 },
      columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: CONTENT_W - 64 } },
      body: penalizaciones.map(p => [p.tipo || 'Penalización manual', `−${p.puntos || 0}`, p.motivo || ''])
    });
    cursor = doc.lastAutoTable.finalY + 3;
  }

  return cursor;
}

function dibujarAcreditacion(doc, evaluacion, y) {
  const items = getAcreditacionAplicable(evaluacion.categoria, evaluacion.lineaId);
  if (items.length === 0) return y;

  const marcadas = evaluacion.acreditacion || {};
  const cumplidos = items.filter(i => marcadas[i.id]).length;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...RGB.navy2);
  doc.text(`CHECKLIST DE ACREDITACIÓN DOCUMENTAL: ${cumplidos} de ${items.length} verificados`, M.left, y);
  let cursor = y + 2;

  const mitad = Math.ceil(items.length / 2);
  const body = [];
  for (let i = 0; i < mitad; i++) {
    const izq = items[i];
    const der = items[i + mitad];
    body.push([
      izq ? `[${marcadas[izq.id] ? 'X' : ' '}] ${izq.label}` : '',
      der ? `[${marcadas[der.id] ? 'X' : ' '}] ${der.label}` : ''
    ]);
  }

  autoTable(doc, {
    startY: cursor,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'plain',
    styles: { font: 'Arial', fontSize: 6.2, cellPadding: 0.8, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: CONTENT_W / 2 }, 1: { cellWidth: CONTENT_W / 2 } },
    body
  });

  return doc.lastAutoTable.finalY + 2;
}

function dibujarObservaciones(doc, evaluacion, y) {
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...RGB.navy2);
  doc.text('OBSERVACIONES DEL JURADO CALIFICADOR:', M.left, y);
  let cursor = y + 2;

  const texto = evaluacion.observacionesJurado || 'Sin observaciones registradas.';
  const lineas = doc.splitTextToSize(texto, CONTENT_W - 4);
  const alto = Math.min(24, Math.max(9, lineas.length * 3 + 3));

  doc.setDrawColor(...RGB.gris300);
  doc.setFillColor(250, 250, 250);
  doc.rect(M.left, cursor, CONTENT_W, alto, 'FD');
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...RGB.gris700);
  doc.text(lineas.slice(0, 7), M.left + 2, cursor + 3.2);

  return cursor + alto + 3;
}

function dibujarAvisoNoPresentado(doc, evaluacion, y) {
  if (!evaluacion.incomparecencia) return y;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(...RGB.error);
  doc.setLineWidth(0.3);
  doc.rect(M.left, y, CONTENT_W, 8, 'FD');
  doc.setFont('Arial', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RGB.error);
  doc.text('NO SE PRESENTÓ — EL PARTICIPANTE NO ASISTIÓ A LA EVALUACIÓN', A4.ancho / 2, y + 5.4, { align: 'center' });
  return y + 11;
}

/* ───── Ficha completa ───── */

/**
 * Dibuja una ficha completa en el documento recibido.
 * `panel` es el Panel de Firmas Oficial ya resuelto para esta evaluación (o null).
 */
export function dibujarUnicaFichaEureka(doc, { evaluacion, rubrica, panel = null, banner = null, nuevaPagina = false }) {
  const r = rubrica || rubricaDeEvaluacion(evaluacion) || getRubricaEureka(evaluacion.anexoEvaluacion);
  if (!r) throw new Error(`No se pudo resolver la rúbrica de la evaluación ${evaluacion.id}.`);

  const chromeOpts = {
    orientacion: 'portrait',
    titulo: tituloAnexo(r),
    subtitulo: subtituloFicha(evaluacion),
    banner
  };

  if (nuevaPagina) doc.addPage([A4.ancho, A4.alto], 'portrait');

  let y = drawChromeEureka(doc, chromeOpts);

  y = dibujarIdentificacion(doc, evaluacion, y);
  y = dibujarAvisoNoPresentado(doc, evaluacion, y);
  y = dibujarGate(doc, evaluacion, r, y);

  const bloqueada = evaluacion.noProsigue || evaluacion.incomparecencia;
  if (!bloqueada) {
    y = r.tipoEscala === 'simple'
      ? dibujarRubricaSimple(doc, evaluacion, r, y, chromeOpts)
      : dibujarRubricaPonderada(doc, evaluacion, r, y, chromeOpts);
  }

  if (y > limiteCuerpo('portrait') - 60) {
    doc.addPage([A4.ancho, A4.alto], 'portrait');
    y = drawChromeEureka(doc, chromeOpts);
  }

  y = dibujarResumenPuntaje(doc, evaluacion, r, y);
  y = dibujarTiempoYPenalizaciones(doc, evaluacion, y);
  y = dibujarAcreditacion(doc, evaluacion, y);
  y = dibujarObservaciones(doc, evaluacion, y);

  // Bloque de firma resuelto contra el panel. Nunca se aborta por falta de firma.
  const slot = evaluacion.jurado?.numeroJurado || 1;
  const firmante = resolverFirmanteDeFicha(evaluacion, panel);
  const bloque = bloqueFirmaDe(firmante, slot);

  if (y > limiteCuerpo('portrait') - 42) {
    doc.addPage([A4.ancho, A4.alto], 'portrait');
    y = drawChromeEureka(doc, chromeOpts);
  }

  drawBloqueFirma(doc, {
    x: A4.ancho / 2 - 40,
    y: y + 3,
    ancho: 80,
    firmante: bloque,
    numeroJurado: slot,
    conInstitucion: true,
    conFecha: true,
    fecha: evaluacion.fecha || EUREKA_CONFIG.fechaEvaluacion
  });

  // Trazabilidad interna. Solo se imprime si la comisión lo habilita expresamente.
  if (EUREKA_CONFIG.imprimirEvaluadorOperativo && evaluacion.evaluadorOperativo) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(...RGB.gris500);
    doc.text(
      `Captura registrada por: ${evaluacion.evaluadorOperativo.nombreCompleto} (${evaluacion.evaluadorOperativo.correo})`,
      M.left, limiteCuerpo('portrait')
    );
  }
}

function nombreArchivoFicha(evaluacion, rubrica) {
  const snap = evaluacion.participanteSnapshot || {};
  const area = sanitizarNombreArchivo(getArea(evaluacion.areaId)?.nombre || evaluacion.areaId);
  const cod = sanitizarNombreArchivo(snap.codigoParticipante || evaluacion.participanteId || 'PART');
  const slot = evaluacion.jurado?.numeroJurado || 1;
  return `Anexo${rubrica.id}_Ficha_${evaluacion.categoria}_${area}_${cod}_J${slot}.pdf`;
}

/** Nivel 0 — una sola ficha. */
export function generarFichaEurekaPDF(evaluacion, { rubrica = null, panel = null, banner = null } = {}) {
  const r = rubrica || rubricaDeEvaluacion(evaluacion);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarUnicaFichaEureka(doc, { evaluacion, rubrica: r, panel, banner });
  aplicarPiePaginasEureka(doc, { preliminar: esPreliminar(panel) });
  doc.save(nombreArchivoFicha(evaluacion, r));
}

/**
 * Nivel 1 — todas las fichas de una categoría + área.
 * `panelesMap` permite resolver el panel aplicable a cada evaluación por cascada.
 */
export async function generarTodasFichasCategoriaAreaPDF(evaluaciones = [], {
  panelesMap = {}, banner = null, onProgreso = null
} = {}) {
  if (!evaluaciones.length) throw new Error('No hay fichas registradas para descargar.');

  const ordenadas = ordenarEvaluacionesParaCompilacion(evaluaciones);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let algunPreliminar = false;

  for (let i = 0; i < ordenadas.length; i++) {
    const ev = ordenadas[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: ev.categoria, areaId: ev.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicaFichaEureka(doc, {
        evaluacion: ev,
        rubrica: rubricaDeEvaluacion(ev),
        panel,
        banner,
        nuevaPagina: i > 0
      });
    } catch (err) {
      // Un error puntual no debe abortar una compilación de cientos de fichas.
      console.warn(`Ficha omitida (${ev.id}):`, err);
    }
    if (onProgreso) onProgreso(i + 1, ordenadas.length);
    if (i % 25 === 24) await cederHilo();
  }

  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });

  const primera = ordenadas[0];
  const area = sanitizarNombreArchivo(getArea(primera.areaId)?.nombre || primera.areaId);
  doc.save(`Fichas_Eureka_Cat${primera.categoria}_${area}.pdf`);
  return ordenadas.length;
}

/** Nivel 2 — todas las fichas de una categoría, todas sus áreas. */
export async function generarFichasCategoriaCompletaPDF(evaluaciones = [], {
  categoria, panelesMap = {}, banner = null, onProgreso = null
} = {}) {
  if (!evaluaciones.length) throw new Error('No hay fichas registradas para descargar.');

  const ordenadas = ordenarEvaluacionesParaCompilacion(evaluaciones);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let algunPreliminar = false;

  for (let i = 0; i < ordenadas.length; i++) {
    const ev = ordenadas[i];
    const panel = resolverPanelFirmas(panelesMap, { categoria: ev.categoria, areaId: ev.areaId });
    if (esPreliminar(panel)) algunPreliminar = true;
    try {
      dibujarUnicaFichaEureka(doc, {
        evaluacion: ev,
        rubrica: rubricaDeEvaluacion(ev),
        panel,
        banner,
        nuevaPagina: i > 0
      });
    } catch (err) {
      console.warn(`Ficha omitida (${ev.id}):`, err);
    }
    if (onProgreso) onProgreso(i + 1, ordenadas.length);
    if (i % 25 === 24) await cederHilo();
  }

  aplicarPiePaginasEureka(doc, { preliminar: algunPreliminar });
  doc.save(`Fichas_Eureka_Categoria_${categoria || ordenadas[0].categoria}_TODAS_LAS_AREAS.pdf`);
  return ordenadas.length;
}
