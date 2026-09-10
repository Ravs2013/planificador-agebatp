/* ═══════════════════════════════════════════════════════════════
   CREA Y EMPRENDE 2026 — PDF DE LOS FORMATOS DEL JURADO
     D13  Formato consolidado de evaluación por cada jurado calificador (apaisado)
     D14  Formato consolidado de evaluación (vertical)
     D15  Acta de resultados (vertical)
     Paquete legal: carátula, índice de foliación, D15, D14, D13 y todas las fichas
     Acta de calibración previa entre grupos
   Las firmas se resuelven contra el Panel de Firmas Oficial. Sin panel sellado, el documento
   se emite con las líneas en blanco y la marca de preliminar.
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  M, A4, A4_APAISADO, anchoContenido, drawChromeCYE, medirChromeCYE, aplicarPiePaginasCYE,
  aplicarFuentesArial, drawBloqueFirmaCYE, drawFilaFirmasCYE, cederHilo, limiteCuerpo, RGB_CYE
} from './membreteCreaEmprende';
import { dibujarFichaCYE } from './generarFichaCYEPDF';
import { CYE_CONFIG, SLOTS_JURADO, TEXTOS_LEGALES_CYE, PROTOCOLO_CALIBRACION_CYE, getCategoriaCYE } from '../data/creaEmprendeConfig';
import { getInstrumentosCategoria, maximoCategoria } from '../data/creaEmprendeRubricas';
import { formatearFechaCorta, formatearFechaLarga } from '../utils/creaEmprendeHelpers';
import { firmanteDelCasillero, bloqueFirmaCYE, bloquesFirmaDePanelCYE, esPreliminarCYE, firmantesOrdenadosCYE } from '../utils/creaEmprendeFirmas';

const ESTILO_TABLA = { font: 'Arial', fontSize: 7.4, cellPadding: 1.6, overflow: 'linebreak', lineColor: RGB_CYE.gris300, textColor: RGB_CYE.gris800, valign: 'middle' };
const ESTILO_CABECERA = { fillColor: RGB_CYE.navy2, textColor: RGB_CYE.blanco, fontStyle: 'bold', fontSize: 7.4, halign: 'center', valign: 'middle' };

function agregarPagina(doc, orientacion) {
  if (orientacion === 'landscape') doc.addPage([A4_APAISADO.ancho, A4_APAISADO.alto], 'landscape');
  else doc.addPage([A4.ancho, A4.alto], 'portrait');
}

function encabezadoOficial(doc, { categoria, y, orientacion, etapaComoCasillas }) {
  const cat = getCategoriaCYE(categoria);
  const casilla = cond => (cond ? '(X)' : '( )');
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: anchoContenido(orientacion),
    theme: 'grid',
    styles: { ...ESTILO_TABLA, fontSize: 7.6 },
    body: [
      [
        etapaComoCasillas ? 'Etapa: I. E. ( )   UGEL (X)   DRE ( )   Nacional ( )' : `Etapa: ${CYE_CONFIG.etapa}`,
        `${etapaComoCasillas ? 'DRE' : 'DRE/GRE'}: ${CYE_CONFIG.dre}`,
        `UGEL: ${CYE_CONFIG.ugel}`
      ],
      [
        `Modalidad: EBR ${casilla(cat?.modalidad === 'EBR')}   EBA ${casilla(cat?.modalidad === 'EBA')}`,
        `Categoría: ${cat ? `${cat.id} — ${cat.grados}` : categoria}`,
        `Fecha: ${formatearFechaCorta(CYE_CONFIG.fechaEvaluacion)}`
      ]
    ]
  });
  return doc.lastAutoTable.finalY + 3;
}

function espacioOPagina(doc, y, alto, orientacion, chromeOpts) {
  if (y + alto <= limiteCuerpo(orientacion)) return y;
  agregarPagina(doc, orientacion);
  return drawChromeCYE(doc, chromeOpts);
}

/* ───── D13 ───── */

