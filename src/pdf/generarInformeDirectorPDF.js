import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_BOTTOM, BODY_TOP_PAGE1, BODY_TOP_OTHER, aplicarFuentesArial, drawChrome, drawAnio, drawSignatureBlock } from './membrete';
import { ANTECEDENTES_2026, ANALISIS_BOILERPLATE_2026 } from '../data/antecedentes2026';

export function generarInformeDirectorPDF(informeData, bannerDataURL, qrDataURL, chartImageBase64, aspectChartImages = []) {
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

  // Detect role of specialist
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

  // 1. Título del Informe
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
  drawHeaderField("Asunto", null, null, informeData.asunto || 'Informe de Monitoreo a la Gestión Directiva');
  drawHeaderField("Referencia", null, null, informeData.referencia || 'Plan de Trabajo AGEBATP 2026');
  drawHeaderField("Fecha", null, null, informeData.fecha || 'Lima, 24 de junio de 2026');

  // Divider
  if (y > pageBottomLimit - 5) { doc.addPage(); setupPage(); y = startYOther; }
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(LM, y, M.pageW - M.right, y);
  y += 6;

  // Apertura
  const mesName = informeData.mes || 'junio';
  const anioVal = informeData.anio || '2026';
  addParagraph(`Tengo a bien dirigirme a su despacho, para hacer de su conocimiento las acciones de monitoreo y acompañamiento pedagógico a la gestión directiva de los CEBA/CETPRO realizadas como especialista del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP) durante el mes de ${mesName} del ${anioVal}.`, { fontSize: 10.5, afterSpace: 5 });

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

  if (informeData.parrafoAplicacion) {
    addParagraph(informeData.parrafoAplicacion, { isListItem: true, bullet: `2.${boilerplate.length + 1}`, fontSize: 10.5, afterSpace: 3.5 });
  }

  let subSectionIndex = boilerplate.length + (informeData.parrafoAplicacion ? 1 : 0) + 1;

  // Institutions table
  const tableData = informeData.tablaInstituciones || [];
  if (tableData.length > 0) {
    if (y > pageBottomLimit - 25) { doc.addPage(); setupPage(); y = startYOther; }
    const tableRows = tableData.map(row => [row.n || '', row.monitoreo || '', row.inst || '']);
    autoTable(doc, {
      startY: y,
      margin: marginConfig,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 8.5, cellPadding: 2.2, overflow: 'linebreak' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 105 },
        2: { cellWidth: 43 }
      },
      head: [["N°", "DETALLE DEL MONITOREO DIRECTIVO", "INSTITUCIÓN EDUCATIVA"]],
      body: tableRows,
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  // Resultados
  addParagraph("Que, de las visitas a los directivos de las instituciones monitoreadas, se reportan los siguientes hallazgos por dimensión de gestión directiva:", { indent: 22.5, fontSize: 10.5, afterSpace: 3.5 });
  
  if (informeData.introduccionAnalisis) {
    addParagraph(informeData.introduccionAnalisis, { indent: 22.5, fontSize: 10.5, afterSpace: 5 });
  }

  // Helper for Run-in paragraph printing
  const addRunInParagraph = (label, body, afterSpace = 4) => {
    if (!body) return;
    const fullText = `${label} ${body}`;
    const lines = doc.splitTextToSize(fullText, M.pageW - LM - M.right);
    
    lines.forEach((line, idx) => {
      if (y > pageBottomLimit) {
        doc.addPage();
        setupPage();
        y = startYOther + 5;
      }
      
      if (idx === 0) {
        doc.setFont("Arial", "bold");
        doc.text(label, LM, y);
        const labelW = doc.getTextWidth(label + " ");
        doc.setFont("Arial", "normal");
        const restOfLine = line.substring(label.length).trim();
        doc.text(restOfLine, LM + labelW, y);
      } else {
        doc.setFont("Arial", "normal");
        doc.text(line, LM, y);
      }
      y += 4.5;
    });
    y += afterSpace;
  };

  // Cumplimiento consolidado por aspecto (Dynamic sequence numbering)
  addParagraph("Cumplimiento consolidado por aspecto", { isListItem: true, bullet: `2.${subSectionIndex}`, fontStyle: 'bold', fontSize: 10.5, afterSpace: 4 });
  subSectionIndex++;
  addParagraph("Que, la comparación del nivel de cumplimiento alcanzado por las instituciones monitoreadas en cada uno de los ocho aspectos evaluados se expone en el gráfico consolidado y en la tabla comparativa siguiente:", { indent: 22.5, fontSize: 10.5, afterSpace: 5 });

  // Insert Consolidado Chart (Bar chart of aspect completion %)
  if (chartImageBase64) {
    const chartW = 120;
    const chartH = 65;
    
    if (y + chartH + 15 > pageBottomLimit) {
      doc.addPage();
      setupPage();
      y = startYOther + 5;
    }

    doc.setFont("Arial", "bold");
    doc.setFontSize(8.5);
    doc.text("Gráfico N°01. Cumplimiento consolidado por aspecto de gestión.", LM + 10, y);
    y += 4;

    try {
      doc.addImage(chartImageBase64, 'PNG', 45, y, chartW, chartH);
      y += chartH;
    } catch (e) {
      console.error("Error inserting consolidado chart in PDF:", e);
      y += 10;
    }

    doc.setFont("Arial", "italic");
    doc.setFontSize(7.5);
    doc.text("Fuente: Fichas de Monitoreo a la Gestión 2026.", LM + 10, y + 2.5);
    y += 8;
  }

  // Legend Table
  const legendRows = [
    ["Asp. 01", "Gestión institucional"],
    ["Asp. 02", "Certificación y titulación (2024, 2025 y 2026)"],
    ["Asp. 03", "Planes de estudio y programas autorizados 2026"],
    ["Asp. 04", "EFSRT / PPP 2026"],
    ["Asp. 05", "Programas de Formación Continua (PFC)"],
    ["Asp. 06", "Gestión y administración de los recursos"],
    ["Asp. 07", "Gestión de la convivencia institucional"],
    ["Asp. 08", "Emprendimiento y empleabilidad"]
  ];
  if (y > pageBottomLimit - 30) {
    doc.addPage();
    setupPage();
    y = startYOther + 5;
  }
  autoTable(doc, {
    startY: y,
    margin: { left: LM + 10, right: LM + 10 },
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 120 }
    },
    head: [["Código", "Aspecto de Gestión Directiva"]],
    body: legendRows,
    didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
  });
  y = doc.lastAutoTable.finalY + 6;

  // Print run-in paragraphs for Consolidado
  const consInfo = informeData.graficas?.consolidado;
  if (consInfo) {
    const rawText = consInfo.texto || [consInfo.analisis, consInfo.comentario, consInfo.conclusion].filter(Boolean).join(' ');
    const cleanedText = cleanLabels(rawText);
    if (cleanedText) {
      addParagraph(cleanedText, { indent: 22.5, fontSize: 10.5, afterSpace: 6 });
    }
  }

  // Insert Detailed Organ Charts (dynamically)
  if (aspectChartImages && aspectChartImages.length > 0) {
    const organConfigs = [
      {
        bullet: `2.${subSectionIndex}`,
        titleText: "Órgano Directivo (V)",
        key: "organo_directivo",
        label: "Gráfico N°02. Órgano Directivo (Aspectos 01 y 02)."
      },
      {
        bullet: `2.${subSectionIndex + 1}`,
        titleText: "Órgano Académico (VI)",
        key: "organo_academico",
        label: "Gráfico N°03. Órgano Académico (Aspectos 03, 04 y 05)."
      },
      {
        bullet: `2.${subSectionIndex + 2}`,
        titleText: "Órgano de Administración (VII)",
        key: "organo_administracion",
        label: "Gráfico N°04. Órgano de Administración (Aspecto 06)."
      },
      {
        bullet: `2.${subSectionIndex + 3}`,
        titleText: "Órgano de Bienestar y Empleabilidad (VIII)",
        key: "organo_bienestar",
        label: "Gráfico N°05. Órgano de Bienestar y Empleabilidad (Aspectos 07 y 08)."
      }
    ];
    subSectionIndex += 4;

    organConfigs.forEach((cfg, idx) => {
      const img = aspectChartImages[idx];
      if (!img) return;

      // Header title for organ section
      addParagraph(cfg.titleText, { isListItem: true, bullet: cfg.bullet, fontStyle: 'bold', fontSize: 10.5, afterSpace: 4 });

      const chartW = 90;
      const chartH = 45;

      if (y + chartH + 12 > pageBottomLimit) {
        doc.addPage();
        setupPage();
        y = startYOther + 5;
      }

      doc.setFont("Arial", "bold");
      doc.setFontSize(8.5);
      doc.text(cfg.label, LM + 10, y);
      y += 3;

      try {
        doc.addImage(img, 'PNG', LM + 20, y, chartW, chartH);
        y += chartH;
      } catch (e) {
        console.error("Error inserting organ chart image in PDF:", e);
        y += 10;
      }

      doc.setFont("Arial", "italic");
      doc.setFontSize(7.5);
      doc.text("Fuente: Fichas de Monitoreo a la Gestión 2026.", LM + 10, y + 2.5);
      y += 8; // Spacing after source line

      // Draw the analysis, comment, and conclusion for this organ
      const orgInfo = informeData.graficas?.[cfg.key];
      if (orgInfo) {
        const rawText = orgInfo.texto || [orgInfo.analisis, orgInfo.comentario, orgInfo.conclusion].filter(Boolean).join(' ');
        const cleanedText = cleanLabels(rawText);
        if (cleanedText) {
          addParagraph(cleanedText, { indent: 22.5, fontSize: 10.5, afterSpace: 6 });
        }
      }
    });
  }

  // OneDrive Evidences Link
  if (informeData.linkEvidencias && informeData.linkEvidencias.url) {
    const evText = "Que, las evidencias de las fichas de gestión e informes de visitas se encuentran alojadas en el siguiente enlace:";
    addParagraph(evText, { isListItem: true, bullet: `2.${subSectionIndex}`, fontSize: 10.5, afterSpace: 3.5 });
    subSectionIndex++;

    if (y > pageBottomLimit - 10) { doc.addPage(); setupPage(); y = startYOther; }
    doc.setTextColor(5, 99, 193);
    doc.setFont("Arial", "bold");
    doc.textWithLink(informeData.linkEvidencias.texto || "Evidencias de Gestión", LM + 22.5, y, { url: informeData.linkEvidencias.url });
    
    const linkW = doc.getTextWidth(informeData.linkEvidencias.texto || "Evidencias de Gestión");
    doc.setDrawColor(5, 99, 193);
    doc.setLineWidth(0.12);
    doc.line(LM + 22.5, y + 0.5, LM + 22.5 + linkW, y + 0.5);

    doc.setTextColor(0);
    y += 6;
  }

  // III. CONCLUSIONES
  addSectionTitle("III. CONCLUSIONES");
  if (informeData.conclusionesIntro) {
    addParagraph(informeData.conclusionesIntro, { fontSize: 10.5, afterSpace: 3.5 });
  }

  const conclData = ensureArray(informeData.conclusionesTabla || []);
  const conclRows = conclData
    .map((c) => {
      if (typeof c === 'object' && c !== null) {
        const nudo = (c.nudoCritico || '').trim();
        const alt = (c.alternativa || '').trim();
        if (!nudo && !alt) return null;
        return [nudo || '—', alt || '—'];
      }
      return null;
    })
    .filter(row => row !== null)
    .map((row, i) => [i + 1, row[0], row[1]]);

  if (conclRows.length > 0) {
    if (y > pageBottomLimit - 25) { doc.addPage(); setupPage(); y = startYOther; }
    autoTable(doc, {
      startY: y,
      margin: marginConfig,
      theme: 'grid',
      styles: { font: 'Arial', fontSize: 8.5, cellPadding: 3, textColor: [30, 30, 30], overflow: 'linebreak' },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 75 },
        2: { cellWidth: 75 }
      },
      head: [["N°", "Nudos críticos identificados en la gestión", "Alternativas de solución propuestas"]],
      body: conclRows,
      didDrawPage: (data) => { if (data.pageNumber > pageCount) setupPage(); }
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // General conclusions with numerals
  const generalConclusions = ensureArray(informeData.conclusiones || []);
  if (generalConclusions.length > 0) {
    generalConclusions.forEach((concl, idx) => {
      addParagraph(concl, { isListItem: true, bullet: `3.${idx + 1}`, fontSize: 10.5, afterSpace: 3.5 });
    });
    y += 2.5;
  }

  // IV. RECOMENDACIONES
  addSectionTitle("IV. RECOMENDACIONES");
  const recs = ensureArray(informeData.recomendaciones);
  recs.forEach((rec, idx) => {
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

  const tipo = informeData.programa === 'ETP' ? 'ETP' : 'EBA';
  doc.save(`Informe_Gestion_Directiva_${tipo}_${informeData.numero || 'Consolidado'}.pdf`);

  return { blob, base64 };
}
