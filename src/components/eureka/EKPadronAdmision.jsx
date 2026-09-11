import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso, MODAL_FONDO, MODAL_CAJA } from '../creayemprende/cyeEstilos';
import { CATEGORIAS, AREAS_PARTICIPACION, getArea } from '../../data/eurekaConfigUGEL03';
import {
  ESTADOS_ADMISION_EK, ALERTAS_PADRON, motivoAnexoTexto, requiereRevision, etiquetaOpcion, resumenAnexos
} from '../../utils/eurekaAnexos';
import { esReporteCompletoSICE, parsearReporteCompletoSICE } from '../../utils/eurekaSICE';
import { registrarAdmisionEK, importarDatosSICEEurekaEK } from '../../firebase/dbEureka';
import { nombresEstudiantes } from '../../utils/eurekaHelpers';
import { ChipsAnexo, ModalCambioAnexo } from './EKAnexoAplicable';

const CIERRE_INSCRIPCION = '2026-09-04T23:59:59';

const OPCIONES_ADMISION = [
  { id: 'apto', etiqueta: 'Apto', detalle: ESTADOS_ADMISION_EK.apto.detalle },
  { id: 'observado', etiqueta: 'Observado, apto provisional', detalle: ESTADOS_ADMISION_EK.observado.detalle },
  { id: 'retirado', etiqueta: 'Retirado', detalle: ESTADOS_ADMISION_EK.retirado.detalle },
  { id: 'inicial', etiqueta: 'Volver al estado inicial del padrón', detalle: 'Quita la decisión manual de la comisión.' }
];

function fechaHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function tieneEstudiantes(p) {
  return (p.estudiantes || []).some(e => e && (e.nombres || e.apellidoPaterno));
}

/**
 * Padrón y admisión de Eureka — solo comisión.
 * Aquí se revisan los proyectos observados, los anexos de confianza baja y las alertas de
 * inscripción; se registran las decisiones con motivo y se importan los datos completos de SICE.
 */
