/* ═══════════════════════════════════════════════════════════════
   PRECONGRESO DE COPAE – UGEL 03 — MEMBRETE, ENCABEZADO Y PIE DE PÁGINA (PDF)
   Membrete oficial: public/membrete-copae.png (2703 x 313 px)
   ═══════════════════════════════════════════════════════════════ */

import { aplicarFuentesArial, loadImageDataURL } from './membrete';

export { aplicarFuentesArial, loadImageDataURL };

export const M = { top: 12, right: 14, bottom: 16, left: 14 };
export const A4 = { ancho: 210, alto: 297 };
export const A4_APAISADO = { ancho: 297, alto: 210 };

export const RGB_COPAE = {
  navy1: [12, 25, 41],
  navy2: [18, 34, 64],
  navy3: [27, 58, 92],
  dorado: [202, 138, 4],
  gris800: [30, 41, 59],
  gris700: [51, 65, 85],
  gris500: [100, 116, 139],
  gris300: [203, 213, 225],
  gris200: [226, 232, 240],
  gris100: [241, 245, 249],
  gris50: [248, 250, 252],
  blanco: [255, 255, 255],
  verde: [21, 128, 61],
  verdeBg: [220, 252, 231],
  azul: [29, 78, 216],
  azulBg: [219, 234, 254],
  ambar: [180, 83, 9],
  rojo: [185, 28, 28]
};

// Proporción exacta de la imagen del membrete de COPAE (2703 / 313)
const RATIO_MEMBRETE = 2703 / 313;

export function dimsPagina(orientacion = 'portrait') {
  return orientacion === 'landscape' ? A4_APAISADO : A4;
}

export function anchoContenido(orientacion = 'portrait') {
  return dimsPagina(orientacion).ancho - M.left - M.right;
}

let membreteCache = null;
let membretePromesa = null;

export async function obtenerMembreteCOPAE() {
  if (membreteCache) return membreteCache;
  if (!membretePromesa) {
    membretePromesa = loadImageDataURL('/membrete-copae.png')
      .then(data => {
        membreteCache = data;
        return data;
      })
      .catch(err => {
        console.warn('Error cargando membrete COPAE:', err);
        return null;
      });
  }
  return membretePromesa;
}

export function drawChromeCOPAE(doc, { orientacion = 'portrait', banner = null, titulo = '', subtitulo = '', lema = '' } = {}) {
  const dims = dimsPagina(orientacion);
  const contentW = anchoContenido(orientacion);
  let y = M.top;

  if (banner) {
    try {
      const alto = contentW / RATIO_MEMBRETE;
      doc.addImage(banner, 'PNG', M.left, y, contentW, alto, 'membrete-copae', 'FAST');
      y += alto + 3;
    } catch (e) {
      console.warn('Error dibujando imagen de membrete:', e);
      y += 6;
    }
  } else {
    y += 4;
  }

  // Franja decorativa
  doc.setFillColor(...RGB_COPAE.navy3);
  doc.rect(M.left, y, contentW, 0.8, 'F');
  y += 4.5;

  if (titulo) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(orientacion === 'landscape' ? 12 : 11.5);
    doc.setTextColor(...RGB_COPAE.navy2);
    const lineas = doc.splitTextToSize(titulo, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 4.6;
  }

  if (subtitulo) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...RGB_COPAE.navy3);
    const lineas = doc.splitTextToSize(subtitulo, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 4.0;
  }

  if (lema) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...RGB_COPAE.gris700);
    const lineas = doc.splitTextToSize(lema, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 3.8;
  }

  return y + 2;
}

export function aplicarPieCOPAE(doc, { preliminar = false } = {}) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const y = alto - M.bottom + 2.5;

    doc.setDrawColor(...RGB_COPAE.gris300);
    doc.setLineWidth(0.3);
    doc.line(M.left, y, ancho - M.right, y);

    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...RGB_COPAE.gris500);
    doc.text('Precongreso de COPAE — UGEL 03 / AGEBATP — «Mi voz, mi propuesta»', M.left, y + 4);
    doc.text(`Página ${i} de ${total}`, ancho - M.right, y + 4, { align: 'right' });

    if (preliminar) {
      doc.setFont('Arial', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...RGB_COPAE.ambar);
      doc.text('DOCUMENTO PRELIMINAR — PANEL DE FIRMAS PENDIENTE DE SELLADO', ancho / 2, y + 8, { align: 'center' });
    }
  }
}
