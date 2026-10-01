/* ═══════════════════════════════════════════════════════════════
   PRECONGRESO DE COPAE – UGEL 03 — GENERACIÓN OFICIAL DE PDFs
   1. Ficha Individual de Evaluación (Instrumento oficial)
   2. Consolidado del Jurado (Todos los 19 puestos, Ganador, Top 7)
   3. Descargas masivas: Todas las Fichas y Paquete Completo
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4, anchoContenido, drawChromeCOPAE, aplicarPieCOPAE, aplicarFuentesArial,
  obtenerMembreteCOPAE, RGB_COPAE
} from './membreteCOPAE';
import { COPAE_CONFIG, CRITERIOS_EVALUACION_COPAE, NIVELES_VALORACION_COPAE } from '../data/copaeConfig';
import { calcularPuntajeFicha, sanitizarNombreArchivo } from '../utils/copaeHelpers';
import { firmanteDelCasilleroCOPAE, esPreliminarCOPAE } from '../utils/copaeFirmas';

const W = anchoContenido('portrait');

/**
 * Dibuja el bloque de firma de un jurado.
 */
function dibujarFirmaJurado(doc, { cx, y, firmante, numeroJurado }) {
  const nombre = firmante?.nombreCompleto || `Jurado Evaluador N.° ${numeroJurado}`;
  const dni = firmante?.dni ? `DNI N.° ${firmante.dni}` : '';
  const cargo = firmante?.cargo || `Jurado Evaluador ${numeroJurado}`;
  const firmaUrl = firmante?.firmaDataUrl;

  // Si tiene firma digital en imagen
  if (firmaUrl && String(firmaUrl).startsWith('data:image')) {
    try {
      doc.addImage(firmaUrl, 'PNG', cx - 22, y - 14, 44, 14);
    } catch (e) {
      console.warn('Error dibujando imagen de firma:', e);
    }
  }

  // Línea de firma
  doc.setDrawColor(...RGB_COPAE.navy3);
  doc.setLineWidth(0.4);
  doc.line(cx - 38, y, cx + 38, y);

  // Textos
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...RGB_COPAE.navy2);
  doc.text(nombre, cx, y + 3.8, { align: 'center' });

  if (dni) {
    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...RGB_COPAE.gris700);
    doc.text(dni, cx, y + 7.2, { align: 'center' });
  }

  doc.setFont('Arial', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(...RGB_COPAE.gris500);
  doc.text(cargo, cx, y + (dni ? 10.4 : 7.2), { align: 'center' });
}

/**
 * 1. Genera el PDF de la Ficha Individual de Evaluación de un CEBA.
 */
