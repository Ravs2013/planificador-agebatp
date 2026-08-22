import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { aplicarFuentesArial } from './membrete';
import { ANTECEDENTES_2026 } from '../data/antecedentes2026';

const M = { left: 25, right: 25, top: 20, bottom: 20, pageW: 210, pageH: 297 };
const CONTENT_W = M.pageW - M.left - M.right; // 160 mm

export function generarInformeDiaLogroPDF(informeData, bannerDataURL) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  aplicarFuentesArial(doc);

  let yCursor = M.top;

  // Banner Membrete
  if (bannerDataURL) {
    try {
      doc.addImage(bannerDataURL, 'JPEG', M.left, yCursor, CONTENT_W, 14);
      yCursor += 18;
    } catch (e) {
      console.error("Error drawing banner:", e);
      yCursor += 5;
    }
  }

  // Título del Informe
  doc.setFont("Arial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(12, 25, 41);
  const programa = informeData.programa || 'EBA';
  const tituloHeader = programa === 'ETP'
    ? `INFORME N° ${informeData.numeroInforme || '___'}-2026-UGEL.03/AGEBATP/EETP`
    : `INFORME N° ${informeData.numeroInforme || '___'}-2026-UGEL.03/AGEBATP/EEBA`;
  doc.text(tituloHeader, M.pageW / 2, yCursor, { align: 'center' });
  yCursor += 8;

  // Encabezado de Autoridades (A, DE, ASUNTO, FECHA)
  const esp = informeData.especialista || {};
  const jefatura = informeData.jefatura || { nombre: 'JEFATURA DE AGEBATP', cargo: 'Jefe del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva' };

  autoTable(doc, {
    startY: yCursor,
    margin: { left: M.left, right: M.right },
    tableWidth: CONTENT_W,
    styles: { font: "Arial", fontSize: 9, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: 24, fontStyle: 'bold' }, 1: { cellWidth: CONTENT_W - 24 } },
    body: [
      [{ content: "A:" }, { content: `${jefatura.nombre}\n${jefatura.cargo}` }],
      [{ content: "DE:" }, { content: `${esp.nombre || 'Especialista AGEBATP'}\nEspecialista en Educación AGEBATP - UGEL 03` }],
      [{ content: "ASUNTO:" }, { content: informeData.asunto || `INFORME DE MONITOREO Y ACOMPAÑAMIENTO AL ${programa === 'ETP' ? 'DÍA DEL EMPRENDIMIENTO / FERIA DE EMPRENDIMIENTO' : 'PRIMER DÍA DEL LOGRO'} 2026` }],
      [{ content: "REF.:" }, { content: informeData.referencia || "Plan de Trabajo del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva 2026" }],
      [{ content: "FECHA:" }, { content: informeData.fecha || new Date().toLocaleDateString('es-PE') }]
    ]
  });

  yCursor = doc.lastAutoTable.finalY + 8;

  // I. ANTECEDENTES
  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("I. ANTECEDENTES", M.left, yCursor);
  yCursor += 5;

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  const antecedentes = informeData.antecedentes && informeData.antecedentes.length > 0
    ? informeData.antecedentes
    : ANTECEDENTES_2026;

  antecedentes.forEach(parrafo => {
    const lines = doc.splitTextToSize(parrafo, CONTENT_W);
    if (yCursor + (lines.length * 4) > M.pageH - M.bottom) {
      doc.addPage();
      yCursor = M.top;
    }
    doc.text(lines, M.left, yCursor, { align: 'justify', maxWidth: CONTENT_W });
    yCursor += (lines.length * 4) + 2.5;
  });

  yCursor += 4;

  // II. ANÁLISIS Y DESARROLLO DEL EVENTO
  if (yCursor + 20 > M.pageH - M.bottom) {
    doc.addPage();
    yCursor = M.top;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("II. ANÁLISIS DEL MONITOREO REALIZADO", M.left, yCursor);
  yCursor += 5;

  const analisisTextos = informeData.analisis || [
    `En el marco del Plan Anual de Monitoreo y Acompañamiento 2026 de la UGEL 03, se llevó a cabo el monitoreo del ${programa === 'ETP' ? 'Día del Emprendimiento (Feria de Emprendimiento CETPRO)' : 'Primer Día del Logro'}, evaluando los aspectos organizativos, pedagógicos, de creatividad y participación de la comunidad educativa.`
  ];

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  analisisTextos.forEach(p => {
    const lines = doc.splitTextToSize(p, CONTENT_W);
    if (yCursor + (lines.length * 4) > M.pageH - M.bottom) {
      doc.addPage();
      yCursor = M.top;
    }
    doc.text(lines, M.left, yCursor, { align: 'justify', maxWidth: CONTENT_W });
    yCursor += (lines.length * 4) + 2.5;
  });

  // Tabla Resumen de Fichas Monitoreadas
  const fichas = informeData.fichas || [];
  if (fichas.length > 0) {
    yCursor += 4;
    doc.setFont("Arial", "bold");
    doc.setFontSize(9.5);
    doc.text("Resumen de Instituciones Educativas y Fichas Monitoreadas:", M.left, yCursor);
    yCursor += 4;

    const tableHead = programa === 'ETP'
      ? [["IE / CETPRO", "Director(a)", "Fecha", "Organización", "Exposición", "Presentación", "Evaluadores", "Recursos", "Puntaje"]]
      : [["IE / CEBA", "Director(a)", "Fecha", "Pens. Reflexivo", "Creatividad/Tec.", "Colaboración", "CNEB", "Comunidad"]];

    const tableBody = fichas.map(f => {
      if (programa === 'ETP') {
        const dg = f.datosGeneralesCETPRO || {};
        const dir = f.datosDirector || {};
        const r = f.rubricas || [];
        let score = 0;
        r.forEach(x => { score += (Number(x.nivel) || 0); });
        return [
          dg.nombreCETPRO || f.nombreIE || '—',
          dir.nombres || f.directorNombre || '—',
          dg.fecha || f.fecha || '—',
          r[0]?.nivel ? `N${r[0].nivel}` : '—',
          r[1]?.nivel ? `N${r[1].nivel}` : '—',
          r[2]?.nivel ? `N${r[2].nivel}` : '—',
          r[3]?.nivel ? `N${r[3].nivel}` : '—',
          r[4]?.nivel ? `N${r[4].nivel}` : '—',
          `${score}/20`
        ];
      } else {
        const dg = f.datosGenerales || {};
        const inf = f.datosInformante || {};
        const c = f.criterios || [];
        return [
          dg.nombreCEBA || f.nombreIE || '—',
          inf.nombres || f.directorNombre || '—',
          dg.fecha || f.fecha || '—',
          c[0]?.nivel || '—',
          c[1]?.nivel || '—',
          c[2]?.nivel || '—',
          c[3]?.nivel || '—',
          c[4]?.nivel || '—'
        ];
      }
    });

    autoTable(doc, {
      startY: yCursor,
      margin: { left: M.left, right: M.right },
      tableWidth: CONTENT_W,
      styles: { font: "Arial", fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [18, 34, 64], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      body: tableBody
    });

    yCursor = doc.lastAutoTable.finalY + 6;
  }

  // III. CONCLUSIONES Y NUDOS CRÍTICOS
  if (yCursor + 20 > M.pageH - M.bottom) {
    doc.addPage();
    yCursor = M.top;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("III. CONCLUSIONES Y NUDOS CRÍTICOS", M.left, yCursor);
  yCursor += 5;

  const conclusiones = informeData.conclusiones || [
    "Las actividades desarrolladas permitieron visibilizar el avance de los aprendizajes y proyectos técnico-productivos.",
    "Se identificó la necesidad de continuar fortaleciendo la difusión institucional y el uso efectivo de recursos didácticos digitales."
  ];

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  conclusiones.forEach((c, idx) => {
    const text = `${idx + 1}. ${c}`;
    const lines = doc.splitTextToSize(text, CONTENT_W);
    if (yCursor + (lines.length * 4) > M.pageH - M.bottom) {
      doc.addPage();
      yCursor = M.top;
    }
    doc.text(lines, M.left, yCursor, { align: 'justify', maxWidth: CONTENT_W });
    yCursor += (lines.length * 4) + 2.5;
  });

  yCursor += 4;

  // IV. RECOMENDACIONES
  if (yCursor + 20 > M.pageH - M.bottom) {
    doc.addPage();
    yCursor = M.top;
  }

  doc.setFont("Arial", "bold");
  doc.setFontSize(10);
  doc.text("IV. RECOMENDACIONES", M.left, yCursor);
  yCursor += 5;

  const recomendaciones = informeData.recomendaciones || [
    "Promover capacitaciones continuas a los docentes sobre metodologías activas y proyectos de emprendimiento.",
    "Gestionar alianzas estratégicas para incorporar evaluadores externos en futuras exhibiciones y ferias."
  ];

  doc.setFont("Arial", "normal");
  doc.setFontSize(9);
  recomendaciones.forEach((r, idx) => {
    const text = `${idx + 1}. ${r}`;
    const lines = doc.splitTextToSize(text, CONTENT_W);
    if (yCursor + (lines.length * 4) > M.pageH - M.bottom) {
      doc.addPage();
      yCursor = M.top;
    }
    doc.text(lines, M.left, yCursor, { align: 'justify', maxWidth: CONTENT_W });
    yCursor += (lines.length * 4) + 2.5;
  });

  yCursor += 12;

  if (yCursor + 30 > M.pageH - M.bottom) {
    doc.addPage();
    yCursor = M.top + 20;
  }

  // Firma Especialista
  doc.saveGraphicsState();
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(M.pageW / 2 - 35, yCursor + 15, M.pageW / 2 + 35, yCursor + 15);
  doc.restoreGraphicsState();

  doc.setFont("Arial", "bold");
  doc.setFontSize(9);
  doc.text(esp.nombre || 'Especialista AGEBATP', M.pageW / 2, yCursor + 20, { align: 'center' });
  doc.setFont("Arial", "normal");
  doc.setFontSize(8);
  doc.text("Especialista en Educación AGEBATP - UGEL 03", M.pageW / 2, yCursor + 24, { align: 'center' });

  return doc;
}
