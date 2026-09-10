import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso, MODAL_FONDO, MODAL_CAJA } from './cyeEstilos';
import { TarjetaPanelFirmas, EncabezadoFormato } from './CYEComunes';
import { CYE_CONFIG, SLOTS_JURADO, getCategoriaCYE } from '../../data/creaEmprendeConfig';
import { maximoCategoria } from '../../data/creaEmprendeRubricas';
import { construirD14, detectarEmpatesPodioCYE, sugerirDirimenciaCYE, etiquetaPuesto } from '../../utils/creaEmprendeHelpers';
import { guardarDirimenciaCYE, cerrarCYEConsolidado, reabrirCYEConsolidado } from '../../firebase/dbCreaEmprende';
import { obtenerMembreteCYE } from '../../pdf/membreteCreaEmprende';
import { generarD14PDF } from '../../pdf/generarDocumentosCYEPDF';

const FONDO_PUESTO = { 1: '#FEF9C3', 2: '#F1F5F9', 3: '#FFEDD5' };

/** Anexo D14 — Formato consolidado de evaluación de la categoría. */
export default function CYEConsolidadoD14({ categoria, participantes = [], evaluaciones = [], consolidado, panel, usuario, esStaff, esAdmin, onAbrirPanel, onToast }) {
  const cerrado = consolidado?.estado === 'cerrado';
  const filasVivas = useMemo(
    () => construirD14(participantes, evaluaciones, { dirimencia: consolidado?.dirimencia }),
    [participantes, evaluaciones, consolidado?.dirimencia]
  );
  const filas = cerrado && Array.isArray(consolidado?.filas) ? consolidado.filas : filasVivas;
  const empates = useMemo(() => detectarEmpatesPodioCYE(filas), [filas]);
  const sugerencia = useMemo(() => sugerirDirimenciaCYE(construirD14(participantes, evaluaciones)), [participantes, evaluaciones]);
  const claveSugerencia = JSON.stringify(sugerencia?.orden || {});

  const [orden, setOrden] = useState({});
  const [criterio, setCriterio] = useState(CYE_CONFIG.criterioDesempate);
  const [trabajando, setTrabajando] = useState(false);
  const [reabrir, setReabrir] = useState(false);
  const [motivo, setMotivo] = useState('');
  useEffect(() => { setOrden(sugerencia?.orden || {}); }, [claveSugerencia]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendientes = filas.filter(f => !f.completo && !f.noSePresento);
  const observados = participantes.filter(p => p.estadoAdmision === 'observado');
  const puedeCerrar = esStaff && !cerrado && empates.length === 0 && pendientes.length === 0 && observados.length === 0 && filas.length > 0;
  const maximo = maximoCategoria(categoria) * SLOTS_JURADO.length;

  const registrarDirimencia = async () => {
    const soloEmpatados = {};
    for (const e of empates) {
      const valores = e.filas.map(f => Number(orden[f.participanteId]));
      if (valores.some(v => !v) || new Set(valores).size !== valores.length) {
        if (onToast) onToast(`Asigne un orden distinto a cada proyecto empatado en el ${e.puesto}.° puesto.`, 'error');
        return;
      }
      e.filas.forEach(f => { soloEmpatados[f.participanteId] = Number(orden[f.participanteId]); });
    }
    try {
      setTrabajando(true);
      await guardarDirimenciaCYE(categoria, { criterio, orden: soloEmpatados }, usuario);
      if (onToast) onToast('Dirimencia registrada.', 'success');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const cerrar = async () => {
    if (!window.confirm(`¿Cerrar el consolidado D14 de la categoría ${categoria}? El Acta D15 se emitirá con estos resultados.`)) return;
    try {
      setTrabajando(true);
      await cerrarCYEConsolidado(categoria, { filas: filasVivas }, usuario);
      if (onToast) onToast('Consolidado D14 cerrado.', 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo cerrar: ${err.message}`, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const confirmarReapertura = async () => {
    try {
      setTrabajando(true);
      await reabrirCYEConsolidado(categoria, motivo, usuario);
      setReabrir(false);
      setMotivo('');
      if (onToast) onToast('Consolidado reabierto.', 'info');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const descargar = async () => {
    try {
      const banner = await obtenerMembreteCYE();
      const huboDirimencia = filas.some(f => f.dirimido && f.puesto && f.puesto <= 3);
      generarD14PDF({ categoria, filas, panel, banner, criterioDesempate: huboDirimencia ? consolidado?.dirimencia?.criterio : '' });
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el D14: ${err.message}`, 'error');
    }
  };

  const exportarExcel = () => {
    const cat = getCategoriaCYE(categoria);
    const aoa = [
      ['Anexo D14 — Formato consolidado de evaluación'],
      [`Concurso Nacional Crea y Emprende ${CYE_CONFIG.anio} — Etapa ${CYE_CONFIG.etapa}`],
      [`DRE/GRE: ${CYE_CONFIG.dre}`, `UGEL: ${CYE_CONFIG.ugel}`, `Modalidad: ${cat?.modalidad || ''}`, `Categoría: ${categoria}`, `Fecha: ${CYE_CONFIG.fechaEvaluacion}`],
      [],
      ['N.°', 'Título del proyecto', 'IE', 'Jurado 1', 'Jurado 2', 'Jurado 3', 'Puntaje total', 'Puesto', 'Grupo'],
      ...filas.map(f => [f.numero, f.tituloProyecto, f.institucion, f.jurado1 ?? '', f.jurado2 ?? '', f.jurado3 ?? '', f.total ?? '', f.puesto ?? '', f.grupo ?? ''])
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), `D14 Cat ${categoria}`);
    XLSX.writeFile(wb, `AnexoD14_CreaEmprende2026_Cat${categoria}.xlsx`);
  };

  const td = (contenido, extra = {}) => <td style={{ ...S.td, ...extra }}>{contenido}</td>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TarjetaPanelFirmas panel={panel} onAbrir={onAbrirPanel} esStaff={esStaff} />
      <EncabezadoFormato
        anexo="D14"
        titulo="Formato consolidado de evaluación"
        categoria={categoria}
        chips={(
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={S.chip(C.g100, C.g700, C.g300)}>{filas.filter(f => f.completo).length} de {filas.length} completos</span>
            {cerrado && <span style={S.chip('#DCFCE7', C.green, '#86EFAC')}>CERRADO</span>}
          </div>
        )}
      />

      {!cerrado && empates.length > 0 && (
        <div style={aviso('error')}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            Empate en el podio ({empates.map(e => etiquetaPuesto(e.puesto)).join(', ')}). El consolidado no se cierra hasta dirimirlo.
          </div>
          {sugerencia && (
            <div style={{ fontSize: 12.5, marginBottom: 10 }}>
              Orden propuesto con la jerarquía aprobada (D11, luego D10, luego D12){sugerencia.completo ? '' : '; hay proyectos idénticos en los tres instrumentos que el jurado debe ordenar'}.
            </div>
          )}
          {empates.map(e => (
            <div key={e.puesto} style={{ background: C.white, borderRadius: 6, padding: 10, marginBottom: 8, color: C.g800 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.navy2, marginBottom: 6 }}>{etiquetaPuesto(e.puesto)} — {e.filas[0].total} puntos</div>
              {e.filas.map(f => (
                <div key={f.participanteId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', flexWrap: 'wrap' }}>
                  <input
                    type="number" min="1" max={e.filas.length} value={orden[f.participanteId] ?? ''} disabled={!esStaff}
                    onChange={ev => setOrden(o => ({ ...o, [f.participanteId]: ev.target.value }))}
                    style={{ ...S.input, width: 64, textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 12.5, flex: 1, minWidth: 200 }}>
                    <strong>{f.institucion}</strong> — {f.tituloProyecto}
                    <span style={{ color: C.g500, marginLeft: 6, fontFamily: FUENTES.mono, fontSize: 11 }}>D11 {f.d11Suma} · D10 {f.d10Suma} · D12 {f.d12Suma}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
          {esStaff && (
            <>
              <label style={{ ...S.etiqueta, color: C.red }}>Criterio de desempate</label>
              <textarea value={criterio} onChange={e => setCriterio(e.target.value)} style={{ ...S.textarea, minHeight: 60 }} />
              <button type="button" onClick={registrarDirimencia} disabled={trabajando} style={{ ...(trabajando ? btnDeshabilitado(btn('critico')) : btn('critico')), marginTop: 8 }}>
                <Icon name="check" size={13} color={C.white} /> Registrar dirimencia
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ ...S.tarjeta, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 44, textAlign: 'center' }}>N.°</th>
                <th style={S.th}>Título del proyecto</th>
                <th style={S.th}>IE</th>
                {SLOTS_JURADO.map(s => <th key={s} style={{ ...S.th, width: 70, textAlign: 'center' }}>Jurado {s}</th>)}
                <th style={{ ...S.th, width: 90, textAlign: 'center' }}>Puntaje total<div style={{ fontWeight: 400, fontSize: 10.5 }}>máx. {maximo}</div></th>
                <th style={{ ...S.th, width: 96, textAlign: 'center' }}>Puesto</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.participanteId} style={{ background: f.empatado ? '#FEF2F2' : (FONDO_PUESTO[f.puesto] || C.white) }}>
                  {td(f.numero, { textAlign: 'center', fontFamily: FUENTES.mono, fontWeight: 700 })}
                  {td(<>
                    <span style={{ fontWeight: 700, color: C.navy2 }}>{f.tituloProyecto}</span>
                    {f.noSePresento && <span style={{ ...S.chip('#FEF2F2', C.red, '#FECACA'), marginLeft: 6 }}>No se presentó</span>}
                    {f.dirimido && <span style={{ ...S.chip('#EFF6FF', '#1E40AF', '#BFDBFE'), marginLeft: 6 }}>Dirimido</span>}
                  </>)}
                  {td(f.institucion, { fontSize: 11.5 })}
                  {SLOTS_JURADO.map(s => <td key={s} style={{ ...S.td, textAlign: 'center', fontFamily: FUENTES.mono }}>{f[`jurado${s}`] ?? '—'}</td>)}
                  {td(f.total ?? '—', { textAlign: 'center', fontFamily: FUENTES.mono, fontWeight: 800, color: C.navy2, fontSize: 13 })}
                  {td(f.puesto ? (f.puesto <= 3 ? etiquetaPuesto(f.puesto) : `${f.puesto}.°`) : '—', { textAlign: 'center', fontWeight: 800, color: f.puesto && f.puesto <= 3 ? C.navy2 : C.g500 })}
                </tr>
              ))}
              {filas.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: 24, color: C.g500 }}>No hay proyectos en esta categoría.</td></tr>}
            </tbody>
          </table>
        </div>
        {(pendientes.length > 0 || observados.length > 0) && !cerrado && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.amber, fontWeight: 700 }}>
            {pendientes.length > 0 && `${pendientes.length} proyecto(s) aún sin sus tres calificaciones registradas. `}
            {observados.length > 0 && `${observados.length} proyecto(s) observados pendientes de decisión en Padrón y admisión.`}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" onClick={descargar} style={btn('real')}><Icon name="download" size={13} color={C.white} /> Descargar D14 (PDF)</button>
        <button type="button" onClick={exportarExcel} style={btn('secundario')}><Icon name="fileText" size={13} /> Exportar Excel</button>
        {esStaff && !cerrado && (
          <button type="button" onClick={cerrar} disabled={!puedeCerrar || trabajando} style={!puedeCerrar || trabajando ? btnDeshabilitado(btn('exito')) : btn('exito')}>
            <Icon name="lock" size={13} color={C.white} /> Cerrar consolidado
          </button>
        )}
        {cerrado && esAdmin && (
          <button type="button" onClick={() => setReabrir(true)} style={btn('peligroSuave')}><Icon name="refresh" size={13} /> Reabrir consolidado</button>
        )}
      </div>

      {reabrir && (
        <div style={MODAL_FONDO}>
          <div style={MODAL_CAJA}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.red, marginBottom: 10 }}>Reabrir el consolidado D14</div>
            <label style={S.etiqueta}>Motivo (mínimo 10 caracteres)</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} style={S.textarea} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setReabrir(false)} style={btn('secundario')}>Cancelar</button>
              <button type="button" onClick={confirmarReapertura} disabled={motivo.trim().length < 10 || trabajando} style={motivo.trim().length < 10 || trabajando ? btnDeshabilitado(btn('critico')) : btn('critico')}>Reabrir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
