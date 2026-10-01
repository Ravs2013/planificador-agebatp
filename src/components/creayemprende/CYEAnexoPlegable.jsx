import React from 'react';
import Icon from '../Icon';
import { C, FUENTES } from './cyeEstilos';
import { NIVELES_RUBRICA_CYE, ESCALA_D12 } from '../../data/creaEmprendeRubricas';

const ETIQUETA_ANEXO = {
  D10: 'Rúbrica de evaluación del proyecto',
  D11: 'Rúbrica de evaluación del portafolio',
  D12: 'Presentación en la Expoferia'
};

/** Resumen corto de cada valor de la escala D12, tomado del inicio del texto oficial. */
const RESUMEN_D12 = {
  4: 'Superior a lo esperado',
  3: 'Nivel esperado',
  2: 'Próximo a cumplir',
  1: 'Nivel mínimo'
};

function CirculoAvance({ calificados, total, completo }) {
  const r = 17;
  const perimetro = 2 * Math.PI * r;
  const proporcion = total > 0 ? calificados / total : 0;
  const color = completo ? C.green : C.navy3;
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill={completo ? '#F0FDF4' : C.white} stroke={C.g200} strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${perimetro * proporcion} ${perimetro}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FUENTES.mono, fontSize: 11, fontWeight: 800, color
      }}>
        {completo ? <Icon name="check" size={16} color={C.green} /> : `${calificados}/${total}`}
      </div>
    </div>
  );
}

/**
 * Una viñeta por anexo. Cerrada muestra solo su avance y subtotal; abierta despliega los
 * criterios con sus descriptores literales. El nivel elegido se registra en la casilla
 * "Puntaje obtenido" (D10 y D11) o "Valoración" (D12); el texto de la rúbrica nunca se altera.
 */
