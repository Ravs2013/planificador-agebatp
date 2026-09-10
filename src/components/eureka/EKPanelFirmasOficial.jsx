import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../Icon';
import FirmaDigital from '../FirmaDigital';
import { C, CE, S, btn, btnDeshabilitado, aviso, estadoCheck } from './ekEstilos';
import { TIPOS_MIEMBRO_JURADO } from '../../data/eurekaCatalogos';
import { SLOTS_JURADO, getArea, getAreasDeCategoria, CATEGORIAS } from '../../data/eurekaConfigUGEL03';
import {
  JURADOS_EVALUADORES_EUREKA, construirBloqueFirmanteEureka
} from '../../data/eurekaJuradosEvaluadores';
import {
  ALCANCES, scopeIdDe, panelVacio, verificarPanel, firmaEsValida,
  guardarFirmaEnCache, leerFirmaDeCache
} from '../../utils/eurekaFirmas';
import { describirAlcance, normalizarDNI, validarDNI, nombreCompletoValido } from '../../utils/eurekaHelpers';
import { guardarBorradorEKPanel, sellarEKPanel, reabrirEKPanel, asegurarEKPanel } from '../../firebase/dbEureka';

const PALABRA_CONFIRMACION = 'SELLAR';

/**
 * PANEL DE FIRMAS OFICIAL — COMPONENTE CRÍTICO DEL MÓDULO.
 *
 * Aquí se designan, una sola vez y al cierre del concurso, los tres jurados que suscriben
 * los anexos. Al sellar, sus firmas gobiernan todas las fichas, consolidados y actas del
 * alcance seleccionado, resolviéndose en tiempo de renderizado. Ninguna firma se copia
 * dentro de las evaluaciones.
 */
