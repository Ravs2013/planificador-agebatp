import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarFuentesArial } from './membrete';
import { FONT_CORSIVA } from './fuenteCorsiva';

// Márgenes mínimos para expandir al máximo el contenido
const myM = {
  left: 10,
  right: 10,
  top: 9.5,
  bottom: 12,
  pageW: 210,
  pageH: 297
};
const myCONTENT_W = myM.pageW - myM.left - myM.right; // 190 mm
const myBODY_BOTTOM = myM.pageH - myM.bottom; // 285 mm

/**
 * Dibuja las 8 casillas del DNI centradas en una celda de tabla.
 */
function drawDNICells(doc, cell, dni) {
  const digits = (dni || '').split('').slice(0, 8);
  while (digits.length < 8) digits.push('');

  doc.saveGraphicsState();
  
  // Draw 7 vertical separator lines from top to bottom border of the cell
  doc.setDrawColor(140, 140, 140); // same gray color as the table lines
  doc.setLineWidth(0.2);
  for (let i = 1; i < 8; i++) {
    const x = cell.x + i * (cell.width / 8);
    doc.line(x, cell.y, x, cell.y + cell.height);
  }

  // Draw DNI digits centered inside each of the 8 subdivisions
  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(0);

  const boxW = cell.width / 8;
  for (let i = 0; i < 8; i++) {
    const digit = digits[i];
    if (digit !== undefined && digit !== '') {
      const x = cell.x + i * boxW;
      const textW = doc.getTextWidth(digit);
      const charX = x + (boxW - textW) / 2;
      const charY = cell.y + cell.height / 2 + 1.2; // vertical baseline centering
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

  // Draw tactile signature image if available
  if (signatureDataURL) {
    try {
      doc.addImage(signatureDataURL, 'PNG', xCenter - 15, lineY - 14, 30, 13);
    } catch (e) {
      console.error("Error drawing signature image in PDF:", e);
    }
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(8.5);
  doc.text(role, xCenter, lineY + 4, { align: 'center' });
  doc.setFont("Arial", "normal");
  doc.text(name, xCenter, lineY + 8, { align: 'center' });

  // DNI as simple text without boxes
  const cleanDni = (dni || '').replace(/[^0-9]/g, '');
  if (cleanDni) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(7.5);
    doc.text(`DNI: ${cleanDni}`, xCenter, lineY + 12, { align: 'center' });
  }
}

/**
 * Genera la Ficha de Monitoreo Pedagógico al Docente de CETPRO (ETP).
 * Copia fiel del modelo oficial con membrete AGEBATP y márgenes de impresión mínimos.
 */
export function generarFichaETPPDF(fichaData, bannerDataURL, options = {}) {
  const conRubrica = options.conRubrica || false;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  // Registrar la fuente Monotype Corsiva en el VFS de jsPDF
  doc.addFileToVFS('MTCORSVA.TTF', FONT_CORSIVA);
  doc.addFont('MTCORSVA.TTF', 'Monotype Corsiva', 'italic');
  doc.addFont('MTCORSVA.TTF', 'Monotype Corsiva', 'normal');

  let pageCount = 0;

  // Detect role of monitor for membrete
  let cargoAutor = "";
  const monitorNombre = fichaData.datosGeneralesCETPRO?.monitorNombre || '';
  if (monitorNombre) {
    const nameNorm = monitorNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nameNorm.includes("aracelli") || nameNorm.includes("suyo")) {
      cargoAutor = "Asistente";
    }
  }
  const llevaMembrete = !/ASISTENTE/i.test(cargoAutor);

  const setupPage = () => {
    if (llevaMembrete && bannerDataURL) {
      try {
        // Banner extendido al ancho de página mínimo
        doc.addImage(bannerDataURL, "JPEG", myM.left, 8, myCONTENT_W, myCONTENT_W / 8.6);
      } catch (e) {
        console.warn("Error drawing banner in PDF:", e);
      }
    }
    pageCount++;
  };

  setupPage();

  const marginConfig = {
    top: llevaMembrete ? 34 : 20,
    left: myM.left,
    right: myM.right,
    bottom: myM.bottom
  };

  // Year slogan in Monotype Corsiva (bajado un poquito más a Y=33 para no chocar con el membrete)
  if (llevaMembrete) {
    doc.setFont("Monotype Corsiva", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text('"Año de la Esperanza y el Fortalecimiento de la Democracia"', myM.pageW / 2, 33, { align: "center" });
    doc.setTextColor(0);
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
  }

  // Título inicia en Y=38 para no chocar con el slogan
  let y = llevaMembrete ? 38 : 20;

  // Title
  doc.setFont("Arial", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0);
  const titleText = "FICHA DE MONITOREO PEDAGÓGICO AL DOCENTE DE CETPRO";
  const titleLines = doc.splitTextToSize(titleText, myCONTENT_W);
  doc.text(titleLines, myM.pageW / 2, y, { align: "center" });
  y += (titleLines.length * 4.2) + 3;

  const pageBottomLimit = myBODY_BOTTOM;
  const dg = fichaData.datosGeneralesCETPRO || {};
  const sesion = fichaData.datosSesion || {};
  const rubricas = fichaData.rubricasETP || [];

  // ═══ I. DATOS GENERALES ═══
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("I. DATOS GENERALES:", myM.left, y);
  y += 3;
  doc.setFont("Arial", "normal");
  doc.setFontSize(8);
  doc.text("Registre los datos del CETPRO, del docente a monitorear, del monitor y, si lo hubiera, de un observador.", myM.left, y);
  y += 4.5;

  // Table 1: CETPRO data (Unified into a single, compact table)
  const instVal = dg.instancia || '';
  const instText = `${instVal === 'DRELM' ? '●' : '○'} DRELM     ${instVal === 'UGEL' ? '●' : '○'} UGEL     ${instVal === 'CETPRO' ? '●' : '○'} CETPRO`;

  // Color de relleno "Blanco, Fondo 1, Oscuro 15%" -> [217, 217, 217]
  const hStyle = { fillColor: [217, 217, 217], fontStyle: 'bold' };

  const dgTableRows = [
    [
      { content: 'Nombre del CETPRO', styles: hStyle },
      { content: 'Código Modular', styles: hStyle },
      { content: 'UGEL', styles: hStyle },
      { content: 'REI', styles: hStyle }
    ],
    [dg.nombreCETPRO || '', dg.codigoModular || '', dg.ugel || '03', dg.rei || ''],
    [
      { content: 'Apellidos y Nombres del docente monitoreado', styles: hStyle },
      { content: 'DNI', styles: hStyle },
      { content: 'Teléfono', styles: hStyle },
      { content: 'Correo', styles: hStyle }
    ],
    [dg.docenteNombre || '', '', dg.docenteTelefono || '', dg.docenteCorreo || ''],
    [
      { content: 'Apellidos y Nombres del monitor (Especialista UGEL/DRELM o Director)', styles: hStyle },
      { content: 'DNI', styles: hStyle },
      { content: 'Teléfono', styles: hStyle },
      { content: 'Instancia', styles: hStyle }
    ],
    [dg.monitorNombre || '', '', dg.monitorTelefono || '', instText],
    [
      { content: 'Apellidos y Nombres del Observador (Opcional)', styles: hStyle },
      { content: 'DNI', styles: hStyle },
      { content: 'Teléfono', styles: hStyle },
      { content: 'Cargo', styles: hStyle }
    ],
    [dg.observadorNombre || '', '', dg.observadorTelefono || '', dg.observadorCargo || '']
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    // cellPadding: 1.8 para que se vea aireado, no apretado
    styles: { font: 'Arial', fontSize: 8, cellPadding: 1.8, textColor: [0, 0, 0], valign: 'middle', overflow: 'linebreak', lineColor: [140, 140, 140], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 48 } // Suma exactamente 190 mm de ancho
    },
    body: dgTableRows,
    willDrawCell: (data) => {
      // Non-header rows get white background and normal font style
      if (data.row.index % 2 !== 0) {
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'normal';
      }
    },
    didDrawCell: (data) => {
      if (data.row.index === 3 && data.column.index === 1) {
        drawDNICells(doc, data.cell, dg.docenteDNI);
      }
      if (data.row.index === 5 && data.column.index === 1) {
        drawDNICells(doc, data.cell, dg.monitorDNI);
      }
      if (data.row.index === 7 && data.column.index === 1) {
        drawDNICells(doc, data.cell, dg.observadorDNI);
      }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // ═══ II. DATOS DE LA SESIÓN OBSERVADA ═══
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("II. DATOS DE LA SESIÓN OBSERVADA:", myM.left, y);
  y += 3;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.text("Registre los datos de la sesión a observar.", myM.left, y);
  y += 4.5;

  // Ciclo table
  const cicloVal = sesion.ciclo || '';
  const cicloRows = [
    [
      { content: 'Ciclo', rowSpan: 4, styles: { fontStyle: 'bold', valign: 'middle', halign: 'center', fillColor: [217, 217, 217] } },
      `${cicloVal === 'Basico' ? '●' : '○'} Básico`,
      'Opción ocupacional',
      sesion.opcionOcupacional || ''
    ],
    [
      `${cicloVal === 'Auxiliar tecnico' ? '●' : '○'} Auxiliar técnico`,
      'Programa de estudio',
      sesion.programaEstudio || ''
    ],
    [
      `${cicloVal === 'Medio' ? '●' : '○'} Medio`,
      'Especialidad',
      sesion.especialidad || ''
    ],
    [
      `${cicloVal === 'Tecnico' ? '●' : '○'} Técnico`,
      'Programa de estudio',
      ''
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 1.8, textColor: [0, 0, 0], overflow: 'linebreak', lineColor: [140, 140, 140], lineWidth: 0.2 },
    body: cicloRows,
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 45 }, 2: { cellWidth: 43 }, 3: { cellWidth: 80 } }, // Suma 190 mm
    willDrawCell: (data) => {
      // Column 0 and Column 2 are headers (gray background)
      if (data.column.index === 0 || data.column.index === 2) {
        data.cell.styles.fillColor = [217, 217, 217];
        data.cell.styles.fontStyle = 'bold';
      } else {
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'normal';
      }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY;

  // Modulo / Unidad / Actividad (Drawn directly adjacent without spacing)
  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 1.8, textColor: [0, 0, 0], overflow: 'linebreak', lineColor: [140, 140, 140], lineWidth: 0.2 },
    body: [
      ['Módulo formativo', sesion.moduloFormativo || ''],
      ['Unidad didáctica', sesion.unidadDidactica || ''],
      ['Nombre de la actividad', sesion.nombreActividad || ''],
    ],
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 145 } }, // Suma 190 mm
    willDrawCell: (data) => {
      if (data.column.index === 0) {
        data.cell.styles.fillColor = [217, 217, 217];
        data.cell.styles.fontStyle = 'bold';
      } else {
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'normal';
      }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY;

  // Bottom row: matriculados, presentes, turno (subdivided), fecha, horas
  const turnoVal = sesion.turno || '';
  const sessionHead = [
    [
      { content: 'N° de estudiantes matriculados', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'N° de estudiantes presentes', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Turno', colSpan: 3, styles: { halign: 'center' } },
      { content: 'Fecha de observación', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Hora de inicio', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Hora de término', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
    ],
    [
      { content: 'M', styles: { halign: 'center' } },
      { content: 'T', styles: { halign: 'center' } },
      { content: 'N', styles: { halign: 'center' } }
    ]
  ];

  const sessionBody = [
    [
      sesion.matriculados ?? '',
      sesion.presentes ?? '',
      turnoVal === 'M' ? 'X' : '',
      turnoVal === 'T' ? 'X' : '',
      turnoVal === 'N' ? 'X' : '',
      sesion.fechaObservacion || '',
      sesion.horaInicio || '',
      sesion.horaTermino || ''
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.5, textColor: [0, 0, 0], overflow: 'linebreak', halign: 'center', valign: 'middle', lineColor: [140, 140, 140], lineWidth: 0.2 },
    headStyles: { fillColor: [217, 217, 217], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 7.5 },
    head: sessionHead,
    body: sessionBody,
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 38 },
      2: { cellWidth: 10 },
      3: { cellWidth: 10 },
      4: { cellWidth: 10 },
      5: { cellWidth: 38 },
      6: { cellWidth: 23 },
      7: { cellWidth: 23 } // Total: 38+38+10+10+10+38+23+23 = 190 mm
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // ═══ III. DESEMPEÑOS, ASPECTOS Y CALIFICACIÓN ═══
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("III. DESEMPEÑOS, ASPECTOS Y CALIFICACIÓN", myM.left, y);
  y += 3;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  const instrETP = "Registre las descripciones o evidencias correspondientes a cada rúbrica/desempeño y determine el nivel de logro.";
  doc.text(instrETP, myM.left, y, { maxWidth: myCONTENT_W });
  y += 4.5;

  const topPosition = llevaMembrete ? 34 : 20;

  const drawRubricaTable = (rIdx, startY, isPage1) => {
    const rubrica = rubricas[rIdx] || {};
    const def = RUBRICAS_DEF[rIdx] || {};
    const aspectos = rubrica.aspectos || [];
    const evidencias = rubrica.evidencias || '';
    const lvl = rubrica.nivel;

    const bulletText = (aspectos.length > 0 ? aspectos : (def.aspectosDef || []).map(t => ({ texto: t })))
      .map(asp => `• ${asp.texto || asp}`).join('\n');

    const bodyRows = [
      [
        {
          content: def.titulo || rubrica.titulo || `R${rIdx + 1}`,
          styles: { fontStyle: 'bold', valign: 'middle', fontSize: 8.5, cellPadding: 2.5, fillColor: [255, 255, 255] }
        },
        { 
          content: bulletText, 
          styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak', halign: 'justify', fillColor: [255, 255, 255] } 
        },
        { content: lvl === 1 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
        { content: lvl === 2 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
        { content: lvl === 3 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
        { content: lvl === 4 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
      ],
      [{
        content: `${def.etiquetaEvidencia || 'Evidencias'}:\n${evidencias}`,
        colSpan: 6,
        isEvidence: true,
        label: def.etiquetaEvidencia || 'Evidencias',
        evText: evidencias,
        styles: { fontSize: 8, cellPadding: 2 }
      }]
    ];

    // R1 (página 1) es corta (evidencias de 26 mm).
    // R2, R3, R4, R5 (páginas 2 y 3) miden 68 mm de alto mínimo de evidencias, lo suficientemente pequeño
    // como para evitar que se desborde a otra hoja y asegurar que quepan R2/R3 en la pág 2 y R4/R5 en la pág 3.
    const bodyRowMinH = isPage1 ? 22 : 24;
    const evRowMinH = isPage1 ? 26 : 68;

    bodyRows[0][0].styles.minCellHeight = bodyRowMinH;
    bodyRows[0][1].styles.minCellHeight = bodyRowMinH;
    bodyRows[1][0].styles.minCellHeight = evRowMinH;

    if (doc.lastAutoTable) {
      doc.lastAutoTable.finalY = 0;
    }

    autoTable(doc, {
      startY: startY,
      margin: { ...marginConfig, bottom: 2 },
      pageBreak: 'avoid',
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 8, lineColor: [120, 120, 120], lineWidth: 0.2, valign: 'middle', textColor: [0, 0, 0] },
      head: [
        [
          { content: 'Rúbrica / desempeño', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [217, 217, 217], textColor: [0, 0, 0] } },
          { content: 'Aspectos', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [217, 217, 217], textColor: [0, 0, 0] } },
          { content: 'Nivel de logro', colSpan: 4, styles: { halign: 'center', fillColor: [217, 217, 217], textColor: [0, 0, 0] } }
        ],
        [
          { content: 'I', styles: { halign: 'center', fillColor: [217, 217, 217], textColor: [0, 0, 0] } },
          { content: 'II', styles: { halign: 'center', fillColor: [217, 217, 217], textColor: [0, 0, 0] } },
          { content: 'III', styles: { halign: 'center', fillColor: [217, 217, 217], textColor: [0, 0, 0] } },
          { content: 'IV', styles: { halign: 'center', fillColor: [217, 217, 217], textColor: [0, 0, 0] } }
        ]
      ],
      body: bodyRows,
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 118 },
        2: { cellWidth: 8 },
        3: { cellWidth: 8 },
        4: { cellWidth: 8 },
        5: { cellWidth: 8 }, // Suma 190 mm de ancho
      },
      didDrawCell: (data) => {
        if (data.cell.raw && data.cell.raw.isEvidence) {
          doc.setFillColor(255, 255, 255);
          doc.rect(data.cell.x + 0.3, data.cell.y + 0.3, data.cell.width - 0.6, data.cell.height - 0.6, 'F');

          doc.setFont("Arial", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(0);
          const startX = data.cell.x + 2.5;
          let startYCell = data.cell.y + 3.2;
          doc.text(`${data.cell.raw.label}:`, startX, startYCell);

          doc.setFont("Arial", "normal");
          const bodyContent = data.cell.raw.evText || '';
          const lines = doc.splitTextToSize(bodyContent, data.cell.width - 5);
          startYCell += 3.8;
          doc.text(lines, startX, startYCell);
        }
      },
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });
  };

  // Draw R1 on Page 1 (Fits perfectly and leaves plenty of space)
  drawRubricaTable(0, y, true);

  // Draw R2 and R3 on Page 2 (Together as a single group on one page, starting at Y=34 and Y=152)
  doc.addPage();
  setupPage();
  drawRubricaTable(1, topPosition, false);
  drawRubricaTable(2, topPosition + 118, false); // Posicionamiento exacto para encajar en la misma hoja sin desbordar

  // Draw R4 and R5 on Page 3 (Together as a single group on one page)
  doc.addPage();
  setupPage();
  drawRubricaTable(3, topPosition, false);
  drawRubricaTable(4, topPosition + 118, false);

  // Draw Page 4: Section IV, Observaciones, Declaración, Firmas
  doc.addPage();
  setupPage();
  y = topPosition;

  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("IV. RETROALIMENTACIÓN Y COMPROMISOS DE MEJORA:", myM.left, y);
  y += 3.2;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.text("Mediante el diálogo reflexivo, defina con el docente los desempeños que requiere mejorar y sus respectivos compromisos de mejora.", myM.left, y, { maxWidth: myCONTENT_W });
  y += 5;

  // Compromisos table
  const compromisos = fichaData.compromisosMejora || [];
  const compRows = compromisos.map(c => [c.desempenoPorMejorar || '', c.compromisoMejora || '']).filter(r => r[0].trim() !== '' || r[1].trim() !== '');
  while (compRows.length < 2) compRows.push(['', '']);

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak', textColor: [0, 0, 0] },
    headStyles: { fillColor: [217, 217, 217], textColor: [0, 0, 0], fontStyle: 'bold' },
    head: [['Desempeños por mejorar', 'Compromisos de mejora']],
    body: compRows.map(row => [
      { content: row[0], styles: { minCellHeight: 12 } },
      { content: row[1], styles: { minCellHeight: 12 } }
    ]),
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 95 } // Total 190 mm
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // Observaciones
  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text("Observaciones:", myM.left, y);
  y += 4;
  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  const obsText = fichaData.observacionesFicha || '';
  if (obsText) {
    const obsLines = doc.splitTextToSize(obsText, myCONTENT_W);
    doc.text(obsLines, myM.left, y);
    y += obsLines.length * 3.8 + 4;
  } else {
    doc.setDrawColor(180);
    doc.setLineWidth(0.15);
    for (let i = 0; i < 3; i++) {
      doc.line(myM.left, y + (i * 6), myM.left + myCONTENT_W, y + (i * 6));
    }
    y += 20;
  }

  // Declaración
  const dec = fichaData.declaracion || {};
  const horaVal = dec.hora || "____";
  const diaVal = dec.dia || "____";
  const mesVal = dec.mes || "____";
  const anioVal = dec.anio || "2026";

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  const decText = `Culminado el monitoreo y la retroalimentación brindada y siendo las ${horaVal} horas del día ${diaVal} de ${mesVal} del ${anioVal}, firmamos el presente documento en señal de conformidad.`;
  const decLines = doc.splitTextToSize(decText, myCONTENT_W);
  doc.text(decText, myM.left, y, { maxWidth: myCONTENT_W, align: 'justify' });
  y += (decLines.length * 4.2) + 12;

  // Firmas area
  const sigWidth = 65;
  const sigLineY = y + 18;
  const firmas = fichaData.firmas || {};

  // Draw signature left (Docente)
  const docNombre = firmas.docente?.nombre || '';
  const docDni = (firmas.docente?.dni && firmas.docente?.dni !== '(Espacio en Blanco)') ? firmas.docente?.dni : '';
  drawSignatureBlockWithBoxes(doc, docNombre, "Firma del docente", docDni, fichaData.firmaDocenteDataUrl, myM.left + 15 + (sigWidth / 2), sigLineY - 14);

  // Draw signature right (Monitor)
  const monitorNombreFinal = firmas.observador?.nombre || dg.monitorNombre || '';
  const monitorDni = (firmas.observador?.dni && firmas.observador?.dni !== '(Espacio en Blanco)') 
    ? firmas.observador?.dni 
    : (dg.monitorDNI || '');
  
  drawSignatureBlockWithBoxes(doc, monitorNombreFinal, "Firma del monitor", monitorDni, fichaData.firmaMonitorDataUrl, myM.pageW - myM.right - (sigWidth / 2) - 15, sigLineY - 14);

  // ═══ ETP Rubrica pages (5 to 10) ═══
  if (conRubrica) {
    // Page 5: Orientaciones
    doc.addPage();
    setupPage();
    let yRub = llevaMembrete ? 34 : 20;

    doc.setFont("Arial", "bold");
    doc.setFontSize(11);
    doc.text("RÚBRICA DE PLANIFICACIÓN Y OBSERVACIÓN DEL DESEMPEÑO DOCENTE DE ETP", myM.pageW / 2, yRub, { align: "center", maxWidth: myCONTENT_W });
    yRub += 12;

    doc.setFont("Arial", "bold");
    doc.setFontSize(9.5);
    doc.text("Orientaciones de aplicación", myM.left, yRub);
    yRub += 5;

    doc.setFont("Arial", "normal");
    doc.setFontSize(8.5);
    const orientacionesText = `El monitor solicita al docente que presente los siguientes documentos:\n\n` +
      `- Los instrumentos de planificación elaborados por él: la programación del Programa de Estudios, un módulo, una unidad didáctica, una de sus fichas de actividades de aprendizaje.\n\n` +
      `- La descripción del contexto y de las características de los estudiantes en los que basó el diseño de su planificación (edades, ciclo, intereses y necesidades, nivel de desarrollo en la especialidad técnica, situación laboral, entre otros).`;
    
    doc.text(orientacionesText, myM.left, yRub, { maxWidth: myCONTENT_W, align: "justify" });

    // Page 6 to 10: R1 to R5
    RUBRICAS_COMPLETAS_ETP.forEach((rubCompleta, rIdx) => {
      doc.addPage();
      setupPage();
      let yRub = llevaMembrete ? 34 : 20;

      const evalLvl = rubricas[rIdx]?.nivel || 1;

      doc.setFont("Arial", "bold");
      doc.setFontSize(10.5);
      doc.text(rubCompleta.titulo, myM.left, yRub);
      yRub += 5;

      doc.setFont("Arial", "normal");
      doc.setFontSize(8.5);
      const descText = rubCompleta.descripcion;
      const descLines = doc.splitTextToSize(descText, myCONTENT_W);
      doc.text(descText, myM.left, yRub, { maxWidth: myCONTENT_W, align: "justify" });
      yRub += descLines.length * 3.8 + 4;

      doc.setFont("Arial", "bold");
      doc.setFontSize(9);
      doc.text("Aspectos:", myM.left, yRub);
      yRub += 4;

      doc.setFont("Arial", "normal");
      doc.setFontSize(8);
      const aspectsText = rubCompleta.aspectos.map(a => `• ${a}`).join('\n');
      const aspectsLines = doc.splitTextToSize(aspectsText, myCONTENT_W);
      doc.text(aspectsText, myM.left, yRub, { maxWidth: myCONTENT_W });
      yRub += aspectsLines.length * 3.6 + 6;

      // Table of levels (190 mm width)
      const descHeader = [
        [
          { content: `NIVEL I\n(Muy deficiente)${evalLvl === 1 ? '   [X]' : ''}`, styles: { halign: 'center', fillColor: evalLvl === 1 ? [220, 220, 220] : [245, 245, 245], fontStyle: evalLvl === 1 ? 'bold' : 'normal' } },
          { content: `NIVEL II\n(En proceso)${evalLvl === 2 ? '   [X]' : ''}`, styles: { halign: 'center', fillColor: evalLvl === 2 ? [220, 220, 220] : [245, 245, 245], fontStyle: evalLvl === 2 ? 'bold' : 'normal' } },
          { content: `NIVEL III\n(Suficiente)${evalLvl === 3 ? '   [X]' : ''}`, styles: { halign: 'center', fillColor: evalLvl === 3 ? [220, 220, 220] : [245, 245, 245], fontStyle: evalLvl === 3 ? 'bold' : 'normal' } },
          { content: `NIVEL IV\n(Destacado)${evalLvl === 4 ? '   [X]' : ''}`, styles: { halign: 'center', fillColor: evalLvl === 4 ? [220, 220, 220] : [245, 245, 245], fontStyle: evalLvl === 4 ? 'bold' : 'normal' } }
        ]
      ];

      const descBody = [
        [
          { content: rubCompleta.descriptores[0], styles: { fillColor: evalLvl === 1 ? [250, 250, 250] : [255, 255, 255] } },
          { content: rubCompleta.descriptores[1], styles: { fillColor: evalLvl === 2 ? [250, 250, 250] : [255, 255, 255] } },
          { content: rubCompleta.descriptores[2], styles: { fillColor: evalLvl === 3 ? [250, 250, 250] : [255, 255, 255] } },
          { content: rubCompleta.descriptores[3], styles: { fillColor: evalLvl === 4 ? [250, 250, 250] : [255, 255, 255] } }
        ]
      ];

      autoTable(doc, {
        startY: yRub,
        margin: marginConfig,
        theme: 'grid',
        styles: { font: 'Arial', fontSize: 7, lineColor: [120, 120, 120], lineWidth: 0.2, cellPadding: 2.5, textColor: [0, 0, 0], overflow: 'linebreak' },
        head: descHeader,
        body: descBody,
        columnStyles: {
          0: { cellWidth: 47.5 },
          1: { cellWidth: 47.5 },
          2: { cellWidth: 47.5 },
          3: { cellWidth: 47.5 } // Total 190 mm
        },
        willDrawCell: (data) => {
          if (data.column.index === evalLvl - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [0, 0, 0];
          }
        },
        didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
      });
    });
  }

  // Output and Save
  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');
  
  const docenteName = dg.docenteNombre || 'Docente';
  const docenteClean = docenteName.replace(/[^a-zA-Z0-9_ -]/g, '_');
  const fechaSave = sesion.fechaObservacion || 'Fecha';
  doc.save(`Ficha_Monitoreo_ETP_${docenteClean}_${fechaSave}.pdf`);

  return { blob, base64 };
}

// ════ CONSTANTS ════

const RUBRICAS_DEF = [
  {
    titulo: 'R1. Planifica el proceso de enseñanza y aprendizaje.',
    etiquetaEvidencia: 'Descripción (evidencias)',
    aspectosDef: [
      'Unidad didáctica diseñada de acuerdo con los lineamientos curriculares de la Educación Técnico-Productiva.',
      'Sesiones o actividades de aprendizaje que permiten desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje.',
      'Sesión o actividad de aprendizaje que responde al contexto y a las características de los estudiantes, y aporta al logro de los aprendizajes previstos con atención a la diversidad.',
    ]
  },
  {
    titulo: 'R2. Promueve el involucramiento de los estudiantes en el proceso de aprendizaje.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectosDef: [
      'Acciones del docente para promover la participación de los estudiantes mediante metodologías activas o modelos de aprendizaje en las actividades de aprendizaje.',
      'Proporción de estudiantes involucrados en las actividades de aprendizaje.',
      'Acciones del docente para favorecer la comprensión de la importancia o utilidad de lo que se aprende con atención a la diversidad.',
    ]
  },
  {
    titulo: 'R3. Promueve el dominio de procedimientos para la realización de trabajos técnicos.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectosDef: [
      'Promoción del dominio de procedimientos para la elaboración de un producto o la prestación de un servicio.',
    ]
  },
  {
    titulo: 'R4. Acompaña el proceso de aprendizaje de los estudiantes.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectosDef: [
      'Monitoreo que realiza el docente del trabajo de los estudiantes and de sus avances durante el desarrollo de la actividad de aprendizaje.',
      'Calidad de la retroalimentación que el docente brinda o adaptación de las actividades que realiza a partir de las necesidades de aprendizaje identificadas.',
    ]
  },
  {
    titulo: 'R5. Promueve un clima propicio para el aprendizaje.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectosDef: [
      'Trato respetuoso y consideración hacia la perspectiva de los estudiantes.',
      'Cercanía que muestra el docente en la interacción con los estudiantes.',
    ]
  }
];

