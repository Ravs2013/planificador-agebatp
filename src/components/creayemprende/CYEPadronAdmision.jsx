import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso, MODAL_FONDO, MODAL_CAJA } from './cyeEstilos';
import { CATEGORIAS_CYE, ESTADOS_ADMISION, gruposDeCategoria } from '../../data/creaEmprendeConfig';
import {
  resumenAdmision, resumenGradoSeccion, esEvaluable, parsearReportesSICECYE, construirParticipantesCYE, formatearFechaHora
} from '../../utils/creaEmprendeHelpers';
import { actualizarEstadoProyectoCYE, importarParticipantesCYE } from '../../firebase/dbCreaEmprende';

const OPCIONES_DECISION = [
  { id: 'apto', etiqueta: 'Admitir', detalle: 'El proyecto se evalúa y entra al orden de mérito.' },
  { id: 'no_apto', etiqueta: 'No admitir', detalle: 'El proyecto sale de las fichas, consolidados y actas.' },
  { id: 'calculo', etiqueta: 'Aplicar el resultado según las bases', detalle: 'Se quita la decisión manual y rige la verificación automática.' }
];

/**
 * Padrón y admisión — visible solo para la comisión.
 * Aquí viven los proyectos que no cumplen las bases, con su motivo exacto, su enlace para
 * ubicarlos y la decisión de la comisión con historial. Los jurados nunca ven esta pestaña.
 */