export function dibujarD13(doc, { categoria, filas = [], numeroJurado = 1, panel = null, banner = null }) {
  const orientacion = 'landscape';
  const W = anchoContenido(orientacion);
  const chromeOpts = {
    orientacion,
    titulo: 'ANEXO D13 — FORMATO CONSOLIDADO DE EVALUACIÓN POR CADA JURADO CALIFICADOR',
    subtitulo: `Concurso Nacional Crea y Emprende 2026 · Jurado N.° ${numeroJurado}`,
    banner
  };
  let y = drawChromeCYE(doc, chromeOpts);
  const top = medirChromeCYE(doc, chromeOpts);
  y = encabezadoOficial(doc, { categoria, y, orientacion, etapaComoCasillas: true });
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top, bottom: M.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [['N.°', 'Título del trabajo', 'Grado, sección / IE / UGEL / DRE', 'Rúbrica de Evaluación del Proyecto', 'Rúbrica de evaluación del portafolio de emprendimiento', 'Presentación en la Expoferia', 'Puntaje total']],
    headStyles: ESTILO_CABECERA,
    styles: ESTILO_TABLA,
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 70 }, 2: { cellWidth: 95 },
      3: { cellWidth: 25, halign: 'center' }, 4: { cellWidth: 29, halign: 'center' }, 5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    body: filas.map(f => [
      f.numero, `${f.tituloProyecto}${f.noSePresento ? ' (no se presentó)' : ''}`,
      [f.gradoSeccion, f.institucion, f.ugel, f.dre].filter(Boolean).join(' / '),
      f.d10 ?? '', f.d11 ?? '', f.d12 ?? '', f.total ?? ''
    ]),
    didDrawPage: data => { if (data.pageNumber > 1) drawChromeCYE(doc, chromeOpts); }
  });
  y = doc.lastAutoTable.finalY + 4;
  const max = Object.fromEntries(getInstrumentosCategoria(categoria).map(r => [r.anexo, r.maximo]));
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...RGB_CYE.gris700);
  doc.text(`Puntajes máximos de la categoría ${categoria}: rúbrica del proyecto ${max.D10} · rúbrica del portafolio ${max.D11} · presentación en la Expoferia ${max.D12} · total ${maximoCategoria(categoria)}.`, M.left, y);
  y = espacioOPagina(doc, y + 4, 36, orientacion, chromeOpts);
  drawBloqueFirmaCYE(doc, {
    x: A4_APAISADO.ancho / 2 - 45, y, ancho: 90,
    firmante: bloqueFirmaCYE(firmanteDelCasillero(panel, numeroJurado), numeroJurado),
    numeroJurado, conInstitucion: false
  });
}

export function generarD13PDF({ categoria, filasPorSlot = {}, panel = null, banner = null, guardar = true }) {
  const slots = Object.keys(filasPorSlot).map(Number).sort((a, b) => a - b);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  slots.forEach((slot, i) => {
    if (i > 0) agregarPagina(doc, 'landscape');
    dibujarD13(doc, { categoria, filas: filasPorSlot[slot], numeroJurado: slot, panel, banner });
  });
  aplicarPiePaginasCYE(doc, { preliminar: esPreliminarCYE(panel) });
  if (guardar) doc.save(`AnexoD13_CYE2026_Cat${categoria}${slots.length === 1 ? `_Jurado${slots[0]}` : ''}.pdf`);
  return doc;
}

/* ───── D14 ───── */

