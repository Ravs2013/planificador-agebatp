import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, aplicarFuentesArial, drawChrome } from './membrete';

/**
 * Sanitiza un DNI eliminando cualquier carácter que no sea dígito.
 */
function sanitizeDNI(dni) {
  return (dni || '').replace(/[^0-9]/g, '');
}

/**
 * Dibuja las 8 casillas del DNI centradas en una celda de tabla o área libre.
 */
function drawDNICells(doc, cell, dni) {
  const clean = sanitizeDNI(dni);
  const digits = clean.split('').slice(0, 8);
  while (digits.length < 8) digits.push('');

  const boxW = 2.8;
  const boxH = 2.8;
  const gap = 0.5;
  const totalW = (8 * boxW) + (7 * gap);

  const startX = cell.x + (cell.width - totalW) / 2;
  const startY = cell.y + (cell.height - boxH) / 2;

  doc.saveGraphicsState();
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.setFont("Arial", "bold");
  doc.setFontSize(7.5);

  for (let i = 0; i < 8; i++) {
    const x = startX + i * (boxW + gap);
    doc.rect(x, startY, boxW, boxH);

    const digit = digits[i];
    if (digit) {
      const textW = doc.getTextWidth(digit);
      const charX = x + (boxW - textW) / 2;
      const charY = startY + boxH - 0.6;
      doc.text(digit, charX, charY);
    }
  }
  doc.restoreGraphicsState();
}

/**
 * Dibuja el bloque de firma con etiquetas y DNI en texto simple.
 */
function drawSignatureBlockWithBoxes(doc, name, role, dni, signatureDataURL, xCenter, yStart) {
  const sigWidth = 65;
  const lineY = yStart + 15;

  // Draw signature line
  doc.saveGraphicsState();
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(xCenter - (sigWidth / 2), lineY, xCenter + (sigWidth / 2), lineY);
  doc.restoreGraphicsState();

  // Incrustar firma táctil si está disponible
  if (signatureDataURL) {
    try {
      doc.addImage(signatureDataURL, 'PNG', xCenter - 15, lineY - 14, 30, 13);
    } catch (e) {
      console.error("Error drawing signature image in PDF:", e);
    }
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text(role, xCenter, lineY + 4.5, { align: 'center' });
  doc.setFont("Arial", "normal");
  doc.text(name, xCenter, lineY + 9, { align: 'center' });

  // v29 fix: DNI as simple text without boxes
  const cleanDni = sanitizeDNI(dni);
  if (cleanDni) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    doc.text(`DNI: ${cleanDni}`, xCenter, lineY + 13.5, { align: 'center' });
  }
}

/**
 * Genera el PDF del Acta de Monitoreo y Acompañamiento Pedagógico.
 * Addendum v28: Arial 10.5 body, justified, numbered participants,
 * no Director duplication, docs as sub-list, unified compromisos, DNI sanitized.
 */
