/* ═══════════════════════════════════════════════════════════════
   GENERADOR PDF — D1 FICHA DE EVALUACIÓN JUEGOS FLORALES JFEN 2026
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { M, CONTENT_W, BODY_TOP_OTHER, aplicarFuentesArial, drawChrome } from './membrete';

export function dibujarUnicaFicha(doc, evaluacion, rubrica, bannerDataURL) {
  aplicarFuentesArial(doc);

  // 1. Chrome / Membrete
  drawChrome(doc, { conMembreteCompleto: false, banner: bannerDataURL });

  let y = 30;

  // 2. Encabezado Oficial
  doc.setFont('Arial', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(18, 34, 64); // #122240
  doc.text('FICHA DE EVALUACIÓN DEL JURADO CALIFICADOR', M.pageW / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(10);
  doc.text('JUEGOS FLORALES ESCOLARES NACIONALES 2026', M.pageW / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(9);
  const subtitulo = `${rubrica?.arte || ''} — ${rubrica?.numeral || ''} ${rubrica?.disciplina || evaluacion.disciplinaLabel || ''}`;
  doc.text(subtitulo, M.pageW / 2, y, { align: 'center' });
  y += 5;

  // 3. Tabla de Datos Generales (Diseño Compacto en 4 Columnas para calce en 1 sola hoja)
  const snap = evaluacion.participanteSnapshot || {};
  const instNombre = snap.institucionNombre || evaluacion.institucionNombre || 'No registrada';
  const catDesc = `${evaluacion.categoria || ''} — ${evaluacion.detalleCategoria || ''}`;

  const datosGenRows = [
    [
      { content: 'INSTITUCIÓN EDUCATIVA', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: instNombre, colSpan: 3, styles: { fontStyle: 'bold', textColor: [18, 34, 64] } }
    ],
    [
      { content: 'CATEGORÍA', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: catDesc, styles: { fontStyle: 'bold' } },
      { content: 'DISCIPLINA', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `${rubrica?.numeral || ''} ${rubrica?.disciplina || ''}`, styles: { fontStyle: 'bold' } }
    ],
    [
      { content: 'CÓDIGO SICE', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: snap.codigoParticipante || snap.codigo || evaluacion.codigoParticipante || 'JF-2026' },
      { content: 'TÍTULO / SEUDÓNIMO', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: snap.tituloObra || snap.titulo || snap.seudonimo || '—', styles: { fontStyle: 'italic' } }
    ],
    [
      { content: 'ESTUDIANTE(S)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: Array.isArray(snap.estudiantes) && snap.estudiantes.some(e => e.nombres) ? snap.estudiantes.map(e => `${e.nombres || ''} ${e.apellidos || ''}`).join(', ') : '— (Evaluación por SICE)' },
      { content: 'DOCENTE ASESOR', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: snap.docenteAsesor?.nombres ? `${snap.docenteAsesor.nombres || ''} ${snap.docenteAsesor.apellidos || ''}` : '—' }
    ],
    [
      { content: 'ETAPA / DRE / UGEL', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `${evaluacion.etapa || 'UGEL'} / ${snap.dre || 'DRE LIMA METROPOLITANA'} / ${snap.ugel || 'UGEL 03'}` },
      { content: 'FECHA / LUGAR', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `${evaluacion.fecha || '2026'} ${evaluacion.lugar ? '· ' + evaluacion.lugar : ''}` }
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: CONTENT_W / 2 - 38 },
      2: { cellWidth: 35 },
      3: { cellWidth: CONTENT_W / 2 - 35 }
    },
    body: datosGenRows
  });

  y = doc.lastAutoTable.finalY + 4;

  // Línea compacta de acreditación para presenciales
  if (rubrica?.presencial) {
    const acrMap = evaluacion.acreditacion || {};
    const marcadas = Object.values(acrMap).filter(Boolean).length;

    doc.setFont('Arial', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(marcadas === 6 ? 21 : 180, marcadas === 6 ? 128 : 83, marcadas === 6 ? 61 : 9);
    doc.text(`Acreditación verificada: ${marcadas} de 6 requisitos.`, M.left, y);
    y += 3.5;
  }

  // 4. Tabla de Calificación con Criterios e Indicadores
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 34, 64);
  doc.text('EVALUACIÓN DE CRITERIOS E INDICADORES', M.left, y);
  y += 3;

  const tableBody = [];
  const puntajesMap = evaluacion.puntajes || {};

  (rubrica?.criterios || []).forEach(criterio => {
    const numInds = criterio.indicadores.length;
    criterio.indicadores.forEach((ind, index) => {
      const row = [];
      if (index === 0) {
        row.push({
          content: criterio.criterio,
          rowSpan: numInds,
          styles: { valign: 'middle', fontStyle: 'bold', fillColor: [248, 250, 252] }
        });
      }
      row.push(ind.texto);
      row.push({ content: String(ind.max || 4), styles: { halign: 'center' } });

      const val = puntajesMap[ind.id];
      const valStr = (val != null) ? String(val) : '0';
      row.push({ content: valStr, styles: { halign: 'center', fontStyle: 'bold' } });

      tableBody.push(row);
    });
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    head: [['CRITERIOS', 'INDICADORES', 'P. MÁX', 'PUNTAJE']],
    headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    styles: { font: 'Arial', fontSize: 7.5, cellPadding: 1.8, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    },
    body: tableBody
  });

  y = doc.lastAutoTable.finalY + 4;

  // 5. Cuadro de Resumen Final de Puntajes
  const penalizaciones = evaluacion.penalizaciones || [];
  const penalPuntos = penalizaciones.reduce((s, p) => s + (p.puntos || 0), 0);
  const pBruto = evaluacion.puntajeBruto || 0;
  const pTotal = evaluacion.puntajeTotal || 0;
  const pMax = rubrica?.puntajeMaximo || 40;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    theme: 'grid',
    styles: { font: 'Arial', fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: CONTENT_W * 0.38, fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] },
      1: { cellWidth: CONTENT_W * 0.32, fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] },
      2: { cellWidth: CONTENT_W * 0.30, fontStyle: 'bold', halign: 'center', fillColor: [27, 58, 92], textColor: [255, 255, 255], fontSize: 9 }
    },
    body: [
      [
        `PUNTAJE BRUTO: ${pBruto} / ${pMax} ptos`,
        `PENALIZACIÓN: −${penalPuntos} ptos`,
        `PUNTAJE FINAL: ${pTotal} / ${pMax} ptos`
      ]
    ]
  });

  y = doc.lastAutoTable.finalY + 4;

  // 6. Observaciones del Jurado Calificador
  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('OBSERVACIONES DEL JURADO CALIFICADOR:', M.left, y);
  y += 3;

  const obsTexto = evaluacion.observacionesJurado || 'Sin observaciones registradas por el Jurado Calificador.';
  const obsLineas = doc.splitTextToSize(obsTexto, CONTENT_W - 4);
  const boxHeight = Math.min(20, Math.max(10, obsLineas.length * 3 + 4));

  doc.setDrawColor(214, 220, 232);
  doc.setFillColor(250, 250, 250);
  doc.rect(M.left, y, CONTENT_W, boxHeight, 'F');
  doc.rect(M.left, y, CONTENT_W, boxHeight, 'S');
  doc.setFont('Arial', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(obsLineas, M.left + 2, y + 3.5);
  y += boxHeight + 5;

  // 7. Bloque de Incomparecencia o Firma al Pie
  if (evaluacion.incomparecencia || evaluacion.estado === 'incomparecencia') {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(M.left, y, CONTENT_W, 8, 2, 2, 'FD');
    doc.setFont('Arial', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text('INCOMPARECENCIA — PARTICIPANTE NO SE PRESENTÓ A LA EVALUACIÓN', M.pageW / 2, y + 5.5, { align: 'center' });
    y += 11;
  }

  const jurado = evaluacion.jurado || {};
  const firmaX = M.pageW / 2 - 35; // centrado ancho 70 mm

  if (jurado.firmaDataUrl) {
    try {
      doc.addImage(jurado.firmaDataUrl, 'PNG', firmaX + 15, y, 40, 14);
      y += 15;
    } catch (e) {
      console.warn("Error agregando firma a PDF:", e);
      y += 15;
    }
  } else {
    y += 15;
  }

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(firmaX, y, firmaX + 70, y);
  y += 3.5;

  doc.setFont('Arial', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 34, 64);
  doc.text((jurado.nombreCompleto || 'JURADO CALIFICADOR').toUpperCase(), M.pageW / 2, y, { align: 'center' });
  y += 3.5;

  doc.setFont('Arial', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`DNI: ${jurado.dni || '────────'}${!jurado.firmaDataUrl ? '  (Firma Manuscrita)' : ''}`, M.pageW / 2, y, { align: 'center' });
  y += 3;

  doc.setFontSize(7.5);
  doc.text(`Jurado N.° ${jurado.numeroJurado || 1} — Jurado Calificador`, M.pageW / 2, y, { align: 'center' });

  // 8. Pie de página institucional
  doc.setFont('Arial', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Bases Específicas JFEN 2026 — RVM N.° 106-2026-MINEDU — Etapa UGEL, Comunicado 01 — UGEL 03`,
    M.pageW / 2,
    288,
    { align: 'center' }
  );
}

export function generarFichaJFPDF(evaluacion, rubrica, bannerDataURL) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  dibujarUnicaFicha(doc, evaluacion, rubrica, bannerDataURL);

  const snap = evaluacion.participanteSnapshot || {};
  const jurado = evaluacion.jurado || {};
  const fileName = `Ficha_JF_${evaluacion.disciplinaId}_${evaluacion.categoria}_${snap.codigoParticipante || 'part'}_Jurado${jurado.numeroJurado || 1}.pdf`;
  doc.save(fileName);
}

export function generarTodasFichasJFPDF(evaluacionesList = [], rubrica, bannerDataURL) {
  if (!evaluacionesList || evaluacionesList.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  evaluacionesList.forEach((ev, idx) => {
    if (idx > 0) {
      doc.addPage();
    }
    dibujarUnicaFicha(doc, ev, rubrica, bannerDataURL);
  });

  const discId = evaluacionesList[0]?.disciplinaId || 'disciplina';
  const cat = evaluacionesList[0]?.categoria || 'cat';
  doc.save(`Fichas_Evaluacion_Consolidadas_TODAS_${discId}_Cat${cat}.pdf`);
}
