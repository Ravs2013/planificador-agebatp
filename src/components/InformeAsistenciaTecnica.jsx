import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from './Icon';
import { generarInformeATPDF } from '../pdf/generarInformeATPDF';
import { loadImageDataURL } from '../pdf/membrete';
import bannerAgebatpUrl from '../assets/membrete/banner_agebatp.jpeg';
import { useAuth } from '../context/AuthContext';
import { getChatModel } from '../firebase/config';
import { ESPECIALISTAS_MONITOREO, JEFATURA_AGEBATP, monthNames } from '../data/constants';
import { addInformeMonitoreo, updateInformeMonitoreo } from '../firebase/db';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const C = {
  navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
  g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
  g100: "#F1F5F9", g50: "#F8FAFC",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF", blueBorder: "#DBEAFE",
  white: "#FFFFFF",
};

const CHART_COLORS = [C.green, C.blue, C.amber, C.red]; // 4=green, 3=blue, 2=amber, 1=red

async function generarInformeAT_IA(payload, onProgress) {
  const model = await getChatModel();
  const prompt = `Actúas como ESPECIALISTA SENIOR de Educación Técnico-Productiva (ETP) de la UGEL 03, experto en monitoreo, redacción y argumentación de informes de gestión pública. Redacta el contenido analítico del Informe de Asistencia Técnica en ESPAÑOL formal (Perú), con tildes y ñ correctas, sin anglicismos, sin emojis, y SIN inventar datos: usa EXCLUSIVAMENTE los indicadores del payload.

Payload de entrada:
- Especialista: ${payload.especialista.nombre} (${payload.especialista.cargo})
- Mes/Año: ${payload.mes} de ${payload.anio}
- Participantes: Total: ${payload.participantes.total} (${payload.participantes.directores} directores, ${payload.participantes.coordinadores} coordinadores)
- Dimensiones de la Encuesta: ${JSON.stringify(payload.dimensiones)}
- Detalle por Ítem (Preguntas P1-P12): ${JSON.stringify(payload.items)}
- Convocatorias: ${JSON.stringify(payload.convocatorias)}
- Comentarios de los Participantes: ${JSON.stringify(payload.comentarios)}

Para CADA figura, redacta la descripción y el análisis como PROSA CONTINUA (uno a tres párrafos), SIN iniciar con las palabras "Análisis", "Comentario" ni "Conclusión" ni ningún rótulo. El texto debe:
- Hacer referencia a la figura por su número ("Como se aprecia en la Figura N°X, ...").
- Describir lo que se observa con los porcentajes reales del payload (qué nivel predomina, cuánto suma la satisfacción, si hay valoraciones desfavorables y dónde).
- Cerrar con una breve valoración descriptiva (fortaleza u oportunidad), de forma corrida con conectores naturales y sin repetir párrafos entre figuras.

Figuras a analizar (debes generar una entrada para cada una de estas llaves en el objeto "graficas"):
1. "participacion_por_cargo" (Figura N°1)
2. "resultados_generales" (Figura N°2)
3. "contenidos" (Figura N°3)
4. "metodologia" (Figura N°4)
5. "facilitacion" (Figura N°5)
6. "logistica" (Figura N°6)
7. "comparativo_dimensiones" (Figura N°7)
8. "detalle_por_item" (Figura N°8)

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código, sin texto introductorio) con la siguiente estructura exacta:
{
  "asunto": "INFORME MENSUAL DE DESARROLLO Y EVALUACIÓN DE LA ASISTENCIA TÉCNICA DEL MES DE...",
  "referencia": "Plan de Trabajo AGEBATP 2026",
  "antecedentes": [
    "Párrafo 1 de antecedentes legales...",
    "Párrafo 2 de antecedentes legales..."
  ],
  "analisis": [
    "Párrafo 1 de análisis de la ejecución general (mencionar convocatorias y objetivos)...",
    "Párrafo 2 de análisis de la ejecución general..."
  ],
  "graficas": {
    "participacion_por_cargo": { "descripcion": "Como se aprecia en la Figura N°1, ..." },
    "resultados_generales": { "descripcion": "Como se aprecia en la Figura N°2, ..." },
    "contenidos": { "descripcion": "Como se aprecia en la Figura N°3, ..." },
    "metodologia": { "descripcion": "Como se aprecia en la Figura N°4, ..." },
    "facilitacion": { "descripcion": "Como se aprecia en la Figura N°5, ..." },
    "logistica": { "descripcion": "Como se aprecia en la Figura N°6, ..." },
    "comparativo_dimensiones": { "descripcion": "Como se aprecia en la Figura N°7, ..." },
    "detalle_por_item": { "descripcion": "Como se aprecia en la Figura N°8, ..." }
  },
  "sintesis_comentarios": "Síntesis cualitativa de comentarios abiertos y sugerencias...",
  "conclusiones": [
    "Conclusión de la dimensión Contenidos...",
    "Conclusión de la dimensión Metodología...",
    "Conclusión de la dimensión Facilitación...",
    "Conclusión de la dimensión Logística...",
    "Conclusión integradora final..."
  ],
  "recomendaciones": [
    "Recomendación 1...",
    "Recomendación 2...",
    "Recomendación 3..."
  ]
}
Redacta íntegramente en español formal peruano; no uses palabras en inglés. No repitas los mismos párrafos para distintas figuras. Tono tipo tesis académica.`;

  if (onProgress) onProgress("Iniciando generación con Gemini...", 10);
  const resultStream = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  let text = '';
  for await (const chunk of resultStream.stream) {
    const chunkText = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || '');
    text += chunkText;
    if (onProgress) {
      const progressPercent = Math.min(90, 10 + Math.floor(text.length / 40));
      onProgress(`Recibiendo contenido (${text.length} caracteres)...`, progressPercent);
    }
  }

  if (onProgress) onProgress("Estructurando informe...", 95);
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanedText);
  if (onProgress) onProgress("Informe completado.", 100);
  return parsed;
}

