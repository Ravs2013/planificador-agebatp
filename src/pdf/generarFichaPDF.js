import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_BOTTOM, aplicarFuentesArial, drawChrome } from './membrete';

function drawBoldNormalCellText(doc, cell, title, lineSpacing = 3.6) {
  const rawText = cell.rawText || [];
  const titleLen = title.length;
  let charsDrawn = 0;
  
  const fontSize = cell.styles.fontSize || 8.5;
  doc.setFontSize(fontSize);
  const actualLineSpacing = fontSize * 0.42;
  
  const textPos = cell.textPos || {};
  const paddingLeft = cell.styles.cellPadding?.left ?? cell.styles.cellPadding ?? 2.2;
  const paddingTop = cell.styles.cellPadding?.top ?? cell.styles.cellPadding ?? 2.2;
  
  const startX = textPos.x !== undefined ? textPos.x : (cell.x + paddingLeft);
  const startY = textPos.y !== undefined ? textPos.y : (cell.y + paddingTop + 3);
  
  let currentY = startY;
  
  rawText.forEach((line) => {
    const lineLen = line.length;
    const x = startX;
    
    if (charsDrawn + lineLen <= titleLen) {
      doc.setFont("Arial", "bold");
      doc.text(line, x, currentY);
    } else if (charsDrawn >= titleLen) {
      doc.setFont("Arial", "normal");
      doc.text(line, x, currentY);
    } else {
      const boldPart = line.substring(0, titleLen - charsDrawn);
      const normalPart = line.substring(titleLen - charsDrawn);
      
      doc.setFont("Arial", "bold");
      doc.text(boldPart, x, currentY);
      
      const boldW = doc.getTextWidth(boldPart);
      doc.setFont("Arial", "normal");
      doc.text(normalPart, x + boldW, currentY);
    }
    
    charsDrawn += lineLen + 1;
    currentY += actualLineSpacing;
  });
}

