/* ═══════════════════════════════════════════════════════════════
   DISEÑO COMÚN DE LOS PDF DE CONCURSOS (Eureka y Crea y Emprende)

   Sigue los modelos de Juegos Florales (Anexos A10 y A11): membrete con su proporción real,
   título azul centrado, tablas con cabecera azul institucional y bloque «Firmas del jurado
   calificador» con dos firmas arriba y la tercera centrada debajo.

   Dos reglas que evitan los defectos de maquetación:
   1. El encabezado que se repite en cada página se MIDE con el mismo código que lo dibuja,
      y ese alto es el margen superior de las tablas. Así nunca se encima con la cabecera.
   2. tablaConCierre() mide la tabla en un documento auxiliar antes de dibujarla. Si el bloque
      de cierre (firmas, declaraciones) no cabe en la última hoja, lleva las últimas filas a
      la hoja siguiente junto con ese bloque: la firma nunca queda sola en una hoja.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarFuentesArial } from './membrete';

export const AZUL = {
  navy1: [12, 25, 41], navy2: [18, 34, 64], navy3: [27, 58, 92], azul: [30, 77, 123],
  claro: [219, 234, 254], fondo: [241, 245, 249], fondoSuave: [248, 250, 252],
  borde: [203, 213, 225], texto: [30, 41, 59], gris700: [51, 65, 85], gris: [100, 116, 139],
  blanco: [255, 255, 255], rojo: [185, 28, 28], rojoFondo: [254, 242, 242], ambar: [180, 83, 9]
};

export const MARGEN = { top: 10, left: 14, right: 14, bottom: 15 };
export const A4 = { ancho: 210, alto: 297 };
export const A4_APAISADO = { ancho: 297, alto: 210 };

export function dims(orientacion = 'portrait') {
  return orientacion === 'landscape' ? A4_APAISADO : A4;
}

export function anchoUtil(orientacion = 'portrait') {
  return dims(orientacion).ancho - MARGEN.left - MARGEN.right;
}

export function limiteInferior(orientacion = 'portrait') {
  return dims(orientacion).alto - MARGEN.bottom - 4;
}

export function nuevaHoja(doc, orientacion = 'portrait') {
  const d = dims(orientacion);
  doc.addPage([d.ancho, d.alto], orientacion);
}

const PT = 0.3528;

/* ───── Encabezado ───── */

function componerEncabezado(doc, opciones = {}, dibujar) {
  const { orientacion = 'portrait', titulo = '', subtitulo = '', banner = null, ratio = 17.17, alias = 'membrete' } = opciones;
  const d = dims(orientacion);
  const W = anchoUtil(orientacion);
  let y = MARGEN.top;

  if (banner) {
    const alto = W / ratio;
    if (dibujar) {
      try {
        const formato = String(banner).startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(banner, formato, MARGEN.left, y, W, alto, alias, 'FAST');
      } catch (e) {
        console.warn('No se pudo dibujar el membrete:', e);
      }
    }
    y += alto + 2.4;
  }

  if (dibujar) {
    doc.setDrawColor(...AZUL.navy3);
    doc.setLineWidth(0.6);
    doc.line(MARGEN.left, y, MARGEN.left + W, y);
  }
  y += 5.4;

  if (titulo) {
    const tam = orientacion === 'landscape' ? 12.5 : 11.5;
    doc.setFont('Arial', 'bold');
    doc.setFontSize(tam);
    doc.setTextColor(...AZUL.navy2);
    const lineas = doc.splitTextToSize(titulo, W - 10);
    if (dibujar) doc.text(lineas, d.ancho / 2, y, { align: 'center', lineHeightFactor: 1.2 });
    y += lineas.length * tam * 1.2 * PT;
  }

  if (subtitulo) {
    const tam = 8.8;
    doc.setFont('Arial', 'normal');
    doc.setFontSize(tam);
    doc.setTextColor(...AZUL.gris700);
    const lineas = doc.splitTextToSize(subtitulo, W - 10);
    if (dibujar) doc.text(lineas, d.ancho / 2, y, { align: 'center', lineHeightFactor: 1.2 });
    y += lineas.length * tam * 1.2 * PT;
  }

  return y + 1.6;
}

/** Alto exacto del encabezado: úselo como margen superior de las tablas que cambian de hoja. */
export function medirEncabezado(doc, opciones) {
  return componerEncabezado(doc, opciones, false);
}

/** Dibuja el encabezado y devuelve la Y donde empieza el cuerpo. */
export function dibujarEncabezado(doc, opciones) {
  return componerEncabezado(doc, opciones, true);
}

/* ───── Pie ───── */