function ProgresoIA({ porcentaje, estado, detail }) {
  return (
    <div style={{ margin: "16px 0", padding: "16px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#1B3A5C" }}>
        <span>{estado}</span>
        <span>{porcentaje}%</span>
      </div>
      <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${porcentaje}%`, height: "100%", background: "#2563A0", transition: "width 0.3s ease" }} />
      </div>
      {detail && <div style={{ marginTop: 6, fontSize: 11, color: "#64748B" }}>{detail}</div>}
    </div>
  );
}


export default function InformeAsistenciaTecnica({ onClose, onSaved, initialData = null }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialData?.paso || 1);
  const [saving, setSaving] = useState(false);
  const [informeId, setInformeId] = useState(initialData?.id || null);
  const [toast, setToast] = useState(null);

  // References for HTML2Canvas
  const chartRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const hiddenChartRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  // ── Paso 1: Configuración ──
  const [especialistaId, setEspecialistaId] = useState(initialData?.especialistaId || '');
  const [informeNumero, setInformeNumero] = useState(initialData?.informe?.numero || '');
  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().split('T')[0]);
  const [linkEvidencias, setLinkEvidencias] = useState(initialData?.links?.evidenciasOnedrive || '');
  
  // Convocatorias table
  const [convocatorias, setConvocatorias] = useState(initialData?.convocatorias || [
    { oficio: "Oficio Múltiple N.° 0012-2026-UGEL03", fecha: "2026-06-10", tematica: "Asistencia Técnica en Planificación Curricular y Gestión CETPRO" }
  ]);
  const [newOficio, setNewOficio] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [newTematica, setNewTematica] = useState("");

  // ── Paso 2: Parsing Excel ──
  const [excelData, setExcelData] = useState(initialData?.excelData || null);
  const [stats, setStats] = useState(initialData?.stats || null);
  const [comentarios, setComentarios] = useState(initialData?.comentarios || []);
  const [isParsing, setIsParsing] = useState(false);

  // ── Paso 3: Informe editable ──
  const [informeData, setInformeData] = useState(initialData?.informe || null);
  const [informeLoading, setInformeLoading] = useState(false);
  const [informeProgress, setInformeProgress] = useState({ percent: 0, status: "" });
  const [exportProgress, setExportProgress] = useState(null);

  const [bannerDataURL, setBannerDataURL] = useState(null);

  const especialistaSeleccionado = ESPECIALISTAS_MONITOREO.find(e => e.id === especialistaId);

  useEffect(() => {
    loadImageDataURL(bannerAgebatpUrl).then(url => {
      setBannerDataURL(url);
    });
  }, []);

  const handleAddConvocatoria = () => {
    if (!newOficio || !newFecha || !newTematica) {
      showToast("Rellene todos los campos de la convocatoria.", "error");
      return;
    }
    setConvocatorias([...convocatorias, { oficio: newOficio, fecha: newFecha, tematica: newTematica }]);
    setNewOficio("");
    setNewFecha("");
    setNewTematica("");
  };

  const handleRemoveConvocatoria = (idx) => {
    setConvocatorias(convocatorias.filter((_, i) => i !== idx));
  };

  const parseExcelSurvey = (file) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          showToast("El archivo Excel está vacío.", "error");
          setIsParsing(false);
          return;
        }

        // Process columns
        const firstRow = rows[0];
        const headers = Object.keys(firstRow);
        
        // Find Date column
        const dateCol = headers.find(h => h.toUpperCase().includes("DATOS GENERALES"));
        // Find Cargo column
        const cargoCol = headers.find(h => h.toUpperCase().includes("CARGO"));
        // Find Comment column
        const commentCol = headers.find(h => h.toUpperCase().includes("COMENTARIO") || h.toUpperCase().includes("SUGERENCIA"));

        // Find satisfaction questions
        const qCols = headers.filter(h => 
          h.toUpperCase().startsWith("DESARROLLO DE LA ACTIVIDAD") && 
          !h.toUpperCase().includes("PUNTOS:") && 
          !h.toUpperCase().includes("COMENTARIOS:")
        );

        if (qCols.length < 12) {
          showToast(`Se identificaron ${qCols.length} preguntas de satisfacción (se esperaban 12). Se continuará con las encontradas.`, "warning");
        }

        // Extract dates and roles
        const dates = [];
        const roles = {};
        const commentsList = [];
        
        // 4 scales
        const initialCounts = () => ({ 4: 0, 3: 0, 2: 0, 1: 0, total: 0 });
        const dimCounts = {
          contenidos: initialCounts(),
          metodologia: initialCounts(),
          facilitacion: initialCounts(),
          logistica: initialCounts(),
          general: initialCounts()
        };
        const itemCounts = Array.from({ length: 12 }, () => initialCounts());

        const mapValue = (val) => {
          if (val === undefined || val === null) return null;
          const str = String(val).toLowerCase().trim();
          if (str.includes("totalmente de acuerdo") || str === "4" || str.startsWith("4")) return 4;
          if (str.includes("de acuerdo") || str === "3" || str.startsWith("3")) return 3;
          if (str.includes("en desacuerdo") || str === "2" || str.startsWith("2")) return 2;
          if (str.includes("totalmente en desacuerdo") || str === "1" || str.startsWith("1")) return 1;
          return null;
        };

        rows.forEach((row) => {
          // Date
          if (dateCol && row[dateCol]) {
            dates.push(String(row[dateCol]).trim());
          }
          // Cargo
          if (cargoCol && row[cargoCol]) {
            const c = String(row[cargoCol]).trim();
            roles[c] = (roles[c] || 0) + 1;
          }
          // Comment
          if (commentCol && row[commentCol]) {
            const val = String(row[commentCol]).trim();
            if (val && val.length > 3) commentsList.push(val);
          }

          // Process questions
          qCols.forEach((qCol, idx) => {
            const val = mapValue(row[qCol]);
            if (val !== null) {
              // General count
              dimCounts.general[val]++;
              dimCounts.general.total++;

              // Items count
              if (idx < 12) {
                itemCounts[idx][val]++;
                itemCounts[idx].total++;
              }

              // Dimensions grouping
              if (idx < 4) { // P1-P4
                dimCounts.contenidos[val]++;
                dimCounts.contenidos.total++;
              } else if (idx < 7) { // P5-P7
                dimCounts.metodologia[val]++;
                dimCounts.metodologia.total++;
              } else if (idx < 10) { // P8-P10
                dimCounts.facilitacion[val]++;
                dimCounts.facilitacion.total++;
              } else { // P11-P12
                dimCounts.logistica[val]++;
                dimCounts.logistica.total++;
              }
            }
          });
        });

        // Determine most frequent date
        let freqDate = fecha;
        if (dates.length > 0) {
          const freqs = {};
          dates.forEach(d => freqs[d] = (freqs[d] || 0) + 1);
          const rawFreq = Object.keys(freqs).reduce((a, b) => freqs[a] > freqs[b] ? a : b);
          
          if (rawFreq && rawFreq.includes('/')) {
            const parts = rawFreq.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                // DD/MM/YYYY to YYYY-MM-DD
                freqDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else if (parts[0].length === 4) {
                // YYYY/MM/DD to YYYY-MM-DD
                freqDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else {
                freqDate = rawFreq;
              }
            } else {
              freqDate = rawFreq;
            }
          } else {
            freqDate = rawFreq;
          }
        }

        // Calculate percentages
        const calculatePct = (counts) => {
          if (counts.total === 0) return { 4: 0, 3: 0, 2: 0, 1: 0 };
          return {
            4: parseFloat(((counts[4] / counts.total) * 100).toFixed(1)),
            3: parseFloat(((counts[3] / counts.total) * 100).toFixed(1)),
            2: parseFloat(((counts[2] / counts.total) * 100).toFixed(1)),
            1: parseFloat(((counts[1] / counts.total) * 100).toFixed(1))
          };
        };

        const itemsStats = qCols.slice(0, 12).map((qCol, idx) => {
          const counts = itemCounts[idx];
          const total = counts.total;
          const pct4 = total > 0 ? parseFloat(((counts[4] / total) * 100).toFixed(1)) : 0;
          const pct3 = total > 0 ? parseFloat(((counts[3] / total) * 100).toFixed(1)) : 0;
          const pct2 = total > 0 ? parseFloat(((counts[2] / total) * 100).toFixed(1)) : 0;
          const pct1 = total > 0 ? parseFloat(((counts[1] / total) * 100).toFixed(1)) : 0;
          
          const text = qCol
            .replace(/^DESARROLLO DE LA ACTIVIDAD\s*(?:-\s*)?/i, '')
            .replace(/^\d+[\.\s\-]+\??/i, '')
            .replace(/\?$/, '')
            .trim();

          return {
            codigo: `P${idx + 1}`,
            texto: text,
            totalmente: pct4,
            de_acuerdo: pct3,
            en_desacuerdo: pct2,
            totalmente_en_desacuerdo: pct1,
            satisfaccion: parseFloat((pct4 + pct3).toFixed(1))
          };
        });

        const finalStats = {
          totalEncuestados: rows.length,
          fechaFrecuente: freqDate,
          roles,
          dimensiones: {
            contenidos: calculatePct(dimCounts.contenidos),
            metodologia: calculatePct(dimCounts.metodologia),
            facilitacion: calculatePct(dimCounts.facilitacion),
            logistica: calculatePct(dimCounts.logistica),
            general: calculatePct(dimCounts.general)
          },
          items: itemsStats
        };

        setStats(finalStats);
        setComentarios(commentsList);
        setExcelData(true);
        if (freqDate) setFecha(freqDate);
        showToast(`Excel procesado con éxito. ${rows.length} encuestados cargados.`);
        setStep(2);
      } catch (err) {
        console.error(err);
        showToast(`Error al parsear Excel: ${err.message}`, "error");
      }
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerarInforme = async () => {
    if (!stats) return;
    setInformeLoading(true);
    setInformeProgress({ percent: 10, status: "Rellenando indicadores y bases legales..." });
    try {
      let dirCount = 0;
      let coordCount = 0;
      if (stats.roles) {
        Object.entries(stats.roles).forEach(([role, count]) => {
          if (/director/i.test(role)) dirCount += count;
          else if (/coordinador/i.test(role)) coordCount += count;
        });
      }

      const payload = {
        especialista: { nombre: especialistaSeleccionado.nombre, cargo: especialistaSeleccionado.cargo },
        mes: monthNames[new Date(fecha).getMonth()],
        anio: new Date(fecha).getFullYear(),
        participantes: {
          total: stats.totalEncuestados,
          directores: dirCount,
          coordinadores: coordCount
        },
        dimensiones: {
          resultados_generales: {
            totalmente: stats.dimensiones.general[4],
            de_acuerdo: stats.dimensiones.general[3],
            en_desacuerdo: stats.dimensiones.general[2],
            totalmente_en_desacuerdo: stats.dimensiones.general[1],
            satisfaccion: parseFloat((stats.dimensiones.general[4] + stats.dimensiones.general[3]).toFixed(1))
          },
          contenidos: {
            totalmente: stats.dimensiones.contenidos[4],
            de_acuerdo: stats.dimensiones.contenidos[3],
            en_desacuerdo: stats.dimensiones.contenidos[2],
            totalmente_en_desacuerdo: stats.dimensiones.contenidos[1],
            satisfaccion: parseFloat((stats.dimensiones.contenidos[4] + stats.dimensiones.contenidos[3]).toFixed(1))
          },
          metodologia: {
            totalmente: stats.dimensiones.metodologia[4],
            de_acuerdo: stats.dimensiones.metodologia[3],
            en_desacuerdo: stats.dimensiones.metodologia[2],
            totalmente_en_desacuerdo: stats.dimensiones.metodologia[1],
            satisfaccion: parseFloat((stats.dimensiones.metodologia[4] + stats.dimensiones.metodologia[3]).toFixed(1))
          },
          facilitacion: {
            totalmente: stats.dimensiones.facilitacion[4],
            de_acuerdo: stats.dimensiones.facilitacion[3],
            en_desacuerdo: stats.dimensiones.facilitacion[2],
            totalmente_en_desacuerdo: stats.dimensiones.facilitacion[1],
            satisfaccion: parseFloat((stats.dimensiones.facilitacion[4] + stats.dimensiones.facilitacion[3]).toFixed(1))
          },
          logistica: {
            totalmente: stats.dimensiones.logistica[4],
            de_acuerdo: stats.dimensiones.logistica[3],
            en_desacuerdo: stats.dimensiones.logistica[2],
            totalmente_en_desacuerdo: stats.dimensiones.logistica[1],
            satisfaccion: parseFloat((stats.dimensiones.logistica[4] + stats.dimensiones.logistica[3]).toFixed(1))
          }
        },
        items: stats.items || [],
        convocatorias,
        comentarios: comentarios.slice(0, 10)
      };

      const data = await generarInformeAT_IA(payload, (status, percent) => {
        setInformeProgress({ percent, status });
      });

      // Construct parrafoResultadosSurvey
      const generalPct = stats.dimensiones.general;
      const descText = `Con respecto al desarrollo de la asistencia técnica del mes de ${monthNames[new Date(fecha).getMonth()].toLowerCase()}, en general, el ${generalPct[4]}% de los participantes manifiesta estar totalmente de acuerdo, el ${generalPct[3]}% está de acuerdo, y el ${generalPct[2]}% en desacuerdo con los contenidos brindados, la metodología de trabajo aplicada, la facilitación de los ponentes y la logística del evento.`;
      
      setInformeData({
        ...data,
        parrafoResultadosSurvey: descText
      });
      showToast("Informe de Asistencia Técnica redactado por Gemini.");
      setStep(3);
    } catch (err) {
      console.error(err);
      showToast(`Error al redactar: ${err.message}`, "error");
    }
    setInformeLoading(false);
  };

  const saveDraft = async (statusOverride = null) => {
    setSaving(true);
    try {
      const dataToSave = {
        tipoMonitoreo: 'asistencia_tecnica',
        programa: especialistaSeleccionado?.programa || 'ETP',
        tipo: 'asistencia_tecnica_mensual',
        especialistaId: especialistaSeleccionado?.id || '',
        especialistaNombre: especialistaSeleccionado?.nombre || '',
        especialistaCargo: especialistaSeleccionado?.cargo || '',
        jefaturaNombre: JEFATURA_AGEBATP.nombre,
        jefaturaCargo: JEFATURA_AGEBATP.cargo,
        institucionTipo: 'UGEL 03',
        institucionNombre: 'AGEBATP',
        fecha,
        convocatorias,
        stats,
        comentarios,
        informe: informeData || null,
        links: { evidenciasOnedrive: linkEvidencias || '' },
        estado: statusOverride || (initialData?.estado === 'finalizado' ? 'finalizado' : (informeData ? 'generado' : 'borrador')),
        creadoPor: user?.uid || '',
        paso: step,
        updatedAt: new Date().toISOString()
      };

      if (informeId) {
        await updateInformeMonitoreo(informeId, dataToSave);
      } else {
        const newId = await addInformeMonitoreo(dataToSave);
        setInformeId(newId);
      }
    } catch (err) {
      console.error('Error al guardar borrador:', err);
    }
    setSaving(false);
  };

  useEffect(() => {
    if (step > 1 && especialistaSeleccionado) {
      saveDraft();
    }
  }, [step]);

  const handleExportPDF = async () => {
    if (!informeData) return;
    try {
      setExportProgress("Iniciando captura de gráficos...");
      
      const chartImages = [];
      for (let i = 0; i < 8; i++) {
        const ref = hiddenChartRefs[i];
        if (ref && ref.current) {
          try {
            setExportProgress(`Capturando y renderizando gráfico N°${i + 1} de 8...`);
            const canvas = await Promise.race([
              html2canvas(ref.current, { scale: 3, backgroundColor: "#ffffff", useCORS: true, logging: false, allowTaint: true }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
            ]);
            chartImages.push({
              dataUrl: canvas.toDataURL('image/png'),
              width: canvas.width,
              height: canvas.height
            });
          } catch (chartErr) {
            console.error(`Error al capturar el gráfico ${i}:`, chartErr);
            chartImages.push(null); // Preserve array index/count
          }
        } else {
          chartImages.push(null);
        }
      }

      setExportProgress("Procesando información e incrustando tipografía Arial MT...");
      const dateVal = new Date(fecha);
      const isInvalid = isNaN(dateVal.getTime());

      const payload = {
        numero: informeNumero,
        destinatario: { nombre: JEFATURA_AGEBATP.nombre, cargo: JEFATURA_AGEBATP.cargo },
        remitente: { 
          nombre: especialistaSeleccionado?.nombre || initialData?.especialistaNombre || 'ESPECIALISTA MONITOR', 
          cargo: especialistaSeleccionado?.cargo || initialData?.especialistaCargo || 'Especialista de Educación Básica Alternativa' 
        },
        fecha: !isInvalid ? dateVal.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : String(fecha),
        mes: !isInvalid ? monthNames[dateVal.getMonth()].toLowerCase() : monthNames[new Date().getMonth()].toLowerCase(),
        anio: !isInvalid ? dateVal.getFullYear().toString() : new Date().getFullYear().toString(),
        asunto: informeData.asunto,
        referencia: informeData.referencia,
        antecedentes: informeData.antecedentes,
        analisisBoilerplate: informeData.analisisBoilerplate || null,
        tablaConvocatorias: convocatorias,
        parrafoResultadosSurvey: informeData.parrafoResultadosSurvey,
        conclusiones: informeData.conclusiones,
        recomendaciones: informeData.recomendaciones,
        linkEvidencias: linkEvidencias ? { texto: "Evidencias Asistencia Técnica", url: linkEvidencias } : null
      };

      setExportProgress("Generando archivo PDF y guardando metadatos...");
      generarInformeATPDF(payload, bannerDataURL, null, chartImages);
      showToast("Reporte AT compilado y descargado.");
    } catch (err) {
      console.error(err);
      showToast(`Error al exportar PDF: ${err.message}`, "error");
    } finally {
      setExportProgress(null);
    }
  };

  const handleFinalizar = async () => {
    await saveDraft('finalizado');
    showToast('Monitoreo AT finalizado y guardado exitosamente.');
    if (onSaved) onSaved();
    onClose();
  };

  const getPieData = (dimKey) => {
    if (!stats?.dimensiones?.[dimKey]) return [];
    const dim = stats.dimensiones[dimKey];
    return [
      { name: "Totalmente de acuerdo", value: dim[4] },
      { name: "De acuerdo", value: dim[3] },
      { name: "En desacuerdo", value: dim[2] },
      { name: "Totalmente en desacuerdo", value: dim[1] }
    ].filter(d => d.value > 0);
  };

  const getCargoPieData = () => {
    if (!stats?.roles) return [];
    return Object.entries(stats.roles).map(([name, value]) => ({ name, value }));
  };

  const barChartData = useMemo(() => {
    if (!stats?.dimensiones) return [];
    return [
      { name: "Contenidos", pct: stats.dimensiones.contenidos[4] },
      { name: "Metodología", pct: stats.dimensiones.metodologia[4] },
      { name: "Facilitación", pct: stats.dimensiones.facilitacion[4] },
      { name: "Logística", pct: stats.dimensiones.logistica[4] }
    ];
  }, [stats]);

  const itemsChartData = useMemo(() => {
    if (!stats?.items) return [];
    return stats.items.map(item => ({
      name: item.codigo,
      satisfaccion: item.satisfaccion,
      texto: item.texto
    }));
  }, [stats]);

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g200}`, background: C.white, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
    btn: (bg, color, border) => ({ padding: "10px 20px", borderRadius: 8, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.15s" }),
    textarea: { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.g50, color: C.navy1, fontFamily: "'DM Sans'", fontSize: 12.5, minHeight: 180, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 },
    stepIndicator: (active, completed) => ({
      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: completed ? C.green : active ? C.blue : C.g200,
      color: completed || active ? C.white : C.g500,
      fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", transition: 'all 0.2s'
    }),
  };

  const STEPS = [
    { n: 1, label: 'Configuración y Convocatorias' },
    { n: 2, label: 'Cargar y Analizar Encuesta' },
    { n: 3, label: 'Previsualización Informe' }
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px", overflow: "auto" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "95vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: C.white, zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "'DM Serif Display',serif", color: C.navy1 }}>
              Nuevo Informe Mensual de Asistencia Técnica (AT)
            </h2>
            {saving && <span style={{ fontSize: 11, color: C.g400 }}>Guardando borrador...</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.g500, padding: 4, display: 'flex', alignItems: 'center' }}><Icon name="x" size={20} /></button>
        </div>

        {/* Stepper */}
        <div style={{ padding: "20px 28px", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={S.stepIndicator(step === s.n, step > s.n)}>
                {step > s.n ? <Icon name="check" size={14} color={C.white} /> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? C.navy1 : C.g500, fontFamily: "'DM Sans'" }}>{s.label}</span>
              {i < STEPS.length - 1 && <div style={{ width: 30, height: 2, background: step > s.n ? C.green : C.g200, borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "0 28px 28px" }}>
          
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>Paso 1 — Configuración y Convocatorias</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Especialista pedagógico / monitor *</label>
                  <select value={especialistaId} onChange={e => setEspecialistaId(e.target.value)} style={S.input}>
                    <option value="">Seleccione especialista...</option>
                    {ESPECIALISTAS_MONITOREO.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre} — {esp.cargo.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Fecha / Mes de la AT *</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={S.input} />
                </div>
              </div>

              {/* Convocatorias Table Input */}
              <div style={{ ...S.card, marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Oficios de Convocatoria del Mes</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: C.g100 }}>
                      <th style={{ padding: 6, border: `1px solid ${C.g200}`, textAlign: "left" }}>Oficio Múltiple</th>
                      <th style={{ padding: 6, border: `1px solid ${C.g200}`, textAlign: "center" }}>Fecha</th>
                      <th style={{ padding: 6, border: `1px solid ${C.g200}`, textAlign: "left" }}>Temática</th>
                      <th style={{ padding: 6, border: `1px solid ${C.g200}`, textAlign: "center" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convocatorias.map((c, i) => (
                      <tr key={i}>
                        <td style={{ padding: 6, border: `1px solid ${C.g200}` }}>{c.oficio}</td>
                        <td style={{ padding: 6, border: `1px solid ${C.g200}`, textAlign: "center" }}>{c.fecha}</td>
                        <td style={{ padding: 6, border: `1px solid ${C.g200}` }}>{c.tematica}</td>
                        <td style={{ padding: 6, border: `1px solid ${C.g200}`, textAlign: "center" }}>
                          <button onClick={() => handleRemoveConvocatoria(i)} style={{ color: C.red, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Convocatoria Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr auto", gap: 8, alignItems: "end" }}>
                  <div>
                    <label style={S.label}>Número de Oficio</label>
                    <input type="text" placeholder="Oficio Múltiple N.°..." value={newOficio} onChange={e => setNewOficio(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Fecha</label>
                    <input type="date" value={newFecha} onChange={e => setNewFecha(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Temática de Convocatoria</label>
                    <input type="text" placeholder="Temática dictada..." value={newTematica} onChange={e => setNewTematica(e.target.value)} style={S.input} />
                  </div>
                  <button onClick={handleAddConvocatoria} style={{ ...S.btn(C.blue, C.white), height: 36, padding: "0 14px" }}>+ Añadir</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>Paso 2 — Cargar Encuesta de Satisfacción</h3>
              
              <div style={{ border: `2px dashed ${C.blue}`, borderRadius: 10, padding: "40px 20px", textAlign: "center", background: `${C.blue}05`, cursor: isParsing ? "wait" : "pointer", marginBottom: 20 }}
                onClick={() => !isParsing && document.getElementById('excel-at-file-input')?.click()}>
                <Icon name="upload" size={32} color={C.blue} />
                <p style={{ color: C.g500, fontSize: "0.85rem", margin: "12px 0 4px" }}>
                  {isParsing ? "Procesando respuestas del Excel..." : "Subir archivo Excel exportado de Microsoft Forms"}
                </p>
                <input id="excel-at-file-input" type="file" accept=".xlsx,.xls" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) parseExcelSurvey(e.target.files[0]); }} />
              </div>

              {stats && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Results preview */}
                  <div style={S.card}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Indicadores de Satisfacción Calculados:</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                      {Object.entries(stats.dimensiones).map(([key, val]) => (
                        <div key={key} style={{ background: C.g50, borderRadius: 8, padding: 12, border: `1px solid ${C.g200}` }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: C.g500 }}>{key}</span>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy1, marginTop: 4 }}>
                            {val[4]}% <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>T.A.</span>
                          </div>
                          <div style={{ fontSize: 11, color: C.g500 }}>{val[3]}% Acuerdo | {val[2]}% Desacuerdo</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Show progress bar if loading */}
                  {informeLoading && (
                    <ProgresoIA porcentaje={informeProgress.percent} estado={informeProgress.status} />
                  )}

                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
                    <button onClick={handleGenerarInforme} disabled={informeLoading} style={S.btn(C.blue, C.white)}>
                      {informeLoading ? "Generando borrador..." : "Redactar Informe con Gemini"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 20 }}>Paso 3 — Previsualización y Edición del Informe AT</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={S.label}>Número de Documento (Correlativo)</label>
                  <input value={informeNumero} onChange={e => setInformeNumero(e.target.value)} style={S.input} placeholder="Ej: 0026" />
                </div>
                <div>
                  <label style={S.label}>Enlace OneDrive de Evidencias</label>
                  <input value={linkEvidencias} onChange={e => setLinkEvidencias(e.target.value)} style={S.input} placeholder="https://onedrive.live.com/..." />
                </div>
              </div>

              {informeData && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Previsualización del Informe AT</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={S.label}>Asunto</label>
                      <input value={informeData.asunto || ''} onChange={e => setInformeData({ ...informeData, asunto: e.target.value })} style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Antecedentes (párrafo consolidado)</label>
                      <textarea value={informeData.antecedentes?.join('\n') || ''} onChange={e => setInformeData({ ...informeData, antecedentes: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 120 }} />
                    </div>
                    
                    {/* Editable Descriptive Analysis for the 8 Figures */}
                    <div style={{ border: `1px solid ${C.g200}`, borderRadius: 10, padding: 14, background: C.g50, marginTop: 8, marginBottom: 8 }}>
                      <h5 style={{ fontSize: 12, fontWeight: 700, color: C.navy3, margin: "0 0 10px" }}>Descripción / Análisis Descriptivo por Figura (Estilo Tesis)</h5>
                      {(() => {
                        const graficasKeys = [
                          'participacion_por_cargo',
                          'resultados_generales',
                          'contenidos',
                          'metodologia',
                          'facilitacion',
                          'logistica',
                          'comparativo_dimensiones',
                          'detalle_por_item'
                        ];
                        const labels = [
                          "Figura N°1: Participación por cargo",
                          "Figura N°2: Resultados generales de la asistencia técnica",
                          "Figura N°3: Resultados de la dimensión Contenidos",
                          "Figura N°4: Resultados de la dimensión Metodología",
                          "Figura N°5: Resultados de la dimensión Facilitación",
                          "Figura N°6: Resultados de la dimensión Logística",
                          "Figura N°7: Comparativa de satisfacción por dimensión",
                          "Figura N°8: Detalle de satisfacción por ítem"
                        ];
                        return graficasKeys.map((key, idx) => (
                          <div key={key} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: C.navy2, marginBottom: 6 }}>{labels[idx]}</div>
                            <div>
                              <label style={{ ...S.label, textTransform: 'none', fontSize: 10, marginBottom: 2 }}>Análisis Descriptivo (Referenciar por su número: "Como se aprecia en la Figura N°...")</label>
                              <textarea 
                                value={informeData.graficas?.[key]?.descripcion || informeData.graficas?.[key]?.analisis || ''} 
                                onChange={e => {
                                  const updatedGraficas = { ...informeData.graficas };
                                  if (!updatedGraficas[key]) updatedGraficas[key] = {};
                                  updatedGraficas[key].descripcion = e.target.value;
                                  updatedGraficas[key].analisis = e.target.value;
                                  setInformeData({ ...informeData, graficas: updatedGraficas });
                                }} 
                                style={{ ...S.textarea, minHeight: 80, fontSize: 12, padding: "6px 10px" }} 
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <div>
                      <label style={S.label}>Síntesis Cualitativa de Comentarios Abiertos</label>
                      <textarea value={informeData.sintesis_comentarios || ''} onChange={e => setInformeData({ ...informeData, sintesis_comentarios: e.target.value })} style={{ ...S.textarea, minHeight: 80 }} />
                    </div>

                    <div>
                      <label style={S.label}>Análisis (párrafo de ejecución)</label>
                      <textarea value={informeData.analisis?.join('\n') || ''} onChange={e => setInformeData({ ...informeData, analisis: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 160 }} />
                    </div>
                    <div>
                      <label style={S.label}>Conclusiones</label>
                      <textarea value={informeData.conclusiones?.join('\n') || ''} onChange={e => setInformeData({ ...informeData, conclusiones: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 100 }} />
                    </div>
                    <div>
                      <label style={S.label}>Recomendaciones</label>
                      <textarea value={informeData.recomendaciones?.join('\n') || ''} onChange={e => setInformeData({ ...informeData, recomendaciones: e.target.value.split('\n') })} style={{ ...S.textarea, minHeight: 100 }} />
                    </div>
                    <button type="button" onClick={handleExportPDF} style={S.btn(C.green, C.white, C.green)}>
                      <Icon name="download" size={14} /> Descargar Informe de AT con Gráficas (PDF)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Charts container visible in both Step 2 and Step 3 */}
          {stats && (step === 2 || step === 3) && (
            <div style={{ marginTop: 24, borderTop: `1px solid ${C.g200}`, paddingTop: 20, marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>Gráficos de Satisfacción de la Encuesta</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                
                {/* 1. Gráfico N°01 - Participación por cargo */}
                <div ref={chartRefs[0]} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, textAlign: "center", width: 260, height: 190, margin: "0 auto" }}>
                  <h5 style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.navy3 }}>Gráfico N°01: Participación por cargo</h5>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getCargoPieData()} cx="50%" cy="50%" outerRadius={40} dataKey="value" nameKey="name" label={{ fontSize: 8 }} isAnimationActive={false}>
                          {getCargoPieData().map((entry, index) => {
                            const colors = [C.blue, C.green, C.amber, C.red];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2 to 6. Dimensiones & General */}
                {['general', 'contenidos', 'metodologia', 'facilitacion', 'logistica'].map((dim, idx) => {
                  const labels = {
                    general: "Gráfico N°02: Resultados Generales",
                    contenidos: "Gráfico N°03: Contenidos",
                    metodologia: "Gráfico N°04: Metodología",
                    facilitacion: "Gráfico N°05: Facilitación",
                    logistica: "Gráfico N°06: Logística"
                  };
                  return (
                    <div key={dim} ref={chartRefs[idx + 1]} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, textAlign: "center", width: 260, height: 190, margin: "0 auto" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.navy3 }}>{labels[dim]}</h5>
                      <div style={{ height: 120 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={getPieData(dim)} cx="50%" cy="50%" outerRadius={40} dataKey="value" nameKey="name" isAnimationActive={false}>
                              {getPieData(dim).map((entry, index) => {
                                const colors = {
                                  "Totalmente de acuerdo": C.green,
                                  "De acuerdo": C.blue,
                                  "En desacuerdo": C.amber,
                                  "Totalmente en desacuerdo": C.red
                                };
                                return <Cell key={`cell-${index}`} fill={colors[entry.name] || C.g500} />;
                              })}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ fontSize: 8, display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                        <span style={{ color: C.green }}>TA:{stats.dimensiones[dim][4]}%</span>
                        <span style={{ color: C.blue }}>A:{stats.dimensiones[dim][3]}%</span>
                        <span style={{ color: C.amber }}>D:{stats.dimensiones[dim][2]}%</span>
                      </div>
                    </div>
                  );
                })}

                {/* 7. Comparativo de Dimensiones */}
                <div ref={chartRefs[6]} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, textAlign: "center", width: 320, height: 210, gridColumn: "span 2", margin: "0 auto" }}>
                  <h5 style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.navy3 }}>Gráfico N°07: Comparativa de Dimensiones (% Totalmente de acuerdo)</h5>
                  <div style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={60} />
                        <Tooltip />
                        <Bar dataKey="pct" fill="#15803D" name="% T.A." isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 8. Detalle por Item */}
                <div ref={chartRefs[7]} style={{ background: C.white, border: `1px solid ${C.g200}`, borderRadius: 8, padding: 12, textAlign: "center", width: 420, height: 280, gridColumn: "span 2", margin: "0 auto" }}>
                  <h5 style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.navy3 }}>Gráfico N°08: Detalle de Satisfacción por Ítem (TA + A)</h5>
                  <div style={{ height: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={itemsChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={30} />
                        <Tooltip formatter={(value, name, props) => [`${value}%`, `Satisfacción (4+3) - ${props.payload.texto}`]} />
                        <Bar dataKey="satisfaccion" fill="#2563A0" name="% Satisfacción" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* High-Resolution Off-screen Charts for PDF Capture */}
          {stats && (
            <div style={{ position: "absolute", left: "-10000px", top: 0, width: "1000px", background: C.white }}>
              
              {/* 1. Participación por cargo (Torta) */}
              <div ref={hiddenChartRefs[0]} style={{ width: 360, height: 360, background: C.white, padding: 20 }}>
                <h5 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: C.navy3, textAlign: "center" }}>Figura N°1. Participación por cargo de los asistentes.</h5>
                <div style={{ width: 320, height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={getCargoPieData()} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={{ fontSize: 10 }} isAnimationActive={false}>
                        {getCargoPieData().map((entry, index) => {
                          const colors = [C.blue, C.green, C.amber, C.red];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2 to 6. Dimensiones (Tortas) */}
              {['general', 'contenidos', 'metodologia', 'facilitacion', 'logistica'].map((dim, idx) => {
                const labels = {
                  general: "Figura N°2. Resultados generales de la asistencia técnica.",
                  contenidos: "Figura N°3. Resultados de la dimensión Contenidos.",
                  metodologia: "Figura N°4. Resultados de la dimensión Metodología.",
                  facilitacion: "Figura N°5. Resultados de la dimensión Facilitación.",
                  logistica: "Figura N°6. Resultados de la dimensión Logística."
                };
                return (
                  <div key={dim} ref={hiddenChartRefs[idx + 1]} style={{ width: 360, height: 360, background: C.white, padding: 20 }}>
                    <h5 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: C.navy3, textAlign: "center" }}>{labels[dim]}</h5>
                    <div style={{ width: 320, height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={getPieData(dim)} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={{ fontSize: 10 }} isAnimationActive={false}>
                            {getPieData(dim).map((entry, index) => {
                              const colors = {
                                "Totalmente de acuerdo": C.green,
                                "De acuerdo": C.blue,
                                "En desacuerdo": C.amber,
                                "Totalmente en desacuerdo": C.red
                              };
                              return <Cell key={`cell-${index}`} fill={colors[entry.name] || C.g500} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}

              {/* 7. Comparativo de Dimensiones (Barras Horizontales) */}
              <div ref={hiddenChartRefs[6]} style={{ width: 720, height: 460, background: C.white, padding: 30 }}>
                <h5 style={{ margin: "0 0 15px", fontSize: 16, fontWeight: 700, color: C.navy3, textAlign: "center" }}>Figura N°7. Comparativa de satisfacción por dimensión.</h5>
                <div style={{ width: 660, height: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="pct" fill="#15803D" name="% T.A." isAnimationActive={false}>
                        <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: '#333', fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 8. Detalle por Item (Barras Horizontales) */}
              <div ref={hiddenChartRefs[7]} style={{ width: 720, height: 520, background: C.white, padding: 30 }}>
                <h5 style={{ margin: "0 0 15px", fontSize: 16, fontWeight: 700, color: C.navy3, textAlign: "center" }}>Figura N°8. Satisfacción por ítem.</h5>
                <div style={{ width: 660, height: 440 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemsChartData} layout="vertical" margin={{ top: 10, right: 40, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={40} />
                      <Tooltip formatter={(value, name, props) => [`${value}%`, `Satisfacción - ${props.payload.texto}`]} />
                      <Bar dataKey="satisfaccion" fill="#2563A0" name="% Satisfacción" isAnimationActive={false}>
                        <LabelList dataKey="satisfaccion" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#333', fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{ padding: "20px 28px", borderTop: `1px solid ${C.g200}`, display: "flex", justifyContent: "space-between", alignItems: "center", sticky: "bottom", background: C.white }}>
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1} 
            style={S.btn(C.white, step === 1 ? C.g300 : C.blue, step === 1 ? C.g200 : C.blue)}
          >
            Atrás
          </button>
          
          {step < STEPS.length ? (
            <button 
              onClick={() => { saveDraft(); setStep(step + 1); }} 
              disabled={step === 1 ? !especialistaSeleccionado : !excelData} 
              style={{ ...S.btn((step === 1 ? especialistaSeleccionado : excelData) ? C.blue : C.g200, (step === 1 ? especialistaSeleccionado : excelData) ? C.white : C.g500, (step === 1 ? especialistaSeleccionado : excelData) ? C.blue : C.g200) }}
            >
              Siguiente
            </button>
          ) : (
            <button 
              onClick={handleFinalizar} 
              style={S.btn(C.green, C.white, C.green)}
            >
              Finalizar y Guardar
            </button>
          )}
        </div>
      </div>
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: toast.type === 'error' ? C.red : toast.type === 'info' ? C.blue : C.green,
          color: C.white,
          padding: "12px 20px",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 9999,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans'"
        }}>
          {toast.msg}
        </div>
      )}

      {exportProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(12, 25, 41, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: 16,
            padding: '32px 40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center',
            maxWidth: 420,
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: `4px solid ${C.g200}`,
              borderTop: `4px solid ${C.navy5}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: C.navy1, margin: 0 }}>
              Preparando Descarga PDF
            </h4>
            <p style={{ fontSize: 13, color: C.g500, margin: 0, lineHeight: 1.5 }}>
              {exportProgress}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
