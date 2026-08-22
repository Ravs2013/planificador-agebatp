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

const RUBRICAS_ETP_DEF = [
  {
    key: "organizacion",
    criterio: "Organización y logística",
    n4: "La feria está impecablemente organizada, con una clara señalización, un flujo de visitantes fluido y cuenta con apoyo de la policía y/o serenazgo de la municipalidad.",
    n3: "La organización es buena, con algunos problemas menores de logística que no afectan significativamente el evento y cuenta con personal de seguridad del CETPRO, debidamente identificados.",
    n2: "Hay problemas de organización evidentes, como falta de señalización o aglomeraciones, lo que dificulta la experiencia, el personal de seguridad del CETPRO se encuentra debidamente identificados.",
    n1: "La organización es deficiente que afecta negativamente a visitantes y expositores, la seguridad es apoyada por los profesores."
  },
  {
    key: "ambientes",
    criterio: "Ambientes de exposición (Stand o aulas)",
    n4: "Los ambientes de exposición están diseñados de manera creativa, son visualmente atractivos y reflejan profesionalidad.",
    n3: "Los ambientes de exposición son funcionales y están bien presentados, aunque podrían mejorar en creatividad o detalles.",
    n2: "Los ambientes de exposición son básicos y carecen de elementos que atraigan a los visitantes.",
    n1: "Los ambientes de exposición están desordenados, sucios o no presentan la información de manera clara."
  },
  {
    key: "expositores",
    criterio: "Presentación de los expositores",
    n4: "Los expositores (estudiantes) son entusiastas, conocen bien sus proyectos y se comunican eficazmente con los visitantes.",
    n3: "Los expositores se comunican de manera adecuada, en ocasiones los docentes participan.",
    n2: "Los expositores tienen dificultades para explicar sus proyectos, a menudo se apoyan con los docentes.",
    n1: "Los expositores no interactúan con los visitantes o la comunicación es nula."
  },
  {
    key: "evaluadores",
    criterio: "Evaluadores de proyectos",
    n4: "Se cuenta con evaluadores externos e internos de los proyectos de la feria.",
    n3: "Se gestionó la participación de evaluadores externos y participan solo evaluadores internos.",
    n2: "Los evaluadores de los proyectos de la feria son personal del CETPRO.",
    n1: "Los proyectos de la feria no son evaluados."
  },
  {
    key: "recursos",
    criterio: "Recursos y materiales",
    n4: "Se utilizan proyectos terminados y recursos audiovisuales (pantallas, folletos, etc.) de calidad y de manera efectiva para mejorar la exposición.",
    n3: "Se utilizan proyectos terminados y algunos recursos que complementan la exposición.",
    n2: "Los recursos son limitados o no se utilizan adecuadamente para complementar la exposición.",
    n1: "No se utilizan materiales o recursos para la exposición."
  }
];