export function aplicarPie(doc, { cita = '', preliminar = false, textoPreliminar = 'DOCUMENTO PRELIMINAR — SIN SUSCRIPCIÓN DEL JURADO CALIFICADOR' } = {}) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const y = alto - MARGEN.bottom + 2.5;
    doc.setDrawColor(...AZUL.borde);
    doc.setLineWidth(0.3);
    doc.line(MARGEN.left, y, ancho - MARGEN.right, y);
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...AZUL.gris);
    doc.text(cita, MARGEN.left, y + 3.8);
    doc.text(`Página ${i} de ${total}`, ancho - MARGEN.right, y + 3.8, { align: 'right' });
    if (preliminar) {
      doc.setFont('Arial', 'bold');
      doc.setFontSize(6.8);
      doc.text(textoPreliminar, ancho / 2, y + 7.6, { align: 'center' });
    }
  }
}

/* ───── Tablas sin firmas huérfanas ───── */

/** `encabezado` puede ser una función que dibuja el chrome propio del módulo, o las opciones del genérico. */
function encabezadoNuevaHoja(doc, encabezado) {
  if (typeof encabezado === 'function') return encabezado(doc);
  return encabezado ? dibujarEncabezado(doc, encabezado) : MARGEN.top + 6;
}

const auxiliares = {};

function documentoAuxiliar(orientacion) {
  let aux = auxiliares[orientacion];
  if (!aux || aux.doc.internal.getNumberOfPages() > 120) {
    const doc = new jsPDF({ orientation: orientacion, unit: 'mm', format: 'a4' });
    aplicarFuentesArial(doc);
    aux = { doc, usado: false };
    auxiliares[orientacion] = aux;
  }
  if (aux.usado) nuevaHoja(aux.doc, orientacion);
  aux.usado = true;
  return aux.doc;
}

/** Simula la tabla: hoja relativa de cada fila, hojas usadas y Y final. */
export function medirTabla(opciones, orientacion = 'portrait') {
  const aux = documentoAuxiliar(orientacion);
  const inicio = aux.internal.getNumberOfPages();
  const paginaFila = [];
  // Los hooks de dibujo del documento real no se ejecutan en la simulación.
  // eslint-disable-next-line no-unused-vars
  const { didDrawPage, willDrawPage, didDrawCell, willDrawCell, ...resto } = opciones;
  autoTable(aux, {
    ...resto,
    didDrawCell: dato => {
      if (dato.section === 'body') paginaFila[dato.row.index] = aux.internal.getCurrentPageInfo().pageNumber - inicio + 1;
    }
  });
  return {
    paginaFila,
    paginas: aux.internal.getNumberOfPages() - inicio + 1,
    finalY: aux.lastAutoTable.finalY
  };
}

/**
 * Dibuja una tabla reservando `alturaCierre` milímetros después de la última fila.
 * Si no alcanzan, pasa las últimas filas (2 o 3) a una hoja nueva con su encabezado.
 */
export function tablaConCierre(doc, { opciones, orientacion = 'portrait', alturaCierre = 0, encabezado = null }) {
  const body = opciones.body || [];
  const limite = limiteInferior(orientacion);
  const medida = body.length ? medirTabla(opciones, orientacion) : null;

  const enUltima = medida ? (medida.paginaFila.filter(pg => pg === medida.paginas).length || 1) : 0;
  // Control de viudas: una sola fila en la última hoja se lleva al menos otra consigo.
  const viuda = Boolean(medida) && medida.paginas > 1 && enUltima === 1 && body.length > 2;
  if (!medida || (!viuda && medida.finalY + alturaCierre <= limite)) {
    autoTable(doc, opciones);
    return { y: doc.lastAutoTable.finalY, partida: false };
  }

  let mover = Math.min(body.length, Math.max(2, Math.min(3, enUltima)));
  if (body.length - mover === 1) mover = body.length;

  const primera = body.slice(0, body.length - mover);
  const segunda = body.slice(body.length - mover);
  if (primera.length) autoTable(doc, { ...opciones, body: primera });
  nuevaHoja(doc, orientacion);
  const y = encabezadoNuevaHoja(doc, encabezado);
  autoTable(doc, { ...opciones, body: segunda, startY: y });
  return { y: doc.lastAutoTable.finalY, partida: true };
}

/** Si el bloque no cabe, abre hoja nueva con encabezado. Devuelve la Y de trabajo. */
export function asegurarEspacio(doc, { y, alto, orientacion = 'portrait', encabezado = null }) {
  if (y + alto <= limiteInferior(orientacion)) return y;
  nuevaHoja(doc, orientacion);
  return encabezadoNuevaHoja(doc, encabezado);
}

/* ───── Firmas ───── */

const ALTO_FILA_FIRMA = 26;

export function alturaFirmasJurado(cantidad = 3, { conInstitucion = false } = {}) {
  const fila = ALTO_FILA_FIRMA + (conInstitucion ? 3.4 : 0);
  return 7 + (cantidad > 2 ? fila * 2 + 5 : fila);
}