export async function generarFichaIndividualCOPAEPDF({
  ceba,
  evaluacion = {},
  panel = null,
  numeroJurado = 1
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  const banner = await obtenerMembreteCOPAE();
  const firmante = firmanteDelCasilleroCOPAE(panel, numeroJurado);
  const preliminar = esPreliminarCOPAE(panel);

  // Encabezado
  let y = drawChromeCOPAE(doc, {
    orientacion: 'portrait',
    banner,
    titulo: 'INSTRUMENTO DE EVALUACIÓN',
    subtitulo: 'PRECONGRESO DE COPAE – UGEL 03',
    lema: '«Mi voz, mi propuesta»'
  });

  // Datos Generales
  const esNsp = Boolean(evaluacion.esNsp);
  const puntajeTotal = calcularPuntajeFicha(evaluacion.puntajes || {}, esNsp);
  const fechaTexto = evaluacion.fecha || COPAE_CONFIG.fechaPorDefecto;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2, lineColor: RGB_COPAE.gris300, textColor: RGB_COPAE.gris800 },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold', fillColor: RGB_COPAE.gris100, textColor: RGB_COPAE.navy2 },
      1: { cellWidth: W - 28 - 24 - 36 },
      2: { cellWidth: 24, fontStyle: 'bold', fillColor: RGB_COPAE.gris100, textColor: RGB_COPAE.navy2 },
      3: { cellWidth: 36, halign: 'center' }
    },
    body: [
      [
        { content: 'CEBA' },
        { content: `${ceba?.nombre || 'CEBA'}${ceba?.codigoModular ? ` (Cód. Modular: ${ceba.codigoModular})` : ''}`, styles: { fontStyle: 'bold', textColor: RGB_COPAE.navy1 } },
        { content: 'Fecha' },
        { content: fechaTexto }
      ]
    ]
  });

  y = doc.lastAutoTable.finalY + 4;

  // Título de la sección
  doc.setFont('Arial', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...RGB_COPAE.navy2);
  doc.text('I. CRITERIOS DE EVALUACIÓN', M.left, y);
  y += 3;

  // Anchos de columnas
  const wNum = 8;
  const wCriterio = 36;
  const wPuntaje = 18;
  const wNivel = (W - wNum - wCriterio - wPuntaje) / 4; // ~30 mm c/u

  const puntajes = evaluacion.puntajes || {};
  const tableBody = [];

  if (esNsp) {
    tableBody.push([
      {
        content: 'INCOMPARECENCIA (NSP) — EL CEBA NO SE PRESENTÓ A LA EVALUACIÓN (VALORACIÓN: 0 PUNTOS)',
        colSpan: 7,
        styles: { halign: 'center', fontStyle: 'bold', textColor: RGB_COPAE.rojo, fillColor: RGB_COPAE.gris100 }
      }
    ]);
  }

  CRITERIOS_EVALUACION_COPAE.forEach(c => {
    const valSel = esNsp ? 0 : Number(puntajes[c.id] || 0);

    const estiloNivel = (nivel) => {
      const seleccionado = valSel === nivel;
      return {
        fillColor: seleccionado ? RGB_COPAE.azulBg : RGB_COPAE.blanco,
        fontStyle: seleccionado ? 'bold' : 'normal',
        textColor: seleccionado ? RGB_COPAE.azul : RGB_COPAE.gris800
      };
    };

    tableBody.push([
      { content: String(c.numero), styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB_COPAE.gris50 } },
      { content: c.nombre, styles: { fontStyle: 'bold', fillColor: RGB_COPAE.gris50 } },
      { content: c.descriptores[4], styles: estiloNivel(4) },
      { content: c.descriptores[3], styles: estiloNivel(3) },
      { content: c.descriptores[2], styles: estiloNivel(2) },
      { content: c.descriptores[1], styles: estiloNivel(1) },
      {
        content: valSel > 0 ? String(valSel) : (esNsp ? '0' : '—'),
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10.5, textColor: RGB_COPAE.navy2, fillColor: RGB_COPAE.gris50 }
      }
    ]);
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'grid',
    head: [[
      'N.°',
      'Criterio',
      '4 – Destacado',
      '3 – Logrado',
      '2 – En proceso',
      '1 – Inicio',
      'Puntaje'
    ]],
    headStyles: {
      fillColor: RGB_COPAE.navy2,
      textColor: RGB_COPAE.blanco,
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      font: 'Arial',
      fontSize: 6.8,
      cellPadding: 1.4,
      overflow: 'linebreak',
      lineColor: RGB_COPAE.gris300,
      textColor: RGB_COPAE.gris800,
      valign: 'top'
    },
    columnStyles: {
      0: { cellWidth: wNum },
      1: { cellWidth: wCriterio },
      2: { cellWidth: wNivel },
      3: { cellWidth: wNivel },
      4: { cellWidth: wNivel },
      5: { cellWidth: wNivel },
      6: { cellWidth: wPuntaje }
    },
    body: tableBody
  });

  y = doc.lastAutoTable.finalY + 3;

  // Leyenda de Escala de valoración
  doc.setFont('Arial', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...RGB_COPAE.gris700);
  doc.text('Escala de valoración: 4 = Destacado | 3 = Logrado | 2 = En proceso | 1 = Inicio. Puntaje máximo: 20 puntos.', M.left, y);
  y += 5.5;

  // Cuadro resumen de Puntaje Final
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'plain',
    body: [
      [
        {
          content: `Puntaje final del estudiante:  ${puntajeTotal} / ${COPAE_CONFIG.puntajeMaximoPorJurado} puntos${esNsp ? ' (INCOMPARECENCIA - NSP)' : ''}`,
          styles: {
            font: 'Arial',
            fontStyle: 'bold',
            fontSize: 10,
            textColor: RGB_COPAE.navy1,
            fillColor: RGB_COPAE.gris100,
            halign: 'left',
            cellPadding: 2.5,
            lineWidth: 0.3,
            lineColor: RGB_COPAE.gris300
          }
        }
      ]
    ]
  });

  y = doc.lastAutoTable.finalY + 5;

  // Observaciones del Jurado
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...RGB_COPAE.navy2);
  doc.text('Observaciones del Jurado (opcional)', M.left, y);
  y += 2.5;

  const obsTexto = evaluacion.observaciones && evaluacion.observaciones.trim() !== ''
    ? evaluacion.observaciones.trim()
    : 'Sin observaciones adicionales.';

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'plain',
    body: [
      [
        {
          content: obsTexto,
          styles: {
            font: 'Arial',
            fontSize: 7.8,
            textColor: RGB_COPAE.gris800,
            fillColor: RGB_COPAE.gris50,
            cellPadding: 2.2,
            minCellHeight: 12,
            lineWidth: 0.2,
            lineColor: RGB_COPAE.gris300
          }
        }
      ]
    ]
  });

  y = doc.lastAutoTable.finalY + 22;

  // Firma del jurado correspondiente
  const cx = A4.ancho / 2;
  dibujarFirmaJurado(doc, {
    cx,
    y,
    firmante,
    numeroJurado
  });

  aplicarPieCOPAE(doc, { preliminar });
  return doc;
}

