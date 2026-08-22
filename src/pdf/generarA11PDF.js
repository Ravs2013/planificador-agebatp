/* ═══════════════════════════════════════════════════════════════
   GENERADOR PDF — D3 ANEXO A11 ACTA DE RESULTADOS JUEGOS FLORALES JFEN 2026
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, aplicarFuentesArial, drawChrome } from './membrete';
import { mesEnLetras } from '../utils/juegosFloralesHelpers';

export function generarA11PDF(acta, bannerDataURL) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  // 1. Chrome / Membrete
  drawChrome(doc, { conMembreteCompleto: false, banner: bannerDataURL });

  let y = 32;

  // 2. Título Oficial
  doc.setFont('Arial', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 34, 64);
  doc.text('ANEXO A11 — ACTA DE RESULTADOS', M.pageW / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(10);
  doc.text('JUEGOS FLORALES ESCOLARES NACIONALES 2026', M.pageW / 2, y, { align: 'center' });
  y += 8;

  // Parsing de la fecha
  const fechaPartes = (acta.fecha || '2026-08-20').split('-');
  const anio = fechaPartes[0] || '2026';
  const mesNum = parseInt(fechaPartes[1] || '8', 10);
  const dia = parseInt(fechaPartes[2] || '20', 10);
  const mesNombre = mesEnLetras(mesNum);

  const region = acta.region || 'Lima';
  const provincia = acta.provincia || 'Lima';
  const distrito = acta.distrito || 'Pueblo Libre';
  const hora = acta.hora || '17:00';
  const etapa = acta.etapa || 'UGEL';
  const cat = acta.categoria || '';
  const disc = acta.disciplinaLabel || acta.disciplinaId || '';

  // 3. Párrafo Normativo Oficial
  doc.setFont('Arial', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const parrafo = `En la región de ${region}, provincia de ${provincia}, distrito de ${distrito}, con fecha ${dia} de ${mesNombre} de ${anio}, a las ${hora} horas, durante el proceso de evaluación de los Juegos Florales Escolares Nacionales de la etapa ${etapa}, de la categoría ${cat}, de la disciplina ${disc} el Jurado Calificador, conformado por las siguientes personalidades:`;

  const lineasParrafo = doc.splitTextToSize(parrafo, CONTENT_W);
  doc.text(lineasParrafo, M.left, y, { maxWidth: CONTENT_W, align: 'justify', lineHeightFactor: 1.35 });
  y += lineasParrafo.length * 4.8 + 4;

  // 4. Lista de Jurados Numerados
  const jurados = acta.jurados || [];
  doc.setFont('Arial', 'bold');

  for (let i = 0; i < 3; i++) {
    const j = jurados[i] || {};
    const nom = j.nombreCompleto ? j.nombreCompleto.toUpperCase() : '────────';
    const dni = j.dni ? ` (DNI ${j.dni})` : '';
    doc.text(`${i + 1}. ${nom}${dni}`, M.left + 8, y);
    y += 5;
  }
  y += 2;

  // Frase de transición
  doc.setFont('Arial', 'normal');
  doc.text('Efectúa la calificación, en coherencia con las bases, procediéndose a declarar lo siguiente:', M.left, y);
  y += 6;

  // 5. Tabla de Resultados (Columnas oficiales)
  const inclPuntaje = !!acta.incluirPuntaje;
  const headCols = ['Orden de mérito', 'I. E.', 'UGEL', 'DRE/GRE', 'Nombre del trabajo'];
  if (inclPuntaje) {
    headCols.push('Puntaje total');
  }

  const tableBody = (acta.resultados || []).map(r => {
    const row = [
      r.ordenMerito || `${r.puesto}.°`,
      r.institucion || '—',
      r.ugel || 'UGEL 03',
      r.dre || 'DRE LIMA METROPOLITANA',
      r.nombreTrabajo || 'Sin título registrado'
    ];
    if (inclPuntaje) {
      row.push(r.puntajeTotal != null ? String(r.puntajeTotal) : '—');
    }
    return row;
  });

  const colWidths = inclPuntaje ? {
    0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 'auto' },
    2: { cellWidth: 24, halign: 'center' },
    3: { cellWidth: 36, halign: 'center' },
    4: { cellWidth: 'auto' },
    5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
  } : {
    0: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
    1: { cellWidth: 'auto' },
    2: { cellWidth: 26, halign: 'center' },
    3: { cellWidth: 40, halign: 'center' },
    4: { cellWidth: 'auto' }
  };

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    head: [headCols],
    headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    styles: { font: 'Arial', fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: colWidths,
    body: tableBody
  });

  y = doc.lastAutoTable.finalY + 12;

  // Si no entra el bloque de firmas
  if (y > 235) {
    doc.addPage();
    drawChrome(doc, { conMembreteCompleto: false, banner: bannerDataURL });
    y = 50;
  }

  // 6. Bloque de 3 Firmas al pie
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 34, 64);
  doc.text('FIRMAS DEL JURADO CALIFICADOR', M.left, y);
  y += 6;

  const j1 = jurados[0] || {};
  const j2 = jurados[1] || {};
  const j3 = jurados[2] || {};

  const col1X = M.left + 5;
  const col2X = M.left + 85;
  const col3X = M.pageW / 2 - 35;

  const renderJuradoBoxA11 = (x, yPos, jData, num) => {
    if (jData.firmaDataUrl) {
      try {
        doc.addImage(jData.firmaDataUrl, 'PNG', x + 15, yPos, 35, 12);
      } catch (e) {
        console.warn("Firma err A11:", e);
      }
    }
    const boxY = yPos + 13;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(x, boxY, x + 65, boxY);

    doc.setFont('Arial', 'bold');
    doc.setFontSize(8);
    doc.text(`Jurado ${num}: ${(jData.nombreCompleto || '────────').toUpperCase()}`, x + 32.5, boxY + 3.5, { align: 'center' });

    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.5);
    doc.text(`DNI: ${jData.dni || '────────'}`, x + 32.5, boxY + 7, { align: 'center' });
  };

  renderJuradoBoxA11(col1X, y, j1, 1);
  renderJuradoBoxA11(col2X, y, j2, 2);

  y += 24;

  renderJuradoBoxA11(col3X, y, j3, 3);

  // 7. Pie institucional en todas las páginas
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Bases Específicas JFEN 2026 — RVM N.° 106-2026-MINEDU — Etapa UGEL, Comunicado 01 — UGEL 03`,
      M.pageW / 2,
      288,
      { align: 'center' }
    );
  }

  const fileName = `AnexoA11_Acta_${acta.disciplinaId}_${acta.categoria}_UGEL.pdf`;
  doc.save(fileName);
}
