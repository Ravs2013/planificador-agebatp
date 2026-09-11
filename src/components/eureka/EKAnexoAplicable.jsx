import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso, MODAL_FONDO, MODAL_CAJA } from '../creayemprende/cyeEstilos';
import { getRubricaEureka } from '../../data/eurekaRubricas';
import {
  opcionesAnexo, motivoAnexoTexto, CONFIANZA_ANEXO, ALERTAS_PADRON, etiquetaOpcion,
  claveRecomendada, NOMBRE_LINEA_CS, tienePuntajes
} from '../../utils/eurekaAnexos';
import { aplicarAnexoProyectoEK } from '../../firebase/dbEureka';

/** Chips del anexo vigente: código, origen de la decisión y confianza de la recomendación. */
export function ChipsAnexo({ participante, conConfianza = true }) {
  if (!participante) return null;
  const comision = participante.anexoOrigen === 'comision';
  const conf = CONFIANZA_ANEXO[participante.confianzaAnexo];
  const primaria = ['A', 'B', 'C'].includes(participante.categoria);
  return (
    <>
      <span style={{ ...S.chip(C.navy3, C.white), fontFamily: FUENTES.mono }}>{participante.anexoClave || participante.anexoEvaluacion}</span>
      {comision
        ? <span style={S.chip('#FFFBEB', C.amber, '#FDE68A')}>Asignado por la comisión</span>
        : <span style={S.chip('#F0FDF4', C.green, '#BBF7D0')}>Recomendado según las bases</span>}
      {conConfianza && !comision && primaria && conf && <span style={S.chip(conf.fondo, conf.texto, conf.borde)}>{conf.etiqueta}</span>}
    </>
  );
}