/**
 * 2. Genera el PDF Oficial del CONSOLIDADO DEL JURADO (Sección II del Word).
 * Muestra los 19 CEBAs ordenados por puesto, con Ganador (Puesto 1),
 * Top 7 Clasificados a la siguiente etapa, y las dos firmas oficiales.
 */
export async function generarConsolidadoCOPAEPDF({
  filas = [],
  observacionFinal = '',
  panel = null
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  const banner = await obtenerMembreteCOPAE();
  const firmantes = [
    firmanteDelCasilleroCOPAE(panel, 1),
    firmanteDelCasilleroCOPAE(panel, 2)
  ];
  const preliminar = esPreliminarCOPAE(panel);

  // Encabezado
  let y = drawChromeCOPAE(doc, {
    orientacion: 'portrait',
    banner,
    titulo: 'II. CONSOLIDADO DEL JURADO',
    subtitulo: 'PRECONGRESO DE COPAE – UGEL 03',
    lema: '«Mi voz, mi propuesta»'
  });

  y += 2;

  // Cuerpo de la tabla de consolidado
  const body = filas.map(f => {
    const esGanador = f.puesto === 1 && f.puntajeTotal !== null && f.puntajeTotal > 0;
    const esTop7 = f.puesto <= COPAE_CONFIG.cuposSiguienteRonda && f.puntajeTotal !== null && f.puntajeTotal > 0;

    let estiloFila = { textColor: RGB_COPAE.gris800 };
    if (esGanador) {
      estiloFila = { fillColor: RGB_COPAE.verdeBg, fontStyle: 'bold', textColor: RGB_COPAE.verde };
    } else if (esTop7) {
      estiloFila = { fillColor: RGB_COPAE.azulBg, fontStyle: 'bold', textColor: RGB_COPAE.azul };
    }

    const pj1 = f.puntajeJ1 !== null ? String(f.puntajeJ1) : (f.evJ1?.esNsp ? '0 (NSP)' : '—');
    const pj2 = f.puntajeJ2 !== null ? String(f.puntajeJ2) : (f.evJ2?.esNsp ? '0 (NSP)' : '—');
    const pTotal = f.puntajeTotal !== null ? String(f.puntajeTotal) : '—';
    const puestoTxt = f.puntajeTotal !== null ? `${f.puesto}.°` : '—';

    let clasificacionTxt = f.estadoClasificacion || '';
    if (esGanador) clasificacionTxt = '1.° PUESTO (GANADOR)';
    else if (esTop7) clasificacionTxt = 'CLASIFICADO (TOP 7)';

    return [
      { content: String(f.puesto || f.ordenInicial), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: f.nombreCeba, styles: { fontStyle: esGanador ? 'bold' : 'normal' } },
      { content: pj1, styles: { halign: 'center' } },
      { content: pj2, styles: { halign: 'center' } },
      { content: pTotal, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8.5 } },
      { content: puestoTxt, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: clasificacionTxt, styles: { fontStyle: 'bold', fontSize: 6.8, halign: 'center' } }
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'grid',
    head: [[
      'N.°',
      'CEBA',
      'Jurado 1',
      'Jurado 2',
      'Puntaje total',
      'Puesto',
      'Resultado'
    ]],
    headStyles: {
      fillColor: RGB_COPAE.navy2,
      textColor: RGB_COPAE.blanco,
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      font: 'Arial',
      fontSize: 6.8,
      cellPadding: 1.2,
      overflow: 'linebreak',
      lineColor: RGB_COPAE.gris300,
      textColor: RGB_COPAE.gris800
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 70 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 22 },
      5: { cellWidth: 16 },
      6: { cellWidth: 30 }
    },
    body
  });

  y = doc.lastAutoTable.finalY + 4;

  // Observación final del jurado
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...RGB_COPAE.navy2);
  doc.text('OBSERVACIÓN FINAL DEL JURADO', M.left, y);
  y += 2.5;

  const obsFinalTexto = observacionFinal && observacionFinal.trim() !== ''
    ? observacionFinal.trim()
    : 'Los jurados evaluadores dejan constancia de la conformidad de los puntajes asignados a las propuestas estudiantiles de los CEBAs participantes.';

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'plain',
    body: [
      [
        {
          content: obsFinalTexto,
          styles: {
            font: 'Arial',
            fontSize: 7.6,
            textColor: RGB_COPAE.gris800,
            fillColor: RGB_COPAE.gris50,
            cellPadding: 2.2,
            minCellHeight: 12,
            lineWidth: 0.2,
            lineColor: RGB_COPAE.gris300
          }
        }
      ]
    ]
  });

  y = doc.lastAutoTable.finalY + 22;

  // Bloque simétrico de 2 Firmas Oficiales
  const anchoMitad = W / 2;
  const cx1 = M.left + anchoMitad / 2;
  const cx2 = M.left + anchoMitad + anchoMitad / 2;

  dibujarFirmaJurado(doc, {
    cx: cx1,
    y,
    firmante: firmantes[0],
    numeroJurado: 1
  });

  dibujarFirmaJurado(doc, {
    cx: cx2,
    y,
    firmante: firmantes[1],
    numeroJurado: 2
  });

  aplicarPieCOPAE(doc, { preliminar });
  return doc;
}

