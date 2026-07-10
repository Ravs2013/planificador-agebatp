import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const C = {
  red: "#B91C1C",
  amber: "#B45309",
  blue: "#2563A0",
  green: "#15803D",
  g300: "#CBD5E1"
};

const LEVEL_COLORS = { 1: C.red, 2: C.amber, 3: C.blue, 4: C.green };
const ROMAN_LABELS = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/**
 * Calcula el nivel predominante de una rubrica a partir de
 * los niveles individuales de sus aspectos (promedio redondeado).
 */
function nivelPredominante(aspectos) {
  if (!aspectos || aspectos.length === 0) return 0;
  const niveles = aspectos.map(a => a.nivel).filter(n => n != null && n > 0);
  if (niveles.length === 0) return 0;
  return Math.round(niveles.reduce((s, n) => s + n, 0) / niveles.length);
}

export default function GraficosFichaETP({ rubricasETP }) {
  if (!rubricasETP || rubricasETP.length === 0) return null;

  const data = rubricasETP.map((r, idx) => ({
    key: `R${idx + 1}`,
    name: `R${idx + 1}`,
    fullName: r.titulo || `Rubrica ${idx + 1}`,
    nivel: nivelPredominante(r.aspectos)
  }));

  const formatYAxis = (tick) => ROMAN_LABELS[tick] || '';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid #ccc', padding: '6px 10px', borderRadius: 4, fontSize: 12, maxWidth: 220 }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{item.key}. {item.fullName}</p>
          <p style={{ margin: '2px 0 0', color: LEVEL_COLORS[item.nivel] || '#555' }}>
            Nivel: {ROMAN_LABELS[item.nivel] || '--'} ({item.nivel || '--'})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fontWeight: 700 }}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={formatYAxis}
            tick={{ fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="nivel" fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={50}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={LEVEL_COLORS[entry.nivel] || C.g300} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
