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
  acuerdos = {}
}) {
  if (!rubrica) return null;
  const esEscala = rubrica.tipo === 'escala';
  const completo = Boolean(calculo?.completo);

  return (
    <div
      id={anclaId}
      style={{
        background: C.white,
        border: `1px solid ${completo ? '#BBF7D0' : C.border}`,
        borderLeft: `5px solid ${completo ? C.green : (abierto ? C.gold : C.navy3)}`,
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
          <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 0.6 }}>ANEXO {rubrica.anexo}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.navy2, lineHeight: 1.3 }}>{ETIQUETA_ANEXO[rubrica.anexo]}</div>
          <div style={{ fontSize: 11.5, color: C.g500, marginTop: 2 }}>
            {rubrica.criterios.length} criterios
            {completo ? ' · completo' : ` · ${calculo?.calificados || 0} calificados`}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: FUENTES.mono, fontSize: 18, fontWeight: 800, color: completo ? C.green : C.navy2 }}>
            {calculo?.subtotal || 0}
            <span style={{ fontSize: 12, color: C.g500, fontWeight: 600 }}> / {rubrica.maximo}</span>
          </div>
        </div>
        <Icon name={abierto ? 'chevronUp' : 'chevronDown'} size={20} color={C.g500} />
      </button>

      {abierto && (
        <div style={{ padding: '14px 16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy3, marginBottom: 12 }}>{rubrica.titulo}</div>

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
                          disabled={soloLectura}
                          onClick={() => onCalificar(criterio.id, valor)}
                          aria-pressed={activo}
                          style={{
                            position: 'relative', textAlign: 'left', padding: esEscala ? '10px 12px' : '10px 12px 12px',
                            borderRadius: 8, border: `${activo ? 2 : 1}px solid ${activo ? C.navy3 : C.border}`,
                            background: activo ? '#EFF6FF' : C.white, color: C.g800,
                            cursor: soloLectura ? 'default' : 'pointer', fontFamily: FUENTES.sans,
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
        </div>
      )}
    </div>
  );
}
