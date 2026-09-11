/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — CHROME, MÁRGENES Y FIRMAS PARA PDF
   Delegan en pdfDiseno.js (modelo de Juegos Florales, paleta azul institucional).
   Se conservan los nombres exportados que usan el paquete legal y el Anexo E21.
   ═══════════════════════════════════════════════════════════════ */

import { aplicarFuentesArial, loadImageDataURL } from './membrete';
import { TEXTOS_LEGALES } from '../data/eurekaCatalogos';
import {
  AZUL, MARGEN, A4 as A4_BASE, A4_APAISADO as A4_APAISADO_BASE, dims, anchoUtil, limiteInferior,
  dibujarEncabezado, medirEncabezado, aplicarPie, dibujarFirmasJurado, nuevaHoja
} from './pdfDiseno';

export { aplicarFuentesArial, loadImageDataURL };

export const M = MARGEN;
export const A4 = A4_BASE;
export const A4_APAISADO = A4_APAISADO_BASE;

/** Proporción del membrete compuesto de Eureka (1700 x 99 px). */
const RATIO_MEMBRETE = 1700 / 99;

export function dimsPagina(orientacion = 'portrait') {
  return dims(orientacion);
}

export function anchoContenido(orientacion = 'portrait') {
  return anchoUtil(orientacion);
}

let membreteCache = null;
let membretePromesa = null;

/** Carga el membrete una sola vez por sesión: sin caché hay fuga de memoria en PDF extensos. */
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

function opcionesEncabezado(opciones = {}) {
  return { ...opciones, ratio: RATIO_MEMBRETE, alias: 'membrete-eureka' };
}

export function drawChromeEureka(doc, opciones = {}) {
  return dibujarEncabezado(doc, opcionesEncabezado(opciones));
}

export function medirChromeEureka(doc, opciones = {}) {
  return medirEncabezado(doc, opcionesEncabezado(opciones));
}

export function aplicarPiePaginasEureka(doc, { preliminar = false } = {}) {
  aplicarPie(doc, {
    cita: TEXTOS_LEGALES.pieInstitucional,
    preliminar,
    textoPreliminar: TEXTOS_LEGALES.pieDocumentoPreliminar
  });
}

/** Bloque de firma individual (usado por el Anexo E21 y el paquete legal). Devuelve la Y final. */
export function drawBloqueFirma(doc, {
  x, y, ancho = 70, firmante = null, numeroJurado = 1, conInstitucion = true, conFecha = false, fecha = '', compacto = false
}) {
  const centro = x + ancho / 2;
  const altoFirma = compacto ? 11 : 13;
  let cursor = y;
  if (firmante && firmante.firmaDataUrl && String(firmante.firmaDataUrl).startsWith('data:image')) {
    try {
      const anchoImg = Math.min(ancho * 0.62, 42);
      doc.addImage(firmante.firmaDataUrl, 'PNG', centro - anchoImg / 2, cursor, anchoImg, altoFirma);
    } catch (e) {
      console.warn('Firma no incorporable:', e);
    }
  }
  cursor += altoFirma + 1.5;
  doc.setDrawColor(...AZUL.gris);
  doc.setLineWidth(0.3);
  doc.line(x, cursor, x + ancho, cursor);
  cursor += 3.6;
  const pendiente = !firmante || firmante.pendiente || !firmante.nombreCompleto;
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(...AZUL.navy2);
  doc.text(pendiente ? `Jurado N.° ${numeroJurado}` : String(firmante.nombreCompleto).toUpperCase(), centro, cursor, { align: 'center' });
  cursor += 3.4;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...AZUL.texto);
  if (pendiente) {
    doc.text('Nombres y apellidos: ______________________', centro, cursor, { align: 'center' });
    cursor += 3.2;
  }
  if (conInstitucion) {
    doc.text(`Institución: ${!pendiente && firmante.institucion ? firmante.institucion : '______________________'}`, centro, cursor, { align: 'center' });
    cursor += 3.2;
  }
  doc.text(`DNI: ${!pendiente ? (firmante.dni || '—') : '______________'}`, centro, cursor, { align: 'center' });
  cursor += 3.2;
  if (conFecha) {
    doc.text(`Fecha: ${fecha || '____________'}`, centro, cursor, { align: 'center' });
    cursor += 3.2;
  }
  if (!pendiente) {
    doc.setFont('Arial', 'bold');
    doc.setTextColor(...AZUL.navy2);
    doc.text(firmante.presidente ? `Jurado N.° ${numeroJurado} — Presidente del jurado` : `Jurado N.° ${numeroJurado}`, centro, cursor, { align: 'center' });
    cursor += 3.4;
  }
  return cursor;
}

/** Firmas de los tres jurados con el esquema de Juegos Florales (dos arriba, una al centro). */
export function drawFilaFirmas(doc, { bloques = [], y, orientacion = 'portrait', conInstitucion = false }) {
  return dibujarFirmasJurado(doc, { y, bloques, orientacion, conInstitucion });
}

export function nuevaPagina(doc, opciones = {}) {
  nuevaHoja(doc, opciones.orientacion || 'portrait');
  return drawChromeEureka(doc, opciones);
}

export function limiteCuerpo(orientacion = 'portrait') {
  return limiteInferior(orientacion);
}

export function cederHilo() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/** Recuadro etiquetado de una sola línea. Devuelve la Y final. */
export function drawEtiquetaValor(doc, { x, y, anchoEtiqueta, anchoValor, etiqueta, valor, alto = 5.5 }) {
  doc.setDrawColor(...AZUL.borde);
  doc.setLineWidth(0.2);
  doc.setFillColor(...AZUL.fondo);
  doc.rect(x, y, anchoEtiqueta, alto, 'FD');
  doc.rect(x + anchoEtiqueta, y, anchoValor, alto, 'D');
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...AZUL.gris700);
  doc.text(String(etiqueta || ''), x + 1.5, y + alto - 1.9);
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...AZUL.navy2);
  const texto = doc.splitTextToSize(String(valor ?? ''), anchoValor - 3);
  doc.text(texto[0] || '', x + anchoEtiqueta + 1.5, y + alto - 1.9);
  return y + alto;
}
