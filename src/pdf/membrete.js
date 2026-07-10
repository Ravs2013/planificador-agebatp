import { FONT_ARIAL_NORMAL, FONT_ARIAL_BOLD, FONT_ARIAL_ITALIC, FONT_ARIAL_BOLDITALIC } from './fuentesArial';

// Margins and dimensions in mm for A4 (210 x 297 mm)
export const M = {
  left: 27.5,
  right: 22.5,
  top: 9.5,
  bottom: 34.9,
  pageW: 210,
  pageH: 297
};

export const CONTENT_W = M.pageW - M.left - M.right; // 160 mm
export const BANNER_BOTTOM = 26.6;
export const BODY_TOP_PAGE1 = 46; // after banner + year
export const BODY_TOP_OTHER = 30; // after banner only
export const BODY_BOTTOM = 258; // limit before footer

export function mmFromPt(pt) {
  return pt * 0.3528;
}

// Loads local image URL as Base64 Data URL (used asynchronously before PDF generation)
export async function loadImageDataURL(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = (e) => reject(e);
      r.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Error loading image as data URL:", err);
    return null;
  }
}

// Injects the custom base64 Arial fonts into the jsPDF instance
export function aplicarFuentesArial(doc) {
  if (!doc) return;

  // Register Font files in Virtual File System (VFS)
  doc.addFileToVFS('Arial-normal.ttf', FONT_ARIAL_NORMAL);
  doc.addFileToVFS('Arial-bold.ttf', FONT_ARIAL_BOLD);
  doc.addFileToVFS('Arial-italic.ttf', FONT_ARIAL_ITALIC);
  doc.addFileToVFS('Arial-bolditalic.ttf', FONT_ARIAL_BOLDITALIC);

  // Register Fonts mapping
  doc.addFont('Arial-normal.ttf', 'Arial', 'normal');
  doc.addFont('Arial-normal.ttf', 'Arial MT', 'normal'); // Mapping Arial MT to Arial regular

  doc.addFont('Arial-bold.ttf', 'Arial', 'bold');
  doc.addFont('Arial-bold.ttf', 'Arial MT', 'bold');

  doc.addFont('Arial-italic.ttf', 'Arial', 'italic');
  doc.addFont('Arial-italic.ttf', 'Arial MT', 'italic');

  doc.addFont('Arial-bolditalic.ttf', 'Arial', 'bolditalic');
  doc.addFont('Arial-bolditalic.ttf', 'Arial MT', 'bolditalic');

  // Set default font
  doc.setFont('Arial', 'normal');
}

export function marcoEsquinasQR(doc, x, y, size, len = 4) {
  doc.setDrawColor(0); 
  doc.setLineWidth(0.4);
  // sup-izq
  doc.line(x, y, x+len, y);
  doc.line(x, y, x, y+len);
  // sup-der
  doc.line(x+size-len, y, x+size, y);
  doc.line(x+size, y, x+size, y+len);
  // inf-izq
  doc.line(x, y+size-len, x, y+size);
  doc.line(x, y+size, x+len, y+size);
  // inf-der
  doc.line(x+size, y+size-len, x+size, y+size);
  doc.line(x+size-len, y+size, x+size, y+size);
}