export function dibujarD14(doc, { categoria, filas = [], panel = null, banner = null, criterioDesempate = '' }) {
  const orientacion = 'portrait';
  const W = anchoContenido(orientacion);
  const chromeOpts = { orientacion, titulo: 'ANEXO D14 — FORMATO CONSOLIDADO DE EVALUACIÓN', subtitulo: 'Concurso Nacional Crea y Emprende 2026', banner };
  let y = drawChromeCYE(doc, chromeOpts);
  const top = medirChromeCYE(doc, chromeOpts);
  y = encabezadoOficial(doc, { categoria, y, orientacion, etapaComoCasillas: false });
  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right, top, bottom: M.bottom + 6 },
    tableWidth: W,
    theme: 'grid',
    head: [['N.°', 'Título del proyecto', 'IE', 'Jurado 1', 'Jurado 2', 'Jurado 3', 'Puntaje total']],
    headStyles: ESTILO_CABECERA,
    styles: ESTILO_TABLA,
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' }, 1: { cellWidth: 60 }, 2: { cellWidth: 53 },
      3: { cellWidth: 16, halign: 'center' }, 4: { cellWidth: 16, halign: 'center' }, 5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' }
    },
    body: filas.map(f => [
      f.numero, `${f.tituloProyecto}${f.noSePresento ? ' (no se presentó)' : ''}`, f.institucion,
      f.jurado1 ?? '', f.jurado2 ?? '', f.jurado3 ?? '', f.total ?? ''
    ]),
    didDrawPage: data => { if (data.pageNumber > 1) drawChromeCYE(doc, chromeOpts); }
  });
  y = doc.lastAutoTable.finalY + 4;
  if (criterioDesempate) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(...RGB_CYE.gris700);
    const lineas = doc.splitTextToSize(`Empate resuelto por el jurado calificador. ${criterioDesempate}`, W);
    doc.text(lineas, M.left, y);
    y += lineas.length * 3.2 + 2;
  }
  y = espacioOPagina(doc, y + 4, 40, orientacion, chromeOpts);
  drawFilaFirmasCYE(doc, { bloques: bloquesFirmaDePanelCYE(panel), y, orientacion, conInstitucion: false });
}

export function generarD14PDF({ categoria, filas = [], panel = null, banner = null, criterioDesempate = '', guardar = true }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarD14(doc, { categoria, filas, panel, banner, criterioDesempate });
  aplicarPiePaginasCYE(doc, { preliminar: esPreliminarCYE(panel) });
  if (guardar) doc.save(`AnexoD14_CYE2026_Cat${categoria}.pdf`);
  return doc;
}

/* ───── D15 ───── */

export function dibujarD15(doc, { categoria, datos = {}, resultados = [], panel = null, banner = null, criterioDesempate = '' }) {
  const orientacion = 'portrait';
  const W = anchoContenido(orientacion);
  const chromeOpts = { orientacion, titulo: 'ANEXO D15 — ACTA DE RESULTADOS', subtitulo: 'Concurso Nacional Crea y Emprende 2026', banner };
  let y = drawChromeCYE(doc, chromeOpts) + 3;
  const d = {
    region: datos.region || CYE_CONFIG.region,
    provincia: datos.provincia || CYE_CONFIG.provincia,
    distrito: datos.distrito || CYE_CONFIG.distrito,
    fecha: datos.fecha || CYE_CONFIG.fechaEvaluacion,
    hora: datos.hora || CYE_CONFIG.horaActa
  };
  const { dia, mes, anio } = formatearFechaLarga(d.fecha);
  const parrafo = `En la región de ${d.region}, provincia de ${d.provincia}, distrito de ${d.distrito} con fecha ${dia} de ${mes} de ${anio}, a horas ${d.hora}, durante el proceso de evaluación del Concurso Nacional Crea y Emprende (CYE) de la etapa ${CYE_CONFIG.etapa}, de la categoría ${categoria}, el jurado calificador, conformado por las siguientes personalidades:`;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...RGB_CYE.gris800);
  const lineas = doc.splitTextToSize(parrafo, W);
  doc.text(lineas, M.left, y);
  y += lineas.length * 5 + 2;

  firmantesOrdenadosCYE(panel).forEach((f, i) => {
    doc.text(`${i + 1}. ${f?.nombreCompleto || '______________________________________________'}`, M.left + 6, y);
    y += 6;
  });
  y += 1;
  doc.text(TEXTOS_LEGALES_CYE.transicionActa, M.left, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: W,
    theme: 'grid',
    head: [['Orden de mérito', 'I. E.', 'UGEL', 'DRE/GRE', 'Nombre del proyecto']],
    headStyles: { ...ESTILO_CABECERA, fontSize: 8.4 },
    styles: { ...ESTILO_TABLA, fontSize: 8.6, cellPadding: 2.4, minCellHeight: 11 },
    columnStyles: { 0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 48 }, 2: { cellWidth: 22 }, 3: { cellWidth: 38 }, 4: { cellWidth: 56 } },
    body: [1, 2, 3].map(puesto => {
      const r = resultados.find(x => x.puesto === puesto);
      return [`${puesto}°`, r?.institucion || '', r?.ugel || '', r?.dre || '', r?.nombreProyecto || ''];
    })
  });
  y = doc.lastAutoTable.finalY + 5;
  if (criterioDesempate) {
    doc.setFont('Arial', 'italic');
    doc.setFontSize(8);
    const l = doc.splitTextToSize(`Empate resuelto por el jurado calificador. ${criterioDesempate}`, W);
    doc.text(l, M.left, y);
    y += l.length * 3.6 + 3;
  }
  y = espacioOPagina(doc, y + 12, 40, orientacion, chromeOpts);
  drawFilaFirmasCYE(doc, { bloques: bloquesFirmaDePanelCYE(panel), y, orientacion, conInstitucion: false });
}

