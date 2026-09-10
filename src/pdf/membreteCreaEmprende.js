/* ═══════════════════════════════════════════════════════════════
   CREA Y EMPRENDE 2026 — CHROME, PIE Y BLOQUES DE FIRMA PARA PDF (jsPDF, milímetros)
   Membrete institucional: public/membrete-crea-emprende.png, cargado una sola vez por sesión.
   ═══════════════════════════════════════════════════════════════ */

import { aplicarFuentesArial, loadImageDataURL } from './membrete';
import { TEXTOS_LEGALES_CYE } from '../data/creaEmprendeConfig';

export { aplicarFuentesArial, loadImageDataURL };

export const M = { top: 12, right: 12, bottom: 16, left: 12 };
export const A4 = { ancho: 210, alto: 297 };
export const A4_APAISADO = { ancho: 297, alto: 210 };

export const RGB_CYE = {
  navy1: [12, 25, 41], navy2: [18, 34, 64], navy3: [27, 58, 92], dorado: [202, 138, 4],
  gris800: [30, 41, 59], gris700: [51, 65, 85], gris500: [100, 116, 139], gris300: [203, 213, 225],
  gris200: [226, 232, 240], gris100: [241, 245, 249], gris50: [248, 250, 252], blanco: [255, 255, 255],
  verde: [21, 128, 61], rojo: [185, 28, 28], ambar: [180, 83, 9]
};

const RATIO_MEMBRETE = 2928 / 182;

export function dimsPagina(orientacion = 'portrait') {
  return orientacion === 'landscape' ? A4_APAISADO : A4;
}

export function anchoContenido(orientacion = 'portrait') {
  return dimsPagina(orientacion).ancho - M.left - M.right;
}

let membreteCache = null;
let membretePromesa = null;

export async function obtenerMembreteCYE() {
  if (membreteCache) return membreteCache;
  if (!membretePromesa) {
    membretePromesa = loadImageDataURL('/membrete-crea-emprende.png')
      .then(data => { membreteCache = data; return data; })
      .catch(() => null);
  }
  return membretePromesa;
}

export function medirChromeCYE(doc, { orientacion = 'portrait', titulo = '', subtitulo = '', banner = null } = {}) {
  const contentW = anchoContenido(orientacion);
  let y = M.top + (banner ? contentW / RATIO_MEMBRETE + 3.5 : 4) + 0.9 + 4.5;
  if (titulo) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(orientacion === 'landscape' ? 11.5 : 11);
    y += doc.splitTextToSize(titulo, contentW).length * 4.6;
  }
  if (subtitulo) {
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8.5);
    y += doc.splitTextToSize(subtitulo, contentW).length * 3.8;
  }
  return y + 2;
}

/** Encabezado de página: membrete, franja dorada, título y subtítulo. Devuelve la Y del cuerpo. */
export function drawChromeCYE(doc, { orientacion = 'portrait', titulo = '', subtitulo = '', banner = null } = {}) {
  const dims = dimsPagina(orientacion);
  const contentW = anchoContenido(orientacion);
  let y = M.top;
  if (banner) {
    try {
      const alto = contentW / RATIO_MEMBRETE;
      doc.addImage(banner, String(banner).startsWith('data:image/png') ? 'PNG' : 'JPEG', M.left, y, contentW, alto, 'membrete-cye', 'FAST');
      y += alto + 3.5;
    } catch (e) {
      y += 6;
    }
  } else {
    y += 4;
  }
  doc.setFillColor(...RGB_CYE.dorado);
  doc.rect(M.left, y, contentW, 0.9, 'F');
  y += 4.5;
  if (titulo) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(orientacion === 'landscape' ? 11.5 : 11);
    doc.setTextColor(...RGB_CYE.navy2);
    const lineas = doc.splitTextToSize(titulo, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 4.6;
  }
  if (subtitulo) {
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...RGB_CYE.gris700);
    const lineas = doc.splitTextToSize(subtitulo, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 3.8;
  }
  return y + 2;
}

/** Pie de todas las páginas. Se llama una sola vez, al final. */
export function aplicarPiePaginasCYE(doc, { preliminar = false } = {}) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const yFranja = alto - M.bottom + 2;
    doc.setFillColor(...RGB_CYE.dorado);
    doc.rect(M.left, yFranja, ancho - M.left - M.right, 0.7, 'F');
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...RGB_CYE.gris500);
    doc.text(TEXTOS_LEGALES_CYE.pieInstitucional, M.left, yFranja + 4);
    doc.text(`Página ${i} de ${total}`, ancho - M.right, yFranja + 4, { align: 'right' });
    if (preliminar) {
      doc.setFont('Arial', 'bold');
      doc.text(TEXTOS_LEGALES_CYE.pieDocumentoPreliminar, ancho / 2, yFranja + 8, { align: 'center' });
    }
  }
}

