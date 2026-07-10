import { 
  Document, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, Header, Footer, ImageRun, AlignmentType, 
  convertMillimetersToTwip, Packer, BorderStyle, TableLayoutType, VerticalAlign
} from 'docx';

// Convert base64 dataURL to raw ArrayBuffer for docx ImageRun
function base64ToArrayBuffer(base64DataURL) {
  if (!base64DataURL) return null;
  const base64 = base64DataURL.split(',')[1] || base64DataURL;
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const C = {
  grayBg: "D9D9D9",
  lineGray: "B4B4B4",
  redText: "FF0000"
};

/**
 * Helper to create standard Arial TextRun
 */
function run(text, { bold = false, italic = false, size = 11, color = "000000" } = {}) {
  return new TextRun({
    text,
    font: "Arial",
    size: size * 2, // docx uses half-points
    bold,
    italic,
    color
  });
}

/**
 * Helper to build standard spacing paragraphs
 */
function para(children = [], { align = AlignmentType.JUSTIFY, before = 0, after = 6, lineSpacing = 240 } = {}) {
  const childRuns = typeof children === 'string' ? [run(children)] : children;
  return new Paragraph({
    alignment: align,
    spacing: { before, after, line: lineSpacing },
    children: childRuns
  });
}

/**
 * Builds the E-SINAD style footer table for Word documents.
 */
function createEsinadFooter(specialistCargo, qrDataURL) {
  const esinadSeg = /etp|cetpro/i.test(specialistCargo || '') ? 'e_sinadmed_6' : 'e_sinadmed_11';
  const urlConsulta = `https://esinad.minedu.gob.pe/${esinadSeg}/VDD_ConsultaDocumento.aspx`;
  
  const qrBuffer = base64ToArrayBuffer(qrDataURL);
  const qrImage = qrBuffer ? new ImageRun({
    data: qrBuffer,
    transformation: { width: 70, height: 70 }
  }) : null;

  return new Footer({
    children: [
      // Border line above footer
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: C.lineGray },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: [
                  para("", { after: 2 })
                ]
              })
            ]
          })
        ]
      }),
      // Footer content table: 2 columns
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              // Column 1: QR & Legal Notice
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Table({
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            children: qrImage ? [new Paragraph({ children: [qrImage] })] : []
                          }),
                          new TableCell({
                            width: { size: 75, type: WidthType.PERCENTAGE },
                            children: [
                              para([
                                run("Esta es una copia auténtica imprimible de un documento electrónico archivado por la UGEL 03, aplicando lo dispuesto por el Art. 25 de D.S. 070-2013-PCM y la Tercera Disposición Complementaria Final del D.S. 026-2016-PCM. Su autenticidad e integridad pueden ser contrastadas a través de la siguiente dirección web:", { size: 6.5 })
                              ], { after: 3 }),
                              para([
                                run(urlConsulta, { size: 6.5, bold: true })
                              ], { after: 0 })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              // Column 2: Contact info separated by red vertical bar
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Table({
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            children: [
                              para([
                                run("www.ugel03.gob.pe", { size: 7, bold: true, color: C.redText })
                              ], { align: AlignmentType.RIGHT, after: 3 }),
                              para([
                                run("Av. Iquitos N° 918 - La Victoria", { size: 6 }),
                                run("\nT: (01) 215-5800", { size: 6 }),
                                run("\nLima, Perú", { size: 6 })
                              ], { align: AlignmentType.RIGHT, after: 0 })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

/**
 * Generates and downloads the consolidated INFORME Word (.docx) file.
 */
export async function generarInformeWord(informeData, bannerDataURL, qrDataURL) {
  const {
    numero,
    destinatario,
    remitente,
    fecha,
    mes,
    anio,
    programa,
    institucionNombre,
    institucionTipo = "CEBA",
    docentes = [],
    conclusiones = [],
    recomendaciones = [],
    linkEvidencias
  } = informeData;

  const docType = (programa === 'ETP') ? 'ETP' : 'EBA';
  const filename = `Informe_Monitoreo_${docType}_${(institucionNombre || 'Consolidado').replace(/["']/g, '').replace(/[^a-zA-Z0-9_ -]/g, '_')}.docx`;

  const bannerBuffer = base64ToArrayBuffer(bannerDataURL);
  const headerBanner = bannerBuffer ? new ImageRun({
    data: bannerBuffer,
    transformation: { width: 446, height: 75 } // spans A4 width (157.5mm wide)
  }) : null;

  // Header definition
  const docHeader = new Header({
    children: headerBanner ? [new Paragraph({ children: [headerBanner], alignment: AlignmentType.CENTER })] : []
  });

  // Table style for tables inside the document
  const thinBorder = { style: BorderStyle.SINGLE, size: 2, color: "000000" };
  const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

  // 1. Docentes table (Section II - 2.5)
  const teacherRows = [
    new TableRow({
      children: ["N°", "Apellidos y Nombres del docente", "Módulo / Área", "Niveles R1-R5", "Cuenta con documentos pedagógicos"].map(h => 
        new TableCell({
          shading: { fill: C.grayBg },
          borders: cellBorders,
          children: [para([run(h, { bold: true, size: 8.5 })], { align: AlignmentType.CENTER, after: 2 })]
        })
      )
    })
  ];

  docentes.forEach((docente, idx) => {
    const checkDocs = docente.documentosPedagogicos || {};
    const totalDocsCount = programa === 'ETP' ? 4 : 3;
    let presentedCount = 0;
    if (checkDocs.planEstudios) presentedCount++;
    if (checkDocs.unidadDidactica) presentedCount++;
    if (checkDocs.sesionAprendizaje) presentedCount++;
    if (programa === 'ETP' && checkDocs.silabo) presentedCount++;

    const docStatus = presentedCount === totalDocsCount 
      ? `Sí (Presenta los ${totalDocsCount} documentos)` 
      : presentedCount > 0 
        ? `Parcial (${presentedCount}/${totalDocsCount} presentados)` 
        : "No (No presenta documentación)";

    let nivelesText = '—';
    if (docente.ficha) {
      const formatLevelLocal = (lvl) => {
        if (lvl === 1) return 'I';
        if (lvl === 2) return 'II';
        if (lvl === 3) return 'III';
        if (lvl === 4) return 'IV';
        return '—';
      };
      if (programa === 'ETP') {
        const rubricas = docente.ficha.rubricasETP || [];
        nivelesText = rubricas.map((r, i) => `R${i + 1}:${formatLevelLocal(r.nivel)}`).join('  ');
      } else {
        const criterios = docente.ficha.instrumento1?.criterios || [];
        nivelesText = criterios.map((c, i) => `R${i + 1}:${formatLevelLocal(c.nivel)}`).join('  ');
      }
    }

    teacherRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: cellBorders, children: [para(String(idx + 1), { align: AlignmentType.CENTER, after: 2 })] }),
          new TableCell({ borders: cellBorders, children: [para(run(docente.nombre || docente.datosGeneralesCETPRO?.docenteNombre || 'Docente', { bold: true }), { after: 2 })] }),
          new TableCell({ borders: cellBorders, children: [para(docente.datosSesion?.moduloFormativo || docente.datosSesion?.areaCurricular || '—', { after: 2 })] }),
          new TableCell({ borders: cellBorders, children: [para(nivelesText, { align: AlignmentType.CENTER, after: 2 })] }),
          new TableCell({ borders: cellBorders, children: [para(docStatus, { after: 2 })] })
        ]
      })
    );
  });

  const docentesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: teacherRows
  });

  // 2. Conclusiones table (Section III)
  const conclusionRows = [
    new TableRow({
      children: ["Docente", "Nudo crítico", "Alternativa de solución propuesta"].map(h => 
        new TableCell({
          shading: { fill: C.grayBg },
          borders: cellBorders,
          children: [para([run(h, { bold: true, size: 8.5 })], { align: AlignmentType.CENTER, after: 2 })]
        })
      )
    })
  ];

  let hasConclusions = false;
  docentes.forEach((docente) => {
    const list = docente.compromisosMejora || [];
    list.forEach(c => {
      const nudo = (c.desempenoPorMejorar || '').trim();
      const alt = (c.compromisoMejora || '').trim();
      if (nudo || alt) {
        hasConclusions = true;
        conclusionRows.push(
          new TableRow({
            children: [
              new TableCell({ borders: cellBorders, children: [para(run(docente.nombre || 'Docente', { bold: true }), { after: 2 })] }),
              new TableCell({ borders: cellBorders, children: [para(nudo || '—', { after: 2 })] }),
              new TableCell({ borders: cellBorders, children: [para(alt || '—', { after: 2 })] })
            ]
          })
        );
      }
    });
  });

  if (!hasConclusions) {
    conclusionRows.push(
      new TableRow({
        children: [
          new TableCell({ borders: cellBorders, children: [para("—", { after: 2 })] }),
          new TableCell({ borders: cellBorders, children: [para("No se registraron nudos críticos.", { after: 2 })] }),
          new TableCell({ borders: cellBorders, children: [para("No se registraron alternativas.", { after: 2 })] })
        ]
      })
    );
  }

  const conclusionesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: conclusionRows
  });

  // 3. Detailed teachers block (2.6)
  const detailedTeachersBlocks = [];
  docentes.forEach((docente, idx) => {
    const checkDocs = docente.documentosPedagogicos || {};
    const presentedText = programa === 'ETP'
      ? `El(la) docente ${docente.nombre} contó con la siguiente documentación pedagógica: Plan de estudios (${checkDocs.planEstudios ? 'Sí' : 'No'}), Unidad didáctica (${checkDocs.unidadDidactica ? 'Sí' : 'No'}), Sesión de aprendizaje (${checkDocs.sesionAprendizaje ? 'Sí' : 'No'}) y Sílabo para el estudiante sellado por Dirección (${checkDocs.silabo ? 'Sí' : 'No'}).`
      : `El(la) docente ${docente.nombre} contó con la siguiente documentación pedagógica: Plan de estudios (${checkDocs.planEstudios ? 'Sí' : 'No'}), Unidad didáctica (${checkDocs.unidadDidactica ? 'Sí' : 'No'}) y Sesión de aprendizaje (${checkDocs.sesionAprendizaje ? 'Sí' : 'No'}).`;

    const area = docente.datosSesion?.moduloFormativo || docente.datosSesion?.areaCurricular || '—';
    const mat = docente.datosSesion?.matriculados ?? '—';
    const pres = docente.datosSesion?.presentes ?? '—';
    
    let nivelesText = '—';
    if (docente.ficha) {
      const formatLevelLocal = (lvl) => {
        if (lvl === 1) return 'I';
        if (lvl === 2) return 'II';
        if (lvl === 3) return 'III';
        if (lvl === 4) return 'IV';
        return '—';
      };
      if (programa === 'ETP') {
        const rubricas = docente.ficha.rubricasETP || [];
        nivelesText = rubricas.map((r, i) => `R${i + 1}:${formatLevelLocal(r.nivel)}`).join('  ');
      } else {
        const criterios = docente.ficha.instrumento1?.criterios || [];
        nivelesText = criterios.map((c, i) => `R${i + 1}:${formatLevelLocal(c.nivel)}`).join('  ');
      }
    }

    detailedTeachersBlocks.push(
      para([run(`2.6.${idx + 1} Docente: `, { bold: true }), run(docente.nombre, { bold: true })], { before: 8, after: 4 }),
      para([run(`a) Área / Módulo formativo: `, { bold: true }), run(area)], { before: 0, after: 2 }),
      para([run(`b) Matrícula y Asistencia: `, { bold: true }), run(`Estudiantes matriculados: ${mat}, asistentes: ${pres}.`)], { before: 0, after: 2 }),
      para([run(`c) Desempeño: `, { bold: true }), run(`Niveles de logro por rúbrica: `), run(nivelesText, { bold: true }), run(".")], { before: 0, after: 2 }),
      para([run(`d) Documentación Pedagógica: `, { bold: true }), run(presentedText)], { before: 0, after: 2 }),
      para([run(`e) Compromisos de Mejora: `, { bold: true }), run(docente.compromisosMejora?.map(c => `• ${c.desempenoPorMejorar || '(Sin descripción)'}: ${c.compromisoMejora || '(Sin compromiso)'}`).join('; ') || 'Ninguno.')], { before: 0, after: 6 })
    );
  });

  // Build the whole document structure
  const wordDoc = new Document({
    sections: [{
      properties: {
        titlePage: true, // separate first page headers
        page: {
          margin: {
            top: convertMillimetersToTwip(30),
            bottom: convertMillimetersToTwip(30),
            left: convertMillimetersToTwip(30),
            right: convertMillimetersToTwip(22.5)
          }
        }
      },
      headers: {
        default: docHeader,
        first: docHeader
      },
      footers: {
        default: createEsinadFooter(remitente?.cargo, qrDataURL),
        first: createEsinadFooter(remitente?.cargo, qrDataURL)
      },
      children: [
        // Slogan (first page only)
        para([run('"Año de la Esperanza y el Fortalecimiento de la Democracia"', { italic: true, size: 8, color: "505050" })], { align: AlignmentType.CENTER, before: 0, after: 12 }),

        // Title
        para([run(`INFORME N.° ${numero || '____'}-2026-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP`, { bold: true, size: 12 })], { align: AlignmentType.CENTER, before: 6, after: 12 }),

        // Header fields (A, DE, ASUNTO, REFERENCIA, FECHA)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [
            ["A", destinatario?.nombre, destinatario?.cargo],
            ["De", remitente?.nombre, remitente?.cargo],
            ["Asunto", `MONITOREO Y ACOMPAÑAMIENTO PEDAGÓGICO A LA INSTITUCIÓN EDUCATIVA ${institucionTipo} "${institucionNombre}"`],
            ["Referencia", "Plan de Trabajo AGEBATP 2026"],
            ["Fecha", fecha || `Lima, ${new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}`]
          ].map(([label, val, cargo]) => 
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  children: [para([run(label, { bold: true, size: 11 })], { after: 2 })]
                }),
                new TableCell({
                  width: { size: 3, type: WidthType.PERCENTAGE },
                  children: [para([run(":", { bold: true, size: 11 })], { after: 2 })]
                }),
                new TableCell({
                  width: { size: 82, type: WidthType.PERCENTAGE },
                  children: cargo 
                    ? [para([run(val, { bold: true, size: 11 }), run(`\n${cargo}`, { size: 10.5 })], { after: 4 })]
                    : [para([run(val, { size: 11 })], { after: 4 })]
                })
              ]
            })
          )
        }),

        // Divider Line
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lineGray },
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [new TableRow({ children: [new TableCell({ children: [para("", { after: 4 })] })] })]
        }),
        para("", { after: 12 }),

        // Body Apertura
        para([run(`Tengo a bien dirigirme a su despacho, para hacer de su conocimiento las acciones realizadas como especialista del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP) durante el mes de ${mes || 'junio'} del ${anio || '2026'}.`)], { after: 12 }),

        // I. ANTECEDENTES
        para([run("I. ANTECEDENTES", { bold: true, size: 11 })], { before: 12, after: 6 }),
        para([run("1.1 Resolución Ministerial N.° 501-2025-MINEDU, que aprueba las 'Normas y Orientaciones para el Desarrollo del Año Escolar 2026 en Instituciones Educativas y Programas Educativos de la Educación Básica'.")], { before: 0, after: 4 }),
        para([run("1.2 Resolución Directoral N.° 02034-2026-UGEL 03, que aprueba el Plan de Trabajo del Área de Gestión de la Educación Básica Alternativa y Técnico Productivo (AGEBATP) 2026.")], { before: 0, after: 12 }),

        // II. ANÁLISIS
        para([run("II. ANÁLISIS", { bold: true, size: 11 })], { before: 12, after: 6 }),
        para([run("2.1 Que, conforme a la META 070 (Gestión Pedagógica de EBA y CETPRO), se establece el monitoreo, supervisión y acompañamiento a los equipos directivos y docentes de las instituciones educativas a cargo.")], { before: 0, after: 4 }),
        para([run(`2.2 Que, dentro de las acciones de monitoreo y acompañamiento pedagógico, se aplicó la ficha de monitoreo a ${docentes.length} docente(s) de la institución educativa ${institucionTipo} "${institucionNombre}", conforme al siguiente detalle:`), { size: 10.5 }], { before: 0, after: 8 }),

        // Table of Docentes
        docentesTable,
        para("", { after: 12 }),

        // Detailed blocks per teacher
        ...detailedTeachersBlocks,
        para("", { after: 12 }),

        // Link evidences
        para([
          run("2.7 Que, se adjuntan las evidencias fotográficas y documentales de la visita en el siguiente enlace: "),
          run(linkEvidencias || "Evidencias OneDrive", { bold: true, color: "0563C1" })
        ], { before: 6, after: 12 }),

        // III. CONCLUSIONES
        para([run("III. CONCLUSIONES", { bold: true, size: 11 })], { before: 12, after: 6 }),
        para("Se detallan a continuación los nudos críticos identificados y las alternativas de solución concertadas con los docentes:"),
        conclusionesTable,
        para("", { after: 12 }),

        // IV. RECOMENDACIONES
        para([run("IV. RECOMENDACIONES", { bold: true, size: 11 })], { before: 12, after: 6 }),
        para([run("4.1 Remitir el presente informe a la jefatura para su trámite administrativo correspondiente, recomendando a la dirección de la IE implementar las alternativas de solución acordadas con los docentes.")], { before: 0, after: 16 }),

        // Signatures Atentamente
        para([run("Atentamente,")], { before: 12, after: 20 }),

        // Specialist Signature dots & lines
        para([run("................................................................", { size: 10.5 })], { align: AlignmentType.CENTER, after: 2 }),
        para([run(remitente?.nombre || "ESPECIALISTA MONITOR", { bold: true }), run(`\n${remitente?.cargo || "Especialista AGEBATP"}`)], { align: AlignmentType.CENTER, after: 16 }),

        // Conformity
        para([run("Con la conformidad del funcionario que suscribe remítase el presente Informe y su anexo a la Jefatura para su trámite correspondiente.", { italic: true, size: 10 })], { align: AlignmentType.JUSTIFY, before: 12, after: 24 }),

        // Jefa Signature dots & lines
        para([run("................................................................", { size: 10.5 })], { align: AlignmentType.CENTER, after: 2 }),
        para([run("ROSA ISABEL NINAMANGO BALDEÓN", { bold: true }), run("\nJefa del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP)")], { align: AlignmentType.CENTER, after: 0 })
      ]
    }]
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

