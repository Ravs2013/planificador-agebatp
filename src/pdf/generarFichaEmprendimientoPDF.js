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

export function generarFichaEmprendimientoPDF(fichaData, bannerDataURL) {
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
  doc.text("MONITOREO FERIA DE EMPRENDIMIENTO - CETPRO 2026", myM.pageW / 2, yCursor, { align: 'center' });
  yCursor += 6;

  // 1. DATOS GENERALES DEL CETPRO
  const dg = fichaData.datosGeneralesCETPRO || {};
  const fecha = dg.fecha ? new Date(dg.fecha) : new Date();
  const dia = dg.dia || (!isNaN(fecha.getDate()) ? String(fecha.getDate()).padStart(2, '0') : '');
  const mes = dg.mes || (!isNaN(fecha.getMonth()) ? String(fecha.getMonth() + 1).padStart(2, '0') : '');
  const anio = dg.anio || '2026';

  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 8, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    body: [
      [
        { content: "DATOS GENERALES DEL CETPRO", colSpan: 6, styles: { fillColor: [240, 244, 248], fontStyle: 'bold', halign: 'left', fontSize: 8.5 } }
      ],
      [
        { content: `Código Modular: ${dg.codigoModular || ''}`, colSpan: 3 },
        { content: `Fecha: Día: ${dia} / Mes: ${mes} / Año: ${anio}`, colSpan: 3 }
      ],
      [
        { content: `Nombre del CETPRO: ${dg.nombreCETPRO || ''}`, colSpan: 3 },
        { content: `UGEL: ${dg.ugel || '03'}    Red: ${dg.red || ''}`, colSpan: 3 }
      ],
      [
        { content: `CICLO: ${dg.cicloBasicoAuxiliar ? '[X] Básico/Auxiliar' : '[  ] Básico/Auxiliar'}   ${dg.cicloMedioTecnico ? '[X] Medio/Técnico' : '[  ] Medio/Técnico'}`, colSpan: 3 },
        { content: `Turnos: ${dg.turnoM ? '[X] M ' : '[  ] M '}${dg.turnoT ? '[X] T ' : '[  ] T '}${dg.turnoN ? '[X] N' : '[  ] N'}`, colSpan: 3 }
      ]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 4;

  // 2. DATOS DEL DIRECTOR/A
  const dir = fichaData.datosDirector || {};
  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 8, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    body: [
      [
        { content: "DATOS DEL DIRECTOR /A", colSpan: 4, styles: { fillColor: [240, 244, 248], fontStyle: 'bold', halign: 'left', fontSize: 8.5 } }
      ],
      [
        { content: `Apellidos y Nombres: ${dir.nombres || ''}`, colSpan: 2 },
        { content: `DNI: ${dir.dni || ''}`, colSpan: 2 }
      ],
      [
        { content: `Teléfono celular N°: ${dir.celular || ''}`, colSpan: 2 },
        { content: `Correo electrónico: ${dir.correo || ''}`, colSpan: 2 }
      ]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 4;

  // 3. RÚBRICA DE LA FERIA DE EMPRENDIMIENTO (5 Criterios en 4 niveles)
  const rubricas = fichaData.rubricas || [];
  const defaultRubricas = [
    {
      criterio: "Organización y logística",
      n4: "La feria está impecablemente organizada, con una clara señalización, un flujo de visitantes fluido y cuenta con apoyo de la policía y/o serenazgo de la municipalidad.",
      n3: "La organización es buena, con algunos problemas menores de logística que no afectan significativamente el evento y cuenta con personal de seguridad del CETPRO, debidamente identificados.",
      n2: "Hay problemas de organización evidentes, como falta de señalización o aglomeraciones, lo que dificulta la experiencia, el personal de seguridad del CETPRO se encuentra debidamente identificados.",
      n1: "La organización es deficiente que afecta negativamente a visitantes y expositores, la seguridad es apoyada por los profesores."
    },
    {
      criterio: "Ambientes de exposición (Stand o aulas)",
      n4: "Los ambientes de exposición están diseñados de manera creativa, son visualmente atractivos y reflejan profesionalidad.",
      n3: "Los ambientes de exposición son funcionales y están bien presentados, aunque podrían mejorar en creatividad o detalles.",
      n2: "Los ambientes de exposición son básicos y carecen de elementos que atraigan a los visitantes.",
      n1: "Los ambientes de exposición están desordenados, sucios o no presentan la información de manera clara."
    },
    {
      criterio: "Presentación de los expositores",
      n4: "Los expositores (estudiantes) son entusiastas, conocen bien sus proyectos y se comunican eficazmente con los visitantes.",
      n3: "Los expositores se comunican de manera adecuada, en ocasiones los docentes participan.",
      n2: "Los expositores tienen dificultades para explicar sus proyectos, a menudo se apoyan con los docentes.",
      n1: "Los expositores no interactúan con los visitantes o la comunicación es nula."
    },
    {
      criterio: "Evaluadores de proyectos",
      n4: "Se cuenta con evaluadores externos e internos de los proyectos de la feria.",
      n3: "Se gestionó la participación de evaluadores externos y participan solo evaluadores internos.",
      n2: "Los evaluadores de los proyectos de la feria son personal del CETPRO.",
      n1: "Los proyectos de la feria no son evaluados."
    },
    {
      criterio: "Recursos y materiales",
      n4: "Se utilizan proyectos terminados y recursos audiovisuales (pantallas, folletos, etc.) de calidad y de manera efectiva para mejorar la exposición.",
      n3: "Se utilizan proyectos terminados y algunos recursos que complementan la exposición.",
      n2: "Los recursos son limitados o no se utilizan adecuadamente para complementar la exposición.",
      n1: "No se utilizan materiales o recursos para la exposición."
    }
  ];

  let totalScore = 0;
  const bodyRows = defaultRubricas.map((def, idx) => {
    const lvl = (rubricas[idx] && Number(rubricas[idx].nivel)) || 0; // 4, 3, 2, 1
    if (lvl > 0) totalScore += lvl;

    return [
      { content: def.criterio, styles: { fontStyle: 'bold', fontSize: 7.5, cellWidth: 32 } },
      { content: `${lvl === 4 ? '[ X ]\n' : ''}${def.n4}`, styles: { fontSize: 7, fillColor: lvl === 4 ? [240, 253, 244] : [255, 255, 255] } },
      { content: `${lvl === 3 ? '[ X ]\n' : ''}${def.n3}`, styles: { fontSize: 7, fillColor: lvl === 3 ? [239, 246, 255] : [255, 255, 255] } },
      { content: `${lvl === 2 ? '[ X ]\n' : ''}${def.n2}`, styles: { fontSize: 7, fillColor: lvl === 2 ? [255, 251, 235] : [255, 255, 255] } },
      { content: `${lvl === 1 ? '[ X ]\n' : ''}${def.n1}`, styles: { fontSize: 7, fillColor: lvl === 1 ? [254, 242, 242] : [255, 255, 255] } },
      { content: lvl > 0 ? String(lvl) : '—', styles: { fontStyle: 'bold', halign: 'center', fontSize: 8.5, fillColor: [245, 245, 245] } }
    ];
  });

  // Fila Total
  bodyRows.push([
    { content: "TOTAL PUNTOS", colSpan: 5, styles: { fontStyle: 'bold', halign: 'right', fontSize: 8.5, fillColor: [240, 244, 248] } },
    { content: `${totalScore} / 20`, styles: { fontStyle: 'bold', halign: 'center', fontSize: 9, fillColor: [226, 232, 240] } }
  ]);

  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 7.5, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [18, 34, 64], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
    head: [
      ["CRITERIO", "NIVEL 4 (4 pts)", "NIVEL 3 (3 pts)", "NIVEL 2 (2 pts)", "NIVEL 1 (1 pt)", "NIVEL ALCANZADO"]
    ],
    body: bodyRows
  });

  yCursor = doc.lastAutoTable.finalY + 3;

  // Escala de Puntuación Final
  doc.setFont("Arial", "bold");
  doc.setFontSize(8);
  doc.setTextColor(12, 25, 41);
  doc.text("Puntuación Final:", myM.left, yCursor);
  yCursor += 4;

  const escalas = [
    "18-20 puntos: Sobresaliente - Un evento de gran calidad que demuestra un trabajo excepcional.",
    "14-17 puntos: Notable - Un evento bien ejecutado, que logra sus objetivos de manera efectiva.",
    "10-13 puntos: En Desarrollo - El evento tiene potencial, pero necesita una mejora significativa en aspectos clave.",
    "5-9 puntos: Insuficiente - Un evento que no cumple con las expectativas mínimas."
  ];

  doc.setFont("Arial", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  escalas.forEach(e => {
    doc.text(`• ${e}`, myM.left + 3, yCursor);
    yCursor += 3.8;
  });

  yCursor += 2;

  // 4. ASPECTOS POR MEJORAR Y COMPROMISO DE MEJORA
  autoTable(doc, {
    startY: yCursor,
    margin: { left: myM.left, right: myM.right },
    tableWidth: myCONTENT_W,
    styles: { font: "Arial", fontSize: 8, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 244, 248], textColor: [12, 25, 41], fontStyle: 'bold', halign: 'center', fontSize: 8.5 },
    head: [["ASPECTOS POR MEJORAR", "COMPROMISO DE MEJORA"]],
    body: [
      [
        { content: fichaData.aspectosPorMejorar || 'Ninguno especificado.', styles: { minCellHeight: 18 } },
        { content: fichaData.compromisoMejora || 'Sin compromisos registrados.', styles: { minCellHeight: 18 } }
      ]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 12;

  // Verificar espacio firmas
  if (yCursor + 30 > myM.pageH - myM.bottom) {
    doc.addPage();
    yCursor = myM.top + 20;
  }

  // Firmas
  const dirName = dir.nombres || dg.directorNombre || 'Director(a)';
  const dirDni = dir.dni || '';
  const monitorName = fichaData.monitorNombre || dg.monitorNombre || 'Especialista AGEBATP';
  const monitorDni = fichaData.monitorDni || '';

  drawSignatureBlock(doc, dirName, "FIRMA DEL DIRECTOR(A)", dirDni, fichaData.firmaDirector, myM.left + (myCONTENT_W / 4), yCursor);
  drawSignatureBlock(doc, monitorName, "FIRMA DEL ESPECIALISTA", monitorDni, fichaData.firmaEspecialista, myM.left + (3 * myCONTENT_W / 4), yCursor);

  return doc;
}