const RUBRICAS_COMPLETAS_ETP = [
  {
    num: "R1",
    titulo: "1. R1. Planifica el proceso de enseñanza y aprendizaje.",
    descripcion: "Diseña experiencias de aprendizaje considerando los lineamientos curriculares de la Educación Técnico-Productiva. Asimismo, las sesiones o actividades que comprenden la unidad didáctica buscan desarrollar, en su conjunto, los aprendizajes previstos (aprendizajes o capacidad) a través del uso de metodologías activas o modelos de aprendizaje. Además, la sesión o actividad de aprendizaje que propone se encuentra acorde al contexto, responde a las características de los estudiantes y está orientada al logro de los aprendizajes esperados.",
    aspectos: [
      "Unidad didáctica diseñada de acuerdo con los lineamientos curriculares de la Educación Técnico-Productiva.",
      "Sesiones o actividades de aprendizaje que permiten desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje.",
      "Sesión o actividad de aprendizaje que responde al contexto y a las características de los estudiantes, y aporta al logro de los aprendizajes previstos con atención a la diversidad."
    ],
    descriptores: [
      "No alcanza las condiciones del nivel II.\n\nNo elabora los documentos de planificación solicitados (unidad didáctica, o sesión o actividad de aprendizaje).\nO\nElabora su unidad didáctica sin considerar los elementos contemplados en el módulo (capacidades o aprendizajes, o los criterios de evaluación o indicadores de logro).\nO\nDiseña la sesión o actividad de aprendizaje sin considerar las características de los estudiantes.\n\nNota: Se ubica en el nivel I si el postulante no presenta el módulo correspondiente, ya que no se podría valorar la coherencia entre este y la unidad didáctica.",
      "El docente propone una unidad didáctica en concordancia con los principales componentes del módulo. Y, si bien considera las características de los estudiantes en el diseño de la sesión o actividad de aprendizaje, las sesiones o actividades de aprendizaje de la unidad didáctica no permiten desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje.",
      "Elabora su unidad didáctica en concordancia con las capacidades o aprendizajes, y los criterios de evaluación o indicadores de logro propuestos en el módulo.\nY\nPlantea las sesiones o actividades de aprendizaje de la unidad didáctica con un orden lógico que permita desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje.\nY\nDiseña la sesión o actividad de aprendizaje considerando las características de los estudiantes (intereses o necesidades) y plantea en ella acciones que aportan al logro de los aprendizajes previstos.",
      "El docente propone una unidad didáctica en concordancia con los principales componentes del módulo. Además, plantea en dicha unidad didáctica sesiones o actividades de aprendizaje que permiten desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje. Asimismo, considera el contexto y las características de los estudiantes en el diseño de la sesión o actividad de aprendizaje, y se asegura que este aporte al logro de los aprendizajes previstos.\n\nElabora su unidad didáctica en concordancia con las capacidades o aprendizajes, y los criterios de evaluación o indicadores de logro propuestos en el módulo.\nY\nPlantea las sesiones o actividades de aprendizaje de la unidad didáctica con un orden lógico que permita desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje.\nY\nDiseña la sesión o actividad de aprendizaje considerando el contexto y las características de los estudiantes (intereses y necesidades con atención a la diversidad), y plantea en ella acciones que aportan al logro de los aprendizajes previstos. Asimismo, prevé estrategias que le permitan verificar cómo se alcanzan los logros de aprendizaje."
    ]
  },
  {
    num: "R2",
    titulo: "2. R2. Promueve el involucramiento de los estudiantes en el proceso de aprendizaje.",
    descripcion: "Promueve la participación de los estudiantes mediante metodologías activas o modelos de aprendizaje en el desarrollo de las actividades de aprendizaje que propone, y les ayuda a ser conscientes de la importancia o utilidad de lo que se aprende con atención a la diversidad.",
    aspectos: [
      "Acciones del docente para promover la participación de los estudiantes con metodologías activas o modelos de aprendizaje con atención a las características de los estudiantes en las actividades de aprendizaje.",
      "Proporción de estudiantes involucrados en las actividades de aprendizaje.",
      "Acciones del docente para favorecer la comprensión de la importancia o utilidad de lo que se aprende con atención a la diversidad."
    ],
    descriptores: [
      "No alcanza las condiciones del nivel II.\n\nNo ofrece oportunidades de participación a los estudiantes durante la actividad de aprendizaje observada.\nO\nMás de la mitad de los estudiantes está distraído, muestra indiferencia, desgano o signos de aburrimiento.",
      "El docente promueve ocasionalmente la participación de los estudiantes mediante metodologías activas o modelos de aprendizaje en las actividades de aprendizaje, y al menos la mitad de los estudiantes participan en estas.\n\nOfrece a los estudiantes pocas oportunidades de participación mediante metodologías activas o modelos de aprendizaje durante la actividad de aprendizaje observada, debido a que esta se encuentra centrada en el protagonismo del docente y con reducidas intervenciones de los estudiantes.\nY\nAl menos la mitad de los estudiantes (50% o más) participan en las actividades de aprendizaje propuestas.",
      "El docente promueve frecuentemente la participación de los estudiantes mediante metodologías activas o modelos de aprendizaje en las actividades de aprendizaje, y la gran mayoría de los estudiantes participan en estas.\n\nOfrece a los estudiantes múltiples oportunidades de participación mediante metodologías activas o modelos de aprendizaje durante la actividad de aprendizaje observada, al formularles preguntas o retos, generar debates, plantearles casos para resolver, entre otras.\nY\nLa gran mayoría de los estudiantes (más del 75%) participan en las actividades de aprendizaje propuestas.",
      "El docente promueve frecuente y activamente la participación de los estudiantes mediante metodologías activas o modelos de aprendizaje con atención a las características de los estudiantes en las actividades de aprendizaje, y todos o casi todos participan en estas. Además, busca que comprendan la importancia o utilidad de lo que aprenden.\n\nOfrece a los estudiantes múltiples oportunidades de participación mediante metodologías activas o modelos de aprendizaje con atención a las características de los estudiantes durante la actividad de aprendizaje observada, al formularles preguntas o retos, generar debates, plantearles casos para resolver, entre otras.\nY\nSi uno o más estudiantes no realizan la actividad propuesta o realizan una distinta a esta, implementa acciones o estrategias para involucrarlos, atendiendo la diversidad.\nY\nTodos o casi todos los estudiantes (más del 90%) participan en las actividades de aprendizaje propuestas.\nY\nBusca que los estudiantes comprendan o reflexionen sobre la importancia o utilidad de lo que están aprendiendo al plantear situaciones que vinculan este aprendizaje con el mundo laboral."
    ]
  },
  {
    num: "R3",
    titulo: "3. R3. Promueve el dominio de procedimientos para la realización de trabajos técnicos.",
    descripcion: "Propone actividades de aprendizaje que promueven que los estudiantes dominen los procedimientos necesarios para la elaboración de un producto o la prestación de un servicio.",
    aspectos: [
      "Promoción del dominio de procedimientos para la elaboración de un producto o la prestación de un servicio."
    ],
    descriptores: [
      "No alcanza las condiciones del nivel II.\n\nSe limita a presentar los procedimientos sin desarrollar acciones orientadas a promover su manejo.",
      "El docente intenta promover el dominio de procedimientos para la elaboración de un producto o la prestación de un servicio al menos en una ocasión, pero no lo logra.\n\nIntenta promover el dominio de procedimientos para la elaboración de un producto o la prestación de un servicio al menos en una ocasión, pero no lo consigue, debido a que conduce la actividad de manera superficial o insuficiente. En las demás actividades se limita a presentar los procedimientos sin desarrollar acciones orientadas a promover su manejo.",
      "El docente promueve el dominio de procedimientos para la elaboración de un producto o la prestación de un servicio al menos en una ocasión.\n\nPromueve el dominio de procedimientos para la elaboración de un producto o la prestación de un servicio al menos en una ocasión, lo que se evidencia cuando solicita a los estudiantes que expresen con sus propios términos un procedimiento, adecúen un procedimiento de acuerdo con una situación propuesta, implementen un procedimiento en una situación dada, propongan nuevas formas de realizar un procedimiento, entre otras.\n\nUn docente que se ubica en este nivel, al menos en una ocasión, orienta, establece diálogos, modela, realiza preguntas, propone retos a los estudiantes en la realización de tareas que promueven el manejo de procedimientos para la elaboración de un producto o la prestación de un servicio.",
      "El docente promueve el dominio de procedimientos para la elaboración de un producto o la prestación de un servicio durante la actividad de aprendizaje en su conjunto.\n\nPromueve el dominio de procedimientos para la elaboración de un producto o la prestación de un servicio durante la actividad en su conjunto, lo que se evidencia cuando solicita a los estudiantes que expresen con sus propios términos un procedimiento, adecúen un procedimiento de acuerdo con una situación propuesta, implementen un procedimiento en una situación dada, propongan nuevas formas de realizar un procedimiento, entre otras.\n\nUn docente que se ubica en este nivel, durante toda la actividad de aprendizaje en su conjunto, orienta, establece diálogos, modela, realiza preguntas, propone retos a los estudiantes en la realización de tareas que promueven el manejo de procedimientos para la elaboración de un producto o la prestación de un servicio y realiza acciones para mantenerlos encaminados hacia ese fin."
    ]
  },
  {
    num: "R4",
    titulo: "4. R4. Acompaña el proceso de aprendizaje de los estudiantes.",
    descripcion: "Acompaña a los estudiantes durante el desarrollo de las actividades de aprendizaje, monitoreando sus avances y dificultades en el logro de los aprendizajes y, a partir de esto, les brinda retroalimentación o adecúa las actividades planteadas.",
    aspectos: [
      "Monitoreo que realiza el docente del trabajo de los estudiantes y de sus avances durante el desarrollo de la actividad de aprendizaje.",
      "Calidad de la retroalimentación que el docente brinda o adaptación de las actividades que realiza a partir de las necesidades de aprendizaje identificadas."
    ],
    descriptores: [
      "No alcanza las condiciones del nivel II.\n\nNo monitorea o lo hace muy ocasionalmente (es decir, destina menos del 25% de la actividad de aprendizaje a recoger evidencia de la comprensión y progreso de los estudiantes).\nO\nSanciona (reprocha, penaliza o desacredita) las solicitudes de apoyo pedagógico o preguntas de los estudiantes que reflejan incomprensión.\nO\nAnte las actuaciones de los estudiantes (respuestas, intervenciones, presentación de producciones, etc.), brinda retroalimentación incorrecta.\nO\nNo brinda retroalimentación de ningún tipo o solo se limita a repetir las indicaciones sin adaptarlas.\nO\nSanciona las respuestas incorrectas de los estudiantes desaprovechándolas como oportunidades para el aprendizaje.",
      "El docente monitorea activamente a los estudiantes, pero solo les brinda retroalimentación elemental.\n\nMonitorea activamente la comprensión y el progreso de los estudiantes, destinando al menos el 25% de la actividad de aprendizaje a recoger evidencia a través de preguntas, diálogos o problemas formulados a toda la clase, o bien recorriendo los grupos y revisando sus trabajos o productos.\nY\nAnte las actuaciones de los estudiantes (respuestas, intervenciones, presentación de producciones, ejecución de tareas, etc.), solo brinda retroalimentación elemental (indica únicamente si la respuesta es correcta o incorrecta, da la respuesta correcta o señala dónde encontrarla).",
      "El docente monitorea activamente a los estudiantes y en una ocasión les brinda retroalimentación descriptiva o adapta la actividad.\n\nMonitorea activamente la comprensión y el progreso de los estudiantes, destinando al menos el 25% de la actividad de aprendizaje a recoger evidencia a través de preguntas, diálogos o problemas formulados a toda la clase, o bien recorriendo los grupos y revisando sus trabajos o productos.\nY\nAnte las actuaciones de los estudiantes (respuestas, intervenciones, presentación de producciones, ejecución de tareas, etc.), en una ocasión brinda retroalimentación descriptiva (sugiere en detalle qué hacer para mejorar o especifica lo que falta para el logro) o adapta la actividad (retoma una noción previa necesaria para la comprensión, intenta explicar de otro modo o ejemplifica el contenido, o reduce la dificultad de la tarea para favorecer un avance progresivo).",
      "El docente monitorea activamente a los estudiantes y en más de una ocasión les brinda retroalimentación descriptiva o adapta la actividad.\n\nMonitorea activamente la comprensión y el progreso de los estudiantes, destinando al menos el 25% de la actividad de aprendizaje a recoger evidencia a través de preguntas, diálogos o problemas formulados a toda la clase, o bien recorriendo los grupos y revisando sus trabajos o productos.\nY\nAnte las actuaciones de los estudiantes (respuestas, intervenciones, presentación de producciones, execution de tareas, etc.), en más de una ocasión brinda retroalimentación descriptiva (sugiere en detalle qué hacer para mejorar o especifica lo que falta para el logro) o adapta la actividad (retoma una noción previa necesaria para la comprensión, intenta explicar de otro modo o ejemplifica el contenido, o reduce la dificultad de la tarea para favorecer un avance progresivo)."
    ]
  },
  {
    num: "R5",
    titulo: "5. R5. Promueve un clima propicio para el aprendizaje.",
    descripcion: "Es respetuoso con los estudiantes, fomenta el respeto entre ellos y se muestra cercano en su interacción con estos.",
    aspectos: [
      "Trato respetuoso y consideración hacia la perspectiva de los estudiantes.",
      "Cercanía que muestra el docente en la interacción con los estudiantes."
    ],
    descriptores: [
      "No alcanza las condiciones del nivel II.\n\nEn alguna ocasión, falta el respeto a uno o más estudiantes.\nO\nSi nota que hay faltas de respeto entre los estudiantes, no interviene.",
      "El docente es siempre respetuoso con los estudiantes y si nota faltas de respeto entre ellos, interviene. Sin embargo, se muestra distante en su interacción con los estudiantes.\n\nAlways es respetuoso con los estudiantes, al no realizar alguna acción que los agreda, ofenda o discrimine.\nY\nSi nota que hay faltas de respeto entre los estudiantes, interviene. Es decir, dirige, limita o media ante una situación conflictiva en la que, por ejemplo, un estudiante se burla de otro o lo agrede verbalmente.\nY\nEn su interacción con los estudiantes, es frío e indiferente.",
      "El docente es siempre respetuoso con los estudiantes y si nota faltas de respeto entre ellos, interviene. Además, muestra cercanía en su interacción con los estudiantes.\n\nSiempre es respetuoso con los estudiantes, al no realizar alguna acción que los agreda, ofenda o discrimine.\nY\nSi nota que hay faltas de respeto entre los estudiantes, interviene. Es decir, dirige, limita o media ante una situación conflictiva en la que, por ejemplo, un estudiante se burla de otro o lo agrede verbalmente.\nY\nEn su interacción con los estudiantes, practica la escucha atenta y emplea recursos de comunicación (proximidad espacial, desplazamiento en el aula, gestos amables, tono de voz calmado, entre otros) apropiados a sus características. Si emplea el humor, este es respetuoso y favorece las relaciones positivas en el aula.",
      "El docente es siempre respetuoso con los estudiantes y si nota faltas de respeto entre ellos, interviene. Además, muestra consideración hacia la perspectiva de los estudiantes y cercanía en su interacción con ellos.\n\nSiempre es respetuoso con los estudiantes, al no realizar alguna acción que los agreda, ofenda o discrimine.\nY\nSi nota que hay faltas de respeto entre los estudiantes, interviene. Es decir, dirige, limita o media ante una situación conflictiva en la que, por ejemplo, un estudiante se burla de otro o lo agrede verbalmente.\nY\nMuestra consideración hacia la perspectiva de los estudiantes (es decir, respeta sus opiniones y puntos de vista, les pide su parecer y lo considera, evita imponerse, y tiene una actitud dialogante y abierta).\nY\nEn su interacción con los estudiantes, practica la escucha atenta y emplea recursos de comunicación (proximidad espacial, desplazamiento en el aula, gestos amables, tono de voz calmado, entre otros) apropiados a sus características. Si emplea el humor, este es respetuoso y favorece las relaciones positivas en el aula."
    ]
  }
];
export { RUBRICAS_DEF };
