import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_BOTTOM, aplicarFuentesArial, drawChrome } from './membrete';

/**
 * Dibuja las 8 casillas del DNI centradas en una celda de tabla.
 */
function drawDNICells(doc, cell, dni) {
  const digits = (dni || '').split('').slice(0, 8);
  while (digits.length < 8) digits.push('');

  const boxW = 2.8;
  const boxH = 2.8;
  const gap = 0.5;
  const totalW = (8 * boxW) + (7 * gap); // 22.4 + 3.5 = 25.9 mm

  const startX = cell.x + (cell.width - totalW) / 2;
  const startY = cell.y + (cell.height - boxH) / 2;

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
      const charY = startY + boxH - 0.6; // adjust baseline
      doc.text(digit, charX, charY);
    }
  }
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

  // v29 fix: DNI as simple text without boxes
  const cleanDni = (dni || '').replace(/[^0-9]/g, '');
  if (cleanDni) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(7.5);
    doc.text(`DNI: ${cleanDni}`, xCenter, lineY + 12, { align: 'center' });
  }
}

/**
 * Genera la Ficha de Monitoreo Pedagógico al Docente de CETPRO (ETP).
 * Copia fiel del modelo oficial con membrete AGEBATP.
 */
export function generarFichaETPPDF(fichaData, bannerDataURL) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

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
    if (llevaMembrete) {
      drawChrome(doc, { conMembreteCompleto: false, banner: bannerDataURL });
    }
    pageCount++;
  };

  setupPage();

  const marginConfig = {
    top: llevaMembrete ? 34 : 20,
    left: M.left,
    right: M.right,
    bottom: llevaMembrete ? 18 : 20
  };

  // Year slogan
  if (llevaMembrete) {
    doc.setFont("Arial", "italic");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('"Año de la Esperanza y el Fortalecimiento de la Democracia"', M.pageW / 2, 32, { align: "center" });
    doc.setTextColor(0);
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
  }

  let y = llevaMembrete ? 38 : 20;

  // Title
  doc.setFont("Arial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0);
  const titleText = "FICHA DE MONITOREO PEDAGÓGICO AL DOCENTE DE CETPRO";
  const titleLines = doc.splitTextToSize(titleText, CONTENT_W);
  doc.text(titleLines, M.pageW / 2, y, { align: "center" });
  y += (titleLines.length * 4.8) + 5;

  const pageBottomLimit = llevaMembrete ? BODY_BOTTOM : (M.pageH - 20);
  const dg = fichaData.datosGeneralesCETPRO || {};
  const sesion = fichaData.datosSesion || {};
  const rubricas = fichaData.rubricasETP || [];

  // ═══ I. DATOS GENERALES ═══
  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("I. DATOS GENERALES:", M.left, y);
  y += 3;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.text("Registre los datos del CETPRO, del docente a monitorear, del monitor y, si lo hubiera, de un observador.", M.left, y);
  y += 5;

  // Table 1: CETPRO data (Unified into a single, compact table)
  const instVal = dg.instancia || '';
  const instText = `${instVal === 'DRELM' ? 'X' : '○'} DRELM   ${instVal === 'UGEL' ? 'X' : '○'} UGEL   ${instVal === 'CETPRO' ? 'X' : '○'} CETPRO`;

  const dgTableRows = [
    ['Nombre del CETPRO', 'Código Modular', 'UGEL', 'REI'],
    [dg.nombreCETPRO || '', dg.codigoModular || '', dg.ugel || '03', dg.rei || ''],
    ['Apellidos y Nombres del docente monitoreado', 'DNI', 'Teléfono', 'Correo'],
    [dg.docenteNombre || '', '', dg.docenteTelefono || '', dg.docenteCorreo || ''],
    ['Apellidos y Nombres del monitor (Especialista UGEL/DRELM o Director)', 'DNI', 'Teléfono', 'Instancia'],
    [dg.monitorNombre || '', '', dg.monitorTelefono || '', instText],
    ['Apellidos y Nombres del Observador (Opcional)', 'DNI', 'Teléfono', 'Cargo'],
    [dg.observadorNombre || '', '', dg.observadorTelefono || '', dg.observadorCargo || '']
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], valign: 'middle', overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 }
    },
    body: dgTableRows,
    willDrawCell: (data) => {
      // Alternating row styling: headers (even rows) get gray background, data (odd rows) get white.
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [220, 220, 220];
        data.cell.styles.fontStyle = 'bold';
      } else {
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
  y = doc.lastAutoTable.finalY + 6;

  // ═══ II. DATOS DE LA SESIÓN OBSERVADA ═══
  if (y > pageBottomLimit - 40) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("II. DATOS DE LA SESIÓN OBSERVADA:", M.left, y);
  y += 3;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.text("Registre los datos de la sesión a observar.", M.left, y);
  y += 5;

  // Ciclo table
  const cicloVal = sesion.ciclo || '';
  const cicloRows = [
    [
      { content: 'Ciclo', rowSpan: 4, styles: { fontStyle: 'bold', valign: 'middle', halign: 'center', fillColor: [220, 220, 220] } },
      `${cicloVal === 'Basico' ? 'X' : '○'} Básico`,
      'Opción ocupacional',
      sesion.opcionOcupacional || ''
    ],
    [
      `${cicloVal === 'Auxiliar tecnico' ? 'X' : '○'} Auxiliar técnico`,
      'Programa de estudio',
      sesion.programaEstudio || ''
    ],
    [
      `${cicloVal === 'Medio' ? 'X' : '○'} Medio`,
      'Especialidad',
      sesion.especialidad || ''
    ],
    [
      `${cicloVal === 'Tecnico' ? 'X' : '○'} Técnico`,
      'Programa de estudio',
      ''
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], overflow: 'linebreak' },
    body: cicloRows,
    columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 40 }, 2: { cellWidth: 37 }, 3: { cellWidth: 60 } },
    willDrawCell: (data) => {
      // Column 0 and Column 2 are headers (gray background)
      if (data.column.index === 0 || data.column.index === 2) {
        data.cell.styles.fillColor = [220, 220, 220];
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
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], overflow: 'linebreak' },
    body: [
      ['Módulo formativo', sesion.moduloFormativo || ''],
      ['Unidad didáctica', sesion.unidadDidactica || ''],
      ['Nombre de la actividad', sesion.nombreActividad || ''],
    ],
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 115 } },
    willDrawCell: (data) => {
      if (data.column.index === 0) {
        data.cell.styles.fillColor = [220, 220, 220];
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

  // Bottom row: matriculados, presentes, turno, fecha, horas
  const turnoVal = sesion.turno || '';
  const turnoText = `M ${turnoVal === 'M' ? 'X' : '○'}   T ${turnoVal === 'T' ? 'X' : '○'}   N ${turnoVal === 'N' ? 'X' : '○'}`;

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 2, textColor: [0, 0, 0], overflow: 'linebreak', halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 7.5 },
    head: [['N° de estudiantes matriculados', 'N° de estudiantes presentes', 'Turno', 'Fecha de observación', 'Hora de inicio', 'Hora de término']],
    body: [[
      sesion.matriculados ?? '', sesion.presentes ?? '',
      turnoText,
      sesion.fechaObservacion || '', sesion.horaInicio || '', sesion.horaTermino || ''
    ]],
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 6;

  // ═══ II-B. DOCUMENTOS PEDAGÓGICOS QUE PRESENTA EL DOCENTE ═══
  if (y > pageBottomLimit - 30) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }

  const checkDocs = fichaData.documentosPedagogicos || {};
  const docPedRows = [
    ['Plan de estudios', `${checkDocs.planEstudios ? 'Sí X   No ○' : 'Sí ○   No X'}`],
    ['Unidad didáctica', `${checkDocs.unidadDidactica ? 'Sí X   No ○' : 'Sí ○   No X'}`],
    ['Sesión de aprendizaje', `${checkDocs.sesionAprendizaje ? 'Sí X   No ○' : 'Sí ○   No X'}`],
    ['Sílabo para el estudiante (sellado por Dirección)', `${checkDocs.silabo ? 'Sí X   No ○' : 'Sí ○   No X'}`]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0], overflow: 'linebreak' },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    head: [['Documentos pedagógicos que presenta el docente', 'Calificación']],
    body: docPedRows,
    columnStyles: {
      0: { cellWidth: 115 },
      1: { cellWidth: 40, halign: 'center' }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 6;

  // ═══ III. DESEMPEÑOS, ASPECTOS Y CALIFICACIÓN ═══
  if (y > pageBottomLimit - 35) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("III. DESEMPEÑOS, ASPECTOS Y CALIFICACIÓN", M.left, y);
  y += 3;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  const instrETP = "Registre las descripciones o evidencias correspondientes a cada rúbrica/desempeño y determine el nivel de logro.";
  doc.text(instrETP, M.left, y, { maxWidth: CONTENT_W });
  y += 5;

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
        'Monitoreo que realiza el docente del trabajo de los estudiantes y de sus avances durante el desarrollo de la actividad de aprendizaje.',
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

  // Head rows for Section III with two-level layout
  const headRows = [
    [
      { content: 'Rúbrica / desempeño', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: 'Aspectos', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: 'Nivel de logro', colSpan: 4, styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0] } }
    ],
    [
      { content: 'I', styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: 'II', styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: 'III', styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
      { content: 'IV', styles: { halign: 'center', fillColor: [220, 220, 220], textColor: [0, 0, 0] } }
    ]
  ];

  // Compile unified table body rows (2 rows per rubric: Row A: Title, Aspects celled, Level cell; Row B: Evidences)
  const tableBodyRows = [];

  rubricas.forEach((rubrica, rIdx) => {
    const def = RUBRICAS_DEF[rIdx] || {};
    const aspectos = rubrica.aspectos || [];
    const evidencias = rubrica.evidencias || '';
    
    // Rubric level is stored on the rubric itself
    const lvl = rubrica.nivel;

    // Bullet points for all aspects in one text block
    const bulletText = (aspectos.length > 0 ? aspectos : (def.aspectosDef || []).map(t => ({ texto: t })))
      .map(asp => `• ${asp.texto || asp}`).join('\n');

    // Fila A: Calificación (contains title, aspect text list, and level selector cells)
    tableBodyRows.push([
      {
        content: def.titulo || rubrica.titulo || `R${rIdx + 1}`,
        styles: { fontStyle: 'bold', valign: 'middle', fontSize: 8, cellPadding: 2, fillColor: [255, 255, 255] }
      },
      { 
        content: bulletText, 
        styles: { fontSize: 7.5, cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }, overflow: 'linebreak', halign: 'justify', fillColor: [255, 255, 255] } 
      },
      { content: lvl === 1 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
      { content: lvl === 2 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
      { content: lvl === 3 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
      { content: lvl === 4 ? 'X' : '', styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fillColor: [255, 255, 255] } },
    ]);

    // Fila B: Evidencias spanning all 6 columns
    const label = def.etiquetaEvidencia || 'Evidencias';
    tableBodyRows.push([{
      content: `${label}:\n${evidencias}`,
      colSpan: 6,
      isEvidence: true,
      label: label,
      evText: evidencias,
      styles: { fontSize: 8, cellPadding: { top: 2, right: 4, bottom: 3, left: 2.5 }, overflow: 'linebreak', minCellHeight: 14 }
    }]);
  });

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, lineColor: [120, 120, 120], lineWidth: 0.2, valign: 'middle', textColor: [0, 0, 0] },
    head: headRows,
    body: tableBodyRows,
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 80 },
      2: { cellWidth: 10 },
      3: { cellWidth: 10 },
      4: { cellWidth: 10 },
      5: { cellWidth: 10 },
    },
    didDrawCell: (data) => {
      // Custom render evidence row to draw the label in bold and the body normal
      if (data.cell.raw && data.cell.raw.isEvidence) {
        doc.setFillColor(255, 255, 255);
        doc.rect(data.cell.x + 0.3, data.cell.y + 0.3, data.cell.width - 0.6, data.cell.height - 0.6, 'F');

        doc.setFont("Arial", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(0);
        const startX = data.cell.x + 2.5;
        let startY = data.cell.y + 3.8;
        doc.text(`${data.cell.raw.label}:`, startX, startY);

        doc.setFont("Arial", "normal");
        const bodyContent = data.cell.raw.evText || '';
        const lines = doc.splitTextToSize(bodyContent, data.cell.width - 5);
        startY += 4.2;
        doc.text(lines, startX, startY);
      }
    },
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });

  y = doc.lastAutoTable.finalY + 6;

  // ═══ IV. RETROALIMENTACIÓN Y COMPROMISOS DE MEJORA ═══
  if (y > pageBottomLimit - 30) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("IV. RETROALIMENTACIÓN Y COMPROMISOS DE MEJORA:", M.left, y);
  y += 3;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.text("Mediante el diálogo reflexivo, defina con el docente los desempeños que requiere mejorar y sus respectivos compromisos de mejora.", M.left, y, { maxWidth: CONTENT_W });
  y += 6;

  // Compromisos table
  const compromisos = fichaData.compromisosMejora || [];
  const compRows = compromisos.map(c => [c.desempenoPorMejorar || '', c.compromisoMejora || '']).filter(r => r[0].trim() !== '' || r[1].trim() !== '');
  while (compRows.length < 2) compRows.push(['', '']);

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8.5, cellPadding: 3, overflow: 'linebreak', textColor: [0, 0, 0] },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
    head: [['Desempeños por mejorar', 'Compromisos de mejora']],
    body: compRows.map(row => [
      { content: row[0], styles: { minCellHeight: 12 } },
      { content: row[1], styles: { minCellHeight: 12 } }
    ]),
    rowPageBreak: 'avoid',
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 4;

  // Observaciones
  if (y > pageBottomLimit - 20) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }
  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text("Observaciones:", M.left, y);
  y += 4;
  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  const obsText = fichaData.observacionesFicha || '';
  if (obsText) {
    const obsLines = doc.splitTextToSize(obsText, CONTENT_W);
    doc.text(obsLines, M.left, y);
    y += obsLines.length * 3.8 + 4;
  } else {
    doc.setDrawColor(180);
    doc.setLineWidth(0.15);
    for (let i = 0; i < 3; i++) {
      doc.line(M.left, y + (i * 6), M.left + CONTENT_W, y + (i * 6));
    }
    y += 20;
  }

  // Declaración
  if (y > pageBottomLimit - 25) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }

  const dec = fichaData.declaracion || {};
  const horaVal = dec.hora || "____";
  const diaVal = dec.dia || "____";
  const mesVal = dec.mes || "____";
  const anioVal = dec.anio || "2026";

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  const decText = `Culminado el monitoreo y la retroalimentación brindada y siendo las ${horaVal} horas del día ${diaVal} de ${mesVal} del ${anioVal}, firmamos el presente documento en señal de conformidad.`;
  const decLines = doc.splitTextToSize(decText, CONTENT_W);
  doc.text(decText, M.left, y, { maxWidth: CONTENT_W, align: 'justify' });
  y += (decLines.length * 4.2) + 12;

  // Firmas area
  if (y > pageBottomLimit - 25) { doc.addPage(); setupPage(); y = llevaMembrete ? 44 : 30; }

  const sigWidth = 65;
  const sigLineY = y + 18;
  const firmas = fichaData.firmas || {};

  // Draw signature left (Docente)
  const docNombre = firmas.docente?.nombre || '';
  const docDni = (firmas.docente?.dni && firmas.docente?.dni !== '(Espacio en Blanco)') ? firmas.docente?.dni : '';
  drawSignatureBlockWithBoxes(doc, docNombre, "Firma del docente", docDni, fichaData.firmaDocenteDataUrl, M.left + 5 + (sigWidth / 2), sigLineY - 14);

  // Draw signature right (Monitor)
  const monitorNombreFinal = firmas.observador?.nombre || dg.monitorNombre || '';
  const monitorDni = (firmas.observador?.dni && firmas.observador?.dni !== '(Espacio en Blanco)') 
    ? firmas.observador?.dni 
    : (dg.monitorDNI || '');
  
  drawSignatureBlockWithBoxes(doc, monitorNombreFinal, "Firma del monitor", monitorDni, fichaData.firmaMonitorDataUrl, M.pageW - M.right - (sigWidth / 2) - 5, sigLineY - 14);

  // Output and Save
  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');
  
  const docenteName = dg.docenteNombre || 'Docente';
  const docenteClean = docenteName.replace(/[^a-zA-Z0-9_ -]/g, '_');
  const fechaSave = sesion.fechaObservacion || 'Fecha';
  doc.save(`Ficha_Monitoreo_ETP_${docenteClean}_${fechaSave}.pdf`);

  return { blob, base64 };
}
