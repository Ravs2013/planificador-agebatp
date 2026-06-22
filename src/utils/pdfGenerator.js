/* ════════════════════════════════════════════════════════════════
   PDF Generator — Informes y Oficios de Monitoreo
   AGEBATP — UGEL 03
   
   Usa jspdf + html2canvas (ya instalados) para capturar
   contenedores HTML con gráficos recharts y exportar a PDF A4.
   ════════════════════════════════════════════════════════════════ */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captura un contenedor HTML y lo exporta como PDF A4 vertical
 * con paginación automática si excede una página.
 * 
 * @param {HTMLElement} container — El contenedor DOM a capturar
 * @param {string} filename — Nombre del archivo PDF
 * @param {object} options — Opciones adicionales
 * @returns {Promise<{ blob: Blob, base64: string }>}
 */
export async function exportContainerToPDF(container, filename = 'documento.pdf', options = {}) {
  const {
    scale = 2,
    backgroundColor = '#FFFFFF',
    margin = 15, // mm
    returnBlob = true,
  } = options;

  // Captura canvas
  const canvas = await html2canvas(container, {
    scale,
    backgroundColor,
    useCORS: true,
    allowTaint: false,
    logging: false,
    windowWidth: container.scrollWidth,
    windowHeight: container.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const usableWidth = pageWidth - (margin * 2);
  const usableHeight = pageHeight - (margin * 2);

  // Scale image to fit page width
  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;

  if (imgHeight <= usableHeight) {
    // Fits on single page
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
  } else {
    // Multi-page: slice image
    let y = 0;
    let page = 0;
    const totalPages = Math.ceil(imgHeight / usableHeight);
    
    while (y < imgHeight) {
      if (page > 0) pdf.addPage();
      
      // Calculate source region for this page
      const srcY = (y / imgHeight) * canvas.height;
      const srcH = Math.min((usableHeight / imgHeight) * canvas.height, canvas.height - srcY);
      const destH = Math.min(usableHeight, imgHeight - y);

      // Create a temporary canvas for this slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcH;
      const ctx = pageCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const pageImgData = pageCanvas.toDataURL('image/png');
      pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, destH);

      y += usableHeight;
      page++;
      
      // Safety limit
      if (page > 20) break;
    }
  }

  // Save locally
  pdf.save(filename);

  // Generate base64 for upload
  const base64 = pdf.output('datauristring').split(',')[1];
  const blob = pdf.output('blob');

  return { blob, base64 };
}

/**
 * Recalcula promedios de desempeño/planificación/general
 * a partir de niveles numéricos (misma fórmula que parseFichaMonitoreo.js)
 */
export function recalcularPromedios(ficha) {
  const desVals = Object.values(ficha.desempeno || {})
    .map(d => (typeof d === 'object' ? d.nivel : d))
    .filter(v => typeof v === 'number' && v >= 1 && v <= 4);

  const planIndicators = [
    ficha.planificacion?.planificacionAnual,
    ficha.planificacion?.situacionSignificativa,
    ficha.planificacion?.secuenciaMetodologica,
    ficha.planificacion?.metodologiaActiva,
    ficha.planificacion?.usoPedagogicoRecursos,
  ].filter(Boolean);

  const planVals = planIndicators
    .map(p => (typeof p === 'object' ? p.nivel : p))
    .filter(v => typeof v === 'number' && v >= 1 && v <= 4);

  const promedioDesempeno = desVals.length > 0
    ? parseFloat((desVals.reduce((s, v) => s + v, 0) / desVals.length).toFixed(2))
    : 0;

  const promedioPlanificacion = planVals.length > 0
    ? parseFloat((planVals.reduce((s, v) => s + v, 0) / planVals.length).toFixed(2))
    : 0;

  const allVals = [...desVals, ...planVals];
  const promedioGeneral = allVals.length > 0
    ? parseFloat((allVals.reduce((s, v) => s + v, 0) / allVals.length).toFixed(2))
    : 0;

  const rounded = Math.round(promedioGeneral);
  const labels = { 1: 'Nivel I', 2: 'Nivel II', 3: 'Nivel III', 4: 'Nivel IV' };
  const nivelGeneralLabel = labels[rounded] || 'Nivel I';

  return { promedioDesempeno, promedioPlanificacion, promedioGeneral, nivelGeneralLabel };
}
