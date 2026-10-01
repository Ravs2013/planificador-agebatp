import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import FirmaDigital from '../FirmaDigital';
import { guardarBorradorCOPAEPanel, sellarCOPAEPanel, reabrirCOPAEPanel } from '../../firebase/dbCOPAE';
import { panelVacioCOPAE, resolverPanelFirmasCOPAE, validarDNICOPAE } from '../../utils/copaeFirmas';
import { C, S, btn, btnDeshabilitado, aviso } from '../creayemprende/cyeEstilos';

const PALABRA_CONFIRMACION = 'SELLAR';

/**
 * PANEL DE FIRMAS OFICIAL — PRECONGRESO COPAE UGEL 03 (2 JURADOS)
 *
 * Registra y sella centralizadamente las firmas de los 2 jurados evaluadores.
 * Una vez sellado, sus datos y trazos gobiernan automáticamente todas las fichas
 * individuales y el consolidado oficial de resultados.
 */
export default function COPAEPanelFirmas({
  abierto,
  onCerrar,
  panel = null,
  usuario = null,
  esStaff = false,
  onToast
}) {
  const [panelLocal, setPanelLocal] = useState(() => panelVacioCOPAE());
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [mostrarReapertura, setMostrarReapertura] = useState(false);
  const [motivoReapertura, setMotivoReapertura] = useState('');

  useEffect(() => {
    if (abierto) {
      if (panel) {
        setPanelLocal(resolverPanelFirmasCOPAE(panel));
      } else {
        setPanelLocal(panelVacioCOPAE());
      }
      setMostrarConfirmacion(false);
      setTextoConfirmacion('');
      setMostrarReapertura(false);
      setMotivoReapertura('');
    }
  }, [abierto, panel]);

  if (!abierto) return null;

  const esSellado = panelLocal.estado === 'sellado';
  const firmantes = panelLocal.firmantes || [];

  const handleActualizarFirmante = (slot, campo, valor) => {
    if (esSellado) return;
    setPanelLocal(prev => {
      const nuevos = [...(prev.firmantes || [])];
      const idx = nuevos.findIndex(f => Number(f.numeroJurado || f.slot) === slot);
      if (idx >= 0) {
        nuevos[idx] = { ...nuevos[idx], [campo]: valor, actualizadoEn: new Date().toISOString() };
      }
      return { ...prev, firmantes: nuevos };
    });
  };

  const handleGuardarBorrador = async () => {
    try {
      setGuardando(true);
      await guardarBorradorCOPAEPanel(panelLocal, usuario);
      if (onToast) onToast('Borrador del panel de firmas guardado correctamente.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast(err.message || 'Error al guardar borrador.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleSellar = async () => {
    if (textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION) {
      if (onToast) onToast(`Escriba ${PALABRA_CONFIRMACION} para confirmar el sellado.`, 'warning');
      return;
    }

    // Validar que ambos tengan nombre, DNI y firma
    for (let slot = 1; slot <= 2; slot++) {
      const f = firmantes.find(item => Number(item.numeroJurado || item.slot) === slot);
      if (!f?.nombreCompleto || f.nombreCompleto.trim().length < 4) {
        if (onToast) onToast(`Ingrese el nombre completo del Jurado ${slot}.`, 'error');
        return;
      }
      if (!validarDNICOPAE(f.dni)) {
        if (onToast) onToast(`El Jurado ${slot} debe tener un DNI válido de 8 dígitos.`, 'error');
        return;
      }
      if (!f?.firmaDataUrl) {
        if (onToast) onToast(`Debe registrar la firma digital del Jurado ${slot} antes de sellar.`, 'error');
        return;
      }
    }

    try {
      setGuardando(true);
      await sellarCOPAEPanel(panelLocal, usuario);
      setMostrarConfirmacion(false);
      if (onToast) onToast('¡Panel de firmas oficial sellado exitosamente! Las 2 firmas se aplicaron a todas las fichas.', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast(err.message || 'Error al sellar panel.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleReabrir = async () => {
    if (!motivoReapertura.trim()) {
      if (onToast) onToast('Debe ingresar un motivo para reabrir el panel.', 'warning');
      return;
    }

    try {
      setGuardando(true);
      await reabrirCOPAEPanel(motivoReapertura, usuario);
      setMostrarReapertura(false);
      if (onToast) onToast('Panel de firmas reabierto para correcciones.', 'info');
    } catch (err) {
      console.error(err);
      if (onToast) onToast(err.message || 'Error al reabrir panel.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 820,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#1E3A8A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #F59E0B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="award" size={22} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
                Panel de Firmas Oficial — COPAE 2026
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, opacity: 0.9 }}>
                Precongreso de COPAE – UGEL 03 «Mi voz, mi propuesta» · 2 Jurados Evaluadores
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.85
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Banner de Estado */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: esSellado ? '#ECFDF5' : '#FEF3C7',
            borderBottom: `1px solid ${esSellado ? '#A7F3D0' : '#FDE68A'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: esSellado ? '#10B981' : '#F59E0B'
              }}
            />
            <span style={{ fontWeight: 600, color: esSellado ? '#065F46' : '#92400E' }}>
              {esSellado
                ? `PANEL OFICIAL SELLADO — Las 2 firmas gobiernan todas las fichas y el consolidado`
                : `PANEL EN BORRADOR — Ingrese nombres, DNI y firmas antes de sellar`}
            </span>
          </div>

          {esSellado && esStaff && !mostrarReapertura && (
            <button
              onClick={() => setMostrarReapertura(true)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                border: '1px solid #FECACA',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Reabrir para correcciones
            </button>
          )}
        </div>

        {/* Modal interno para Reabrir Panel */}
        {mostrarReapertura && (
          <div
            style={{
              padding: '14px 24px',
              backgroundColor: '#FEF2F2',
              borderBottom: '1px solid #FCA5A5'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>
              Reapertura justificada del panel de firmas:
            </div>
            <input
              type="text"
              placeholder="Indique el motivo de la corrección..."
              value={motivoReapertura}
              onChange={e => setMotivoReapertura(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #F87171',
                fontSize: 13,
                marginBottom: 8
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostrarReapertura(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReabrir}
                disabled={guardando}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirmar Reapertura
              </button>
            </div>
          </div>
        )}

        {/* Cuerpo del Modal: Los 2 Casilleros */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 20
            }}
          >
            {[1, 2].map(slot => {
              const f = firmantes.find(item => Number(item.numeroJurado || item.slot) === slot) || {};
              const dniValido = validarDNICOPAE(f.dni);

              return (
                <div
                  key={slot}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: '2px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          backgroundColor: '#1E3A8A',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: 12,
                          padding: '3px 8px',
                          borderRadius: 4
                        }}
                      >
                        JURADO {slot}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        Evaluador Oficial
                      </span>
                    </div>
                    {f.firmaDataUrl && (
                      <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                        Firma registrada
                      </span>
                    )}
                  </div>

                  {/* Nombre Completo */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Nombre Completo y Apellidos:
                    </label>
                    <input
                      type="text"
                      disabled={esSellado}
                      value={f.nombreCompleto || ''}
                      onChange={e => handleActualizarFirmante(slot, 'nombreCompleto', e.target.value)}
                      placeholder={`Nombres del Jurado ${slot}...`}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                        borderRadius: 6,
                        border: '1px solid #CBD5E1',
                        backgroundColor: esSellado ? '#F1F5F9' : '#FFFFFF'
                      }}
                    />
                  </div>

                  {/* DNI */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Documento Nacional de Identidad (DNI):
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      disabled={esSellado}
                      value={f.dni || ''}
                      onChange={e => {
                        const solonum = e.target.value.replace(/\D/g, '').slice(0, 8);
                        handleActualizarFirmante(slot, 'dni', solonum);
                      }}
                      placeholder="8 dígitos"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                        borderRadius: 6,
                        border: `1px solid ${f.dni && !dniValido ? '#EF4444' : '#CBD5E1'}`,
                        backgroundColor: esSellado ? '#F1F5F9' : '#FFFFFF'
                      }}
                    />
                    {f.dni && !dniValido && (
                      <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>
                        El DNI debe tener exactamente 8 dígitos.
                      </div>
                    )}
                  </div>

                  {/* Cargo */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Cargo institucional:
                    </label>
                    <input
                      type="text"
                      disabled={esSellado}
                      value={f.cargo || `Jurado Evaluador ${slot} — Precongreso COPAE UGEL 03`}
                      onChange={e => handleActualizarFirmante(slot, 'cargo', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid #CBD5E1',
                        backgroundColor: esSellado ? '#F1F5F9' : '#FFFFFF'
                      }}
                    />
                  </div>

                  {/* Firma Digital */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      Trazo de Firma Digital:
                    </label>
                    {esSellado ? (
                      <div
                        style={{
                          height: 120,
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        {f.firmaDataUrl ? (
                          <img
                            src={f.firmaDataUrl}
                            alt={`Firma Jurado ${slot}`}
                            style={{ maxHeight: 90, maxWidth: '90%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>Sin firma registrada</span>
                        )}
                      </div>
                    ) : (
                      <FirmaDigital
                        value={f.firmaDataUrl || ''}
                        onChange={dataUrl => handleActualizarFirmante(slot, 'firmaDataUrl', dataUrl)}
                        label={`Firma del Jurado ${slot}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal de confirmación para sellado */}
          {mostrarConfirmacion && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: 8
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                ¿Confirmar sellado definitivo del panel?
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#78350F' }}>
                Al sellar el panel, los datos y las 2 firmas de los jurados se fijarán en todas las fichas individuales y en el consolidado oficial.
                Para confirmar, escriba <strong>{PALABRA_CONFIRMACION}</strong> en el siguiente campo:
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={`Escriba ${PALABRA_CONFIRMACION}`}
                  value={textoConfirmacion}
                  onChange={e => setTextoConfirmacion(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #F59E0B',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1
                  }}
                />
                <button
                  onClick={handleSellar}
                  disabled={guardando || textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#B45309',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  {guardando ? 'Sellando...' : 'Sellar Panel Ahora'}
                </button>
                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Botones */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {esSellado ? 'Panel sellado por la comisión evaluadora.' : 'Modifique y guarde el borrador o selle el panel.'}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCerrar}
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

            {!esSellado && (
              <>
                <button
                  onClick={handleGuardarBorrador}
                  disabled={guardando}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F1F5F9',
                    color: '#1E293B',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {guardando ? 'Guardando...' : 'Guardar borrador'}
                </button>

                {!mostrarConfirmacion && (
                  <button
                    onClick={() => setMostrarConfirmacion(true)}
                    disabled={guardando}
                    style={{
                      padding: '9px 20px',
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
                    Sellar Panel Oficial
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
