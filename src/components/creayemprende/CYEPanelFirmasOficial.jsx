import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../Icon';
import CYEFirmaDigital from './CYEFirmaDigital';
import CYEAgregarJuradoModal from './CYEAgregarJuradoModal';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso, estadoCheck, MODAL_FONDO, MODAL_CAJA } from './cyeEstilos';
import { SLOTS_JURADO } from '../../data/creaEmprendeConfig';
import { combinarJuradosCYE, bloqueFirmanteDesdeJurado } from '../../data/creaEmprendeJurados';
import {
  ALCANCES_CYE, scopeIdCYE, panelVacioCYE, verificarPanelCYE, firmaEsValidaCYE,
  guardarFirmaEnCacheCYE, leerFirmaDeCacheCYE
} from '../../utils/creaEmprendeFirmas';
import { describirAlcanceCYE, validarDNI, nombreCompletoValido, soloDigitos } from '../../utils/creaEmprendeHelpers';
import { guardarBorradorCYEPanel, sellarCYEPanel, reabrirCYEPanel } from '../../firebase/dbCreaEmprende';

const PALABRA_CONFIRMACION = 'SELLAR';

/**
 * PANEL DE FIRMAS OFICIAL — mismo funcionamiento que en Eureka.
 * Los tres jurados que suscriben se registran una sola vez. Al sellar, sus firmas se
 * incorporan a todas las fichas, D13, D14 y D15 del alcance, sin copiarse en cada registro.
 */
