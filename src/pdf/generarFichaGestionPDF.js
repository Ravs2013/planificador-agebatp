import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_BOTTOM, aplicarFuentesArial, drawChrome } from './membrete';
import { FICHA_GESTION_ITEMS } from '../data/fichaGestionItems';

/**
 * Genera el PDF de la Ficha de Monitoreo y Acompañamiento a la Gestión en ETP.
 * Copia fiel del instrumento oficial para directores.
 */
export function generarFichaGestionPDF(fichaData, bannerDataURL) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let pageCount = 0;
  const setupPage = () => {
    drawChrome(doc, { conMembreteCompleto: false, banner: bannerDataURL });
    pageCount++;
  };

  setupPage();

  const marginConfig = {
    top: 34,
    left: M.left,
    right: M.right,
    bottom: 18
  };

  // Slogan
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('"Año de la Esperanza y el Fortalecimiento de la Democracia"', M.pageW / 2, 32, { align: "center" });
  doc.setTextColor(0);

  let y = 38;

  // Title
  doc.setFont("Arial", "bold");
  doc.setFontSize(11);
  const title1 = "FICHA DE MONITOREO Y ACOMPAÑAMIENTO A LA GESTIÓN EN ETP";
  const title2 = "DECRETO SUPREMO N°004-2019-MINEDU - RESOLUCIÓN VICEMINISTERIAL N°188-2020-MINEDU";
  doc.text(title1, M.pageW / 2, y, { align: "center" });
  y += 4.5;
  doc.setFont("Arial", "normal");
  doc.setFontSize(8);
  doc.text(title2, M.pageW / 2, y, { align: "center" });
  y += 6;

  const pageBottomLimit = BODY_BOTTOM;

  // ── I. DATOS GENERALES DEL CETPRO ──
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("I. DATOS GENERALES DEL CETPRO:", M.left, y);
  y += 4;

  const cetpro = fichaData.cetpro || {};
  const of = cetpro.ofertaFormativa || {};
  const ofText = `AT [${of.AT ? 'X' : ' '}]    T [${of.T ? 'X' : ' '}]    PFC [${of.PFC ? 'X' : ' '}]`;

  const rawFecha = cetpro.fecha || '';
  let dia = '', mes = '', anio = '2026';
  if (rawFecha) {
    const parts = rawFecha.split('-');
    if (parts.length === 3) {
      dia = parts[2];
      mes = parts[1];
      anio = parts[0];
    }
  }

  const tab1 = [
    ['Código Modular', cetpro.codigoModular || '', 'Fecha', `Día: ${dia}  Mes: ${mes}  Año: ${anio}`],
    ['Nombre del CETPRO', cetpro.nombre || '', 'N° de Visita', cetpro.nVisita || '1'],
    ['Distrito', cetpro.distrito || '', 'Hora', `Inicio: ${cetpro.horaInicio || '09:00'}  Término: ${cetpro.horaTermino || '12:00'}`],
    ['UGEL', cetpro.ugel || '03', 'REI', cetpro.rei || ''],
    ['Oferta formativa del CETPRO', { content: ofText, colSpan: 3 }]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.8, textColor: [0, 0, 0] },
    body: tab1,
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, fontStyle: 'bold', fillColor: [245, 245, 245] },
      3: { cellWidth: 50 }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // ── II. DATOS DEL MONITOR ──
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("II. DATOS DEL MONITOR:", M.left, y);
  y += 4;

  const monitor = fichaData.monitor || {};
  const tab2 = [
    ['Cargo', monitor.cargo || 'Especialista UGEL/DRE', 'Apellidos y Nombres', monitor.nombres || ''],
    ['DNI', monitor.dni || '', 'Teléfono celular N°', monitor.telefono || ''],
    ['Correo electrónico', { content: monitor.correo || '', colSpan: 3 }]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.8, textColor: [0, 0, 0] },
    body: tab2,
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: 45 },
      2: { cellWidth: 35, fontStyle: 'bold', fillColor: [245, 245, 245] },
      3: { cellWidth: 45 }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // ── III. DATOS DEL DIRECTIVO ──
  if (y > pageBottomLimit - 30) { doc.addPage(); setupPage(); y = 38; }
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("III. DATOS DEL DIRECTIVO:", M.left, y);
  y += 4;

  const dir = fichaData.directivo || {};
  const cond = dir.condicion || '';
  const condText = `Designado [${cond === 'Designado' ? 'X' : ' '}]  Encargado [${cond === 'Encargado' ? 'X' : ' '}]  Por Funciones [${cond === 'Encargado por funciones' ? 'X' : ' '}]`;

  const tab3 = [
    ['Apellidos y Nombres', dir.nombres || '', 'DNI', dir.dni || ''],
    ['Condición', { content: condText, colSpan: 3 }],
    ['N° Resolución', dir.nResolucion || '', 'Teléfono celular N°', dir.telefono || ''],
    ['Correo electrónico', { content: dir.correo || '', colSpan: 3 }]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.8, textColor: [0, 0, 0] },
    body: tab3,
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: 45 },
      2: { cellWidth: 35, fontStyle: 'bold', fillColor: [245, 245, 245] },
      3: { cellWidth: 45 }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // ── IV. INICIO DE LA OFERTA FORMATIVA ──
  if (y > pageBottomLimit - 25) { doc.addPage(); setupPage(); y = 38; }
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("IV. INICIO DE LA OFERTA FORMATIVA:", M.left, y);
  y += 4;

  const io = fichaData.inicioOferta || {};
  const io1 = io["2026-I"] || {};
  const io2 = io["2026-II"] || {};

  const tab4 = [
    ['Periodo', 'Fecha de inicio', 'Fecha de término'],
    ['2026-I', io1.inicio || '', io1.termino || ''],
    ['2026-II', io2.inicio || '', io2.termino || '']
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.8, textColor: [0, 0, 0], halign: 'center' },
    body: tab4,
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 }
    },
    willDrawCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = [240, 240, 240];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 6;

  // ── V. ÓRGANOS Y ASPECTOS (70 ÍTEMS) ──
  // We loop through aspects defined in FICHA_GESTION_ITEMS
  FICHA_GESTION_ITEMS.forEach((aspGroup, aIdx) => {
    if (y > pageBottomLimit - 35) { doc.addPage(); setupPage(); y = 38; }

    // Section Header
    doc.setFont("Arial", "bold");
    doc.setFontSize(9.5);
    doc.text(aspGroup.seccion + " — " + aspGroup.aspecto, M.left, y);
    y += 4.5;

    // Table compilation
    const headers = [['N°', 'Ítem de Monitoreo / Criterio a Evaluar', 'SÍ', 'NO', 'Evidencia / Observación']];
    const rows = [];

    // Map responses from fichaData.aspectos
    // The aspects keys are "01", "02", ..., "08"
    const aspKey = String(aIdx + 1).padStart(2, '0');
    const userAnswers = Array.isArray(fichaData.aspectos?.[aspKey]) ? fichaData.aspectos[aspKey] : [];

    aspGroup.items.forEach((itemObj) => {
      const uAns = userAnswers.find(u => u.item === itemObj.num) || {};
      const siVal = uAns.si === true ? 'X' : '';
      const noVal = uAns.no === true ? 'X' : '';
      const eviVal = uAns.evidencia || itemObj.evidencia || '';

      // Standard row
      rows.push([
        itemObj.num,
        itemObj.texto,
        siVal,
        noVal,
        eviVal
      ]);

      // If it has certificates sub-table (item 13)
      if (itemObj.isTableCertificados) {
        rows.push([
          { content: '[Tabla de Conteo de Certificados]', colSpan: 5, isTableCert: true }
        ]);
      }

      // If it has titles sub-table (item 21)
      if (itemObj.isTableTitulos) {
        rows.push([
          { content: '[Tabla de Conteo de Títulos]', colSpan: 5, isTableTitle: true }
        ]);
      }
    });

    autoTable(doc, {
      startY: y,
      margin: marginConfig,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 7, cellPadding: 2, textColor: [0, 0, 0], valign: 'middle' },
      headStyles: { fillColor: [254, 249, 195], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' }, // Cream background
      head: headers,
      body: rows,
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 87 },
        2: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 49 }
      },
      willDrawCell: (data) => {
        if (data.cell.raw && (data.cell.raw.isTableCert || data.cell.raw.isTableTitle)) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.minCellHeight = 28;
        }
      },
      didDrawCell: (data) => {
        if (data.cell.raw && data.cell.raw.isTableCert) {
          // Draw nested table for Certificados
          drawNestedConteoTable(doc, data.cell, fichaData.aspectos?.["02"]?.tablasConteo?.certificados);
        }
        if (data.cell.raw && data.cell.raw.isTableTitle) {
          // Draw nested table for Títulos
          drawNestedConteoTable(doc, data.cell, fichaData.aspectos?.["02"]?.tablasConteo?.titulos);
        }
      },
      rowPageBreak: 'avoid',
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });

    y = doc.lastAutoTable.finalY + 6;
  });

  // ── IX. RECOMENDACIONES O SUGERENCIAS ──
  if (y > pageBottomLimit - 30) { doc.addPage(); setupPage(); y = 38; }
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("IX. RECOMENDACIONES O SUGERENCIAS:", M.left, y);
  y += 4;
  doc.setFont("Arial", "normal");
  doc.setFontSize(8);
  const recText = fichaData.recomendaciones || '';
  if (recText) {
    const recLines = doc.splitTextToSize(recText, CONTENT_W);
    doc.text(recLines, M.left, y);
    y += recLines.length * 3.8 + 4;
  } else {
    doc.setDrawColor(180); doc.setLineWidth(0.15);
    for (let i = 0; i < 3; i++) {
      doc.line(M.left, y + (i * 6), M.left + CONTENT_W, y + (i * 6));
    }
    y += 20;
  }

  // ── X. COMPROMISOS ──
  if (y > pageBottomLimit - 30) { doc.addPage(); setupPage(); y = 38; }
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("X. COMPROMISOS:", M.left, y);
  y += 4;
  doc.setFont("Arial", "normal");
  doc.setFontSize(8);
  const comText = fichaData.compromisos || '';
  if (comText) {
    const comLines = doc.splitTextToSize(comText, CONTENT_W);
    doc.text(comLines, M.left, y);
    y += comLines.length * 3.8 + 4;
  } else {
    doc.setDrawColor(180); doc.setLineWidth(0.15);
    for (let i = 0; i < 3; i++) {
      doc.line(M.left, y + (i * 6), M.left + CONTENT_W, y + (i * 6));
    }
    y += 20;
  }

  // ── FIRMAS ──
  if (y > pageBottomLimit - 35) { doc.addPage(); setupPage(); y = 38; }
  y += 5;

  const sigWidth = 65;
  const sigLineY = y + 16;

  // Left signature (Director)
  const dirName = fichaData.firmaDirector?.nombre || dir.nombres || '';
  const dirDni = fichaData.firmaDirector?.dni || dir.dni || '';
  drawFirmaBlockSimple(doc, dirName, "DIRECTOR/A CETPRO", dirDni, fichaData.firmaDirectorDataUrl, M.left + 5 + (sigWidth / 2), sigLineY);

  // Right signature (Especialista)
  const espName = fichaData.firmaEspecialista?.nombre || monitor.nombres || '';
  const espDni = fichaData.firmaEspecialista?.dni || monitor.dni || '';
  drawFirmaBlockSimple(doc, espName, "ESPECIALISTA AGEBATP", espDni, fichaData.firmaEspecialistaDataUrl, M.pageW - M.right - (sigWidth / 2) - 5, sigLineY);

  // Save
  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');

  const cetproName = cetpro.nombre || 'CETPRO';
  const cetproClean = cetproName.replace(/[^a-zA-Z0-9_ -]/g, '_');
  const fechaSave = cetpro.fecha || 'Fecha';
  doc.save(`Ficha_Gestion_${cetproClean}_${fechaSave}.pdf`);

  return { blob, base64 };
}

