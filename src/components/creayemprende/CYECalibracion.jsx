import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso } from './cyeEstilos';
import CYEAnexoPlegable from './CYEAnexoPlegable';
import { PROTOCOLO_CALIBRACION_CYE, PROPUESTAS_CALIBRACION_CYE, gruposDeCategoria } from '../../data/creaEmprendeConfig';
import { getInstrumentosCategoria } from '../../data/creaEmprendeRubricas';
import { juradosDeGrupo } from '../../data/creaEmprendeJurados';
import { calcularFicha, calcularCalibracionCYE, candidatosAnclaCalibracion, resumenGradoSeccion } from '../../utils/creaEmprendeHelpers';
import { guardarCYECalibracionConfig, guardarCYECalibracionFicha, guardarAcuerdosCalibracionCYE } from '../../firebase/dbCreaEmprende';
import { obtenerMembreteCYE } from '../../pdf/membreteCreaEmprende';
import { generarActaCalibracionPDF } from '../../pdf/generarDocumentosCYEPDF';

const VISUAL = {
  acuerdo: { etiqueta: 'Acuerdo', fondo: '#F0FDF4', texto: '#15803D', borde: '#BBF7D0' },
  revisar: { etiqueta: 'Revisar', fondo: '#FFFBEB', texto: '#B45309', borde: '#FDE68A' },
  discrepancia: { etiqueta: 'Discrepancia', fondo: '#FEF2F2', texto: '#B91C1C', borde: '#FECACA' },
  sin_datos: { etiqueta: 'Sin datos', fondo: '#F8FAFC', texto: '#64748B', borde: '#E2E8F0' }
};
const VACIO = { D10: {}, D11: {}, D12: {} };
const completo = (r, p = {}) => r.criterios.every(c => Number(p[c.id]) >= 1);
const fmt = v => (v == null ? '—' : (Math.round(v * 10) / 10).toString());

/**
 * Calibración previa entre grupos.
 * Todos los jurados de una categoría califican el mismo proyecto ancla (un proyecto no apto,
 * que no compite). La comisión ve la dispersión por criterio y por grupo, conduce la discusión
 * y registra los acuerdos, que luego aparecen como guía en las fichas oficiales.
 */
export default function CYECalibracion(props) {
  return props.esStaff ? <PanelComision {...props} /> : <FichaJurado {...props} />;
}