function bloqueJurado(doc, { cx, y, ancho, bloque = {}, conInstitucion }) {
  const n = bloque?.numeroJurado || 1;
  if (bloque?.firmaDataUrl && String(bloque.firmaDataUrl).startsWith('data:image')) {
    try {
      doc.addImage(bloque.firmaDataUrl, 'PNG', cx - 20, y, 40, 13);
    } catch (e) {
      console.warn('Firma no incorporable:', e);
    }
  }
  const yl = y + 14.5;
  doc.setDrawColor(...AZUL.gris);
  doc.setLineWidth(0.3);
  doc.line(cx - ancho / 2, yl, cx + ancho / 2, yl);

  const pendiente = !bloque || bloque.pendiente || !bloque.nombreCompleto;
  if (pendiente) {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...AZUL.navy2);
    doc.text(`Jurado N.° ${n}`, cx, yl + 3.8, { align: 'center' });
    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...AZUL.texto);
    doc.text('Nombres y apellidos: ________________________________', cx, yl + 7.4, { align: 'center' });
    let yy = yl + 10.8;
    if (conInstitucion) {
      doc.text('Institución: ________________________________', cx, yy, { align: 'center' });
      yy += 3.4;
    }
    doc.text('DNI: ____________________', cx, yy, { align: 'center' });
    return;
  }
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...AZUL.navy2);
  const nombre = doc.splitTextToSize(`Jurado ${n}: ${String(bloque.nombreCompleto).toUpperCase()}`, ancho + 12).slice(0, 2);
  doc.text(nombre, cx, yl + 3.8, { align: 'center' });
  let yy = yl + 3.8 + nombre.length * 3.4;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...AZUL.texto);
  doc.text(`DNI: ${bloque.dni || '—'}${bloque.presidente ? ' · Presidente del jurado' : ''}`, cx, yy, { align: 'center' });
  yy += 3.4;
  if (conInstitucion && bloque.institucion) {
    doc.text(doc.splitTextToSize(`Institución: ${bloque.institucion}`, ancho + 12)[0], cx, yy, { align: 'center' });
  }
}

/** «Firmas del jurado calificador»: dos arriba y la tercera centrada, como en los Anexos A10 y A11. */
export function dibujarFirmasJurado(doc, { y, bloques = [], orientacion = 'portrait', conInstitucion = false, titulo = 'FIRMAS DEL JURADO CALIFICADOR' }) {
  const d = dims(orientacion);
  const W = anchoUtil(orientacion);
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...AZUL.navy2);
  doc.text(titulo, MARGEN.left, y);
  let cursor = y + 7;
  const ancho = Math.min(82, W / 2 - 14);
  const fila = ALTO_FILA_FIRMA + (conInstitucion ? 3.4 : 0);
  const centros = [MARGEN.left + W * 0.25, MARGEN.left + W * 0.75];
  if (bloques.length === 1) {
    bloqueJurado(doc, { cx: d.ancho / 2, y: cursor, ancho, bloque: bloques[0], conInstitucion });
    return cursor + fila;
  }
  bloques.slice(0, 2).forEach((b, i) => bloqueJurado(doc, { cx: centros[i], y: cursor, ancho, bloque: b, conInstitucion }));
  if (bloques.length > 2) {
    cursor += fila + 5;
    bloqueJurado(doc, { cx: d.ancho / 2, y: cursor, ancho, bloque: bloques[2], conInstitucion });
  }
  return cursor + fila;
}

export const ALTO_FIRMA_FICHA = 38;

/** Pie de firma de una ficha individual (Anexos E11 a E18): firma, nombres, institución, DNI y fecha. */
export function dibujarFirmaFicha(doc, { y, bloque = null, numeroJurado = 1, fecha = '', orientacion = 'portrait' }) {
  const cx = dims(orientacion).ancho / 2;
  const ancho = 92;
  if (bloque?.firmaDataUrl && String(bloque.firmaDataUrl).startsWith('data:image')) {
    try {
      doc.addImage(bloque.firmaDataUrl, 'PNG', cx - 21, y, 42, 13);
    } catch (e) {
      console.warn('Firma no incorporable:', e);
    }
  }
  const yl = y + 14.5;
  doc.setDrawColor(...AZUL.gris);
  doc.setLineWidth(0.3);
  doc.line(cx - ancho / 2, yl, cx + ancho / 2, yl);
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...AZUL.navy2);
  doc.text('Firma', cx, yl + 3.6, { align: 'center' });
  const pendiente = !bloque || bloque.pendiente || !bloque.nombreCompleto;
  const lineas = [
    `Nombres y apellidos del jurado: ${pendiente ? '______________________________' : String(bloque.nombreCompleto).toUpperCase()}`,
    `Institución: ${pendiente || !bloque.institucion ? '______________________________' : bloque.institucion}`,
    `DNI: ${pendiente ? '____________________' : (bloque.dni || '—')}`,
    `Fecha: ${fecha || '____________'}`
  ];
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(...AZUL.texto);
  let yy = yl + 7.2;
  lineas.forEach(l => {
    doc.text(doc.splitTextToSize(l, ancho + 30)[0], cx, yy, { align: 'center' });
    yy += 3.4;
  });
  doc.setFont('Arial', 'bold');
  doc.setTextColor(...AZUL.navy2);
  doc.text(`Jurado N.° ${numeroJurado}${bloque?.presidente ? ' — Presidente del jurado' : ''}`, cx, yy + 0.4, { align: 'center' });
  return yy + 3.6;
}
