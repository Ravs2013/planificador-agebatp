import React, { useState } from 'react';
import Icon from '../Icon';
import { evaluacionIdCOPAE, calcularPuntajeFicha, estaCompletaFicha } from '../../utils/copaeHelpers';

/**
 * BANDEJA / SELECTOR DE LOS 19 CEBAs PARTICIPANTES
 * Muestra el estado de calificación de Jurado 1 y Jurado 2 en cada CEBA.
 */
export default function COPAESelectorCEBA({
  cebas = [],
  evaluaciones = [],
  seleccionadoId = null,
  onSeleccionar,
  numeroJurado = 1
}) {
  const [busqueda, setBusqueda] = useState('');

  const evalMap = new Map();
  evaluaciones.forEach(ev => {
    if (ev && ev.cebaId && ev.numeroJurado) {
      evalMap.set(evaluacionIdCOPAE(ev.cebaId, ev.numeroJurado), ev);
    }
  });

  const filtrados = cebas.filter(c => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.codigoModular && c.codigoModular.includes(q)) ||
      String(c.orden).includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barra de Filtro y Estadísticas Rápidas */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Icon name="search" size={18} color="#64748B" />
          <input
            type="text"
            placeholder="Buscar por nombre de CEBA o código modular..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: 13
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: 4
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
          <span>Total CEBAs: <strong>{cebas.length}</strong></span>
          <span>·</span>
          <span>Mostrando: <strong>{filtrados.length}</strong></span>
        </div>
      </div>

      {/* Grid de Tarjetas de CEBAs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14
        }}
      >
        {filtrados.map(ceba => {
          const evJ1 = evalMap.get(evaluacionIdCOPAE(ceba.id, 1));
          const evJ2 = evalMap.get(evaluacionIdCOPAE(ceba.id, 2));

          const j1Nsp = Boolean(evJ1?.esNsp);
          const j2Nsp = Boolean(evJ2?.esNsp);

          const j1Completo = evJ1 && (j1Nsp || estaCompletaFicha(evJ1.puntajes, false));
          const j2Completo = evJ2 && (j2Nsp || estaCompletaFicha(evJ2.puntajes, false));

          const puntajeJ1 = j1Completo ? calcularPuntajeFicha(evJ1.puntajes, j1Nsp) : null;
          const puntajeJ2 = j2Completo ? calcularPuntajeFicha(evJ2.puntajes, j2Nsp) : null;

          const ambosCompletos = j1Completo && j2Completo;
          const esSeleccionado = seleccionadoId === ceba.id;

          let puntajeTotal = null;
          if (puntajeJ1 !== null && puntajeJ2 !== null) {
            puntajeTotal = puntajeJ1 + puntajeJ2;
          }

          return (
            <div
              key={ceba.id}
              onClick={() => onSeleccionar(ceba.id)}
              style={{
                backgroundColor: esSeleccionado ? '#EFF6FF' : '#FFFFFF',
                border: `2px solid ${esSeleccionado ? '#2563EB' : (ambosCompletos ? '#10B981' : '#E2E8F0')}`,
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: esSeleccionado ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              {/* Encabezado de la tarjeta */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: '#1E293B',
                      color: '#FFFFFF',
                      padding: '2px 7px',
                      borderRadius: 4
                    }}
                  >
                    N.° {String(ceba.orden).padStart(2, '0')}
                  </span>

                  {ceba.codigoModular && (
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                      Cód: {ceba.codigoModular}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0F172A',
                    lineHeight: 1.3,
                    minHeight: 38
                  }}
                >
                  {ceba.nombre}
                </div>
              </div>

              {/* Estado de Jurado 1 y Jurado 2 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  backgroundColor: '#F8FAFC',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  fontSize: 11
                }}
              >
                {/* Jurado 1 */}
                <div>
                  <div style={{ color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Jurado 1:</div>
                  {j1Completo ? (
                    <span style={{ color: j1Nsp ? '#B91C1C' : '#15803D', fontWeight: 700 }}>
                      {j1Nsp ? 'NSP (0 pts)' : `${puntajeJ1} / 20`}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin calificar</span>
                  )}
                </div>

                {/* Jurado 2 */}
                <div>
                  <div style={{ color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Jurado 2:</div>
                  {j2Completo ? (
                    <span style={{ color: j2Nsp ? '#B91C1C' : '#15803D', fontWeight: 700 }}>
                      {j2Nsp ? 'NSP (0 pts)' : `${puntajeJ2} / 20`}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin calificar</span>
                  )}
                </div>
              </div>

              {/* Pie de la Tarjeta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  borderTop: '1px solid #F1F5F9'
                }}
              >
                <div style={{ fontSize: 12 }}>
                  {puntajeTotal !== null ? (
                    <span style={{ fontWeight: 700, color: '#1E3A8A' }}>
                      Total: {puntajeTotal} / 40 pts
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>Evaluación pendiente</span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {esSeleccionado ? 'Evaluando...' : 'Evaluar'}
                  <Icon name="chevronRight" size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
