import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado } from './cyeEstilos';
import { TarjetaPanelFirmas, EncabezadoFormato, SelectorCasillero } from './CYEComunes';
import { getInstrumentosCategoria, maximoCategoria } from '../../data/creaEmprendeRubricas';
import { construirD13 } from '../../utils/creaEmprendeHelpers';
import { firmanteDelCasillero } from '../../utils/creaEmprendeFirmas';
import { obtenerMembreteCYE } from '../../pdf/membreteCreaEmprende';
import { generarD13PDF } from '../../pdf/generarDocumentosCYEPDF';

/** Anexo D13 — Formato consolidado de evaluación por cada jurado calificador (un formato por casillero). */
export default function CYEConsolidadoD13({ categoria, participantes = [], evaluaciones = [], panel, esStaff, onAbrirPanel, onToast }) {
  const [slot, setSlot] = useState(1);
  const [descargando, setDescargando] = useState(false);
  const filas = useMemo(() => construirD13(participantes, evaluaciones, slot), [participantes, evaluaciones, slot]);
  const maximos = Object.fromEntries(getInstrumentosCategoria(categoria).map(r => [r.anexo, r.maximo]));
  const registradas = filas.filter(f => f.registrada).length;
  const firmante = firmanteDelCasillero(panel, slot);

  const descargar = async (slots) => {
    try {
      setDescargando(true);
      const banner = await obtenerMembreteCYE();
      const filasPorSlot = Object.fromEntries(slots.map(s => [s, construirD13(participantes, evaluaciones, s)]));
      generarD13PDF({ categoria, filasPorSlot, panel, banner });
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el D13: ${err.message}`, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const th = (texto, extra = {}) => <th style={{ ...S.th, ...extra }}>{texto}</th>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TarjetaPanelFirmas panel={panel} onAbrir={onAbrirPanel} esStaff={esStaff} />
      <EncabezadoFormato
        anexo="D13"
        titulo="Formato consolidado de evaluación por cada jurado calificador"
        categoria={categoria}
        chips={<span style={S.chip(C.g100, C.g700, C.g300)}>{registradas} de {filas.length} fichas registradas</span>}
      />
      <div style={{ ...S.seccion, padding: 12 }}>
        <SelectorCasillero valor={slot} onCambiar={setSlot} />
      </div>

      <div style={{ ...S.tarjeta, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead>
              <tr>
                {th('N.°', { width: 44, textAlign: 'center' })}
                {th('Título del trabajo')}
                {th('Grado, sección / IE / UGEL / DRE')}
                {th(<>Rúbrica del proyecto<div style={{ fontWeight: 400, fontSize: 10.5 }}>máx. {maximos.D10}</div></>, { width: 96, textAlign: 'center' })}
                {th(<>Rúbrica del portafolio<div style={{ fontWeight: 400, fontSize: 10.5 }}>máx. {maximos.D11}</div></>, { width: 96, textAlign: 'center' })}
                {th(<>Presentación en la Expoferia<div style={{ fontWeight: 400, fontSize: 10.5 }}>máx. {maximos.D12}</div></>, { width: 104, textAlign: 'center' })}
                {th(<>Puntaje total<div style={{ fontWeight: 400, fontSize: 10.5 }}>máx. {maximoCategoria(categoria)}</div></>, { width: 88, textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.participanteId} style={{ background: f.registrada ? C.white : C.g50 }}>
                  <td style={{ ...S.td, textAlign: 'center', fontFamily: FUENTES.mono, fontWeight: 700 }}>{f.numero}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: C.navy2 }}>
                    {f.tituloProyecto}
                    {f.noSePresento && <span style={{ ...S.chip('#FEF2F2', C.red, '#FECACA'), marginLeft: 6 }}>No se presentó</span>}
                  </td>
                  <td style={{ ...S.td, fontSize: 11.5 }}>{[f.gradoSeccion, f.institucion, f.ugel, f.dre].filter(Boolean).join(' / ')}</td>
                  {['d10', 'd11', 'd12'].map(k => (
                    <td key={k} style={{ ...S.td, textAlign: 'center', fontFamily: FUENTES.mono }}>{f[k] ?? '—'}</td>
                  ))}
                  <td style={{ ...S.td, textAlign: 'center', fontFamily: FUENTES.mono, fontWeight: 800, color: C.navy2 }}>{f.total ?? '—'}</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 24, color: C.g500 }}>No hay proyectos en esta categoría.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, fontSize: 11.5, color: C.g500 }}>
          Solo se consignan las fichas registradas. Los máximos corresponden a los instrumentos de la categoría.
        </div>
      </div>

      <div style={{ ...S.seccion, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, color: C.g700 }}>
          {firmante
            ? <>Suscribe el formato del Jurado N.° {slot}: <strong style={{ color: C.navy2 }}>{firmante.nombreCompleto}</strong>, DNI {firmante.dni}.</>
            : `La firma del Jurado N.° ${slot} se incorpora al sellar el Panel de Firmas.`}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={descargando} onClick={() => descargar([slot])} style={descargando ? btnDeshabilitado(btn('real')) : btn('real')}>
            <Icon name="download" size={13} color={C.white} /> D13 del Jurado N.° {slot} (PDF)
          </button>
          <button type="button" disabled={descargando} onClick={() => descargar([1, 2, 3])} style={descargando ? btnDeshabilitado(btn('indigo')) : btn('indigo')}>
            <Icon name="download" size={13} color={C.white} /> D13 de los tres jurados (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
