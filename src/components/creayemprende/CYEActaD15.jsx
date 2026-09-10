import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso } from './cyeEstilos';
import { TarjetaPanelFirmas } from './CYEComunes';
import { CYE_CONFIG, TEXTOS_LEGALES_CYE, SLOTS_JURADO } from '../../data/creaEmprendeConfig';
import { construirD14, construirResultadosD15, detectarEmpatesPodioCYE, formatearFechaLarga } from '../../utils/creaEmprendeHelpers';
import { firmantesOrdenadosCYE, esPreliminarCYE } from '../../utils/creaEmprendeFirmas';
import { guardarCYEActa } from '../../firebase/dbCreaEmprende';
import { obtenerMembreteCYE } from '../../pdf/membreteCreaEmprende';
import { generarD15PDF } from '../../pdf/generarDocumentosCYEPDF';

function datosIniciales(acta) {
  return {
    region: acta?.region || CYE_CONFIG.region,
    provincia: acta?.provincia || CYE_CONFIG.provincia,
    distrito: acta?.distrito || CYE_CONFIG.distrito,
    fecha: acta?.fecha || CYE_CONFIG.fechaEvaluacion,
    hora: acta?.hora || CYE_CONFIG.horaActa
  };
}

/** Anexo D15 — Acta de resultados de la categoría. */
export default function CYEActaD15({ categoria, participantes = [], evaluaciones = [], consolidado, acta, panel, usuario, esStaff, onAbrirPanel, onToast }) {
  const cerradoD14 = consolidado?.estado === 'cerrado';
  const cerrada = acta?.estado === 'cerrada';
  const filas = useMemo(
    () => (cerradoD14 && Array.isArray(consolidado?.filas)
      ? consolidado.filas
      : construirD14(participantes, evaluaciones, { dirimencia: consolidado?.dirimencia })),
    [cerradoD14, consolidado, participantes, evaluaciones]
  );
  const empates = detectarEmpatesPodioCYE(filas);
  const resultados = construirResultadosD15(filas);
  const firmantes = firmantesOrdenadosCYE(panel);
  const huboDirimencia = filas.some(f => f.dirimido && f.puesto && f.puesto <= 3);
  const criterioDesempate = huboDirimencia ? (consolidado?.dirimencia?.criterio || '') : '';

  const [datos, setDatos] = useState(() => datosIniciales(acta));
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { setDatos(datosIniciales(acta)); }, [acta, categoria]);

  const { dia, mes, anio } = formatearFechaLarga(datos.fecha);
  const editable = esStaff && !cerrada;

  const guardar = async (cerrar) => {
    if (cerrar && !cerradoD14) { if (onToast) onToast('Primero debe cerrarse el consolidado D14 de la categoría.', 'error'); return; }
    if (cerrar && esPreliminarCYE(panel)) { if (onToast) onToast('El acta se cierra con el Panel de Firmas sellado.', 'error'); return; }
    try {
      setGuardando(true);
      await guardarCYEActa(categoria, { ...datos, resultados, criterioDesempate }, usuario, { cerrar });
      if (onToast) onToast(cerrar ? 'Acta D15 cerrada.' : 'Datos del acta guardados.', 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar el acta: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descargar = async () => {
    try {
      const banner = await obtenerMembreteCYE();
      generarD15PDF({ categoria, datos, resultados, panel, banner, criterioDesempate });
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el D15: ${err.message}`, 'error');
    }
  };

  const campo = (clave, etiqueta, tipo = 'text') => (
    <div>
      <label style={S.etiqueta}>{etiqueta}</label>
      <input type={tipo} value={datos[clave]} readOnly={!editable} onChange={e => setDatos(d => ({ ...d, [clave]: e.target.value }))}
        style={{ ...S.input, background: editable ? C.white : C.g100 }} />
    </div>
  );

  const celda = { border: `1px solid ${C.g300}`, padding: '8px 10px', fontSize: 12.5, color: C.g800 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TarjetaPanelFirmas panel={panel} onAbrir={onAbrirPanel} esStaff={esStaff} />

      {!cerradoD14 && <div style={aviso('alerta')}>Vista previa: el acta toma los resultados del consolidado D14 cuando este se cierra.</div>}
      {empates.length > 0 && <div style={aviso('error')}>Hay un empate en el podio sin dirimir. Resuélvalo en el Anexo D14 antes de emitir el acta.</div>}

      {editable && (
        <div style={{ ...S.seccion, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {campo('region', 'Región')}
          {campo('provincia', 'Provincia')}
          {campo('distrito', 'Distrito')}
          {campo('fecha', 'Fecha', 'date')}
          {campo('hora', 'Hora', 'time')}
        </div>
      )}

      <div style={{ ...S.tarjeta, padding: '26px 28px', maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>ANEXO D15</div>
        <h3 style={{ textAlign: 'center', margin: '2px 0 16px', fontFamily: FUENTES.serif, fontWeight: 400, fontSize: 22, color: C.navy2 }}>Acta de resultados</h3>
        <p style={{ fontSize: 13.5, lineHeight: 1.75, color: C.g800, margin: 0, textAlign: 'justify' }}>
          En la región de <strong>{datos.region}</strong>, provincia de <strong>{datos.provincia}</strong>, distrito de <strong>{datos.distrito}</strong> con fecha <strong>{dia} de {mes}</strong> de <strong>{anio}</strong>, a horas <strong>{datos.hora}</strong>, durante el proceso de evaluación del Concurso Nacional Crea y Emprende (CYE) de la etapa <strong>{CYE_CONFIG.etapa}</strong>, de la categoría <strong>{categoria}</strong>, el jurado calificador, conformado por las siguientes personalidades:
        </p>
        <ol style={{ fontSize: 13.5, color: C.g800, lineHeight: 1.8, margin: '8px 0 8px 22px', padding: 0 }}>
          {SLOTS_JURADO.map((s, i) => (
            <li key={s}>{firmantes[i]?.nombreCompleto || <span style={{ color: C.g300 }}>_______________________________________</span>}</li>
          ))}
        </ol>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: C.g800, margin: '0 0 12px' }}>{TEXTOS_LEGALES_CYE.transicionActa}</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr>
                {['Orden de mérito', 'I. E.', 'UGEL', 'DRE/GRE', 'Nombre del proyecto'].map(t => (
                  <th key={t} style={{ ...celda, background: C.navy3, color: C.white, fontWeight: 700, fontSize: 12 }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(puesto => {
                const r = resultados.find(x => x.puesto === puesto);
                return (
                  <tr key={puesto}>
                    <td style={{ ...celda, textAlign: 'center', fontWeight: 800 }}>{puesto}°</td>
                    <td style={{ ...celda, fontWeight: 700 }}>{r?.institucion || ''}</td>
                    <td style={celda}>{r ? r.ugel : ''}</td>
                    <td style={celda}>{r ? r.dre : ''}</td>
                    <td style={celda}>{r?.nombreProyecto || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {criterioDesempate && (
          <p style={{ fontSize: 12, color: C.g700, marginTop: 10, lineHeight: 1.5 }}>Empate resuelto por el jurado calificador. {criterioDesempate}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginTop: 28 }}>
          {SLOTS_JURADO.map((s, i) => {
            const f = firmantes[i];
            return (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ height: 58, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {f?.firmaDataUrl && <img src={f.firmaDataUrl} alt={`Firma del Jurado N.° ${s}`} style={{ maxHeight: 54, maxWidth: '90%', objectFit: 'contain' }} />}
                </div>
                <div style={{ borderTop: `1px solid ${C.g500}`, paddingTop: 4, fontSize: 11.5, color: C.g800, lineHeight: 1.5 }}>
                  <div>Nombres Apellidos: <strong>{f?.nombreCompleto || ''}</strong></div>
                  <div>DNI {f?.dni || ''}</div>
                  <div style={{ fontWeight: 800, color: C.navy2 }}>Jurado Nº {s}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" onClick={descargar} style={btn('real')}>
          <Icon name="download" size={13} color={C.white} /> Descargar D15 (PDF)
        </button>
        {editable && (
          <button type="button" onClick={() => guardar(false)} disabled={guardando} style={guardando ? btnDeshabilitado(btn('contorno')) : btn('contorno')}>
            <Icon name="save" size={13} /> Guardar datos del acta
          </button>
        )}
        {editable && (
          <button type="button" onClick={() => guardar(true)} disabled={guardando} style={guardando ? btnDeshabilitado(btn('exito')) : btn('exito')}>
            <Icon name="lock" size={13} color={C.white} /> Cerrar acta
          </button>
        )}
        {cerrada && <span style={S.chip('#DCFCE7', C.green, '#86EFAC')}>ACTA CERRADA</span>}
      </div>
    </div>
  );
}