export function generarFichaPDF(fichaData, bannerDataURL) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let pageCount = 0;

  // Detect role of monitor
  let cargoAutor = "";
  if (fichaData.datosGenerales?.nombreMonitor) {
    const nameNorm = fichaData.datosGenerales.nombreMonitor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

  if (llevaMembrete) {
    doc.setFont("Arial", "italic");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('"Año de la Esperanza y el Fortalecimiento de la Democracia"', M.pageW / 2, 32, { align: "center" });
  }

  // Title centered
  doc.setFont("Arial", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(0);
  const titleText = "CUADERNILLO DEL MONITOREO PEDAGÓGICO A DOCENTES DE LIMA METROPOLITANA EBR-EBA 2026";
  const titleLines = doc.splitTextToSize(titleText, CONTENT_W);
  const titleY = llevaMembrete ? 38.5 : 20;
  doc.text(titleLines, M.pageW / 2, titleY, { align: "center" });

  let y = titleY + (titleLines.length * 4.8) + 6;

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("I. DATOS GENERALES", M.left, y);

  // Recuadro "UGEL 03" on top right
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(M.pageW - M.right - 22, y - 5.5, 22, 7.5);
  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0);
  doc.text("UGEL 03", M.pageW - M.right - 11, y - 0.2, { align: "center" });

  y += 4.5;

  const dg = fichaData.datosGenerales || {};
  
  const makeCell = (label, value, colSpan) => {
    const cleanVal = (value === '—' || value === null || value === undefined) ? "" : String(value);
    return {
      content: label + cleanVal,
      colSpan: colSpan,
      isBoldNormal: true,
      label: label,
      valText: cleanVal
    };
  };

  const datosGeneralesRows = [
    [
      makeCell("Institución Educativa: ", dg.institucionEducativa, 6),
      makeCell("Código modular: ", dg.codigoModular, 3),
      makeCell("REI: ", dg.rei, 3)
    ],
    [
      makeCell("Docente observado: ", dg.docenteObservado, 12)
    ],
    [
      makeCell("Nivel educativo: ", dg.nivelEducativo, 4),
      makeCell("Grado: ", dg.grado, 2),
      makeCell("Sección: ", dg.seccion, 2),
      makeCell("Área curricular observada: ", dg.areaCurricular, 4)
    ],
    [
      makeCell("N° de estudiantes matriculados: ", dg.estudiantesMatriculados, 4),
      makeCell("N° de estudiantes asistentes: ", dg.estudiantesAsistentes, 4),
      makeCell("N° de estudiantes con discapacidad o condición con diagnóstico: ", dg.estudiantesDiscapacidad, 4)
    ],
    [
      makeCell("Fecha: ", dg.fecha, 4),
      makeCell("Hora de inicio de la observación: ", dg.horaInicio, 4),
      makeCell("Hora de fin de la observación: ", dg.horaFin, 4)
    ],
    [
      makeCell("Nombre del monitor: ", dg.nombreMonitor, 12)
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2.2, textColor: [0, 0, 0], overflow: 'linebreak' },
    body: datosGeneralesRows,
    willDrawCell: (data) => {
      if (data.row.section === 'body') {
        if (data.cell.raw && data.cell.raw.isBoldNormal) {
          data.cell.rawText = data.cell.text;
          data.cell.text = data.cell.text.map(line => " ".repeat(line.length));
        }
      }
    },
    didDrawCell: (data) => {
      if (data.row.section === 'body') {
        const raw = data.cell.raw;
        if (raw && raw.isBoldNormal) {
          drawBoldNormalCellText(doc, data.cell, raw.label, 3.6);
        }
      }
    },
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });

  y = doc.lastAutoTable.finalY + 5.5;

  const pageBottomLimit = llevaMembrete ? BODY_BOTTOM : (M.pageH - 20);

  // ═══ II-B. DOCUMENTOS PEDAGÓGICOS QUE PRESENTA EL DOCENTE ═══
  if (y > pageBottomLimit - 30) { doc.addPage(); setupPage(); y = llevaMembrete ? 34 : 20; }

  const checkDocs = fichaData.documentosPedagogicos || {};
  const docPedRows = [
    ['Plan de estudios', `${checkDocs.planEstudios ? 'Sí X   No ○' : 'Sí ○   No X'}`],
    ['Unidad didáctica', `${checkDocs.unidadDidactica ? 'Sí X   No ○' : 'Sí ○   No X'}`],
    ['Sesión de aprendizaje', `${checkDocs.sesionAprendizaje ? 'Sí X   No ○' : 'Sí ○   No X'}`]
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
  y = doc.lastAutoTable.finalY + 5.5;

  // Consideraciones e Instrumentos
  if (y > pageBottomLimit - 40) {
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 34 : 20;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("Consideraciones e Instrumentos", M.left, y);
  y += 4.5;

  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  const textConsideraciones = 'Consideraciones generales, el cuadernillo del monitoreo pedagógico considera dos instrumentos, (1) "RÚBRICAS DE OBSERVACIÓN DE AULA" para la Evaluación del Desempeño Docente (MINEDU) y (2) "FICHA DE MONITOREO A LA PLANIFICACIÓN CURRICULAR DOCENTE" (DRELM). Ambos son independientes con ítems, rúbricas e insumos para el registro de la información y compromisos de mejora que parten de un dialogo reflexivo para la retroalimentación (revisar protocolo). La retroalimentación, lleva a cabo en un solo momento: al finalizar el registro de los dos instrumentos.';
  const splitConsideraciones = doc.splitTextToSize(textConsideraciones, CONTENT_W);
  doc.text(textConsideraciones, M.left, y, { align: "justify", maxWidth: CONTENT_W });
  y += (splitConsideraciones.length * 3.8) + 6.5;

  // II. INSTRUMENTO 1
  if (y > pageBottomLimit - 35) {
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 34 : 20;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("INSTRUMENTO 1: \"RÚBRICAS DE OBSERVACIÓN DE AULA\" (MINEDU)", M.pageW / 2, y, { align: 'center' });
  y += 5;

  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("I. INSTRUCCIONES:", M.left, y);
  y += 4;

  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  const instText = "El monitor observa detalladamente el desarrollo de la sesión utilizando las rúbricas de observación de aula del MINEDU y en la presente ficha registra las conductas observables que evidencian el desempeño docente (convirtiéndose en evidencias para la retroalimentación).";
  const splitInst = doc.splitTextToSize(instText, CONTENT_W);
  doc.text(instText, M.left, y, { align: "justify", maxWidth: CONTENT_W });
  y += (splitInst.length * 3.8) + 5.5;

  if (y > pageBottomLimit - 25) {
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 34 : 20;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("II. MATRIZ DE EVIDENCIAS PARA LA RETROALIMENTACIÓN:", M.left, y);
  y += 4.5;

  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  const textMatriz = 'El monitor Registra en su cuaderno de campo, las conductas observables que describen el desempeño del docente. Posteriormente, organiza y traslada esa información a esta parte "Matriz de evidencias para la retroalimentación", registrando las más relevantes y de manera diferenciada para cada desempeño observado, Al finalizar, determina y registra el nivel de logro, marcando con una X el nivel correspondiente según rúbrica y asegurando coherencia entre lo observado, lo registrado y los descriptores de la rúbrica.';
  const splitMatriz = doc.splitTextToSize(textMatriz, CONTENT_W);
  doc.text(textMatriz, M.left, y, { align: "justify", maxWidth: CONTENT_W });
  y += (splitMatriz.length * 3.8) + 5.5;

  const criteriosData = (fichaData.instrumento1 && fichaData.instrumento1.criterios) || [];
  
  const criteriosFieles = [
    {
      titulo: "1) Involucra activamente a los estudiantes en el proceso de aprendizaje.",
      bullets: [
        "- Acciones del docente para promover el interés de los estudiantes en las actividades de aprendizaje.",
        "- Proporción de estudiantes involucrados en la sesión.",
        "- Acciones del docente para favorecer la comprensión del sentido, importancia o utilidad de lo que se aprende."
      ],
      nivel: criteriosData[0]?.nivel ?? null,
      conductas: (criteriosData[0]?.conductasObservables && criteriosData[0]?.conductasObservables !== "(Sin conductas observables registradas)" && criteriosData[0]?.conductasObservables !== "—") ? criteriosData[0]?.conductasObservables : ""
    },
    {
      titulo: "2) Promueve el razonamiento, la creatividad y/o el pensamiento crítico.",
      bullets: [
        "- Actividades e interacciones (sea entre docente y estudiantes, o entre estudiantes) que promueven efectivamente el razonamiento, la creatividad y/o el pensamiento crítico."
      ],
      nivel: criteriosData[1]?.nivel ?? null,
      conductas: (criteriosData[1]?.conductasObservables && criteriosData[1]?.conductasObservables !== "(Sin conductas observables registradas)" && criteriosData[1]?.conductasObservables !== "—") ? criteriosData[1]?.conductasObservables : ""
    },
    {
      titulo: "3) Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes y adecuar su enseñanza.",
      bullets: [
        "- Monitoreo que realiza el docente del trabajo de los estudiantes y de sus avances durante la sesión.",
        "- Calidad de la retroalimentación que el docente brinda y/o la adaptación de las actividades que realiza en la sesión a partir de las necesidades de aprendizaje identificadas."
      ],
      nivel: criteriosData[2]?.nivel ?? null,
      conductas: (criteriosData[2]?.conductasObservables && criteriosData[2]?.conductasObservables !== "(Sin conductas observables registradas)" && criteriosData[2]?.conductasObservables !== "—") ? criteriosData[2]?.conductasObservables : ""
    },
    {
      titulo: "4) Propicia un ambiente de respeto y proximidad.",
      bullets: [
        "- Trato respetuoso y consideración hacia la perspectiva de los estudiantes.",
        "- Cordialidad o calidez que transmite el docente.",
        "- Comprensión y empatía del docente ante las necesidades afectivas o físicas de los estudiantes."
      ],
      nivel: criteriosData[3]?.nivel ?? null,
      conductas: (criteriosData[3]?.conductasObservables && criteriosData[3]?.conductasObservables !== "(Sin conductas observables registradas)" && criteriosData[3]?.conductasObservables !== "—") ? criteriosData[3]?.conductasObservables : ""
    },
    {
      titulo: "5) Regula positivamente el comportamiento de los estudiantes.",
      bullets: [
        "- Tipos de mecanismos que emplea el docente para regular el comportamiento y promover el respeto de las normas de convivencia en el aula: formativos, de control externo, de maltrato.",
        "- Eficacia con que el docente implementa los mecanismos para regular el comportamiento de los estudiantes, lo que se traduce en la mayor o menor continuidad en el desarrollo de la sesión."
      ],
      nivel: criteriosData[4]?.nivel ?? null,
      conductas: (criteriosData[4]?.conductasObservables && criteriosData[4]?.conductasObservables !== "(Sin conductas observables registradas)" && criteriosData[4]?.conductasObservables !== "—") ? criteriosData[4]?.conductasObservables : ""
    }
  ];

  const FIXED_NIVEL_ROW_H = 7; // v36: altura fija ~7 mm por fila (etiqueta + celdas I-IV)

  const celdaNivel = (num, marcado) => {
    return {
      content: marcado ? `${num}  X` : num,
      styles: {
        halign: "center",
        valign: "middle",
        fontStyle: marcado ? "bold" : "normal",
        fillColor: marcado ? [220, 220, 220] : [255, 255, 255],
        fontSize: 7.5,
        cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
        minCellHeight: FIXED_NIVEL_ROW_H
      }
    };
  };

  // Force a page break before starting the rubrics (R1) so R1 starts on a fresh page
  doc.addPage();
  setupPage();

  // ═══ v37: ALGORITMO FIJO POR POSICIÓN (par/impar) — reemplaza cálculo dinámico ═══
  // Cada bloque de desempeño va en una posición FIJA de la hoja:
  //   - Índice par (0, 2, 4) → nueva hoja, mitad SUPERIOR (startY = topPosition)
  //   - Índice impar (1, 3)  → MISMA hoja, mitad INFERIOR (startY = topPosition + halfHeight)
  // Resultado garantizado: R1+R2 (hoja A), R3+R4 (hoja B), R5 solo (hoja C) = 4 páginas total.
  const topPosition = llevaMembrete ? 34 : 20;
  const availableHeight = pageBottomLimit - topPosition;
  const halfHeight = availableHeight / 2;
  const HEADER_H = 8; // altura estimada del encabezado de la tabla (1 fila de header)
  // v37: altura del bloque de contenido (body) = media hoja - header
  const blockBodyHeight = halfHeight - HEADER_H;

  let currentY = topPosition;
  criteriosFieles.forEach((c, idx) => {
    // ── v37: posición determinística basada en índice par/impar ──
    if (idx % 2 === 0) {
      // Índice par: nueva hoja (excepto el primero, que ya tiene hoja), mitad superior
      if (idx > 0) {
        doc.addPage();
        setupPage();
      }
      currentY = topPosition; // posición fija: arriba
    } else {
      // Índice impar: MISMA hoja, mitad inferior — NUNCA agregar página aquí
      currentY = topPosition + halfHeight; // posición fija: abajo
    }

    // v37: para R5 (idx=4), usar altura reducida para dejar espacio a compromisos/firmas
    const isR5 = (idx === 4);
    const currentBlockBody = isR5 ? (blockBodyHeight - 45) : blockBodyHeight;

    // v37: el descriptor absorbe TODO el espacio sobrante; las 2 filas inferiores quedan fijas a 7 mm.
    // Suma: descriptorMinH + FIXED + FIXED = currentBlockBody
    const descriptorMinH = currentBlockBody - (2 * FIXED_NIVEL_ROW_H);

    const descriptorConVinetas = c.titulo + "\n" + c.bullets.join("\n");

    const singleBody = [
      [
        {
          content: descriptorConVinetas,
          colSpan: 4, // v39: cubre las 4 columnas de niveles (18 mm * 4 = 72 mm)
          isDescriptor: true,
          title: c.titulo,
          styles: {
            halign: 'left',
            overflow: 'linebreak',
            fontSize: 9,
            cellPadding: { top: 2, right: 4, bottom: 2, left: 2 },
            minCellHeight: descriptorMinH // v37: absorbe espacio sobrante → "Nivel de logro" queda al fondo
          }
        },
        {
          content: c.conductas,
          rowSpan: 3,
          styles: {
            valign: 'top',
            halign: 'left'
          }
        }
      ],
      [
        {
          content: "Nivel de logro:",
          colSpan: 4, // v39: cubre las 4 columnas de niveles (72 mm)
          styles: {
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
            fillColor: [250, 250, 250],
            cellPadding: { top: 1.5, bottom: 1, left: 2, right: 2 },
            minCellHeight: FIXED_NIVEL_ROW_H // v36: altura fija ~7 mm
          }
        }
      ],
      [
        celdaNivel("I", c.nivel === 1),
        celdaNivel("II", c.nivel === 2),
        celdaNivel("III", c.nivel === 3),
        celdaNivel("IV", c.nivel === 4)
      ]
    ];

    // Evitar colisiones de startY con la tabla anterior reseteando finalY
    if (doc.lastAutoTable) {
      doc.lastAutoTable.finalY = 0;
    }

    autoTable(doc, {
      startY: currentY,
      margin: { ...marginConfig, bottom: 2 }, // v38: bottom mínimo para que autoTable NO auto-pagine — la paginación es manual
      pageBreak: 'avoid', // v38: NUNCA partir la tabla entre páginas
      theme: 'grid',
      tableWidth: 160, // v37: ancho fijo
      styles: { font: "Arial", fontSize: 8.5, lineColor: [120, 120, 120], lineWidth: 0.2, valign: "top", cellPadding: { top: 2, right: 4, bottom: 2, left: 2 }, textColor: [0, 0, 0] },
      headStyles: { fillColor: [235, 235, 235], textColor: 20, fontStyle: "bold", halign: "center" },
      showHead: "everyPage",
      head: [[
        { content: "Desempeño y aspecto", colSpan: 4 }, // v39: colSpan 4
        { content: "Conductas observables que describen el desempeño" }
      ]],
      body: singleBody,
      columnStyles: {
        0: { cellWidth: 18 }, // v39: celda del nivel I (18 mm)
        1: { cellWidth: 18 }, // v39: celda del nivel II (18 mm)
        2: { cellWidth: 18 }, // v39: celda del nivel III (18 mm)
        3: { cellWidth: 18 }, // v39: celda del nivel IV (18 mm)
        4: { cellWidth: 88 }  // conductas
      },
      willDrawCell: (data) => {
        if (data.row.section === 'body') {
          if (data.cell.raw && data.cell.raw.isDescriptor) {
            data.cell.rawText = data.cell.text;
            data.cell.text = data.cell.text.map(line => " ".repeat(line.length));
          }
        }
      },
      didDrawCell: (data) => {
        if (data.row.section === 'body') {
          const raw = data.cell.raw;
          if (raw && raw.isDescriptor) {
            drawBoldNormalCellText(doc, data.cell, raw.title, 3.6);
          }
        }
      },
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });

    currentY = doc.lastAutoTable.finalY;
  });

  // Ajustes Addendum v33: Subir la tabla de compromisos y optimizar espaciado
  y = currentY + 3;

  // III. COMPROMISOS DE MEJORA
  if (y > pageBottomLimit - 25) {
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 34 : 20;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5);
  doc.text("III. COMPROMISOS DE MEJORA", M.left, y);
  y += 3.5;

  doc.setFont("Arial", "normal");
  doc.setFontSize(8); // v33: tamaño reducido
  const textCompromisos = 'A partir de las conductas observables registradas por cada uno de los desempeños y del diálogo reflexivo y haciendo uso de preguntas orientadoras (ver protocolo) anote en la primera columna el o los desempeños que el docente requiere mejorar. En la segunda columna, registre los compromisos de mejora relacionados con cada uno de los desempeños.';
  const splitCompromisos = doc.splitTextToSize(textCompromisos, CONTENT_W);
  if (y + (splitCompromisos.length * 3.3) > pageBottomLimit) {
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 34 : 20;
  }
  doc.text(textCompromisos, M.left, y, { align: "justify", maxWidth: CONTENT_W });
  y += (splitCompromisos.length * 3.3) + 4; // v33: reducido

  const compromisos = fichaData.compromisosMejora || [];
  let compRows = compromisos.map(c => [
    c.desempenoPorMejorar || "",
    c.compromisoMejora || ""
  ]).filter(row => row[0].trim() !== "" || row[1].trim() !== "");

  if (compRows.length === 0) {
    compRows = [["", ""]];
  }

  autoTable(doc, {
    startY: y,
    margin: marginConfig,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak', textColor: [0, 0, 0] },
    headStyles: { fillColor: [235, 235, 235], textColor: 20, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    },
    head: [["Desempeño por mejorar", "Compromisos de mejora"]],
    body: compRows.map(row => [
      { content: row[0], styles: { minCellHeight: 18 } }, // v33: celdas más cómodas (antes 15)
      { content: row[1], styles: { minCellHeight: 18 } }  // v33: celdas más cómodas (antes 15)
    ]),
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });

  y = doc.lastAutoTable.finalY + 4.5; // v33: reducido

  // IV. DECLARACIÓN
  if (y > pageBottomLimit - 22) { // v33: reducido
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 34 : 20;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(9.5); // v33: reducido
  doc.text("IV. DECLARACIÓN", M.left, y);
  y += 3.5; // v33: reducido

  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5); // v33: reducido
  
  const dec = fichaData.declaracion || {};
  const horaVal = dec.hora || "____";
  const diaVal = dec.dia || "____";
  const mesVal = dec.mes || "____";
  const anioVal = dec.anio || "2026";
  
  const decText = `En mérito de la retroalimentación brindada, a las ${horaVal} horas del día ${diaVal} de ${mesVal} del año ${anioVal}, en calidad de docente monitoreado y observador firmamos el presente documento dando conformidad de haberse realizado la reunión.`;
  const linesCount = doc.splitTextToSize(decText, CONTENT_W).length;
  doc.text(decText, M.left, y, { maxWidth: CONTENT_W, align: 'justify' });
  y += (linesCount * 3.8) + 6; // v33: reducido

  // V. SIGNATURES
  if (y > pageBottomLimit - 25) {
    doc.addPage();
    setupPage();
    y = llevaMembrete ? 44 : 30;
  }

  const sigWidth = 65;
  const sigLineY = y + 18;
  
  // Left: Docente
  const docNombre = fichaData.firmas?.docente?.nombre || "";
  const docDni = (fichaData.firmas?.docente?.dni && fichaData.firmas?.docente?.dni !== "(Espacio en Blanco)") ? fichaData.firmas?.docente?.dni : "";
  const finalDocDni = docDni || "____________";
  
  // Right: Observador / Monitor
  const obsNombre = fichaData.firmas?.observador?.nombre || dg.nombreMonitor || "";
  const obsDni = (fichaData.firmas?.observador?.dni && fichaData.firmas?.observador?.dni !== "(Espacio en Blanco)") 
    ? fichaData.firmas?.observador?.dni 
    : (dg.monitorDNI || "");
  const finalObsDni = obsDni || "____________";

  // Draw line for Docente
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(M.left + 5, sigLineY, M.left + 5 + sigWidth, sigLineY);
  
  // Draw Docente Signature Image
  if (fichaData.firmaDocenteDataUrl) {
    try {
      doc.addImage(fichaData.firmaDocenteDataUrl, 'PNG', M.left + 5 + (sigWidth / 2) - 15, sigLineY - 14, 30, 13);
    } catch (e) {
      console.error(e);
    }
  }
  
  // Docente Text
  const labelDocente = "Firma del docente ";
  const labelDocenteW = doc.getTextWidth(labelDocente);
  const totalDocW = labelDocenteW + doc.getTextWidth(docNombre);
  const startDocX = M.left + 5 + (sigWidth / 2) - (totalDocW / 2);
  
  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  doc.text(labelDocente, startDocX, sigLineY + 4.5);
  doc.setFont("Arial", "bold");
  doc.text(docNombre, startDocX + labelDocenteW, sigLineY + 4.5);
  
  doc.setFont("Arial", "normal");
  doc.text(`DNI: ${finalDocDni}`, M.left + 5 + (sigWidth / 2), sigLineY + 8.5, { align: 'center' });

  // Draw line for Observador (Monitor)
  doc.line(M.pageW - M.right - sigWidth - 5, sigLineY, M.pageW - M.right - 5, sigLineY);

  // Draw Monitor Signature Image
  if (fichaData.firmaMonitorDataUrl) {
    try {
      doc.addImage(fichaData.firmaMonitorDataUrl, 'PNG', M.pageW - M.right - 5 - (sigWidth / 2) - 15, sigLineY - 14, 30, 13);
    } catch (e) {
      console.error(e);
    }
  }
  
  // Observador Text
  const labelObservador = "Firma del monitor ";
  const labelObservadorW = doc.getTextWidth(labelObservador);
  const totalObsW = labelObservadorW + doc.getTextWidth(obsNombre);
  const startObsX = M.pageW - M.right - 5 - (sigWidth / 2) - (totalObsW / 2);
  
  doc.setFont("Arial", "normal");
  doc.text(labelObservador, startObsX, sigLineY + 4.5);
  doc.setFont("Arial", "bold");
  doc.text(obsNombre, startObsX + labelObservadorW, sigLineY + 4.5);
  
  doc.setFont("Arial", "normal");
  doc.text(`DNI: ${finalObsDni}`, M.pageW - M.right - 5 - (sigWidth / 2), sigLineY + 8.5, { align: 'center' });

  // Output and Save
  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');

  doc.save(`Ficha_Monitoreo_EBA_${dg.docenteObservado || 'Docente'}_${dg.fecha || 'Fecha'}.pdf`);

  return { blob, base64 };
}
