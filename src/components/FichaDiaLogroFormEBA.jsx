import React from 'react';
import Icon from './Icon';

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

const CRITERIOS_EBA_DEF = [
  {
    key: "reflexivo",
    nombre: "DESARROLLO DEL PENSAMIENTO REFLEXIVO",
    c: "El estudiante presenta sus trabajos de forma superficial, sin profundizar en análisis críticos o reflexiones significativas.",
    b: "El estudiante comienza a incorporar análisis críticos en sus presentaciones, pero aún necesita desarrollar mayor profundidad en sus reflexiones.",
    a: "El estudiante demuestra capacidad para realizar análisis críticos profundos y reflexiones significativas en la presentación de sus trabajos, aportando perspectivas enriquecedoras al tema."
  },
  {
    key: "creatividad",
    nombre: "CREATIVIDAD E INNOVACIÓN Y/O USO DE TECNOLOGÍA",
    c: "El estudiante presenta sus trabajos de manera convencional y poco creativa, sin elementos innovadores y/o el estudiante utiliza de manera limitada la tecnología y recursos virtuales sin aprovechar su potencial.",
    b: "El estudiante muestra intentos de incorporar elementos creativos en la presentación, pero aún necesita explorar nuevas ideas y/o el estudiante experimenta con el uso de tecnología y recursos virtuales pero aún necesita mejorar su integración en la presentación.",
    a: "El estudiante demuestra originalidad y creatividad en la presentación de sus trabajos, utilizando elementos innovadores que destacan y enriquecen la exposición y/o el estudiante emplea de manera efectiva la tecnología y recursos virtuales para enriquecer la presentación de sus trabajos facilitando la comprensión del contenido."
  },
  {
    key: "colaboracion",
    nombre: "COLABORACIÓN Y CO-CREACIÓN",
    c: "El estudiante trabaja de forma individual en la presentación de sus trabajos, sin involucrar la colaboración con otros.",
    b: "El estudiante muestra interés por la colaboración, pero aún necesita desarrollar habilidades de co-creación en la presentación.",
    a: "El estudiante colabora de forma efectiva con otros compañeros en la co-creación de la presentación, integrando diferentes perspectivas y habilidades para lograr un resultado conjunto innovador."
  },
  {
    key: "cneb",
    nombre: "ALINEACIÓN DE LAS ACTIVIDADES CON EL CNEB",
    c: "El estudiante participa en actividades que no están alineadas con el CNEB.",
    b: "El estudiante participa en actividades que presentan algunas deficiencias en la alineación con el CNEB.",
    a: "El estudiante participa en actividades que en su mayoría están alineadas con el CNEB con énfasis en el desarrollo de aprendizajes a lo largo de la vida."
  },
  {
    key: "comunidad",
    nombre: "BIENESTAR DE LA COMUNIDAD",
    c: "Se observa poca o ninguna participación de la comunidad educativa.",
    b: "Se observa la participación de algunos actores de la comunidad educativa.",
    a: "Se observa la participación de la mayoría de los actores de la comunidad educativa."
  }
];