export default function CYEAnexoPlegable({
  rubrica,
  puntajes = {},
  calculo,
  abierto,
  onAlternar,
  onCalificar,
  soloLectura = false,
  anclaId,
  acuerdos = {},
  onMarcarNSP = null,
  onDesmarcarNSP = null,
  firmante = null,
  numeroJurado = null
}) {
  if (!rubrica) return null;
  const esEscala = rubrica.tipo === 'escala';
  const esNsp = Boolean(puntajes?.nsp);
  const completo = Boolean(calculo?.completo);

  return (
    <div
      id={anclaId}
      style={{
        background: C.white,
        border: `1px solid ${esNsp ? '#FCD34D' : (completo ? '#BBF7D0' : C.border)}`,
        borderLeft: `5px solid ${esNsp ? '#D97706' : (completo ? C.green : (abierto ? C.gold : C.navy3))}`,
        borderRadius: 8,
        boxShadow: abierto ? '0 4px 14px rgba(27,58,92,0.10)' : '0 1px 4px rgba(15,23,42,0.04)',
        overflow: 'hidden',
        scrollMarginTop: 90
      }}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierto}
        style={{
          width: '100%', minHeight: 68, background: abierto ? C.g50 : C.white, border: 'none',
          borderBottom: abierto ? `1px solid ${C.border}` : 'none', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', fontFamily: FUENTES.sans
        }}
      >
        <CirculoAvance calificados={calculo?.calificados || 0} total={calculo?.total || rubrica.criterios.length} completo={completo} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>ANEXO {rubrica.anexo}</span>
            {esNsp && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 4, padding: '1px 6px' }}>
                NSP EXPOFERIA
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.navy2, lineHeight: 1.3 }}>{ETIQUETA_ANEXO[rubrica.anexo]}</div>
          <div style={{ fontSize: 11.5, color: C.g500, marginTop: 2 }}>
            {rubrica.criterios.length} criterios
            {esNsp ? ' · No Se Presentó en Expoferia (0 pts)' : (completo ? ' · completo' : ` · ${calculo?.calificados || 0} calificados`)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: FUENTES.mono, fontSize: 18, fontWeight: 800, color: esNsp ? '#B45309' : (completo ? C.green : C.navy2) }}>
            {calculo?.subtotal || 0}
            <span style={{ fontSize: 12, color: C.g500, fontWeight: 600 }}> / {rubrica.maximo}</span>
            {esNsp && <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309', marginLeft: 4 }}>(NSP)</span>}
          </div>
        </div>
        <Icon name={abierto ? 'chevronUp' : 'chevronDown'} size={20} color={C.g500} />
      </button>

      {abierto && (
        <div style={{ padding: '14px 16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>{rubrica.titulo}</div>

          {rubrica.anexo === 'D12' && (
            <div style={{
              background: esNsp ? '#FFFBEB' : '#F8FAFC',
              border: `1px solid ${esNsp ? '#FCD34D' : '#E2E8F0'}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: esNsp ? '#92400E' : C.navy2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={esNsp ? 'alertTriangle' : 'userX'} size={16} color={esNsp ? '#D97706' : C.navy3} />
                  {esNsp
                    ? 'ANEXO D12 MARCADO COMO NO SE PRESENTÓ (NSP)'
                    : '¿El proyecto no asistió a la Expoferia presencial?'}
                </div>
                <div style={{ fontSize: 12, color: esNsp ? '#78350F' : C.g600, marginTop: 3, lineHeight: 1.4 }}>
                  {esNsp
                    ? 'Se asignó 0 pts a la Expoferia (D12) y se exime de calificar los 5 criterios. Las evaluaciones de Portafolio (D10) y Exposición (D11) se conservan intactas.'
                    : 'Puede marcar NSP únicamente para la Expoferia (D12). Se asignará 0 pts y ya no se le exigirá llenar estos 5 criterios, manteniendo sus notas de D10 y D11.'}
                </div>
              </div>
              {!soloLectura && (
                esNsp ? (
                  <button
                    type="button"
                    onClick={onDesmarcarNSP}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D97706',
                      color: '#92400E',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Habilitar los 5 criterios del Anexo D12 para calificación"
                  >
                    <Icon name="refresh" size={13} color="#92400E" /> Desmarcar NSP (Calificar D12)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onMarcarNSP}
                    style={{
                      background: '#DC2626',
                      border: '1px solid #B91C1C',
                      color: '#FFFFFF',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(220,38,38,0.2)'
                    }}
                    title="Marcar No Se Presentó exclusivamente para el Anexo D12"
                  >
                    <Icon name="userX" size={14} color="#FFFFFF" /> Marcar NSP en Expoferia (D12)
                  </button>
                )
              )}
            </div>
          )}

          {esEscala && (
            <div style={{ background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.g500, marginBottom: 6 }}>VALORACIÓN</div>
              {ESCALA_D12.map(e => (
                <div key={e.valor} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.g700, lineHeight: 1.45, marginBottom: 2 }}>
                  <strong style={{ fontFamily: FUENTES.mono, color: C.navy2, minWidth: 12 }}>{e.valor}</strong>
                  <span>{e.descripcion}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rubrica.criterios.map(criterio => {
              const elegido = Number(puntajes[criterio.id]) || null;
              return (
                <div key={criterio.id} id={`crit-${criterio.id}`} style={{ borderTop: `1px solid ${C.g100}`, paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2, lineHeight: 1.35 }}>
                        {criterio.numero}. {criterio.nombre}
                      </div>
                      {(criterio.pregunta || criterio.alcance) && (
                        <div style={{ fontSize: 12, color: C.g500, marginTop: 3, lineHeight: 1.4 }}>
                          {criterio.pregunta || criterio.alcance}
                        </div>
                      )}
                      {acuerdos[`${rubrica.anexo}_${criterio.numero}`] && (
                        <div style={{ marginTop: 6, fontSize: 11.5, color: C.navy3, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '5px 8px', lineHeight: 1.45 }}>
                          <strong>Acuerdo de calibración:</strong> {acuerdos[`${rubrica.anexo}_${criterio.numero}`]}
                        </div>
                      )}
                      {esEscala && (
                        <div style={{ fontSize: 12, color: C.g700, marginTop: 6, lineHeight: 1.45 }}>
                          <strong>Evidencia:</strong> {criterio.evidencia}
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: C.navy4, whiteSpace: 'nowrap' }}>
                            Tiempo sugerido: {criterio.tiempo}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{
                      flexShrink: 0, minWidth: 74, textAlign: 'center', border: `1px solid ${elegido ? C.navy3 : C.border}`,
                      borderRadius: 6, padding: '4px 8px', background: elegido ? '#EFF6FF' : C.g50
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: C.g500, lineHeight: 1.2 }}>
                        {esEscala ? 'VALORACIÓN' : 'PUNTAJE OBTENIDO'}
                      </div>
                      <div style={{ fontFamily: FUENTES.mono, fontSize: 20, fontWeight: 800, color: elegido ? C.navy2 : C.g300 }}>
                        {elegido || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${esEscala ? 130 : 200}px, 1fr))`, gap: 8 }}>
                    {(esEscala ? ESCALA_D12 : NIVELES_RUBRICA_CYE).map(nivel => {
                      const valor = nivel.valor;
                      const activo = elegido === valor;
                      return (
                        <button
                          key={valor}
                          type="button"
                          disabled={soloLectura || esNsp}
                          onClick={() => onCalificar(criterio.id, valor)}
                          aria-pressed={activo}
                          style={{
                            position: 'relative', textAlign: 'left', padding: esEscala ? '10px 12px' : '10px 12px 12px',
                            borderRadius: 8, border: `${activo ? 2 : 1}px solid ${activo ? C.navy3 : C.border}`,
                            background: activo ? '#EFF6FF' : C.white, color: C.g800,
                            cursor: (soloLectura || esNsp) ? 'default' : 'pointer', fontFamily: FUENTES.sans,
                            opacity: esNsp ? 0.55 : 1,
                            boxShadow: activo ? '0 2px 8px rgba(27,58,92,0.15)' : 'none', minHeight: esEscala ? 56 : 0
                          }}
                        >
                          {activo && (
                            <span style={{
                              position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%',
                              background: C.navy3, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Icon name="check" size={12} color={C.white} />
                            </span>
                          )}
                          {esEscala ? (
                            <>
                              <div style={{ fontFamily: FUENTES.mono, fontSize: 20, fontWeight: 800, color: activo ? C.navy2 : C.navy3 }}>{valor}</div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: activo ? C.navy2 : C.g500 }}>{RESUMEN_D12[valor]}</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 800, color: activo ? C.navy2 : C.g500, marginBottom: 5, paddingRight: 22 }}>
                                {nivel.encabezado}
                              </div>
                              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: activo ? C.g900 : C.g700 }}>
                                {criterio.niveles[valor]}
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', fontSize: 13, fontWeight: 800, color: C.navy2 }}>
            TOTAL {rubrica.anexo}: <span style={{ fontFamily: FUENTES.mono, marginLeft: 8 }}>{calculo?.subtotal || 0} / {rubrica.maximo}</span>
          </div>

          {/* ── Pie de Suscripción Oficial del Anexo ── */}
          {firmante && (
            <div style={{
              marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              background: C.g50, borderRadius: 6, padding: '10px 14px'
            }}>
              <div style={{ fontSize: 12, color: C.g700, lineHeight: 1.45 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: C.gold, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block' }}>
                  Suscripción — Anexo {rubrica.anexo}
                </span>
                Evaluado por: <strong style={{ color: C.navy2 }}>{firmante.nombreCompleto}</strong> (DNI {firmante.dni}) · Jurado Calificador N.° {numeroJurado}
              </div>
              <div style={{
                width: 120, height: 50, border: `1px solid ${C.g300}`, borderRadius: 4,
                background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2
              }}>
                {firmante.firmaDataUrl ? (
                  <img src={firmante.firmaDataUrl} alt="Firma Jurado" style={{ maxHeight: 44, maxWidth: '94%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 10, color: C.g400, fontStyle: 'italic' }}>Sin firma</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
