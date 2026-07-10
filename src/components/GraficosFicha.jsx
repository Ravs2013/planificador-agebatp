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

export default function GraficosFicha({ desempeno }) {
  if (!desempeno) return null;

  const data = [
    { key: 'involucraEstudiantes', name: 'Involucra', nivel: desempeno.involucraEstudiantes?.nivel || 0 },
    { key: 'promueveRazonamiento', name: 'Razonamiento', nivel: desempeno.promueveRazonamiento?.nivel || 0 },
    { key: 'evaluaProgreso', name: 'Evalúa Progreso', nivel: desempeno.evaluaProgreso?.nivel || 0 },
    { key: 'ambienteRespeto', name: 'Respeto', nivel: desempeno.ambienteRespeto?.nivel || 0 },
    { key: 'regulaComportamiento', name: 'Comportamiento', nivel: desempeno.regulaComportamiento?.nivel || 0 },
  ];

  const formatYAxis = (tick) => {
    return ROMAN_LABELS[tick] || '';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid #ccc', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
          <p style={{ margin: '2px 0 0', color: LEVEL_COLORS[item.nivel] || '#555' }}>
            Nivel: {ROMAN_LABELS[item.nivel] || '—'} ({item.nivel})
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
            tick={{ fontSize: 9, fontWeight: 600 }} 
          />
          <YAxis 
            domain={[1, 4]} 
            ticks={[1, 2, 3, 4]} 
            tickFormatter={formatYAxis} 
            tick={{ fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="nivel" fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={45}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={LEVEL_COLORS[entry.nivel] || C.g300} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
