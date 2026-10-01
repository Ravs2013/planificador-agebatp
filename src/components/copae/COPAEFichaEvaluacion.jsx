import React, { useState, useEffect, useRef } from 'react';
import Icon from '../Icon';
import { COPAE_CONFIG, CRITERIOS_EVALUACION_COPAE, NIVELES_VALORACION_COPAE } from '../../data/copaeConfig';
import { calcularPuntajeFicha, estaCompletaFicha } from '../../utils/copaeHelpers';
import { firmanteDelCasilleroCOPAE, esPreliminarCOPAE } from '../../utils/copaeFirmas';
import { saveCOPAEEvaluacion, deleteCOPAEEvaluacion } from '../../firebase/dbCOPAE';
import { generarFichaIndividualCOPAEPDF } from '../../pdf/generarFichaCOPAEPDF';

/**
 * INSTRUMENTO DE EVALUACIÓN OFICIAL — PRECONGRESO DE COPAE – UGEL 03
 * «Mi voz, mi propuesta»
 */
export default function COPAEFichaEvaluacion({
  ceba,
  evaluacionInicial = null,
  numeroJurado = 1,
  onCambiarJurado,
  puedeCambiarJurado = true,
  panel = null,
  usuario = null,
  onVolver,
  onToast
}) {
  const [puntajes, setPuntajes] = useState({});
  const [esNsp, setEsNsp] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState(COPAE_CONFIG.fechaPorDefecto);
  const [guardando, setGuardando] = useState(false);
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  // Inicializar estado al cambiar de CEBA o de Jurado
  useEffect(() => {
    if (evaluacionInicial) {
      setPuntajes(evaluacionInicial.puntajes || {});
      setEsNsp(Boolean(evaluacionInicial.esNsp));
      setObservaciones(evaluacionInicial.observaciones || '');
      setFecha(evaluacionInicial.fecha || COPAE_CONFIG.fechaPorDefecto);
    } else {
      setPuntajes({});
      setEsNsp(false);
      setObservaciones('');
      setFecha(COPAE_CONFIG.fechaPorDefecto);
    }
  }, [ceba?.id, numeroJurado, evaluacionInicial]);

  const puntajeTotal = calcularPuntajeFicha(puntajes, esNsp);
  const completa = estaCompletaFicha(puntajes, esNsp);
  const firmante = firmanteDelCasilleroCOPAE(panel, numeroJurado);
  const preliminar = esPreliminarCOPAE(panel);

  const handleSeleccionarNivel = (criterioId, nivel) => {
    if (esNsp) setEsNsp(false);
    setPuntajes(prev => {
      const nuevo = { ...prev };
      if (nuevo[criterioId] === nivel) {
        delete nuevo[criterioId];
      } else {
        nuevo[criterioId] = nivel;
      }
      return nuevo;
    });
  };

  const handleGuardar = async () => {
    if (!ceba) return;
    try {
      setGuardando(true);
      await saveCOPAEEvaluacion({
        cebaId: ceba.id,
        nombreCeba: ceba.nombre,
        codigoModular: ceba.codigoModular || '',
        numeroJurado,
        puntajes,
        esNsp,
        observaciones,
        fecha
      }, { usuario });
      if (onToast) onToast('Ficha guardada exitosamente.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast(err.message || 'Error al guardar la evaluación.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleMarcarNsp = async () => {
    if (window.confirm('¿Desea marcar incomparecencia (NSP) para este CEBA? La calificación será 0 puntos.')) {
      setEsNsp(true);
      setPuntajes({});
      try {
        setGuardando(true);
        await saveCOPAEEvaluacion({
          cebaId: ceba.id,
          nombreCeba: ceba.nombre,
          codigoModular: ceba.codigoModular || '',
          numeroJurado,
          puntajes: {},
          esNsp: true,
          observaciones: 'INCOMPARECENCIA (NSP) — EL CEBA NO SE PRESENTÓ',
          fecha
        }, { usuario });
        if (onToast) onToast('Marcado como NSP (Incomparecencia).', 'info');
      } catch (err) {
        console.error(err);
      } finally {
        setGuardando(false);
      }
    }
  };

  const handleLimpiarFicha = async () => {
    if (window.confirm('¿Está seguro de limpiar esta ficha de evaluación? Se eliminarán los puntajes registrados.')) {
      setPuntajes({});
      setEsNsp(false);
      setObservaciones('');
      try {
        setGuardando(true);
        await deleteCOPAEEvaluacion(ceba.id, numeroJurado);
        if (onToast) onToast('Ficha de evaluación limpiada.', 'info');
      } catch (err) {
        console.error(err);
      } finally {
        setGuardando(false);
      }
    }
  };

  const handleDescargarPDF = async () => {
    try {
      setDescargandoPDF(true);
      const doc = await generarFichaIndividualCOPAEPDF({
        ceba,
        evaluacion: {
          puntajes,
          esNsp,
          observaciones,
          fecha
        },
        panel,
        numeroJurado
      });
      const nomLimpio = (ceba?.nombre || 'CEBA').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`FICHA_COPAE_J${numeroJurado}_${nomLimpio}.pdf`);
      if (onToast) onToast('PDF de la ficha descargado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Error generando PDF de la ficha.', 'error');
    } finally {
      setDescargandoPDF(false);
    }
  };

  if (!ceba) return null;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}
    >
      {/* Barra Superior de Navegación y Acciones */}
      <div
        style={{
          padding: '14px 20px',
          backgroundColor: '#1E3A8A',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onVolver}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <Icon name="arrowLeft" size={14} />
            Volver a la lista
          </button>

          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {ceba.nombre}
            </h2>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {ceba.codigoModular ? `Cód. Modular: ${ceba.codigoModular}` : 'CEBA Participante'} · Precongreso COPAE UGEL 03
            </div>
          </div>
        </div>

        {/* Conmutador Jurado 1 / Jurado 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {puedeCambiarJurado ? (
            <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 8 }}>
              {[1, 2].map(slot => (
                <button
                  key={slot}
                  onClick={() => onCambiarJurado(slot)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: numeroJurado === slot ? '#FFFFFF' : 'transparent',
                    color: numeroJurado === slot ? '#1E3A8A' : '#FFFFFF',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Jurado {slot}
                </button>
              ))}
            </div>
          ) : (
            <span
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Evaluando como Jurado N.° {numeroJurado}
            </span>
          )}

          <button
            onClick={handleDescargarPDF}
            disabled={descargandoPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <Icon name="download" size={14} />
            {descargandoPDF ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Contenido de la Ficha */}
      <div style={{ padding: 24, maxWidth: 1080, margin: '0 auto' }}>
        {/* Cabecera Oficial del Instrumento */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '2px solid #E2E8F0'
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', letterSpacing: 1 }}>
            UGEL 03 · DRELM · ÁREA DE GESTIÓN DE LA EDUCACIÓN BÁSICA ALTERNATIVA Y TÉCNICO-PRODUCTIVA
          </div>
          <h1 style={{ margin: '6px 0 2px 0', fontSize: 19, fontWeight: 800, color: '#1E3A8A' }}>
            INSTRUMENTO DE EVALUACIÓN
          </h1>
          <h3 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
            PRECONGRESO DE COPAE – UGEL 03
          </h3>
          <div style={{ fontStyle: 'italic', fontSize: 14, color: '#D97706', fontWeight: 600 }}>
            «Mi voz, mi propuesta»
          </div>
        </div>

        {/* Datos de Identificación */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
            marginBottom: 24,
            backgroundColor: '#F8FAFC',
            padding: 16,
            borderRadius: 8,
            border: '1px solid #CBD5E1'
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 2 }}>
              INSTITUCIÓN EDUCATIVA (CEBA):
            </label>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              {ceba.nombre}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 2 }}>
              FECHA DE EVALUACIÓN:
            </label>
            <input
              type="text"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                width: 160
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 2 }}>
              JURADO EVALUADOR ASIGNADO:
            </label>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A' }}>
              Jurado Evaluador N.° {numeroJurado}
              {firmante?.nombreCompleto && ` — ${firmante.nombreCompleto}`}
            </div>
          </div>
        </div>

        {/* Sección I: Criterios de Evaluación */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E3A8A' }}>
              I. CRITERIOS DE EVALUACIÓN
            </h3>
            <span style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
              Escala de valoración: 4 = Destacado | 3 = Logrado | 2 = En proceso | 1 = Inicio (Máx. 20 pts)
            </span>
          </div>

          {/* Tabla de Criterios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CRITERIOS_EVALUACION_COPAE.map(criterio => {
              const valorSeleccionado = esNsp ? 0 : Number(puntajes[criterio.id] || 0);

              return (
                <div
                  key={criterio.id}
                  style={{
                    backgroundColor: valorSeleccionado > 0 ? '#FFFFFF' : '#FAFAFA',
                    border: `1.5px solid ${valorSeleccionado > 0 ? '#93C5FD' : '#E2E8F0'}`,
                    borderRadius: 10,
                    padding: 14,
                    boxShadow: valorSeleccionado > 0 ? '0 2px 6px rgba(59, 130, 246, 0.08)' : 'none'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          backgroundColor: valorSeleccionado > 0 ? '#1E3A8A' : '#64748B',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        {criterio.numero}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {criterio.nombre}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: valorSeleccionado > 0 ? '#1D4ED8' : '#94A3B8' }}>
                      {valorSeleccionado > 0 ? `${valorSeleccionado} pts` : 'Pendiente'}
                    </div>
                  </div>

                  {/* Opciones de los 4 Niveles */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: 8
                    }}
                  >
                    {NIVELES_VALORACION_COPAE.map(nivel => {
                      const activo = valorSeleccionado === nivel.valor;

                      return (
                        <button
                          key={nivel.valor}
                          type="button"
                          onClick={() => handleSeleccionarNivel(criterio.id, nivel.valor)}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: `2px solid ${activo ? nivel.color : '#E2E8F0'}`,
                            backgroundColor: activo ? nivel.bg : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 6,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: activo ? nivel.color : '#334155' }}>
                              {nivel.etiqueta}
                            </span>
                            {activo && (
                              <Icon name="check" size={14} color={nivel.color} />
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: '#475569', lineHeight: 1.35 }}>
                            {criterio.descriptores[nivel.valor]}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Puntaje Final */}
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #3B82F6',
            borderRadius: 10,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>
              VALORACIÓN ACUMULADA — JURADO N.° {numeroJurado}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1E3A8A' }}>
              Puntaje final del estudiante:{' '}
              <span style={{ fontSize: 24, color: esNsp ? '#DC2626' : '#2563EB' }}>
                {puntajeTotal}
              </span>{' '}
              / {COPAE_CONFIG.puntajeMaximoPorJurado} puntos
            </div>
            {esNsp && (
              <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, marginTop: 2 }}>
                INCOMPARECENCIA (NSP) — Puntuación 0
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: completa ? '#DCFCE7' : '#FEF3C7',
                color: completa ? '#15803D' : '#B45309'
              }}
            >
              {completa ? 'Ficha Completa' : 'Ficha en proceso'}
            </span>
          </div>
        </div>

        {/* Observaciones del Jurado */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Observaciones del Jurado (opcional):
          </label>
          <textarea
            rows={3}
            placeholder="Ingrese sugerencias, retroalimentación o consideraciones especiales para el CEBA..."
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Bloque de Firma Resuelta */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Suscripción oficial del jurado
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              {firmante?.nombreCompleto || `Jurado Evaluador N.° ${numeroJurado}`}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {firmante?.dni ? `DNI N.° ${firmante.dni}` : 'DNI pendiente'} · {firmante?.cargo || 'Jurado Evaluador'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {firmante?.firmaDataUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={firmante.firmaDataUrl}
                  alt="Firma Jurado"
                  style={{ maxHeight: 50, maxWidth: 140, objectFit: 'contain' }}
                />
                <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                  {preliminar ? 'Firma en borrador' : 'Firma sellada oficialmente'}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 12, color: '#F59E0B', fontStyle: 'italic' }}>
                Firma pendiente en el Panel de Firmas
              </span>
            )}
          </div>
        </div>

        {/* Barra Inferior de Guardado y Acciones */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid #E2E8F0'
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleMarcarNsp}
              type="button"
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #FECACA',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Incomparecencia (NSP)
            </button>

            <button
              onClick={handleLimpiarFicha}
              type="button"
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Limpiar Ficha
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onVolver}
              type="button"
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>

            <button
              onClick={handleGuardar}
              disabled={guardando}
              type="button"
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#1E3A8A',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon name="check" size={16} />
              {guardando ? 'Guardando...' : 'Guardar Calificación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
