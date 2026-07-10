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
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 8,
    padding: '12px 18px', cursor: 'pointer', marginBottom: 8,
    userSelect: 'none', transition: 'all 0.15s',
  },
  sectionTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: C.navy3, fontFamily: "'DM Sans'" },
  content: {
    padding: '16px 20px', border: `1px solid ${C.g200}`, borderTop: 'none',
    borderRadius: '0 0 8px 8px', marginTop: -10, marginBottom: 16, background: C.white,
  },
  input: {
    width: "100%", padding: "8px 12px", borderRadius: 6,
    border: `1px solid ${C.g200}`, background: C.white,
    color: C.navy1, fontFamily: "'DM Sans'", fontSize: 13, boxSizing: "border-box",
  },
  label: {
    fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block",
    textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'",
  },
  textarea: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1px solid ${C.g200}`, background: C.g50, color: C.navy1,
    fontFamily: "'DM Sans'", fontSize: 12.5, minHeight: 80,
    resize: "vertical", boxSizing: "border-box", lineHeight: 1.5,
  },
  btn: (bg, color, border) => ({
    padding: "8px 16px", borderRadius: 6, border: `1px solid ${border || bg}`,
    background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'",
    fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center",
    gap: 6, transition: "all 0.15s",
  }),
};

const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
const LEVEL_COLORS_MAP = { 1: '#B91C1C', 2: '#B45309', 3: '#2563A0', 4: '#15803D' };

const RUBRICAS_ETP_DEF = [
  {
    id: 'R1',
    titulo: 'Planifica el proceso de enseñanza y aprendizaje.',
    etiquetaEvidencia: 'Descripción (evidencias)',
    aspectos: [
      'Unidad didáctica diseñada de acuerdo con los lineamientos curriculares de la Educación Técnico-Productiva.',
      'Sesiones o actividades de aprendizaje que permiten desarrollar la capacidad propuesta a través del uso de metodologías activas o modelos de aprendizaje.',
      'Sesión o actividad de aprendizaje que responde al contexto y a las características de los estudiantes, y aporta al logro de los aprendizajes previstos con atención a la diversidad.',
    ]
  },
  {
    id: 'R2',
    titulo: 'Promueve el involucramiento de los estudiantes en el proceso de aprendizaje.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectos: [
      'Acciones del docente para promover la participación de los estudiantes mediante metodologías activas o modelos de aprendizaje en las actividades de aprendizaje.',
      'Proporción de estudiantes involucrados en las actividades de aprendizaje.',
      'Acciones del docente para favorecer la comprensión de la importancia o utilidad de lo que se aprende con atención a la diversidad.',
    ]
  },
  {
    id: 'R3',
    titulo: 'Promueve el dominio de procedimientos para la realización de trabajos técnicos.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectos: [
      'Promoción del dominio de procedimientos para la elaboración de un producto o la prestación de un servicio.',
    ]
  },
  {
    id: 'R4',
    titulo: 'Acompaña el proceso de aprendizaje de los estudiantes.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectos: [
      'Monitoreo que realiza el docente del trabajo de los estudiantes y de sus avances durante el desarrollo de la actividad de aprendizaje.',
      'Calidad de la retroalimentación que el docente brinda o adaptación de las actividades que realiza a partir de las necesidades de aprendizaje identificadas.',
    ]
  },
  {
    id: 'R5',
    titulo: 'Promueve un clima propicio para el aprendizaje.',
    etiquetaEvidencia: 'Conductas observadas (evidencias)',
    aspectos: [
      'Trato respetuoso y consideración hacia la perspectiva de los estudiantes.',
      'Cercanía que muestra el docente en la interacción con los estudiantes.',
    ]
  }
];

export default function FichaDigitalFormETP({ data, onChange }) {
  const [openSection, setOpenSection] = useState(0);

  const toggleSection = (idx) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  /* ---- helpers generales ---- */
  const handleDGChange = (field, val) => {
    onChange({
      ...data,
      datosGeneralesCETPRO: { ...(data.datosGeneralesCETPRO || {}), [field]: val }
    });
  };

  const handleSesionChange = (field, val) => {
    onChange({
      ...data,
      datosSesion: { ...(data.datosSesion || {}), [field]: val }
    });
  };

  const handleDocPedChange = (field, val) => {
    onChange({
      ...data,
      documentosPedagogicos: { ...(data.documentosPedagogicos || {}), [field]: val }
    });
  };

  const handleRubricaNivel = (rIdx, nivel) => {
    const rubricasCopy = JSON.parse(JSON.stringify(data.rubricasETP || []));
    if (!rubricasCopy[rIdx]) return;
    rubricasCopy[rIdx].nivel = nivel;
    
    // Maintain alignment with EBA properties for backward-compatibility or averaging
    onChange({ ...data, rubricasETP: rubricasCopy });
  };

  const handleRubricaEvidencia = (rIdx, val) => {
    const rubricasCopy = JSON.parse(JSON.stringify(data.rubricasETP || []));
    if (!rubricasCopy[rIdx]) return;
    rubricasCopy[rIdx].evidencias = val;
    onChange({ ...data, rubricasETP: rubricasCopy });
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
    onChange({ ...data, declaracion: { ...(data.declaracion || {}), [field]: val } });
  };

  const handleFirmaChange = (party, field, val) => {
    onChange({
      ...data,
      firmas: {
        ...(data.firmas || {}),
        [party]: { ...(data.firmas?.[party] || {}), [field]: val }
      }
    });
  };

  const dg = data.datosGeneralesCETPRO || {};
  const sesion = data.datosSesion || {};
  const rubricas = data.rubricasETP || [];
  const compromisos = data.compromisosMejora || [];
  const dec = data.declaracion || {};
  const firmas = data.firmas || {};
  const checkDocs = data.documentosPedagogicos || {};

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>

      {/* 1. DATOS GENERALES DEL CETPRO */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(0)}>
          <h4 style={S.sectionTitle}>I. Datos Generales del CETPRO</h4>
          <Icon name={openSection === 0 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 0 && (
          <div style={S.content}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Nombre del CETPRO</label>
                <input value={dg.nombreCETPRO || ''} onChange={e => handleDGChange('nombreCETPRO', e.target.value)} style={S.input} placeholder="CETPRO..." />
              </div>
              <div>
                <label style={S.label}>Codigo Modular</label>
                <input value={dg.codigoModular || ''} onChange={e => handleDGChange('codigoModular', e.target.value)} style={S.input} placeholder="7 digitos..." />
              </div>
              <div>
                <label style={S.label}>UGEL</label>
                <input value={dg.ugel || '03'} onChange={e => handleDGChange('ugel', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>REI</label>
                <input value={dg.rei || ''} onChange={e => handleDGChange('rei', e.target.value)} style={S.input} />
              </div>

              <div style={{ gridColumn: 'span 2', borderTop: `1px solid ${C.g200}`, paddingTop: 12, marginTop: 4 }}>
                <p style={{ ...S.label, marginBottom: 8 }}>Docente Monitoreado</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Apellidos y Nombres</label>
                <input value={dg.docenteNombre || ''} onChange={e => handleDGChange('docenteNombre', e.target.value)} style={S.input} placeholder="Apellidos y nombres..." />
              </div>
              <div>
                <label style={S.label}>DNI</label>
                <input value={dg.docenteDNI || ''} onChange={e => handleDGChange('docenteDNI', e.target.value)} style={S.input} maxLength={8} placeholder="8 digitos" />
              </div>
              <div>
                <label style={S.label}>Telefono</label>
                <input value={dg.docenteTelefono || ''} onChange={e => handleDGChange('docenteTelefono', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Correo</label>
                <input value={dg.docenteCorreo || ''} onChange={e => handleDGChange('docenteCorreo', e.target.value)} style={S.input} type="email" />
              </div>

              <div style={{ gridColumn: 'span 2', borderTop: `1px solid ${C.g200}`, paddingTop: 12, marginTop: 4 }}>
                <p style={{ ...S.label, marginBottom: 8 }}>Monitor (Especialista UGEL/DRELM o Director)</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Apellidos y Nombres del Monitor</label>
                <input value={dg.monitorNombre || ''} onChange={e => handleDGChange('monitorNombre', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>DNI</label>
                <input value={dg.monitorDNI || ''} onChange={e => handleDGChange('monitorDNI', e.target.value)} style={S.input} maxLength={8} />
              </div>
              <div>
                <label style={S.label}>Telefono</label>
                <input value={dg.monitorTelefono || ''} onChange={e => handleDGChange('monitorTelefono', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Instancia</label>
                <select value={dg.instancia || ''} onChange={e => handleDGChange('instancia', e.target.value)} style={S.input}>
                  <option value="">Seleccione...</option>
                  <option value="DRELM">DRELM</option>
                  <option value="UGEL">UGEL</option>
                  <option value="CETPRO">CETPRO</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', borderTop: `1px solid ${C.g200}`, paddingTop: 12, marginTop: 4 }}>
                <p style={{ ...S.label, marginBottom: 8 }}>Observador (Opcional)</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Apellidos y Nombres</label>
                <input value={dg.observadorNombre || ''} onChange={e => handleDGChange('observadorNombre', e.target.value)} style={S.input} placeholder="(Opcional)" />
              </div>
              <div>
                <label style={S.label}>DNI</label>
                <input value={dg.observadorDNI || ''} onChange={e => handleDGChange('observadorDNI', e.target.value)} style={S.input} maxLength={8} />
              </div>
              <div>
                <label style={S.label}>Telefono</label>
                <input value={dg.observadorTelefono || ''} onChange={e => handleDGChange('observadorTelefono', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Cargo</label>
                <input value={dg.observadorCargo || ''} onChange={e => handleDGChange('observadorCargo', e.target.value)} style={S.input} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. DATOS DE LA SESION OBSERVADA */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(1)}>
          <h4 style={S.sectionTitle}>II. Datos de la Sesion Observada</h4>
          <Icon name={openSection === 1 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 1 && (
          <div style={S.content}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div>
                <label style={S.label}>Ciclo</label>
                <select value={sesion.ciclo || ''} onChange={e => handleSesionChange('ciclo', e.target.value)} style={S.input}>
                  <option value="">Seleccione...</option>
                  <option value="Basico">Basico</option>
                  <option value="Auxiliar tecnico">Auxiliar tecnico</option>
                  <option value="Medio">Medio</option>
                  <option value="Tecnico">Tecnico</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Opcion Ocupacional</label>
                <input value={sesion.opcionOcupacional || ''} onChange={e => handleSesionChange('opcionOcupacional', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Programa de Estudio</label>
                <input value={sesion.programaEstudio || ''} onChange={e => handleSesionChange('programaEstudio', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Especialidad</label>
                <input value={sesion.especialidad || ''} onChange={e => handleSesionChange('especialidad', e.target.value)} style={S.input} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Modulo Formativo</label>
                <input value={sesion.moduloFormativo || ''} onChange={e => handleSesionChange('moduloFormativo', e.target.value)} style={S.input} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Unidad Didactica</label>
                <input value={sesion.unidadDidactica || ''} onChange={e => handleSesionChange('unidadDidactica', e.target.value)} style={S.input} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>Nombre de la Actividad</label>
                <input value={sesion.nombreActividad || ''} onChange={e => handleSesionChange('nombreActividad', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Estudiantes Matriculados</label>
                <input type="number" value={sesion.matriculados ?? ''} onChange={e => handleSesionChange('matriculados', e.target.value ? parseInt(e.target.value) : null)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Estudiantes Presentes</label>
                <input type="number" value={sesion.presentes ?? ''} onChange={e => handleSesionChange('presentes', e.target.value ? parseInt(e.target.value) : null)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Turno</label>
                <select value={sesion.turno || ''} onChange={e => handleSesionChange('turno', e.target.value)} style={S.input}>
                  <option value="">Seleccione...</option>
                  <option value="M">Manana (M)</option>
                  <option value="T">Tarde (T)</option>
                  <option value="N">Noche (N)</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Fecha de Observacion</label>
                <input type="date" value={sesion.fechaObservacion || ''} onChange={e => handleSesionChange('fechaObservacion', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Hora de Inicio</label>
                <input type="time" value={sesion.horaInicio || ''} onChange={e => handleSesionChange('horaInicio', e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>Hora de Termino</label>
                <input type="time" value={sesion.horaTermino || ''} onChange={e => handleSesionChange('horaTermino', e.target.value)} style={S.input} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-B. DOCUMENTOS PEDAGOGICOS */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(4)}>
          <h4 style={S.sectionTitle}>II-B. Documentos Pedagogicos que presenta el Docente</h4>
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
                { field: 'silabo', label: '4. Sílabo para el estudiante (sellado por Dirección)' }
              ].map(item => (
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

      {/* 3. RUBRICAS R1-R5 */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(2)}>
          <h4 style={S.sectionTitle}>III. Desempenos, Aspectos y Calificacion (R1-R5)</h4>
          <Icon name={openSection === 2 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 2 && (
          <div style={S.content}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {rubricas.map((r, rIdx) => {
                const def = RUBRICAS_ETP_DEF[rIdx] || {};
                return (
                  <div key={rIdx} style={{ borderBottom: rIdx < 4 ? `1px solid ${C.g200}` : 'none', paddingBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.navy3, marginBottom: 8 }}>
                      R{rIdx + 1}. {r.titulo || def.titulo || ''}
                    </p>

                    {/* Aspectos (Read-only list with bullet points) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: C.g50, padding: '10px 14px', borderRadius: 6, border: `1px solid ${C.g100}`, marginBottom: 12 }}>
                      {(def.aspectos || []).map((aspText, aIdx) => (
                        <div key={aIdx} style={{ fontSize: 12, color: C.navy1, lineHeight: 1.4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <span style={{ color: C.navy5 }}>•</span>
                          <span>{aspText}</span>
                        </div>
                      ))}
                    </div>

                    {/* Single rating level per rubric */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: C.blueBg, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.g200}`, marginBottom: 12 }}>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: C.navy3 }}>
                        Calificación / Nivel de Logro de la Rúbrica:
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleRubricaNivel(rIdx, r.nivel === lvl ? null : lvl)}
                            style={{
                              width: 32, height: 28, borderRadius: 4, fontSize: 11, fontWeight: 700,
                              border: r.nivel === lvl ? 'none' : `1px solid ${C.g300}`,
                              background: r.nivel === lvl ? (LEVEL_COLORS_MAP[lvl] || C.blue) : C.white,
                              color: r.nivel === lvl ? C.white : C.g500,
                              cursor: 'pointer', transition: 'all 0.15s',
                              fontFamily: "'DM Sans'"
                            }}
                          >
                            {ROMAN[lvl]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Evidencias */}
                    <div>
                      <label style={S.label}>{def.etiquetaEvidencia || 'Evidencias'}</label>
                      <textarea
                        value={r.evidencias || ''}
                        onChange={e => handleRubricaEvidencia(rIdx, e.target.value)}
                        style={S.textarea}
                        placeholder="Registre las evidencias observadas..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPROMISOS + OBSERVACIONES + DECLARACION + FIRMAS */}
      <div>
        <div style={S.sectionHeader} onClick={() => toggleSection(3)}>
          <h4 style={S.sectionTitle}>IV. Retroalimentacion, Compromisos y Firmas</h4>
          <Icon name={openSection === 3 ? "chevronUp" : "chevronDown"} size={16} color={C.navy3} />
        </div>
        {openSection === 3 && (
          <div style={S.content}>
            {/* Compromisos */}
            <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: C.navy3 }}>Compromisos de Mejora</h5>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
              <thead>
                <tr>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50, width: 25, textAlign: 'center' }}>N</th>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Desempenos por mejorar</th>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50 }}>Compromisos de mejora</th>
                  <th style={{ border: `1px solid ${C.g200}`, padding: 8, background: C.g50, width: 40 }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {compromisos.map((row, i) => (
                  <tr key={i}>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 8, textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 4 }}>
                      <textarea value={row.desempenoPorMejorar || ''} onChange={e => handleCompromisoChange(i, 'desempenoPorMejorar', e.target.value)} style={{ ...S.textarea, minHeight: 45 }} placeholder="Aspecto a mejorar..." />
                    </td>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 4 }}>
                      <textarea value={row.compromisoMejora || ''} onChange={e => handleCompromisoChange(i, 'compromisoMejora', e.target.value)} style={{ ...S.textarea, minHeight: 45 }} placeholder="Compromiso..." />
                    </td>
                    <td style={{ border: `1px solid ${C.g200}`, padding: 8, textAlign: 'center' }}>
                      <button onClick={() => removeCompromiso(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.red }} title="Eliminar fila">
                        <Icon name="x" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addCompromiso} style={S.btn(C.g50, C.navy3, C.g200)}>+ Agregar Fila de Compromiso</button>

            {/* Observaciones */}
            <div style={{ marginTop: 16 }}>
              <label style={S.label}>Observaciones de la Ficha</label>
              <textarea
                value={data.observacionesFicha || ''}
                onChange={e => onChange({ ...data, observacionesFicha: e.target.value })}
                style={S.textarea}
                placeholder="Observaciones adicionales..."
              />
            </div>

            {/* Declaracion */}
            <div style={{ marginTop: 16 }}>
              <h5 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: C.navy3 }}>Declaracion de la Reunion de Retroalimentacion</h5>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={S.label}>Hora</label>
                  <input value={dec.hora || ''} onChange={e => handleDecChange('hora', e.target.value)} style={S.input} placeholder="12:30" />
                </div>
                <div>
                  <label style={S.label}>Dia</label>
                  <input value={dec.dia || ''} onChange={e => handleDecChange('dia', e.target.value)} style={S.input} placeholder="05" />
                </div>
                <div>
                  <label style={S.label}>Mes</label>
                  <input value={dec.mes || ''} onChange={e => handleDecChange('mes', e.target.value)} style={S.input} placeholder="junio" />
                </div>
                <div>
                  <label style={S.label}>Ano</label>
                  <input value={dec.anio || '2026'} onChange={e => handleDecChange('anio', e.target.value)} style={S.input} />
                </div>
              </div>
            </div>

            {/* Tactile Signature Pads */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
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
              <div style={{ border: `1px solid ${C.g200}`, padding: 12, borderRadius: 8, background: C.g50 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.navy3 }}>Monitor</h5>
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