function TarjetaAncla({ ancla, categoria }) {
  return (
    <div style={{ ...S.tarjeta, padding: '14px 16px', borderLeft: `5px solid ${C.gold}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>PROYECTO DE CALIBRACIÓN — CATEGORÍA {categoria}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginTop: 2 }}>{ancla.tituloProyecto}</div>
      <div style={{ fontSize: 12, color: C.g500, marginTop: 2 }}>{ancla.institucion?.nombre} · {resumenGradoSeccion(ancla.integrantes)}</div>
      <div style={{ fontSize: 12, color: C.g700, marginTop: 6 }}>Este proyecto no compite. Sus calificaciones solo sirven para alinear criterios y no forman parte de los resultados.</div>
      {ancla.enlaceWeb && (
        <a href={ancla.enlaceWeb} target="_blank" rel="noreferrer" style={{ ...btn('real'), textDecoration: 'none', marginTop: 10 }}>
          <Icon name="folderOpen" size={14} color={C.white} /> Abrir portafolio <Icon name="externalLink" size={12} color={C.white} />
        </a>
      )}
    </div>
  );
}

function FichaJurado({ participantes = [], fichas = [], config, usuario, categoriasSesion = [], onToast }) {
  const categoria = categoriasSesion.includes('B') ? 'B' : 'A';
  const ancla = participantes.find(p => p.id === config?.anclas?.[categoria]);
  const idFicha = `${categoria}__${usuario?.uid}`;
  const miFicha = fichas.find(f => f.id === idFicha);
  const rubricas = useMemo(() => getInstrumentosCategoria(categoria), [categoria]);
  const [puntajes, setPuntajes] = useState(VACIO);
  const [abierto, setAbierto] = useState('D10');
  const cargadoRef = useRef(false);
  const sucioRef = useRef(false);

  useEffect(() => {
    if (cargadoRef.current || !miFicha) return;
    const b = miFicha.puntajes || VACIO;
    setPuntajes({ D10: { ...(b.D10 || {}) }, D11: { ...(b.D11 || {}) }, D12: { ...(b.D12 || {}) } });
    cargadoRef.current = true;
  }, [miFicha]);

  const calculo = calcularFicha(categoria, puntajes);
  const enviada = miFicha?.estado === 'enviada';

  const guardar = async (estado, silencioso = false) => {
    if (!ancla) return;
    if (estado === 'enviada' && !calculo.completa) {
      if (onToast) onToast(`Faltan ${calculo.criteriosPendientes} criterio(s) por calificar.`, 'error');
      return;
    }
    try {
      await guardarCYECalibracionFicha({ categoria, participanteId: ancla.id, puntajes, estado, puntajeTotal: calculo.puntajeTotal, completa: calculo.completa }, usuario);
      sucioRef.current = false;
      if (!silencioso && onToast) onToast(estado === 'enviada' ? 'Calificación de calibración enviada.' : 'Avance guardado.', 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    if (!sucioRef.current || enviada) return undefined;
    const t = setTimeout(() => guardar('borrador', true), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntajes]);

  if (!config?.abierta || !ancla) {
    return <div style={aviso('info')}>La comisión habilitará aquí el ejercicio de calibración antes de la evaluación oficial.</div>;
  }

  const calificar = (anexo, criterioId, valor) => {
    if (enviada) return;
    const r = rubricas.find(x => x.anexo === anexo);
    const antes = completo(r, puntajes[anexo]);
    const nuevos = { ...puntajes, [anexo]: { ...puntajes[anexo], [criterioId]: valor } };
    sucioRef.current = true;
    setPuntajes(nuevos);
    if (!antes && completo(r, nuevos[anexo])) {
      const siguiente = rubricas.find(x => x.anexo !== anexo && !completo(x, nuevos[x.anexo]));
      setTimeout(() => setAbierto(siguiente ? siguiente.anexo : null), 350);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1000, margin: '0 auto' }}>
      <TarjetaAncla ancla={ancla} categoria={categoria} />
      <div style={aviso('info')}>{PROTOCOLO_CALIBRACION_CYE[0]}</div>
      {rubricas.map(r => (
        <CYEAnexoPlegable
          key={r.anexo}
          rubrica={r}
          puntajes={puntajes[r.anexo] || {}}
          calculo={calculo.anexos[r.anexo]}
          abierto={abierto === r.anexo}
          onAlternar={() => setAbierto(abierto === r.anexo ? null : r.anexo)}
          onCalificar={(id, v) => calificar(r.anexo, id, v)}
          soloLectura={enviada}
        />
      ))}
      <div style={{ position: 'sticky', bottom: 0, background: C.white, borderTop: `2px solid ${C.border}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxShadow: '0 -4px 16px rgba(15,23,42,0.10)', borderRadius: '8px 8px 0 0' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.g500 }}>PUNTAJE DE CALIBRACIÓN</div>
          <div style={{ fontFamily: FUENTES.mono, fontSize: 20, fontWeight: 800, color: C.g900 }}>{calculo.puntajeTotal}<span style={{ fontSize: 12, color: C.g500 }}> / {calculo.maximoTotal}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {enviada ? (
            <>
              <span style={S.chip('#DCFCE7', C.green, '#86EFAC')}>ENVIADA</span>
              <button type="button" onClick={() => guardar('borrador')} style={btn('contorno')}><Icon name="refresh" size={13} /> Corregir</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => guardar('borrador')} style={btn('contorno')}><Icon name="save" size={13} /> Guardar avance</button>
              <button type="button" onClick={() => guardar('enviada')} style={calculo.completa ? btn('exito') : btnDeshabilitado(btn('exito'))}>
                <Icon name="check" size={13} color={C.white} /> Enviar calificación
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelComision({ participantes = [], fichas = [], config, usuario, juradosFirestore = [], onToast }) {
  const [vista, setVista] = useState('A');
  const [acuerdos, setAcuerdos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const categoriaStats = vista === 'C' ? 'A' : vista;
  const anclas = config?.anclas || {};
  const candidatos = useMemo(() => (vista === 'C' ? [] : candidatosAnclaCalibracion(participantes, vista)), [participantes, vista]);
  const ancla = participantes.find(p => p.id === anclas[categoriaStats]);
  const resultado = useMemo(() => calcularCalibracionCYE(fichas, categoriaStats), [fichas, categoriaStats]);
  const guardados = config?.acuerdos?.[vista] || {};
  const claveGuardados = JSON.stringify(guardados);
  const propuestas = PROPUESTAS_CALIBRACION_CYE[vista] || {};

  useEffect(() => { setAcuerdos({ ...propuestas, ...guardados }); }, [vista, claveGuardados]); // eslint-disable-line react-hooks/exhaustive-deps

  const actualizarConfig = async (cambios, mensaje) => {
    try {
      await guardarCYECalibracionConfig(cambios, usuario);
      if (mensaje && onToast) onToast(mensaje, 'success');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    }
  };

  const guardarAcuerdos = async () => {
    const limpio = Object.fromEntries(Object.entries(acuerdos).map(([k, v]) => [k, String(v || '').trim()]).filter(([, v]) => v));
    try {
      setGuardando(true);
      await guardarAcuerdosCalibracionCYE(vista, limpio, usuario);
      if (onToast) onToast('Acuerdos guardados. Ya se muestran en las fichas oficiales.', 'success');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descargarActa = async () => {
    try {
      const banner = await obtenerMembreteCYE();
      generarActaCalibracionPDF({
        resultados: { A: calcularCalibracionCYE(fichas, 'A'), B: calcularCalibracionCYE(fichas, 'B') },
        anclas: { A: participantes.find(p => p.id === anclas.A), B: participantes.find(p => p.id === anclas.B) },
        acuerdos: config?.acuerdos || {},
        banner
      });
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el acta: ${err.message}`, 'error');
    }
  };

  const esperados = vista === 'C' ? [] : gruposDeCategoria(vista).flatMap(g => juradosDeGrupo(g, juradosFirestore));
  const enviadosCorreos = new Set(fichas.filter(f => f.categoria === categoriaStats && f.estado === 'enviada').map(f => String(f.jurado?.correo || '').toLowerCase()));
  const criteriosPorAnexo = ['D10', 'D11', 'D12'].map(a => ({ anexo: a, filas: resultado.criterios.filter(c => c.anexo === a) }));
  const vistaBrecha = VISUAL[resultado.estadoBrecha] || VISUAL.sin_datos;
  const celda = { ...S.td, padding: '6px 8px', fontSize: 11.5 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...S.seccion }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>CALIBRACIÓN PREVIA ENTRE GRUPOS</div>
            <h3 style={{ margin: 0, fontFamily: FUENTES.serif, fontWeight: 400, fontSize: 19, color: C.navy2 }}>Protocolo</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => actualizarConfig({ abierta: !config?.abierta }, config?.abierta ? 'Calibración cerrada para los jurados.' : 'Calibración habilitada para los jurados.')} style={btn(config?.abierta ? 'peligroSuave' : 'exito')}>
              <Icon name={config?.abierta ? 'lock' : 'play'} size={13} color={config?.abierta ? C.red : C.white} /> {config?.abierta ? 'Cerrar calibración' : 'Habilitar calibración'}
            </button>
            <button type="button" onClick={descargarActa} style={btn('real')}><Icon name="download" size={13} color={C.white} /> Acta de calibración (PDF)</button>
          </div>
        </div>
        <ol style={{ margin: '10px 0 0 20px', padding: 0, fontSize: 12.5, color: C.g700, lineHeight: 1.6 }}>
          {PROTOCOLO_CALIBRACION_CYE.map((t, i) => <li key={i}>{t}</li>)}
        </ol>
      </div>

      <div style={{ display: 'flex', background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {[{ id: 'A', label: 'Categoría A (Grupos 1 y 2)' }, { id: 'B', label: 'Categoría B (Grupos 3 y 4)' }, { id: 'C', label: 'Categoría C (acuerdos)' }].map(t => (
          <button key={t.id} type="button" onClick={() => setVista(t.id)} style={{ flex: 1, padding: '11px 8px', border: 'none', cursor: 'pointer', fontFamily: FUENTES.sans, fontSize: 12.5, fontWeight: 700, background: vista === t.id ? C.navy3 : C.white, color: vista === t.id ? C.white : C.g500 }}>
            {t.label}
          </button>
        ))}
      </div>

      {vista !== 'C' && (
        <div style={{ ...S.seccion, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={S.etiqueta}>Proyecto de calibración (no apto, no compite)</label>
            <select value={anclas[vista] || ''} onChange={e => actualizarConfig({ anclas: { ...anclas, [vista]: e.target.value } }, 'Proyecto de calibración actualizado.')} style={S.input}>
              <option value="">Seleccione un proyecto</option>
              {candidatos.map(p => <option key={p.id} value={p.id}>{p.institucion?.nombre} — {p.tituloProyecto} ({(p.integrantes || []).length} integrantes)</option>)}
            </select>
          </div>
          {!anclas[vista] && candidatos[0] && (
            <button type="button" onClick={() => actualizarConfig({ anclas: { ...anclas, [vista]: candidatos[0].id } }, 'Proyecto de calibración asignado.')} style={btn('dorado')}>
              Usar el sugerido
            </button>
          )}
        </div>
      )}

      {vista !== 'C' && ancla && <TarjetaAncla ancla={ancla} categoria={vista} />}

      {vista !== 'C' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ ...S.tarjeta, padding: 14 }}>
            <div style={S.etiqueta}>Participación</div>
            <div style={{ fontFamily: FUENTES.mono, fontSize: 22, fontWeight: 800, color: C.navy2 }}>{resultado.n} / {esperados.length}</div>
            <div style={{ fontSize: 11.5, color: C.g500, marginTop: 4 }}>
              Pendientes: {esperados.filter(j => !enviadosCorreos.has(String(j.correo).toLowerCase())).map(j => j.nombreCompleto).join('; ') || 'ninguno'}
            </div>
          </div>
          <div style={{ ...S.tarjeta, padding: 14 }}>
            <div style={S.etiqueta}>Promedio por grupo</div>
            {resultado.porGrupo.length === 0 && <div style={{ fontSize: 12, color: C.g500 }}>Sin calificaciones enviadas.</div>}
            {resultado.porGrupo.map(g => (
              <div key={g.grupo} style={{ fontSize: 13, color: C.g800 }}>Grupo {g.grupo}: <strong style={{ fontFamily: FUENTES.mono }}>{fmt(g.promedio)}</strong> <span style={{ color: C.g500 }}>({g.n})</span></div>
            ))}
            <div style={{ fontSize: 11.5, color: C.g500, marginTop: 4 }}>Mediana general: {fmt(resultado.mediana)} de {resultado.maximo}</div>
          </div>
          <div style={{ ...S.tarjeta, padding: 14, borderLeft: `4px solid ${vistaBrecha.texto}` }}>
            <div style={S.etiqueta}>Diferencia entre grupos</div>
            <div style={{ fontFamily: FUENTES.mono, fontSize: 22, fontWeight: 800, color: vistaBrecha.texto }}>{fmt(resultado.brechaGrupos)} pts</div>
            <span style={S.chip(vistaBrecha.fondo, vistaBrecha.texto, vistaBrecha.borde)}>{vistaBrecha.etiqueta.toUpperCase()}</span>
          </div>
        </div>
      )}

      <div style={{ ...S.tarjeta, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: vista === 'C' ? 600 : 980 }}>
            <thead>
              <tr>
                <th style={{ ...S.th, minWidth: 200 }}>Criterio</th>
                {vista !== 'C' && [1, 2, 3, 4].map(v => <th key={v} style={{ ...S.th, textAlign: 'center', width: 36 }}>{v}</th>)}
                {vista !== 'C' && <th style={{ ...S.th, textAlign: 'center', width: 70 }}>Rango</th>}
                {vista !== 'C' && <th style={{ ...S.th, textAlign: 'center', width: 120 }}>Promedio por grupo</th>}
                {vista !== 'C' && <th style={{ ...S.th, textAlign: 'center', width: 100 }}>Estado</th>}
                <th style={{ ...S.th, minWidth: 280 }}>Acuerdo del jurado</th>
              </tr>
            </thead>
            <tbody>
              {(vista === 'C'
                ? getInstrumentosCategoria('C').map(r => ({ anexo: r.anexo, filas: r.criterios.map(c => ({ clave: `${r.anexo}_${c.numero}`, numero: c.numero, nombre: c.nombre })) }))
                : criteriosPorAnexo
              ).map(bloque => (
                <React.Fragment key={bloque.anexo}>
                  <tr><td colSpan={vista === 'C' ? 2 : 9} style={{ ...celda, background: C.g100, fontWeight: 800, color: C.navy2 }}>Anexo {bloque.anexo}</td></tr>
                  {bloque.filas.map(c => {
                    const v = VISUAL[c.estado] || VISUAL.sin_datos;
                    const esPropuesta = propuestas[c.clave] && !guardados[c.clave];
                    return (
                      <tr key={c.clave}>
                        <td style={{ ...celda, fontWeight: 700, color: C.navy2 }}>{c.numero}. {c.nombre}</td>
                        {vista !== 'C' && [1, 2, 3, 4].map(n => (
                          <td key={n} style={{ ...celda, textAlign: 'center', fontFamily: FUENTES.mono, color: c.conteo[n] ? C.g900 : C.g300 }}>{c.conteo[n]}</td>
                        ))}
                        {vista !== 'C' && <td style={{ ...celda, textAlign: 'center', fontFamily: FUENTES.mono }}>{c.n ? `${c.min} a ${c.max}` : '—'}</td>}
                        {vista !== 'C' && (
                          <td style={{ ...celda, textAlign: 'center', fontFamily: FUENTES.mono }}>
                            {resultado.grupos.map(g => `G${g}: ${fmt(c.promediosPorGrupo[g])}`).join(' · ') || '—'}
                          </td>
                        )}
                        {vista !== 'C' && <td style={{ ...celda, textAlign: 'center' }}><span style={S.chip(v.fondo, v.texto, v.borde)}>{v.etiqueta}</span></td>}
                        <td style={celda}>
                          <textarea
                            value={acuerdos[c.clave] || ''}
                            onChange={e => setAcuerdos(a => ({ ...a, [c.clave]: e.target.value }))}
                            placeholder="Interpretación común acordada"
                            style={{ ...S.textarea, minHeight: 44, fontSize: 12, background: esPropuesta ? '#FFFBEB' : C.white }}
                          />
                          {esPropuesta && <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 700 }}>Propuesta por confirmar</div>}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: C.g500 }}>
            {vista === 'C' ? 'La categoría C se calibra con el proyecto de la categoría A y hereda sus acuerdos; aquí se registran los acuerdos propios de C.' : 'Acuerdo: rango de 0 o 1 nivel. Revisar: rango de 2 niveles o 1 nivel de diferencia entre grupos. Discrepancia: rango de 3 niveles.'}
          </span>
          <button type="button" onClick={guardarAcuerdos} disabled={guardando} style={guardando ? btnDeshabilitado(btn('primario')) : btn('primario')}>
            <Icon name="save" size={13} color={C.white} /> Guardar acuerdos
          </button>
        </div>
      </div>

      {vista !== 'C' && resultado.jurados.length > 0 && (
        <div style={{ ...S.tarjeta, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr>{['Jurado', 'Grupo', 'Puntaje', 'Diferencia con la mediana'].map(t => <th key={t} style={S.th}>{t}</th>)}</tr></thead>
              <tbody>
                {resultado.jurados.map(j => (
                  <tr key={j.uid}>
                    <td style={celda}>{j.nombre}</td>
                    <td style={celda}>Grupo {j.grupo}</td>
                    <td style={{ ...celda, fontFamily: FUENTES.mono }}>{j.total}</td>
                    <td style={{ ...celda, fontFamily: FUENTES.mono, color: j.alerta ? C.red : C.g800, fontWeight: j.alerta ? 800 : 400 }}>
                      {j.desvio > 0 ? '+' : ''}{fmt(j.desvio)}{j.alerta ? ' (conversar)' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
