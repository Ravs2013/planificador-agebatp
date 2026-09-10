/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — ANEXO E21 — FICHA ÚNICA DE RECLAMOS (FUR)
   Formulario imprimible. Se prellenan categoría, área, fecha, DRE, UGEL y región cuando
   se genera desde el contexto de un participante; el resto queda en blanco para su
   llenado manual por el docente asesor.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4, anchoContenido, drawChromeEureka, aplicarPiePaginasEureka,
  aplicarFuentesArial, drawBloqueFirma
} from './membreteEureka';
import { RGB, MOTIVOS_RECLAMO_E21, REGLAS_E21 } from '../data/eurekaCatalogos';
import { EUREKA_CONFIG, getArea, getCategoria } from '../data/eurekaConfigUGEL03';

const CONTENT_W = anchoContenido('portrait');
const LINEA = '_______________________________';

export function generarE21PDF({
  categoria = '', areaId = '', fecha = '', hora = '', lugar = '',
  institucion = '', banner = null
} = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  const cat = getCategoria(categoria);
  const area = getArea(areaId);

  let y = drawChromeEureka(doc, {
    orientacion: 'portrait',
    titulo: 'ANEXO E21 — FICHA ÚNICA DE RECLAMOS',
    subtitulo: `${EUREKA_CONFIG.edicion} ${EUREKA_CONFIG.anio} · Etapa ${EUREKA_CONFIG.etapa} · ${EUREKA_CONFIG.ugel}`,
    banner
  });

  const etiqueta = { fontStyle: 'bold', fillColor: RGB.gris100, textColor: RGB.gris700 };
  const v = valor => (valor && String(valor).trim() !== '' ? String(valor) : LINEA);

  doc.setFont('Arial', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RGB.navy2);
  doc.text('I. INFORMACIÓN GENERAL', M.left, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2.4, lineColor: RGB.gris300 },
    columnStyles: {
      0: { cellWidth: 32, ...etiqueta },
      1: { cellWidth: CONTENT_W / 2 - 32 },
      2: { cellWidth: 32, ...etiqueta },
      3: { cellWidth: CONTENT_W / 2 - 32 }
    },
    body: [
      ['Categoría:', v(cat ? cat.nombre : categoria), 'Área:', v(area ? area.nombre : areaId)],
      ['Fecha:', v(fecha || EUREKA_CONFIG.fechaEvaluacion), 'Hora:', v(hora)],
      ['Lugar:', v(lugar || EUREKA_CONFIG.sede), 'DRE/GRE:', v(EUREKA_CONFIG.dre)],
      ['UGEL:', v(EUREKA_CONFIG.ugel), 'Región:', v(EUREKA_CONFIG.region)],
      ['Provincia:', v(EUREKA_CONFIG.provincia), 'Distrito:', v(EUREKA_CONFIG.distrito)],
      [{ content: 'Nombre de la I. E.:', styles: etiqueta }, { content: v(institucion), colSpan: 3 }]
    ]
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RGB.navy2);
  doc.text('II. MOTIVO DEL RECLAMO (marcar con X)', M.left, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8.2, cellPadding: 3, lineColor: RGB.gris300 },
    columnStyles: { 0: { cellWidth: 16, halign: 'center' }, 1: { cellWidth: CONTENT_W - 16 } },
    body: MOTIVOS_RECLAMO_E21.map(m => [
      '(     )',
      m.id === 'mot_otro' ? `${m.label} ${'_'.repeat(60)}` : m.label
    ])
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RGB.navy2);
  doc.text('III. SUSTENTO DEL RECLAMO', M.left, y);
  y += 3;

  doc.setDrawColor(...RGB.gris300);
  doc.setLineWidth(0.2);
  doc.rect(M.left, y, CONTENT_W, 42, 'S');
  for (let i = 1; i <= 6; i++) {
    doc.line(M.left + 2, y + i * 6, M.left + CONTENT_W - 2, y + i * 6);
  }
  y += 48;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...RGB.navy2);
  doc.text('IV. DATOS DEL DOCENTE ASESOR', M.left, y);
  y += 2.5;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2.6, lineColor: RGB.gris300 },
    columnStyles: {
      0: { cellWidth: 48, ...etiqueta },
      1: { cellWidth: CONTENT_W - 48 }
    },
    body: [
      ['Nombre del docente asesor:', LINEA + LINEA],
      ['Documento de identidad:', 'DNI (     )   CE (     )   Otros (     )    N.° ______________'],
      ['Teléfono de la I. E.:', LINEA],
      ['Correo electrónico:', LINEA + LINEA]
    ]
  });

  y = doc.lastAutoTable.finalY + 8;

  drawBloqueFirma(doc, {
    x: A4.ancho / 2 - 40,
    y,
    ancho: 80,
    firmante: null,
    numeroJurado: 0,
    conInstitucion: false,
    conFecha: true
  });

  // El bloque genérico rotula "Jurado N.° 0"; se cubre con el rótulo correcto del anexo.
  doc.setFillColor(255, 255, 255);
  doc.rect(A4.ancho / 2 - 45, y + 30, 90, 5, 'F');
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...RGB.verdeOscuro);
  doc.text('Firma del docente asesor', A4.ancho / 2, y + 33.4, { align: 'center' });

  y += 40;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...RGB.gris700);
  doc.text('Reglas del formato:', M.left, y);
  y += 3.2;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(6.6);
  REGLAS_E21.forEach(regla => {
    const linea = doc.splitTextToSize(`• ${regla}`, CONTENT_W - 4);
    doc.text(linea, M.left + 2, y);
    y += linea.length * 2.8;
  });

  aplicarPiePaginasEureka(doc, { preliminar: false });
  doc.save(`AnexoE21_FichaUnicaReclamos_${categoria || 'General'}.pdf`);
}