/** Ventana para cambiar el anexo del proyecto. El cambio rige para los tres casilleros de jurado. */
export function ModalCambioAnexo({ participante, evaluacionesProyecto = [], usuario, onCerrar, onToast, claveInicial = null }) {
  const opciones = useMemo(() => opcionesAnexo(participante), [participante]);
  const recomendada = claveRecomendada(participante);
  const inicial = claveInicial && opciones.some(o => o.clave === claveInicial)
    ? claveInicial
    : (opciones.find(o => o.compatible && o.clave !== participante.anexoClave)?.clave || participante.anexoClave);
  const [clave, setClave] = useState(inicial);
  const [verOtras, setVerOtras] = useState(Boolean(opciones.find(o => o.clave === inicial && !o.compatible)));
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const elegida = opciones.find(o => o.clave === clave);
  const sinCambio = !elegida || clave === participante.anexoClave;
  const afectadas = evaluacionesProyecto.filter(ev => tienePuntajes(ev) && ev.anexoEvaluacion && ev.anexoEvaluacion !== elegida?.anexo);
  const valido = !sinCambio && motivo.trim().length >= 10;

  const aplicar = async () => {
    if (!valido) return;
    try {
      setGuardando(true);
      await aplicarAnexoProyectoEK(participante, {
        anexo: elegida.anexo, variante: elegida.variante, motivo, restablecer: elegida.clave === recomendada
      }, usuario);
      if (onToast) onToast(`El proyecto se calificará con ${elegida.etiqueta}. El cambio rige para los tres jurados.`, 'success');
      onCerrar();
    } catch (err) {
      if (onToast) onToast(`No se pudo cambiar el anexo: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const opcion = (o) => {
    const activa = o.clave === clave;
    const vigente = o.clave === participante.anexoClave;
    return (
      <label
        key={o.clave}
        style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 6, borderRadius: 8,
          border: `1.5px solid ${activa ? C.navy3 : C.border}`, background: activa ? '#EFF6FF' : C.white,
          cursor: vigente ? 'default' : 'pointer', opacity: vigente ? 0.75 : 1
        }}
      >
        <input type="radio" name="anexo-proyecto" checked={activa} disabled={vigente} onChange={() => setClave(o.clave)} style={{ marginTop: 3, accentColor: C.navy3 }} />
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: C.navy2 }}>{o.etiqueta}</span>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {vigente && <span style={S.chip(C.g100, C.g700, C.g300)}>Vigente</span>}
            {o.clave === recomendada && <span style={S.chip('#F0FDF4', C.green, '#BBF7D0')}>Recomendado según las bases</span>}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: C.g500, marginTop: 4, lineHeight: 1.4 }}>{getRubricaEureka(o.anexo)?.titulo}</span>
        </span>
      </label>
    );
  };

  const compatibles = opciones.filter(o => o.compatible);
  const otras = opciones.filter(o => !o.compatible);

  return (
    <div style={MODAL_FONDO} role="dialog" aria-modal="true" aria-label="Cambiar el anexo de evaluación">
      <div style={{ ...MODAL_CAJA, maxWidth: 620 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.navy2 }}>Cambiar el anexo de evaluación</div>
        <div style={{ fontSize: 12.5, color: C.g700, margin: '4px 0 14px', lineHeight: 1.45 }}>
          {participante.institucion?.nombre} — {participante.tituloProyecto}
        </div>

        <div style={S.etiqueta}>Compatibles con el área inscrita en SICE</div>
        {compatibles.map(opcion)}

        {otras.length > 0 && (
          <button type="button" onClick={() => setVerOtras(v => !v)} style={{ ...btn('plano'), padding: '6px 0', marginBottom: 6, color: C.navy3 }}>
            <Icon name={verOtras ? 'chevronUp' : 'chevronDown'} size={13} color={C.navy3} />
            {verOtras ? 'Ocultar los anexos de otras áreas' : 'Mostrar los anexos de otras áreas'}
          </button>
        )}
        {verOtras && (
          <>
            <div style={{ ...aviso('alerta'), fontSize: 12, marginBottom: 8 }}>
              Estos anexos pertenecen a otra área de participación. Úselos solo si la comisión decide evaluar el proyecto con un formulario distinto al de su área inscrita.
            </div>
            {otras.map(opcion)}
          </>
        )}

        {afectadas.length > 0 && (
          <div style={{ ...aviso('alerta'), fontSize: 12.5, margin: '8px 0' }}>
            {afectadas.length === 1 ? 'Hay 1 ficha' : `Hay ${afectadas.length} fichas`} con puntajes de otro anexo
            (Jurado N.° {afectadas.map(f => f.jurado?.numeroJurado).join(', ')}). Tras el cambio no cuentan en el consolidado:
            cada jurado deberá descartar esa captura y calificar de nuevo.
          </div>
        )}

        <label style={{ ...S.etiqueta, marginTop: 10 }}>Motivo del cambio (mínimo 10 caracteres)</label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          style={S.textarea}
          placeholder="Ejemplo: el informe plantea una pregunta investigable e hipótesis y no construye un producto."
        />
        <div style={{ fontSize: 11.5, color: C.g500, marginTop: 6 }}>
          Se registra su usuario, la fecha y la hora. El anexo elegido rige para los tres casilleros de jurado.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button type="button" onClick={onCerrar} style={btn('secundario')}>Cancelar</button>
          <button type="button" onClick={aplicar} disabled={!valido || guardando} style={valido && !guardando ? btn('primario') : btnDeshabilitado(btn('primario'))}>
            <Icon name="check" size={13} color={C.white} /> {guardando ? 'Guardando...' : 'Aplicar a los tres jurados'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta «Formulario que se aplica»: anexo vigente, motivo según las bases y cambio de contingencia. */
export default function EKAnexoAplicable({ participante, evaluacionesProyecto = [], usuario, puedeCambiar = false, esStaff = false, onToast }) {
  const [abierto, setAbierto] = useState(false);
  if (!participante) return null;
  const rubrica = getRubricaEureka(participante.anexoEvaluacion);
  const comision = participante.anexoOrigen === 'comision';
  const linea = participante.areaId === 'ciencias_sociales' && participante.lineaRecomendada ? NOMBRE_LINEA_CS[participante.lineaRecomendada] : null;
  const alertas = (participante.alertas || []).filter(a => ALERTAS_PADRON[a]);

  return (
    <div style={{ ...S.tarjeta, padding: '16px 18px', borderLeft: `5px solid ${comision ? C.amber : C.gold}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>FORMULARIO QUE SE APLICA A ESTE PROYECTO</div>
          <div style={{ fontFamily: FUENTES.serif, fontSize: 21, color: C.navy2, marginTop: 3, lineHeight: 1.25 }}>
            {etiquetaOpcion(participante.anexoEvaluacion, participante.varianteRubrica)}
          </div>
          <div style={{ fontSize: 12.5, color: C.g700, marginTop: 4, lineHeight: 1.45 }}>{rubrica?.titulo}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
            <ChipsAnexo participante={participante} />
            {linea && <span style={S.chip(C.g100, C.g700, C.g300)}>Tipo de problema: {linea}</span>}
            {rubrica && <span style={S.chip(C.g100, C.g700, C.g300)}>Puntaje máximo {rubrica.puntajeMaximo}</span>}
          </div>
        </div>
        {puedeCambiar && (
          <button type="button" onClick={() => setAbierto(true)} style={btn('contorno', { minHeight: 38 })}>
            <Icon name="refresh" size={13} /> Cambiar anexo
          </button>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12.5, color: C.g700, lineHeight: 1.55, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: '9px 12px' }}>
        <strong style={{ color: C.navy2 }}>Por qué este anexo: </strong>{motivoAnexoTexto(participante)}
      </div>

      {esStaff && alertas.length > 0 && (
        <div style={{ ...aviso('alerta'), marginTop: 8, fontSize: 12 }}>
          {alertas.map(a => <div key={a} style={{ marginBottom: 2 }}>{ALERTAS_PADRON[a]}</div>)}
        </div>
      )}

      {abierto && (
        <ModalCambioAnexo
          participante={participante}
          evaluacionesProyecto={evaluacionesProyecto}
          usuario={usuario}
          onCerrar={() => setAbierto(false)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