/**
 * Generates and downloads the consolidated OFICIO Word (.docx) file.
 */
export async function generarOficioWord(oficioData, bannerDataURL, qrDataURL) {
  const {
    numero,
    destinatario,
    remitente,
    fecha,
    programa,
    institucionNombre,
    institucionTipo = "CEBA",
    docentes = [],
    cuerpo,
    esFelicitacion = false
  } = oficioData;

  const docType = (programa === 'ETP') ? 'ETP' : 'EBA';
  const filename = `Oficio_Monitoreo_${docType}_${(institucionNombre || 'Director').replace(/["']/g, '').replace(/[^a-zA-Z0-9_ -]/g, '_')}.docx`;

  const bannerBuffer = base64ToArrayBuffer(bannerDataURL);
  const headerBanner = bannerBuffer ? new ImageRun({
    data: bannerBuffer,
    transformation: { width: 446, height: 75 }
  }) : null;

  const docHeader = new Header({
    children: headerBanner ? [new Paragraph({ children: [headerBanner], alignment: AlignmentType.CENTER })] : []
  });

  // Calculate if it's recommendation or felicitation
  const asuntoText = esFelicitacion
    ? `FELICITACIÓN PEDAGÓGICA EN EL MARCO DEL MONITOREO Y ACOMPAÑAMIENTO AL ${institucionTipo} "${institucionNombre}".`
    : `RECOMENDACIÓN PEDAGÓGICA EN EL MARCO DEL MONITOREO Y ACOMPAÑAMIENTO AL ${institucionTipo} "${institucionNombre}".`;

  // Build the whole document structure
  const wordDoc = new Document({
    sections: [{
      properties: {
        titlePage: true,
        page: {
          margin: {
            top: convertMillimetersToTwip(30),
            bottom: convertMillimetersToTwip(30),
            left: convertMillimetersToTwip(30),
            right: convertMillimetersToTwip(22.5)
          }
        }
      },
      headers: {
        default: docHeader,
        first: docHeader
      },
      footers: {
        default: createEsinadFooter(remitente?.cargo, qrDataURL),
        first: createEsinadFooter(remitente?.cargo, qrDataURL)
      },
      children: [
        // Slogan (first page only)
        para([run('"Año de la Esperanza y el Fortalecimiento de la Democracia"', { italic: true, size: 8, color: "505050" })], { align: AlignmentType.CENTER, before: 0, after: 12 }),

        // Title
        para([run(`OFICIO N.° ${numero || '____'}-2026-MINEDU/VMGI-DRELM-UGEL03/DIR-AGEBATP`, { bold: true, size: 12 })], { align: AlignmentType.CENTER, before: 6, after: 12 }),

        // Header block: Señor(a) and Fecha on the same line
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [para([run("Señor(a):", { size: 10.5 })], { after: 0 })]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [para([run(fecha || `Lima, ${new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}`, { size: 10.5 })], { align: AlignmentType.RIGHT, after: 0 })]
                })
              ]
            })
          ]
        }),
        para("", { after: 2 }),

        // Destinatario block details
        para([run(destinatario?.nombre || "________________________________________", { bold: true })], { before: 2, after: 1 }),
        para([run(destinatario?.cargo || "Director(a)")], { before: 0, after: 1 }),
        para([run(`${institucionTipo} "${institucionNombre}"`)], { before: 0, after: 1 }),
        para([run("Presente.-", { bold: true })], { before: 0, after: 8 }),

        // ASUNTO & REFERENCIA
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [
            ["ASUNTO", asuntoText],
            ["REFERENCIA", "Plan de Trabajo AGEBATP 2026"]
          ].map(([label, val]) => 
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  children: [para([run(label, { bold: true, size: 11 })], { after: 2 })]
                }),
                new TableCell({
                  width: { size: 3, type: WidthType.PERCENTAGE },
                  children: [para([run(":", { bold: true, size: 11 })], { after: 2 })]
                }),
                new TableCell({
                  width: { size: 82, type: WidthType.PERCENTAGE },
                  children: [para([run(val, { size: 11 })], { after: 4 })]
                })
              ]
            })
          )
        }),

        // Divider Line
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.lineGray },
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [new TableRow({ children: [new TableCell({ children: [para("", { after: 4 })] })] })]
        }),
        para("", { after: 12 }),

        // Body content paragraphs
        ...(typeof cuerpo === 'string' ? cuerpo.split('\n') : cuerpo || []).map(p => 
          para([run(p.trim())], { after: 8 })
        ),

        // Despedida
        para([run("Hago propicia la ocasión para expresarle los sentimientos de mi especial consideración y estima.")], { before: 6, after: 16 }),

        // Atentamente
        para([run("Atentamente,")], { before: 12, after: 20 }),

        // Specialist signature dots & lines
        para([run("................................................................", { size: 10.5 })], { align: AlignmentType.CENTER, after: 2 }),
        para([run(remitente?.nombre || "ESPECIALISTA MONITOR", { bold: true }), run(`\n${remitente?.cargo || "Especialista AGEBATP"}`)], { align: AlignmentType.CENTER, after: 16 }),

        // Conformity
        para([run("Con la conformidad del funcionario que suscribe remítase el presente Oficio a la Jefatura para su trámite correspondiente.", { italic: true, size: 10 })], { align: AlignmentType.JUSTIFY, before: 12, after: 24 }),

        // Jefa Signature dots & lines
        para([run("................................................................", { size: 10.5 })], { align: AlignmentType.CENTER, after: 2 }),
        para([run("ROSA ISABEL NINAMANGO BALDEÓN", { bold: true }), run("\nJefa del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP)")], { align: AlignmentType.CENTER, after: 0 })
      ]
    }]
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
