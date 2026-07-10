import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_BOTTOM, BODY_TOP_PAGE1, BODY_TOP_OTHER, aplicarFuentesArial, drawChrome, drawAnio, drawSignatureBlock } from './membrete';
import { ANTECEDENTES_2026, ANALISIS_BOILERPLATE_2026 } from '../data/antecedentes2026';

export function generarInformeATPDF(informeData, bannerDataURL, qrDataURL, chartImages = []) {
  const ensureArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) return val.split('\n').filter(Boolean);
    return [];
  };

  const cleanLabels = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/^(\*\*?)?Análisis\.?\:?(\*\*?)?\s*/i, '')
      .replace(/^(\*\*?)?Comentario\.?\:?(\*\*?)?\s*/i, '')
      .replace(/^(\*\*?)?Conclusión\.?\:?(\*\*?)?\s*/i, '')
      .replace(/(?:\s+|[\s\n\r]+)(\*\*?)?Análisis\.?\:?(\*\*?)?\s*/ig, ' ')
      .replace(/(?:\s+|[\s\n\r]+)(\*\*?)?Comentario\.?\:?(\*\*?)?\s*/ig, ' ')
      .replace(/(?:\s+|[\s\n\r]+)(\*\*?)?Conclusión\.?\:?(\*\*?)?\s*/ig, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let pageCount = 0;

  let cargoAutor = informeData.remitente?.cargo || '';
  if (!cargoAutor && informeData.remitente?.nombre) {
    const nameNorm = informeData.remitente.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nameNorm.includes("aracelli") || nameNorm.includes("suyo")) {
      cargoAutor = "Asistente";
    }
  }
  const llevaMembrete = !/ASISTENTE/i.test(cargoAutor);

  const setupPage = () => {
    if (llevaMembrete) {
      const esinadSeg = /etp|cetpro/i.test(cargoAutor || '') ? 'e_sinadmed_6' : 'e_sinadmed_11';
      drawChrome(doc, {
        conMembreteCompleto: true,
        banner: bannerDataURL,
        qr: qrDataURL,
        expediente: informeData.expediente || 'XXXXX',
        clave: informeData.clave || 'XXXXX',
        esinadSeg
      });
    }
    pageCount++;
  };

  setupPage();
  if (llevaMembrete) {
    drawAnio(doc);
  }

  let y = llevaMembrete ? BODY_TOP_PAGE1 : 20;

  const pageBottomLimit = llevaMembrete ? BODY_BOTTOM : (M.pageH - 20);
  const startYOther = llevaMembrete ? BODY_TOP_OTHER : 20;
  const LM = 30;
  const marginConfig = {
    top: llevaMembrete ? 34 : 20,
    left: LM,
    right: M.right,
    bottom: llevaMembrete ? 40 : 20
  };

  const addSectionTitle = (title) => {
    if (y > pageBottomLimit - 15) {
      doc.addPage();
      setupPage();
      y = startYOther;
    }
    doc.setFont("Arial", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title, LM, y);
    y += 5.5;
  };

  const addParagraph = (text, { indent = 0, isListItem = false, bullet = "", fontStyle = 'normal', fontSize = 10.5, afterSpace = 3.5, customBulletX = null, customTextX = null } = {}) => {
    doc.setFont("Arial", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    
    let textX, maxW;
    if (isListItem) {
      const xNum = customBulletX !== null ? customBulletX : LM + 10;
      textX = customTextX !== null ? customTextX : LM + 22.5;
      maxW = (210 - 20.0) - textX; // Calculate width based on page boundary (210 - 20 = 190)
      
      const lines = doc.splitTextToSize(text, maxW);
      const blockHeight = lines.length * (fontSize * 0.42);
      
      if (y + blockHeight > pageBottomLimit) {
        doc.addPage();
        setupPage();
        y = startYOther;
      }
      
      doc.setFont("Arial", "bold");
      doc.text(bullet, xNum, y);
      doc.setFont("Arial", fontStyle);
      doc.text(text, textX, y, { align: "justify", maxWidth: maxW });
      y += blockHeight + afterSpace;
    } else {
      textX = LM + indent;
      maxW = (210 - 20.0) - textX;
      
      const lines = doc.splitTextToSize(text, maxW);
      const blockHeight = lines.length * (fontSize * 0.42);
      
      if (y + blockHeight > pageBottomLimit) {
        doc.addPage();
        setupPage();
        y = startYOther;
      }
      
      doc.text(text, textX, y, { align: "justify", maxWidth: maxW });
      y += blockHeight + afterSpace;
    }
  };

  // 1. Título
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  const titleText = `INFORME N.° ${informeData.numero || '____'}-2026-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP`;
  const titleLines = doc.splitTextToSize(titleText, CONTENT_W);
  doc.text(titleLines, M.pageW / 2, y, { align: 'center' });
  y += (titleLines.length * 5) + 3;

  // 2. Cabecera A/De/Asunto/Referencia/Fecha
  const drawHeaderField = (label, name, cargo, val) => {
    if (y > pageBottomLimit - 20) {
      doc.addPage();
      setupPage();
      y = startYOther;
    }
    
    doc.setFont("Arial", "bold");
    doc.setFontSize(11);
    doc.text(label, LM, y);
    doc.text(":", LM + 22, y);

    doc.setFont("Arial", "normal");
    const valueX = LM + 40.7;
    const maxValWidth = M.pageW - M.right - valueX;
    
    if (val) {
      const valLinesCount = doc.splitTextToSize(val, maxValWidth).length;
      doc.text(val, valueX, y, { align: "justify", maxWidth: maxValWidth });
      y += (valLinesCount * 4.8) + 1.8;
    } else {
      doc.setFont("Arial", "bold");
      doc.text(name, valueX, y);
      doc.setFont("Arial", "normal");
      const cargoLinesCount = doc.splitTextToSize(cargo, maxValWidth).length;
      doc.text(cargo, valueX, y + 4.5, { align: "justify", maxWidth: maxValWidth });
      y += 4.5 + (cargoLinesCount * 4.8) + 1.8;
    }
  };

  drawHeaderField("A", informeData.destinatario?.nombre || 'ROSA ISABEL NINAMANGO BALDEÓN', informeData.destinatario?.cargo || 'Jefa del Área de Gestión de la Educación Básica Alternativa y Técnico Productivo');
  drawHeaderField("De", informeData.remitente?.nombre || 'ESPECIALISTA AGEBATP', informeData.remitente?.cargo || 'Especialista de Educación Básica Alternativa');
  drawHeaderField("Asunto", null, null, informeData.asunto || `Informe del desarrollo de la Asistencia Técnica del mes de ${informeData.mes} de ${informeData.anio}`);
  drawHeaderField("Referencia", null, null, informeData.referencia || 'Plan de Trabajo del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva.');
  drawHeaderField("Fecha", null, null, informeData.fecha || 'Lima, 24 de junio de 2026');

  // Divider
  if (y > pageBottomLimit - 5) { doc.addPage(); setupPage(); y = startYOther; }
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(LM, y, M.pageW - M.right, y);
  y += 6;

  // Apertura
  addParagraph(`Es grato dirigirme a usted para hacer llegar el informe del desarrollo de la Asistencia Técnica realizada por los especialistas del AGEBATP durante el mes de ${informeData.mes} de ${informeData.anio}.`, { fontSize: 10.5, afterSpace: 5 });

  // I. ANTECEDENTES
  addSectionTitle("I. ANTECEDENTES");
  const ant = ensureArray(informeData.antecedentes).length > 0 ? ensureArray(informeData.antecedentes) : ANTECEDENTES_2026;
  ant.forEach((item, idx) => {
    addParagraph(item, { isListItem: true, bullet: `1.${idx + 1}`, fontSize: 10.5, afterSpace: 3 });
  });
  y += 2.5;

  // II. ANÁLISIS
  addSectionTitle("II. ANÁLISIS");
  const boilerplate = ensureArray(informeData.analisisBoilerplate).length > 0 ? ensureArray(informeData.analisisBoilerplate) : ANALISIS_BOILERPLATE_2026;
  boilerplate.forEach((para, idx) => {
    addParagraph(para, { isListItem: true, bullet: `2.${idx + 1}`, fontSize: 10.5, afterSpace: 3.5 });
  });

  // Convocatorias
  addParagraph(`En el mes de ${informeData.mes}, se ha desarrollado la Asistencia Técnica a directores y coordinadores según se detalla a continuación:`, { isListItem: true, bullet: "2.7", fontSize: 10.5, afterSpace: 4 });

  const tableData = informeData.tablaConvocatorias || [];
  if (tableData.length > 0) {
    if (y > pageBottomLimit - 25) { doc.addPage(); setupPage(); y = startYOther; }
    const tableRows = tableData.map(row => [row.oficio || '', row.fecha || '', row.tematica || '']);
    autoTable(doc, {
      startY: y,
      margin: marginConfig,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2.2, overflow: 'linebreak' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 32, halign: 'center' },
        2: { cellWidth: 78 }
      },
      head: [["OFICIO DE CONVOCATORIA", "FECHA", "TEMÁTICA DE LA ASISTENCIA TÉCNICA"]],
      body: tableRows,
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  // Survey result paragraph
  if (informeData.parrafoResultadosSurvey) {
    addParagraph(informeData.parrafoResultadosSurvey, { isListItem: true, bullet: "2.8", fontSize: 10.5, afterSpace: 6 });
  }

  // Insert multiple satisfaction charts
  const graficasKeys = [
    'participacion_por_cargo',
    'resultados_generales',
    'contenidos',
    'metodologia',
    'facilitacion',
    'logistica',
    'comparativo_dimensiones',
    'detalle_por_item'
  ];

  const titles = [
    "Participación por cargo de los asistentes.",
    "Resultados generales de la asistencia técnica.",
    "Resultados de la dimensión Contenidos.",
    "Resultados de la dimensión Metodología.",
    "Resultados de la dimensión Facilitación.",
    "Resultados de la dimensión Logística.",
    "Comparativa de satisfacción por dimensión.",
    "Satisfacción por ítem."
  ];

  chartImages.forEach((img, idx) => {
    // 1. Determine natural dimensions and ratio
    const imgData = (img && typeof img === 'object') ? img.dataUrl : img;
    const imgW = (img && typeof img === 'object') ? img.width : 360;
    const imgH = (img && typeof img === 'object') ? img.height : 360;
    const aspect = imgH / imgW;

    // Width in mm in PDF
    let wMM = 90;
    if (idx === 6) wMM = 120;
    else if (idx === 7) wMM = 135;

    const hMM = wMM * aspect;

    // Total block height estimate
    const blockHeight = 4.5 + 5 + hMM + 5 + 4 + 6;

    if (y + blockHeight > pageBottomLimit) {
      doc.addPage();
      setupPage();
      y = startYOther + 5;
    }

    // 2. Draw Bullet "2.8.X" and "Figura N°X" (Bold)
    const subBullet = `2.8.${idx + 1}`;
    doc.setFont("Arial", "bold");
    doc.setFontSize(10.5);
    doc.text(subBullet, LM, y);

    doc.setFont("Arial", "bold");
    doc.setFontSize(9.5);
    doc.text(`Figura N°${idx + 1}`, LM + 15, y);
    y += 4.5;

    // 3. Draw Title (Italics) at LM + 15
    doc.setFont("Arial", "italic");
    doc.setFontSize(9.0);
    doc.text(titles[idx] || `Resultados de la figura ${idx + 1}.`, LM + 15, y);
    y += 5;

    // 4. Draw Chart (Centered)
    const xOffset = LM + 10 + (170 - wMM) / 2;
    try {
      if (imgData) {
        doc.addImage(imgData, 'PNG', xOffset, y, wMM, hMM);
        y += hMM;
      } else {
        y += 10;
      }
    } catch (e) {
      console.error("Error inserting chart image in PDF:", e);
      y += 10;
    }

    // 5. Draw Source (Italic, size 8) at LM + 15
    doc.setFont("Arial", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Fuente: Encuesta de satisfacción.", LM + 15, y + 3.5);
    y += 8;
    doc.setTextColor(30, 30, 30); // Restore text color

    // 6. Draw Descriptive Paragraph with indent: 15
    const graphKey = graficasKeys[idx];
    const graphInfo = informeData.graficas?.[graphKey];
    const rawText = graphInfo?.descripcion || graphInfo?.analisis || graphInfo?.texto || '';
    const descText = cleanLabels(rawText);
    if (descText) {
      addParagraph(descText, { indent: 15, fontSize: 10.5, afterSpace: 6 });
    }
  });

  // Síntesis Cualitativa de Comentarios Abiertos
  if (informeData.sintesis_comentarios) {
    addParagraph("Síntesis cualitativa de comentarios abiertos:", { fontSize: 10.5, fontStyle: 'bold', afterSpace: 3.5 });
    addParagraph(informeData.sintesis_comentarios, { fontSize: 10.5, fontStyle: 'normal', afterSpace: 6 });
  }

  // III. CONCLUSIONES
  addSectionTitle("III. CONCLUSIONES");
  const conclusions = ensureArray(informeData.conclusiones);
  conclusions.forEach((concl, idx) => {
    addParagraph(concl, { isListItem: true, bullet: `3.${idx + 1}`, fontSize: 10.5, afterSpace: 3 });
  });
  y += 2.5;

  // IV. RECOMENDACIONES
  addSectionTitle("IV. RECOMENDACIONES");
  const recommendations = ensureArray(informeData.recomendaciones);
  recommendations.forEach((rec, idx) => {
    addParagraph(rec, { isListItem: true, bullet: `4.${idx + 1}`, fontSize: 10.5, afterSpace: 3 });
  });
  y += 7;

  // Signatures
  const drawCenteredSignature = (remitenteObj, jefaObj) => {
    let sigHeight = 35;
    if (y + sigHeight > pageBottomLimit) { doc.addPage(); setupPage(); y = startYOther + 5; }

    doc.setFont("Arial", "normal");
    doc.setFontSize(10.5);
    doc.text("Atentamente,", LM, y);
    y += 6;

    doc.setFont("Arial", "italic");
    doc.setFontSize(9);
    doc.text("Documento firmado digitalmente", M.pageW / 2, y, { align: "center" });
    y += 2;

    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    doc.text("................................................................", M.pageW / 2, y, { align: "center" });
    y += 4;

    y = drawSignatureBlock(doc, remitenteObj.nombre || 'ESPECIALISTA MONITOR', remitenteObj.cargo || 'Especialista de Educación Básica Alternativa', y);
    y += 12;

    if (y + sigHeight > pageBottomLimit) { doc.addPage(); setupPage(); y = startYOther + 5; }

    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    const confText = "Con la conformidad del funcionario que suscribe remítase el presente Informe y su anexo a la Jefatura para su trámite correspondiente.";
    const maxConfW = (210 - 22.5) - LM;
    const confLinesCount = doc.splitTextToSize(confText, maxConfW).length;
    doc.text(confText, LM, y, { align: "justify", maxWidth: maxConfW });
    y += (confLinesCount * 4.2) + 8;

    doc.setFont("Arial", "italic");
    doc.setFontSize(9);
    doc.text("Documento firmado digitalmente", M.pageW / 2, y, { align: "center" });
    y += 2;

    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    doc.text("................................................................", M.pageW / 2, y, { align: "center" });
    y += 4;

    y = drawSignatureBlock(doc, jefaObj.nombre || 'ROSA ISABEL NINAMANGO BALDEÓN', jefaObj.cargo || 'Jefa del Área de Gestión de la Educación Básica Alternativa y Técnico Productivo', y);
  };

  drawCenteredSignature(
    informeData.remitente || {},
    informeData.destinatario || {}
  );

  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');

  doc.save(`Informe_Asistencia_Tecnica_${informeData.mes || 'Consolidado'}_2026.pdf`);

  return { blob, base64 };
}
