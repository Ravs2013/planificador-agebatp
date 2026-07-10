import jsPDF from 'jspdf';
import { M, CONTENT_W, BODY_BOTTOM, BODY_TOP_PAGE1, BODY_TOP_OTHER, aplicarFuentesArial, drawChrome, drawAnio, drawSignatureBlock } from './membrete';

export function generarOficioPDF(oficioData, bannerDataURL, qrDataURL) {
  // A4 size, mm unit
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let pageCount = 0;

  // Detect role of specialist
  let cargoAutor = oficioData.remitente?.cargo || '';
  if (!cargoAutor && oficioData.remitente?.nombre) {
    const nameNorm = oficioData.remitente.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
        expediente: oficioData.expediente || 'XXXXX',
        clave: oficioData.clave || 'XXXXX',
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

  // Helper to add body paragraphs with pagination check
  const addParagraph = (text, { indent = 0, fontStyle = 'normal', fontSize = 10.5, afterSpace = 4.5 } = {}) => {
    doc.setFont("Arial", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    
    const leftX = LM + indent;
    const maxW = M.pageW - M.right - leftX;
    
    const lines = doc.splitTextToSize(text, maxW);
    const blockHeight = lines.length * (fontSize * 0.42);
    
    if (y + blockHeight > pageBottomLimit) {
      doc.addPage();
      setupPage();
      y = startYOther;
    }
    
    doc.text(text, leftX, y, { align: "justify", maxWidth: maxW });
    y += blockHeight + afterSpace;
  };

  // 1. Título del Oficio
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const numOficio = oficioData.numero || '____';
  const titleText = `OFICIO N.° ${numOficio}-2026-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP`;
  doc.text(titleText, M.pageW / 2, y, { align: 'center' });
  y += 8; // 8 mm spacing after title to date/destinatario (Addendum v11)

  // 2. Señor(a): on the left, Fecha on the right (same line)
  doc.setFont("Arial", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Señor(a):", LM, y);

  const fechaStr = oficioData.fecha || new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const cleanFecha = `Lima, ${fechaStr.replace(/^Lima,\s*/i, '')}`;
  doc.text(cleanFecha, M.pageW - M.right, y, { align: 'right' });
  y += 4.5; // space to name

  // 3. Destinatario Block
  const dest = oficioData.destinatario || {};
  addParagraph(dest.nombre || '________________________________________', { fontStyle: 'bold', fontSize: 10.5, afterSpace: 1.5 });
  addParagraph(dest.cargo || 'Director(a)', { fontSize: 10.5, afterSpace: 1.5 });
  addParagraph(dest.institucion || 'CEBA / CETPRO', { fontSize: 10.5, afterSpace: 1.5 });
  addParagraph("Presente.-", { fontSize: 10.5, afterSpace: 6 });

  // 4. Asunto and Referencia aligned
  const drawHeaderField = (label, val) => {
    if (y > pageBottomLimit - 18) {
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
    
    const valLinesCount = doc.splitTextToSize(val, maxValWidth).length;
    doc.text(val, valueX, y, { align: "justify", maxWidth: maxValWidth });
    y += (valLinesCount * 4.8) + 1.8;
  };

  drawHeaderField("ASUNTO", oficioData.asunto || 'REMITIR ACCIONES DEL MONITOREO PEDAGÓGICO');
  drawHeaderField("REFERENCIA", oficioData.referencia || 'Plan de Trabajo AGEBATP 2026');

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

  // 5. Body paragraphs
  const cuerpo = oficioData.cuerpo || [];
  if (Array.isArray(cuerpo)) {
    cuerpo.forEach(para => {
      if (para.trim()) {
        addParagraph(para.trim(), { fontSize: 10.5, afterSpace: 4.5 });
      }
    });
  } else if (typeof cuerpo === 'string') {
    cuerpo.split('\n').forEach(para => {
      if (para.trim()) {
        addParagraph(para.trim(), { fontSize: 10.5, afterSpace: 4.5 });
      }
    });
  }

  // 6. Despedida
  const despText = oficioData.despedida || "Hago propicia la ocasión para expresarle los sentimientos de mi especial consideración y estima.";
  addParagraph(despText, { fontSize: 10.5, afterSpace: 8 });

  // 7. Cierre Atentamente Centered
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

    // 2) Conformidad Jefa (Rosa Ninamango signs all)
    if (y + sigHeight > pageBottomLimit) {
      doc.addPage();
      setupPage();
      y = startYOther + 5;
    }

    doc.setFont("Arial", "normal");
    doc.setFontSize(10);
    const confText = "Con la conformidad del funcionario que suscribe remítase el presente Oficio a la Jefatura para su trámite correspondiente.";
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
    oficioData.remitente || {},
    {
      nombre: 'ROSA ISABEL NINAMANGO BALDEÓN',
      cargo: 'Jefa del Área de Gestión de la Educación Básica Alternativa y Técnico Productivo'
    }
  );

  // Output and Save
  const base64 = doc.output('datauristring').split(',')[1];
  const blob = doc.output('blob');

  const tipo = oficioData.programa === 'ETP' ? 'ETP' : 'EBA';
  doc.save(`Oficio_Monitoreo_${tipo}_${numOficio}.pdf`);

  return { blob, base64 };
}