/**
 * 3. Descarga Masiva: Genera un solo PDF continuo con todas las Fichas de Evaluación.
 */
export async function generarTodasFichasCOPAEPDF({
  cebas = [],
  evaluaciones = [],
  panel = null,
  numeroJurado = null // Si es null, incluye Jurado 1 y Jurado 2
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  const banner = await obtenerMembreteCOPAE();
  const preliminar = esPreliminarCOPAE(panel);
  const evalMap = new Map();
  evaluaciones.forEach(ev => {
    if (ev && ev.cebaId && ev.numeroJurado) {
      evalMap.set(`${ev.cebaId}__J${ev.numeroJurado}`, ev);
    }
  });

  const slots = numeroJurado ? [Number(numeroJurado)] : [1, 2];
  let esPrimeraPagina = true;

  for (const slot of slots) {
    const firmante = firmanteDelCasilleroCOPAE(panel, slot);

    for (const ceba of cebas) {
      if (!esPrimeraPagina) {
        doc.addPage([A4.ancho, A4.alto], 'portrait');
      }
      esPrimeraPagina = false;

      const ev = evalMap.get(`${ceba.id}__J${slot}`) || {};
      const esNsp = Boolean(ev.esNsp);
      const puntajeTotal = calcularPuntajeFicha(ev.puntajes || {}, esNsp);
      const fechaTexto = ev.fecha || COPAE_CONFIG.fechaPorDefecto;

      let y = drawChromeCOPAE(doc, {
        orientacion: 'portrait',
        banner,
        titulo: `INSTRUMENTO DE EVALUACIÓN — JURADO ${slot}`,
        subtitulo: 'PRECONGRESO DE COPAE – UGEL 03',
        lema: '«Mi voz, mi propuesta»'
      });

      // Datos Generales
      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'grid',
        styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2, lineColor: RGB_COPAE.gris300, textColor: RGB_COPAE.gris800 },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold', fillColor: RGB_COPAE.gris100, textColor: RGB_COPAE.navy2 },
          1: { cellWidth: W - 28 - 24 - 36 },
          2: { cellWidth: 24, fontStyle: 'bold', fillColor: RGB_COPAE.gris100, textColor: RGB_COPAE.navy2 },
          3: { cellWidth: 36, halign: 'center' }
        },
        body: [
          [
            { content: 'CEBA' },
            { content: `${ceba?.nombre || 'CEBA'}${ceba?.codigoModular ? ` (Cód. Modular: ${ceba.codigoModular})` : ''}`, styles: { fontStyle: 'bold', textColor: RGB_COPAE.navy1 } },
            { content: 'Fecha' },
            { content: fechaTexto }
          ]
        ]
      });

      y = doc.lastAutoTable.finalY + 4;

      doc.setFont('Arial', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...RGB_COPAE.navy2);
      doc.text('I. CRITERIOS DE EVALUACIÓN', M.left, y);
      y += 3;

      const wNum = 8;
      const wCriterio = 36;
      const wPuntaje = 18;
      const wNivel = (W - wNum - wCriterio - wPuntaje) / 4;

      const puntajes = ev.puntajes || {};
      const tableBody = [];

      if (esNsp) {
        tableBody.push([
          {
            content: 'INCOMPARECENCIA (NSP) — EL CEBA NO SE PRESENTÓ A LA EVALUACIÓN (VALORACIÓN: 0 PUNTOS)',
            colSpan: 7,
            styles: { halign: 'center', fontStyle: 'bold', textColor: RGB_COPAE.rojo, fillColor: RGB_COPAE.gris100 }
          }
        ]);
      }

      CRITERIOS_EVALUACION_COPAE.forEach(c => {
        const valSel = esNsp ? 0 : Number(puntajes[c.id] || 0);

        const estiloNivel = (nivel) => {
          const seleccionado = valSel === nivel;
          return {
            fillColor: seleccionado ? RGB_COPAE.azulBg : RGB_COPAE.blanco,
            fontStyle: seleccionado ? 'bold' : 'normal',
            textColor: seleccionado ? RGB_COPAE.azul : RGB_COPAE.gris800
          };
        };

        tableBody.push([
          { content: String(c.numero), styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB_COPAE.gris50 } },
          { content: c.nombre, styles: { fontStyle: 'bold', fillColor: RGB_COPAE.gris50 } },
          { content: c.descriptores[4], styles: estiloNivel(4) },
          { content: c.descriptores[3], styles: estiloNivel(3) },
          { content: c.descriptores[2], styles: estiloNivel(2) },
          { content: c.descriptores[1], styles: estiloNivel(1) },
          {
            content: valSel > 0 ? String(valSel) : (esNsp ? '0' : '—'),
            styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10.5, textColor: RGB_COPAE.navy2, fillColor: RGB_COPAE.gris50 }
          }
        ]);
      });

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'grid',
        head: [['N.°', 'Criterio', '4 – Destacado', '3 – Logrado', '2 – En proceso', '1 – Inicio', 'Puntaje']],
        headStyles: { fillColor: RGB_COPAE.navy2, textColor: RGB_COPAE.blanco, fontStyle: 'bold', fontSize: 7.2, halign: 'center', valign: 'middle' },
        styles: { font: 'Arial', fontSize: 6.8, cellPadding: 1.4, overflow: 'linebreak', lineColor: RGB_COPAE.gris300, textColor: RGB_COPAE.gris800 },
        columnStyles: {
          0: { cellWidth: wNum },
          1: { cellWidth: wCriterio },
          2: { cellWidth: wNivel },
          3: { cellWidth: wNivel },
          4: { cellWidth: wNivel },
          5: { cellWidth: wNivel },
          6: { cellWidth: wPuntaje }
        },
        body: tableBody
      });

      y = doc.lastAutoTable.finalY + 3;

      doc.setFont('Arial', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...RGB_COPAE.gris700);
      doc.text('Escala de valoración: 4 = Destacado | 3 = Logrado | 2 = En proceso | 1 = Inicio. Puntaje máximo: 20 puntos.', M.left, y);
      y += 5.5;

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'plain',
        body: [
          [
            {
              content: `Puntaje final del estudiante:  ${puntajeTotal} / ${COPAE_CONFIG.puntajeMaximoPorJurado} puntos${esNsp ? ' (INCOMPARECENCIA - NSP)' : ''}`,
              styles: { font: 'Arial', fontStyle: 'bold', fontSize: 10, textColor: RGB_COPAE.navy1, fillColor: RGB_COPAE.gris100, halign: 'left', cellPadding: 2.5, lineWidth: 0.3, lineColor: RGB_COPAE.gris300 }
            }
          ]
        ]
      });

      y = doc.lastAutoTable.finalY + 5;

      doc.setFont('Arial', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...RGB_COPAE.navy2);
      doc.text('Observaciones del Jurado (opcional)', M.left, y);
      y += 2.5;

      const obsTexto = ev.observaciones && ev.observaciones.trim() !== ''
        ? ev.observaciones.trim()
        : 'Sin observaciones adicionales.';

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'plain',
        body: [[{ content: obsTexto, styles: { font: 'Arial', fontSize: 7.8, textColor: RGB_COPAE.gris800, fillColor: RGB_COPAE.gris50, cellPadding: 2.2, minCellHeight: 12, lineWidth: 0.2, lineColor: RGB_COPAE.gris300 } }]]
      });

      y = doc.lastAutoTable.finalY + 22;

      dibujarFirmaJurado(doc, {
        cx: A4.ancho / 2,
        y,
        firmante,
        numeroJurado: slot
      });
    }
  }

  aplicarPieCOPAE(doc, { preliminar });
  return doc;
}