export default function FichaDiaLogroFormEBA({ data = {}, onChange }) {
  const dg = data.datosGenerales || {};
  const inf = data.datosInformante || {};
  const criterios = data.criterios || CRITERIOS_EBA_DEF.map(c => ({ key: c.key, nivel: '' }));

  const updateDG = (field, val) => {
    onChange({
      ...data,
      datosGenerales: { ...dg, [field]: val }
    });
  };

  const updateInf = (field, val) => {
    onChange({
      ...data,
      datosInformante: { ...inf, [field]: val }
    });
  };

  const updateCriterio = (idx, nivel) => {
    const updated = [...criterios];
    updated[idx] = { ...updated[idx], nivel };
    onChange({ ...data, criterios: updated });
  };

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 20, border: `1px solid ${C.g200}`, marginBottom: 20 },
    title: { fontSize: "1rem", fontWeight: 700, color: C.navy1, marginBottom: 14, fontFamily: "'DM Serif Display',serif" },
    grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cols || 200}px, 1fr))`, gap: 14 }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: "'DM Sans'" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase" },
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Datos Generales */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="building" size={16} style={{ marginRight: 6 }} /> Datos Generales CEBA</h4>
        <div style={S.grid(180)}>
          <div>
            <label style={S.label}>Nombre del CEBA</label>
            <input style={S.input} type="text" value={dg.nombreCEBA || ''} onChange={e => updateDG('nombreCEBA', e.target.value)} placeholder="CEBA..." />
          </div>
          <div>
            <label style={S.label}>Código Local</label>
            <input style={S.input} type="text" value={dg.codigoLocal || ''} onChange={e => updateDG('codigoLocal', e.target.value)} placeholder="000000" />
          </div>
          <div>
            <label style={S.label}>Red Educativa</label>
            <input style={S.input} type="text" value={dg.red || ''} onChange={e => updateDG('red', e.target.value)} placeholder="Red N°..." />
          </div>
          <div>
            <label style={S.label}>Fecha</label>
            <input style={S.input} type="date" value={dg.fecha || ''} onChange={e => updateDG('fecha', e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
          <div>
            <label style={S.label}>Ciclo Monitoreado</label>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!dg.cicloAvanzado} onChange={e => updateDG('cicloAvanzado', e.target.checked)} /> Avanzado
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!dg.cicloInicialIntermedio} onChange={e => updateDG('cicloInicialIntermedio', e.target.checked)} /> Inicial - Intermedio
              </label>
            </div>
          </div>
          <div>
            <label style={S.label}>Turno</label>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!dg.turnoM} onChange={e => updateDG('turnoM', e.target.checked)} /> Mañana (M)
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!dg.turnoT} onChange={e => updateDG('turnoT', e.target.checked)} /> Tarde (T)
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!dg.turnoN} onChange={e => updateDG('turnoN', e.target.checked)} /> Noche (N)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Datos del Informante */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="user" size={16} style={{ marginRight: 6 }} /> Datos del Informante / Director</h4>
        <div style={S.grid(180)}>
          <div>
            <label style={S.label}>Apellidos y Nombres</label>
            <input style={S.input} type="text" value={inf.nombres || ''} onChange={e => updateInf('nombres', e.target.value)} placeholder="Apellidos y nombres completos" />
          </div>
          <div>
            <label style={S.label}>DNI</label>
            <input style={S.input} type="text" maxLength={8} value={inf.dni || ''} onChange={e => updateInf('dni', e.target.value)} placeholder="DNI (8 dígitos)" />
          </div>
          <div>
            <label style={S.label}>Celular</label>
            <input style={S.input} type="text" value={inf.celular || ''} onChange={e => updateInf('celular', e.target.value)} placeholder="987654321" />
          </div>
          <div>
            <label style={S.label}>Correo Electrónico</label>
            <input style={S.input} type="email" value={inf.correo || ''} onChange={e => updateInf('correo', e.target.value)} placeholder="ejemplo@ceba.edu.pe" />
          </div>
        </div>
      </div>

      {/* Criterios de Evaluación */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="clipboard" size={16} style={{ marginRight: 6 }} /> Criterios de Evaluación del Primer Día del Logro</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CRITERIOS_EBA_DEF.map((def, idx) => {
            const currentNivel = (criterios[idx] && criterios[idx].nivel) || '';
            return (
              <div key={def.key} style={{ padding: 14, borderRadius: 8, background: C.g50, border: `1px solid ${C.g200}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.navy1, marginBottom: 8 }}>{idx + 1}. {def.nombre}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  <div
                    onClick={() => updateCriterio(idx, 'C')}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 'C' ? C.red : C.g200}`,
                      background: currentNivel === 'C' ? C.redBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>[ C ] Inicio</div>
                    <div style={{ fontSize: 11.5, color: C.g500, lineHeight: 1.4 }}>{def.c}</div>
                  </div>

                  <div
                    onClick={() => updateCriterio(idx, 'B')}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 'B' ? C.amber : C.g200}`,
                      background: currentNivel === 'B' ? C.amberBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 4 }}>[ B ] Proceso</div>
                    <div style={{ fontSize: 11.5, color: C.g500, lineHeight: 1.4 }}>{def.b}</div>
                  </div>

                  <div
                    onClick={() => updateCriterio(idx, 'A')}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 'A' ? C.green : C.g200}`,
                      background: currentNivel === 'A' ? C.greenBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4 }}>[ A ] Logrado</div>
                    <div style={{ fontSize: 11.5, color: C.g500, lineHeight: 1.4 }}>{def.a}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compromiso del Director */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="checkCircle" size={16} style={{ marginRight: 6 }} /> Compromiso del Director(a)</h4>
        <textarea
          style={{ ...S.input, minHeight: 90 }}
          value={data.compromisoDirector || ''}
          onChange={e => onChange({ ...data, compromisoDirector: e.target.value })}
          placeholder="Escriba los compromisos asumidos por la dirección para la mejora continua..."
        />
      </div>
    </div>
  );
}
