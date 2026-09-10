import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, CE, S, btn, btnDeshabilitado, aviso } from './ekEstilos';
import { TEXTOS_LEGALES } from '../../data/eurekaCatalogos';
import { EUREKA_CONFIG, SLOTS_JURADO, getArea, getCategoria } from '../../data/eurekaConfigUGEL03';
import {
  construirConsolidadoE19, detectarEmpatesTop3, construirResultadosActa
} from '../../utils/eurekaHelpers';
import { firmantesOrdenados, esPreliminar, etiquetaGobernanza } from '../../utils/eurekaFirmas';
import { setEKActa, cerrarEKActa } from '../../firebase/dbEureka';
import { generarE20PDF, generarE20CategoriaCompletaPDF, construirTextoActa, construirParrafoClasificacion } from '../../pdf/generarE20PDF';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';

/**
 * Anexo E20 — Acta de resultados.
 * Los tres jurados y el podio se resuelven automáticamente desde el Panel de Firmas y el
 * consolidado; se muestran en solo lectura. El párrafo de cierre es condicional: para las
 * categorías A, B y C la participación finaliza en la etapa UGEL; para D y E, el 1.er
 * puesto clasifica a la etapa DRE.
 */
export default function EKActaE20({
  categoria,
  areaId,
  participantes = [],
  evaluaciones = [],
  actaGuardada,
  panel,
  panelesMap = {},
  usuario,
  esStaff = false,
  onAbrirPanel,
  onToast
}) {
  const cat = getCategoria(categoria);
  const area = getArea(areaId);

  const [form, setForm] = useState({
    region: actaGuardada?.region || EUREKA_CONFIG.region,
    provincia: actaGuardada?.provincia || EUREKA_CONFIG.provincia,
    distrito: actaGuardada?.distrito || EUREKA_CONFIG.distrito,
    fecha: actaGuardada?.fecha || EUREKA_CONFIG.fechaEvaluacion,
    hora: actaGuardada?.hora || EUREKA_CONFIG.horaActa,
    incluirPuntaje: actaGuardada?.incluirPuntaje || false
  });
  const [guardando, setGuardando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const filas = useMemo(
    () => construirConsolidadoE19(participantes, evaluaciones),
    [participantes, evaluaciones]
  );
  const empates = useMemo(() => detectarEmpatesTop3(filas), [filas]);
  const resultados = useMemo(
    () => construirResultadosActa(filas, { incluirPuntaje: form.incluirPuntaje }),
    [filas, form.incluirPuntaje]
  );

  const acta = useMemo(() => ({
    ...form,
    categoria,
    areaId,
    etapa: EUREKA_CONFIG.etapa,
    resultados,
    clasificaEtapaDRE: cat ? !cat.finalizaEnUGEL : false,
    estado: actaGuardada?.estado || 'borrador'
  }), [form, categoria, areaId, resultados, cat, actaGuardada?.estado]);

  const firmantes = firmantesOrdenados(panel);
  const sellado = !esPreliminar(panel);
  const cerrada = actaGuardada?.estado === 'cerrada';

  const guardarActa = async () => {
    try {
      setGuardando(true);
      await setEKActa(categoria, areaId, acta);
      if (onToast) onToast('Acta E20 guardada.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar el acta: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarActaOficial = async () => {
    if (empates.length > 0) {
      if (onToast) onToast('No se puede emitir el acta con empates sin dirimir en el podio.', 'error');
      return;
    }
    if (!window.confirm('¿Cerrar el acta de resultados de esta categoría y área?')) return;
    try {
      setGuardando(true);
      await setEKActa(categoria, areaId, acta);
      await cerrarEKActa(categoria, areaId, { usuario, panelFirmasScopeId: panel?.id || null });
      if (onToast) onToast('Acta E20 cerrada.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo cerrar el acta: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descargarPDF = async () => {
    if (empates.length > 0) {
      if (onToast) onToast('El acta no puede emitirse mientras exista un empate sin dirimir en el podio.', 'error');
      return;
    }
    try {
      setDescargando(true);
      if (onToast) onToast('Generando el Anexo E20...', 'info');
      const banner = await obtenerMembreteEureka();
      generarE20PDF(acta, { panel, banner });
      if (onToast) {
        onToast(
          esPreliminar(panel)
            ? 'Acta descargada como documento preliminar: el Panel de Firmas aún no ha sido sellado.'
            : 'Acta E20 descargada.',
          esPreliminar(panel) ? 'alerta' : 'exito'
        );
      }
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el acta: ${err.message}`, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const descargarCategoriaCompleta = async () => {
    try {
      setDescargando(true);
      const banner = await obtenerMembreteEureka();
      await generarE20CategoriaCompletaPDF([acta], { categoria, panelesMap, banner });
      if (onToast) onToast('Descarga completada.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div>
      {empates.length > 0 && (
        <div style={{ ...aviso('error'), marginBottom: 18, padding: '16px 20px', borderRadius: 8, fontSize: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
            <Icon name="alert" size={16} color={C.error} />
            Alerta de empates en el podio:
          </span>{' '}
          {empates.map(p => TEXTOS_LEGALES.bannerEmpate.replace('{puesto}', p)).join(' ')}
          {' '}La emisión del acta oficial está bloqueada hasta que se resuelva la dirimencia desde el Consolidado E19.
        </div>
      )}

      {!sellado && (
        <div style={{
          ...aviso('alerta'), marginBottom: 18, padding: '16px 20px', borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.12)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert-triangle" size={18} />
              <span>{TEXTOS_LEGALES.avisoPanelPendiente}</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 4, color: '#78350F' }}>{etiquetaGobernanza(panel)}</div>
          </div>
          <button type="button" onClick={onAbrirPanel} style={{ ...btn('primario'), fontSize: 13.5, padding: '10px 18px' }}>
            <Icon name="shield" size={15} /> Abrir Panel de Firmas
          </button>
        </div>
      )}

      {/* ── Datos del acta ── */}
      <div style={{ ...S.seccion, marginBottom: 20 }}>
        <div style={{ ...S.tituloSeccion, fontSize: 16 }}>Datos de emisión del acta</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Campo etiqueta="Región" valor={form.region} onChange={v => setForm({ ...form, region: v })} soloLectura={cerrada || !esStaff} />
          <Campo etiqueta="Provincia" valor={form.provincia} onChange={v => setForm({ ...form, provincia: v })} soloLectura={cerrada || !esStaff} />
          <Campo etiqueta="Distrito" valor={form.distrito} onChange={v => setForm({ ...form, distrito: v })} soloLectura={cerrada || !esStaff} />
          <Campo etiqueta="Fecha de emisión" tipo="date" valor={form.fecha} onChange={v => setForm({ ...form, fecha: v })} soloLectura={cerrada || !esStaff} />
          <Campo etiqueta="Hora de emisión" tipo="time" valor={form.hora} onChange={v => setForm({ ...form, hora: v })} soloLectura={cerrada || !esStaff} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
          <Lectura etiqueta="Categoría" valor={cat ? `${cat.nombre} — ${cat.grados}` : categoria} />
          <Lectura etiqueta="Área de participación" valor={area ? area.nombre : areaId} />
          <Lectura etiqueta="DRE/GRE" valor={EUREKA_CONFIG.dre} />
          <Lectura etiqueta="UGEL" valor={EUREKA_CONFIG.ugel} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 13.5, color: C.gris800, cursor: 'pointer', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={form.incluirPuntaje}
            disabled={cerrada || !esStaff}
            onChange={e => setForm({ ...form, incluirPuntaje: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: CE.verdeEureka, cursor: 'pointer' }}
          />
          Incluir el puntaje en la tabla de resultados oficial
        </label>
      </div>

      {/* ── Vista previa del acta ── */}
      <div style={{ ...S.seccion, marginBottom: 20 }}>
        <div style={{ ...S.tituloSeccion, fontSize: 16 }}>Vista previa del documento oficial (Anexo E20)</div>

        <div style={{
          background: C.blanco, border: `1.5px solid ${CE.verdeBorde}`, borderRadius: 8,
          padding: 24, fontSize: 14, color: C.gris900, lineHeight: 1.8, textAlign: 'justify',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <p style={{ margin: '0 0 14px' }}>{construirTextoActa(acta)}</p>

          <ol style={{ margin: '0 0 16px', paddingLeft: 28 }}>
            {SLOTS_JURADO.map((slot, i) => {
              const f = firmantes[i];
              return (
                <li key={slot} style={{ marginBottom: 6, fontWeight: 700, fontSize: 14, color: f ? C.navy2 : C.gris500 }}>
                  {f ? f.nombreCompleto.toUpperCase() : '________________________________________'}
                  {f?.dni ? `  (DNI ${f.dni})` : ''}
                  {f?.presidente ? '  — Presidente del jurado' : ''}
                </li>
              );
            })}
          </ol>

          <p style={{ margin: '0 0 16px' }}>{TEXTOS_LEGALES.transicionActaE20}</p>

          <table style={{ ...S.tabla, background: C.blanco, marginBottom: 16, border: '1px solid #D6DCE8', borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#1B3A5C', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: 140, color: '#FFFFFF', textAlign: 'center', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase' }}>Orden de mérito</th>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase' }}>Institución Educativa</th>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: 95, color: '#FFFFFF', textAlign: 'center', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase' }}>UGEL</th>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: 130, color: '#FFFFFF', textAlign: 'center', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase' }}>DRE/GRE</th>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase' }}>Nombre del proyecto</th>
                {form.incluirPuntaje && (
                  <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: 90, color: '#FFFFFF', textAlign: 'center', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase' }}>Puntaje</th>
                )}
              </tr>
            </thead>
            <tbody>
              {resultados.length === 0 && (
                <tr>
                  <td colSpan={form.incluirPuntaje ? 6 : 5} style={{ ...S.td, textAlign: 'center', color: C.gris500, padding: 24, fontSize: 13.5 }}>
                    Aún no hay proyectos con las {SLOTS_JURADO.length} evaluaciones registradas y puntaje válido en esta área.
                  </td>
                </tr>
              )}
              {resultados.map(r => {
                const esPrimero = r.puesto === 1;
                const esSegundo = r.puesto === 2;
                const esTercero = r.puesto === 3;
                const estiloPodio = esPrimero
                  ? { fondo: '#FEF9C3', texto: '#854D0E', borde: '#FDE047', label: '1.er Puesto', badgeBg: '#CA8A04' }
                  : esSegundo
                  ? { fondo: '#F1F5F9', texto: '#334155', borde: '#CBD5E1', label: '2.° Puesto', badgeBg: '#64748B' }
                  : esTercero
                  ? { fondo: '#FFEDD5', texto: '#9A3412', borde: '#FDBA74', label: '3.er Puesto', badgeBg: '#B45309' }
                  : null;

                return (
                  <tr key={r.puesto} style={{ background: estiloPodio ? estiloPodio.fondo : C.blanco }}>
                    <td style={{ ...S.td, fontWeight: 700, textAlign: 'center', fontSize: 13, border: '1px solid #D6DCE8' }}>
                      {estiloPodio ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 20,
                          background: estiloPodio.badgeBg, border: 'none',
                          color: '#FFFFFF', fontWeight: 800, fontSize: 12.5
                        }}>
                          <Icon name="award" size={13} color="#FFFFFF" />
                          <span>{estiloPodio.label}</span>
                        </span>
                      ) : (
                        r.ordenMerito
                      )}
                    </td>
                    <td style={{ ...S.td, fontSize: 13, fontWeight: 700, color: '#0F172A', border: '1px solid #D6DCE8' }}>{r.institucion}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontSize: 12.5, border: '1px solid #D6DCE8' }}>{r.ugel}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontSize: 12.5, border: '1px solid #D6DCE8' }}>{r.dre}</td>
                    <td style={{ ...S.td, fontSize: 13, fontWeight: 600, color: '#1E293B', border: '1px solid #D6DCE8' }}>{r.nombreProyecto}</td>
                    {form.incluirPuntaje && (
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#15803D', border: '1px solid #D6DCE8', fontFamily: "'JetBrains Mono', monospace" }}>
                        {r.puntajeTotal ?? '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{
            margin: '16px 0 0', padding: 14, borderRadius: 6,
            background: cat && cat.finalizaEnUGEL ? '#F0FDF4' : '#EFF6FF',
            border: `1px solid ${cat && cat.finalizaEnUGEL ? '#86EFAC' : '#BFDBFE'}`,
            fontWeight: 700, fontSize: 13,
            color: cat && cat.finalizaEnUGEL ? '#166534' : '#1E40AF'
          }}>
            {construirParrafoClasificacion(acta)}
          </div>
        </div>

        <div style={{ fontSize: 12, color: C.gris500, marginTop: 10 }}>
          Nota: El podio se resuelve automáticamente desde el Consolidado E19 y los firmantes desde el Panel de Firmas Oficial.
        </div>
      </div>

      {/* ── Acciones ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={descargarPDF}
          disabled={descargando || empates.length > 0}
          style={(descargando || empates.length > 0) ? btnDeshabilitado(btn('real')) : btn('real', { minHeight: 40, padding: '9px 18px', fontSize: 13 })}
        >
          <Icon name="download" size={14} color="#FFFFFF" /> {descargando ? 'Generando...' : 'Descargar E20 (PDF)'}
        </button>

        <button
          type="button"
          onClick={descargarCategoriaCompleta}
          disabled={descargando || empates.length > 0}
          style={(descargando || empates.length > 0) ? btnDeshabilitado(btn('indigo')) : btn('indigo', { minHeight: 40, padding: '9px 18px', fontSize: 13 })}
        >
          <Icon name="download" size={14} color="#FFFFFF" /> E20 de toda la categoría
        </button>

        {esStaff && (
          <button
            type="button"
            onClick={guardarActa}
            disabled={guardando}
            style={guardando ? btnDeshabilitado(btn('secundario')) : btn('secundario', { minHeight: 40, padding: '9px 16px', fontSize: 13 })}
          >
            <Icon name="save" size={14} /> Guardar borrador del acta
          </button>
        )}

        {esStaff && !cerrada && (
          <button
            type="button"
            onClick={cerrarActaOficial}
            disabled={guardando || empates.length > 0}
            style={(guardando || empates.length > 0) ? btnDeshabilitado(btn('exito')) : btn('exito', { minHeight: 40, padding: '9px 20px', fontSize: 13.5 })}
          >
            <Icon name="lock" size={14} color="#FFFFFF" /> Cerrar acta oficial
          </button>
        )}

        {cerrada && <span style={{ ...S.chip('#DCFCE7', C.exito, '#86EFAC'), alignSelf: 'center', fontSize: 13, padding: '6px 14px' }}>ACTA CERRADA</span>}
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, tipo = 'text', soloLectura }) {
  return (
    <div>
      <label style={{ ...S.etiqueta, fontSize: 13, marginBottom: 5 }}>{etiqueta}</label>
      <input
        type={tipo}
        value={valor || ''}
        readOnly={soloLectura}
        onChange={e => onChange(e.target.value)}
        style={{
          ...S.input,
          padding: '10px 12px',
          fontSize: 13.5,
          minHeight: 44,
          background: soloLectura ? C.gris100 : C.blanco
        }}
      />
    </div>
  );
}

function Lectura({ etiqueta, valor }) {
  return (
    <div>
      <label style={{ ...S.etiqueta, fontSize: 13, marginBottom: 5 }}>{etiqueta}</label>
      <div style={{
        padding: '10px 12px', fontSize: 13.5, color: C.gris800, fontWeight: 600,
        background: C.gris100, border: `1px solid ${C.gris300}`, borderRadius: 6,
        minHeight: 44, display: 'flex', alignItems: 'center'
      }}>
        {valor || '—'}
      </div>
    </div>
  );
}
