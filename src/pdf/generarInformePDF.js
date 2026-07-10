import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_BOTTOM, BODY_TOP_PAGE1, BODY_TOP_OTHER, aplicarFuentesArial, drawChrome, drawAnio, drawSignatureBlock } from './membrete';
import { ANTECEDENTES_2026, ANALISIS_BOILERPLATE_2026 } from '../data/antecedentes2026';

export function generarInformePDF(informeData, bannerDataURL, qrDataURL, chartImages) {
  // A4 size, mm unit
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
    drawAnio(doc); // Centered year slogans on page 1
  }

  let y = llevaMembrete ? BODY_TOP_PAGE1 : 20;

  const pageBottomLimit = llevaMembrete ? BODY_BOTTOM : (M.pageH - 20);
  const startYOther = llevaMembrete ? BODY_TOP_OTHER : 20;
  const LM = 30; // base body left margin
  const marginConfig = {
    top: llevaMembrete ? 34 : 20,
    left: LM,
    right: M.right,
    bottom: llevaMembrete ? 40 : 20
  };

  // Helper to draw section titles without underline
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

  // Helper to add body paragraphs with hanging indent (sangría francesa)
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
    doc.text(":", LM + 22, y); // Tabbed colon at LM + 22

    doc.setFont("Arial", "normal");
    const valueX = LM + 40.7; // exact Word spec
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
  drawHeaderField("Asunto", null, null, informeData.asunto || 'Informe de Monitoreo Pedagógico');
  drawHeaderField("Referencia", null, null, informeData.referencia || 'Plan de Trabajo AGEBATP 2026');
  drawHeaderField("Fecha", null, null, informeData.fecha || 'Lima, 24 de junio de 2026');

  // Divider line
  if (y > pageBottomLimit - 5) {
    doc.addPage();
    setupPage();
    y = startYOther;
  }
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(LM, y, M.pageW - M.right, y);
  y += 6;

  // Apertura
  const mesName = informeData.mes || 'junio';
  const anioVal = informeData.anio || '2026';
  addParagraph(`Tengo a bien dirigirme a su despacho, para hacer de su conocimiento las acciones realizadas como especialista del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP) durante el mes de ${mesName} del ${anioVal}.`, { fontSize: 10.5, afterSpace: 5 });

  // I. ANTECEDENTES
  addSectionTitle("I. ANTECEDENTES");
  const ant = Array.isArray(informeData.antecedentes) ? informeData.antecedentes : ANTECEDENTES_2026;
  ant.forEach((item, idx) => {
    addParagraph(item, { isListItem: true, bullet: `1.${idx + 1}`, fontSize: 10.5, afterSpace: 3 });
  });
  y += 2.5;

  // II. ANÁLISIS
  addSectionTitle("II. ANÁLISIS");
  
  const boilerplate = Array.isArray(informeData.analisisBoilerplate) ? informeData.analisisBoilerplate : ANALISIS_BOILERPLATE_2026;

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
    if (y > pageBottomLimit - 25) {
      doc.addPage();
      setupPage();
      y = startYOther;
    }

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
      head: [["N°", "DETALLE DEL MONITOREO", "INSTITUCIÓN EDUCATIVA"]],
      body: tableRows,
      didDrawPage: (data) => {
        if (data.pageNumber > pageCount) {
          setupPage();
        }
      }
    });

    y = doc.lastAutoTable.finalY + 5;
  }

  // Resultados
  const secResultadosNum = `2.${subSectionIndex}`;
  addParagraph("Que, se evidencian los siguientes resultados de la observación en aula:", { isListItem: true, bullet: secResultadosNum, fontSize: 10.5, afterSpace: 3.5 });
  subSectionIndex++;
  
  const resultados = Array.isArray(informeData.resultados) ? informeData.resultados : (typeof informeData.resultados === 'string' ? [informeData.resultados] : []);
  const charts = Array.isArray(chartImages) ? chartImages : (chartImages ? [{ base64: chartImages }] : []);
  
  charts.forEach((chart, idx) => {
    if (!chart || !chart.base64) return;
    const subBullet = `${secResultadosNum}.${idx + 1}`;
    const chartW = 120;
    const chartH = 60;
    const figNum = idx + 1;
    const title = chart.title || `Gráfico ${figNum}`;
    const caption = chart.caption || 'Fuente: Sistema de Monitoreo AGEBATP (2026).';

    // Figure block page break check
    if (y > pageBottomLimit - (chartH + 22)) {
      doc.addPage();
      setupPage();
      y = startYOther + 5;
    }

    // Draw the sub-bullet "2.8.X" and "Figura N°X: ..."
    doc.setFont("Arial", "bold");
    doc.setFontSize(10.5);
    doc.text(subBullet, LM, y);
    
    doc.setFont("Arial", "bold");
    doc.setFontSize(9.5);
    const figTitle = `Figura N°${figNum}: ${title}`;
    doc.text(figTitle, LM + 15, y);
    y += 4.5;

    // Chart image centered
    const chartX = M.left + (CONTENT_W - chartW) / 2;
    doc.addImage(chart.base64, 'PNG', chartX, y, chartW, chartH);
    y += chartH + 3;

    // Source caption
    doc.setFont("Arial", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(caption, M.pageW / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 8;

    // Print the corresponding analysis text under the chart
    const resText = resultados[idx];
    if (resText) {
      const cleanText = resText.replace(/^([a-z]\))\s*/i, '').replace(/^2\.8\.\d+\s*/, '').trim();
      addParagraph(cleanText, { indent: 15, fontSize: 10.5, afterSpace: 6 });
    }
  });

  // If there are more text results than charts, print them as subsequent numbered items under the section
  if (resultados.length > charts.length) {
    for (let idx = charts.length; idx < resultados.length; idx++) {
      const subBullet = `${secResultadosNum}.${idx + 1}`;
      const resText = resultados[idx];
      if (resText) {
        const cleanText = resText.replace(/^([a-z]\))\s*/i, '').replace(/^2\.8\.\d+\s*/, '').trim();
        addParagraph(cleanText, { isListItem: true, bullet: subBullet, customBulletX: LM, customTextX: LM + 15, fontSize: 10.5, afterSpace: 6 });
      }
    }
  }

  // OneDrive Evidences Link
  if (informeData.linkEvidencias && informeData.linkEvidencias.url) {
    const evText = "Que, las evidencias fotográficas y documentales se encuentran alojadas en el siguiente enlace:";
    addParagraph(evText, { isListItem: true, bullet: `2.${subSectionIndex}`, fontSize: 10.5, afterSpace: 3.5 });
    subSectionIndex++;
    
    if (y > pageBottomLimit - 10) {
      doc.addPage();
      setupPage();
      y = startYOther;
    }
    
    doc.setTextColor(5, 99, 193);
    doc.setFont("Arial", "bold");
    doc.textWithLink(informeData.linkEvidencias.texto || "Evidencias de Monitoreo", LM + 22.5, y, { url: informeData.linkEvidencias.url });
    
    // Underline evidence link
    const linkW = doc.getTextWidth(informeData.linkEvidencias.texto || "Evidencias de Monitoreo");
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

  const conclData = Array.isArray(informeData.conclusiones) ? informeData.conclusiones : [];
  const conclRows = conclData
    .map((c) => {
      if (typeof c === 'object' && c !== null) {
        const nudo = (c.nudoCritico || '').trim();
        const alt = (c.alternativa || '').trim();
        if (!nudo && !alt) return null;
        return [nudo || '—', alt || '—'];
      } else if (typeof c === 'string') {
        const str = c.trim();
        if (!str) return null;
        return [str, '—'];
      }
      return null;
    })
    .filter(row => row !== null)
    .map((row, i) => [i + 1, row[0], row[1]]);

  if (conclRows.length > 0) {
    if (y > pageBottomLimit - 25) {
      doc.addPage();
      setupPage();
      y = startYOther;
    }

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
      head: [["N°", "Nudos críticos identificados", "Alternativas de solución propuestas"]],
      body: conclRows,
      didDrawPage: (data) => {
        if (data.pageNumber > pageCount) {
          setupPage();
        }
      }
    });

    y = doc.lastAutoTable.finalY + 6;
  }

  // IV. RECOMENDACIONES
  addSectionTitle("IV. RECOMENDACIONES");
  const recs = Array.isArray(informeData.recomendaciones) ? informeData.recomendaciones : (typeof informeData.recomendaciones === 'string' ? [informeData.recomendaciones] : []);
  recs.forEach((rec, idx) => {
    addParagraph(rec, { isListItem: true, bullet: `4.${idx + 1}`, fontSize: 10.5, afterSpace: 3 });
  });
  y += 7;

  // Centered signatures blocks
  const drawCenteredSignature = (remitenteObj, jefaObj) => {
    // 1) Atentamente + Remitente
    let sigHeight = 35; // approximate height in mm
    if (y + sigHeight > pageBottomLimit) {
      doc.addPage();
      setupPage();
      y = startYOther + 5;
    }

    doc.setFont("Arial", "normal");
    doc.setFontSize(10.5);
    doc.text("Atentamente,", LM, y);
    y += 6; // 6 mm space

    doc.setFont("Arial", "italic");
    doc.setFontSize(9);
    doc.text("Documento firmado digitalmente", M.pageW / 2, y, { align: "center" });
    y += 2; // 2 mm space

    // Line of dots
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    doc.text("................................................................", M.pageW / 2, y, { align: "center" });
    y += 4; // 4 mm space to name

    y = drawSignatureBlock(doc, remitenteObj.nombre || 'ESPECIALISTA MONITOR', remitenteObj.cargo || 'Especialista de Educación Básica Alternativa', y);
    y += 12;

    // 2) Conformidad Jefa
    if (y + sigHeight > pageBottomLimit) {
      doc.addPage();
      setupPage();
      y = startYOther + 5;
    }

    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    const confText = "Con la conformidad del funcionario que suscribe remítase el presente Informe y su anexo a la Jefatura para su trámite correspondiente.";
    const maxConfW = (210 - 22.5) - LM; // 157.5 mm
    const confLinesCount = doc.splitTextToSize(confText, maxConfW).length;
    doc.text(confText, LM, y, { align: "justify", maxWidth: maxConfW });
    y += (confLinesCount * 4.2) + 8; // 8 mm space

    doc.setFont("Arial", "italic");
    doc.setFontSize(9);
    doc.text("Documento firmado digitalmente", M.pageW / 2, y, { align: "center" });
    y += 2; // 2 mm space

    // Line of dots
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    doc.text("................................................................", M.pageW / 2, y, { align: "center" });
    y += 4; // 4 mm space to name

    y = drawSignatureBlock(doc, jefaObj.nombre || 'ROSA ISABEL NINAMANGO BALDEÓN', jefaObj.cargo || 'Jefa del Área de Gestión de la Educación Básica Alternativa y Técnico Productivo', y);
  };

  drawCenteredSignature(
    informeData.remitente || {},
    informeData.destinatario || {}
  );

  // Return and Save
  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');

  const tipo = informeData.programa === 'ETP' ? 'ETP' : 'EBA';
  doc.save(`Informe_Monitoreo_${tipo}_${informeData.numero || 'Consolidado'}.pdf`);

  return { blob, base64 };
}