export default function EKPanelFirmasOficial({
  abierto,
  onCerrar,
  panelesMap = {},
  categoria,
  areaId,
  evaluacionesDelAlcance = [],
  participantesDelAlcance = [],
  usuario,
  esAdministrador = false,
  onToast
}) {
  const [alcance, setAlcance] = useState(ALCANCES.GLOBAL);
  const [panel, setPanel] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [mostrarReapertura, setMostrarReapertura] = useState(false);
  const [motivoReapertura, setMotivoReapertura] = useState('');
  const scopeCargadoRef = useRef(null);

  const scopeId = useMemo(() => {
    try {
      return scopeIdDe({ alcance, categoria, areaId });
    } catch (e) {
      return 'GLOBAL';
    }
  }, [alcance, categoria, areaId]);

  // Guardián de carga: solo sincroniza el estado local si cambió el alcance seleccionado
  // o si el documento remoto se selló o reabrió. Evita pisar lo que el usuario escribe.
  useEffect(() => {
    const remoto = panelesMap[scopeId];
    const cambioScope = scopeCargadoRef.current !== scopeId;
    const cambioEstado = panel && remoto && panel.estado !== remoto.estado;

    if (cambioScope || cambioEstado || !panel) {
      const base = remoto
        ? {
          ...panelVacio({ alcance, categoria, areaId }),
          ...remoto,
          firmantes: SLOTS_JURADO.map(slot => {
            const encontrado = (remoto.firmantes || []).find(f => f.numeroJurado === slot);
            return encontrado || panelVacio({ alcance, categoria, areaId }).firmantes[slot - 1];
          })
        }
        : panelVacio({ alcance, categoria, areaId });
      setPanel(base);
      scopeCargadoRef.current = scopeId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId, panelesMap]);

  const sellado = panel?.estado === 'sellado';

  const verificacion = useMemo(
    () => verificarPanel(panel, { evaluacionesDelAlcance, participantesDelAlcance }),
    [panel, evaluacionesDelAlcance, participantesDelAlcance]
  );

  /* ───── Mutaciones locales ───── */

  const actualizarFirmante = (slot, cambios) => {
    setPanel(prev => ({
      ...prev,
      firmantes: prev.firmantes.map(f => (f.numeroJurado === slot ? { ...f, ...cambios } : f))
    }));
  };

  const marcarPresidente = (slot) => {
    setPanel(prev => ({
      ...prev,
      firmantes: prev.firmantes.map(f => ({ ...f, presidente: f.numeroJurado === slot }))
    }));
  };

  const autocompletarDesdePadron = (slot, dni) => {
    if (!dni) {
      actualizarFirmante(slot, { juradoOperativoRef: '' });
      return;
    }
    const bloque = construirBloqueFirmanteEureka(dni);
    if (!bloque) return;
    actualizarFirmante(slot, {
      apellidos: bloque.apellidos,
      nombres: bloque.nombres,
      nombreCompleto: bloque.nombreCompleto || `${bloque.apellidos}, ${bloque.nombres}`.trim(),
      dni: bloque.dni,
      correo: bloque.correo,
      institucion: bloque.institucion || 'UGEL 03',
      tipoMiembro: bloque.tipoMiembro,
      juradoOperativoRef: bloque.juradoOperativoRef
    });
    if (bloque.requiereValidacionNombre && onToast) {
      onToast(
        `El desglose de apellidos y nombres de este jurado es una inferencia del padrón. Verifíquelo contra su DNI antes de sellar.`,
        'alerta'
      );
    }
  };

  const aplicarFirma = async (slot, dataUrl) => {
    if (!dataUrl) {
      actualizarFirmante(slot, { firmaDataUrl: null });
      return;
    }
    const resultado = await firmaEsValida(dataUrl);
    if (!resultado.valida) {
      if (onToast) onToast(resultado.motivo || 'El trazo de firma es insuficiente.', 'error');
      return;
    }
    actualizarFirmante(slot, { firmaDataUrl: dataUrl });
    const firmante = panel.firmantes.find(f => f.numeroJurado === slot);
    guardarFirmaEnCache(scopeId, slot, firmante?.dni, dataUrl);
  };

  const recuperarFirmaGuardada = (slot) => {
    const firmante = panel.firmantes.find(f => f.numeroJurado === slot);
    const cached = leerFirmaDeCache(scopeId, slot, firmante?.dni);
    if (cached) {
      actualizarFirmante(slot, { firmaDataUrl: cached });
      if (onToast) onToast(`Firma recuperada para el Jurado N.° ${slot}.`, 'exito');
    } else if (onToast) {
      onToast('No hay firma guardada para este jurado en este equipo.', 'alerta');
    }
  };

  /* ───── Acciones remotas ───── */

  const guardarBorrador = async () => {
    try {
      setGuardando(true);
      await asegurarEKPanel({ alcance, categoria, areaId }, usuario);
      await guardarBorradorEKPanel({ ...panel, id: scopeId, alcance, categoria: alcance === ALCANCES.GLOBAL ? null : categoria, areaId: alcance === ALCANCES.CATEGORIA_AREA ? areaId : null }, usuario);
      if (onToast) onToast('Borrador del Panel de Firmas guardado.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar el borrador: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarSellado = async () => {
    if (textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION) {
      if (onToast) onToast(`Escriba ${PALABRA_CONFIRMACION} para confirmar la acción.`, 'error');
      return;
    }
    try {
      setGuardando(true);
      await asegurarEKPanel({ alcance, categoria, areaId }, usuario);
      await sellarEKPanel({
        ...panel,
        id: scopeId,
        alcance,
        categoria: alcance === ALCANCES.GLOBAL ? null : categoria,
        areaId: alcance === ALCANCES.CATEGORIA_AREA ? areaId : null
      }, usuario);
      setMostrarConfirmacion(false);
      setTextoConfirmacion('');
      if (onToast) onToast('Panel de Firmas sellado. Los documentos del alcance dejan de emitirse como preliminares.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo sellar el panel: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarReapertura = async () => {
    try {
      setGuardando(true);
      await reabrirEKPanel(scopeId, motivoReapertura, usuario);
      setMostrarReapertura(false);
      setMotivoReapertura('');
      if (onToast) onToast('Panel reabierto. Se registró el motivo en el historial.', 'alerta');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  /* ───── Conteo de documentos afectados ───── */

  const documentosAfectados = useMemo(() => {
    const areasAlcance = alcance === ALCANCES.CATEGORIA_AREA
      ? [areaId]
      : (alcance === ALCANCES.CATEGORIA ? getAreasDeCategoria(categoria).map(a => a.id) : null);

    const fichas = evaluacionesDelAlcance.length;
    const consolidados = areasAlcance ? areasAlcance.length : CATEGORIAS.reduce((s, c) => s + getAreasDeCategoria(c.id).length, 0);
    return { fichas, consolidados, actas: consolidados };
  }, [alcance, areaId, categoria, evaluacionesDelAlcance]);

  // Los retornos tempranos van DESPUES de todos los hooks: React exige que se ejecuten
  // en el mismo orden en cada render, y este componente se monta permanentemente aunque
  // el modal este cerrado.
  if (!abierto || !panel) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.72)', zIndex: 200,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 20, overflowY: 'auto', backdropFilter: 'blur(2px)'
      }}
      onClick={onCerrar}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.gris50, borderRadius: 8, width: '100%', maxWidth: 1280,
          margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', overflow: 'hidden'
        }}
      >
        {/* ── Encabezado ── */}
        <div style={{ background: C.navy2, color: C.blanco, padding: '16px 22px', borderBottom: `3px solid ${CE.verdeEureka}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>
                Panel de Firmas Oficial — Jurado Calificador
              </h2>
              <div style={{ fontSize: 11.5, color: CE.verdeHalo, marginTop: 4 }}>
                Alcance vigente: {describirAlcance(alcance, categoria, areaId)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={S.chip(
                sellado ? '#DCFCE7' : '#FEF3C7',
                sellado ? C.exito : C.alerta,
                sellado ? '#86EFAC' : '#FCD34D'
              )}>
                {sellado ? 'SELLADO' : 'BORRADOR'}
              </span>
              <button type="button" onClick={onCerrar} style={{ ...btn('plano'), color: C.blanco, padding: 6 }}>
                <Icon name="x" size={18} color={C.blanco} />
              </button>
            </div>
          </div>

          {sellado && (
            <div style={{ fontSize: 11, color: CE.verdeHalo, marginTop: 8 }}>
              Sellado el {panel.selladoEn ? new Date(panel.selladoEn).toLocaleString('es-PE') : '—'} por {panel.selladoPor?.correo || '—'}
            </div>
          )}
        </div>

        {/* ── Selector de alcance ── */}
        <div style={{ padding: '14px 22px', background: C.blanco, borderBottom: `1px solid ${C.border}` }}>
          <label style={S.etiqueta}>Alcance del panel</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: ALCANCES.GLOBAL, label: 'Todo el concurso (GLOBAL)' },
              { id: ALCANCES.CATEGORIA, label: `Por categoría (${categoria || '—'})`, disabled: !categoria },
              { id: ALCANCES.CATEGORIA_AREA, label: `Por categoría y área`, disabled: !categoria || !areaId }
            ].map(op => {
              const activo = alcance === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  disabled={op.disabled}
                  onClick={() => setAlcance(op.id)}
                  style={{
                    padding: '7px 14px', borderRadius: 5, fontSize: 12, fontWeight: 700,
                    cursor: op.disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: op.disabled ? 0.4 : 1,
                    background: activo ? CE.verdeEureka : C.blanco,
                    color: activo ? C.blanco : C.gris700,
                    border: `1px solid ${activo ? CE.verdeOscuro : C.gris300}`
                  }}
                >
                  {op.label}
                </button>
              );
            })}
          </div>
          <div style={{ ...aviso('alerta'), marginTop: 10, fontSize: 11.5 }}>
            Cambiar el alcance modifica qué documentos gobierna este panel. Los paneles se resuelven en
            cascada, del más específico al más general: categoría y área, luego categoría, luego global.
            Identificador de este panel: <strong>{scopeId}</strong>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 0, alignItems: 'start' }}>

          {/* Tarjetas de firmantes */}
          <div style={{ padding: 20 }}>
            {sellado && (
              <div style={{ ...aviso('exito'), marginBottom: 16 }}>
                Este panel está sellado. Para modificar a los firmantes debe reabrirlo un administrador,
                indicando el motivo. El historial de sellado y reapertura nunca se borra.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
              {panel.firmantes.map(firmante => (
                <TarjetaFirmante
                  key={firmante.numeroJurado}
                  firmante={firmante}
                  scopeId={scopeId}
                  soloLectura={sellado}
                  onCampo={(cambios) => actualizarFirmante(firmante.numeroJurado, cambios)}
                  onPresidente={() => marcarPresidente(firmante.numeroJurado)}
                  onPadron={(dni) => autocompletarDesdePadron(firmante.numeroJurado, dni)}
                  onFirma={(dataUrl) => aplicarFirma(firmante.numeroJurado, dataUrl)}
                  onRecuperarFirma={() => recuperarFirmaGuardada(firmante.numeroJurado)}
                />
              ))}
            </div>
          </div>

          {/* Panel lateral de verificación */}
          <div style={{ padding: '20px 20px 20px 0' }}>
            <div style={{ ...S.tarjeta, padding: 16, position: 'sticky', top: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Verificación previa al sellado
              </div>

              {verificacion.checks.map(check => {
                const est = estadoCheck(check.ok, check.bloqueante);
                return (
                  <div key={check.id} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        display: 'inline-block', minWidth: 44, textAlign: 'center',
                        fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                        padding: '2px 5px', borderRadius: 3,
                        background: est.fondo, color: est.color, border: `1px solid ${est.color}33`
                      }}>
                        {est.texto}
                      </span>
                      <span style={{ fontSize: 11.5, color: C.gris700, lineHeight: 1.4 }}>{check.label}</span>
                    </div>
                    {!check.ok && (check.detalle || []).length > 0 && (
                      <ul style={{ margin: '4px 0 0 52px', paddingLeft: 12, fontSize: 10.5, color: est.color, lineHeight: 1.5 }}>
                        {check.detalle.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}

              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, fontSize: 11, color: C.gris500 }}>
                Documentos que gobernará este panel:<br />
                <strong style={{ color: C.navy2 }}>{documentosAfectados.fichas}</strong> fichas ·{' '}
                <strong style={{ color: C.navy2 }}>{documentosAfectados.consolidados}</strong> consolidados ·{' '}
                <strong style={{ color: C.navy2 }}>{documentosAfectados.actas}</strong> actas
              </div>

              {(panel.historial || []).length > 0 && (
                <details style={{ marginTop: 12 }}>
                  <summary style={{ fontSize: 11, fontWeight: 700, color: C.gris500, cursor: 'pointer' }}>
                    Historial del panel ({panel.historial.length})
                  </summary>
                  <div style={{ marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {[...panel.historial].reverse().map((h, i) => (
                      <div key={i} style={{ fontSize: 10, color: C.gris500, padding: '3px 0', borderBottom: `1px solid ${C.gris100}` }}>
                        <strong style={{ color: C.gris700 }}>{h.accion}</strong> · {h.correo || h.uid} ·{' '}
                        {h.en ? new Date(h.en).toLocaleString('es-PE') : ''}
                        {h.motivo && <div style={{ fontStyle: 'italic' }}>Motivo: {h.motivo}</div>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* ── Pie de acciones ── */}
        <div style={{
          padding: '14px 22px', background: C.blanco, borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <button type="button" onClick={onCerrar} style={btn('secundario')}>Cerrar</button>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!sellado && (
              <button
                type="button"
                onClick={guardarBorrador}
                disabled={guardando}
                style={guardando ? btnDeshabilitado(btn('secundario')) : btn('secundario')}
              >
                <Icon name="save" size={14} /> Guardar borrador
              </button>
            )}

            {!sellado && (
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(true)}
                disabled={!verificacion.puedeSellar || guardando}
                style={(!verificacion.puedeSellar || guardando) ? btnDeshabilitado(btn('primario')) : btn('primario')}
                title={verificacion.puedeSellar ? '' : 'Resuelva las comprobaciones bloqueantes antes de sellar.'}
              >
                <Icon name="shield" size={14} /> SELLAR PANEL
              </button>
            )}

            {sellado && esAdministrador && (
              <button type="button" onClick={() => setMostrarReapertura(true)} style={btn('peligro')}>
                <Icon name="refresh" size={14} /> Reabrir panel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Diálogo de confirmación de sellado ── */}
      {mostrarConfirmacion && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.8)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { e.stopPropagation(); }}
        >
          <div style={{ ...S.tarjeta, padding: 24, maxWidth: 620, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy2, marginBottom: 14 }}>
              Confirmar el sellado del Panel de Firmas
            </div>

            <div style={{ fontSize: 13, color: C.gris700, lineHeight: 1.6, marginBottom: 14 }}>
              Al sellar el panel, las firmas y datos de los tres jurados designados se incorporarán a
              todas las fichas de evaluación, consolidados y actas del alcance seleccionado. Los
              documentos dejarán de emitirse como preliminares.
            </div>

            <div style={{ ...aviso('eureka'), marginBottom: 14 }}>
              <div><strong>Alcance:</strong> {describirAlcance(alcance, categoria, areaId)}</div>
              <div style={{ marginTop: 4 }}>
                <strong>Documentos afectados:</strong> {documentosAfectados.fichas} fichas ·{' '}
                {documentosAfectados.consolidados} consolidados · {documentosAfectados.actas} actas
              </div>
            </div>

            {verificacion.advertencias.length > 0 && (
              <div style={{ ...aviso('alerta'), marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 5 }}>Advertencias no bloqueantes:</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {verificacion.advertencias.flatMap(a => a.detalle).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
                <div style={{ marginTop: 6, fontSize: 11.5 }}>
                  Puede sellar de todos modos: hay casos legítimos, como un participante que no se presentó.
                </div>
              </div>
            )}

            <label style={S.etiqueta}>Escriba {PALABRA_CONFIRMACION} para confirmar</label>
            <input
              autoFocus
              value={textoConfirmacion}
              onChange={e => setTextoConfirmacion(e.target.value)}
              style={{ ...S.input, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}
              placeholder={PALABRA_CONFIRMACION}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => { setMostrarConfirmacion(false); setTextoConfirmacion(''); }}
                style={btn('secundario')}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSellado}
                disabled={guardando || textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION}
                style={(guardando || textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION)
                  ? btnDeshabilitado(btn('primario')) : btn('primario')}
              >
                <Icon name="shield" size={14} /> Sellar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diálogo de reapertura ── */}
      {mostrarReapertura && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.8)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ ...S.tarjeta, padding: 24, maxWidth: 560, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.error, marginBottom: 12 }}>
              Reabrir el Panel de Firmas
            </div>
            <div style={{ fontSize: 12.5, color: C.gris700, lineHeight: 1.6, marginBottom: 14 }}>
              Al reabrir el panel, todos los documentos del alcance vuelven a emitirse como preliminares
              hasta que se selle de nuevo. El motivo queda registrado de forma permanente en el historial
              y se invalida la caché local de firmas de este alcance.
            </div>
            <label style={S.etiqueta}>Motivo de la reapertura (obligatorio, mínimo 10 caracteres)</label>
            <textarea
              autoFocus
              value={motivoReapertura}
              onChange={e => setMotivoReapertura(e.target.value)}
              style={S.textarea}
              placeholder="Indique la razón por la que la comisión organizadora autoriza reabrir el panel."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setMostrarReapertura(false)} style={btn('secundario')}>Cancelar</button>
              <button
                type="button"
                onClick={confirmarReapertura}
                disabled={guardando || motivoReapertura.trim().length < 10}
                style={(guardando || motivoReapertura.trim().length < 10) ? btnDeshabilitado(btn('critico')) : btn('critico')}
              >
                Reabrir panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Tarjeta de un casillero de jurado ───── */

function TarjetaFirmante({ firmante, scopeId, soloLectura, onCampo, onPresidente, onPadron, onFirma, onRecuperarFirma }) {
  const [filtro, setFiltro] = useState('');

  const candidatos = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return JURADOS_EVALUADORES_EUREKA;
    return JURADOS_EVALUADORES_EUREKA.filter(
      j => j.nombreCompleto.toLowerCase().includes(f) || j.dni.includes(f)
    );
  }, [filtro]);

  const nombreOk = nombreCompletoValido(firmante.nombreCompleto);
  const dniOk = validarDNI(firmante.dni);
  const firmaOk = Boolean(firmante.firmaDataUrl);

  const claveCache = `ek_sig_${scopeId}_j${firmante.numeroJurado}_dni_${normalizarDNI(firmante.dni)}`;

  return (
    <div style={{
      ...S.tarjeta,
      padding: 14,
      border: `1px solid ${firmante.presidente ? C.dorado : C.border}`,
      borderTop: `3px solid ${CE.verdeEureka}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy2 }}>
          Jurado N.° {firmante.numeroJurado}
        </div>
        {firmante.presidente && (
          <span style={S.chip('#FEF9C3', '#854D0E', '#FDE68A')}>Presidente</span>
        )}
      </div>

      {!soloLectura && (
        <div style={{ marginBottom: 10 }}>
          <label style={S.etiqueta}>Seleccionar del padrón operativo</label>
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Filtrar por nombre o DNI"
            style={{ ...S.input, marginBottom: 5, fontSize: 12 }}
          />
          <select
            value={firmante.juradoOperativoRef || ''}
            onChange={e => onPadron(e.target.value)}
            style={{ ...S.input, fontSize: 12 }}
          >
            <option value="">Alta manual (no figura en el padrón)</option>
            {candidatos.map(j => (
              <option key={j.dni} value={j.dni}>
                {j.nombreCompleto} — DNI {j.dni} — Grupo {j.grupoAsignado}
              </option>
            ))}
          </select>
        </div>
      )}

      <Campo etiqueta="Apellidos" valor={firmante.apellidos} soloLectura={soloLectura}
        onChange={v => onCampo({ apellidos: v, nombreCompleto: `${v}, ${firmante.nombres}`.replace(/^,\s*|,\s*$/g, '') })} />

      <Campo etiqueta="Nombres" valor={firmante.nombres} soloLectura={soloLectura}
        onChange={v => onCampo({ nombres: v, nombreCompleto: `${firmante.apellidos}, ${v}`.replace(/^,\s*|,\s*$/g, '') })} />

      <Campo
        etiqueta="Nombre completo tal como se imprimirá"
        valor={firmante.nombreCompleto}
        soloLectura={soloLectura}
        onChange={v => onCampo({ nombreCompleto: v })}
        error={!nombreOk ? 'Requiere al menos nombre y apellido.' : null}
      />

      <Campo
        etiqueta="DNI (8 dígitos)"
        valor={firmante.dni}
        soloLectura={soloLectura}
        onChange={v => onCampo({ dni: String(v).replace(/\D/g, '').slice(0, 8) })}
        error={!dniOk ? 'El DNI debe tener exactamente 8 dígitos.' : null}
      />

      <Campo etiqueta="Institución" valor={firmante.institucion} soloLectura={soloLectura}
        onChange={v => onCampo({ institucion: v })} />

      <div style={{ marginBottom: 9 }}>
        <label style={S.etiqueta}>Tipo de miembro</label>
        <select
          value={firmante.tipoMiembro || 'docente_eb'}
          disabled={soloLectura}
          onChange={e => onCampo({ tipoMiembro: e.target.value })}
          style={{ ...S.input, fontSize: 12 }}
        >
          {TIPOS_MIEMBRO_JURADO.filter(t => t.id !== 'por_definir').map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <Campo etiqueta="Cargo o especialidad (opcional)" valor={firmante.cargo} soloLectura={soloLectura}
        onChange={v => onCampo({ cargo: v })} />

      <label style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        fontSize: 12, color: C.gris700, cursor: soloLectura ? 'default' : 'pointer'
      }}>
        <input
          type="checkbox"
          checked={Boolean(firmante.presidente)}
          disabled={soloLectura}
          onChange={onPresidente}
          style={{ accentColor: C.dorado }}
        />
        Presidente del jurado calificador
      </label>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ ...S.etiqueta, marginBottom: 0 }}>Firma</label>
          <span style={S.chip(
            firmaOk ? '#F0FDF4' : '#FEF2F2',
            firmaOk ? C.exito : C.error,
            firmaOk ? '#BBF7D0' : '#FECACA'
          )}>
            {firmaOk ? 'Registrada' : 'Pendiente'}
          </span>
        </div>

        {soloLectura ? (
          <div style={{
            border: `1px solid ${C.gris300}`, borderRadius: 6, padding: 8, background: C.blanco,
            minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {firmante.firmaDataUrl
              ? <img src={firmante.firmaDataUrl} alt={`Firma del Jurado N.° ${firmante.numeroJurado}`} style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 11.5, color: C.gris500 }}>Sin firma registrada</span>}
          </div>
        ) : (
          <>
            <FirmaDigital
              value={firmante.firmaDataUrl}
              onChange={onFirma}
              label=""
              storageKey={claveCache}
            />
            <button
              type="button"
              onClick={onRecuperarFirma}
              style={btn('plano', { padding: '4px 8px', fontSize: 11, marginTop: 4 })}
            >
              <Icon name="refresh" size={11} /> Recuperar firma guardada
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, soloLectura, error }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <label style={S.etiqueta}>{etiqueta}</label>
      <input
        value={valor || ''}
        readOnly={soloLectura}
        onChange={e => onChange(e.target.value)}
        style={{
          ...S.input,
          fontSize: 12,
          background: soloLectura ? C.gris100 : C.blanco,
          borderColor: error ? C.error : C.gris300
        }}
      />
      {error && !soloLectura && (
        <div style={{ fontSize: 10.5, color: C.error, marginTop: 2 }}>{error}</div>
      )}
    </div>
  );
}