export default function EKPadronAdmision({ participantes = [], evaluaciones = [], usuario, onToast, onAbrirFicha }) {
  const [categoria, setCategoria] = useState('todas');
  const [areaId, setAreaId] = useState('todas');
  const [estado, setEstado] = useState('revision');
  const [anexo, setAnexo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [limite, setLimite] = useState(40);
  const [decision, setDecision] = useState(null);
  const [cambioAnexo, setCambioAnexo] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  const areas = AREAS_PARTICIPACION.filter(a => categoria === 'todas' || a.categorias.includes(categoria));
  const conEstudiantes = participantes.filter(tieneEstudiantes).length;
  const porRevisar = participantes.filter(requiereRevision).length;

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return participantes
      .filter(p => categoria === 'todas' || p.categoria === categoria)
      .filter(p => areaId === 'todas' || p.areaId === areaId)
      .filter(p => anexo === 'todos' || p.anexoEvaluacion === anexo)
      .filter(p => {
        if (estado === 'todos') return true;
        if (estado === 'revision') return requiereRevision(p);
        if (estado === 'comision') return p.anexoOrigen === 'comision' || Boolean(p.decisionComision);
        return p.estadoAdmision === estado;
      })
      .filter(p => !q || [p.institucion?.nombre, p.tituloProyecto, p.pseudonimo, p.institucion?.codigoModular, p.id, p.docenteAsesor?.nombreCompleto]
        .filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [participantes, categoria, areaId, anexo, estado, busqueda]);

  const guardarDecision = async () => {
    const { proyecto, opcion, motivo } = decision;
    if (opcion !== 'inicial' && motivo.trim().length < 10) return;
    try {
      setTrabajando(true);
      await registrarAdmisionEK(proyecto, { estado: opcion === 'inicial' ? null : opcion, motivo }, usuario);
      setDecision(null);
      if (onToast) onToast('Decisión de admisión registrada.', 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo registrar: ${err.message}`, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const leerArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array', cellDates: true });
      const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, raw: true, defval: null });
      if (!esReporteCompletoSICE(filas)) {
        if (onToast) onToast('El archivo no es el reporte completo de ganadores de SICE (ReporteGanadoresEUREKA). Use «Registro manual y herramientas anteriores» para otros formatos.', 'error');
        return;
      }
      const res = parsearReporteCompletoSICE(filas);
      if (res.error) { if (onToast) onToast(res.error, 'error'); return; }
      const ids = new Set(participantes.map(p => p.id));
      setPrevia({
        ...res,
        nombreArchivo: archivo.name,
        coinciden: res.proyectos.filter(p => ids.has(p.id)).length,
        nuevos: res.proyectos.filter(p => !ids.has(p.id)),
        estudiantes: res.proyectos.reduce((s, p) => s + p.estudiantes.length, 0),
        fueraPlazo: res.proyectos.filter(p => p.fechaRegistro && p.fechaRegistro > CIERRE_INSCRIPCION)
      });
    } catch (err) {
      if (onToast) onToast(`No se pudo leer el archivo: ${err.message}`, 'error');
    }
  };

  const importar = async () => {
    try {
      setTrabajando(true);
      const n = await importarDatosSICEEurekaEK(previa.proyectos, usuario);
      setPrevia(null);
      if (onToast) onToast(`${n} proyectos actualizados con estudiantes y docente asesor.`, 'success');
    } catch (err) {
      if (onToast) onToast(`No se pudo importar: ${err.message}`, 'error');
    } finally {
      setTrabajando(false);
    }
  };

  const exportar = () => {
    const filas = [['Categoría', 'Área', 'N.°', 'Código SICE', 'I. E.', 'Código modular', 'Título', 'Pseudónimo', 'Anexo vigente', 'Origen del anexo', 'Confianza', 'Motivo del anexo', 'Alertas', 'Admisión', 'Decisión de la comisión', 'Estudiantes', 'Docente asesor', 'Registro SICE', 'Enlace']];
    participantes.forEach(p => filas.push([
      p.categoria, getArea(p.areaId)?.nombre || p.areaId, p.numero || '', p.id, p.institucion?.nombre || '', p.institucion?.codigoModular || '',
      p.tituloProyecto, p.pseudonimo || '', etiquetaOpcion(p.anexoEvaluacion, p.varianteRubrica),
      p.anexoOrigen === 'comision' ? 'Comisión' : 'Recomendado', p.confianzaAnexo || '', motivoAnexoTexto(p),
      (p.alertas || []).map(a => ALERTAS_PADRON[a]).filter(Boolean).join(' | '),
      ESTADOS_ADMISION_EK[p.estadoAdmision]?.etiqueta || p.estadoAdmision,
      p.decisionComision ? `${p.decisionComision.motivo} (${p.decisionComision.correo || p.decisionComision.nombre || ''})` : '',
      nombresEstudiantes(p) || `${p.numeroEstudiantes || ''} estudiante(s)`, p.docenteAsesor?.nombreCompleto || '', p.fechaRegistro || '', p.urlTrabajo || ''
    ]));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), 'Padrón');
    XLSX.writeFile(wb, 'Padron_Admision_Eureka2026_UGEL03.xlsx');
  };

  const estadoFiltroOpciones = [
    ['revision', `Requieren revisión (${porRevisar})`], ['todos', 'Todos'], ['apto', 'Aptos'], ['observado', 'Observados'],
    ['retirado', 'Retirados'], ['comision', 'Con decisión de la comisión']
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {CATEGORIAS.map(c => {
          const propios = participantes.filter(p => p.categoria === c.id);
          const cuenta = est => propios.filter(p => p.estadoAdmision === est).length;
          return (
            <div key={c.id} style={{ ...S.tarjeta, padding: 14, borderLeft: `4px solid ${C.navy3}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navy2 }}>{c.nombre} · {propios.length} proyectos</div>
              <div style={{ fontSize: 11, color: C.g500, marginBottom: 8 }}>{c.grados}</div>
              <div style={{ display: 'flex', gap: 14, fontFamily: FUENTES.mono }}>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: C.green }}>{cuenta('apto')}</div><div style={{ fontSize: 10, color: C.g500, fontFamily: FUENTES.sans, fontWeight: 700 }}>APTOS</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: C.amber }}>{cuenta('observado')}</div><div style={{ fontSize: 10, color: C.g500, fontFamily: FUENTES.sans, fontWeight: 700 }}>OBSERVADOS</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: C.red }}>{cuenta('retirado')}</div><div style={{ fontSize: 10, color: C.g500, fontFamily: FUENTES.sans, fontWeight: 700 }}>RETIRADOS</div></div>
              </div>
              <div style={{ fontSize: 11, color: C.g700, marginTop: 8 }}>
                {resumenAnexos(propios).map(([k, n]) => `${k}: ${n}`).join(' · ')}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.seccion, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', borderLeft: `5px solid ${conEstudiantes > 0 ? C.green : C.gold}` }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.navy2 }}>Estudiantes y docentes asesores</div>
          <div style={{ fontSize: 12.5, color: C.g700, marginTop: 3, lineHeight: 1.5 }}>
            {conEstudiantes} de {participantes.length} proyectos tienen los nombres de sus estudiantes. Importe el Excel completo de SICE
            (ReporteGanadoresEUREKA) para completarlos en las fichas y actas. No se guardan DNI, teléfonos ni datos de apoderados.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={btn('primario')}>
            <Icon name="upload" size={13} color={C.white} /> Importar Excel de SICE
            <input type="file" accept=".xlsx,.xls" onChange={leerArchivo} style={{ display: 'none' }} />
          </label>
          <button type="button" onClick={exportar} style={btn('secundario')}><Icon name="download" size={13} /> Exportar padrón</button>
        </div>
      </div>

      <div style={{ ...S.seccion, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, alignItems: 'end' }}>
        <div>
          <label style={S.etiqueta}>Categoría</label>
          <select value={categoria} onChange={e => { setCategoria(e.target.value); setAreaId('todas'); setLimite(40); }} style={S.input}>
            <option value="todas">Todas</option>
            {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={S.etiqueta}>Área</label>
          <select value={areaId} onChange={e => { setAreaId(e.target.value); setLimite(40); }} style={S.input}>
            <option value="todas">Todas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={S.etiqueta}>Estado</label>
          <select value={estado} onChange={e => { setEstado(e.target.value); setLimite(40); }} style={S.input}>
            {estadoFiltroOpciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={S.etiqueta}>Anexo vigente</label>
          <select value={anexo} onChange={e => { setAnexo(e.target.value); setLimite(40); }} style={S.input}>
            <option value="todos">Todos</option>
            {['E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: 'span 2', minWidth: 200 }}>
          <label style={S.etiqueta}>Buscar</label>
          <input value={busqueda} onChange={e => { setBusqueda(e.target.value); setLimite(40); }} placeholder="I. E., título, pseudónimo, código o docente" style={S.input} />
        </div>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.navy2 }}>{lista.length} proyecto(s)</div>

      {lista.slice(0, limite).map(p => {
        const est = ESTADOS_ADMISION_EK[p.estadoAdmision] || ESTADOS_ADMISION_EK.apto;
        const fichas = evaluaciones.filter(ev => ev.participanteId === p.id);
        const alertas = (p.alertas || []).filter(a => ALERTAS_PADRON[a]);
        return (
          <div key={p.id} style={{ ...S.tarjeta, padding: 14, borderLeft: `5px solid ${est.texto}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={S.chip(est.fondo, est.texto, est.borde)}>{est.etiqueta.toUpperCase()}</span>
                  <span style={S.chip(C.g100, C.g700, C.g300)}>Categoría {p.categoria}{p.numero ? ` · N.° ${p.numero}` : ''}</span>
                  <span style={S.chip(C.g100, C.g700, C.g300)}>{getArea(p.areaId)?.nombre || p.areaId}</span>
                  <ChipsAnexo participante={p} />
                  {p.noSePresento && <span style={S.chip('#FEF2F2', C.red, '#FECACA')}>No se presentó</span>}
                  {fichas.length > 0 && <span style={S.chip('#EFF6FF', '#1E40AF', '#BFDBFE')}>{fichas.length} ficha(s)</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.navy2 }}>
                  {p.institucion?.nombre} <span style={{ fontWeight: 400, color: C.g500, fontSize: 12 }}>({p.institucion?.codigoModular || 'sin código modular'})</span>
                </div>
                <div style={{ fontSize: 13, color: C.g800, marginTop: 2 }}>{p.tituloProyecto}</div>
                <div style={{ fontSize: 11.5, color: C.g500, marginTop: 4, lineHeight: 1.5 }}>
                  {tieneEstudiantes(p) ? nombresEstudiantes(p) : `${p.numeroEstudiantes || '—'} estudiante(s)`}
                  {p.gradoSeccion ? ` · ${p.gradoSeccion}` : ''} · Registro SICE {fechaHora(p.fechaRegistro)}
                  {p.docenteAsesor?.nombreCompleto ? ` · Docente asesor: ${p.docenteAsesor.nombreCompleto}` : ''}
                </div>
                <div style={{ fontSize: 12, color: C.g700, marginTop: 8, lineHeight: 1.5, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: 6, padding: '7px 10px' }}>
                  {motivoAnexoTexto(p)}
                </div>
                {alertas.map(a => <div key={a} style={{ fontSize: 12, color: C.amber, marginTop: 5, lineHeight: 1.45 }}>{ALERTAS_PADRON[a]}</div>)}
                {p.admisionInicial?.estado === 'observado' && !p.decisionComision && (
                  <div style={{ fontSize: 12, color: C.amber, marginTop: 5 }}>{p.admisionInicial.motivo}</div>
                )}
                {p.decisionComision && (
                  <div style={{ ...aviso('info'), marginTop: 8, fontSize: 12 }}>
                    Decisión de la comisión: <strong>{ESTADOS_ADMISION_EK[p.decisionComision.estado]?.etiqueta}</strong>. {p.decisionComision.motivo}
                    <span style={{ color: C.g500 }}> — {p.decisionComision.nombre || p.decisionComision.correo}, {fechaHora(p.decisionComision.en)}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 190 }}>
                {p.urlTrabajo && (
                  <a href={p.urlTrabajo} target="_blank" rel="noreferrer" style={{ ...btn('secundario'), textDecoration: 'none', color: C.sky }}>
                    <Icon name="externalLink" size={13} color={C.sky} /> Abrir informe
                  </a>
                )}
                <button type="button" onClick={() => setCambioAnexo(p)} style={btn('contorno')}>
                  <Icon name="refresh" size={13} /> Cambiar anexo
                </button>
                <button type="button" onClick={() => setDecision({ proyecto: p, opcion: p.estadoAdmision === 'apto' ? 'observado' : 'apto', motivo: '', fichas: fichas.length })} style={btn('primario')}>
                  <Icon name="shield" size={13} color={C.white} /> Decidir admisión
                </button>
                {onAbrirFicha && p.estadoAdmision !== 'retirado' && (
                  <button type="button" onClick={() => onAbrirFicha(p)} style={btn('gris')}>
                    <Icon name="clipboard" size={13} /> Ver ficha
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {lista.length > limite && (
        <button type="button" onClick={() => setLimite(l => l + 60)} style={{ ...btn('secundario'), alignSelf: 'center' }}>
          Mostrar más proyectos ({lista.length - limite} restantes)
        </button>
      )}

      {cambioAnexo && (
        <ModalCambioAnexo
          participante={participantes.find(x => x.id === cambioAnexo.id) || cambioAnexo}
          evaluacionesProyecto={evaluaciones.filter(ev => ev.participanteId === cambioAnexo.id)}
          usuario={usuario}
          onCerrar={() => setCambioAnexo(null)}
          onToast={onToast}
        />
      )}

      {decision && (
        <div style={MODAL_FONDO} role="dialog" aria-modal="true">
          <div style={MODAL_CAJA}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginBottom: 4 }}>Decisión de admisión</div>
            <div style={{ fontSize: 12.5, color: C.g700, marginBottom: 12 }}>{decision.proyecto.institucion?.nombre} — {decision.proyecto.tituloProyecto}</div>
            {OPCIONES_ADMISION.map(o => (
              <label key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', border: `1px solid ${decision.opcion === o.id ? C.navy3 : C.border}`, borderRadius: 6, marginBottom: 6, cursor: 'pointer', background: decision.opcion === o.id ? '#EFF6FF' : C.white }}>
                <input type="radio" checked={decision.opcion === o.id} onChange={() => setDecision(d => ({ ...d, opcion: o.id }))} style={{ marginTop: 3, accentColor: C.navy3 }} />
                <span><strong style={{ fontSize: 13, color: C.navy2 }}>{o.etiqueta}</strong><div style={{ fontSize: 11.5, color: C.g500 }}>{o.detalle}</div></span>
              </label>
            ))}
            {decision.opcion === 'retirado' && decision.fichas > 0 && (
              <div style={{ ...aviso('alerta'), fontSize: 12, marginBottom: 6 }}>Este proyecto tiene {decision.fichas} ficha(s); dejarán de contar en los consolidados y actas.</div>
            )}
            {decision.opcion !== 'inicial' && (
              <>
                <label style={S.etiqueta}>Motivo (mínimo 10 caracteres)</label>
                <textarea value={decision.motivo} onChange={e => setDecision(d => ({ ...d, motivo: e.target.value }))} style={S.textarea} placeholder="Ejemplo: acuerdo de la comisión del 11/09/2026 sobre la inscripción fuera de plazo." />
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setDecision(null)} style={btn('secundario')}>Cancelar</button>
              <button
                type="button"
                onClick={guardarDecision}
                disabled={trabajando || (decision.opcion !== 'inicial' && decision.motivo.trim().length < 10)}
                style={trabajando || (decision.opcion !== 'inicial' && decision.motivo.trim().length < 10) ? btnDeshabilitado(btn('primario')) : btn('primario')}
              >
                Registrar decisión
              </button>
            </div>
          </div>
        </div>
      )}

      {previa && (
        <div style={MODAL_FONDO} role="dialog" aria-modal="true">
          <div style={{ ...MODAL_CAJA, maxWidth: 580 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy2, marginBottom: 6 }}>Importar datos de SICE</div>
            <div style={{ fontSize: 12.5, color: C.g700, marginBottom: 10 }}>{previa.nombreArchivo}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <tbody>
                {[
                  ['Filas de estudiantes leídas', previa.totalFilas],
                  ['Proyectos en el archivo', previa.proyectos.length],
                  ['Coinciden con el padrón precargado', previa.coinciden],
                  ['Proyectos nuevos (no están en el padrón)', previa.nuevos.length],
                  ['Estudiantes distintos', previa.estudiantes],
                  ['Inscripciones después del cierre', previa.fueraPlazo.length]
                ].map(([k, v]) => (
                  <tr key={k}><td style={S.td}>{k}</td><td style={{ ...S.td, fontWeight: 800, textAlign: 'right', fontFamily: FUENTES.mono }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
            {previa.fueraPlazo.length > 0 && (
              <div style={{ ...aviso('alerta'), fontSize: 12 }}>
                Fuera de plazo: {previa.fueraPlazo.map(p => `${p.tituloProyecto} (${fechaHora(p.fechaRegistro)})`).join('; ')}.
              </div>
            )}
            {previa.nuevos.length > 0 && (
              <div style={{ ...aviso('info'), fontSize: 12, marginTop: 6 }}>
                Los proyectos nuevos entran con un anexo sugerido por el sistema y confianza baja; revíselos después de importar.
              </div>
            )}
            {previa.errores.length > 0 && <div style={{ ...aviso('alerta'), fontSize: 12, marginTop: 6 }}>{previa.errores.slice(0, 5).map((m, i) => <div key={i}>{m}</div>)}</div>}
            <div style={{ fontSize: 11.5, color: C.g500, marginTop: 8 }}>Se guardan nombres, grado y sección de los estudiantes, y el nombre y la especialidad del docente asesor, en Firestore con acceso restringido.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setPrevia(null)} style={btn('secundario')}>Cancelar</button>
              <button type="button" onClick={importar} disabled={trabajando || previa.proyectos.length === 0} style={trabajando ? btnDeshabilitado(btn('primario')) : btn('primario')}>
                <Icon name="upload" size={13} color={C.white} /> {trabajando ? 'Importando...' : `Importar ${previa.proyectos.length} proyectos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