export default function CYEPanelFirmasOficial({
  abierto,
  onCerrar,
  panelesMap = {},
  categoria,
  evaluaciones = [],
  participantes = [],
  juradosFirestore = [],
  usuario,
  esStaff = false,
  esAdministrador = false,
  onToast
}) {
  const [alcance, setAlcance] = useState(ALCANCES_CYE.GLOBAL);
  const [panel, setPanel] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [texto, setTexto] = useState('');
  const [reabrir, setReabrir] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [altaParaSlot, setAltaParaSlot] = useState(null);
  const scopeCargadoRef = useRef(null);

  const scopeId = useMemo(() => scopeIdCYE({ alcance, categoria }), [alcance, categoria]);
  const padron = useMemo(() => combinarJuradosCYE(juradosFirestore), [juradosFirestore]);

  useEffect(() => {
    const remoto = panelesMap[scopeId];
    const cambioScope = scopeCargadoRef.current !== scopeId;
    const cambioEstado = panel && remoto && panel.estado !== remoto.estado;
    if (cambioScope || cambioEstado || !panel) {
      const vacio = panelVacioCYE({ alcance, categoria });
      setPanel(remoto
        ? {
          ...vacio,
          ...remoto,
          alcance,
          categoria: alcance === ALCANCES_CYE.GLOBAL ? null : categoria,
          firmantes: SLOTS_JURADO.map(slot => (remoto.firmantes || []).find(f => Number(f.numeroJurado) === slot) || vacio.firmantes[slot - 1])
        }
        : vacio);
      scopeCargadoRef.current = scopeId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId, panelesMap]);

  const alcanceEvaluaciones = useMemo(
    () => (alcance === ALCANCES_CYE.GLOBAL ? evaluaciones : evaluaciones.filter(e => e.categoria === categoria)),
    [alcance, evaluaciones, categoria]
  );
  const alcanceParticipantes = useMemo(
    () => (alcance === ALCANCES_CYE.GLOBAL ? participantes : participantes.filter(p => p.categoria === categoria)),
    [alcance, participantes, categoria]
  );
  const verificacion = useMemo(
    () => verificarPanelCYE(panel, { evaluacionesDelAlcance: alcanceEvaluaciones, participantesDelAlcance: alcanceParticipantes }),
    [panel, alcanceEvaluaciones, alcanceParticipantes]
  );

  if (!abierto || !panel) return null;
  const sellado = panel.estado === 'sellado';
  const editable = esStaff && !sellado;

  const actualizar = (slot, cambios) => setPanel(prev => ({
    ...prev,
    firmantes: prev.firmantes.map(f => (Number(f.numeroJurado) === slot ? { ...f, ...cambios } : f))
  }));

  const marcarPresidente = (slot) => setPanel(prev => ({
    ...prev,
    firmantes: prev.firmantes.map(f => ({ ...f, presidente: Number(f.numeroJurado) === slot ? !f.presidente : false }))
  }));

  const desdePadron = (slot, clave) => {
    if (!clave) { actualizar(slot, { juradoRef: '' }); return; }
    const j = padron.find(x => (x.dni || x.correo) === clave);
    const bloque = bloqueFirmanteDesdeJurado(j);
    if (bloque) actualizar(slot, { ...bloque, firmaDataUrl: null });
  };

  const aplicarFirma = async (slot, dataUrl) => {
    if (!dataUrl) { actualizar(slot, { firmaDataUrl: null }); return; }
    const res = await firmaEsValidaCYE(dataUrl);
    if (!res.valida) { if (onToast) onToast(res.motivo, 'error'); return; }
    actualizar(slot, { firmaDataUrl: dataUrl });
    const f = panel.firmantes.find(x => Number(x.numeroJurado) === slot);
    guardarFirmaEnCacheCYE(scopeId, slot, f?.dni, dataUrl);
  };

  const guardarBorrador = async () => {
    try {
      setGuardando(true);
      await guardarBorradorCYEPanel({ ...panel, alcance, categoria }, usuario);
      if (onToast) onToast('Borrador del Panel de Firmas guardado.', 'success');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const sellar = async () => {
    if (texto.trim().toUpperCase() !== PALABRA_CONFIRMACION) return;
    try {
      setGuardando(true);
      await sellarCYEPanel({ ...panel, alcance, categoria }, usuario);
      setConfirmar(false);
      setTexto('');
      if (onToast) onToast('Panel sellado. Las firmas se incorporan a todos los documentos del alcance.', 'success');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarReapertura = async () => {
    try {
      setGuardando(true);
      await reabrirCYEPanel(scopeId, motivo, usuario);
      setReabrir(false);
      setMotivo('');
      if (onToast) onToast('Panel reabierto. El motivo quedó en el historial.', 'info');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const fichasAlcance = alcanceEvaluaciones.length;
  const consolidadosAlcance = alcance === ALCANCES_CYE.GLOBAL ? 3 : 1;

  return (
    <div style={{ ...MODAL_FONDO, alignItems: 'flex-start', overflowY: 'auto', zIndex: 1100 }} onClick={onCerrar}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.g50, borderRadius: 8, width: '100%', maxWidth: 1240, margin: '0 auto', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
        <div style={{ background: C.navy2, color: C.white, padding: '14px 20px', borderBottom: `3px solid ${C.gold}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: FUENTES.serif, fontWeight: 400 }}>Panel de Firmas Oficial — Jurado Calificador</h2>
              <div style={{ fontSize: 11.5, color: C.goldLight, marginTop: 4, fontWeight: 700 }}>
                Alcance: {describirAlcanceCYE(alcance, categoria)} · Identificador {scopeId}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={S.chip(sellado ? '#DCFCE7' : '#FEF3C7', sellado ? C.green : C.amber, sellado ? '#86EFAC' : '#FCD34D')}>
                {sellado ? 'SELLADO' : 'BORRADOR'}
              </span>
              <button type="button" onClick={onCerrar} style={btn('plano', { padding: 6 })} aria-label="Cerrar">
                <Icon name="x" size={18} color={C.white} />
              </button>
            </div>
          </div>
          {sellado && (
            <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 6 }}>
              Sellado el {panel.selladoEn ? new Date(panel.selladoEn).toLocaleString('es-PE') : '—'} por {panel.selladoPor?.correo || '—'}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', background: C.white, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...S.etiqueta, marginBottom: 0, marginRight: 4 }}>Alcance</span>
          {[
            { id: ALCANCES_CYE.GLOBAL, label: 'Todo el concurso' },
            { id: ALCANCES_CYE.CATEGORIA, label: `Solo categoría ${categoria}` }
          ].map(op => {
            const activo = alcance === op.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => setAlcance(op.id)}
                style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FUENTES.sans,
                  background: activo ? C.navy3 : C.white, color: activo ? C.white : C.g700, border: `1px solid ${activo ? C.navy3 : C.g300}`
                }}
              >
                {op.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 640px', minWidth: 0, padding: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {panel.firmantes.map(f => (
                <TarjetaFirmante
                  key={f.numeroJurado}
                  firmante={f}
                  scopeId={scopeId}
                  padron={padron}
                  editable={editable}
                  esStaff={esStaff}
                  onCampo={cambios => actualizar(Number(f.numeroJurado), cambios)}
                  onPresidente={() => marcarPresidente(Number(f.numeroJurado))}
                  onPadron={clave => desdePadron(Number(f.numeroJurado), clave)}
                  onFirma={dataUrl => aplicarFirma(Number(f.numeroJurado), dataUrl)}
                  onAgregarJurado={() => setAltaParaSlot(Number(f.numeroJurado))}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 280px', padding: 18, paddingLeft: 0, minWidth: 260 }}>
            <div style={{ ...S.tarjeta, padding: 16, marginLeft: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.navy2, marginBottom: 12 }}>VERIFICACIÓN PREVIA AL SELLADO</div>
              {verificacion.checks.map(check => {
                const est = estadoCheck(check.ok, check.bloqueante);
                return (
                  <div key={check.id} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ minWidth: 44, textAlign: 'center', fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3, background: est.fondo, color: est.color }}>
                        {est.texto}
                      </span>
                      <span style={{ fontSize: 12, color: C.g700, lineHeight: 1.4 }}>{check.label}</span>
                    </div>
                    {!check.ok && check.detalle.length > 0 && (
                      <ul style={{ margin: '4px 0 0 52px', paddingLeft: 12, fontSize: 11, color: est.color, lineHeight: 1.45 }}>
                        {check.detalle.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 10, fontSize: 11.5, color: C.g500 }}>
                Documentos que gobierna: <strong style={{ color: C.navy2 }}>{fichasAlcance}</strong> fichas, <strong style={{ color: C.navy2 }}>{consolidadosAlcance * 3}</strong> formatos D13, <strong style={{ color: C.navy2 }}>{consolidadosAlcance}</strong> D14 y <strong style={{ color: C.navy2 }}>{consolidadosAlcance}</strong> D15.
              </div>
              {(panel.historial || []).length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 11.5, fontWeight: 700, color: C.g500, cursor: 'pointer' }}>Historial ({panel.historial.length})</summary>
                  <div style={{ marginTop: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {[...panel.historial].reverse().map((h, i) => (
                      <div key={i} style={{ fontSize: 10.5, color: C.g500, padding: '3px 0', borderBottom: `1px solid ${C.g100}` }}>
                        <strong style={{ color: C.g700 }}>{h.accion}</strong> · {h.correo || h.uid} · {h.en ? new Date(h.en).toLocaleString('es-PE') : ''}
                        {h.motivo && <div>Motivo: {h.motivo}</div>}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', background: C.white, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={onCerrar} style={btn('secundario')}>Cerrar</button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {editable && (
              <button type="button" onClick={guardarBorrador} disabled={guardando} style={guardando ? btnDeshabilitado(btn('contorno')) : btn('contorno')}>
                <Icon name="save" size={13} /> Guardar borrador
              </button>
            )}
            {editable && (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                disabled={!verificacion.puedeSellar || guardando}
                style={!verificacion.puedeSellar || guardando ? btnDeshabilitado(btn('primario')) : btn('primario')}
              >
                <Icon name="shield" size={13} color={C.white} /> Sellar panel
              </button>
            )}
            {sellado && esAdministrador && (
              <button type="button" onClick={() => setReabrir(true)} style={btn('peligroSuave')}>
                <Icon name="refresh" size={13} /> Reabrir panel
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmar && (
        <div style={{ ...MODAL_FONDO, zIndex: 1200 }} onClick={e => e.stopPropagation()}>
          <div style={{ ...MODAL_CAJA, maxWidth: 580 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginBottom: 10 }}>Confirmar el sellado</div>
            <div style={{ fontSize: 13, color: C.g700, lineHeight: 1.6, marginBottom: 12 }}>
              Las firmas y datos de los tres jurados se incorporarán a todas las fichas, D13, D14 y D15 de: <strong>{describirAlcanceCYE(alcance, categoria)}</strong>. Las calificaciones de ese alcance quedarán cerradas.
            </div>
            {verificacion.advertencias.length > 0 && (
              <div style={{ ...aviso('alerta'), marginBottom: 12, fontSize: 12.5 }}>
                {verificacion.advertencias.flatMap(a => a.detalle).map((d, i) => <div key={i}>{d}</div>)}
              </div>
            )}
            <label style={S.etiqueta}>Escriba {PALABRA_CONFIRMACION} para confirmar</label>
            <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} style={{ ...S.input, letterSpacing: 2, textTransform: 'uppercase' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => { setConfirmar(false); setTexto(''); }} style={btn('secundario')}>Cancelar</button>
              <button
                type="button"
                onClick={sellar}
                disabled={guardando || texto.trim().toUpperCase() !== PALABRA_CONFIRMACION}
                style={guardando || texto.trim().toUpperCase() !== PALABRA_CONFIRMACION ? btnDeshabilitado(btn('primario')) : btn('primario')}
              >
                <Icon name="shield" size={13} color={C.white} /> Sellar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {reabrir && (
        <div style={{ ...MODAL_FONDO, zIndex: 1200 }} onClick={e => e.stopPropagation()}>
          <div style={MODAL_CAJA}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.red, marginBottom: 10 }}>Reabrir el Panel de Firmas</div>
            <div style={{ fontSize: 12.5, color: C.g700, lineHeight: 1.6, marginBottom: 12 }}>
              Los documentos del alcance volverán a emitirse como preliminares hasta un nuevo sellado. El motivo queda en el historial.
            </div>
            <label style={S.etiqueta}>Motivo (mínimo 10 caracteres)</label>
            <textarea autoFocus value={motivo} onChange={e => setMotivo(e.target.value)} style={S.textarea} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setReabrir(false)} style={btn('secundario')}>Cancelar</button>
              <button
                type="button"
                onClick={confirmarReapertura}
                disabled={guardando || motivo.trim().length < 10}
                style={guardando || motivo.trim().length < 10 ? btnDeshabilitado(btn('critico')) : btn('critico')}
              >
                Reabrir panel
              </button>
            </div>
          </div>
        </div>
      )}

      <CYEAgregarJuradoModal
        abierto={altaParaSlot != null}
        onCerrar={() => setAltaParaSlot(null)}
        juradosFirestore={juradosFirestore}
        usuario={usuario}
        onToast={onToast}
        onCreado={j => { if (altaParaSlot != null) actualizar(altaParaSlot, { ...bloqueFirmanteDesdeJurado(j), firmaDataUrl: null }); }}
      />
    </div>
  );
}

function TarjetaFirmante({ firmante, scopeId, padron, editable, esStaff, onCampo, onPresidente, onPadron, onFirma, onAgregarJurado }) {
  const [filtro, setFiltro] = useState('');
  const slot = Number(firmante.numeroJurado);
  const candidatos = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return q ? padron.filter(j => `${j.nombreCompleto} ${j.dni}`.toLowerCase().includes(q)) : padron;
  }, [filtro, padron]);
  const firmaGuardada = leerFirmaDeCacheCYE(scopeId, slot, firmante.dni);
  const nombreOk = nombreCompletoValido(firmante.nombreCompleto);
  const dniOk = validarDNI(firmante.dni);

  const campo = (etiqueta, clave, error = null, extra = {}) => (
    <div key={clave} style={{ marginBottom: 8 }}>
      <label style={S.etiqueta}>{etiqueta}</label>
      <input
        value={firmante[clave] || ''}
        readOnly={!editable}
        onChange={e => onCampo({ [clave]: clave === 'dni' ? soloDigitos(e.target.value).slice(0, 8) : e.target.value })}
        style={{ ...S.input, fontSize: 12.5, background: editable ? C.white : C.g100, borderColor: error && editable ? C.red : C.border }}
        {...extra}
      />
      {error && editable && <div style={{ fontSize: 10.5, color: C.red, marginTop: 2 }}>{error}</div>}
    </div>
  );

  return (
    <div style={{ ...S.tarjeta, padding: 14, borderTop: `3px solid ${C.gold}`, border: `1px solid ${firmante.presidente ? C.gold : C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2 }}>Jurado N.° {slot}</div>
        {firmante.presidente && <span style={S.chip('#FEF9C3', '#854D0E', '#FDE68A')}>Preside</span>}
      </div>

      {editable && (
        <div style={{ marginBottom: 10, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 10 }}>
          <label style={S.etiqueta}>Seleccionar del padrón de jurados</label>
          <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar por nombre o DNI" style={{ ...S.input, fontSize: 12, marginBottom: 6 }} />
          <select value={firmante.juradoRef || ''} onChange={e => onPadron(e.target.value)} style={{ ...S.input, fontSize: 12 }}>
            <option value="">Seleccione un jurado</option>
            {candidatos.map(j => (
              <option key={j.dni || j.correo} value={j.dni || j.correo}>
                {j.nombreCompleto} — DNI {j.dni} — Grupo {j.grupo}
              </option>
            ))}
          </select>
          {esStaff && (
            <button type="button" onClick={onAgregarJurado} style={btn('gris', { marginTop: 8, padding: '6px 10px', fontSize: 11.5, width: '100%' })}>
              <Icon name="userPlus" size={13} /> Agregar jurado
            </button>
          )}
        </div>
      )}

      {campo('Apellidos', 'apellidos')}
      {campo('Nombres', 'nombres')}
      {campo('Nombre completo tal como se imprimirá', 'nombreCompleto', !nombreOk ? 'Requiere nombres y apellidos.' : null)}
      {campo('DNI', 'dni', !dniOk ? 'El DNI debe tener 8 dígitos.' : null, { inputMode: 'numeric' })}
      {campo('Institución', 'institucion')}
      {campo('Cargo (opcional)', 'cargo')}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 12px', fontSize: 12.5, color: C.g700, cursor: editable ? 'pointer' : 'default' }}>
        <input type="checkbox" checked={Boolean(firmante.presidente)} disabled={!editable} onChange={onPresidente} style={{ accentColor: C.gold }} />
        Preside el jurado calificador
      </label>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ ...S.etiqueta, marginBottom: 0 }}>Firma</span>
          <span style={S.chip(firmante.firmaDataUrl ? '#F0FDF4' : '#FEF2F2', firmante.firmaDataUrl ? C.green : C.red, firmante.firmaDataUrl ? '#BBF7D0' : '#FECACA')}>
            {firmante.firmaDataUrl ? 'Registrada' : 'Pendiente'}
          </span>
        </div>
        {editable ? (
          <CYEFirmaDigital value={firmante.firmaDataUrl} onChange={onFirma} firmaGuardada={firmaGuardada} />
        ) : (
          <div style={{ border: `1px solid ${C.g300}`, borderRadius: 6, minHeight: 90, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
            {firmante.firmaDataUrl
              ? <img src={firmante.firmaDataUrl} alt={`Firma del Jurado N.° ${slot}`} style={{ maxHeight: 78, maxWidth: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 11.5, color: C.g500 }}>Sin firma registrada</span>}
          </div>
        )}
      </div>
    </div>
  );
}