export function generarD15PDF({ categoria, datos = {}, resultados = [], panel = null, banner = null, criterioDesempate = '', guardar = true }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  dibujarD15(doc, { categoria, datos, resultados, panel, banner, criterioDesempate });
  aplicarPiePaginasCYE(doc, { preliminar: esPreliminarCYE(panel) });
  if (guardar) doc.save(`AnexoD15_ActaResultados_CYE2026_Cat${categoria}.pdf`);
  return doc;
}

/* ───── Paquete legal completo ───── */

const ENTRADAS_POR_PAGINA = 46;

function caratula(doc, { categoria, banner, proyectos, fichas }) {
  const cat = getCategoriaCYE(categoria);
  const W = anchoContenido('portrait');
  let y = drawChromeCYE(doc, { orientacion: 'portrait', banner }) + 30;
  doc.setFont('Arial', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...RGB_CYE.navy2);
  doc.text('CONCURSO NACIONAL CREA Y EMPRENDE 2026', A4.ancho / 2, y, { align: 'center' });
  y += 12;
  doc.setFillColor(...RGB_CYE.dorado);
  doc.rect(M.left + 30, y, W - 60, 0.9, 'F');
  y += 12;
  doc.setFontSize(14);
  doc.text('EXPEDIENTE DE EVALUACIÓN', A4.ancho / 2, y, { align: 'center' });
  y += 8;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(11);
  doc.text(`Etapa ${CYE_CONFIG.etapa} — ${CYE_CONFIG.ugel}`, A4.ancho / 2, y, { align: 'center' });
  y += 18;
  const { dia, mes, anio } = formatearFechaLarga(CYE_CONFIG.fechaEvaluacion);
  [
    ['Categoría', cat ? `${cat.nombre} — ${cat.grados}` : categoria],
    ['Modalidad', cat?.modalidadTexto || ''],
    ['DRE/GRE', CYE_CONFIG.dre],
    ['UGEL', CYE_CONFIG.ugel],
    ['Sede', `${CYE_CONFIG.sede}, ${CYE_CONFIG.distrito}`],
    ['Fecha de evaluación', `${dia} de ${mes} de ${anio}`],
    ['Proyectos evaluados', String(proyectos)],
    ['Fichas de evaluación', String(fichas)]
  ].forEach(([k, v]) => {
    doc.setFont('Arial', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...RGB_CYE.gris700);
    doc.text(`${k}:`, M.left + 20, y);
    doc.setFont('Arial', 'normal');
    doc.setTextColor(...RGB_CYE.navy2);
    doc.text(doc.splitTextToSize(String(v), W - 80)[0], M.left + 70, y);
    y += 7;
  });
}