export function generarActaMonitoreoPDF(actaData, bannerDataURL, chartImages = null) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let pageCount = 0;

  // Layout constants
  const MARGIN_LEFT = 30;
  const MARGIN_RIGHT = 30;
  const CONTENT_WIDTH = 210 - MARGIN_LEFT - MARGIN_RIGHT; // 150 mm
  const PAGE_WIDTH = 210;
  const PAGE_BOTTOM_LIMIT = 267;

  // Detect role of specialist for membrete
  let cargoAutor = actaData.especialistaCargo || '';
  if (!cargoAutor && actaData.especialista) {
    const nameNorm = actaData.especialista.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nameNorm.includes("aracelli") || nameNorm.includes("suyo")) {
      cargoAutor = "Asistente";
    }
  }
  const llevaMembrete = !/ASISTENTE/i.test(cargoAutor);

  const setupPage = () => {
    if (llevaMembrete) {
      drawChrome(doc, { conMembreteCompleto: false, banner: bannerDataURL });
    }
    doc.saveGraphicsState();
    doc.setFont("Arial", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text("La presente acta se suscribe en cumplimiento del Plan de Trabajo AGEBATP 2026 de la UGEL 03.", PAGE_WIDTH / 2, 282, { align: "center" });
    doc.restoreGraphicsState();
    pageCount++;
  };

  setupPage();

  if (llevaMembrete) {
    doc.setFont("Arial", "italic");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('"Año de la Esperanza y el Fortalecimiento de la Democracia"', PAGE_WIDTH / 2, 32, { align: 'center' });
    doc.setTextColor(0);
  }

  let y = llevaMembrete ? 39.5 : 20;

  // ── Helpers ──────────────────────────────────────────────────────

  const BODY_FONT_SIZE = 10.5; // v28: 10.5 pt body
  const LINE_HEIGHT = 4.2;     // adjusted for 10.5 pt

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > PAGE_BOTTOM_LIMIT) {
      doc.addPage();
      setupPage();
      y = llevaMembrete ? 34 : 20;
    }
  };

  const printParagraphHeader = (title) => {
    doc.setFont("Arial", "bold");
    doc.setFontSize(11);
    checkPageBreak(8);
    doc.text(title, MARGIN_LEFT, y);
    y += 5.1;
  };

  const printNormalParagraph = (text, isBold = false, isJustified = true) => {
    doc.setFont("Arial", isBold ? "bold" : "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    checkPageBreak(lines.length * LINE_HEIGHT + 1);

    lines.forEach((line, index) => {
      if (isJustified && lines.length > 1 && index < lines.length - 1) {
        doc.text(line, MARGIN_LEFT, y, { align: 'justify', maxWidth: CONTENT_WIDTH });
      } else {
        doc.text(line, MARGIN_LEFT, y);
      }
      y += LINE_HEIGHT;
    });
    y += 1.2;
  };

  /**
   * Renders a hanging paragraph with a symbol/number at symbolIndent and
   * text starting at textIndent. Supports bold label prefix on first line.
   * v28: uses BODY_FONT_SIZE (10.5) and justified text.
   */
  const printHangingParagraph = (symbol, text, symbolIndent, textIndent, isBold = false, isJustified = true, isFirstBold = false, firstBoldLabel = '') => {
    const textWidth = CONTENT_WIDTH - textIndent;
    doc.setFont("Arial", isBold ? "bold" : "normal");
    doc.setFontSize(BODY_FONT_SIZE);

    const lines = doc.splitTextToSize(text, textWidth);
    checkPageBreak(lines.length * LINE_HEIGHT + 1);

    if (symbol) {
      doc.setFont("Arial", "bold");
      doc.setFontSize(BODY_FONT_SIZE);
      doc.text(symbol, MARGIN_LEFT + symbolIndent, y);
    }

    lines.forEach((line, index) => {
      if (index === 0 && isFirstBold && firstBoldLabel) {
        doc.setFont("Arial", "bold");
        doc.setFontSize(BODY_FONT_SIZE);
        doc.text(firstBoldLabel, MARGIN_LEFT + textIndent, y);
        const labelW = doc.getTextWidth(firstBoldLabel);
        doc.setFont("Arial", "normal");
        doc.setFontSize(BODY_FONT_SIZE);
        const remainingLine = line.substring(firstBoldLabel.length);
        if (remainingLine) {
          doc.text(remainingLine, MARGIN_LEFT + textIndent + labelW, y);
        }
      } else {
        doc.setFont("Arial", isBold ? "bold" : "normal");
        doc.setFontSize(BODY_FONT_SIZE);
        if (isJustified && lines.length > 1 && index < lines.length - 1) {
          doc.text(line, MARGIN_LEFT + textIndent, y, { align: 'justify', maxWidth: textWidth });
        } else {
          doc.text(line, MARGIN_LEFT + textIndent, y);
        }
      }
      y += LINE_HEIGHT;
    });

    y += 0.5;
  };

  // Helper: level number to roman
  const formatLevelLocal = (lvl) => {
    if (lvl === 1) return 'I';
    if (lvl === 2) return 'II';
    if (lvl === 3) return 'III';
    if (lvl === 4) return 'IV';
    return '-';
  };

  // ── 1. TÍTULO CENTRADO (12 pt, bold) ──────────────────────────

  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  const titleText = "ACTA DE VISITA DE MONITOREO Y ACOMPAÑAMIENTO PEDAGÓGICO";
  const titleLines = doc.splitTextToSize(titleText, CONTENT_WIDTH);
  checkPageBreak(titleLines.length * 5);
  doc.text(titleLines, PAGE_WIDTH / 2, y, { align: 'center' });
  y += (titleLines.length * 5) + 3;

  // ── 2. SUBTÍTULO CON NOMBRE DE LA IE ──────────────────────────

  doc.setFont("Arial", "bold");
  doc.setFontSize(11);
  const ieNameText = `${actaData.institucionTipo || 'IE'} ${actaData.institucion || '________________'}`;
  checkPageBreak(5);
  doc.text(ieNameText, MARGIN_LEFT, y);
  y += 7;

  // ── 3. I. DATOS GENERALES ─────────────────────────────────────

  printParagraphHeader("I. DATOS GENERALES:");
  y += 1.5;

  const fechaObj = actaData.fecha ? new Date(actaData.fecha + 'T12:00:00') : new Date();
  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  printHangingParagraph("", `Fecha: ${fechaFormateada}`, 6.4, 12.7, false, false, true, "Fecha: ");
  printHangingParagraph("", `Lugar: ${actaData.institucion || '________________'}`, 6.4, 12.7, false, false, true, "Lugar: ");
  printHangingParagraph("", `Participantes:`, 6.4, 12.7, false, false, true, "Participantes:");

  // v28 fix 2: Numbered sub-items (1. 2. 3.) instead of "o"
  // v28 fix 3: Use specific role label, no duplication
  const espCargoLabel = actaData.especialistaCargo ? ` (${actaData.especialistaCargo})` : ' (Especialista Pedagógico)';
  printHangingParagraph("1.", `Especialista / Monitor: ${actaData.especialista || '________________'}${espCargoLabel}`, 19.1, 25.4, false, true, true, "Especialista / Monitor: ");

  // v28 fix 3: Use directorCargo directly as label without parenthetical duplication
  const dirRoleLabel = actaData.directorCargo || 'Director(a)';
  printHangingParagraph("2.", `${dirRoleLabel}: ${actaData.director || '________________'}`, 19.1, 25.4, false, true, true, `${dirRoleLabel}: `);

  const docentes = actaData.docentes || [];
  const docentesNombres = docentes.map(d => d.nombre || 'Docente').join(', ');
  printHangingParagraph("3.", `Docente(s) Monitoreado(s): ${docentesNombres || 'Ninguno'}`, 19.1, 25.4, false, true, true, "Docente(s) Monitoreado(s): ");
  y += 4;

  // ── 4. II. OBJETIVO DE LA VISITA ──────────────────────────────

  printParagraphHeader("II. OBJETIVO DE LA VISITA:");
  y += 1.5;

  // v30: Short text for single docente, full text for multiple
  const objetivoText = docentes.length <= 1
    ? `Ejecutar el monitoreo y acompañamiento pedagógico al docente indicado, con el fin de fortalecer su práctica pedagógica y la calidad del servicio educativo.`
    : `Realizar el monitoreo y acompañamiento pedagógico en el aula a los docentes de la institución educativa para identificar fortalezas y aspectos a mejorar en el desarrollo de la práctica pedagógica, y brindar la asesoría y retroalimentación correspondiente que contribuya a la mejora continua de los aprendizajes de los estudiantes.`;
  printNormalParagraph(objetivoText, false, true);
  y += 4;

  // ── 5. III. DESARROLLO DEL MONITOREO ──────────────────────────

  printParagraphHeader("III. DESARROLLO DEL MONITOREO Y HECHOS CONSTATADOS:");
  y += 1.5;

  const isEtp = actaData.programa === 'ETP';
  const yesNo = (val) => val ? 'Sí' : 'No';

  // Summary table data collector
  const summaryRows = [];

  docentes.forEach((docente, idx) => {
    const checkDocs = docente.documentosPedagogicos || {};
    const area = docente.datosSesion?.moduloFormativo || docente.datosSesion?.areaCurricular || '-';
    const docHeader = `${docente.nombre || 'Docente'} - ${area}`;

    // v28 fix 5: Unified template — always use the full block with bullets
    printHangingParagraph(`${idx + 1}.`, docHeader, 6.4, 12.7, true, false, false);

    const docName = docente.nombre || '-';
    printHangingParagraph("", `Docente: ${docName}`, 12.7, 19.1, false, false, true, "Docente: ");

    const mat = docente.datosSesion?.matriculados ?? '-';
    const pres = docente.datosSesion?.presentes ?? '-';
    printHangingParagraph("", `Asistencia: ${pres} estudiantes presentes de un total de ${mat} matriculados.`, 12.7, 19.1, false, true, true, "Asistencia: ");

    // Levels
    let levelsStr = '';
    let levelValues = [];
    if (isEtp) {
      const rubricas = docente.ficha?.rubricasETP || [];
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const lvl = rubricas[i]?.nivel;
        levelValues.push(lvl || null);
        parts.push(`R${i + 1}: ${formatLevelLocal(lvl)}`);
      }
      levelsStr = parts.join(' - ');
    } else {
      const criterios = docente.ficha?.instrumento1?.criterios || [];
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const lvl = criterios[i]?.nivel;
        levelValues.push(lvl || null);
        parts.push(`R${i + 1}: ${formatLevelLocal(lvl)}`);
      }
      levelsStr = parts.join(' - ');
    }
    printHangingParagraph("", `Niveles alcanzados: ${levelsStr}.`, 12.7, 19.1, false, false, true, "Niveles alcanzados: ");

    // v28 fix 4: Docs pedagógicos as sub-list with colons, no brackets
    printHangingParagraph("", `Documentos pedagógicos:`, 12.7, 19.1, false, false, true, "Documentos pedagógicos:");
    printHangingParagraph("-", `Plan de estudios: ${yesNo(checkDocs.planEstudios)}.`, 19.1, 25.4, false, false);
    printHangingParagraph("-", `Unidad didáctica: ${yesNo(checkDocs.unidadDidactica)}.`, 19.1, 25.4, false, false);
    printHangingParagraph("-", `Sesión de aprendizaje: ${yesNo(checkDocs.sesionAprendizaje)}.`, 19.1, 25.4, false, false);
    if (isEtp) {
      printHangingParagraph("-", `Sílabo para el estudiante: ${yesNo(checkDocs.silabo)}.`, 19.1, 25.4, false, false);
    }

    const obsTextDocente = docente.observacionesFicha || 'Sin observaciones.';
    printHangingParagraph("", `Observaciones: ${obsTextDocente}`, 12.7, 19.1, false, true, true, "Observaciones: ");

    const commitmentsList = (docente.compromisosMejora || [])
      .map(c => {
        const nudo = (c.desempenoPorMejorar || '').trim();
        const alt = (c.compromisoMejora || '').trim();
        if (nudo && alt) return `${nudo}: ${alt}`;
        return nudo || alt;
      })
      .filter(Boolean)
      .join("; ");
    printHangingParagraph("", `Compromisos: ${commitmentsList || 'Sin compromisos.'}`, 12.7, 19.1, false, true, true, "Compromisos: ");

    y += 4;

    // Collect summary row
    summaryRows.push([
      docente.nombre || 'Docente',
      `${pres}/${mat}`,
      ...levelValues.map(v => formatLevelLocal(v))
    ]);
  });

  // ── Summary table at end of section III ────────────────────────
  if (summaryRows.length > 0) {
    y += 2;
    checkPageBreak(20 + summaryRows.length * 7);

    doc.setFont("Arial", "bold");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.text("Tabla Resumen:", MARGIN_LEFT, y);
    y += 4;

    const marginConfig = {
      top: llevaMembrete ? 34 : 20,
      left: MARGIN_LEFT,
      right: MARGIN_RIGHT,
      bottom: llevaMembrete ? 18 : 20
    };

    autoTable(doc, {
      startY: y,
      margin: marginConfig,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 8, cellPadding: 1.8, textColor: [0, 0, 0], overflow: 'linebreak', halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      head: [['Docente', 'Asist.', 'R1', 'R2', 'R3', 'R4', 'R5']],
      body: summaryRows,
      columnStyles: {
        0: { cellWidth: 55, halign: 'left' },
        1: { cellWidth: 16 },
        2: { cellWidth: 13 },
        3: { cellWidth: 13 },
        4: { cellWidth: 13 },
        5: { cellWidth: 13 },
        6: { cellWidth: 13 }
      },
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── Draw Charts in the Acta (Addendum v31) ──────────────────────
  if (Array.isArray(chartImages) && chartImages.length > 0) {
    chartImages.forEach((chart) => {
      if (!chart || !chart.base64) return;
      const chartW = 120;
      const chartH = 60;
      
      checkPageBreak(chartH + 18);
      
      // Draw figure title/caption
      doc.setFont("Arial", "bold");
      doc.setFontSize(9.5);
      const title = chart.title || 'Gráfico';
      doc.text(title, PAGE_WIDTH / 2, y, { align: 'center' });
      y += 4.5;
      
      // Draw image centered
      const chartX = (PAGE_WIDTH - chartW) / 2;
      doc.addImage(chart.base64, 'PNG', chartX, y, chartW, chartH);
      y += chartH + 3;
      
      // Source
      doc.setFont("Arial", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      const caption = chart.caption || 'Fuente: Sistema de Monitoreo AGEBATP (2026).';
      doc.text(caption, PAGE_WIDTH / 2, y, { align: 'center' });
      doc.setTextColor(0);
      y += 8;
    });
    y += 2;
  }

  // ── 6. IV. COMPROMISOS Y ACUERDOS ─────────────────────────────

  printParagraphHeader("IV. COMPROMISOS Y ACUERDOS DE MEJORA CONTINUA:");
  y += 1.5;

  // v30: Use editable compromisosGenerales from the Wizard if provided
  const compromisosGenerales = actaData.compromisosGenerales || [];
  const compromisosToRender = compromisosGenerales.filter(t => t.trim().length > 0);

  if (compromisosToRender.length > 0) {
    compromisosToRender.forEach((item, idx) => {
      printHangingParagraph(`${idx + 1}.`, item.trim(), 6.4, 12.7, false, true, false);
    });
  } else {
    // Fallback: consolidate from per-docente compromisos
    const compromisosConsolidados = [];
    docentes.forEach(docente => {
      const list = docente.compromisosMejora || [];
      list.forEach(c => {
        const nudo = (c.desempenoPorMejorar || '').trim();
        const alt = (c.compromisoMejora || '').trim();
        if (nudo || alt) {
          compromisosConsolidados.push({
            docente: docente.nombre || 'Docente',
            nudo: nudo || '-',
            alt: alt || '-'
          });
        }
      });
    });

    if (compromisosConsolidados.length > 0) {
      compromisosConsolidados.forEach((comp, idx) => {
        const compText = `${comp.docente} - Desempeño por mejorar: ${comp.nudo}. Compromiso: ${comp.alt}.`;
        printHangingParagraph(`${idx + 1}.`, compText, 6.4, 12.7, false, true, false);
      });
    } else {
      printHangingParagraph("1.", "El docente se compromete a implementar las recomendaciones brindadas por el monitor en la sesión de aprendizaje.", 6.4, 12.7, false, true, false);
    }
  }
  y += 4;

  // ── 7. V. CIERRE DEL ACTA ────────────────────────────────────

  printParagraphHeader("V. CIERRE DEL ACTA:");
  y += 1.5;

  // v30: Short closure for single docente
  const fechaCierreObj = actaData.fecha ? new Date(actaData.fecha + 'T12:00:00') : new Date();
  const fechaCierreStr = fechaCierreObj.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const cierreText = docentes.length <= 1
    ? `Siendo las ${actaData.horaCierre || '____'} horas del ${fechaCierreStr}, se da por concluida la visita de monitoreo y acompañamiento pedagógico. Los presentes firman en señal de conformidad.`
    : `Habiéndose cumplido con el propósito de la visita de monitoreo y acompañamiento pedagógico, y no habiendo otros asuntos que tratar, se da por concluida la presente sesión y se suscribe esta acta en señal de conformidad por los participantes, siendo las ${actaData.horaCierre || '____'} horas de la fecha indicada.`;
  printNormalParagraph(cierreText, false, true);
  // v29: Do not advance y artificially before checking page break.
  // ── 8. Firmas de Conformidad (2 firmas) ───────────────────────

  checkPageBreak(30);
  const sigY = y;

  // v28 fix 3: Use specific directorCargo as role label in signature
  const sigDirRole = `Firma del ${actaData.directorCargo || 'Director(a)'}`;

  drawSignatureBlockWithBoxes(
    doc,
    actaData.especialista || 'Especialista AGEBATP',
    "Firma del monitor",
    actaData.especialistaDNI || '',
    actaData.firmaMonitorDataUrl,
    67.5,
    sigY
  );

  drawSignatureBlockWithBoxes(
    doc,
    actaData.director || 'Director(a)',
    sigDirRole,
    actaData.directorDNI || '',
    actaData.firmaDirectorDataUrl,
    142.5,
    sigY
  );

  // ── Output ────────────────────────────────────────────────────

  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');

  const tipo = actaData.programa === 'ETP' ? 'ETP' : 'EBA';
  const instClean = (actaData.institucion || 'Monitoreo').replace(/["']/g, '').replace(/[^a-zA-Z0-9_ -]/g, '_');
  doc.save(`Acta_Monitoreo_${tipo}_${instClean}_${actaData.fecha || 'Fecha'}.pdf`);

  return { blob, base64 };
}
