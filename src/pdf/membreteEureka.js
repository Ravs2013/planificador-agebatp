/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — CHROME, MÁRGENES Y BLOQUES DE FIRMA PARA PDF
   Todo el PDF se genera en el cliente con jsPDF. Unidades en milímetros.

   El membrete institucional (MINEDU · DRE Lima Metropolitana · UGEL 03 · Comité de la
   Feria Escolar Nacional de Ciencia y Tecnología Eureka) vive en
   frontend/public/membrete-eureka.png y se carga UNA SOLA VEZ por sesión de generación.
   ═══════════════════════════════════════════════════════════════ */

import { aplicarFuentesArial, loadImageDataURL } from './membrete';
import { RGB } from '../data/eurekaCatalogos';
import { TEXTOS_LEGALES } from '../data/eurekaCatalogos';

export { aplicarFuentesArial, loadImageDataURL };

export const M = { top: 12, right: 12, bottom: 16, left: 12 };

export const A4 = { ancho: 210, alto: 297 };
export const A4_APAISADO = { ancho: 297, alto: 210 };

/** Relación de aspecto del membrete compuesto (1700 x 99 px). */
const RATIO_MEMBRETE = 17.17;

export function dimsPagina(orientacion = 'portrait') {
  return orientacion === 'landscape' ? A4_APAISADO : A4;
}

export function anchoContenido(orientacion = 'portrait') {
  return dimsPagina(orientacion).ancho - M.left - M.right;
}

/* ───── Caché del membrete ───── */

let membreteCache = null;
let membretePromesa = null;

/**
 * Carga el membrete una sola vez y reutiliza la referencia.
 * Sin esto hay fuga de memoria en PDF de cientos de páginas.
 */
export async function obtenerMembreteEureka() {
  if (membreteCache) return membreteCache;
  if (!membretePromesa) {
    membretePromesa = loadImageDataURL('/membrete-eureka.png')
      .then(data => { membreteCache = data; return data; })
      .catch(() => null);
  }
  return membretePromesa;
}

export function limpiarCacheMembrete() {
  membreteCache = null;
  membretePromesa = null;
}

/* ───── Chrome de página ───── */

/**
 * Dibuja el encabezado institucional de una página.
 * Devuelve la coordenada Y donde puede empezar el cuerpo.
 */
export function drawChromeEureka(doc, {
  orientacion = 'portrait',
  titulo = '',
  subtitulo = '',
  banner = null
} = {}) {
  const dims = dimsPagina(orientacion);
  const contentW = dims.ancho - M.left - M.right;
  let y = M.top;

  if (banner) {
    try {
      const formato = String(banner).startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const alturaBanner = contentW / RATIO_MEMBRETE;
      doc.addImage(banner, formato, M.left, y, contentW, alturaBanner);
      y += alturaBanner + 4;
    } catch (e) {
      console.warn('No se pudo dibujar el membrete de Eureka:', e);
      y += 6;
    }
  } else {
    y += 4;
  }

  // Franja de acento verde bajo el membrete.
  doc.setFillColor(...RGB.verdeEureka);
  doc.rect(M.left, y, contentW, 0.9, 'F');
  y += 4.5;

  if (titulo) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(orientacion === 'landscape' ? 11.5 : 11);
    doc.setTextColor(...RGB.navy2);
    const lineas = doc.splitTextToSize(titulo, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 4.6;
  }

  if (subtitulo) {
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...RGB.gris700);
    const lineas = doc.splitTextToSize(subtitulo, contentW);
    doc.text(lineas, dims.ancho / 2, y, { align: 'center' });
    y += lineas.length * 3.8;
  }

  return y + 2;
}

/**
 * Pie de todas las páginas: franja verde, numeración "Página X de Y", cita normativa y,
 * si el documento es preliminar, la marca textual que impide confundirlo con uno oficial.
 * Debe llamarse UNA SOLA VEZ, al final, cuando ya existen todas las páginas.
 */
