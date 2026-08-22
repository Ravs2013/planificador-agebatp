import React, { useState, useEffect, useMemo } from 'react';
import { getCombinacionesUGEL03, getDisciplinaUGEL03 } from '../data/juegosFloralesUGEL03';
import { PARTICIPANTES_SICE } from '../data/juegosFloralesPadronSICE';
import { C } from '../data/juegosFloralesCatalogos';
import {
  subscribeJFParticipantes,
  subscribeJFEvaluaciones,
  subscribeJFConsolidados
} from '../firebase/dbJuegosFlorales';

import { filtrarEvaluacionesValidas } from '../utils/juegosFloralesHelpers';

export default function JFProgramacionTab() {
  const combinaciones = useMemo(() => getCombinacionesUGEL03(), []);

  const [fsParticipantes, setFsParticipantes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [consolidados, setConsolidados] = useState([]);

  useEffect(() => {
    const unSubP = subscribeJFParticipantes({}, setFsParticipantes);
    const unSubE = subscribeJFEvaluaciones({}, setEvaluaciones);
    const unSubC = subscribeJFConsolidados({}, setConsolidados);
    return () => {
      unSubP();
      unSubE();
      unSubC();
    };
  }, []);

  const participantes = useMemo(() => {
    const map = new Map();
    PARTICIPANTES_SICE.forEach(p => {
      const cod = p.codigo || p.id;
      map.set(cod, {
        id: cod,
        codigoParticipante: cod,
        institucionNombre: p.iiee,
        iiee: p.iiee,
        categoria: p.categoria,
        disciplinaId: p.disciplinaId,
        tituloObra: p.titulo,
        seudonimo: p.seudonimo,
        origen: 'sice'
      });
    });
    fsParticipantes.forEach(p => {
      const cod = p.codigoParticipante || p.codigo || p.id;
      map.set(cod, p);
    });
    return Array.from(map.values());
  }, [fsParticipantes]);

  // Calcular métricas por combinación (disciplina + categoría)
  const tablaDatos = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);

    return combinaciones.map(comb => {
      const disc = getDisciplinaUGEL03(comb.disciplinaId);

      // Participantes en esta combinación
      const partsComb = participantes.filter(
        p => p.disciplinaId === comb.disciplinaId && p.categoria === comb.categoria
      );
      const totalEsperadas = partsComb.length * 3;

      // Evaluaciones válidas y firmadas en esta combinación
      const evsValidasComb = filtrarEvaluacionesValidas(evaluaciones, comb.disciplinaId, comb.categoria, partsComb);
      const evsFirmadas = evsValidasComb.filter(e => e.estado === "firmada");
      const firmadasCount = evsFirmadas.length;

      // Consolidado A10 de esta combinación
      const docId = `JFEN-2026__UGEL__${comb.disciplinaId}__${comb.categoria}`;
      const cons = consolidados.find(c => c.id === docId);
      const estadoA10 = cons ? (cons.estado === "cerrado" ? "Cerrado" : "Pendiente") : "Sin datos";

      // Estado derivado
      let estadoGlobal = "Programado";
      if (partsComb.length === 0) {
        estadoGlobal = "Sin inscritos";
      } else if (estadoA10 === "Cerrado") {
        estadoGlobal = "Concluido";
      } else if (firmadasCount > 0 || comb.fecha <= hoyStr) {
        estadoGlobal = "En evaluación";
      }

      return {
        ...comb,
        label: disc?.label || comb.label,
        horario: disc?.horaInicio && disc?.horaFin ? `${disc.horaInicio}–${disc.horaFin}` : "—",
        fichasTexto: partsComb.length === 0 ? "Sin inscritos" : totalEsperadas > 0 ? `${firmadasCount} de ${totalEsperadas} firmadas` : "0 registradas",
        estadoA10,
        estadoGlobal
      };
    });
  }, [combinaciones, participantes, evaluaciones, consolidados]);

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, maxWidth: 1100, margin: '0 auto', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, color: C.navy2, margin: 0 }}>
          PROGRAMACIÓN OFICIAL JFEN 2026 — ETAPA UGEL 03
        </h3>
        <div style={{ fontSize: 12, color: C.g500, marginTop: 2 }}>
          Control de avance real de las 13 disciplinas y 37 combinaciones programadas en la etapa UGEL 03.
        </div>
        <div style={{ fontSize: 11, color: C.navy4, background: C.g50, border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 6, marginTop: 8 }}>
          Pintura categoría D se habilita conforme al numeral 9.3.2 de las bases y a los 10 participantes inscritos en SICE, aunque no figura en el cuadro del Comunicado 01.
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: `1px solid ${C.border}` }}>
          <thead>
            <tr style={{ background: C.navy3, color: C.white, textAlign: 'left' }}>
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>DISCIPLINA</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>MODALIDAD</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>CAT.</th>
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>FECHA</th>
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}` }}>SEDE</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>HORARIO</th>
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>FICHAS D1</th>
              <th style={{ padding: '10px 8px', border: `1px solid ${C.border}`, textAlign: 'center' }}>A10</th>
              <th style={{ padding: '10px 10px', border: `1px solid ${C.border}`, textAlign: 'center' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {tablaDatos.map((row, idx) => {
              const isAlt = idx % 2 === 1;
              const bgA10 = row.estadoA10 === "Cerrado" ? "#F0FDF4" : row.estadoA10 === "Pendiente" ? "#FFFBEB" : C.white;
              const colorA10 = row.estadoA10 === "Cerrado" ? C.green : row.estadoA10 === "Pendiente" ? C.amber : C.g500;

              const bgEstado = row.estadoGlobal === "Sin inscritos" ? "#F3F4F6" : row.estadoGlobal === "Concluido" ? "#F0FDF4" : row.estadoGlobal === "En evaluación" ? "#FFFBEB" : "#F8FAFC";
              const colorEstado = row.estadoGlobal === "Sin inscritos" ? "#6B7280" : row.estadoGlobal === "Concluido" ? C.green : row.estadoGlobal === "En evaluación" ? C.amber : C.navy4;

              return (
                <tr key={`${row.disciplinaId}__${row.categoria}`} style={{ background: isAlt ? C.g50 : C.white }}>
                  <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontWeight: 700, color: C.navy2 }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontSize: 11, color: C.g500 }}>
                    {row.modalidad === 'presencial' ? 'Presencial' : 'No presencial'}
                  </td>
                  <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 700, color: C.navy3 }}>
                    {row.categoria}
                  </td>
                  <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono'", fontSize: 11 }}>
                    {row.fecha}
                  </td>
                  <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, fontSize: 11, color: C.g800 }}>
                    {row.sede}
                  </td>
                  <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: "'JetBrains Mono'", fontSize: 11 }}>
                    {row.horario}
                  </td>
                  <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.navy2 }}>
                    {row.fichasTexto}
                  </td>
                  <td style={{ padding: '8px 8px', border: `1px solid ${C.border}`, textAlign: 'center', background: bgA10, color: colorA10, fontWeight: 700, fontSize: 11 }}>
                    {row.estadoA10}
                  </td>
                  <td style={{ padding: '8px 10px', border: `1px solid ${C.border}`, textAlign: 'center', background: bgEstado, color: colorEstado, fontWeight: 700, fontSize: 11 }}>
                    {row.estadoGlobal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
