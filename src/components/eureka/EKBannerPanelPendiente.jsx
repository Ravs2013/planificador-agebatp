import React from 'react';
import Icon from '../Icon';
import { C, CE, aviso, btn } from './ekEstilos';
import { TEXTOS_LEGALES } from '../../data/eurekaCatalogos';
import { etiquetaGobernanza, esPreliminar } from '../../utils/eurekaFirmas';

/**
 * Aviso persistente sobre el estado del Panel de Firmas Oficial.
 * Mientras el panel aplicable no esté sellado, toda descarga sale marcada como documento
 * preliminar sin valor legal. La etiqueta indica siempre QUÉ PANEL gobierna al documento
 * que el usuario está por descargar.
 */
export default function EKBannerPanelPendiente({ panel, onAbrirPanel }) {
  const preliminar = esPreliminar(panel);

  if (!preliminar) {
    return (
      <div style={{ ...aviso('exito'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="checkCircle" size={18} color={C.exito} />
          <div>
            <div style={{ fontWeight: 700 }}>Panel de Firmas Oficial sellado.</div>
            <div style={{ fontSize: 11.5, marginTop: 2, opacity: 0.9 }}>{etiquetaGobernanza(panel)}</div>
          </div>
        </div>
        {onAbrirPanel && (
          <button type="button" onClick={onAbrirPanel} style={btn('secundario')}>
            <Icon name="eye" size={13} /> Ver panel
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...aviso('alerta'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Icon name="alert" size={18} color={C.alerta} />
        <div>
          <div style={{ fontWeight: 700 }}>{TEXTOS_LEGALES.avisoPanelPendiente}</div>
          <div style={{ fontSize: 11.5, marginTop: 3, opacity: 0.9 }}>
            {etiquetaGobernanza(panel)}
          </div>
        </div>
      </div>
      {onAbrirPanel && (
        <button type="button" onClick={onAbrirPanel} style={btn('primario', { background: CE.verdeEureka })}>
          <Icon name="shield" size={13} /> Abrir Panel de Firmas
        </button>
      )}
    </div>
  );
}