// Draws the top banner and optionally the vertical legal text and E-SINAD footer
export function drawChrome(doc, { conMembreteCompleto = false, banner, qr, expediente = 'XXXXX', clave = 'XXXXX', esinadSeg = 'e_sinadmed_11' } = {}) {
  if (!doc) return;

  // 1) Banner (always drawn in all pages)
  if (banner) {
    try {
      doc.addImage(banner, "JPEG", M.left, 8, CONTENT_W, CONTENT_W / 8.6);
    } catch (e) {
      console.warn("Error drawing banner in PDF:", e);
    }
  }

  if (!conMembreteCompleto) return; // For Acta and Ficha, only draw banner

  // 2) Left vertical text (rotated 90 degrees, reads bottom-to-top)
  doc.saveGraphicsState(); // Save state to avoid side effects of transformations
  doc.setFont("Arial", "italic");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);

  const fr1 = "Documento electrónico firmado digitalmente en el marco de la Ley N° 27269, Ley de Firmas y Certificados Digitales, su Reglamento y modificatorias.";
  const fr2a = "La integridad del documento y la autoría de la(s) firma(s) pueden ser verificadas en ";
  const url1 = "https://apps.firmaperu.gob.pe/web/validador.xhtml";

  const anchorY = 256; // raised to stay above footer line

  // Column 1 (x=9)
  doc.text(fr1, 9, anchorY, { angle: 90 });

  // Column 2 (x=13)
  doc.text(fr2a, 13, anchorY, { angle: 90 });

  // Blue, bold, underlined, clickable URL at the end of Column 2
  const prefijoLength = doc.getTextWidth(fr2a);
  const yUrl = anchorY - prefijoLength;
  const urlLength = doc.getTextWidth(url1);

  doc.setFont("Arial", "bolditalic");
  doc.setTextColor(5, 99, 193); // #0563C1 azul
  doc.textWithLink(url1, 13, yUrl, { url: url1, angle: 90 });

  // Draw manual underline under URL
  doc.setDrawColor(5, 99, 193);
  doc.setLineWidth(0.12);
  doc.line(13.8, yUrl, 13.8, yUrl - urlLength);
  
  doc.restoreGraphicsState(); // Restore state

  // 3) E-SINAD Footer
  dibujarPieEsinad(doc, { expediente, clave, esinadSeg });
}

