import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarFuentesArial } from './membrete';
import { FONT_CORSIVA } from './fuenteCorsiva';

const myM = {
  left: 10,
  right: 10,
  top: 9.5,
  bottom: 12,
  pageW: 210,
  pageH: 297
};
const myCONTENT_W = myM.pageW - myM.left - myM.right; // 190 mm

function drawSignatureBlock(doc, name, role, dni, signatureDataURL, xCenter, yStart) {
  const sigWidth = 65;
  const lineY = yStart + 15;

  doc.saveGraphicsState();
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(xCenter - (sigWidth / 2), lineY, xCenter + (sigWidth / 2), lineY);
  doc.restoreGraphicsState();

  if (signatureDataURL) {
    try {
      doc.addImage(signatureDataURL, 'PNG', xCenter - 15, lineY - 14, 30, 13);
    } catch (e) {
      console.error("Error drawing signature image:", e);
    }
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(8.5);
  doc.text(role, xCenter, lineY + 4, { align: 'center' });
  doc.setFont("Arial", "normal");
  doc.text(name || '', xCenter, lineY + 8, { align: 'center' });

  const cleanDni = (dni || '').replace(/[^0-9]/g, '');
  if (cleanDni) {
    doc.setFont("Arial", "normal");
    doc.setFontSize(7.5);
    doc.text(`DNI: ${cleanDni}`, xCenter, lineY + 12, { align: 'center' });
  }
}

export function generarFichaDiaLogroPDF(fichaData, bannerDataURL) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  doc.addFileToVFS('MTCORSVA.TTF', FONT_CORSIVA);
  doc.addFont('MTCORSVA.TTF', 'Monotype Corsiva', 'italic');

  let yCursor = myM.top;

  // Banner Membrete
  if (bannerDataURL) {
    try {
      doc.addImage(bannerDataURL, 'JPEG', myM.left, yCursor, myCONTENT_W, 14);
      yCursor += 16;
    } catch (e) {
      console.error("Error adding banner image:", e);
      yCursor += 5;
    }
  }

  // Título Principal
  doc.setFont("Arial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(12, 25, 41); // navy1
  doc.text("FICHA DE MONITOREO DEL PRIMER DÍA DEL LOGRO 2026", myM.pageW / 2, yCursor, { align: 'center' });
  yCursor += 6;

  // 1. DATOS GENERALES
  const dg = fichaData.datosGenerales || {};
  const fecha = dg.fecha ? new Date(dg.fecha) : new Date();
  const dia = dg.dia || (!isNaN(fecha.getDate()) ? String(fecha.getDate()).padStart(2, '0') : '');
  const mes = dg.mes || (!isNaN(fecha.getMonth()) ? String(fecha.getMonth() + 1).padStart(2, '0') : '');
  const anio = dg.anio || '2026';

  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 8, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [242, 242, 242], textColor: [12, 25, 41], fontStyle: 'bold', halign: 'center' },
    body: [
      [
        { content: "DATOS GENERALES", colSpan: 6, styles: { fillColor: [240, 244, 248], fontStyle: 'bold', halign: 'left', fontSize: 8.5 } }
      ],
      [
        { content: `Código Local: ${dg.codigoLocal || ''}`, colSpan: 3 },
        { content: `Fecha: Día: ${dia} / Mes: ${mes} / Año: ${anio}`, colSpan: 3 }
      ],
      [
        { content: `Nombre del CEBA: ${dg.nombreCEBA || ''}`, colSpan: 3 },
        { content: `UGEL: ${dg.ugel || '03'}    Red: ${dg.red || ''}`, colSpan: 3 }
      ],
      [
        { content: `CICLO: ${dg.cicloAvanzado ? '[X] AVANZADO' : '[  ] AVANZADO'}   ${dg.cicloInicialIntermedio ? '[X] INICIAL-INTERMEDIO' : '[  ] INICIAL-INTERMEDIO'}`, colSpan: 3 },
        { content: `Turnos: ${dg.turnoM ? '[X] M ' : '[  ] M '}${dg.turnoT ? '[X] T ' : '[  ] T '}${dg.turnoN ? '[X] N' : '[  ] N'}`, colSpan: 3 }
      ]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 4;

  // 2. DATOS DEL INFORMANTE
  const inf = fichaData.datosInformante || {};
  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 8, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    body: [
      [
        { content: "DATOS DEL INFORMANTE", colSpan: 4, styles: { fillColor: [240, 244, 248], fontStyle: 'bold', halign: 'left', fontSize: 8.5 } }
      ],
      [
        { content: `Cargo: ${inf.cargoDirector ? '[X] Director(a)' : '[  ] Director(a)'}  ${inf.cargoOtro ? '[X] Otro designado' : '[  ] Otro'}` },
        { content: `CM Avanzado: ${inf.cmAvanzado || ''}` },
        { content: `CM Inicial-Intermedio: ${inf.cmInicialIntermedio || ''}`, colSpan: 2 }
      ],
      [
        { content: `Apellidos y Nombres: ${inf.nombres || ''}`, colSpan: 2 },
        { content: `DNI: ${inf.dni || ''}`, colSpan: 2 }
      ],
      [
        { content: `Celular: ${inf.celular || ''}`, colSpan: 2 },
        { content: `Correo: ${inf.correo || ''}`, colSpan: 2 }
      ]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 4;

  // 3. CRITERIOS DE EVALUACIÓN (3 niveles)
  const criterios = fichaData.criterios || [];
  const defaultCriterios = [
    {
      nombre: "DESARROLLO DEL PENSAMIENTO REFLEXIVO",
      c: "El estudiante presenta sus trabajos de forma superficial, sin profundizar en análisis críticos o reflexiones significativas.",
      b: "El estudiante comienza a incorporar análisis críticos en sus presentaciones, pero aún necesita desarrollar mayor profundidad en sus reflexiones.",
      a: "El estudiante demuestra capacidad para realizar análisis críticos profundos y reflexiones significativas en la presentación de sus trabajos, aportando perspectivas enriquecedoras al tema."
    },
    {
      nombre: "CREATIVIDAD E INNOVACIÓN Y/O USO DE TECNOLOGÍA",
      c: "El estudiante presenta sus trabajos de manera convencional y poco creativa, sin elementos innovadores y/o el estudiante utiliza de manera limitada la tecnología y recursos virtuales sin aprovechar su potencial.",
      b: "El estudiante muestra intentos de incorporar elementos creativos en la presentación, pero aún necesita explorar nuevas ideas y/o el estudiante experimenta con el uso de tecnología y recursos virtuales pero aún necesita mejorar su integración en la presentación.",
      a: "El estudiante demuestra originalidad y creatividad en la presentación de sus trabajos, utilizando elementos innovadores que destacan y enriquecen la exposición y/o el estudiante emplea de manera efectiva la tecnología y recursos virtuales para enriquecer la presentación de sus trabajos facilitando la comprensión del contenido."
    },
    {
      nombre: "COLABORACIÓN Y CO-CREACIÓN",
      c: "El estudiante trabaja de forma individual en la presentación de sus trabajos, sin involucrar la colaboración con otros.",
      b: "El estudiante muestra interés por la colaboración, pero aún necesita desarrollar habilidades de co-creación en la presentación.",
      a: "El estudiante colabora de forma efectiva con otros compañeros en la co-creación de la presentación, integrando diferentes perspectivas y habilidades para lograr un resultado conjunto innovador."
    },
    {
      nombre: "ALINEACIÓN DE LAS ACTIVIDADES CON EL CNEB",
      c: "El estudiante participa en actividades que no están alineadas con el CNEB.",
      b: "El estudiante participa en actividades que presentan algunas deficiencias en la alineación con el CNEB.",
      a: "El estudiante participa en actividades que en su mayoría están alineadas con el CNEB con énfasis en el desarrollo de aprendizajes a lo largo de la vida."
    },
    {
      nombre: "BIENESTAR DE LA COMUNIDAD",
      c: "Se observa poca o ninguna participación de la comunidad educativa.",
      b: "Se observa la participación de algunos actores de la comunidad educativa.",
      a: "Se observa la participación de la mayoría de los actores de la comunidad educativa."
    }
  ];

  const bodyRows = defaultCriterios.map((def, idx) => {
    const val = (criterios[idx] && criterios[idx].nivel) || ''; // 'C', 'B', 'A'
    return [
      { content: def.nombre, styles: { fontStyle: 'bold', fontSize: 7.5, cellWidth: 42 } },
      { content: `${val === 'C' ? '[ X ]\n' : ''}${def.c}`, styles: { fontSize: 7, fillColor: val === 'C' ? [254, 242, 242] : [255, 255, 255] } },
      { content: `${val === 'B' ? '[ X ]\n' : ''}${def.b}`, styles: { fontSize: 7, fillColor: val === 'B' ? [255, 251, 235] : [255, 255, 255] } },
      { content: `${val === 'A' ? '[ X ]\n' : ''}${def.a}`, styles: { fontSize: 7, fillColor: val === 'A' ? [240, 253, 244] : [255, 255, 255] } },
      { content: val || '—', styles: { fontStyle: 'bold', halign: 'center', fontSize: 8.5, fillColor: [245, 245, 245] } }
    ];
  });

  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 7.5, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [18, 34, 64], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
    head: [
      ["CRITERIOS DE EVALUACIÓN", "Inicio (C)", "Proceso (B)", "Logrado (A)", "Eval."]
    ],
    body: bodyRows
  });

  yCursor = doc.lastAutoTable.finalY + 4;

  // 4. COMPROMISO DEL DIRECTOR
  const compromisoText = fichaData.compromisoDirector || '';
  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 8, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 244, 248], textColor: [12, 25, 41], fontStyle: 'bold', halign: 'left', fontSize: 8.5 },
    head: [["COMPROMISO DEL DIRECTOR(A)"]],
    body: [
      [{ content: compromisoText || 'Sin compromisos registrados.', styles: { minCellHeight: 18 } }]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 12;

  // Si no hay suficiente espacio para las firmas, agregar página
  if (yCursor + 30 > myM.pageH - myM.bottom) {
    doc.addPage();
    yCursor = myM.top + 20;
  }

  // Firmas Simétricas
  const dirName = inf.nombres || dg.directorNombre || 'Director(a)';
  const dirDni = inf.dni || '';
  const monitorName = fichaData.monitorNombre || dg.monitorNombre || 'Especialista AGEBATP';
  const monitorDni = fichaData.monitorDni || '';

  drawSignatureBlock(doc, dirName, "FIRMA DEL DIRECTOR(A)", dirDni, fichaData.firmaDirector, myM.left + (myCONTENT_W / 4), yCursor);
  drawSignatureBlock(doc, monitorName, "FIRMA DEL ESPECIALISTA", monitorDni, fichaData.firmaEspecialista, myM.left + (3 * myCONTENT_W / 4), yCursor);

  return doc;
}
