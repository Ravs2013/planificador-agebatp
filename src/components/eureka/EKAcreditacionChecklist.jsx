import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, CE, S, btn, aviso } from './ekEstilos';
import { getAcreditacionAplicable } from '../../data/eurekaCatalogos';

/**
 * Checklist de acreditación documental (numeral 7 de las bases).
 * Los ítems son condicionales por categoría y por línea de participación.
 * Es informativo: registra el cumplimiento pero NO bloquea la evaluación, porque las bases
 * prevén un plazo de subsanación de las omisiones detectadas.
 */
export default function EKAcreditacionChecklist({ categoria, lineaId, valores = {}, onChange, soloLectura = false }) {
  const [abierto, setAbierto] = useState(false);
  const items = useMemo(() => getAcreditacionAplicable(categoria, lineaId), [categoria, lineaId]);
  const marcados = items.filter(i => valores[i.id]).length;
  const completo = items.length > 0 && marcados === items.length;

  const alternar = (id) => {
    if (soloLectura) return;
    onChange({ ...valores, [id]: !valores[id] });
  };

  return (
    <div style={{ ...S.tarjeta, padding: 14, marginBottom: 14 }}>
      <div
        onClick={() => setAbierto(!abierto)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon name="clipboard" size={16} color={CE.verdeOscuro} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.navy2 }}>
            Checklist de acreditación documental
          </span>
          <span style={S.chip(
            completo ? '#F0FDF4' : C.gris100,
            completo ? C.exito : C.gris500,
            completo ? '#BBF7D0' : C.gris300
          )}>
            {marcados} de {items.length} verificados
          </span>
        </div>
        <Icon name={abierto ? 'arrowUp' : 'arrowDown'} size={14} color={C.gris500} />
      </div>

      {abierto && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...aviso('info'), marginBottom: 10, fontSize: 11.5 }}>
            El registro es informativo y no bloquea la evaluación. Conforme al numeral 7 de las bases,
            si un equipo no presenta la totalidad de la documentación se le otorga un plazo para subsanar
            las omisiones detectadas.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 6 }}>
            {items.map(item => {
              const activo = Boolean(valores[item.id]);
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '7px 9px',
                    borderRadius: 4,
                    border: `1px solid ${activo ? CE.verdeHalo : C.gris300}`,
                    background: activo ? CE.verdeFondo : C.blanco,
                    cursor: soloLectura ? 'default' : 'pointer',
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: C.gris900
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activo}
                    disabled={soloLectura}
                    onChange={() => alternar(item.id)}
                    style={{ marginTop: 2, accentColor: CE.verdeEureka, cursor: soloLectura ? 'default' : 'pointer' }}
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>

          {!soloLectura && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => onChange(items.reduce((acc, i) => ({ ...acc, [i.id]: true }), {}))}
                style={btn('secundario', { padding: '6px 12px', fontSize: 11.5 })}
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={() => onChange({})}
                style={btn('plano', { padding: '6px 12px', fontSize: 11.5 })}
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
