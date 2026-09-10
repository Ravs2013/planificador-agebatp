import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, CE, S, btn } from './ekEstilos';
import { getItemsRubrica } from '../../data/eurekaRubricas';
import { puntosAspecto } from '../../utils/eurekaHelpers';

/**
 * Nombre explicativo de cada nivel para jurados adultos mayores.
 * Evita confusiones sobre el significado pedagógico del número.
 */
function getEtiquetaNivel(nivel, escala) {
  if (nivel === 5) return 'Logro Muy Destacado';
  if (nivel === 4) return 'Logro Destacado';
  if (nivel === 3) return 'Logro Esperado';
  if (nivel === 2) return 'En Proceso';
  if (nivel === 1) return 'En Inicio';
  return `${nivel} puntos`;
}

function getColorNivel(nivel) {
  if (nivel >= 4) return { texto: '#166534', fondo: '#DCFCE7', borde: '#86EFAC' };
  if (nivel === 3) return { texto: '#1E40AF', fondo: '#DBEAFE', borde: '#93C5FD' };
  if (nivel === 2) return { texto: '#92400E', fondo: '#FEF3C7', borde: '#FCD34D' };
  return { texto: '#475569', fondo: '#F1F5F9', borde: '#CBD5E1' };
}

/**
 * Renderer oficial de evaluación Eureka 2026 adaptado para jurados mayores:
 *
 * Ofrece dos modos de visualización:
 *  1. Formulario Oficial de Evaluación (Bases MINEDU — Modo por defecto):
 *     Tabla oficial con columnas exactas de las bases (Aspectos a evaluar, Calificación, Ponderación, Puntos asignados).
 *  2. Vista Tarjetas Amplias (Para lectura detallada o dispositivos móviles).
 */
