import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../Icon';
import { COPAE_CONFIG } from '../../data/copaeConfig';
import { firmanteDelCasilleroCOPAE, esPreliminarCOPAE } from '../../utils/copaeFirmas';
import { guardarObservacionFinalCOPAE } from '../../firebase/dbCOPAE';
import { generarConsolidadoCOPAEPDF } from '../../pdf/generarFichaCOPAEPDF';

/**
 * SECCIÓN II: CONSOLIDADO DEL JURADO
 * Muestra el escrutinio de los 19 CEBAs, con el 1.° Puesto Ganador,
 * los 7 Clasificados a la siguiente etapa, observación final del jurado y las 2 firmas.
 */
export default function COPAEConsolidado({
  filas = [],
  tieneEmpateTop1 = false,
  tieneEmpateCorteTop7 = false,
  observacionFinal = '',
  panel = null,
  usuario = null,
  onToast
}) {
  const [obsLocal, setObsLocal] = useState(observacionFinal || '');
  const [guardandoObs, setGuardandoObs] = useState(false);
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  React.useEffect(() => {
    setObsLocal(observacionFinal || '');
  }, [observacionFinal]);

  const preliminar = esPreliminarCOPAE(panel);
  const firmanteJ1 = firmanteDelCasilleroCOPAE(panel, 1);
  const firmanteJ2 = firmanteDelCasilleroCOPAE(panel, 2);

  const handleGuardarObs = async () => {
    try {
      setGuardandoObs(true);
      await guardarObservacionFinalCOPAE(obsLocal, usuario);
      if (onToast) onToast('Observación final del jurado guardada.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Error al guardar la observación.', 'error');
    } finally {
      setGuardandoObs(false);
    }
  };

  const handleDescargarPDF = async () => {
    try {
      setDescargandoPDF(true);
      const doc = await generarConsolidadoCOPAEPDF({
        filas,
        observacionFinal: obsLocal,
        panel
      });
      doc.save('CONSOLIDADO_OFICIAL_COPAE_UGEL03.pdf');
      if (onToast) onToast('PDF del consolidado oficial descargado.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Error generando PDF del consolidado.', 'error');
    } finally {
      setDescargandoPDF(false);
    }
  };

  const handleExportarExcel = () => {
    try {
      const data = filas.map(f => ({
        'PUESTO': f.puesto !== null ? `${f.puesto}.°` : '—',
        'CEBA': f.nombreCeba,
        'CÓDIGO MODULAR': f.codigoModular || '—',
        'JURADO 1 (/20)': f.puntajeJ1 !== null ? f.puntajeJ1 : (f.evJ1?.esNsp ? '0 (NSP)' : 'Pendiente'),
        'JURADO 2 (/20)': f.puntajeJ2 !== null ? f.puntajeJ2 : (f.evJ2?.esNsp ? '0 (NSP)' : 'Pendiente'),
        'PUNTAJE TOTAL (/40)': f.puntajeTotal !== null ? f.puntajeTotal : '—',
        'PROMEDIO': f.promedio !== null ? f.promedio : '—',
        'RESULTADO / CLASIFICACIÓN': f.estadoClasificacion || 'PARTICIPANTE'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consolidado COPAE');
      XLSX.writeFile(wb, 'RESULTADOS_OFICIALES_COPAE_UGEL03.xlsx');
      if (onToast) onToast('Excel de resultados exportado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Error exportando Excel.', 'error');
    }
  };

  const ganador = filas.length > 0 && filas[0].puesto === 1 && filas[0].puntajeTotal > 0 ? filas[0] : null;
  const clasificadosTop7 = filas.filter(f => f.puesto <= COPAE_CONFIG.cuposSiguienteRonda && f.puntajeTotal > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Alertas de Empates si aplican */}
      {tieneEmpateTop1 && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Icon name="alertTriangle" size={24} color="#D97706" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
              Atención: Empate detectado en el 1.° Puesto (Ganador)
            </div>
            <div style={{ fontSize: 12, color: '#78350F' }}>
              Dos o más CEBAs comparten el puntaje más alto. Los 2 jurados evaluadores deben acordar el desempate dirimente conforme a las bases.
            </div>
          </div>
        </div>
      )}

      {tieneEmpateCorteTop7 && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#DBEAFE',
            border: '2px solid #3B82F6',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Icon name="info" size={24} color="#1D4ED8" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>
              Empate en la línea de clasificación al Top 7 (Puesto 7 y 8)
            </div>
            <div style={{ fontSize: 12, color: '#1E3A8A' }}>
              Existe coincidencia de puntajes en el límite de los 7 cupos que pasan a la siguiente ronda.
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta de Resumen / Podio Destacado */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16
        }}
      >
        {/* Ganador */}
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '2px solid #10B981',
            borderRadius: 12,
            padding: 18,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="award" size={18} color="#065F46" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Ganador — 1.° Puesto
            </span>
          </div>
          {ganador ? (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#064E3B', marginBottom: 4 }}>
                {ganador.nombreCeba}
              </div>
              <div style={{ fontSize: 13, color: '#047857' }}>
                Puntaje Total: <strong>{ganador.puntajeTotal} / 40 pts</strong> (J1: {ganador.puntajeJ1} · J2: {ganador.puntajeJ2})
              </div>
              <div style={{ fontSize: 11, color: '#065F46', marginTop: 4 }}>
                {ganador.codigoModular ? `Cód. Modular: ${ganador.codigoModular}` : ''}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6EE7B7', fontStyle: 'italic' }}>
              Pendiente de calificación completa...
            </div>
          )}
        </div>

        {/* Clasificados Top 7 */}
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #3B82F6',
            borderRadius: 12,
            padding: 18,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="check" size={18} color="#1E40AF" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pasan a la siguiente ronda (Top 7)
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#1E3A8A', marginBottom: 6 }}>
            {clasificadosTop7.length} de {COPAE_CONFIG.cuposSiguienteRonda} clasificados calificados:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {clasificadosTop7.map(f => (
              <span
                key={f.cebaId}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#DBEAFE',
                  color: '#1E40AF',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #BFDBFE'
                }}
              >
                {f.puesto}.° {f.nombreCeba.split(' ')[0]} ({f.puntajeTotal} pts)
              </span>
            ))}
            {clasificadosTop7.length === 0 && (
              <span style={{ fontSize: 12, color: '#93C5FD', fontStyle: 'italic' }}>
                Calificaciones en proceso...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Resultados (Todos los 19 CEBAs) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E3A8A' }}>
              Consolidado General de Evaluación — Precongreso COPAE 2026
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748B' }}>
              Escrutinio completo de los 19 CEBAs participantes ordenados por puesto obtenido
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleExportarExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Icon name="fileText" size={14} />
              Exportar Excel
            </button>

            <button
              onClick={handleDescargarPDF}
              disabled={descargandoPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                backgroundColor: '#1E3A8A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Icon name="download" size={14} />
              {descargandoPDF ? 'Generando...' : 'Descargar Consolidado PDF'}
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', textAlign: 'center' }}>
                <th style={{ padding: '10px 8px', width: 60 }}>Puesto</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>CEBA Participante</th>
                <th style={{ padding: '10px 8px', width: 95 }}>Jurado 1 (/20)</th>
                <th style={{ padding: '10px 8px', width: 95 }}>Jurado 2 (/20)</th>
                <th style={{ padding: '10px 10px', width: 110 }}>Puntaje Total (/40)</th>
                <th style={{ padding: '10px 10px', width: 85 }}>Promedio</th>
                <th style={{ padding: '10px 14px', width: 170 }}>Resultado / Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => {
                const esGanador = fila.puesto === 1 && fila.puntajeTotal > 0;
                const esTop7 = fila.puesto <= COPAE_CONFIG.cuposSiguienteRonda && fila.puntajeTotal > 0;

                let bgFila = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                if (esGanador) bgFila = '#ECFDF5';
                else if (esTop7) bgFila = '#EFF6FF';

                return (
                  <tr
                    key={fila.cebaId}
                    style={{
                      backgroundColor: bgFila,
                      borderBottom: '1px solid #E2E8F0',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, fontSize: 13, color: esGanador ? '#065F46' : '#1E293B' }}>
                      {fila.puntajeTotal !== null ? `${fila.puesto}.°` : '—'}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: esGanador ? 800 : 700, color: esGanador ? '#064E3B' : '#0F172A' }}>
                        {fila.nombreCeba}
                      </div>
                      {fila.codigoModular && (
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Cód. Modular: {fila.codigoModular}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {fila.puntajeJ1 !== null ? (
                        <span style={{ fontWeight: 700, color: '#1E3A8A' }}>{fila.puntajeJ1}</span>
                      ) : fila.evJ1?.esNsp ? (
                        <span style={{ color: '#DC2626', fontWeight: 700 }}>NSP (0)</span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {fila.puntajeJ2 !== null ? (
                        <span style={{ fontWeight: 700, color: '#1E3A8A' }}>{fila.puntajeJ2}</span>
                      ) : fila.evJ2?.esNsp ? (
                        <span style={{ color: '#DC2626', fontWeight: 700 }}>NSP (0)</span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      {fila.puntajeTotal !== null ? (
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: esGanador ? '#065F46' : '#1D4ED8'
                          }}
                        >
                          {fila.puntajeTotal} pts
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Pendiente</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 10px', textAlign: 'center', color: '#475569' }}>
                      {fila.promedio !== null ? fila.promedio : '—'}
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {esGanador ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: 11
                          }}
                        >
                          1.° PUESTO (GANADOR)
                        </span>
                      ) : esTop7 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            backgroundColor: '#3B82F6',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: 11
                          }}
                        >
                          CLASIFICADO (TOP 7)
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          {fila.estadoClasificacion}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observación Final del Jurado */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          padding: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: '#1E3A8A' }}>
            OBSERVACIÓN FINAL DEL JURADO
          </label>
          <button
            onClick={handleGuardarObs}
            disabled={guardandoObs}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1E3A8A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {guardandoObs ? 'Guardando...' : 'Guardar Observación'}
          </button>
        </div>
        <textarea
          rows={3}
          placeholder="Escriba aquí la observación o acuerdo final de la comisión evaluadora para que conste en el consolidado oficial..."
          value={obsLocal}
          onChange={e => setObsLocal(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            fontSize: 13,
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Bloque Simétrico de las 2 Firmas del Jurado */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          padding: 24,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E3A8A' }}>
            SUSCRIPCIÓN OFICIAL DE LA TERCERA COMISIÓN EVALUADORA
          </div>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {preliminar
              ? 'Documento en borrador: sellar el Panel de Firmas para oficializar los resultados.'
              : 'Firmas digitales validadas y selladas conforme a bases.'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24
          }}
        >
          {/* Jurado 1 */}
          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              backgroundColor: '#F8FAFC'
            }}
          >
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              {firmanteJ1?.firmaDataUrl ? (
                <img
                  src={firmanteJ1.firmaDataUrl}
                  alt="Firma Jurado 1"
                  style={{ maxHeight: 55, maxWidth: 160, objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                  Firma pendiente en el Panel
                </span>
              )}
            </div>
            <div style={{ borderTop: '1px solid #1E3A8A', paddingTop: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                {firmanteJ1?.nombreCompleto || 'Jurado Evaluador N.° 1'}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>
                {firmanteJ1?.dni ? `DNI N.° ${firmanteJ1.dni}` : 'DNI pendiente'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                {firmanteJ1?.cargo || 'Jurado Evaluador 1'}
              </div>
            </div>
          </div>

          {/* Jurado 2 */}
          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              backgroundColor: '#F8FAFC'
            }}
          >
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              {firmanteJ2?.firmaDataUrl ? (
                <img
                  src={firmanteJ2.firmaDataUrl}
                  alt="Firma Jurado 2"
                  style={{ maxHeight: 55, maxWidth: 160, objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                  Firma pendiente en el Panel
                </span>
              )}
            </div>
            <div style={{ borderTop: '1px solid #1E3A8A', paddingTop: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                {firmanteJ2?.nombreCompleto || 'Jurado Evaluador N.° 2'}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>
                {firmanteJ2?.dni ? `DNI N.° ${firmanteJ2.dni}` : 'DNI pendiente'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                {firmanteJ2?.cargo || 'Jurado Evaluador 2'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