export function aplicarPiePaginasEureka(doc, { preliminar = false } = {}) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    let ancho = A4.ancho;
    let alto = A4.alto;
    try {
      ancho = doc.internal.pageSize.getWidth();
      alto = doc.internal.pageSize.getHeight();
    } catch (e) {
      // Si la versión de jsPDF no expone el tamaño por página se asume A4 vertical.
    }

    const yFranja = alto - M.bottom + 2;
    doc.setFillColor(...RGB.verdeEureka);
    doc.rect(M.left, yFranja, ancho - M.left - M.right, 0.7, 'F');

    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...RGB.gris500);
    doc.text(TEXTOS_LEGALES.pieInstitucional, M.left, yFranja + 4);
    doc.text(`Página ${i} de ${total}`, ancho - M.right, yFranja + 4, { align: 'right' });

    if (preliminar) {
      doc.setFont('Arial', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...RGB.gris500);
      doc.text(TEXTOS_LEGALES.pieDocumentoPreliminar, ancho / 2, yFranja + 8, { align: 'center' });
    }
  }
}

/* ───── Bloques de firma ───── */

/**
 * Bloque de firma individual, resuelto contra el Panel de Firmas Oficial.
 * Si el firmante no existe todavía, se imprime en modo pendiente con las líneas en blanco
 * del formato oficial. La descarga NUNCA se bloquea por falta de firma.
 *
 * Devuelve la Y final ocupada.
 */
export function drawBloqueFirma(doc, {
  x, y, ancho = 70, firmante = null, numeroJurado = 1,
  conInstitucion = true, conFecha = false, fecha = '', compacto = false
}) {
  const centro = x + ancho / 2;
  const altoFirma = compacto ? 11 : 14;
  let cursor = y;

  const tieneFirma = firmante && firmante.firmaDataUrl && String(firmante.firmaDataUrl).startsWith('data:image');

  if (tieneFirma) {
    try {
      const anchoImg = Math.min(ancho * 0.62, 42);
      doc.addImage(firmante.firmaDataUrl, 'PNG', centro - anchoImg / 2, cursor, anchoImg, altoFirma);
    } catch (e) {
      // Una firma corrupta nunca debe abortar la generación: se sustituye por la leyenda.
      console.warn('Firma no incorporable, se sustituye por línea punteada:', e);
      doc.setFont('Arial', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...RGB.gris500);
      doc.text('(Firma manuscrita)', centro, cursor + altoFirma - 2, { align: 'center' });
    }
  }
  cursor += altoFirma + 1;

  doc.setDrawColor(...RGB.gris300);
  doc.setLineWidth(0.3);
  doc.line(x, cursor, x + ancho, cursor);
  cursor += 3.2;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(compacto ? 7 : 7.5);
  doc.setTextColor(...RGB.navy2);
  doc.text('Firma', centro, cursor, { align: 'center' });
  cursor += 3.4;

  if (!firmante || firmante.pendiente) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...RGB.gris500);
    doc.text('(Pendiente de suscripción)', centro, cursor, { align: 'center' });
    cursor += 3.6;

    doc.setFont('Arial', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...RGB.gris700);
    doc.text('Nombres y apellidos: ______________________', centro, cursor, { align: 'center' });
    cursor += 3.2;
    if (conInstitucion) {
      doc.text('Institución: ______________________________', centro, cursor, { align: 'center' });
      cursor += 3.2;
    }
    doc.text('DNI: ______________', centro, cursor, { align: 'center' });
    cursor += 3.2;
    if (conFecha) {
      doc.text('Fecha: ______________', centro, cursor, { align: 'center' });
      cursor += 3.2;
    }
  } else {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(compacto ? 7 : 7.6);
    doc.setTextColor(...RGB.navy2);
    const nombre = doc.splitTextToSize((firmante.nombreCompleto || '').toUpperCase(), ancho);
    doc.text(nombre, centro, cursor, { align: 'center' });
    cursor += nombre.length * 3.2;

    doc.setFont('Arial', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...RGB.gris700);
    if (conInstitucion && firmante.institucion) {
      const inst = doc.splitTextToSize(`Institución: ${firmante.institucion}`, ancho);
      doc.text(inst, centro, cursor, { align: 'center' });
      cursor += inst.length * 3;
    }
    doc.text(`DNI: ${firmante.dni || '────────'}`, centro, cursor, { align: 'center' });
    cursor += 3.1;
    if (conFecha) {
      doc.text(`Fecha: ${fecha || '____________'}`, centro, cursor, { align: 'center' });
      cursor += 3.1;
    }
  }

  doc.setFont('Arial', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...RGB.verdeOscuro);
  const rol = firmante && firmante.presidente
    ? `Jurado N.° ${numeroJurado} — Presidente del jurado`
    : `Jurado N.° ${numeroJurado}`;
  doc.text(rol, centro, cursor, { align: 'center' });
  cursor += 3.4;

  return cursor;
}