/**
 * Dibuja un bloque de firma en una sola línea para DNI
 */
function drawFirmaBlockSimple(doc, name, cargo, dni, signatureDataURL, xCenter, yStart) {
  const sigWidth = 65;
  
  // Line
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(xCenter - (sigWidth / 2), yStart, xCenter + (sigWidth / 2), yStart);

  // Tactile signature image
  if (signatureDataURL) {
    try {
      doc.addImage(signatureDataURL, 'PNG', xCenter - 15, yStart - 14, 30, 13);
    } catch (e) {
      console.error("Error drawing signature in PDF:", e);
    }
  }

  // Texts
  doc.setFont("Arial", "bold");
  doc.setFontSize(8);
  doc.text(cargo, xCenter, yStart + 4, { align: 'center' });
  doc.setFont("Arial", "normal");
  doc.text(name, xCenter, yStart + 8, { align: 'center' });
  if (dni) {
    doc.text(`DNI: ${dni}`, xCenter, yStart + 12, { align: 'center' });
  }
}

/**
 * Dibuja la subtabla de conteo (certificados o títulos) dentro de la celda de autotable
 */
function drawNestedConteoTable(doc, cell, dataList) {
  // dataList structure is array: [ { prog: "Opciones Ocupacionales", y2024: 0, y2025: 0, y2026: 0, total: 0 }, ... ]
  // We fallback to empty counts if not provided
  const list = dataList || [
    { prog: "Opciones Ocupacionales", y2024: 0, y2025: 0, y2026: 0, total: 0 },
    { prog: "Especialidades", y2024: 0, y2025: 0, y2026: 0, total: 0 },
    { prog: "Programa de estudios Auxiliar técnico", y2024: 0, y2025: 0, y2026: 0, total: 0 },
    { prog: "Programa de estudios técnico", y2024: 0, y2025: 0, y2026: 0, total: 0 }
  ];

  // Draw headers
  const startX = cell.x + 2;
  let startY = cell.y + 2;
  const colWidths = [60, 20, 20, 20, 20]; // Total 140 mm width
  const rowHeight = 3.8;

  // Header row
  doc.setFillColor(235, 235, 235);
  doc.rect(startX, startY, 140, rowHeight, 'F');
  doc.setFont("Arial", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(0);
  doc.text("Detalle de Emisión", startX + 2, startY + 2.7);
  doc.text("2024", startX + 60 + 5, startY + 2.7);
  doc.text("2025", startX + 80 + 5, startY + 2.7);
  doc.text("2026", startX + 100 + 5, startY + 2.7);
  doc.text("Total", startX + 120 + 5, startY + 2.7);

  startY += rowHeight;

  let total2024 = 0, total2025 = 0, total2026 = 0, totalGlobal = 0;

  doc.setFont("Arial", "normal");
  list.forEach((row) => {
    doc.rect(startX, startY, 140, rowHeight);
    
    // Draw cells lines
    let cx = startX;
    colWidths.forEach((w) => {
      doc.rect(cx, startY, w, rowHeight);
      cx += w;
    });

    const rTotal = (row.y2024 || 0) + (row.y2025 || 0) + (row.y2026 || 0);

    doc.text(row.prog || '', startX + 2, startY + 2.7);
    doc.text(String(row.y2024 || 0), startX + 60 + 8, startY + 2.7);
    doc.text(String(row.y2025 || 0), startX + 80 + 8, startY + 2.7);
    doc.text(String(row.y2026 || 0), startX + 100 + 8, startY + 2.7);
    doc.setFont("Arial", "bold");
    doc.text(String(row.total || rTotal), startX + 120 + 8, startY + 2.7);
    doc.setFont("Arial", "normal");

    total2024 += (row.y2024 || 0);
    total2025 += (row.y2025 || 0);
    total2026 += (row.y2026 || 0);
    totalGlobal += (row.total || rTotal);

    startY += rowHeight;
  });

  // Total row
  doc.setFillColor(245, 245, 245);
  doc.rect(startX, startY, 140, rowHeight, 'F');
  doc.setFont("Arial", "bold");
  let cx = startX;
  colWidths.forEach((w) => {
    doc.rect(cx, startY, w, rowHeight);
    cx += w;
  });
  doc.text("TOTAL", startX + 2, startY + 2.7);
  doc.text(String(total2024), startX + 60 + 8, startY + 2.7);
  doc.text(String(total2025), startX + 80 + 8, startY + 2.7);
  doc.text(String(total2026), startX + 100 + 8, startY + 2.7);
  doc.text(String(totalGlobal), startX + 120 + 8, startY + 2.7);
  doc.setFont("Arial", "normal");
}
