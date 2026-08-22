import React, { useState, useEffect, useMemo } from 'react';
import { DISCIPLINAS_UGEL03, getCategoriasHabilitadas, getContextoEvaluacion, getDisciplinaUGEL03 } from '../data/juegosFloralesUGEL03';
import { CATEGORIAS_JF, C } from '../data/juegosFloralesCatalogos';
import { getJuradosDeDisciplina } from '../data/juegosFloralesCredenciales';
import { mesEnLetras, construirActaA11, filtrarEvaluacionesValidas } from '../utils/juegosFloralesHelpers';
import {
  subscribeJFConsolidado,
  subscribeJFActa,
  subscribeJFEvaluaciones,
  setJFActa,
  cerrarJFActa
} from '../firebase/dbJuegosFlorales';
import { generarA11PDF } from '../pdf/generarA11PDF';
import { loadImageDataURL } from '../pdf/membrete';
import Icon from './Icon';

export default function JFActaA11({ user, isRole, onToast, initialDisciplinaId }) {
  const [disciplinaId, setDisciplinaId] = useState(() => initialDisciplinaId || user?.disciplinaId || "teatro");
  const categoriasHabilitadas = useMemo(() => getCategoriasHabilitadas(disciplinaId), [disciplinaId]);
  const [categoria, setCategoria] = useState(categoriasHabilitadas[0] || "D");

  useEffect(() => {
    if (initialDisciplinaId) {
      setDisciplinaId(initialDisciplinaId);
    } else if (user?.disciplinaId) {
      setDisciplinaId(user.disciplinaId);
    }
  }, [user, initialDisciplinaId]);

  useEffect(() => {
    const cats = getCategoriasHabilitadas(disciplinaId);
    if (cats.length > 0 && !cats.includes(categoria)) {
      setCategoria(cats[0]);
    }
  }, [disciplinaId]);

  const discInfo = useMemo(() => getDisciplinaUGEL03(disciplinaId), [disciplinaId]);
  const contexto = useMemo(() => getContextoEvaluacion(disciplinaId), [disciplinaId]);

  const docId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;

  // Subscripciones Firestore
  const [consolidado, setConsolidado] = useState(null);
  const [actaGuardada, setActaGuardada] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);

  useEffect(() => {
    const unSubC = subscribeJFConsolidado(docId, setConsolidado);
    const unSubA = subscribeJFActa(docId, setActaGuardada);
    const unSubE = subscribeJFEvaluaciones({ disciplinaId, categoria }, setEvaluaciones);
    return () => {
      unSubC();
      unSubA();
      unSubE();
    };
  }, [disciplinaId, categoria]);

  // Campos editables del acta
  const [region, setRegion] = useState("Lima");
  const [provincia, setProvincia] = useState("Lima");
  const [distrito, setDistrito] = useState("Pueblo Libre");
  const [hora, setHora] = useState("17:00");
  const [incluirPuntaje, setIncluirPuntaje] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (actaGuardada) {
      if (actaGuardada.region) setRegion(actaGuardada.region);
      if (actaGuardada.provincia) setProvincia(actaGuardada.provincia);
      if (actaGuardada.distrito) setDistrito(actaGuardada.distrito);
      if (actaGuardada.hora) setHora(actaGuardada.hora);
      if (actaGuardada.incluirPuntaje != null) setIncluirPuntaje(actaGuardada.incluirPuntaje);
    } else if (consolidado) {
      if (consolidado.region) setRegion(consolidado.region);
      if (consolidado.provincia) setProvincia(consolidado.provincia);
      if (consolidado.distrito) setDistrito(consolidado.distrito);
    }
  }, [actaGuardada, consolidado]);

  // Construcción del Acta en base al A10 cerrado
  const actaBase = useMemo(() => {
    if (!consolidado) return null;
    return construirActaA11(consolidado);
  }, [consolidado]);

  const [pdfEscaneadoUrl, setPdfEscaneadoUrl] = useState(actaGuardada?.pdfEscaneadoUrl || null);

  useEffect(() => {
    if (actaGuardada?.pdfEscaneadoUrl) {
      setPdfEscaneadoUrl(actaGuardada.pdfEscaneadoUrl);
    }
  }, [actaGuardada]);

  // Jurados (matriz oficial de credenciales + firmas de A10 + respaldo directo de jfEvaluaciones)
  const jurados = useMemo(() => {
    const listConsolidado = consolidado?.jurados || [];
    const listMatriz = getJuradosDeDisciplina(disciplinaId, categoria);
    const evsValidas = filtrarEvaluacionesValidas(evaluaciones, disciplinaId, categoria);

    const mapEvaluaciones = {};
    evsValidas.forEach(e => {
      if (e.jurado && e.jurado.numeroJurado) {
        const jNum = e.jurado.numeroJurado;
        if (!mapEvaluaciones[jNum] || (e.jurado.firmaDataUrl && !mapEvaluaciones[jNum].firmaDataUrl)) {
          mapEvaluaciones[jNum] = e.jurado;
        }
      }
    });

    return [1, 2, 3].map(num => {
      const fromCons = listConsolidado.find(j => j.numeroJurado === num);
      const fromEval = mapEvaluaciones[num];
      const fromMat = listMatriz.find(j => j.numeroJurado === num);

      const firmaDataUrl = fromCons?.firmaDataUrl || fromEval?.firmaDataUrl || null;
      const nombreCompleto = fromCons?.nombreCompleto || fromEval?.nombreCompleto || fromMat?.nombreCompleto || "────────";
      const dni = fromCons?.dni || fromEval?.dni || fromMat?.dni || "────────";

      return {
        numeroJurado: num,
        nombreCompleto,
        dni,
        cargo: fromMat?.cargo || fromCons?.cargo || "JURADO CALIFICADOR",
        firmaDataUrl
      };
    });
  }, [consolidado, disciplinaId, categoria, evaluaciones]);

  const [juradosEditados, setJuradosEditados] = useState({});

  const juradosFinales = useMemo(() => {
    return jurados.map(j => {
      const ed = juradosEditados[j.numeroJurado];
      return {
        ...j,
        nombreCompleto: ed?.nombreCompleto != null ? ed.nombreCompleto.toUpperCase() : j.nombreCompleto,
        dni: ed?.dni != null ? ed.dni : j.dni
      };
    });
  }, [jurados, juradosEditados]);

  // Resultados (Top 3 puestos)
  const resultados = actaBase?.resultados || [];

  const fechaPartes = (contexto?.fecha || '2026-08-20').split('-');
  const anio = fechaPartes[0] || '2026';
  const mesNum = parseInt(fechaPartes[1] || '8', 10);
  const dia = parseInt(fechaPartes[2] || '20', 10);
  const mesNombre = mesEnLetras(mesNum);

  const consolidadoCerrado = consolidado?.estado === "cerrado";
  const estado = actaGuardada?.estado || "borrador";
  const readOnly = estado === "cerrada";

  const handleGuardarActa = async () => {
    try {
      setGuardando(true);
      const payload = {
        id: docId,
        consolidadoId: consolidado?.id,
        eventoId: "JFEN-2026",
        etapa: "UGEL",
        disciplinaId,
        disciplinaLabel: discInfo?.label || disciplinaId,
        categoria,
        region,
        provincia,
        distrito,
        fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
        hora,
        jurados: juradosFinales,
        resultados,
        incluirPuntaje,
        pdfEscaneadoUrl: pdfEscaneadoUrl || null,
        estado: estado || "borrador"
      };
      await setJFActa(docId, payload);
      if (onToast) onToast("Acta A11 guardada en Firestore.", "success");
    } catch (err) {
      if (onToast) onToast(`Error al guardar acta: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarActa = async () => {
    if ((consolidado?.filas || []).length === 0) {
      if (onToast) onToast("No hay participantes inscritos en esta disciplina y categoría.", "error");
      return;
    }
    if (!consolidadoCerrado) {
      if (onToast) onToast("El Anexo A10 debe estar cerrado antes de poder cerrar el Acta A11.", "error");
      return;
    }
    try {
      setGuardando(true);
      await handleGuardarActa();
      await cerrarJFActa(docId, user);
      if (onToast) onToast("¡Acta A11 cerrada e inmutable!", "success");
    } catch (err) {
      if (onToast) onToast(`Error al cerrar acta: ${err.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleDescargarPDF = async () => {
    const banner = await loadImageDataURL('/membrete-juegos-florales.png');
    const actaData = {
      id: docId,
      disciplinaId,
      disciplinaLabel: discInfo?.label,
      categoria,
      region,
      provincia,
      distrito,
      fecha: contexto?.fecha || new Date().toISOString().slice(0, 10),
      hora,
      jurados: juradosFinales,
      resultados,
      incluirPuntaje
    };
    generarA11PDF(actaData, banner);
  };

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, maxWidth: 1000, margin: '0 auto', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      {/* Selector Disciplina / Categoría */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>DISCIPLINA</label>
          <select
            value={disciplinaId}
            onChange={e => setDisciplinaId(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.navy2 }}
          >
            <optgroup label="PRESENCIALES">
              {DISCIPLINAS_UGEL03.filter(d => d.modalidad === 'presencial').map(d => (
                <option key={d.disciplinaId} value={d.disciplinaId}>{d.label}</option>
              ))}
            </optgroup>
            <optgroup label="NO PRESENCIALES">
              {DISCIPLINAS_UGEL03.filter(d => d.modalidad === 'no_presencial').map(d => (
                <option key={d.disciplinaId} value={d.disciplinaId}>{d.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.navy2 }}
          >
            {categoriasHabilitadas.map(c => (
              <option key={c} value={c}>Categoría {c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>ETAPA</label>
          <input type="text" readOnly value="UGEL" style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.g100, fontSize: 13, fontWeight: 700, color: C.navy2 }} />
        </div>
      </div>

      {/* Estado de A10 previo */}
      {!consolidadoCerrado && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 16px', borderRadius: 6, marginBottom: 20, fontSize: 12, fontWeight: 700, color: C.amber }}>
          El Anexo A10 Consolidado de esta disciplina y categoría aún no está cerrado. Debe cerrar el A10 para completar formalmente el Acta A11.
        </div>
      )}

      {/* Encabezado Oficial */}
      <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: `2px solid ${C.g100}`, paddingBottom: 14 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: C.navy2, margin: 0, textTransform: 'uppercase' }}>
          ANEXO A11 — ACTA DE RESULTADOS
        </h2>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy4, marginTop: 2 }}>
          JUEGOS FLORALES ESCOLARES NACIONALES 2026
        </div>
      </div>

      {/* 6.1 Párrafo Normativo Interactivo */}
      <div style={{ background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 18, marginBottom: 20, fontSize: 13, color: C.g800, lineHeight: 1.7 }}>
        En la región de{' '}
        <input type="text" disabled={readOnly} value={region} onChange={e => setRegion(e.target.value)} style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${C.border}`, fontWeight: 700, width: 90 }} />,{' '}
        provincia de{' '}
        <input type="text" disabled={readOnly} value={provincia} onChange={e => setProvincia(e.target.value)} style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${C.border}`, fontWeight: 700, width: 90 }} />,{' '}
        distrito de{' '}
        <input type="text" disabled={readOnly} value={distrito} onChange={e => setDistrito(e.target.value)} style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${C.border}`, fontWeight: 700, width: 110 }} />,{' '}
        con fecha <strong>{dia} de {mesNombre} de {anio}</strong>, a las{' '}
        <input type="text" disabled={readOnly} value={hora} onChange={e => setHora(e.target.value)} style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${C.border}`, fontWeight: 700, width: 70, textAlign: 'center' }} />{' '}
        horas, durante el proceso de evaluación de los Juegos Florales Escolares Nacionales de la etapa <strong>UGEL</strong>, de la categoría <strong>{categoria}</strong>, de la disciplina <strong>{discInfo?.label}</strong> el Jurado Calificador, conformado por las siguientes personalidades:

        <ol style={{ margin: '12px 0', paddingLeft: 24, fontWeight: 700, color: C.navy2 }}>
          {jurados.map((j, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {(j.nombreCompleto || '────────').toUpperCase()} {j.dni ? `(DNI ${j.dni})` : ''}
            </li>
          ))}
        </ol>

        Efectúa la calificación, en coherencia con las bases, procediéndose a declarar lo siguiente:
      </div>

      {/* Toggle para columna opcional de puntaje total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: C.g500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={incluirPuntaje}
            onChange={e => setIncluirPuntaje(e.target.checked)}
            style={{ accentColor: C.navy3 }}
          />
          Incluir columna de puntaje total (opcional)
        </label>
      </div>

      {/* 6.2 Tabla de Resultados (Tres Primeros Puestos) */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: `1px solid ${C.border}` }}>
          <thead>
            <tr style={{ background: C.navy3, color: C.white, textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '15%', textAlign: 'center' }}>ORDEN DE MÉRITO</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}` }}>INSTITUCIÓN EDUCATIVA</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '12%', textAlign: 'center' }}>UGEL</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '22%', textAlign: 'center' }}>DRE/GRE</th>
              <th style={{ padding: '10px 12px', border: `1px solid ${C.border}` }}>NOMBRE DEL TRABAJO</th>
              {incluirPuntaje && <th style={{ padding: '10px 12px', border: `1px solid ${C.border}`, width: '12%', textAlign: 'center' }}>PUNTAJE TOTAL</th>}
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr>
                <td colSpan={incluirPuntaje ? 6 : 5} style={{ padding: 24, textAlign: 'center', color: C.amber, fontWeight: 700, background: '#FFFBEB' }}>
                  {consolidado && (consolidado.filas || []).length === 0
                    ? "No hay participantes inscritos en esta disciplina y categoría."
                    : "El consolidado A10 aún no tiene evaluaciones procesadas para determinar los 3 primeros puestos."}
                </td>
              </tr>
            ) : (
              resultados.map((r) => (
                <tr key={r.puesto} style={{ background: C.g50 }}>
                  <td style={{ padding: '12px', border: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 800, fontSize: 14, color: C.navy2 }}>
                    {r.ordenMerito}
                  </td>
                  <td style={{ padding: '12px', border: `1px solid ${C.border}`, fontWeight: 700, color: C.navy2 }}>
                    {r.institucion}
                  </td>
                  <td style={{ padding: '12px', border: `1px solid ${C.border}`, textAlign: 'center', fontSize: 11, color: C.g500 }}>
                    {r.ugel}
                  </td>
                  <td style={{ padding: '12px', border: `1px solid ${C.border}`, textAlign: 'center', fontSize: 11, color: C.g500 }}>
                    {r.dre}
                  </td>
                  <td style={{ padding: '12px', border: `1px solid ${C.border}`, color: C.g800 }}>
                    {r.nombreTrabajo}
                  </td>
                  {incluirPuntaje && (
                    <td style={{ padding: '12px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'", fontWeight: 800, fontSize: 13, color: C.navy2 }}>
                      {r.puntajeTotal != null ? r.puntajeTotal : '—'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 6.3 Bloque de Firmas al Pie */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, background: C.g50, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, textTransform: 'uppercase', marginBottom: 14 }}>
          FIRMAS DEL JURADO CALIFICADOR
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
          {[1, 2].map(num => {
            const j = juradosFinales[num - 1] || {};
            return (
              <div key={num} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                {j.firmaDataUrl ? (
                  <img src={j.firmaDataUrl} alt={`Firma J${num}`} style={{ maxHeight: 45, objectFit: 'contain', marginBottom: 6 }} />
                ) : (
                  <div style={{ height: 45, color: C.g500, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sin firma en D1</div>
                )}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={j.nombreCompleto === '────────' ? '' : j.nombreCompleto}
                    onChange={e => setJuradosEditados({
                      ...juradosEditados,
                      [num]: { ...(juradosEditados[num] || {}), nombreCompleto: e.target.value.toUpperCase() }
                    })}
                    placeholder="NOMBRES Y APELLIDOS JURADO"
                    style={{ width: '100%', padding: '4px 6px', fontSize: 11, fontWeight: 700, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4, color: C.navy2 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.g500, fontWeight: 700 }}>DNI:</span>
                    <input
                      type="text"
                      disabled={readOnly}
                      maxLength={8}
                      value={j.dni === '────────' ? '' : j.dni}
                      onChange={e => setJuradosEditados({
                        ...juradosEditados,
                        [num]: { ...(juradosEditados[num] || {}), dni: e.target.value.replace(/\D/g, '') }
                      })}
                      placeholder="DNI"
                      style={{ width: 90, padding: '3px 6px', fontSize: 10, fontFamily: "'JetBrains Mono'", textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          {(() => {
            const j = juradosFinales[2] || {};
            const num = 3;
            return (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                {j.firmaDataUrl ? (
                  <img src={j.firmaDataUrl} alt="Firma J3" style={{ maxHeight: 45, objectFit: 'contain', marginBottom: 6 }} />
                ) : (
                  <div style={{ height: 45, color: C.g500, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sin firma en D1</div>
                )}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={j.nombreCompleto === '────────' ? '' : j.nombreCompleto}
                    onChange={e => setJuradosEditados({
                      ...juradosEditados,
                      [num]: { ...(juradosEditados[num] || {}), nombreCompleto: e.target.value.toUpperCase() }
                    })}
                    placeholder="NOMBRES Y APELLIDOS JURADO"
                    style={{ width: '100%', padding: '4px 6px', fontSize: 11, fontWeight: 700, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4, color: C.navy2 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.g500, fontWeight: 700 }}>DNI:</span>
                    <input
                      type="text"
                      disabled={readOnly}
                      maxLength={8}
                      value={j.dni === '────────' ? '' : j.dni}
                      onChange={e => setJuradosEditados({
                        ...juradosEditados,
                        [num]: { ...(juradosEditados[num] || {}), dni: e.target.value.replace(/\D/g, '') }
                      })}
                      placeholder="DNI"
                      style={{ width: 90, padding: '3px 6px', fontSize: 10, fontFamily: "'JetBrains Mono'", textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {/* Opción de Subir PDF Escaneado de Anexo A11 (Firma Manuscrita) */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, marginBottom: 4 }}>
            Subir Anexo A11 (Acta) Escaneada (Firmas Manuscritas en Físico)
          </div>
          <div style={{ fontSize: 11, color: C.g500, marginBottom: 8 }}>
            Si el Acta A11 fue firmada en físico por los jurados, puede adjuntar el documento PDF escaneado aquí.
          </div>
          <input
            type="file"
            accept="application/pdf,image/*"
            disabled={readOnly}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                  setPdfEscaneadoUrl(evt.target.result);
                  if (onToast) onToast("PDF escaneado de Anexo A11 cargado correctamente.", "success");
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ fontSize: 12 }}
          />
          {pdfEscaneadoUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>✓ PDF Escaneado Adjunto (A11)</span>
              <a href={pdfEscaneadoUrl} download={`ActaA11_${disciplinaId}_Cat${categoria}.pdf`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.navy3, fontWeight: 700 }}>Ver / Descargar PDF Escaneado</a>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.border}`, paddingTop: 16 }}>
        <div>
          <button onClick={handleDescargarPDF} style={{ background: C.gold, color: C.navy1, border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="fileText" size={14} /> Descargar PDF Anexo A11
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!readOnly && (
            <>
              <button
                disabled={guardando}
                onClick={handleGuardarActa}
                style={{ background: C.white, color: C.navy3, border: `1px solid ${C.navy3}`, borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Guardar acta
              </button>

              <button
                disabled={guardando || !consolidadoCerrado}
                onClick={handleCerrarActa}
                style={{
                  background: consolidadoCerrado ? C.navy3 : C.g500,
                  color: C.white,
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: consolidadoCerrado ? 'pointer' : 'not-allowed'
                }}
              >
                Cerrar acta A11
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