export default function EKRubricaMatriz({
  rubrica,
  puntajes = {},
  onChange,
  variante = 'A',
  onCambiarVariante,
  soloLectura = false
}) {
  const [modoVista, setModoVista] = useState('formulario'); // 'formulario' | 'tarjetas'

  if (!rubrica) {
    return (
      <div style={{ ...S.seccion, color: C.error, fontSize: 14, fontWeight: 700 }}>
        No se pudo resolver el formulario de evaluación aplicable a esta combinación de categoría, área y línea.
      </div>
    );
  }

  return (
    <div>
      {/* Selector de modo de visualización */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
        padding: '10px 16px',
        background: C.blanco,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="fileText" size={16} color="#1B3A5C" />
          <span>Instrumento de evaluación oficial:</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setModoVista('formulario')}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: `1.5px solid ${modoVista === 'formulario' ? '#1B3A5C' : '#CBD5E1'}`,
              background: modoVista === 'formulario' ? '#1B3A5C' : C.blanco,
              color: modoVista === 'formulario' ? C.blanco : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="list" size={14} color={modoVista === 'formulario' ? C.blanco : '#475569'} />
            Formulario Oficial (Bases MINEDU)
          </button>
          <button
            type="button"
            onClick={() => setModoVista('tarjetas')}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: `1.5px solid ${modoVista === 'tarjetas' ? '#1B3A5C' : '#CBD5E1'}`,
              background: modoVista === 'tarjetas' ? '#1B3A5C' : C.blanco,
              color: modoVista === 'tarjetas' ? C.blanco : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="grid" size={14} color={modoVista === 'tarjetas' ? C.blanco : '#475569'} />
            Tarjetas Amplias
          </button>
        </div>
      </div>

      {rubrica.tipoEscala === 'simple' ? (
        <MotorSimple
          rubrica={rubrica}
          puntajes={puntajes}
          onChange={onChange}
          soloLectura={soloLectura}
          modoVista={modoVista}
        />
      ) : (
        <MotorPonderado
          rubrica={rubrica}
          puntajes={puntajes}
          onChange={onChange}
          variante={variante}
          onCambiarVariante={onCambiarVariante}
          soloLectura={soloLectura}
          modoVista={modoVista}
        />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MOTOR A — RÚBRICA SIMPLE (Primaria: Anexos E11, E12, E13, E14)
   Puntaje máximo: 20 puntos.
   ═════════════════════════════════════════════════════════════════ */

function MotorSimple({ rubrica, puntajes, onChange, soloLectura, modoVista }) {
  const escala = rubrica.escala; // [4,3,2,1] o [5,4,3,1] en E12

  const totalObtenido = useMemo(() => {
    return (rubrica.criterios || []).reduce((sum, c) => {
      const val = Number(puntajes[c.id]);
      return sum + (val || 0);
    }, 0);
  }, [rubrica.criterios, puntajes]);

  const calificadosCount = useMemo(() => {
    return (rubrica.criterios || []).filter(c => puntajes[c.id] != null).length;
  }, [rubrica.criterios, puntajes]);

  const seleccionar = (criterioId, nivel) => {
    if (soloLectura) return;
    const actual = Number(puntajes[criterioId]);
    onChange({ ...puntajes, [criterioId]: actual === nivel ? undefined : nivel });
  };

  return (
    <div style={{ ...S.seccion, padding: 0, overflow: 'hidden', border: '1px solid #D6DCE8', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      {/* Cabecera descriptiva de la rúbrica */}
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid #D6DCE8',
        background: 'linear-gradient(135deg, #0C1929 0%, #1B3A5C 100%)',
        color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(202, 138, 4, 0.25)', border: '1px solid #CA8A04', color: '#FDE047', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              ANEXO {rubrica.id}
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>
              {rubrica.titulo}
            </div>
            {rubrica.competencia && (
              <div style={{ fontSize: 13, color: '#93C5FD', marginTop: 3, fontWeight: 600 }}>
                Competencia evaluada: {rubrica.competencia}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '6px 16px',
              display: 'inline-block',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PUNTAJE BRUTO</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                {totalObtenido} <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>/ {rubrica.puntajeMaximo} pts</span>
              </div>
            </div>
          </div>
        </div>

        {rubrica.notaMetodologica && (
          <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 8, fontStyle: 'italic', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 6, borderLeft: '3px solid #CA8A04' }}>
            Nota metodológica: {rubrica.notaMetodologica}
          </div>
        )}
      </div>

      {/* ─── VISTA 1: TARJETAS GRANDES (RECOMENDADA) ─── */}
      {modoVista === 'tarjetas' && (
        <div style={{ padding: '18px 20px' }}>
          {(rubrica.criterios || []).map((criterio, idx) => {
            const elegido = Number(puntajes[criterio.id]);
            const calificado = elegido != null && !isNaN(elegido);

            return (
              <div
                key={criterio.id}
                id={`criterio-${criterio.id}`}
                style={{
                  background: C.blanco,
                  border: `1.5px solid ${calificado ? CE.verdeEureka : C.gris300}`,
                  borderRadius: 10,
                  marginBottom: 20,
                  boxShadow: calificado ? '0 2px 10px rgba(110, 158, 35, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Cabecera del Criterio */}
                <div style={{
                  padding: '14px 18px',
                  background: calificado ? '#F4F9ED' : C.gris100,
                  borderBottom: `1px solid ${calificado ? CE.verdeHalo : C.gris300}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: calificado ? CE.verdeOscuro : C.gris500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Criterio N.° {idx + 1}
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: C.navy2, marginTop: 2 }}>
                      {criterio.nombre}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {calificado ? (
                      <span style={{
                        background: '#DCFCE7',
                        color: '#166534',
                        border: '1px solid #86EFAC',
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <Icon name="check" size={15} color="#166534" />
                        {elegido} pts — {getEtiquetaNivel(elegido, escala)}
                      </span>
                    ) : (
                      <span style={{
                        background: '#FFFBEB',
                        color: '#92400E',
                        border: '1px solid #FCD34D',
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        Pendiente de calificar
                      </span>
                    )}
                  </div>
                </div>

                {/* Nota o aclaración al criterio si existe */}
                {criterio.nota && (
                  <div style={{ padding: '10px 18px', background: '#F8FAFC', borderBottom: `1px solid ${C.gris200}`, fontSize: 12.5, color: C.gris700, fontStyle: 'italic', lineHeight: 1.45 }}>
                    <strong>Aclaración oficial:</strong> {criterio.nota}
                  </div>
                )}

                {/* Bloque de opciones táctiles */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.gris500, textTransform: 'uppercase', marginBottom: 10 }}>
                    Seleccione el nivel alcanzado por el trabajo:
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12
                  }}>
                    {escala.map(nivel => {
                      const activo = elegido === nivel;
                      const cNivel = getColorNivel(nivel);
                      const etiqueta = getEtiquetaNivel(nivel, escala);

                      return (
                        <div
                          key={nivel}
                          onClick={() => seleccionar(criterio.id, nivel)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 8,
                            cursor: soloLectura ? 'default' : 'pointer',
                            border: activo ? `2.5px solid ${CE.verdeEureka}` : `1.5px solid ${C.gris300}`,
                            background: activo ? '#F0FDF4' : C.blanco,
                            boxShadow: activo ? '0 4px 12px rgba(110, 158, 35, 0.18)' : 'none',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{
                                background: activo ? CE.verdeEureka : cNivel.fondo,
                                color: activo ? C.blanco : cNivel.texto,
                                border: `1px solid ${activo ? CE.verdeOscuro : cNivel.borde}`,
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 800
                              }}>
                                {nivel} {nivel === 1 ? 'Punto' : 'Puntos'}
                              </span>

                              {activo && (
                                <span style={{
                                  background: CE.verdeEureka,
                                  color: C.blanco,
                                  borderRadius: '50%',
                                  width: 22,
                                  height: 22,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Icon name="check" size={13} color={C.blanco} />
                                </span>
                              )}
                            </div>

                            <div style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: activo ? CE.verdeOscuro : C.gris700,
                              marginBottom: 6
                            }}>
                              {etiqueta}
                            </div>

                            <div style={{
                              fontSize: 13,
                              lineHeight: 1.5,
                              color: activo ? C.gris900 : C.gris700,
                              fontWeight: activo ? 500 : 400
                            }}>
                              {criterio.descriptores[nivel]}
                            </div>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px dashed ${activo ? CE.verdeHalo : C.gris200}`, textAlign: 'right' }}>
                            <span style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: activo ? CE.verdeOscuro : C.gris500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              {activo ? <><Icon name="check" size={13} color={CE.verdeOscuro} /> Seleccionado</> : 'Hacer clic para elegir'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── VISTA 2: TABLA OFICIAL DE RÚBRICA (IMAGEN 2) ─── */}
      {modoVista === 'formulario' && (
        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
          {/* Leyenda de escala superior */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12, color: '#64748B' }}>
            <span>Escala: <strong style={{ color: '#0F172A' }}>4 Logro destacado</strong> · <strong style={{ color: '#0F172A' }}>3 Logro esperado</strong> · <strong style={{ color: '#0F172A' }}>2 En proceso</strong> · <strong style={{ color: '#0F172A' }}>1 En inicio</strong></span>
            <span style={{ fontWeight: 700, color: '#1B3A5C' }}>{calificadosCount} de {(rubrica.criterios || []).length} criterios calificados</span>
          </div>

          <table style={{ ...S.tabla, borderCollapse: 'collapse', width: '100%', border: '1px solid #D6DCE8' }}>
            <thead>
              <tr style={{ background: '#1B3A5C', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: '24%', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CRITERIO DE EVALUACIÓN
                </th>
                {escala.map(n => (
                  <th key={n} style={{ padding: '10px 8px', border: '1px solid #D6DCE8', textAlign: 'center', width: `${Math.floor(66 / escala.length)}%`, color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {n} PTS — {getEtiquetaNivel(n, escala)}
                  </th>
                ))}
                <th style={{ padding: '10px 10px', border: '1px solid #D6DCE8', width: '10%', textAlign: 'center', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PUNTAJE
                </th>
              </tr>
            </thead>
            <tbody>
              {(rubrica.criterios || []).map(criterio => {
                const elegido = Number(puntajes[criterio.id]);
                return (
                  <tr key={criterio.id}>
                    <td style={{ ...S.td, background: '#F8FAFC', fontWeight: 700, fontSize: 13, border: '1px solid #D6DCE8' }}>
                      <div style={{ color: '#0F172A' }}>{criterio.nombre}</div>
                      {criterio.nota && (
                        <div style={{ fontWeight: 400, fontSize: 11, color: '#64748B', marginTop: 5, fontStyle: 'italic' }}>
                          {criterio.nota}
                        </div>
                      )}
                    </td>

                    {escala.map(nivel => {
                      const activo = elegido === nivel;
                      return (
                        <td
                          key={nivel}
                          onClick={() => seleccionar(criterio.id, nivel)}
                          style={{
                            ...S.td,
                            fontSize: 12,
                            lineHeight: 1.45,
                            cursor: soloLectura ? 'default' : 'pointer',
                            background: activo ? '#DCFCE7' : C.blanco,
                            border: activo ? '2px solid #16A34A' : '1px solid #D6DCE8',
                            color: activo ? '#166534' : '#1E293B',
                            fontWeight: activo ? 600 : 400,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            fontWeight: 800,
                            fontSize: 12,
                            color: activo ? '#166534' : '#64748B',
                            marginBottom: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span>{nivel} pts</span>
                            {activo && <Icon name="check" size={12} color="#166534" />}
                          </div>
                          {criterio.descriptores[nivel]}
                        </td>
                      );
                    })}

                    <td style={{
                      ...S.td,
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontWeight: 900,
                      fontSize: 18,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: '1px solid #D6DCE8',
                      color: elegido ? '#166534' : '#94A3B8',
                      background: elegido ? '#F0FDF4' : C.blanco
                    }}>
                      {elegido || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rubrica.cierreOficial && (
        <div style={{ padding: '12px 20px', fontSize: 12, color: C.gris700, fontStyle: 'italic', borderTop: `1px solid ${C.border}`, background: C.gris50 }}>
          {rubrica.cierreOficial}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MOTOR B — RÚBRICA PONDERADA (Secundaria: Anexos E15, E16, E17, E18)
   Calificación 1..4 × ponderación. Puntaje máximo: 100 puntos.
   ═════════════════════════════════════════════════════════════════ */

function MotorPonderado({
  rubrica,
  puntajes,
  onChange,
  variante,
  onCambiarVariante,
  soloLectura,
  modoVista
}) {
  const [mostrarGuiaRubrica, setMostrarGuiaRubrica] = useState(false);
  const items = useMemo(() => getItemsRubrica(rubrica, variante), [rubrica, variante]);

  const totalPonderado = useMemo(
    () => items.reduce((s, a) => s + (Number(puntajes[a.id]) || 0) * a.ponderacion, 0),
    [items, puntajes]
  );

  const calificadosCount = useMemo(
    () => items.filter(a => Number(puntajes[a.id]) > 0).length,
    [items, puntajes]
  );

  const seleccionar = (aspectoId, valor) => {
    if (soloLectura) return;
    const n = Number(valor);
    onChange({ ...puntajes, [aspectoId]: n || undefined });
  };

  return (
    <div style={{ ...S.seccion, padding: 0, overflow: 'hidden', border: '1px solid #D6DCE8', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      {/* ── Cabecera Oficial del Formulario de Evaluación (Anexos E15 a E18) ── */}
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid #D6DCE8',
        background: 'linear-gradient(135deg, #0C1929 0%, #1B3A5C 100%)',
        color: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'inline-block', background: 'rgba(202, 138, 4, 0.25)', border: '1px solid #CA8A04', color: '#FDE047', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              ANEXO {rubrica.id} · FORMULARIO OFICIAL DE EVALUACIÓN (BASES MINEDU)
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', marginTop: 2 }}>
              {rubrica.titulo}
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>Categoría(s): <strong style={{ color: '#FFFFFF' }}>{rubrica.categorias.join(', ')}</strong></span>
              <span>•</span>
              <span>Suma de ponderaciones: <strong style={{ color: '#FFFFFF' }}>{rubrica.sumaPonderaciones}</strong></span>
              <span>•</span>
              <span>Puntaje máximo: <strong style={{ color: '#FDE047' }}>{rubrica.puntajeMaximo} puntos</strong></span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '8px 18px',
              display: 'inline-block',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PUNTAJE ASIGNADO</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                {totalPonderado} <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>/ {rubrica.puntajeMaximo} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Variante A / B para Anexo E15 */}
        {rubrica.tieneVariantes && (
          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#FDE047', textTransform: 'uppercase' }}>
              Tipo de indagación científica:
            </span>
            {Object.entries(rubrica.variantes).map(([clave, nombre]) => {
              const activo = variante === clave;
              return (
                <button
                  key={clave}
                  type="button"
                  disabled={soloLectura}
                  onClick={() => onCambiarVariante && onCambiarVariante(clave)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: soloLectura ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    background: activo ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
                    color: activo ? '#0C1929' : '#FFFFFF',
                    border: `1.5px solid ${activo ? '#FFFFFF' : 'rgba(255,255,255,0.25)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon name={activo ? 'check' : 'circle'} size={14} color={activo ? '#0C1929' : '#94A3B8'} />
                  <span>{clave}. {nombre}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Botón interactivo para consultar la Rúbrica Pedagógica */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <button
            type="button"
            onClick={() => setMostrarGuiaRubrica(v => !v)}
            style={{
              background: mostrarGuiaRubrica ? '#E0F2FE' : 'rgba(255,255,255,0.08)',
              color: mostrarGuiaRubrica ? '#0369A1' : '#E2E8F0',
              border: `1.5px solid ${mostrarGuiaRubrica ? '#0284C7' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="helpCircle" size={15} color={mostrarGuiaRubrica ? '#0284C7' : '#38BDF8'} />
            <span>{mostrarGuiaRubrica ? 'Ocultar Rúbrica de Consulta' : 'Consultar Rúbrica y Criterios de Evaluación (Guía Oficial MINEDU)'}</span>
            <Icon name={mostrarGuiaRubrica ? 'chevronUp' : 'chevronDown'} size={14} color={mostrarGuiaRubrica ? '#0284C7' : '#38BDF8'} />
          </button>
        </div>

        {/* Panel desplegable de la Rúbrica Oficial MINEDU */}
        {mostrarGuiaRubrica && (
          <div style={{
            marginTop: 12,
            background: C.blanco,
            border: '2px solid #BAE6FD',
            borderRadius: 8,
            padding: '16px 20px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)'
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0369A1', marginBottom: 4 }}>
              Rúbrica de Calificación Oficial (Bases Específicas MINEDU — Anexo E)
            </div>
            <div style={{ fontSize: 12.5, color: C.gris700, marginBottom: 12, lineHeight: 1.5 }}>
              Esta rúbrica describe los 4 niveles de desempeño posibles. El jurado calificador debe usarla como instrumento guía para determinar si el aspecto evaluado merece nivel 1, 2, 3 o 4, y asentar dicha calificación en la tabla inferior:
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10
            }}>
              <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#166534', color: '#FFF', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>4</span>
                  <span>Nivel Superior</span>
                </div>
                <div style={{ fontSize: 12, color: '#166534', marginTop: 4, lineHeight: 1.45 }}>
                  {rubrica.leyendaCalificacion?.[4] || 'Evidencia un nivel superior a lo esperado respecto del criterio de evaluación.'}
                </div>
              </div>

              <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#1E40AF', color: '#FFF', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>3</span>
                  <span>Nivel Esperado (Satisfactorio)</span>
                </div>
                <div style={{ fontSize: 12, color: '#1E40AF', marginTop: 4, lineHeight: 1.45 }}>
                  {rubrica.leyendaCalificacion?.[3] || 'Evidencia el nivel esperado, es decir cumple de manera satisfactoria con todo lo establecido en el criterio.'}
                </div>
              </div>

              <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#92400E', color: '#FFF', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>2</span>
                  <span>Próximo / En Proceso</span>
                </div>
                <div style={{ fontSize: 12, color: '#92400E', marginTop: 4, lineHeight: 1.45 }}>
                  {rubrica.leyendaCalificacion?.[2] || 'Está próximo o cerca de cumplir lo establecido en el criterio de evaluación.'}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: '#475569', color: '#FFF', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>1</span>
                  <span>Nivel Mínimo (En Inicio)</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
                  {rubrica.leyendaCalificacion?.[1] || 'Muestra un nivel mínimo respecto de lo establecido en el criterio de evaluación.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── VISTA 1: FORMULARIO OFICIAL DE EVALUACIÓN (Bases MINEDU — Imagen 2) ─── */}
      {modoVista === 'formulario' && (
        <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
          {/* Leyenda de escala superior */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12, color: '#64748B' }}>
            <span>Escala: <strong style={{ color: '#0F172A' }}>4 Logro destacado</strong> · <strong style={{ color: '#0F172A' }}>3 Logro esperado</strong> · <strong style={{ color: '#0F172A' }}>2 En proceso</strong> · <strong style={{ color: '#0F172A' }}>1 En inicio</strong></span>
            <span style={{ fontWeight: 700, color: '#1B3A5C' }}>{calificadosCount} de {items.length} aspectos calificados</span>
          </div>

          <table style={{ ...S.tabla, borderCollapse: 'collapse', width: '100%', border: '1px solid #D6DCE8' }}>
            <thead>
              <tr style={{ background: '#1B3A5C', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 14px', border: '1px solid #D6DCE8', width: '56%', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ASPECTOS PARA EVALUAR
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: '20%', textAlign: 'center', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 170 }}>
                  CALIFICACIÓN (1 A 4)
                </th>
                <th style={{ padding: '10px 10px', border: '1px solid #D6DCE8', width: '10%', textAlign: 'center', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PONDERACIÓN
                </th>
                <th style={{ padding: '10px 12px', border: '1px solid #D6DCE8', width: '14%', textAlign: 'center', color: '#FFFFFF', fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PUNTOS ASIGNADOS
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((aspecto, idx) => {
                const calif = Number(puntajes[aspecto.id]) || null;
                const asignados = puntosAspecto(calif, aspecto.ponderacion);
                const filaPar = idx % 2 === 0;

                return (
                  <tr key={aspecto.id} style={{ background: filaPar ? C.blanco : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ ...S.td, verticalAlign: 'top', padding: '14px 16px', border: '1px solid #D6DCE8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          background: calif ? '#DCFCE7' : '#F1F5F9',
                          color: calif ? '#166534' : '#475569',
                          border: `1px solid ${calif ? '#86EFAC' : '#CBD5E1'}`,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                          {aspecto.nombre}
                        </span>
                      </div>

                      {aspecto.preambulo && (
                        <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 6, fontStyle: 'italic' }}>
                          {aspecto.preambulo}
                        </div>
                      )}

                      <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 12.5, lineHeight: 1.55 }}>
                        {(aspecto.descripcion || []).map((d, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                        ))}
                      </ul>
                    </td>

                    <td style={{ ...S.td, textAlign: 'center', verticalAlign: 'middle', padding: '10px 8px', border: '1px solid #D6DCE8' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                        {[1, 2, 3, 4].map(n => {
                          const activo = calif === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              disabled={soloLectura}
                              onClick={() => seleccionar(aspecto.id, activo ? 0 : n)}
                              title={`Calificación ${n}: ${rubrica.leyendaCalificacion?.[n] || ''}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 6,
                                fontSize: 13.5,
                                fontWeight: activo ? 800 : 600,
                                cursor: soloLectura ? 'default' : 'pointer',
                                fontFamily: "'JetBrains Mono', monospace",
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: activo ? '#1B3A5C' : '#FFFFFF',
                                color: activo ? '#FFFFFF' : '#64748B',
                                border: `1px solid ${activo ? '#1B3A5C' : '#CBD5E1'}`,
                                boxShadow: activo ? '0 2px 5px rgba(27, 58, 92, 0.25)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      {calif ? (
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', marginTop: 5 }}>
                          Nivel {calif} asignado
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5, fontStyle: 'italic' }}>
                          Sin calificar
                        </div>
                      )}
                    </td>

                    <td style={{ ...S.td, textAlign: 'center', verticalAlign: 'middle', padding: '10px 8px', border: '1px solid #D6DCE8' }}>
                      <span style={{
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        × {aspecto.ponderacion}
                      </span>
                    </td>

                    <td style={{
                      ...S.td,
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '10px 10px',
                      border: '1px solid #D6DCE8',
                      background: asignados != null ? '#F0FDF4' : 'transparent'
                    }}>
                      <span style={{
                        fontSize: 16,
                        fontWeight: 900,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: asignados != null ? '#15803D' : '#94A3B8'
                      }}>
                        {asignados != null ? `${asignados}` : '—'}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                        {' '}/ {aspecto.puntosMaximos}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Fila oficial de Total */}
              <tr style={{ background: '#F1F5F9', borderTop: '2px solid #1B3A5C' }}>
                <td style={{ ...S.td, textAlign: 'right', fontWeight: 900, fontSize: 13.5, color: '#0F172A', padding: '14px 16px', border: '1px solid #D6DCE8', textTransform: 'uppercase' }}>
                  PUNTAJE TOTAL DEL FORMULARIO DE EVALUACIÓN
                </td>
                <td style={{ ...S.td, textAlign: 'center', fontSize: 12, color: '#64748B', fontWeight: 600, border: '1px solid #D6DCE8' }}>
                  ({calificadosCount} de {items.length} calificados)
                </td>
                <td style={{ ...S.td, textAlign: 'center', fontWeight: 900, fontSize: 15, color: '#0F172A', border: '1px solid #D6DCE8', fontFamily: "'JetBrains Mono', monospace" }}>
                  {rubrica.sumaPonderaciones}
                </td>
                <td style={{
                  ...S.td,
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: 18,
                  border: '1px solid #D6DCE8',
                  background: '#1B3A5C',
                  color: '#FFFFFF',
                  padding: '14px 10px',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {totalPonderado} / {rubrica.puntajeMaximo}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ─── VISTA 2: TARJETAS GRANDES CON BOTONES AMPLIOS (OPCIONAL) ─── */}
      {modoVista === 'tarjetas' && (
        <div style={{ padding: '18px 20px' }}>
          {items.map((aspecto, idx) => {
            const calif = Number(puntajes[aspecto.id]) || null;
            const asignados = puntosAspecto(calif, aspecto.ponderacion);
            const calificado = calif != null && calif > 0;

            return (
              <div
                key={aspecto.id}
                id={`aspecto-${aspecto.id}`}
                style={{
                  background: C.blanco,
                  border: `1.5px solid ${calificado ? CE.verdeEureka : C.gris300}`,
                  borderRadius: 10,
                  marginBottom: 20,
                  boxShadow: calificado ? '0 2px 10px rgba(110, 158, 35, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Cabecera del Aspecto */}
                <div style={{
                  padding: '14px 18px',
                  background: calificado ? '#F4F9ED' : C.gris100,
                  borderBottom: `1px solid ${calificado ? CE.verdeHalo : C.gris300}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: calificado ? CE.verdeOscuro : C.gris500, textTransform: 'uppercase' }}>
                      Aspecto N.° {idx + 1}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.navy2, marginTop: 2 }}>
                      {aspecto.nombre}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      background: C.blanco,
                      border: `1px solid ${C.gris300}`,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.gris700
                    }}>
                      Ponderación: <strong>× {aspecto.ponderacion}</strong>
                    </span>

                    <span style={{
                      background: calificado ? '#DCFCE7' : C.gris200,
                      color: calificado ? '#166534' : C.gris700,
                      border: `1px solid ${calificado ? '#86EFAC' : C.gris300}`,
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 13.5,
                      fontWeight: 800
                    }}>
                      {asignados != null ? `${asignados} / ${aspecto.puntosMaximos} pts` : `0 / ${aspecto.puntosMaximos} pts`}
                    </span>
                  </div>
                </div>

                {/* Contenido descriptivo del aspecto */}
                <div style={{ padding: '16px 18px' }}>
                  {aspecto.preambulo && (
                    <div style={{ fontSize: 13, color: C.gris700, marginBottom: 8, fontStyle: 'italic' }}>
                      {aspecto.preambulo}
                    </div>
                  )}

                  <ul style={{ margin: 0, paddingLeft: 20, color: C.gris800, fontSize: 13, lineHeight: 1.55 }}>
                    {(aspecto.descripcion || []).map((d, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                    ))}
                  </ul>

                  {/* Botones de Calificación Táctiles Amplios (46px de alto) */}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.gris200}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.gris500, textTransform: 'uppercase', marginBottom: 8 }}>
                      Calificación (1 a 4):
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 10
                    }}>
                      {[4, 3, 2, 1].map(num => {
                        const activo = calif === num;
                        const label = num === 4 ? '4 — Destacado' : (num === 3 ? '3 — Esperado' : (num === 2 ? '2 — En Proceso' : '1 — En Inicio'));
                        const cNivel = getColorNivel(num);

                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={soloLectura}
                            onClick={() => seleccionar(aspecto.id, activo ? 0 : num)}
                            style={{
                              minHeight: 46,
                              padding: '8px 12px',
                              borderRadius: 8,
                              fontSize: 13.5,
                              fontWeight: 800,
                              cursor: soloLectura ? 'default' : 'pointer',
                              fontFamily: 'inherit',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: activo ? CE.verdeEureka : cNivel.fondo,
                              color: activo ? C.blanco : cNivel.texto,
                              border: `2px solid ${activo ? CE.verdeOscuro : cNivel.borde}`,
                              boxShadow: activo ? '0 3px 8px rgba(79,115,24,0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, opacity: activo ? 0.9 : 0.8, marginTop: 2 }}>
                              {num * aspecto.ponderacion} puntos
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Escala explicativa al pie */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: C.gris50 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.navy2, textTransform: 'uppercase', marginBottom: 6 }}>
          Escala de calificación oficial MINEDU
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {[4, 3, 2, 1].map(n => (
            <div key={n} style={{ fontSize: 12, color: C.gris700, background: C.blanco, padding: '6px 10px', borderRadius: 5, border: `1px solid ${C.gris200}` }}>
              <strong style={{ color: CE.verdeOscuro }}>{n}</strong> — {rubrica.leyendaCalificacion[n]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