// Pie E-SINAD para informe y oficio. Dibujar en CADA página.
// A4 (mm). Requiere Arial/Arial MT registradas (addFont). Coordenadas absolutas de página.
export function dibujarPieEsinad(doc, { expediente = "XXXXX", clave = "XXXXX", esinadSeg = "e_sinadmed_11" } = {}) {
  const RED = [255, 0, 0];

  // 1) Línea horizontal negra (casi hasta el borde derecho)
  doc.setDrawColor(0); doc.setLineWidth(0.5);
  doc.line(42, 260.9, 207.5, 260.9);

  // 2) Marco del QR = 4 esquinas (el QR se pega a mano)
  marcoEsquinasQR(doc, 5.2, 263.4, 29.5, 4);

  // 3) EXPEDIENTE / CLAVE (Arial 7 negrita, negro)
  doc.setTextColor(0, 0, 0);
  doc.setFont("Arial", "bold"); doc.setFontSize(7);
  doc.text(`EXPEDIENTE: AGEBATP2026-INT-${expediente}`, 41.6, 264);
  doc.text(`CLAVE: ${clave}`, 98.3, 264);

  // 4) Texto legal (Arial MT 7, JUSTIFICADO, ancho 89 mm -> 5 líneas)
  doc.setFont("Arial", "normal"); doc.setFontSize(7);
  const legal = "Esto es una copia auténtica imprimible de un documento electrónico archivado en el Ministerio de Educación, aplicando lo dispuesto por el Art. 25 de D.S. 070-2013-PCM y la Tercera Disposición Complementaria Final del D.S. 026-2016-PCM. Su autenticidad e integridad pueden ser contrastadas a través de la siguiente dirección web:";
  doc.text(legal, 41.6, 269, { maxWidth: 89, align: "justify", lineHeightFactor: 1.25 });

  // 5) URL esinad (Arial 6.5 negrita)
  doc.setFont("Arial", "bold"); doc.setFontSize(6.5);
  const esinadUrl = `https://esinad.minedu.gob.pe/${esinadSeg}/VDD_ConsultaDocumento.aspx`;
  doc.textWithLink(esinadUrl, 41.6, 285, { url: esinadUrl });

  // 6) Bloque derecho: www.ugel03 (rojo, centrado vertical) | barra roja | dirección (negro)
  doc.setFont("Arial", "bold"); doc.setFontSize(7); doc.setTextColor(...RED);
  doc.text("www.ugel03.gob.pe", 135, 276.6, { baseline: "middle" });
  doc.setDrawColor(...RED); doc.setLineWidth(0.6);
  doc.line(162, 270.9, 162, 282.3);
  doc.setTextColor(0, 0, 0); doc.setFont("Arial", "normal"); doc.setFontSize(6.5);
  doc.text("Av. Iquitos 918 La Victoria, Lima 13", 165, 272.5);
  doc.text("T: (01) 427-3210 / (01) 426-2627", 165, 275.5);
  doc.text("(01) 561-9184 / (01) 426-1562", 165, 278.5);
  doc.text("(01) 206-6666", 165, 281.5);
  doc.setFont("Arial", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
}

// Draws the year slogans centered (ONLY on page 1)
export function drawAnio(doc) {
  if (!doc) return;
  doc.setFont("Arial", "italic");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('"Decenio de la Igualdad de oportunidades para mujeres y hombres"', M.pageW / 2, 34.6, { align: "center" });
  doc.text('"Año de la Esperanza y el Fortalecimiento de la Democracia"', M.pageW / 2, 38.1, { align: "center" });
  doc.setFont("Arial", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
}

// Dynamic signature block generator
export function drawSignatureBlock(doc, name, cargo, yStart) {
  let y = yStart;
  const cleanName = (name || "").trim();
  const cleanCargo = (cargo || "").trim();
  
  let line1 = cleanName.toUpperCase();
  let line2 = cleanCargo;
  let line3 = "AGEBATP – UGEL N° 03";
  let line4 = "Unidad de Gestión Educativa Local N° 03";
  
  const isEBA = cleanCargo.toLowerCase().includes("eba") || cleanName.toLowerCase().includes("nelida") || cleanName.toLowerCase().includes("lucy") || cleanName.toLowerCase().includes("aracelli");
  const isETP = cleanCargo.toLowerCase().includes("etp") || cleanCargo.toLowerCase().includes("técnico") || cleanName.toLowerCase().includes("juan") || cleanName.toLowerCase().includes("francisco") || cleanName.toLowerCase().includes("beronica") || cleanName.toLowerCase().includes("isabel") || cleanName.toLowerCase().includes("liz");
  
  if (cleanName.toLowerCase().includes("nelida") && cleanName.toLowerCase().includes("albino")) {
    line1 = "NÉLIDA ALBINO IGREDA";
    line2 = "Especialista EBA de Educación Básica Alternativa y Técnico Productiva";
    line3 = "UGEL N° 03 — AGEBATP — EBA";
  } else if (cleanName.toLowerCase().includes("aracelli") && cleanName.toLowerCase().includes("gonzales")) {
    line1 = "ARACELLI DEL CARMEN GONZALES SÁNCHEZ";
    line2 = "Asistente de Monitoreo y Evaluación Pedagógica de EBA";
    line3 = "UGEL N° 03 — AGEBATP — EBA";
  } else if (cleanName.toLowerCase().includes("isabel") && cleanName.toLowerCase().includes("suyo")) {
    line1 = "ISABEL INÉS SUYO VILLAR";
    line2 = "Asistente de Monitoreo y Evaluación Pedagógica de ETP";
    line3 = "UGEL N° 03 — AGEBATP — ETP";
  } else if (isEBA) {
    line3 = "UGEL N° 03 — AGEBATP — EBA";
  } else if (isETP) {
    line3 = "UGEL N° 03 — AGEBATP — ETP";
  }
  
  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text(line1, M.pageW / 2, y, { align: "center" });
  y += 4;
  
  doc.setFont("Arial", "normal");
  doc.setFontSize(8.5);
  doc.text(line2, M.pageW / 2, y, { align: "center" });
  y += 4;
  doc.text(line3, M.pageW / 2, y, { align: "center" });
  y += 4;
  doc.text(line4, M.pageW / 2, y, { align: "center" });
  
  return y;
}
