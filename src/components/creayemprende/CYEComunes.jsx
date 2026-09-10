import React from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn } from './cyeEstilos';
import { CYE_CONFIG, SLOTS_JURADO, getCategoriaCYE } from '../../data/creaEmprendeConfig';
import { firmantesOrdenadosCYE, etiquetaGobernanzaCYE } from '../../utils/creaEmprendeFirmas';
import { formatearFechaCorta } from '../../utils/creaEmprendeHelpers';

/** Estado del Panel de Firmas Oficial, visible en D13, D14 y D15. */
export function TarjetaPanelFirmas({ panel, onAbrir, esStaff }) {
  const sellado = panel?.estado === 'sellado';
  const firmantes = firmantesOrdenadosCYE(panel);
  return (
    <div style={{ ...S.tarjeta, padding: 14, borderLeft: `4px solid ${sellado ? C.green : C.gold}`, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <Icon name="penTool" size={16} color={sellado ? C.green : C.gold} />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: C.navy2 }}>Panel de Firmas Oficial</span>
          <span style={S.chip(sellado ? '#DCFCE7' : '#FEF3C7', sellado ? C.green : C.amber, sellado ? '#86EFAC' : '#FCD34D')}>
            {sellado ? 'SELLADO' : 'BORRADOR'}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: C.g500 }}>{etiquetaGobernanzaCYE(panel)}</div>
        {sellado && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginTop: 8 }}>
            {firmantes.map((f, i) => (
              <div key={i} style={{ fontSize: 11.5, color: C.g700, borderLeft: `2px solid ${C.gold}`, paddingLeft: 8 }}>
                <div style={{ fontWeight: 800, color: C.navy2 }}>Jurado N.° {SLOTS_JURADO[i]}</div>
                <div>{f?.nombreCompleto || '—'}</div>
                <div style={{ color: C.g500 }}>DNI {f?.dni || '—'}{f?.presidente ? ' · Preside' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {onAbrir && (esStaff || sellado) && (
        <button type="button" onClick={onAbrir} style={btn(sellado ? 'secundario' : 'primario')}>
          <Icon name="penTool" size={13} color={sellado ? C.navy2 : C.white} /> {sellado ? 'Ver panel' : 'Abrir Panel de Firmas'}
        </button>
      )}
    </div>
  );
}

/** Encabezado de los formatos oficiales, con la categoría que el formato no trae impresa. */
export function EncabezadoFormato({ anexo, titulo, categoria, chips = null }) {
  const cat = getCategoriaCYE(categoria);
  const campos = [
    ['Etapa', CYE_CONFIG.etapa],
    ['DRE/GRE', CYE_CONFIG.dre],
    ['UGEL', CYE_CONFIG.ugel],
    ['Modalidad', cat?.modalidad || ''],
    ['Categoría', cat ? `${cat.id} — ${cat.grados}` : categoria],
    ['Fecha', formatearFechaCorta(CYE_CONFIG.fechaEvaluacion)]
  ];
  return (
    <div style={S.seccion}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>ANEXO {anexo}</div>
          <h3 style={{ margin: 0, fontFamily: FUENTES.serif, fontWeight: 400, fontSize: 19, color: C.navy2 }}>{titulo}</h3>
        </div>
        {chips}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 12, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 10 }}>
        {campos.map(([k, v]) => (
          <div key={k} style={{ fontSize: 12, color: C.g800 }}>
            <span style={{ fontWeight: 700, color: C.g500 }}>{k}:</span> {v}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SelectorCasillero({ valor, onCambiar }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ ...S.etiqueta, marginBottom: 0, marginRight: 4 }}>Formato del</span>
      {SLOTS_JURADO.map(s => {
        const activo = valor === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onCambiar(s)}
            style={{
              padding: '7px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: FUENTES.sans,
              background: activo ? C.navy3 : C.white, color: activo ? C.white : C.navy2, border: `1px solid ${activo ? C.navy3 : C.border}`
            }}
          >
            Jurado N.° {s}
          </button>
        );
      })}
    </div>
  );
}
