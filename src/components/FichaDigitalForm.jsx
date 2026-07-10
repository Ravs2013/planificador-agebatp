import React, { useState } from 'react';
import Icon from './Icon';
import FirmaDigital from './FirmaDigital';

const C = {
  navy1: "#0C1929", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
  g100: "#F1F5F9", g50: "#F8FAFC",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB", amberBorder: "#FDE68A",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF",
  white: "#FFFFFF",
};

const S = {
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: C.g50,
    border: `1px solid ${C.g200}`,
    borderRadius: 8,
    padding: '12px 18px',
    cursor: 'pointer',
    marginBottom: 8,
    userSelect: 'none',
    transition: 'all 0.15s',
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: C.navy3,
    fontFamily: "'DM Sans'",
  },
  content: {
    padding: '16px 20px',
    border: `1px solid ${C.g200}`,
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    marginTop: -10,
    marginBottom: 16,
    background: C.white,
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: `1px solid ${C.g200}`,
    background: C.white,
    color: C.navy1,
    fontFamily: "'DM Sans'",
    fontSize: 13,
    boxSizing: "border-box",
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: C.g500,
    marginBottom: 4,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontFamily: "'DM Sans'",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${C.g200}`,
    background: C.g50,
    color: C.navy1,
    fontFamily: "'DM Sans'",
    fontSize: 12.5,
    minHeight: 80,
    resize: "vertical",
    boxSizing: "border-box",
    lineHeight: 1.5,
  },
  btn: (bg, color, border) => ({
    padding: "8px 16px",
    borderRadius: 6,
    border: `1px solid ${border || bg}`,
    background: bg,
    color,
    cursor: "pointer",
    fontFamily: "'DM Sans'",
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s",
  }),
};

export default function FichaDigitalForm({ data, onChange, programa }) {
  const [openSection, setOpenSection] = useState(0);

  const toggleSection = (idx) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  const handleDGChange = (field, val) => {
    const updated = {
      ...data,
      datosGenerales: {
        ...(data.datosGenerales || {}),
        [field]: val
      }
    };
    onChange(updated);
  };

  const handleDocPedChange = (field, val) => {
    onChange({
      ...data,
      documentosPedagogicos: { ...(data.documentosPedagogicos || {}), [field]: val }
    });
  };

  const handleCriterioChange = (idx, field, val) => {
    const criterios = [...(data.instrumento1?.criterios || [])];
    if (!criterios[idx]) {
      criterios[idx] = { titulo: '', nivel: null, conductasObservables: '' };
    }
    criterios[idx] = { ...criterios[idx], [field]: val };
    
    const keyMap = [
      'involucraEstudiantes',
      'promueveRazonamiento',
      'evaluaProgreso',
      'ambienteRespeto',
      'regulaComportamiento'
    ];
    const key = keyMap[idx];
    const desempeno = { ...(data.desempeno || {}) };
    if (key) {
      desempeno[key] = {
        nivel: field === 'nivel' ? val : (desempeno[key]?.nivel || null),
        raw: field === 'nivel' ? (val ? `Nivel ${val}` : '') : (desempeno[key]?.raw || '')
      };
    }

    onChange({
      ...data,
      instrumento1: {
        ...(data.instrumento1 || {}),
        criterios
      },
      desempeno
    });
  };

  const handleCompromisoChange = (idx, field, val) => {
    const list = [...(data.compromisosMejora || [])];
    if (!list[idx]) list[idx] = {};
    list[idx][field] = val;
    onChange({ ...data, compromisosMejora: list });
  };

  const addCompromiso = () => {
    const list = [...(data.compromisosMejora || []), { desempenoPorMejorar: '', compromisoMejora: '' }];
    onChange({ ...data, compromisosMejora: list });
  };

  const removeCompromiso = (idx) => {
    const list = (data.compromisosMejora || []).filter((_, i) => i !== idx);
    onChange({ ...data, compromisosMejora: list });
  };

  const handleDecChange = (field, val) => {
    onChange({
      ...data,
      declaracion: {
        ...(data.declaracion || {}),
        [field]: val
      }
    });
  };

  const handleFirmaChange = (party, field, val) => {
    onChange({
      ...data,
      firmas: {
        ...(data.firmas || {}),
        [party]: {
          ...(data.firmas?.[party] || {}),
          [field]: val
        }
      }
    });
  };

  const dg = data.datosGenerales || {};
  const criterios = data.instrumento1?.criterios || [];
  const compromisos = data.compromisosMejora || [];
  const dec = data.declaracion || {};
  const firmas = data.firmas || {};
  const checkDocs = data.documentosPedagogicos || {};

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* 1. DATOS GENERALES */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(0)}>
          <h4 style={S.sectionTitle}>1. Datos Generales</h4>
          <Icon name={openSection === 0 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 0 && (
          <div style={S.content}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={S.label}>Institución Educativa (CEBA)</label>
                <input value={dg.institucionEducativa || ''} onChange={e => handleDGChange('institucionEducativa', e.target.value)} style={S.input} placeholder="CEBA..." />
              </div>
              <div>
                <label style={S.label}>Código Modular</label>
                <input value={dg.codigoModular || ''} onChange={e => handleDGChange('codigoModular', e.target.value)} style={S.input} placeholder="7 dígitos..." />
              </div>
              <div>
                <label style={S.label}>REI</label>
                <input value={dg.rei || ''} onChange={e => handleDGChange('rei', e.target.value)} style={S.input} placeholder="REI..." />
              </div>
              <div>
                <label style={S.label}>Docente Observado</label>
                <input value={dg.docenteObservado || ''} onChange={e => handleDGChange('docenteObservado', e.target.value)} style={S.input} placeholder="Apellidos y nombres..." />
              </div>
              <div>
                <label style={S.label}>Nivel Educativo</label>
                <input value={dg.nivelEducativo || 'Educación Básica Alternativa'} onChange={e => handleDGChange('nivelEducativo', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Grado</label>
                <input value={dg.grado || ''} onChange={e => handleDGChange('grado', e.target.value)} style={S.input} placeholder="Grado..." />
              </div>
              <div>
                <label style={S.label}>Sección</label>
                <input value={dg.seccion || ''} onChange={e => handleDGChange('seccion', e.target.value)} style={S.input} placeholder="Sección..." />
              </div>
              <div>
                <label style={S.label}>Área Curricular</label>
                <input value={dg.areaCurricular || ''} onChange={e => handleDGChange('areaCurricular', e.target.value)} style={S.input} placeholder="Área..." />
              </div>
              <div>
                <label style={S.label}>Fecha</label>
                <input type="date" value={dg.fecha || ''} onChange={e => handleDGChange('fecha', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Hora de Inicio</label>
                <input type="time" value={dg.horaInicio || ''} onChange={e => handleDGChange('horaInicio', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Hora de Fin</label>
                <input type="time" value={dg.horaFin || ''} onChange={e => handleDGChange('horaFin', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Estudiantes Matriculados</label>
                <input type="number" value={dg.estudiantesMatriculados ?? ''} onChange={e => handleDGChange('estudiantesMatriculados', e.target.value ? parseInt(e.target.value) : null)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Estudiantes Asistentes</label>
                <input type="number" value={dg.estudiantesAsistentes ?? ''} onChange={e => handleDGChange('estudiantesAsistentes', e.target.value ? parseInt(e.target.value) : null)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Estudiantes con Discapacidad (N.E.E)</label>
                <input type="number" value={dg.estudiantesDiscapacidad ?? ''} onChange={e => handleDGChange('estudiantesDiscapacidad', e.target.value ? parseInt(e.target.value) : null)} style={S.input} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Especialista / Monitor</label>
                <input value={dg.nombreMonitor || ''} onChange={e => handleDGChange('nombreMonitor', e.target.value)} style={S.input} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1-B. DOCUMENTOS PEDAGÓGICOS */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(4)}>
          <h4 style={S.sectionTitle}>1-B. Documentos Pedagogicos que presenta el Docente</h4>
          <Icon name={openSection === 4 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 4 && (
          <div style={S.content}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: '0.8rem', color: C.g500, margin: '0 0 6px' }}>
                Marque Sí o No para cada uno de los documentos pedagógicos obligatorios:
              </p>
              {[
                { field: 'planEstudios', label: '1. Plan de estudios' },
                { field: 'unidadDidactica', label: '2. Unidad didáctica' },
                { field: 'sesionAprendizaje', label: '3. Sesión de aprendizaje' },
                { field: 'silabo', label: '4. Sílabo para el estudiante (sellado por Dirección)', soloEtp: true }
              ].filter(item => !item.soloEtp || programa === 'ETP').map(item => (
                <div key={item.field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.g50, padding: '8px 14px', borderRadius: 6, border: `1px solid ${C.g200}` }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.navy1 }}>{item.label}</span>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: C.navy1 }}>
                      <input type="radio" name={item.field} checked={checkDocs[item.field] === true} onChange={() => handleDocPedChange(item.field, true)} /> Sí
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: C.navy1 }}>
                      <input type="radio" name={item.field} checked={checkDocs[item.field] === false} onChange={() => handleDocPedChange(item.field, false)} /> No
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. RÚBRICAS */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(1)}>
          <h4 style={S.sectionTitle}>2. Rúbricas de Observación</h4>
          <Icon name={openSection === 1 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 1 && (
          <div style={S.content}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {criterios.map((c, idx) => (
                <div key={idx} style={{ borderBottom: idx < 4 ? `1px solid ${C.g200}` : 'none', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.navy3 }}>{idx + 1}. {c.titulo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.g500, marginRight: 4 }}>Nivel:</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(num => {
                          const roman = ["I", "II", "III", "IV"][num - 1];
                          const selected = c.nivel === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleCriterioChange(idx, 'nivel', selected ? null : num)}
                              style={{
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 'bold',
                                border: `1px solid ${selected ? C.navy3 : C.g200}`,
                                borderRadius: 4,
                                backgroundColor: selected ? C.navy3 : C.white,
                                color: selected ? C.white : C.navy3,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {roman}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Conductas Observables / Comentarios Detallados</label>
                    <textarea 
                      value={c.conductasObservables || ''} 
                      onChange={e => handleCriterioChange(idx, 'conductasObservables', e.target.value)}
                      style={S.textarea} 
                      placeholder="Ingrese las conductas observadas que respaldan el nivel alcanzado..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. COMPROMISOS */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(2)}>
          <h4 style={S.sectionTitle}>3. Compromisos de Mejora</h4>
          <Icon name={openSection === 2 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 2 && (
          <div style={S.content}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50, width: 25, textAlign: 'center' }}>N°</th>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Desempeño por mejorar</th>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Compromiso de mejora</th>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50, width: 40 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {compromisos.map((row, i) => (
                  <tr key={i}>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 8, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 4 }}>
                      <textarea
                        value={row.desempenoPorMejorar || ''}
                        onChange={e => handleCompromisoChange(i, 'desempenoPorMejorar', e.target.value)}
                        style={{ ...S.textarea, minHeight: 45 }}
                        placeholder="Aspecto a mejorar..."
                      />
                    </td>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 4 }}>
                      <textarea
                        value={row.compromisoMejora || ''}
                        onChange={e => handleCompromisoChange(i, 'compromisoMejora', e.target.value)}
                        style={{ ...S.textarea, minHeight: 45 }}
                        placeholder="Compromiso..."
                      />
                    </td>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 8, textAlign: 'center' }}>
                      <button 
                        onClick={() => removeCompromiso(i)} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.red }}
                        title="Eliminar fila"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addCompromiso} style={S.btn(C.g50, C.navy3, C.g200)}>
              + Agregar Fila de Compromiso
            </button>
          </div>
        )}
      </div>

      {/* 4. DECLARACIÓN Y FIRMAS */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(3)}>
          <h4 style={S.sectionTitle}>4. Reunión de Retroalimentación y Firmas</h4>
          <Icon name={openSection === 3 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 3 && (
          <div style={S.content}>
            <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: C.navy3 }}>Datos de la Reunión</h5>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Hora de Reunión</label>
                <input value={dec.hora || ''} onChange={e => handleDecChange('hora', e.target.value)} style={S.input} placeholder="12:30" />
              </div>
              <div>
                <label style={S.label}>Día</label>
                <input value={dec.dia || ''} onChange={e => handleDecChange('dia', e.target.value)} style={S.input} placeholder="05" />
              </div>
              <div>
                <label style={S.label}>Mes</label>
                <input value={dec.mes || ''} onChange={e => handleDecChange('mes', e.target.value)} style={S.input} placeholder="junio" />
              </div>
              <div>
                <label style={S.label}>Año</label>
                <input value={dec.anio || '2026'} onChange={e => handleDecChange('anio', e.target.value)} style={S.input} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Docente Monitoreado */}
              <div style={{ border: `1px solid ${C.g200}`, padding: 12, borderRadius: 8, background: C.g50 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.navy3 }}>Docente Monitoreado</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={S.label}>Nombre Completo</label>
                    <input value={firmas.docente?.nombre || ''} onChange={e => handleFirmaChange('docente', 'nombre', e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>DNI</label>
                    <input value={firmas.docente?.dni || ''} onChange={e => handleFirmaChange('docente', 'dni', e.target.value)} style={S.input} maxLength={8} />
                  </div>
                  <FirmaDigital
                    value={data.firmaDocenteDataUrl}
                    onChange={val => onChange({ ...data, firmaDocenteDataUrl: val })}
                    label="Firma Táctil del Docente"
                  />
                </div>
              </div>

              {/* Especialista / Monitor */}
              <div style={{ border: `1px solid ${C.g200}`, padding: 12, borderRadius: 8, background: C.g50 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.navy3 }}>Especialista / Monitor</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={S.label}>Nombre Completo</label>
                    <input value={firmas.observador?.nombre || ''} onChange={e => handleFirmaChange('observador', 'nombre', e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>DNI</label>
                    <input value={firmas.observador?.dni || ''} onChange={e => handleFirmaChange('observador', 'dni', e.target.value)} style={S.input} maxLength={8} />
                  </div>
                  <FirmaDigital
                    value={data.firmaMonitorDataUrl}
                    onChange={val => onChange({ ...data, firmaMonitorDataUrl: val })}
                    label="Firma Táctil del Monitor"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