export default function FichaEmprendimientoFormETP({ data = {}, onChange }) {
  const dg = data.datosGeneralesCETPRO || {};
  const dir = data.datosDirector || {};
  const rubricas = data.rubricas || RUBRICAS_ETP_DEF.map(r => ({ key: r.key, nivel: 0 }));

  const updateDG = (field, val) => {
    onChange({
      ...data,
      datosGeneralesCETPRO: { ...dg, [field]: val }
    });
  };

  const updateDir = (field, val) => {
    onChange({
      ...data,
      datosDirector: { ...dir, [field]: val }
    });
  };

  const updateRubrica = (idx, nivel) => {
    const updated = [...rubricas];
    updated[idx] = { ...updated[idx], nivel };
    onChange({ ...data, rubricas: updated });
  };

  let totalScore = 0;
  rubricas.forEach(r => { totalScore += (Number(r.nivel) || 0); });

  let nivelEvaluacion = "No evaluado";
  let badgeColor = C.g500;
  if (totalScore >= 18) { nivelEvaluacion = "Sobresaliente (18-20 pts)"; badgeColor = C.green; }
  else if (totalScore >= 14) { nivelEvaluacion = "Notable (14-17 pts)"; badgeColor = C.blue; }
  else if (totalScore >= 10) { nivelEvaluacion = "En Desarrollo (10-13 pts)"; badgeColor = C.amber; }
  else if (totalScore >= 5) { nivelEvaluacion = "Insuficiente (5-9 pts)"; badgeColor = C.red; }

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 20, border: `1px solid ${C.g200}`, marginBottom: 20 },
    title: { fontSize: "1rem", fontWeight: 700, color: C.navy1, marginBottom: 14, fontFamily: "'DM Serif Display',serif" },
    grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cols || 200}px, 1fr))`, gap: 14 }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.g300}`, fontSize: 13, fontFamily: "'DM Sans'" },
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase" },
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Datos Generales CETPRO */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="building" size={16} style={{ marginRight: 6 }} /> Datos Generales CETPRO</h4>
        <div style={S.grid(180)}>
          <div>
            <label style={S.label}>Nombre del CETPRO</label>
            <input style={S.input} type="text" value={dg.nombreCETPRO || ''} onChange={e => updateDG('nombreCETPRO', e.target.value)} placeholder="CETPRO..." />
          </div>
          <div>
            <label style={S.label}>Código Modular</label>
            <input style={S.input} type="text" value={dg.codigoModular || ''} onChange={e => updateDG('codigoModular', e.target.value)} placeholder="000000" />
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
                <input type="checkbox" checked={!!dg.cicloBasicoAuxiliar} onChange={e => updateDG('cicloBasicoAuxiliar', e.target.checked)} /> Básico / Auxiliar
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={!!dg.cicloMedioTecnico} onChange={e => updateDG('cicloMedioTecnico', e.target.checked)} /> Medio / Técnico
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

      {/* Datos del Director */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="user" size={16} style={{ marginRight: 6 }} /> Datos del Director /a</h4>
        <div style={S.grid(180)}>
          <div>
            <label style={S.label}>Apellidos y Nombres</label>
            <input style={S.input} type="text" value={dir.nombres || ''} onChange={e => updateDir('nombres', e.target.value)} placeholder="Director(a)..." />
          </div>
          <div>
            <label style={S.label}>DNI</label>
            <input style={S.input} type="text" maxLength={8} value={dir.dni || ''} onChange={e => updateDir('dni', e.target.value)} placeholder="DNI (8 dígitos)" />
          </div>
          <div>
            <label style={S.label}>Teléfono celular N°</label>
            <input style={S.input} type="text" value={dir.celular || ''} onChange={e => updateDir('celular', e.target.value)} placeholder="987654321" />
          </div>
          <div>
            <label style={S.label}>Correo Electrónico</label>
            <input style={S.input} type="email" value={dir.correo || ''} onChange={e => updateDir('correo', e.target.value)} placeholder="ejemplo@cetpro.edu.pe" />
          </div>
        </div>
      </div>

      {/* Rúbrica de la Feria de Emprendimiento */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h4 style={{ ...S.title, margin: 0 }}><Icon name="barChart" size={16} style={{ marginRight: 6 }} /> Rúbrica Feria de Emprendimiento</h4>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: C.g100, border: `1px solid ${C.g200}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy1 }}>Total: {totalScore} / 20</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor, background: C.white, padding: "3px 8px", borderRadius: 4, border: `1px solid ${badgeColor}` }}>{nivelEvaluacion}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {RUBRICAS_ETP_DEF.map((def, idx) => {
            const currentNivel = (rubricas[idx] && Number(rubricas[idx].nivel)) || 0;
            return (
              <div key={def.key} style={{ padding: 14, borderRadius: 8, background: C.g50, border: `1px solid ${C.g200}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.navy1, marginBottom: 8 }}>{idx + 1}. {def.criterio}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <div
                    onClick={() => updateRubrica(idx, 4)}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 4 ? C.green : C.g200}`,
                      background: currentNivel === 4 ? C.greenBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4 }}>Nivel 4 (4 pts)</div>
                    <div style={{ fontSize: 11, color: C.g500, lineHeight: 1.4 }}>{def.n4}</div>
                  </div>

                  <div
                    onClick={() => updateRubrica(idx, 3)}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 3 ? C.blue : C.g200}`,
                      background: currentNivel === 3 ? C.blueBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 4 }}>Nivel 3 (3 pts)</div>
                    <div style={{ fontSize: 11, color: C.g500, lineHeight: 1.4 }}>{def.n3}</div>
                  </div>

                  <div
                    onClick={() => updateRubrica(idx, 2)}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 2 ? C.amber : C.g200}`,
                      background: currentNivel === 2 ? C.amberBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 4 }}>Nivel 2 (2 pts)</div>
                    <div style={{ fontSize: 11, color: C.g500, lineHeight: 1.4 }}>{def.n2}</div>
                  </div>

                  <div
                    onClick={() => updateRubrica(idx, 1)}
                    style={{
                      padding: 10, borderRadius: 6, cursor: "pointer", border: `2px solid ${currentNivel === 1 ? C.red : C.g200}`,
                      background: currentNivel === 1 ? C.redBg : C.white, transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>Nivel 1 (1 pt)</div>
                    <div style={{ fontSize: 11, color: C.g500, lineHeight: 1.4 }}>{def.n1}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aspectos por Mejorar y Compromiso */}
      <div style={S.card}>
        <h4 style={S.title}><Icon name="edit" size={16} style={{ marginRight: 6 }} /> Aspectos por Mejorar y Compromisos</h4>
        <div style={S.grid(280)}>
          <div>
            <label style={S.label}>Aspectos por Mejorar</label>
            <textarea
              style={{ ...S.input, minHeight: 90 }}
              value={data.aspectosPorMejorar || ''}
              onChange={e => onChange({ ...data, aspectosPorMejorar: e.target.value })}
              placeholder="Describa los aspectos a fortalecer en la organización o presentación..."
            />
          </div>
          <div>
            <label style={S.label}>Compromiso de Mejora</label>
            <textarea
              style={{ ...S.input, minHeight: 90 }}
              value={data.compromisoMejora || ''}
              onChange={e => onChange({ ...data, compromisoMejora: e.target.value })}
              placeholder="Describa los compromisos asumidos por el CETPRO..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