/**
 * 4. Paquete Completo: Consolidado Oficial en la primera hoja + todas las Fichas de Evaluación.
 */
export async function generarPaqueteCompletoCOPAEPDF({
  cebas = [],
  evaluaciones = [],
  filasConsolidado = [],
  observacionFinal = '',
  panel = null
}) {
  const doc = await generarConsolidadoCOPAEPDF({
    filas: filasConsolidado,
    observacionFinal,
    panel
  });

  const banner = await obtenerMembreteCOPAE();
  const preliminar = esPreliminarCOPAE(panel);
  const evalMap = new Map();
  evaluaciones.forEach(ev => {
    if (ev && ev.cebaId && ev.numeroJurado) {
      evalMap.set(`${ev.cebaId}__J${ev.numeroJurado}`, ev);
    }
  });

  const slots = [1, 2];

  for (const slot of slots) {
    const firmante = firmanteDelCasilleroCOPAE(panel, slot);

    for (const ceba of cebas) {
      doc.addPage([A4.ancho, A4.alto], 'portrait');

      const ev = evalMap.get(`${ceba.id}__J${slot}`) || {};
      const esNsp = Boolean(ev.esNsp);
      const puntajeTotal = calcularPuntajeFicha(ev.puntajes || {}, esNsp);
      const fechaTexto = ev.fecha || COPAE_CONFIG.fechaPorDefecto;

      let y = drawChromeCOPAE(doc, {
        orientacion: 'portrait',
        banner,
        titulo: `INSTRUMENTO DE EVALUACIÓN — JURADO ${slot}`,
        subtitulo: 'PRECONGRESO DE COPAE – UGEL 03',
        lema: '«Mi voz, mi propuesta»'
      });

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'grid',
        styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2, lineColor: RGB_COPAE.gris300, textColor: RGB_COPAE.gris800 },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: 'bold', fillColor: RGB_COPAE.gris100, textColor: RGB_COPAE.navy2 },
          1: { cellWidth: W - 28 - 24 - 36 },
          2: { cellWidth: 24, fontStyle: 'bold', fillColor: RGB_COPAE.gris100, textColor: RGB_COPAE.navy2 },
          3: { cellWidth: 36, halign: 'center' }
        },
        body: [
          [
            { content: 'CEBA' },
            { content: `${ceba?.nombre || 'CEBA'}${ceba?.codigoModular ? ` (Cód. Modular: ${ceba.codigoModular})` : ''}`, styles: { fontStyle: 'bold', textColor: RGB_COPAE.navy1 } },
            { content: 'Fecha' },
            { content: fechaTexto }
          ]
        ]
      });

      y = doc.lastAutoTable.finalY + 4;

      doc.setFont('Arial', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...RGB_COPAE.navy2);
      doc.text('I. CRITERIOS DE EVALUACIÓN', M.left, y);
      y += 3;

      const wNum = 8;
      const wCriterio = 36;
      const wPuntaje = 18;
      const wNivel = (W - wNum - wCriterio - wPuntaje) / 4;

      const puntajes = ev.puntajes || {};
      const tableBody = [];

      if (esNsp) {
        tableBody.push([
          {
            content: 'INCOMPARECENCIA (NSP) — EL CEBA NO SE PRESENTÓ A LA EVALUACIÓN (VALORACIÓN: 0 PUNTOS)',
            colSpan: 7,
            styles: { halign: 'center', fontStyle: 'bold', textColor: RGB_COPAE.rojo, fillColor: RGB_COPAE.gris100 }
          }
        ]);
      }

      CRITERIOS_EVALUACION_COPAE.forEach(c => {
        const valSel = esNsp ? 0 : Number(puntajes[c.id] || 0);

        const estiloNivel = (nivel) => {
          const seleccionado = valSel === nivel;
          return {
            fillColor: seleccionado ? RGB_COPAE.azulBg : RGB_COPAE.blanco,
            fontStyle: seleccionado ? 'bold' : 'normal',
            textColor: seleccionado ? RGB_COPAE.azul : RGB_COPAE.gris800
          };
        };

        tableBody.push([
          { content: String(c.numero), styles: { halign: 'center', fontStyle: 'bold', fillColor: RGB_COPAE.gris50 } },
          { content: c.nombre, styles: { fontStyle: 'bold', fillColor: RGB_COPAE.gris50 } },
          { content: c.descriptores[4], styles: estiloNivel(4) },
          { content: c.descriptores[3], styles: estiloNivel(3) },
          { content: c.descriptores[2], styles: estiloNivel(2) },
          { content: c.descriptores[1], styles: estiloNivel(1) },
          {
            content: valSel > 0 ? String(valSel) : (esNsp ? '0' : '—'),
            styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10.5, textColor: RGB_COPAE.navy2, fillColor: RGB_COPAE.gris50 }
          }
        ]);
      });

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'grid',
        head: [['N.°', 'Criterio', '4 – Destacado', '3 – Logrado', '2 – En proceso', '1 – Inicio', 'Puntaje']],
        headStyles: { fillColor: RGB_COPAE.navy2, textColor: RGB_COPAE.blanco, fontStyle: 'bold', fontSize: 7.2, halign: 'center', valign: 'middle' },
        styles: { font: 'Arial', fontSize: 6.8, cellPadding: 1.4, overflow: 'linebreak', lineColor: RGB_COPAE.gris300, textColor: RGB_COPAE.gris800 },
        columnStyles: {
          0: { cellWidth: wNum },
          1: { cellWidth: wCriterio },
          2: { cellWidth: wNivel },
          3: { cellWidth: wNivel },
          4: { cellWidth: wNivel },
          5: { cellWidth: wNivel },
          6: { cellWidth: wPuntaje }
        },
        body: tableBody
      });

      y = doc.lastAutoTable.finalY + 3;

      doc.setFont('Arial', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...RGB_COPAE.gris700);
      doc.text('Escala de valoración: 4 = Destacado | 3 = Logrado | 2 = En proceso | 1 = Inicio. Puntaje máximo: 20 puntos.', M.left, y);
      y += 5.5;

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'plain',
        body: [
          [
            {
              content: `Puntaje final del estudiante:  ${puntajeTotal} / ${COPAE_CONFIG.puntajeMaximoPorJurado} puntos${esNsp ? ' (INCOMPARECENCIA - NSP)' : ''}`,
              styles: { font: 'Arial', fontStyle: 'bold', fontSize: 10, textColor: RGB_COPAE.navy1, fillColor: RGB_COPAE.gris100, halign: 'left', cellPadding: 2.5, lineWidth: 0.3, lineColor: RGB_COPAE.gris300 }
            }
          ]
        ]
      });

      y = doc.lastAutoTable.finalY + 5;

      doc.setFont('Arial', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...RGB_COPAE.navy2);
      doc.text('Observaciones del Jurado (opcional)', M.left, y);
      y += 2.5;

      const obsTexto = ev.observaciones && ev.observaciones.trim() !== ''
        ? ev.observaciones.trim()
        : 'Sin observaciones adicionales.';

      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right },
        tableWidth: W,
        theme: 'plain',
        body: [[{ content: obsTexto, styles: { font: 'Arial', fontSize: 7.8, textColor: RGB_COPAE.gris800, fillColor: RGB_COPAE.gris50, cellPadding: 2.2, minCellHeight: 12, lineWidth: 0.2, lineColor: RGB_COPAE.gris300 } }]]
      });

      y = doc.lastAutoTable.finalY + 22;

      dibujarFirmaJurado(doc, {
        cx: A4.ancho / 2,
        y,
        firmante,
        numeroJurado: slot
      });
    }
  }

  aplicarPieCOPAE(doc, { preliminar });
  return doc;
}
