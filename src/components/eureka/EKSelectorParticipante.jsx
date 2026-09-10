import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, CE, S, btn } from './ekEstilos';
import { SLOTS_JURADO, getLinea } from '../../data/eurekaConfigUGEL03';
import { nombresEstudiantes, resolverAnexoPorDefecto } from '../../utils/eurekaHelpers';

/**
 * Navegación lateral entre proyectos — Optimizada para evaluadores y jurados mayores.
 * Pestañas rápidas: Todos / Pendientes / Calificados.
 * Tarjetas con tipografía amplia, búsqueda en vivo y visualización clara de los 3 jurados.
 */
export default function EKSelectorParticipante({
  participantes = [],
  evaluaciones = [],
  seleccionado,
  onSeleccionar,
  onMarcarNoPresentado,
  categoria,
  areaId,
  numeroJuradoActivo = 1,
  esStaff = false,
  onLimpiarFicha,
  onMarcarNSP
}) {
  const [filtro, setFiltro] = useState('');
  const [tabEstado, setTabEstado] = useState('todos'); // 'todos' | 'pendientes' | 'calificados'

  const estadoPorParticipante = useMemo(() => {
    const mapa = new Map();
    evaluaciones.forEach(ev => {
      const pId = ev.participanteId;
      if (!mapa.has(pId)) mapa.set(pId, {});
      mapa.get(pId)[ev.jurado?.numeroJurado] = ev.estado;
    });
    return mapa;
  }, [evaluaciones]);

  const listaFiltrada = useMemo(() => {
    let result = participantes;

    // Filtro por pestaña de estado
    if (tabEstado === 'pendientes') {
      result = result.filter(p => {
        const est = estadoPorParticipante.get(p.id) || {};
        // Pendiente para el jurado actual o incompleto
        return est[numeroJuradoActivo] !== 'registrada';
      });
    } else if (tabEstado === 'calificados') {
      result = result.filter(p => {
        const est = estadoPorParticipante.get(p.id) || {};
        return est[numeroJuradoActivo] === 'registrada';
      });
    }

    // Filtro por texto de búsqueda
    const f = filtro.trim().toLowerCase();
    if (!f) return result;
    return result.filter(p => {
      const texto = [
        p.institucion?.nombre, p.institucionNombre, p.tituloProyecto,
        p.codigoParticipante, p.pseudonimo, nombresEstudiantes(p)
      ].filter(Boolean).join(' ').toLowerCase();
      return texto.includes(f);
    });
  }, [participantes, tabEstado, filtro, estadoPorParticipante, numeroJuradoActivo]);

  const completadosMiCasillero = useMemo(
    () => participantes.filter(p => {
      const est = estadoPorParticipante.get(p.id) || {};
      return est[numeroJuradoActivo] === 'registrada';
    }).length,
    [participantes, estadoPorParticipante, numeroJuradoActivo]
  );

  const completadosTresJurados = useMemo(
    () => participantes.filter(p => {
      const est = estadoPorParticipante.get(p.id) || {};
      return SLOTS_JURADO.every(s => est[s] === 'registrada');
    }).length,
    [participantes, estadoPorParticipante]
  );

  return (
    <div style={{ ...S.tarjeta, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Pestañas de filtrado rápido y resumen */}
      <div style={{ display: 'flex', borderBottom: '1px solid #D6DCE8', background: '#F8FAFC' }}>
        <button
          type="button"
          onClick={() => setTabEstado('todos')}
          style={{
            flex: 1,
            padding: '11px 8px',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            background: tabEstado === 'todos' ? '#FFFFFF' : 'transparent',
            color: tabEstado === 'todos' ? '#122240' : '#64748B',
            borderBottom: `3px solid ${tabEstado === 'todos' ? '#1B3A5C' : 'transparent'}`,
            transition: 'all 0.15s ease'
          }}
        >
          Todos ({participantes.length})
        </button>
        <button
          type="button"
          onClick={() => setTabEstado('pendientes')}
          style={{
            flex: 1,
            padding: '11px 8px',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            background: tabEstado === 'pendientes' ? '#FFFFFF' : 'transparent',
            color: tabEstado === 'pendientes' ? '#B45309' : '#64748B',
            borderBottom: `3px solid ${tabEstado === 'pendientes' ? '#F59E0B' : 'transparent'}`,
            transition: 'all 0.15s ease'
          }}
        >
          Pendientes ({participantes.length - completadosMiCasillero})
        </button>
        <button
          type="button"
          onClick={() => setTabEstado('calificados')}
          style={{
            flex: 1,
            padding: '11px 8px',
            fontSize: 12.5,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            background: tabEstado === 'calificados' ? '#FFFFFF' : 'transparent',
            color: tabEstado === 'calificados' ? '#15803D' : '#64748B',
            borderBottom: `3px solid ${tabEstado === 'calificados' ? '#15803D' : 'transparent'}`,
            transition: 'all 0.15s ease'
          }}
        >
          Calificados ({completadosMiCasillero})
        </button>
      </div>

      {/* Caja de búsqueda rápida */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #D6DCE8', background: '#FFFFFF', position: 'relative' }}>
        <input
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar I. E., proyecto o pseudónimo..."
          style={{ ...S.input, padding: '10px 36px 10px 14px', fontSize: 13, background: '#F8FAFC' }}
        />
        {filtro ? (
          <button
            type="button"
            onClick={() => setFiltro('')}
            style={{
              position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Icon name="x" size={15} />
          </button>
        ) : (
          <span style={{ position: 'absolute', right: 26, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
            <Icon name="search" size={15} />
          </span>
        )}
      </div>

      {/* Lista de Tarjetas Estilo Juegos Florales */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {listaFiltrada.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontWeight: 700 }}>
            No se encontraron proyectos con el criterio seleccionado.
          </div>
        )}

        {listaFiltrada.map(p => {
          const activo = seleccionado?.id === p.id;
          const est = estadoPorParticipante.get(p.id) || {};
          const estadoMiCasillero = est[numeroJuradoActivo];
          const miEval = evaluaciones.find(ev => ev.participanteId === p.id && Number(ev.jurado?.numeroJurado) === Number(numeroJuradoActivo));
          const isNSP = Boolean(p.noSePresento || miEval?.incomparecencia || miEval?.noSePresento);
          const isRegistrado = !isNSP && estadoMiCasillero === 'registrada';
          const isBorrador = !isNSP && (estadoMiCasillero === 'borrador' || (miEval && !isRegistrado));
          const puntos = miEval?.puntajeTotal != null ? miEval.puntajeTotal : null;
          const tieneEvaluacion = Boolean(miEval || isNSP || (esStaff && Object.values(est).some(Boolean)));
          const linea = getLinea(areaId || p.areaId, p.lineaId);
          const anexoNum = p.anexoEvaluacion || resolverAnexoPorDefecto(categoria || p.categoria, areaId || p.areaId);
          const colorBorde = isNSP ? '#DC2626' : (isRegistrado ? '#15803D' : '#1B3A5C');

          return (
            <div
              key={p.id}
              onClick={() => onSeleccionar(p)}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${isNSP ? '#FCA5A5' : isRegistrado ? '#BBF7D0' : '#D6DCE8'}`,
                borderLeft: `5px solid ${colorBorde}`,
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activo ? '0 4px 14px rgba(27, 58, 92, 0.14)' : '0 1px 4px rgba(15,23,42,0.04)'
              }}
            >
              {/* Fila Superior: Nombre de la I.E. y Badge de Estado */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#122240', lineHeight: 1.4 }}>
                    {p.institucion?.nombre || p.institucionNombre || 'I. E. no registrada'}
                  </div>

                  <div style={{ fontSize: 12, color: '#1E293B', marginTop: 4, lineHeight: 1.4 }}>
                    <strong>Proyecto:</strong> {p.tituloProyecto || 'Sin título registrado'} &nbsp;·&nbsp;{' '}
                    <span style={{ color: '#CA8A04', fontWeight: 700 }}>
                      seudónimo: {p.pseudonimo || '—'}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Código SICE: {p.codigoParticipante || p.codigo || '—'}</span>
                    {p.ordenPresentacion > 0 && <span>Orden: N.° {p.ordenPresentacion}</span>}
                    {linea && <span>Línea: {linea.nombre}</span>}
                    <span style={{ fontWeight: 700, color: '#1E4D7B' }}>
                      Anexo E{anexoNum}
                    </span>
                  </div>
                </div>

                {/* Badge de Estado en la esquina superior derecha (Estilo Juegos Florales - Imagen 2) */}
                <div>
                  {isNSP && (
                    <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 10.5, fontWeight: 800, padding: '4px 10px', borderRadius: 4, border: '1px solid #FCA5A5', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      INCOMPARECENCIA (NSP)
                    </span>
                  )}
                  {!isNSP && isRegistrado && (
                    <span style={{ background: '#F0FDF4', color: '#15803D', fontSize: 10.5, fontWeight: 800, padding: '4px 10px', borderRadius: 4, border: '1px solid #BBF7D0', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      EVALUADA / CERRADA ({puntos != null ? `${puntos} pts` : 'OK'})
                    </span>
                  )}
                  {!isNSP && isBorrador && (
                    <span style={{ background: '#EFF6FF', color: '#1B3A5C', fontSize: 10.5, fontWeight: 800, padding: '4px 10px', borderRadius: 4, border: '1px solid #BFDBFE', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      EN BORRADOR ({puntos != null ? `${puntos} pts` : '0 pts'})
                    </span>
                  )}
                  {!isNSP && !isRegistrado && !isBorrador && (
                    <span style={{ background: '#F8FAFC', color: '#64748B', fontSize: 10.5, fontWeight: 800, padding: '4px 10px', borderRadius: 4, border: '1px solid #E2E8F0', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      PENDIENTE DE EVALUAR
                    </span>
                  )}
                </div>
              </div>

              {/* Fila Inferior de Acciones y Casilleros de Jurados */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                {/* Casilleros de Jurados (Staff) o Privacidad a Ciegas (Jurado Oficial) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {esStaff ? (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Jurados:</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {SLOTS_JURADO.map(slot => {
                          const e = est[slot];
                          const esEste = slot === numeroJuradoActivo;
                          const color = e === 'registrada' ? '#15803D' : (e === 'borrador' ? '#CA8A04' : '#E2E8F0');
                          const textoColor = (e === 'registrada' || e === 'borrador') ? '#FFFFFF' : '#64748B';

                          return (
                            <span
                              key={slot}
                              title={`Jurado ${slot}: ${e === 'registrada' ? 'Registrada' : (e === 'borrador' ? 'Borrador' : 'Sin calificar')}`}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                background: color,
                                color: textoColor,
                                fontSize: 10,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: esEste ? '2px solid #0C1929' : 'none'
                              }}
                            >
                              {e === 'registrada' ? <Icon name="check" size={11} color="#FFFFFF" /> : slot}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Su estado:</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: isRegistrado ? '#F0FDF4' : (isBorrador ? '#EFF6FF' : '#F1F5F9'),
                        color: isRegistrado ? '#15803D' : (isBorrador ? '#1B3A5C' : '#64748B'),
                        border: `1px solid ${isRegistrado ? '#BBF7D0' : (isBorrador ? '#BFDBFE' : '#E2E8F0')}`
                      }}>
                        {isRegistrado ? 'Calificación registrada' : (isBorrador ? 'Borrador en curso' : 'Pendiente de calificar')}
                      </span>
                    </div>
                  )}

                  {p.urlTrabajo && (
                    <a
                      href={p.urlTrabajo}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#0284C7',
                        textDecoration: 'none',
                        background: '#F0F9FF',
                        border: '1px solid #BAE6FD',
                        padding: '2px 7px',
                        borderRadius: 4,
                        marginLeft: 4
                      }}
                      title="Abrir evidencias en Google Drive"
                    >
                      <Icon name="externalLink" size={11} color="#0284C7" /> Drive
                    </a>
                  )}
                </div>

                {/* Botones de acción derecha: Limpiar Ficha, Marcar NSP y Evaluar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {tieneEvaluacion && onLimpiarFicha && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLimpiarFicha(p, miEval);
                      }}
                      style={{
                        background: '#FFF1F2',
                        color: '#B91C1C',
                        border: '1px solid #FECDD3',
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s ease'
                      }}
                      title="Limpiar la ficha de este proyecto y dejarla en blanco"
                    >
                      <Icon name="trash" size={12} color="#B91C1C" /> Limpiar Ficha
                    </button>
                  )}

                  {!isNSP && !isRegistrado && onMarcarNSP && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarcarNSP(p);
                      }}
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s ease'
                      }}
                      title="Marcar incomparecencia (NSP) sin ingresar a la ficha"
                    >
                      <Icon name="x" size={12} color="#DC2626" /> Marcar NSP
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeleccionar(p);
                    }}
                    style={{
                      background: isNSP ? '#B91C1C' : isRegistrado ? '#15803D' : '#1B3A5C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isNSP
                        ? '0 2px 6px rgba(185,28,28,0.25)'
                        : isRegistrado
                        ? '0 2px 6px rgba(21,128,61,0.25)'
                        : '0 2px 6px rgba(27,58,92,0.25)'
                    }}
                  >
                    {isNSP ? 'Ver Ficha NSP →' : isRegistrado ? 'Ver Ficha →' : `Evaluar Ficha E${anexoNum} →`}
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
