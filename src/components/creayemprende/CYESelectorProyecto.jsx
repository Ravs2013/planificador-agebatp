import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S } from './cyeEstilos';
import { SLOTS_JURADO } from '../../data/creaEmprendeConfig';
import { calcularFicha, resumenGradoSeccion } from '../../utils/creaEmprendeHelpers';

/**
 * Bandeja de proyectos con el mismo diseño de tarjetas de Juegos Florales: borde lateral
 * de estado, casilleros de los tres jurados y acceso directo a la ficha.
 */
export default function CYESelectorProyecto({
  participantes = [],
  evaluaciones = [],
  numeroJuradoActivo = 1,
  onSeleccionar,
  esStaff = false,
  onLimpiarFicha,
  onMarcarNSP
}) {
  const [pestana, setPestana] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const porProyecto = useMemo(() => {
    const m = new Map();
    evaluaciones.forEach(ev => {
      if (!m.has(ev.participanteId)) m.set(ev.participanteId, {});
      m.get(ev.participanteId)[Number(ev.jurado?.numeroJurado)] = ev;
    });
    return m;
  }, [evaluaciones]);

  const estadoDe = (p) => porProyecto.get(p.id)?.[numeroJuradoActivo] || null;

  const calificados = participantes.filter(p => estadoDe(p)?.estado === 'registrada').length;

  const lista = useMemo(() => {
    let r = participantes;
    if (pestana === 'pendientes') r = r.filter(p => estadoDe(p)?.estado !== 'registrada' && !p.noSePresento);
    if (pestana === 'calificados') r = r.filter(p => estadoDe(p)?.estado === 'registrada');
    const q = busqueda.trim().toLowerCase();
    if (q) {
      r = r.filter(p => [p.institucion?.nombre, p.tituloProyecto, p.institucion?.codigoModular, String(p.numero || '')]
        .filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantes, pestana, busqueda, porProyecto, numeroJuradoActivo]);

  const pestanas = [
    { id: 'todos', label: `Todos (${participantes.length})`, color: C.navy2, borde: C.navy3 },
    { id: 'pendientes', label: `Pendientes (${participantes.length - calificados})`, color: C.amber, borde: '#F59E0B' },
    { id: 'calificados', label: `Calificados (${calificados})`, color: C.green, borde: C.green }
  ];

  return (
    <div style={{ ...S.tarjeta, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.g50 }}>
        {pestanas.map(t => {
          const activa = pestana === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setPestana(t.id)}
              style={{
                flex: 1, padding: '11px 6px', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer',
                fontFamily: FUENTES.sans, background: activa ? C.white : 'transparent',
                color: activa ? t.color : C.g500, borderBottom: `3px solid ${activa ? t.borde : 'transparent'}`
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar I. E., proyecto o N.°"
          style={{ ...S.input, paddingRight: 36, background: C.g50 }}
        />
        <span style={{ position: 'absolute', right: 26, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex' }}>
          <Icon name="search" size={15} />
        </span>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lista.length === 0 && (
          <div style={{ padding: 28, textAlign: 'center', fontSize: 13, color: C.amber, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontWeight: 700 }}>
            No hay proyectos en esta vista.
          </div>
        )}

        {lista.map(p => {
          const evs = porProyecto.get(p.id) || {};
          const mia = evs[numeroJuradoActivo];
          const registrada = mia?.estado === 'registrada';
          const borrador = mia && !registrada;
          const puntos = mia ? calcularFicha(p.categoria, mia.puntajes).puntajeTotal : null;
          const nsp = Boolean(p.noSePresento || mia?.incomparecencia || mia?.noSePresento);
          const tieneEvaluacion = Boolean(mia || (esStaff && Object.values(evs).some(Boolean)) || nsp);
          const colorBorde = nsp ? C.red : (registrada ? C.green : C.navy3);

          return (
            <div
              key={p.id}
              onClick={() => onSeleccionar(p)}
              style={{
                background: C.white, border: `1px solid ${nsp ? '#FCA5A5' : (registrada ? '#BBF7D0' : C.border)}`,
                borderLeft: `5px solid ${colorBorde}`, borderRadius: 8, padding: 14, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 4px rgba(15,23,42,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2, lineHeight: 1.35 }}>{p.institucion?.nombre}</div>
                  <div style={{ fontSize: 12, color: C.g800, marginTop: 3, lineHeight: 1.4 }}>
                    <strong>Proyecto:</strong> {p.tituloProyecto || 'Sin título registrado'}
                  </div>
                  <div style={{ fontSize: 11, color: C.g500, marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FUENTES.mono, fontWeight: 700, color: C.navy3 }}>N.° {p.numero || '—'}</span>
                    <span>{resumenGradoSeccion(p.integrantes)}</span>
                    <span>{(p.integrantes || []).length} integrantes</span>
                    {p.grupo && <span>Grupo {p.grupo}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {nsp && <span style={S.chip('#FEE2E2', C.red, '#FCA5A5')}>INCOMPARECENCIA (NSP)</span>}
                  {!nsp && registrada && <span style={S.chip('#F0FDF4', C.green, '#BBF7D0')}>EVALUADA / CERRADA ({puntos} pts)</span>}
                  {!nsp && borrador && <span style={S.chip('#EFF6FF', C.navy3, '#BFDBFE')}>EN BORRADOR ({puntos} pts)</span>}
                  {!nsp && !mia && <span style={S.chip(C.g50, C.g500, C.g200)}>PENDIENTE</span>}
                  {esStaff && p.estadoAdmision === 'observado' && <span style={S.chip('#FFFBEB', C.amber, '#FDE68A')}>OBSERVADO</span>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', paddingTop: 10, borderTop: `1px solid ${C.g100}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {esStaff ? (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.g500 }}>Jurados:</span>
                      {SLOTS_JURADO.map(slot => {
                        const e = evs[slot];
                        const reg = e?.estado === 'registrada';
                        return (
                          <span
                            key={slot}
                            title={`Jurado ${slot}: ${reg ? 'registrada' : (e ? 'borrador' : 'sin calificar')}`}
                            style={{
                              width: 24, height: 24, borderRadius: 4, fontSize: 10.5, fontWeight: 800,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: reg ? C.green : (e ? C.gold : C.g200),
                              color: reg || e ? C.white : C.g500,
                              outline: slot === numeroJuradoActivo ? `2px solid ${C.navy1}` : 'none', outlineOffset: 1
                            }}
                          >
                            {reg ? <Icon name="check" size={12} color={C.white} /> : slot}
                          </span>
                        );
                      })}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.g500 }}>Su estado:</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: registrada ? '#F0FDF4' : (borrador ? '#EFF6FF' : C.g100),
                        color: registrada ? C.green : (borrador ? C.navy3 : C.g500),
                        border: `1px solid ${registrada ? '#BBF7D0' : (borrador ? '#BFDBFE' : C.g200)}`
                      }}>
                        {registrada ? 'Calificación registrada' : (borrador ? 'Borrador en curso' : 'Pendiente de calificar')}
                      </span>
                    </div>
                  )}
                  {p.enlaceWeb && (
                    <a
                      href={p.enlaceWeb}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.sky,
                        textDecoration: 'none', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: 4, marginLeft: 4
                      }}
                    >
                      <Icon name="externalLink" size={11} color={C.sky} /> Portafolio
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {tieneEvaluacion && onLimpiarFicha && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onLimpiarFicha(p, mia || Object.values(evs).find(Boolean));
                      }}
                      style={{
                        background: '#FFF1F2', color: '#B91C1C', border: '1px solid #FECDD3',
                        borderRadius: 6, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
                      }}
                      title="Limpiar la ficha de este proyecto y dejarla en blanco"
                    >
                      <Icon name="trash" size={12} color="#B91C1C" /> Limpiar Ficha
                    </button>
                  )}

                  {!nsp && !registrada && onMarcarNSP && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onMarcarNSP(p);
                      }}
                      style={{
                        background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5',
                        borderRadius: 6, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
                      }}
                      title="Marcar incomparecencia (NSP) sin ingresar a la ficha"
                    >
                      <Icon name="x" size={12} color="#DC2626" /> Marcar NSP
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onSeleccionar(p); }}
                    style={{
                      background: nsp ? C.red : (registrada ? C.green : C.navy3), color: C.white, border: 'none', borderRadius: 6,
                      padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                      boxShadow: nsp ? '0 2px 6px rgba(220,38,38,0.25)' : (registrada ? '0 2px 6px rgba(22,163,74,0.25)' : '0 2px 6px rgba(12,25,41,0.25)')
                    }}
                  >
                    {nsp ? 'Ver Ficha NSP →' : (registrada ? 'Ver Ficha →' : 'Evaluar Ficha →')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