function indice(doc, entradas, { banner, reservadas }) {
  let pagina = 0;
  let y = 0;
  const W = anchoContenido('portrait');
  const abrir = (continuacion) => {
    doc.setPage(reservadas[pagina]);
    y = drawChromeCYE(doc, { orientacion: 'portrait', titulo: continuacion ? 'ÍNDICE DE FOLIACIÓN (continuación)' : 'ÍNDICE DE FOLIACIÓN', banner }) + 2;
    doc.setFont('Arial', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...RGB_CYE.navy2);
    doc.text('DOCUMENTO', M.left, y);
    doc.text('PÁGINA', A4.ancho - M.right, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(...RGB_CYE.gris300);
    doc.line(M.left, y, A4.ancho - M.right, y);
    y += 4.5;
    pagina += 1;
  };
  abrir(false);
  entradas.forEach(e => {
    if (y > limiteCuerpo('portrait') - 4) {
      if (pagina >= reservadas.length) return;
      abrir(true);
    }
    doc.setFont('Arial', e.destacado ? 'bold' : 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...(e.destacado ? RGB_CYE.navy2 : RGB_CYE.gris700));
    doc.text(`${e.sangria ? '     ' : ''}${doc.splitTextToSize(e.etiqueta, W - 24)[0]}`, M.left, y);
    doc.text(e.pagina != null ? String(e.pagina) : '—', A4.ancho - M.right, y, { align: 'right' });
    y += 4.5;
  });
}

export async function generarPaqueteLegalCYEPDF({
  categoria, participantes = [], evaluaciones = [], filasD14 = [], filasD13PorSlot = {}, resultados = [],
  acta = null, criterioDesempate = '', panel = null, banner = null, onProgreso = null, guardar = true
}) {
  const nombreDe = id => participantes.find(p => p.id === id);
  const entradas = [
    { etiqueta: 'Carátula del expediente', destacado: true },
    { etiqueta: 'Índice de foliación', destacado: true },
    { etiqueta: 'Anexo D15 — Acta de resultados', clave: 'd15' },
    { etiqueta: 'Anexo D14 — Formato consolidado de evaluación', clave: 'd14' },
    ...SLOTS_JURADO.map(s => ({ etiqueta: `Anexo D13 — Formato consolidado del Jurado N.° ${s}`, clave: `d13_${s}` })),
    { etiqueta: 'FICHAS DE EVALUACIÓN (ANEXOS D10, D11 Y D12)', destacado: true, clave: 'fichas' },
    ...evaluaciones.map(ev => {
      const p = nombreDe(ev.participanteId);
      return { etiqueta: `N.° ${p?.numero || '—'} — ${p?.institucion?.nombre || ''} — ${p?.tituloProyecto || ''} — Jurado N.° ${ev.jurado?.numeroJurado}`, clave: `ficha_${ev.id}`, sangria: true };
    })
  ];
  const porClave = new Map(entradas.filter(e => e.clave).map(e => [e.clave, e]));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  caratula(doc, { categoria, banner, proyectos: filasD14.length, fichas: evaluaciones.length });
  entradas[0].pagina = 1;

  const reservadas = [];
  for (let i = 0; i < Math.max(1, Math.ceil(entradas.length / ENTRADAS_POR_PAGINA)); i += 1) {
    agregarPagina(doc, 'portrait');
    reservadas.push(doc.internal.getNumberOfPages());
  }
  entradas[1].pagina = reservadas[0];

  agregarPagina(doc, 'portrait');
  porClave.get('d15').pagina = doc.internal.getNumberOfPages();
  dibujarD15(doc, { categoria, datos: acta || {}, resultados, panel, banner, criterioDesempate });

  agregarPagina(doc, 'portrait');
  porClave.get('d14').pagina = doc.internal.getNumberOfPages();
  dibujarD14(doc, { categoria, filas: filasD14, panel, banner, criterioDesempate });

  SLOTS_JURADO.forEach(s => {
    agregarPagina(doc, 'landscape');
    porClave.get(`d13_${s}`).pagina = doc.internal.getNumberOfPages();
    dibujarD13(doc, { categoria, filas: filasD13PorSlot[s] || [], numeroJurado: s, panel, banner });
  });

  for (let i = 0; i < evaluaciones.length; i += 1) {
    const ev = evaluaciones[i];
    agregarPagina(doc, 'portrait');
    const pagina = doc.internal.getNumberOfPages();
    if (i === 0) porClave.get('fichas').pagina = pagina;
    porClave.get(`ficha_${ev.id}`).pagina = pagina;
    try {
      dibujarFichaCYE(doc, { evaluacion: ev, participante: nombreDe(ev.participanteId), panel, banner });
    } catch (err) {
      console.warn(`Ficha omitida en el paquete legal (${ev.id}):`, err);
    }
    if (onProgreso) onProgreso(i + 1, evaluaciones.length);
    if (i % 15 === 14) await cederHilo();
  }

  indice(doc, entradas, { banner, reservadas });
  aplicarPiePaginasCYE(doc, { preliminar: esPreliminarCYE(panel) });
  if (guardar) doc.save(`PaqueteLegal_CYE2026_Cat${categoria}_UGEL03.pdf`);
  return { paginas: doc.internal.getNumberOfPages(), fichas: evaluaciones.length, doc };
}

/* ───── Acta de calibración ───── */

const ESTADOS = { acuerdo: 'Acuerdo', revisar: 'Revisar', discrepancia: 'Discrepancia', sin_datos: 'Sin datos' };
const f1 = v => (v == null ? '—' : String(Math.round(v * 10) / 10));

export function generarActaCalibracionPDF({ resultados = {}, anclas = {}, acuerdos = {}, banner = null, guardar = true }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);
  const W = anchoContenido('portrait');
  const chromeOpts = { orientacion: 'portrait', titulo: 'ACTA DE CALIBRACIÓN DEL JURADO CALIFICADOR', subtitulo: `Concurso Nacional Crea y Emprende 2026 · Etapa UGEL · ${CYE_CONFIG.ugel}`, banner };
  let y = drawChromeCYE(doc, chromeOpts);
  const top = medirChromeCYE(doc, chromeOpts);

  doc.setFont('Arial', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...RGB_CYE.gris800);
  doc.text(`Sede: ${CYE_CONFIG.sede} · Fecha de emisión: ${new Date().toLocaleDateString('es-PE')}`, M.left, y + 1);
  y += 6;
  doc.setFont('Arial', 'bold');
  doc.text('Protocolo aplicado', M.left, y);
  y += 4;
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.6);
  PROTOCOLO_CALIBRACION_CYE.forEach((paso, i) => {
    const l = doc.splitTextToSize(`${i + 1}. ${paso}`, W);
    doc.text(l, M.left, y);
    y += l.length * 3.3 + 0.6;
  });
  y += 3;

  ['A', 'B'].forEach(categoria => {
    const r = resultados[categoria];
    if (!r) return;
    const ancla = anclas[categoria];
    y = espacioOPagina(doc, y, 40, 'portrait', chromeOpts);
    doc.setFillColor(...RGB_CYE.navy3);
    doc.rect(M.left, y, W, 6, 'F');
    doc.setFont('Arial', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...RGB_CYE.blanco);
    doc.text(doc.splitTextToSize(`CATEGORÍA ${categoria} — PROYECTO DE CALIBRACIÓN: ${ancla ? `${ancla.tituloProyecto} (${ancla.institucion?.nombre})` : 'no asignado'}`, W - 4)[0], M.left + 2, y + 4.1);
    y += 9;
    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...RGB_CYE.gris800);
    const grupos = r.porGrupo.map(g => `Grupo ${g.grupo}: ${f1(g.promedio)} (${g.n})`).join(' · ') || 'sin grupos';
    const resumen = doc.splitTextToSize(`Calificaciones enviadas: ${r.n} · Mediana: ${f1(r.mediana)} de ${r.maximo} · Promedio por grupo: ${grupos} · Diferencia entre grupos: ${f1(r.brechaGrupos)} puntos (${ESTADOS[r.estadoBrecha] || ''}).`, W);
    doc.text(resumen, M.left, y);
    y += resumen.length * 3.4 + 2;

    const propios = acuerdos[categoria] || {};
    autoTable(doc, {
      startY: y,
      margin: { left: M.left, right: M.right, top, bottom: M.bottom + 6 },
      tableWidth: W,
      theme: 'grid',
      head: [['Criterio', '1', '2', '3', '4', 'Rango', 'Promedio por grupo', 'Estado', 'Acuerdo del jurado']],
      headStyles: { ...ESTILO_CABECERA, fontSize: 6.8 },
      styles: { ...ESTILO_TABLA, fontSize: 6.5, cellPadding: 1.2 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 7, halign: 'center' }, 2: { cellWidth: 7, halign: 'center' }, 3: { cellWidth: 7, halign: 'center' }, 4: { cellWidth: 7, halign: 'center' }, 5: { cellWidth: 14, halign: 'center' }, 6: { cellWidth: 26, halign: 'center' }, 7: { cellWidth: 18, halign: 'center' }, 8: { cellWidth: 50 } },
      body: r.criterios.map(c => [
        `${c.anexo} · ${c.numero}. ${c.nombre}`,
        c.conteo[1], c.conteo[2], c.conteo[3], c.conteo[4],
        c.n ? `${c.min} a ${c.max}` : '—',
        r.grupos.map(g => `G${g}: ${f1(c.promediosPorGrupo[g])}`).join('\n') || '—',
        ESTADOS[c.estado] || '',
        propios[c.clave] || ''
      ]),
      didDrawPage: data => { if (data.pageNumber > 1) drawChromeCYE(doc, chromeOpts); }
    });
    y = doc.lastAutoTable.finalY + 3;

    if (r.jurados.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: M.left, right: M.right, top, bottom: M.bottom + 6 },
        tableWidth: W,
        theme: 'grid',
        head: [['Jurado', 'Grupo', 'Puntaje', 'Diferencia con la mediana']],
        headStyles: { ...ESTILO_CABECERA, fontSize: 7 },
        styles: { ...ESTILO_TABLA, fontSize: 7 },
        columnStyles: { 0: { cellWidth: 96 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 24, halign: 'center' }, 3: { cellWidth: 46, halign: 'center' } },
        body: r.jurados.map(j => [j.nombre, j.grupo || '', j.total, `${j.desvio > 0 ? '+' : ''}${f1(j.desvio)}`]),
        didDrawPage: data => { if (data.pageNumber > 1) drawChromeCYE(doc, chromeOpts); }
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  });

  const acuerdosC = acuerdos.C || {};
  if (Object.keys(acuerdosC).length) {
    y = espacioOPagina(doc, y, 30, 'portrait', chromeOpts);
    autoTable(doc, {
      startY: y,
      margin: { left: M.left, right: M.right, top, bottom: M.bottom + 6 },
      tableWidth: W,
      theme: 'grid',
      head: [['Categoría C — criterio', 'Acuerdo del jurado']],
      headStyles: { ...ESTILO_CABECERA, fontSize: 7 },
      styles: { ...ESTILO_TABLA, fontSize: 7 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: W - 40 } },
      body: Object.entries(acuerdosC).map(([clave, texto]) => [clave.replace('_', ' · criterio '), texto])
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  y = espacioOPagina(doc, y + 14, 24, 'portrait', chromeOpts);
  doc.setDrawColor(...RGB_CYE.gris500);
  doc.line(A4.ancho / 2 - 45, y, A4.ancho / 2 + 45, y);
  doc.setFont('Arial', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(...RGB_CYE.navy2);
  doc.text('Responsable de la calibración — Comisión Organizadora', A4.ancho / 2, y + 4, { align: 'center' });

  aplicarPiePaginasCYE(doc, { preliminar: false });
  if (guardar) doc.save('ActaCalibracion_CYE2026_UGEL03.pdf');
  return doc;
}
