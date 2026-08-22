/* ═══════════════════════════════════════════════════════════════
   GENERADOR PDF — D2 ANEXO A10 CONSOLIDADO JUEGOS FLORALES JFEN 2026
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarFuentesArial } from './membrete';

export function generarA10PDF(consolidado, bannerDataURL) {
  // A4 Landscape (297 x 210 mm)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  const pageW = 297;
  const pageH = 210;
  const marginLeft = 15;
  const marginRight = 15;
  const contentW = pageW - marginLeft - marginRight; // 267 mm

  let y = 12;

  // Banner en Landscape si existe
  if (bannerDataURL) {
    try {
      const format = typeof bannerDataURL === 'string' && bannerDataURL.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(bannerDataURL, format, marginLeft, 8, contentW, contentW / 12);
      y = 34;
    } catch (e) {
      console.warn("Error agregando banner a A10 PDF:", e);
      y = 18;
    }
  }

  // Título oficial
  doc.setFont('Arial', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(18, 34, 64);
  doc.text('ANEXO A10 — FORMATO CONSOLIDADO DE EVALUACIÓN', pageW / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(10);
  doc.text('JUEGOS FLORALES ESCOLARES NACIONALES 2026', pageW / 2, y, { align: 'center' });
  y += 6;

  // Bloque de metadatos del encabezado
  doc.setFont('Arial', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const lugarStr = `${consolidado.region || 'Lima'}/${consolidado.provincia || 'Lima'}/${consolidado.distrito || 'Pueblo Libre'}`;
  const discStr = `${consolidado.disciplinaLabel || consolidado.disciplinaId || ''}`;
  const catStr = `${consolidado.categoria || ''}`;
  const fechaStr = `${consolidado.fecha || ''}`;

  doc.text(`Etapa: ${consolidado.etapa || 'UGEL'}`, marginLeft, y);
  doc.text(`Lugar (región/provincia/distrito): ${lugarStr}`, pageW / 2 - 20, y);
  y += 4;

  doc.text(`Disciplina: ${discStr}`, marginLeft, y);
  doc.text(`Categoría: ${catStr}`, pageW / 2 - 20, y);
  doc.text(`Fecha: ${fechaStr}`, pageW - marginRight - 40, y);
  y += 6;

  // Tabla Consolidada (7 columnas oficiales u opcionales)
  const incluirOpcionales = Boolean(consolidado.mostrarOpcionales);

  const tableHead = incluirOpcionales
    ? [['Código', 'DRE/UGEL', 'I. E.', 'Título de obra', 'Seudónimo', 'J1', 'J2', 'J3', 'Total', 'Prom.', 'Puesto']]
    : [['DRE/UGEL', 'I. E.', 'Jurado 1', 'Jurado 2', 'Jurado 3', 'Total', 'Puesto']];

  const tableBody = (consolidado.filas || []).map(f => {
    if (incluirOpcionales) {
      return [
        f.codigoParticipante || f.codigo || '—',
        f.dreUgel || 'DRE LIMA METROPOLITANA / UGEL 03',
        f.institucion || '—',
        f.tituloObra || '—',
        f.seudonimo || '—',
        f.jurado1 != null ? String(f.jurado1) : '—',
        f.jurado2 != null ? String(f.jurado2) : '—',
        f.jurado3 != null ? String(f.jurado3) : '—',
        f.total != null ? String(f.total) : '—',
        f.promedio != null ? String(f.promedio) : '—',
        f.puesto ? `${f.puesto}.°` : '—'
      ];
    } else {
      return [
        f.dreUgel || 'DRE LIMA METROPOLITANA / UGEL 03',
        f.institucion || '—',
        f.jurado1 != null ? String(f.jurado1) : '—',
        f.jurado2 != null ? String(f.jurado2) : '—',
        f.jurado3 != null ? String(f.jurado3) : '—',
        f.total != null ? String(f.total) : '—',
        f.puesto ? `${f.puesto}.°` : '—'
      ];
    }
  });

  const columnStyles = incluirOpcionales ? {
    0: { cellWidth: 26 },
    1: { cellWidth: 35 },
    2: { cellWidth: 'auto' },
    3: { cellWidth: 35 },
    4: { cellWidth: 25 },
    5: { cellWidth: 12, halign: 'center' },
    6: { cellWidth: 12, halign: 'center' },
    7: { cellWidth: 12, halign: 'center' },
    8: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    9: { cellWidth: 14, halign: 'center' },
    10: { cellWidth: 14, halign: 'center', fontStyle: 'bold' }
  } : {
    0: { cellWidth: 55 },
    1: { cellWidth: 'auto' },
    2: { cellWidth: 22, halign: 'center' },
    3: { cellWidth: 22, halign: 'center' },
    4: { cellWidth: 22, halign: 'center' },
    5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
    6: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
  };

  autoTable(doc, {
    startY: y,
    margin: { left: marginLeft, right: marginRight },
    tableWidth: contentW,
    theme: 'grid',
    head: tableHead,
    headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    columnStyles,
    body: tableBody,
    didParseCell: function(data) {
      const puestoIdx = incluirOpcionales ? 10 : 6;
      if (data.section === 'body' && data.row.raw[puestoIdx] && (data.row.raw[puestoIdx] === '1.°' || data.row.raw[puestoIdx] === '2.°' || data.row.raw[puestoIdx] === '3.°')) {
        data.cell.styles.fillColor = [241, 245, 249];
      }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Si no cabe el bloque de firmas, pasar de página
  if (y > 165) {
    doc.addPage();
    y = 30;
  }

  // Sustento de desempate si se aplicó
  if (consolidado.criterioDesempate) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text(`Criterio de desempate aplicado: ${consolidado.criterioDesempate}`, marginLeft, y);
    y += 6;
  }

  // Bloque de 3 Firmas (Jurado 1 y 2 arriba lado a lado, Jurado 3 abajo)
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 34, 64);
  doc.text('FIRMAS DEL JURADO CALIFICADOR', marginLeft, y);
  y += 6;

  const jurados = consolidado.jurados || [];
  const j1 = jurados[0] || {};
  const j2 = jurados[1] || {};
  const j3 = jurados[2] || {};

  const col1X = marginLeft + 25;
  const col2X = pageW - marginRight - 105;
  const col3X = pageW / 2 - 40;

  // Fila 1: Jurado 1 y Jurado 2
  const renderJuradoBox = (x, yPos, jData, num) => {
    if (jData.firmaDataUrl) {
      try {
        doc.addImage(jData.firmaDataUrl, 'PNG', x + 20, yPos, 35, 12);
      } catch (e) {
        console.warn("Firma err:", e);
      }
    }
    const boxY = yPos + 13;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(x, boxY, x + 80, boxY);

    doc.setFont('Arial', 'bold');
    doc.setFontSize(8);
    doc.text(`Jurado ${num}: ${jData.nombreCompleto || '────────'}`, x + 40, boxY + 3.5, { align: 'center' });

    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.5);
    doc.text(`DNI: ${jData.dni || '────────'}`, x + 40, boxY + 7, { align: 'center' });
  };

  renderJuradoBox(col1X, y, j1, 1);
  renderJuradoBox(col2X, y, j2, 2);

  y += 24;

  // Fila 2: Jurado 3 centrado
  renderJuradoBox(col3X, y, j3, 3);

  // Pie de página oficial
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Bases Específicas JFEN 2026 — RVM N.° 106-2026-MINEDU — Etapa UGEL, Comunicado 01 — UGEL 03`,
      pageW / 2,
      202,
      { align: 'center' }
    );
  }

  const fileName = `AnexoA10_${consolidado.disciplinaId}_${consolidado.categoria}_UGEL.pdf`;
  doc.save(fileName);
}