/**
 * Los tres casilleros de firma simétricos del pie del E19 y del E20.
 * Las columnas se generan iterando sobre los bloques recibidos, nunca a mano.
 */
export function drawFilaFirmas(doc, {
  bloques = [], y, orientacion = 'portrait', conInstitucion = true, conFecha = false, fecha = ''
}) {
  const dims = dimsPagina(orientacion);
  const contentW = dims.ancho - M.left - M.right;
  const n = Math.max(1, bloques.length);
  const anchoCol = contentW / n;
  const anchoBloque = Math.min(anchoCol - 8, 84);

  let maxY = y;
  bloques.forEach((bloque, i) => {
    const x = M.left + i * anchoCol + (anchoCol - anchoBloque) / 2;
    const fin = drawBloqueFirma(doc, {
      x, y, ancho: anchoBloque,
      firmante: bloque,
      numeroJurado: bloque?.numeroJurado || i + 1,
      conInstitucion,
      conFecha,
      fecha,
      compacto: n > 2
    });
    if (fin > maxY) maxY = fin;
  });
  return maxY;
}

/* ───── Utilidades de maquetación ───── */

/** Añade página respetando la orientación pedida y redibuja el chrome. */
export function nuevaPagina(doc, opciones = {}) {
  const { orientacion = 'portrait' } = opciones;
  if (orientacion === 'landscape') {
    doc.addPage([A4_APAISADO.ancho, A4_APAISADO.alto], 'landscape');
  } else {
    doc.addPage([A4.ancho, A4.alto], 'portrait');
  }
  return drawChromeEureka(doc, opciones);
}

/** Y máxima utilizable antes del pie de página. */
export function limiteCuerpo(orientacion = 'portrait') {
  return dimsPagina(orientacion).alto - M.bottom - 6;
}

/** Cede el hilo para que el navegador no se congele en lotes grandes. */
export function cederHilo() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/** Recuadro etiquetado de una sola línea. Devuelve la Y final. */
export function drawEtiquetaValor(doc, { x, y, anchoEtiqueta, anchoValor, etiqueta, valor, alto = 5.5 }) {
  doc.setDrawColor(...RGB.gris300);
  doc.setLineWidth(0.2);
  doc.setFillColor(...RGB.gris100);
  doc.rect(x, y, anchoEtiqueta, alto, 'FD');
  doc.rect(x + anchoEtiqueta, y, anchoValor, alto, 'D');

  doc.setFont('Arial', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...RGB.gris700);
  doc.text(String(etiqueta || ''), x + 1.5, y + alto - 1.9);

  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...RGB.navy2);
  const texto = doc.splitTextToSize(String(valor ?? ''), anchoValor - 3);
  doc.text(texto[0] || '', x + anchoEtiqueta + 1.5, y + alto - 1.9);

  return y + alto;
}