export function limiteCuerpo(orientacion = 'portrait') {
  return dimsPagina(orientacion).alto - M.bottom - 6;
}

export function cederHilo() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/** Bloque de firma resuelto contra el Panel de Firmas. Sin firmante, imprime las líneas en blanco. */
export function drawBloqueFirmaCYE(doc, { x, y, ancho = 70, firmante = null, numeroJurado = 1, conInstitucion = true, conFecha = false, fecha = '', compacto = false }) {
  const centro = x + ancho / 2;
  const altoFirma = compacto ? 11 : 14;
  let cursor = y;

  if (firmante && firmante.firmaDataUrl && String(firmante.firmaDataUrl).startsWith('data:image')) {
    try {
      const anchoImg = Math.min(ancho * 0.62, 42);
      doc.addImage(firmante.firmaDataUrl, 'PNG', centro - anchoImg / 2, cursor, anchoImg, altoFirma);
    } catch (e) {
      doc.setFont('Arial', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...RGB_CYE.gris500);
      doc.text('(Firma manuscrita)', centro, cursor + altoFirma - 2, { align: 'center' });
    }
  }
  cursor += altoFirma + 1;
  doc.setDrawColor(...RGB_CYE.gris500);
  doc.setLineWidth(0.3);
  doc.line(x, cursor, x + ancho, cursor);
  cursor += 3.4;

  const pendiente = !firmante || firmante.pendiente;
  doc.setFontSize(compacto ? 6.9 : 7.3);
  doc.setTextColor(...RGB_CYE.gris800);
  if (pendiente) {
    doc.setFont('Arial', 'normal');
    doc.text('Nombres y apellidos: ________________________', centro, cursor, { align: 'center' });
    cursor += 3.3;
    if (conInstitucion) { doc.text('Institución: ______________________________', centro, cursor, { align: 'center' }); cursor += 3.3; }
    doc.text('DNI: ______________', centro, cursor, { align: 'center' });
    cursor += 3.3;
  } else {
    doc.setFont('Arial', 'bold');
    const nombre = doc.splitTextToSize(String(firmante.nombreCompleto || '').toUpperCase(), ancho);
    doc.text(nombre, centro, cursor, { align: 'center' });
    cursor += nombre.length * 3.2;
    doc.setFont('Arial', 'normal');
    if (conInstitucion && firmante.institucion) {
      const inst = doc.splitTextToSize(firmante.institucion, ancho);
      doc.text(inst, centro, cursor, { align: 'center' });
      cursor += inst.length * 3.1;
    }
    doc.text(`DNI: ${firmante.dni || ''}`, centro, cursor, { align: 'center' });
    cursor += 3.2;
  }
  if (conFecha) {
    doc.setFont('Arial', 'normal');
    doc.text(`Fecha: ${fecha || '____________'}`, centro, cursor, { align: 'center' });
    cursor += 3.2;
  }
  doc.setFont('Arial', 'bold');
  doc.setTextColor(...RGB_CYE.navy2);
  doc.text(firmante && firmante.presidente ? `Jurado N.° ${numeroJurado} — Preside el jurado` : `Jurado N.° ${numeroJurado}`, centro, cursor, { align: 'center' });
  return cursor + 3.4;
}

export function drawFilaFirmasCYE(doc, { bloques = [], y, orientacion = 'portrait', conInstitucion = true }) {
  const contentW = anchoContenido(orientacion);
  const n = Math.max(1, bloques.length);
  const anchoCol = contentW / n;
  const anchoBloque = Math.min(anchoCol - 8, 80);
  let maxY = y;
  bloques.forEach((bloque, i) => {
    const x = M.left + i * anchoCol + (anchoCol - anchoBloque) / 2;
    const fin = drawBloqueFirmaCYE(doc, { x, y, ancho: anchoBloque, firmante: bloque, numeroJurado: bloque?.numeroJurado || i + 1, conInstitucion, compacto: n > 2 });
    if (fin > maxY) maxY = fin;
  });
  return maxY;
}
