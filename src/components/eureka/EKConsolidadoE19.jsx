import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../Icon';
import { C, CE, S, btn, btnDeshabilitado, aviso } from './ekEstilos';
import { TEXTOS_LEGALES } from '../../data/eurekaCatalogos';
import {
  EUREKA_CONFIG, SLOTS_JURADO, getArea, getCategoria
} from '../../data/eurekaConfigUGEL03';
import {
  construirConsolidadoE19, detectarEmpatesTop3, nombresEstudiantes, sanitizarNombreArchivo
} from '../../utils/eurekaHelpers';
import { firmantesOrdenados, esPreliminar, etiquetaGobernanza } from '../../utils/eurekaFirmas';
import { setEKConsolidado, cerrarEKConsolidado, registrarDirimencia } from '../../firebase/dbEureka';
import { generarE19PDF, generarE19CategoriaCompletaPDF } from '../../pdf/generarE19PDF';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';

/**
 * Anexo E19 — Formato consolidado de evaluación.
 * Aquí vive el acceso al Panel de Firmas Oficial, porque el E19 es el documento
 * entregable del jurado calificador (numeral 11.1 de las bases).
 */
export default function EKConsolidadoE19({
  categoria,
  areaId,
  participantes = [],
  evaluaciones = [],
  consolidadoGuardado,
  panel,
  panelesMap = {},
  usuario,
  esStaff = false,
  onAbrirPanel,
  onToast
}) {
  const [guardando, setGuardando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [dirimencia, setDirimencia] = useState(null);

  const cat = getCategoria(categoria);
  const area = getArea(areaId);

  const filas = useMemo(() => {
    // La dirimencia colegiada vive en el participante y debe entrar al cálculo.
    const conDirimencia = participantes.map(p => ({ ...p }));
    return construirConsolidadoE19(conDirimencia, evaluaciones);
  }, [participantes, evaluaciones]);

  const empates = useMemo(() => detectarEmpatesTop3(filas), [filas]);
  const completas = filas.filter(f => f.completo).length;
  const cerrado = consolidadoGuardado?.estado === 'cerrado';

  const construirDocumento = (estado) => ({
    categoria,
    areaId,
    dre: EUREKA_CONFIG.dre,
    ugel: EUREKA_CONFIG.ugel,
    region: EUREKA_CONFIG.region,
    provincia: EUREKA_CONFIG.provincia,
    distrito: EUREKA_CONFIG.distrito,
    fecha: EUREKA_CONFIG.fechaEvaluacion,
    etapa: EUREKA_CONFIG.etapa,
    filas,
    empatesTop3: empates,
    dirimencias: consolidadoGuardado?.dirimencias || [],
    estado
  });

  const guardarConsolidado = async () => {
    try {
      setGuardando(true);
      await setEKConsolidado(categoria, areaId, construirDocumento('borrador'));
      if (onToast) onToast('Consolidado E19 guardado.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar el consolidado: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarConsolidado = async () => {
    if (empates.length > 0) {
      if (onToast) onToast('No se puede cerrar el consolidado con empates sin dirimir en el podio.', 'error');
      return;
    }
    if (!window.confirm('¿Cerrar el consolidado de esta categoría y área? El acta E20 se emitirá con estos resultados.')) return;
    try {
      setGuardando(true);
      await setEKConsolidado(categoria, areaId, construirDocumento('borrador'));
      await cerrarEKConsolidado(categoria, areaId, usuario);
      if (onToast) onToast('Consolidado E19 cerrado.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo cerrar el consolidado: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const descargarPDF = async () => {
    try {
      setDescargando(true);
      if (onToast) onToast('Generando el Anexo E19...', 'info');
      const banner = await obtenerMembreteEureka();
      generarE19PDF(construirDocumento(cerrado ? 'cerrado' : 'borrador'), { panel, banner });
      if (onToast) {
        onToast(
          esPreliminar(panel)
            ? 'Anexo E19 descargado como documento preliminar: el Panel de Firmas aún no ha sido sellado.'
            : 'Anexo E19 descargado.',
          esPreliminar(panel) ? 'alerta' : 'exito'
        );
      }
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el E19: ${err.message}`, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const exportarExcel = () => {
    try {
      const cabecera = [
        [`${EUREKA_CONFIG.edicion} ${EUREKA_CONFIG.anio}`],
        ['Anexo E19 — Formato consolidado de evaluación'],
        [`Etapa: ${EUREKA_CONFIG.etapa}`, `DRE/GRE: ${EUREKA_CONFIG.dre}`, `UGEL: ${EUREKA_CONFIG.ugel}`],
        [`Categoría: ${cat ? cat.nombre : categoria}`, `Área de participación: ${area ? area.nombre : areaId}`],
        [`Fecha: ${EUREKA_CONFIG.fechaEvaluacion}`, `Sede: ${EUREKA_CONFIG.sede || 'Por confirmar'}`],
        []
      ];

      const encabezados = [
        'N.°', 'Código SICE', 'DRE/UGEL', 'I. E.', 'Código Modular', 'Título del proyecto', 'Línea', 'Anexo',
        ...SLOTS_JURADO.map(s => `Jurado ${s}`),
        'Suma', 'Promedio', 'Puntaje total', 'Puesto', 'Estudiantes', 'Docente asesor', 'Enlace a la evidencia'
      ];

      const cuerpo = filas.map((f, i) => {
        const p = participantes.find(x => x.id === f.participanteId) || {};
        return [
          f.ordenPresentacion || i + 1,
          f.codigoParticipante,
          `${f.dre} / ${f.ugel}`,
          f.institucion,
          f.codigoModular,
          f.tituloProyecto,
          f.lineaId,
          f.anexoEvaluacion,
          ...SLOTS_JURADO.map(s => f[`jurado${s}`] ?? ''),
          f.suma ?? '',
          f.promedio ?? '',
          f.puntajeTotal ?? '',
          f.puesto ?? '',
          nombresEstudiantes(p),
          p.docenteAsesor?.nombreCompleto || '',
          p.urlTrabajo || ''
        ];
      });

      const hoja = XLSX.utils.aoa_to_sheet([...cabecera, encabezados, ...cuerpo]);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, `Cat ${categoria}`);
      XLSX.writeFile(
        libro,
        `AnexoE19_Cat${categoria}_${sanitizarNombreArchivo(area ? area.nombre : areaId)}.xlsx`
      );
      if (onToast) onToast('Consolidado exportado a Excel.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo exportar a Excel: ${err.message}`, 'error');
    }
  };

  const descargarCategoriaCompleta = async () => {
    try {
      setDescargando(true);
      if (onToast) onToast(`Recopilando los consolidados de la categoría ${categoria}...`, 'info');
      const banner = await obtenerMembreteEureka();
      // Se sintetiza al vuelo: no se exige que los consolidados estén cerrados en Firestore.
      const consolidados = [construirDocumento(cerrado ? 'cerrado' : 'borrador')];
      await generarE19CategoriaCompletaPDF(consolidados, { categoria, panelesMap, banner });
      if (onToast) onToast('Descarga completada.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo generar la descarga: ${err.message}`, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const aplicarDirimencia = async () => {
    if (!dirimencia?.participanteId || !dirimencia?.ordenManual || !dirimencia?.motivo?.trim()) {
      if (onToast) onToast('La dirimencia exige el proyecto, el orden asignado y un motivo escrito.', 'error');
      return;
    }
    try {
      setGuardando(true);
      await registrarDirimencia(categoria, areaId, { ...dirimencia, usuario });
      setDirimencia(null);
      if (onToast) onToast('Dirimencia registrada en el consolidado.', 'exito');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const firmantes = firmantesOrdenados(panel);
  const sellado = !esPreliminar(panel);

  return (
    <div>
      {/* ── Acceso destacado al Panel de Firmas Oficial ── */}
      <div style={{
        ...S.tarjeta,
        padding: 16,
        marginBottom: 16,
        borderLeft: `4px solid ${sellado ? CE.verdeEureka : C.alerta}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
              <Icon name="shield" size={17} color={sellado ? CE.verdeOscuro : C.alerta} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.navy2 }}>Panel de Firmas Oficial</span>
              <span style={S.chip(
                sellado ? '#DCFCE7' : '#FEF3C7',
                sellado ? C.exito : C.alerta,
                sellado ? '#86EFAC' : '#FCD34D'
              )}>
                {sellado ? 'SELLADO' : 'BORRADOR'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: C.gris500, marginBottom: 9 }}>
              {etiquetaGobernanza(panel)}
            </div>

            {sellado && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {firmantes.map((f, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: C.gris700, borderLeft: `2px solid ${CE.verdeHalo}`, paddingLeft: 8 }}>
                    <div style={{ fontWeight: 700, color: C.navy2 }}>Jurado N.° {SLOTS_JURADO[i]}</div>
                    <div>{f?.nombreCompleto || '—'}</div>
                    <div style={{ color: C.gris500 }}>DNI {f?.dni || '—'}{f?.presidente ? ' · Presidente' : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={onAbrirPanel} style={btn(sellado ? 'secundario' : 'primario')}>
            <Icon name="shield" size={13} /> Abrir Panel de Firmas
          </button>
        </div>
      </div>

      {/* ── Banner de empates ── */}
      {empates.length > 0 && (
        <div style={{ ...aviso('error'), marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {empates.map(p => TEXTOS_LEGALES.bannerEmpate.replace('{puesto}', p)).join(' ')}
          </div>
          <div style={{ fontSize: 11.5, marginBottom: 9 }}>
            El cierre del consolidado y la emisión del Acta E20 quedan bloqueados hasta que el jurado
            calificador resuelva el empate mediante dirimencia colegiada.
          </div>
          {esStaff && !dirimencia && (
            <button type="button" onClick={() => setDirimencia({ participanteId: '', ordenManual: '', motivo: '' })} style={btn('critico')}>
              <Icon name="handshake" size={13} /> Registrar dirimencia
            </button>
          )}

          {dirimencia && (
            <div style={{ background: C.blanco, borderRadius: 5, padding: 12, marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div>
                  <label style={S.etiqueta}>Proyecto</label>
                  <select
                    value={dirimencia.participanteId}
                    onChange={e => setDirimencia({ ...dirimencia, participanteId: e.target.value })}
                    style={S.input}
                  >
                    <option value="">Seleccione</option>
                    {filas.filter(f => empates.includes(f.puesto)).map(f => (
                      <option key={f.participanteId} value={f.participanteId}>
                        {f.institucion} — {f.tituloProyecto} ({f.puntajeTotal})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.etiqueta}>Orden asignado</label>
                  <input
                    type="number" min="1"
                    value={dirimencia.ordenManual}
                    onChange={e => setDirimencia({ ...dirimencia, ordenManual: e.target.value })}
                    style={S.input}
                  />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={S.etiqueta}>Motivo de la dirimencia (obligatorio)</label>
                <textarea
                  value={dirimencia.motivo}
                  onChange={e => setDirimencia({ ...dirimencia, motivo: e.target.value })}
                  style={{ ...S.textarea, minHeight: 56 }}
                  placeholder="Criterio acordado por el jurado calificador conforme al numeral 11 de las bases."
                />
              </div>
              <div style={{ display: 'flex', gap: 9, marginTop: 10 }}>
                <button type="button" onClick={() => setDirimencia(null)} style={btn('secundario')}>Cancelar</button>
                <button type="button" onClick={aplicarDirimencia} disabled={guardando}
                  style={guardando ? btnDeshabilitado(btn('primario')) : btn('primario')}>
                  Aplicar dirimencia
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Encabezado del consolidado ── */}
      <div style={{ ...S.seccion }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy2 }}>
              Anexo E19 — Formato consolidado de evaluación
            </div>
            <div style={{ fontSize: 12, color: C.gris700, marginTop: 4 }}>
              {cat ? `${cat.nombre} — ${cat.grados}` : categoria} · {area ? area.nombre : areaId}
            </div>
            <div style={{ fontSize: 11.5, color: C.gris500, marginTop: 3 }}>
              Etapa {EUREKA_CONFIG.etapa} · {EUREKA_CONFIG.dre} · {EUREKA_CONFIG.ugel} · Fecha {EUREKA_CONFIG.fechaEvaluacion}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={S.chip(C.gris100, C.gris700, C.gris300)}>
              {completas} de {filas.length} filas completas
            </span>
            {cerrado && <span style={S.chip('#DCFCE7', C.exito, '#86EFAC')}>CERRADO</span>}
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{ ...S.seccion, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...S.tabla, borderCollapse: 'collapse', width: '100%', border: '1px solid #D6DCE8' }}>
            <thead>
              <tr style={{ background: '#1B3A5C', color: '#FFFFFF' }}>
                <th style={{ padding: '10px 8px', border: '1px solid #D6DCE8', width: 44, textAlign: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>N.°</th>
                <th style={{ padding: '10px 8px', border: '1px solid #D6DCE8', width: 110, color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>CÓDIGO</th>
                <th style={{ padding: '10px 10px', border: '1px solid #D6DCE8', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>I. E.</th>
                <th style={{ padding: '10px 10px', border: '1px solid #D6DCE8', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>TÍTULO DEL PROYECTO</th>
                {SLOTS_JURADO.map(s => (
                  <th key={s} style={{ padding: '10px 6px', border: '1px solid #D6DCE8', width: 62, textAlign: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>J{s}</th>
                ))}
                <th style={{ padding: '10px 8px', border: '1px solid #D6DCE8', width: 78, textAlign: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>TOTAL</th>
                <th style={{ padding: '10px 8px', border: '1px solid #D6DCE8', width: 72, textAlign: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>PROMEDIO</th>
                <th style={{ padding: '10px 8px', border: '1px solid #D6DCE8', width: 88, textAlign: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>PUESTO</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={7 + SLOTS_JURADO.length} style={{ ...S.td, textAlign: 'center', color: C.gris500, padding: 24 }}>
                    No hay participantes registrados en esta categoría y área.
                  </td>
                </tr>
              )}

              {filas.map((f, i) => {
                const podio = f.puesto && f.puesto <= 3;
                const enEmpate = empates.includes(f.puesto);
                const colorFondo = enEmpate
                  ? '#FEF2F2'
                  : (f.puesto === 1 ? '#FEF9C3' : (f.puesto === 2 ? '#F1F5F9' : (f.puesto === 3 ? '#FFEDD5' : C.blanco)));

                return (
                  <tr key={f.participanteId} style={{ background: colorFondo, transition: 'background 0.15s ease' }}>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, border: '1px solid #D6DCE8' }}>{f.ordenPresentacion || i + 1}</td>
                    <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace', border: '1px solid #D6DCE8' }}>{f.codigoParticipante}</td>
                    <td style={{ ...S.td, fontSize: 13, fontWeight: 700, color: '#0F172A', border: '1px solid #D6DCE8' }}>{f.institucion}</td>
                    <td style={{ ...S.td, fontSize: 12.5, border: '1px solid #D6DCE8' }}>
                      {f.tituloProyecto || 'Sin título registrado'}
                      {(f.noSePresento || f.incomparecencia) && (
                        <span style={{ ...S.chip('#FEF2F2', C.error, '#FECACA'), marginLeft: 6 }}>NSP</span>
                      )}
                      {f.noProsigue && (
                        <span style={{ ...S.chip('#FFFBEB', C.alerta, '#FDE68A'), marginLeft: 6 }}>No prosigue</span>
                      )}
                      {f.ordenManual != null && (
                        <span style={{ ...S.chip('#EFF6FF', '#1E40AF', '#BFDBFE'), marginLeft: 6 }}>Dirimido</span>
                      )}
                    </td>
                    {SLOTS_JURADO.map(s => (
                      <td key={s} style={{ ...S.td, textAlign: 'center', fontWeight: 700, fontSize: 13, border: '1px solid #D6DCE8' }}>
                        {f[`jurado${s}`] != null ? f[`jurado${s}`] : <span style={{ color: C.gris300 }}>—</span>}
                      </td>
                    ))}
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, fontSize: 14, border: '1px solid #D6DCE8' }}>
                      {f.suma != null ? f.suma : <span style={{ color: C.gris300 }}>—</span>}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#15803D', border: '1px solid #D6DCE8' }}>
                      {f.promedio != null ? f.promedio.toFixed(EUREKA_CONFIG.decimalesPromedio) : <span style={{ color: C.gris300 }}>—</span>}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, border: '1px solid #D6DCE8' }}>
                      {f.puesto === 1 && (
                        <span style={{ background: '#CA8A04', color: C.blanco, padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                          <Icon name="award" size={13} color={C.blanco} /> 1.er Puesto
                        </span>
                      )}
                      {f.puesto === 2 && (
                        <span style={{ background: '#64748B', color: C.blanco, padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                          <Icon name="award" size={13} color={C.blanco} /> 2.° Puesto
                        </span>
                      )}
                      {f.puesto === 3 && (
                        <span style={{ background: '#B45309', color: C.blanco, padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                          <Icon name="award" size={13} color={C.blanco} /> 3.er Puesto
                        </span>
                      )}
                      {f.puesto > 3 && (
                        <span style={{ color: C.gris700, fontSize: 13 }}>{f.puesto}.°</span>
                      )}
                      {!f.puesto && <span style={{ color: C.gris300 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '11px 16px', borderTop: `1px solid ${C.border}`, fontSize: 10.5, color: C.gris500, fontStyle: 'italic', lineHeight: 1.5 }}>
          {TEXTOS_LEGALES.declaracionEticaE19}
        </div>
      </div>

      {completas < filas.length && (
        <div style={{ ...aviso('alerta'), marginBottom: 16 }}>
          Hay {filas.length - completas} fila(s) sin las {SLOTS_JURADO.length} evaluaciones registradas.
          Esas filas no participan del orden de mérito y se imprimen con un guion en la columna Puesto.
          La descarga del E19 no se bloquea por este motivo.
        </div>
      )}

      {/* ── Acciones ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={descargarPDF}
          disabled={descargando}
          style={descargando ? btnDeshabilitado(btn('real')) : btn('real', { minHeight: 40, padding: '9px 18px', fontSize: 13 })}
        >
          <Icon name="download" size={14} color="#FFFFFF" /> {descargando ? 'Generando...' : 'Descargar E19 (PDF)'}
        </button>

        <button
          type="button"
          onClick={exportarExcel}
          style={btn('secundario', { minHeight: 40, padding: '9px 16px', fontSize: 13 })}
        >
          <Icon name="fileText" size={14} /> Exportar Excel
        </button>

        <button
          type="button"
          onClick={descargarCategoriaCompleta}
          disabled={descargando}
          style={descargando ? btnDeshabilitado(btn('indigo')) : btn('indigo', { minHeight: 40, padding: '9px 18px', fontSize: 13 })}
        >
          <Icon name="download" size={14} color="#FFFFFF" /> E19 de toda la categoría
        </button>

        {esStaff && (
          <button
            type="button"
            onClick={guardarConsolidado}
            disabled={guardando}
            style={guardando ? btnDeshabilitado(btn('secundario')) : btn('secundario', { minHeight: 40, padding: '9px 16px', fontSize: 13 })}
          >
            <Icon name="save" size={14} /> Guardar consolidado
          </button>
        )}

        {esStaff && !cerrado && (
          <button
            type="button"
            onClick={cerrarConsolidado}
            disabled={guardando || empates.length > 0}
            style={(guardando || empates.length > 0) ? btnDeshabilitado(btn('exito')) : btn('exito', { minHeight: 40, padding: '9px 20px', fontSize: 13.5 })}
            title={empates.length > 0 ? 'Resuelva los empates del podio antes de cerrar.' : ''}
          >
            <Icon name="lock" size={14} color="#FFFFFF" /> Cerrar consolidado
          </button>
        )}
      </div>
    </div>
  );
}