export default function CYEPadronAdmision({ participantes = [], evaluaciones = [], usuario, onToast }) {
  const [categoria, setCategoria] = useState('todas');
  const [estado, setEstado] = useState('no_apto');
  const [busqueda, setBusqueda] = useState('');
  const [decision, setDecision] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return participantes
      .filter(p => (categoria === 'todas' || p.categoria === categoria) && (estado === 'todos' || p.estadoAdmision === estado))
      .filter(p => !q || [p.institucion?.nombre, p.tituloProyecto, p.institucion?.codigoModular].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [participantes, categoria, estado, busqueda]);

  const guardarDecision = async () => {
    const { proyecto, opcion, motivo } = decision;
    if (opcion !== 'calculo' && motivo.trim().length < 10) return;
    try {
      setTrabajando(true);
      const cambios = opcion === 'calculo'
        ? { admision: null }
        : { admision: { estado: opcion, motivo: motivo.trim(), por: usuario?.email || '', en: new Date().toISOString() } };
      await actualizarEstadoProyectoCYE(proyecto.id, cambios, usuario, {
        accion: opcion === 'apto' ? 'admitir' : (opcion === 'no_apto' ? 'no_admitir' : 'restablecer'),
        motivo
      });
      setDecision(null);
      if (onToast) onToast('Decisión registrada.', 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo registrar: ${err.message}`, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const cambiarGrupo = async (p, grupo) => {
    try {
      await actualizarEstadoProyectoCYE(p.id, { grupo: Number(grupo) }, usuario, { accion: 'grupo', motivo: `Grupo ${grupo}` });
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    }
  };

  const alternarInasistencia = async (p) => {
    const texto = p.noSePresento ? '¿Quitar la inasistencia registrada?' : `¿Registrar que "${p.tituloProyecto}" no se presentó a la Expoferia? Queda fuera del orden de mérito.`;
    if (!window.confirm(texto)) return;
    try {
      await actualizarEstadoProyectoCYE(p.id, { noSePresento: !p.noSePresento }, usuario, { accion: 'inasistencia' });
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    }
  };

  const leerArchivos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (archivos.length === 0) return;
    try {
      const hojas = [];
      for (const f of archivos) {
        const libro = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        hojas.push({ nombre: f.name, filas: XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null }) });
      }
      const res = parsearReportesSICECYE(hojas);
      const vista = construirParticipantesCYE({ semilla: [], importados: res.proyectos, distribucion: {} });
      setPrevia({ ...res, resumen: CATEGORIAS_CYE.map(c => ({ categoria: c.id, ...resumenAdmision(vista, c.id) })) });
    } catch (err) {
      if (onToast) onToast(`No se pudo leer el archivo: ${err.message}`, 'error');
    }
  };

  const importar = async () => {
    try {
      setTrabajando(true);
      const n = await importarParticipantesCYE(previa.proyectos, usuario);
      setPrevia(null);
      if (onToast) onToast(`${n} proyectos importados. La admisión se recalculó con las bases.`, 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo importar: ${err.message}`, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const exportar = () => {
    const filas = [['Categoría', 'N.°', 'Estado', 'Decisión de la comisión', 'I. E.', 'Código modular', 'Proyecto', 'Integrantes', 'Grado y sección', 'Grupo', 'Motivos', 'Enlace']];
    participantes.forEach(p => filas.push([
      p.categoria, p.numero || '', ESTADOS_ADMISION[p.estadoAdmision]?.etiqueta || p.estadoAdmision,
      p.decisionComision ? `${p.decisionComision.motivo} (${p.decisionComision.por})` : '',
      p.institucion?.nombre, p.institucion?.codigoModular, p.tituloProyecto, (p.integrantes || []).length,
      resumenGradoSeccion(p.integrantes), p.grupo || '', (p.motivosAdmision || []).map(m => m.texto).join(' | '), p.enlaceWeb || ''
    ]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), 'Padrón');
    XLSX.writeFile(wb, 'Padron_Admision_CreaEmprende2026.xlsx');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {CATEGORIAS_CYE.map(c => {
          const r = resumenAdmision(participantes, c.id);
          return (
            <div key={c.id} style={{ ...S.tarjeta, padding: 14, borderLeft: `4px solid ${C.navy3}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy2 }}>{c.nombre}</div>
              <div style={{ fontSize: 11, color: C.g500, marginBottom: 8 }}>{c.grados}</div>
              <div style={{ display: 'flex', gap: 14, fontFamily: FUENTES.mono }}>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{r.apto}</div><div style={{ fontSize: 10, color: C.g500, fontFamily: FUENTES.sans, fontWeight: 700 }}>APTOS</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: C.amber }}>{r.observado}</div><div style={{ fontSize: 10, color: C.g500, fontFamily: FUENTES.sans, fontWeight: 700 }}>OBSERVADOS</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: C.red }}>{r.no_apto}</div><div style={{ fontSize: 10, color: C.g500, fontFamily: FUENTES.sans, fontWeight: 700 }}>NO APTOS</div></div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.seccion, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 150 }}>
          <label style={S.etiqueta}>Categoría</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)} style={S.input}>
            <option value="todas">Todas</option>
            {CATEGORIAS_CYE.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 150 }}>
          <label style={S.etiqueta}>Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={S.input}>
            <option value="todos">Todos</option>
            <option value="apto">Aptos</option>
            <option value="observado">Observados</option>
            <option value="no_apto">No aptos</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={S.etiqueta}>Buscar</label>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="I. E., proyecto o código modular" style={S.input} />
        </div>
        <label style={btn('gris')}>
          <Icon name="upload" size={13} /> Importar reporte SICE
          <input type="file" accept=".xlsx,.xls" multiple onChange={leerArchivos} style={{ display: 'none' }} />
        </label>
        <button type="button" onClick={exportar} style={btn('secundario')}><Icon name="download" size={13} /> Exportar padrón</button>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy2 }}>{lista.length} proyecto(s)</div>

      {lista.map(p => {
        const est = ESTADOS_ADMISION[p.estadoAdmision] || ESTADOS_ADMISION.apto;
        const evaluable = esEvaluable(p);
        const fichas = evaluaciones.filter(ev => ev.participanteId === p.id).length;
        return (
          <div key={p.id} style={{ ...S.tarjeta, padding: 14, borderLeft: `5px solid ${est.texto}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={S.chip(est.fondo, est.texto, est.borde)}>{est.etiqueta.toUpperCase()}</span>
                  <span style={S.chip(C.g100, C.g700, C.g300)}>Categoría {p.categoria}{p.numero ? ` · N.° ${p.numero}` : ''}</span>
                  {p.grupo && evaluable && <span style={S.chip(C.g100, C.g700, C.g300)}>Grupo {p.grupo}</span>}
                  {p.noSePresento && <span style={S.chip('#FEF2F2', C.red, '#FECACA')}>No se presentó</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2 }}>{p.institucion?.nombre} <span style={{ fontWeight: 400, color: C.g500, fontSize: 12 }}>({p.institucion?.codigoModular})</span></div>
                <div style={{ fontSize: 13, color: C.g800, marginTop: 2 }}>{p.tituloProyecto}</div>
                <div style={{ fontSize: 11.5, color: C.g500, marginTop: 4 }}>
                  {(p.integrantes || []).length} integrantes · {resumenGradoSeccion(p.integrantes)} · {p.puestoIE}.° puesto en la I. E. · Registro {formatearFechaHora(p.fechaRegistro)}
                  {p.docenteAsesor?.nombreCompleto ? ` · Docente asesor: ${p.docenteAsesor.nombreCompleto}` : ''}
                </div>
                {(p.motivosAdmision || []).length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 1.5 }}>
                    {p.motivosAdmision.map((m, i) => <li key={i} style={{ color: m.tipo === 'no_apto' ? C.red : C.amber }}>{m.texto}</li>)}
                  </ul>
                )}
                {(p.alertas || []).map((a, i) => <div key={i} style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>{a.texto}</div>)}
                {p.decisionComision && (
                  <div style={{ ...aviso('info'), marginTop: 8, fontSize: 12 }}>
                    Decisión de la comisión: <strong>{ESTADOS_ADMISION[p.decisionComision.estado]?.etiqueta}</strong>. {p.decisionComision.motivo}
                    <span style={{ color: C.g500 }}> — {p.decisionComision.por}{p.decisionComision.en ? `, ${new Date(p.decisionComision.en).toLocaleString('es-PE')}` : ''}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch', minWidth: 190 }}>
                {p.enlaceWeb && (
                  <a href={p.enlaceWeb} target="_blank" rel="noreferrer" style={{ ...btn('secundario'), textDecoration: 'none', color: C.sky }}>
                    <Icon name="externalLink" size={13} color={C.sky} /> Abrir portafolio
                  </a>
                )}
                {evaluable && (
                  <select value={p.grupo || ''} onChange={e => cambiarGrupo(p, e.target.value)} style={{ ...S.input, fontSize: 12 }}>
                    {gruposDeCategoria(p.categoria).map(g => <option key={g} value={g}>Grupo {g}</option>)}
                  </select>
                )}
                {evaluable && (
                  <button type="button" onClick={() => alternarInasistencia(p)} style={btn(p.noSePresento ? 'gris' : 'peligroSuave')}>
                    {p.noSePresento ? 'Quitar inasistencia' : 'Registrar inasistencia'}
                  </button>
                )}
                <button type="button" onClick={() => setDecision({ proyecto: p, opcion: p.estadoAdmision === 'no_apto' ? 'apto' : 'no_apto', motivo: '', fichas })} style={btn('primario')}>
                  Cambiar decisión
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {decision && (
        <div style={MODAL_FONDO}>
          <div style={MODAL_CAJA}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginBottom: 4 }}>Decisión de la comisión</div>
            <div style={{ fontSize: 12.5, color: C.g700, marginBottom: 12 }}>{decision.proyecto.institucion?.nombre} — {decision.proyecto.tituloProyecto}</div>
            {OPCIONES_DECISION.map(o => (
              <label key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', border: `1px solid ${decision.opcion === o.id ? C.navy3 : C.border}`, borderRadius: 6, marginBottom: 6, cursor: 'pointer', background: decision.opcion === o.id ? '#EFF6FF' : C.white }}>
                <input type="radio" checked={decision.opcion === o.id} onChange={() => setDecision(d => ({ ...d, opcion: o.id }))} style={{ marginTop: 3, accentColor: C.navy3 }} />
                <span><strong style={{ fontSize: 13, color: C.navy2 }}>{o.etiqueta}</strong><div style={{ fontSize: 11.5, color: C.g500 }}>{o.detalle}</div></span>
              </label>
            ))}
            {decision.opcion === 'no_apto' && decision.fichas > 0 && (
              <div style={{ ...aviso('alerta'), fontSize: 12, marginBottom: 6 }}>Este proyecto ya tiene {decision.fichas} ficha(s) registradas; dejarán de contar en los resultados.</div>
            )}
            {decision.opcion !== 'calculo' && (
              <>
                <label style={S.etiqueta}>Motivo (mínimo 10 caracteres)</label>
                <textarea value={decision.motivo} onChange={e => setDecision(d => ({ ...d, motivo: e.target.value }))} style={S.textarea} />
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setDecision(null)} style={btn('secundario')}>Cancelar</button>
              <button
                type="button"
                onClick={guardarDecision}
                disabled={trabajando || (decision.opcion !== 'calculo' && decision.motivo.trim().length < 10)}
                style={trabajando || (decision.opcion !== 'calculo' && decision.motivo.trim().length < 10) ? btnDeshabilitado(btn('primario')) : btn('primario')}
              >
                Registrar decisión
              </button>
            </div>
          </div>
        </div>
      )}

      {previa && (
        <div style={MODAL_FONDO}>
          <div style={{ ...MODAL_CAJA, maxWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginBottom: 10 }}>Importar reporte SICE</div>
            <div style={{ fontSize: 13, color: C.g800, marginBottom: 10 }}>{previa.proyectos.length} proyectos en {previa.totalFilas} filas de estudiantes.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead><tr>{['Categoría', 'Aptos', 'Observados', 'No aptos'].map(t => <th key={t} style={S.th}>{t}</th>)}</tr></thead>
              <tbody>
                {previa.resumen.map(r => (
                  <tr key={r.categoria}>
                    <td style={S.td}>{r.categoria}</td><td style={S.td}>{r.apto}</td><td style={S.td}>{r.observado}</td><td style={S.td}>{r.no_apto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previa.errores.length > 0 && <div style={{ ...aviso('alerta'), fontSize: 12 }}>{previa.errores.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}</div>}
            <div style={{ fontSize: 11.5, color: C.g500, marginTop: 8 }}>Los nombres de los integrantes se guardan en Firestore con acceso restringido. Los documentos de identidad no se guardan.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setPrevia(null)} style={btn('secundario')}>Cancelar</button>
              <button type="button" onClick={importar} disabled={trabajando || previa.proyectos.length === 0} style={trabajando ? btnDeshabilitado(btn('primario')) : btn('primario')}>
                <Icon name="upload" size={13} color={C.white} /> Importar {previa.proyectos.length} proyectos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
