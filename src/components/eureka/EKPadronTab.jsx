import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Icon from '../Icon';
import { C, CE, S, btn, btnDeshabilitado, aviso } from './ekEstilos';
import {
  EUREKA_CONFIG, getAreasDeCategoria, getLineasDeArea, getArea, getCategoria, CATEGORIAS
} from '../../data/eurekaConfigUGEL03';
import {
  JURADOS_EVALUADORES_EUREKA, getJuradosPendientesValidacion
} from '../../data/eurekaJuradosEvaluadores';
import { resolverAnexo, resolverAnexoPorDefecto, normalizarDNI, nombresEstudiantes } from '../../utils/eurekaHelpers';
import { parsearReporteSICE, resumenImportacion } from '../../utils/eurekaSICE';
import {
  addEKParticipante, updateEKParticipante, deleteEKParticipante,
  batchImportarParticipantes, batchAsignarLinea, sembrarJuradosEureka, upsertEKJurado
} from '../../firebase/dbEureka';

const FORM_VACIO = {
  codigoParticipante: '',
  categoria: 'A',
  areaId: '',
  lineaId: '',
  tituloProyecto: '',
  urlTrabajo: '',
  urlCuadernoCampo: '',
  institucionNombre: '',
  codigoModular: '',
  tipoGestion: 'Pública',
  distrito: '',
  lenguaOriginaria: false,
  urlTraduccion: '',
  participanteConDiscapacidad: false,
  ajustesRazonables: '',
  estudiantes: [
    { nombres: '', apellidoPaterno: '', apellidoMaterno: '', numeroDocumento: '', grado: '', seccion: '' },
    { nombres: '', apellidoPaterno: '', apellidoMaterno: '', numeroDocumento: '', grado: '', seccion: '' }
  ],
  docenteNombres: '',
  docenteApellidoPaterno: '',
  docenteApellidoMaterno: '',
  docenteDni: '',
  docenteEspecialidad: '',
  docenteTelefono: '',
  docenteCorreo: ''
};

/**
 * Pestaña Padrón: alta manual, importación del reporte SICE, resolución de las líneas
 * de participación que el reporte no trae y validación del padrón de jurados.
 *
 * La vista de líneas existe por una carencia del reporte, no por gusto: "RptJurados"
 * entrega categoría y área pero no la línea, y en primaria la línea decide si el
 * proyecto se evalúa con el anexo E11 o el E12. Deducirla del título sería rápido y
 * pondría la rúbrica equivocada delante de un jurado, así que la elige una persona.
 */
export default function EKPadronTab({
  categoria, areaId, participantes = [], usuario, esStaff = false, onToast, onSeleccionar
}) {
  const [vista, setVista] = useState('listado');
  const [form, setForm] = useState({ ...FORM_VACIO, categoria, areaId });
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [importacion, setImportacion] = useState(null);
  const [cargandoImport, setCargandoImport] = useState(false);
  const [soloNuevos, setSoloNuevos] = useState(true);
  const [juradosLocales, setJuradosLocales] = useState(JURADOS_EVALUADORES_EUREKA);
  const [lineasElegidas, setLineasElegidas] = useState({});
  const [guardandoLineas, setGuardandoLineas] = useState(false);

  const areasDisponibles = useMemo(() => getAreasDeCategoria(form.categoria), [form.categoria]);
  const lineasDisponibles = useMemo(() => getLineasDeArea(form.areaId), [form.areaId]);

  const anexoResuelto = useMemo(() => {
    try {
      return resolverAnexo({ categoria: form.categoria, areaId: form.areaId, lineaId: form.lineaId });
    } catch (e) {
      return null;
    }
  }, [form.categoria, form.areaId, form.lineaId]);

  const pendientesValidacion = useMemo(
    () => juradosLocales.filter(j => j.requiereValidacionNombre || j.tildesInferidas),
    [juradosLocales]
  );

  /* ───── Alta y edición ───── */

  const abrirAlta = () => {
    const areas = getAreasDeCategoria(categoria);
    const area = areas.find(a => a.id === areaId) || areas[0];
    setForm({
      ...FORM_VACIO,
      categoria,
      areaId: area ? area.id : '',
      lineaId: area && area.lineas.length === 1 ? area.lineas[0].id : ''
    });
    setEditandoId(null);
    setVista('formulario');
  };

  const abrirEdicion = (p) => {
    setForm({
      codigoParticipante: p.codigoParticipante || '',
      categoria: p.categoria,
      areaId: p.areaId,
      lineaId: p.lineaId,
      tituloProyecto: p.tituloProyecto || '',
      urlTrabajo: p.urlTrabajo || '',
      urlCuadernoCampo: p.urlCuadernoCampo || '',
      institucionNombre: p.institucion?.nombre || p.institucionNombre || '',
      codigoModular: p.institucion?.codigoModular || '',
      tipoGestion: p.institucion?.tipoGestion || 'Pública',
      distrito: p.institucion?.distrito || '',
      lenguaOriginaria: Boolean(p.lenguaOriginaria),
      urlTraduccion: p.urlTraduccion || '',
      participanteConDiscapacidad: Boolean(p.participanteConDiscapacidad),
      ajustesRazonables: p.ajustesRazonables || '',
      estudiantes: [0, 1].map(i => ({
        nombres: p.estudiantes?.[i]?.nombres || '',
        apellidoPaterno: p.estudiantes?.[i]?.apellidoPaterno || '',
        apellidoMaterno: p.estudiantes?.[i]?.apellidoMaterno || '',
        numeroDocumento: p.estudiantes?.[i]?.numeroDocumento || '',
        grado: p.estudiantes?.[i]?.grado || '',
        seccion: p.estudiantes?.[i]?.seccion || ''
      })),
      docenteNombres: p.docenteAsesor?.nombres || '',
      docenteApellidoPaterno: p.docenteAsesor?.apellidoPaterno || '',
      docenteApellidoMaterno: p.docenteAsesor?.apellidoMaterno || '',
      docenteDni: p.docenteAsesor?.numeroDocumento || '',
      docenteEspecialidad: p.docenteAsesor?.especialidad || '',
      docenteTelefono: p.docenteAsesor?.telefono || '',
      docenteCorreo: p.docenteAsesor?.correo || ''
    });
    setEditandoId(p.id);
    setVista('formulario');
  };

  const guardarParticipante = async () => {
    if (!form.institucionNombre.trim()) {
      if (onToast) onToast('Indique el nombre de la institución educativa.', 'error');
      return;
    }
    if (!form.lineaId) {
      if (onToast) onToast('Seleccione la línea de participación: de ella depende el anexo de evaluación.', 'error');
      return;
    }
    if (!anexoResuelto) {
      if (onToast) onToast('La combinación de categoría, área y línea no es válida según las bases.', 'error');
      return;
    }

    const estudiantes = form.estudiantes
      .filter(e => e.nombres.trim() || e.apellidoPaterno.trim() || e.numeroDocumento.trim())
      .map(e => ({
        nombres: e.nombres.trim(),
        apellidoPaterno: e.apellidoPaterno.trim(),
        apellidoMaterno: e.apellidoMaterno.trim(),
        tipoDocumento: 'DNI',
        numeroDocumento: normalizarDNI(e.numeroDocumento),
        nivel: getCategoria(form.categoria)?.nivel || '',
        grado: e.grado.trim(),
        seccion: e.seccion.trim()
      }));

    const docenteNombreCompleto = [form.docenteApellidoPaterno, form.docenteApellidoMaterno, form.docenteNombres]
      .filter(Boolean).map(s => s.trim()).join(' ');

    const payload = {
      codigoParticipante: form.codigoParticipante.trim() || `EK26-${form.categoria}-${Date.now()}`,
      categoria: form.categoria,
      areaId: form.areaId,
      lineaId: form.lineaId,
      anexoEvaluacion: anexoResuelto,
      tituloProyecto: form.tituloProyecto.trim(),
      urlTrabajo: form.urlTrabajo.trim(),
      urlCuadernoCampo: form.urlCuadernoCampo.trim(),
      institucionNombre: form.institucionNombre.trim(),
      institucion: {
        nombre: form.institucionNombre.trim(),
        codigoModular: form.codigoModular.trim(),
        tipoGestion: form.tipoGestion,
        ugel: EUREKA_CONFIG.ugel,
        dre: EUREKA_CONFIG.dre,
        region: EUREKA_CONFIG.region,
        provincia: EUREKA_CONFIG.provincia,
        distrito: form.distrito.trim()
      },
      estudiantes,
      docenteAsesor: {
        nombres: form.docenteNombres.trim(),
        apellidoPaterno: form.docenteApellidoPaterno.trim(),
        apellidoMaterno: form.docenteApellidoMaterno.trim(),
        nombreCompleto: docenteNombreCompleto,
        tipoDocumento: 'DNI',
        numeroDocumento: normalizarDNI(form.docenteDni),
        especialidad: form.docenteEspecialidad.trim(),
        telefono: form.docenteTelefono.trim(),
        correo: form.docenteCorreo.replace(/\s+/g, '').trim().toLowerCase()
      },
      lenguaOriginaria: form.lenguaOriginaria,
      urlTraduccion: form.urlTraduccion.trim(),
      participanteConDiscapacidad: form.participanteConDiscapacidad,
      ajustesRazonables: form.ajustesRazonables.trim(),
      origen: 'manual'
    };

    try {
      setGuardando(true);
      if (editandoId) {
        await updateEKParticipante(editandoId, payload);
        if (onToast) onToast('Participante actualizado.', 'exito');
      } else {
        await addEKParticipante(payload);
        if (onToast) onToast(`Participante registrado con el Anexo ${anexoResuelto}.`, 'exito');
      }
      setVista('listado');
      setEditandoId(null);
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar el proyecto de "${p.institucion?.nombre || p.institucionNombre}"? Se perderá su registro del padrón.`)) return;
    try {
      await deleteEKParticipante(p.id);
      if (onToast) onToast('Participante eliminado del padrón.', 'info');
    } catch (err) {
      if (onToast) onToast(`No se pudo eliminar: ${err.message}`, 'error');
    }
  };

  const alternarNoPresentado = async (p) => {
    try {
      await updateEKParticipante(p.id, { noSePresento: !p.noSePresento });
      if (onToast) {
        onToast(
          p.noSePresento
            ? 'Se revirtió la marca de no presentado.'
            : 'Participante marcado como NO SE PRESENTÓ: queda excluido del podio.',
          'alerta'
        );
      }
    } catch (err) {
      if (onToast) onToast(`No se pudo actualizar: ${err.message}`, 'error');
    }
  };

  /* ───── Importación SICE ───── */

  const leerArchivoSICE = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCargandoImport(true);
      const data = await file.arrayBuffer();
      const libro = XLSX.read(data, { type: 'array' });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false });
      const resultado = parsearReporteSICE(aoa);

      if (resultado.error) {
        if (onToast) onToast(resultado.error, 'error');
        setImportacion(null);
        return;
      }

      const existentes = new Set(participantes.map(p => p.codigoParticipante));
      setImportacion({ ...resultado, resumen: resumenImportacion(resultado, existentes) });
      setVista('importacion');
    } catch (err) {
      if (onToast) onToast(`No se pudo leer el archivo: ${err.message}`, 'error');
    } finally {
      setCargandoImport(false);
      e.target.value = null;
    }
  };

  const confirmarImportacion = async () => {
    if (!importacion?.participantes?.length) return;
    try {
      setCargandoImport(true);
      const res = await batchImportarParticipantes(importacion.participantes, { soloNuevos, usuario });
      if (onToast) {
        onToast(
          `Importación completada. ${res.importados} registro(s) procesado(s), ${res.omitidos} omitido(s) por duplicado, ${res.rechazados.length} rechazado(s).`,
          'exito'
        );
      }
      setImportacion(null);
      setVista('listado');
    } catch (err) {
      if (onToast) onToast(`Error en la importación: ${err.message}`, 'error');
    } finally {
      setCargandoImport(false);
    }
  };

  /* ───── Líneas de participación pendientes ───── */

  // Un proyecto sin anexo no se puede evaluar: es lo que hay que resolver primero.
  const pendientesDeLinea = useMemo(
    () => participantes.filter(p => !p.anexoEvaluacion),
    [participantes]
  );

  // Agrupados por categoría y área porque dentro de cada grupo las opciones de línea
  // son las mismas y se pueden aplicar en bloque.
  const gruposPendientes = useMemo(() => {
    const mapa = new Map();
    pendientesDeLinea.forEach(p => {
      const clave = `${p.categoria}|${p.areaId}`;
      if (!mapa.has(clave)) {
        mapa.set(clave, { categoria: p.categoria, areaId: p.areaId, proyectos: [] });
      }
      mapa.get(clave).proyectos.push(p);
    });
    return [...mapa.values()].sort(
      (a, b) => a.categoria.localeCompare(b.categoria) || a.areaId.localeCompare(b.areaId)
    );
  }, [pendientesDeLinea]);

  const totalElegidas = useMemo(
    () => Object.values(lineasElegidas).filter(Boolean).length,
    [lineasElegidas]
  );

  const elegirLinea = (id, lineaId) => setLineasElegidas(prev => ({ ...prev, [id]: lineaId }));

  const aplicarATodoElGrupo = (grupo, lineaId) => {
    setLineasElegidas(prev => {
      const siguiente = { ...prev };
      grupo.proyectos.forEach(p => { siguiente[p.id] = lineaId; });
      return siguiente;
    });
  };

  const guardarLineas = async () => {
    const asignaciones = pendientesDeLinea
      .filter(p => lineasElegidas[p.id])
      .map(p => ({ id: p.id, categoria: p.categoria, areaId: p.areaId, lineaId: lineasElegidas[p.id] }));

    if (!asignaciones.length) {
      if (onToast) onToast('No hay ninguna línea elegida todavía.', 'alerta');
      return;
    }

    try {
      setGuardandoLineas(true);
      const res = await batchAsignarLinea(asignaciones, usuario);
      setLineasElegidas({});
      if (onToast) {
        const resto = pendientesDeLinea.length - res.actualizados;
        onToast(
          `${res.actualizados} proyecto(s) con línea y anexo asignados.` +
          (resto > 0 ? ` Quedan ${resto} por definir.` : ' No queda ninguno pendiente.') +
          (res.rechazados.length ? ` ${res.rechazados.length} rechazado(s).` : ''),
          'exito'
        );
      }
      if (res.actualizados === pendientesDeLinea.length) setVista('listado');
    } catch (err) {
      if (onToast) onToast(`No se pudieron asignar las líneas: ${err.message}`, 'error');
    } finally {
      setGuardandoLineas(false);
    }
  };

  /* ───── Padrón de jurados ───── */

  const sembrarJurados = async () => {
    try {
      const n = await sembrarJuradosEureka(juradosLocales, usuario);
      if (onToast) onToast(`${n} jurados evaluadores sembrados en Firestore.`, 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo sembrar el padrón: ${err.message}`, 'error');
    }
  };

  const validarNombreJurado = async (dni, cambios) => {
    const actualizado = juradosLocales.map(j => (j.dni === dni ? { ...j, ...cambios } : j));
    setJuradosLocales(actualizado);
    try {
      const j = actualizado.find(x => x.dni === dni);
      await upsertEKJurado({ ...j, validadoPor: usuario?.correo || usuario?.email || '', validadoEn: new Date().toISOString() });
      if (onToast) onToast('Desglose de nombre validado y guardado.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar la validación: ${err.message}`, 'error');
    }
  };

  /* ───── Render ───── */

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'listado', label: 'Participantes', icon: 'users' },
          { id: 'jurados', label: 'Padrón de jurados', icon: 'shield' }
        ].map(v => {
          const activo = vista === v.id
            || (v.id === 'listado' && ['formulario', 'importacion', 'lineas'].includes(vista));
          return (
            <button key={v.id} type="button" onClick={() => setVista(v.id)}
              style={btn(activo ? 'primario' : 'secundario', { padding: '7px 14px', fontSize: 12 })}>
              <Icon name={v.icon} size={13} /> {v.label}
            </button>
          );
        })}
      </div>

      {vista === 'listado' && (
        <>
          {participantes.length === 0 && (
            <div style={{
              background: '#F0FDF4',
              border: `2px solid ${CE.verdeEureka}`,
              borderRadius: 10,
              padding: '22px 24px',
              marginBottom: 20,
              boxShadow: '0 4px 14px rgba(110, 158, 35, 0.12)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: CE.verdeOscuro, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="download" size={20} color={CE.verdeOscuro} />
                    <span>Reporte Oficial SICE 2026 Disponible (455 Proyectos)</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.gris700, marginTop: 4, maxWidth: 720, lineHeight: 1.5 }}>
                    Cargue el archivo Excel <strong>RptJurados_09092026105057.xls</strong> para importar automáticamente todos los proyectos de la UGEL 03 con sus títulos, instituciones educativas, enlaces a carpetas de Google Drive y pseudónimos.
                  </div>
                </div>

                {esStaff && (
                  <label style={{
                    ...btn('primario', { minHeight: 46, padding: '12px 24px', fontSize: 14.5, background: CE.verdeEureka }),
                    cursor: cargandoImport ? 'wait' : 'pointer'
                  }}>
                    <Icon name="upload" size={17} color={C.blanco} />
                    {cargandoImport ? 'Leyendo archivo...' : 'Seleccionar Archivo SICE (Excel)'}
                    <input type="file" accept=".xls,.xlsx,.csv" style={{ display: 'none' }} onChange={leerArchivoSICE} disabled={cargandoImport} />
                  </label>
                )}
              </div>
            </div>
          )}

          {pendientesDeLinea.length > 0 && (
            <div style={{
              background: '#FFFBEB',
              border: '2px solid #FCD34D',
              borderRadius: 10,
              padding: '18px 22px',
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="alert" size={18} color="#92400E" />
                    <span>{pendientesDeLinea.length} proyecto(s) de Primaria requieren asignación de línea / anexo</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.gris700, marginTop: 4, maxWidth: 740, lineHeight: 1.5 }}>
                    En las categorías de Primaria (A, B y C), la línea de participación define el anexo oficial con el que evaluará el jurado (ej. <strong>E11 Indagación Científica</strong> vs <strong>E12 Solución Tecnológica</strong>).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVista('lineas')}
                  style={btn('dorado', { minHeight: 44, padding: '10px 20px', fontSize: 14 })}
                >
                  <Icon name="edit" size={15} color={C.blanco} />
                  Asignar Líneas de Participación →
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {esStaff && (
              <button type="button" onClick={abrirAlta} style={btn('primario', { minHeight: 44, padding: '10px 18px', fontSize: 13.5 })}>
                <Icon name="plus" size={15} /> Registrar nuevo proyecto
              </button>
            )}
            {esStaff && (
              <label style={{ ...btn('secundario', { minHeight: 44, padding: '10px 18px', fontSize: 13.5 }), cursor: cargandoImport ? 'wait' : 'pointer' }}>
                <Icon name="upload" size={15} /> Importar otro reporte SICE
                <input type="file" accept=".xls,.xlsx,.csv" style={{ display: 'none' }} onChange={leerArchivoSICE} disabled={cargandoImport} />
              </label>
            )}
            <div style={{ marginLeft: 'auto', fontSize: 13, color: C.gris700, fontWeight: 600 }}>
              Total: <strong>{participantes.length}</strong> proyectos en {getCategoria(categoria)?.nombre} — {getArea(areaId)?.nombre}
            </div>
          </div>

          <div style={{ ...S.seccion, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: 50, textAlign: 'center' }}>N.°</th>
                    <th style={{ ...S.th, width: 120 }}>Código</th>
                    <th style={S.th}>Institución Educativa</th>
                    <th style={S.th}>Título del proyecto</th>
                    <th style={{ ...S.th, width: 140 }}>Línea</th>
                    <th style={{ ...S.th, width: 80, textAlign: 'center' }}>Anexo</th>
                    <th style={S.th}>Pseudónimo / Enlace</th>
                    <th style={{ ...S.th, width: 150, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {participantes.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ ...S.td, textAlign: 'center', color: C.gris500, padding: 32, fontSize: 14 }}>
                        No hay proyectos inscritos en esta categoría y área.
                      </td>
                    </tr>
                  )}
                  {participantes.map((p, i) => (
                    <tr key={p.id} style={{ background: p.noSePresento ? '#FEF2F2' : C.blanco }}>
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, fontSize: 13 }}>
                        {p.ordenPresentacion || i + 1}
                      </td>
                      <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace', color: C.gris700 }}>
                        {p.codigoParticipante}
                      </td>
                      <td style={{ ...S.td, fontSize: 13.5, fontWeight: 700, color: C.navy2 }}>
                        {p.institucion?.nombre || p.institucionNombre}
                        {p.lenguaOriginaria && <span style={{ ...S.chip('#EFF6FF', '#1E40AF', '#BFDBFE'), marginLeft: 6 }}>Lengua originaria</span>}
                        {p.participanteConDiscapacidad && <span style={{ ...S.chip('#F5F3FF', '#6D28D9', '#DDD6FE'), marginLeft: 6 }}>Ajustes razonables</span>}
                      </td>
                      <td style={{ ...S.td, fontSize: 13, color: '#334155' }}>
                        {p.tituloProyecto || '—'}
                      </td>
                      <td style={{ ...S.td, fontSize: 12, color: C.gris700 }}>
                        {p.lineaId || 'General'}
                      </td>
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, fontSize: 13 }}>
                        <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: 4, border: '1px solid #86EFAC' }}>
                          {p.anexoEvaluacion || resolverAnexoPorDefecto(categoria, areaId)}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 12 }}>
                        {p.pseudonimo && (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 4, fontWeight: 700, display: 'inline-block', marginBottom: 4 }}>
                            {p.pseudonimo}
                          </span>
                        )}
                        {p.urlTrabajo && (
                          <div>
                            <a href={p.urlTrabajo} target="_blank" rel="noreferrer" style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="externalLink" size={12} color="#0284C7" /> Ver en Drive ↗
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {onSeleccionar && (
                            <button
                              type="button"
                              onClick={() => onSeleccionar(p)}
                              style={btn('primario', { padding: '6px 12px', fontSize: 12, minHeight: 34 })}
                              title="Evaluar este proyecto con la rúbrica oficial"
                            >
                              <Icon name="clipboard" size={13} color={C.blanco} /> Evaluar
                            </button>
                          )}
                          {esStaff && (
                            <button
                              type="button"
                              onClick={() => abrirEdicion(p)}
                              style={btn('secundario', { padding: '6px 10px', fontSize: 12, minHeight: 34 })}
                              title="Editar datos"
                            >
                              <Icon name="settings" size={13} color={C.navy2} />
                            </button>
                          )}
                          {esStaff && (
                            <button
                              type="button"
                              onClick={() => alternarNoPresentado(p)}
                              style={{
                                background: p.noSePresento ? '#DCFCE7' : '#FEF2F2',
                                color: p.noSePresento ? '#166534' : C.error,
                                border: `1px solid ${p.noSePresento ? '#86EFAC' : '#FECACA'}`,
                                padding: '6px 10px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                                minHeight: 34
                              }}
                              title={p.noSePresento ? 'Revertir marca de incomparecencia' : 'Marcar incomparecencia / no se presentó'}
                            >
                              <Icon name="alert" size={13} color={p.noSePresento ? '#166534' : C.error} />
                            </button>
                          )}
                          {esStaff && (
                            <button
                              type="button"
                              onClick={() => eliminar(p)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: C.error,
                                padding: '6px 8px',
                                cursor: 'pointer'
                              }}
                              title="Eliminar proyecto"
                            >
                              <Icon name="trash" size={14} color={C.error} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {vista === 'formulario' && (
        <div style={{ ...S.seccion }}>
          <div style={S.tituloSeccion}>{editandoId ? 'Editar proyecto' : 'Registrar proyecto'}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            <Campo etiqueta="Código SICE" valor={form.codigoParticipante} onChange={v => setForm({ ...form, codigoParticipante: v })} />

            <div>
              <label style={S.etiqueta}>Categoría</label>
              <select value={form.categoria} style={S.input}
                onChange={e => {
                  const nueva = e.target.value;
                  const areas = getAreasDeCategoria(nueva);
                  setForm({ ...form, categoria: nueva, areaId: areas[0]?.id || '', lineaId: '' });
                }}>
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.grados}</option>)}
              </select>
            </div>

            <div>
              <label style={S.etiqueta}>Área de participación</label>
              <select value={form.areaId} style={S.input}
                onChange={e => {
                  const nueva = e.target.value;
                  const lineas = getLineasDeArea(nueva);
                  setForm({ ...form, areaId: nueva, lineaId: lineas.length === 1 ? lineas[0].id : '' });
                }}>
                <option value="">Seleccione</option>
                {areasDisponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>

            <div>
              <label style={S.etiqueta}>Línea de participación</label>
              <select value={form.lineaId} onChange={e => setForm({ ...form, lineaId: e.target.value })} style={S.input}>
                <option value="">Seleccione</option>
                {lineasDisponibles.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{ ...aviso(anexoResuelto ? 'eureka' : 'alerta'), marginTop: 12 }}>
            {anexoResuelto
              ? <>Anexo de evaluación resuelto: <strong>{anexoResuelto}</strong>. Se persiste con el participante y determina la rúbrica de sus tres fichas.</>
              : 'Seleccione área y línea para resolver el anexo de evaluación aplicable.'}
          </div>

          <div style={{ marginTop: 14 }}>
            <Campo etiqueta="Título del proyecto" valor={form.tituloProyecto} onChange={v => setForm({ ...form, tituloProyecto: v })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            <Campo etiqueta="Enlace al informe" valor={form.urlTrabajo} onChange={v => setForm({ ...form, urlTrabajo: v })} />
            <Campo etiqueta="Enlace al cuaderno de campo" valor={form.urlCuadernoCampo} onChange={v => setForm({ ...form, urlCuadernoCampo: v })} />
          </div>

          <div style={{ ...S.tituloSeccion, marginTop: 20 }}>Institución educativa</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            <Campo etiqueta="Nombre de la I. E." valor={form.institucionNombre} onChange={v => setForm({ ...form, institucionNombre: v })} />
            <Campo etiqueta="Código modular" valor={form.codigoModular} onChange={v => setForm({ ...form, codigoModular: v })} />
            <div>
              <label style={S.etiqueta}>Tipo de gestión</label>
              <select value={form.tipoGestion} onChange={e => setForm({ ...form, tipoGestion: e.target.value })} style={S.input}>
                <option value="Pública">Pública</option>
                <option value="Privada">Privada</option>
              </select>
            </div>
            <Campo etiqueta="Distrito" valor={form.distrito} onChange={v => setForm({ ...form, distrito: v })} />
          </div>

          <div style={{ ...S.tituloSeccion, marginTop: 20 }}>Estudiantes (máximo 2 según las bases)</div>
          {form.estudiantes.map((est, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
              <Campo etiqueta={`Apellido paterno ${i + 1}`} valor={est.apellidoPaterno}
                onChange={v => actualizarEstudiante(form, setForm, i, { apellidoPaterno: v })} />
              <Campo etiqueta={`Apellido materno ${i + 1}`} valor={est.apellidoMaterno}
                onChange={v => actualizarEstudiante(form, setForm, i, { apellidoMaterno: v })} />
              <Campo etiqueta={`Nombres ${i + 1}`} valor={est.nombres}
                onChange={v => actualizarEstudiante(form, setForm, i, { nombres: v })} />
              <Campo etiqueta="DNI" valor={est.numeroDocumento}
                onChange={v => actualizarEstudiante(form, setForm, i, { numeroDocumento: v.replace(/\D/g, '').slice(0, 8) })} />
              <Campo etiqueta="Grado" valor={est.grado} onChange={v => actualizarEstudiante(form, setForm, i, { grado: v })} />
              <Campo etiqueta="Sección" valor={est.seccion} onChange={v => actualizarEstudiante(form, setForm, i, { seccion: v })} />
            </div>
          ))}

          <div style={{ ...S.tituloSeccion, marginTop: 20 }}>Docente asesor</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <Campo etiqueta="Apellido paterno" valor={form.docenteApellidoPaterno} onChange={v => setForm({ ...form, docenteApellidoPaterno: v })} />
            <Campo etiqueta="Apellido materno" valor={form.docenteApellidoMaterno} onChange={v => setForm({ ...form, docenteApellidoMaterno: v })} />
            <Campo etiqueta="Nombres" valor={form.docenteNombres} onChange={v => setForm({ ...form, docenteNombres: v })} />
            <Campo etiqueta="DNI" valor={form.docenteDni} onChange={v => setForm({ ...form, docenteDni: v.replace(/\D/g, '').slice(0, 8) })} />
            <Campo etiqueta="Especialidad" valor={form.docenteEspecialidad} onChange={v => setForm({ ...form, docenteEspecialidad: v })} />
            <Campo etiqueta="Teléfono" valor={form.docenteTelefono} onChange={v => setForm({ ...form, docenteTelefono: v })} />
            <Campo etiqueta="Correo" valor={form.docenteCorreo} onChange={v => setForm({ ...form, docenteCorreo: v })} />
          </div>

          <div style={{ ...S.tituloSeccion, marginTop: 20 }}>Condiciones especiales</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.gris700, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.lenguaOriginaria}
              onChange={e => setForm({ ...form, lenguaOriginaria: e.target.checked })}
              style={{ accentColor: CE.verdeEureka }} />
            El proyecto se presenta en lengua originaria
          </label>
          {form.lenguaOriginaria && (
            <Campo etiqueta="Enlace a la versión traducida al castellano (Anexo E10)" valor={form.urlTraduccion}
              onChange={v => setForm({ ...form, urlTraduccion: v })} />
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.gris700, margin: '10px 0 8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.participanteConDiscapacidad}
              onChange={e => setForm({ ...form, participanteConDiscapacidad: e.target.checked })}
              style={{ accentColor: CE.verdeEureka }} />
            Participa un estudiante con discapacidad (numeral 13 de las bases)
          </label>
          {form.participanteConDiscapacidad && (
            <div>
              <label style={S.etiqueta}>Ajustes razonables aplicados</label>
              <textarea value={form.ajustesRazonables} onChange={e => setForm({ ...form, ajustesRazonables: e.target.value })}
                style={{ ...S.textarea, minHeight: 56 }}
                placeholder="Flexibilidad y adaptación de criterios coordinada con la comisión organizadora y el jurado calificador." />
            </div>
          )}

          <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
            <button type="button" onClick={() => { setVista('listado'); setEditandoId(null); }} style={btn('secundario')}>
              Cancelar
            </button>
            <button type="button" onClick={guardarParticipante} disabled={guardando || !anexoResuelto}
              style={(guardando || !anexoResuelto) ? btnDeshabilitado(btn('primario')) : btn('primario')}>
              <Icon name="save" size={13} /> {editandoId ? 'Guardar cambios' : 'Registrar proyecto'}
            </button>
          </div>
        </div>
      )}

      {vista === 'importacion' && importacion && (
        <div style={{ ...S.seccion }}>
          <div style={S.tituloSeccion}>Vista previa de la importación SICE</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 14 }}>
            <Metrica etiqueta="Filas leídas" valor={importacion.resumen.total} />
            <Metrica etiqueta="Altas" valor={importacion.resumen.altas} color={CE.verdeOscuro} />
            <Metrica etiqueta="Actualizaciones" valor={importacion.resumen.actualizaciones} color={C.azul} />
            <Metrica etiqueta="Rechazadas" valor={importacion.resumen.rechazadas} color={C.error} />
            {/* Estos entran, pero les falta una decisión. No son rechazos. */}
            <Metrica etiqueta="Sin anexo" valor={importacion.resumen.sinAnexo} color={C.error} />
            <Metrica etiqueta="Sin variante" valor={importacion.resumen.sinVariante} color={C.gris700} />
          </div>

          {importacion.avisos.length > 0 && (
            <div style={{ ...aviso('alerta'), marginBottom: 12 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {importacion.avisos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {importacion.rechazados.length > 0 && (
            <div style={{ ...aviso('error'), marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 5 }}>Filas rechazadas con el motivo exacto:</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {importacion.rechazados.map((r, i) => <li key={i}>Fila {r.fila}: {r.motivo}</li>)}
              </ul>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.gris700, marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={soloNuevos} onChange={e => setSoloNuevos(e.target.checked)} style={{ accentColor: CE.verdeEureka }} />
            Importar solo los registros nuevos (omitir los códigos ya existentes)
          </label>

          <div style={{ maxHeight: 320, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 5 }}>
            <table style={S.tabla}>
              <thead>
                <tr>
                  <th style={S.th}>Código</th>
                  <th style={{ ...S.th, width: 50, textAlign: 'center' }}>Cat.</th>
                  <th style={S.th}>Área</th>
                  <th style={{ ...S.th, width: 60, textAlign: 'center' }}>Anexo</th>
                  <th style={S.th}>I. E.</th>
                  <th style={S.th}>Proyecto</th>
                  <th style={{ ...S.th, width: 70, textAlign: 'center' }}>Estud.</th>
                </tr>
              </thead>
              <tbody>
                {importacion.participantes.map(p => (
                  <tr key={p.codigoParticipante}>
                    <td style={{ ...S.td, fontSize: 11 }}>{p.codigoParticipante}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{p.categoria}</td>
                    <td style={{ ...S.td, fontSize: 11 }}>{getArea(p.areaId)?.nombre}</td>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: CE.verdeOscuro }}>{p.anexoEvaluacion}</td>
                    <td style={{ ...S.td, fontSize: 11 }}>{p.institucionNombre}</td>
                    <td style={{ ...S.td, fontSize: 11 }}>{p.tituloProyecto}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{p.estudiantes.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
            <button type="button" onClick={() => { setImportacion(null); setVista('listado'); }} style={btn('secundario')}>
              Cancelar
            </button>
            <button type="button" onClick={confirmarImportacion} disabled={cargandoImport || importacion.participantes.length === 0}
              style={(cargandoImport || importacion.participantes.length === 0) ? btnDeshabilitado(btn('primario')) : btn('primario')}>
              <Icon name="upload" size={13} /> Confirmar importación
            </button>
          </div>
        </div>
      )}

      {vista === 'lineas' && (
        <div style={{ ...S.seccion }}>
          <div style={S.tituloSeccion}>Definir la línea de participación</div>

          <div style={{ ...aviso('info'), marginBottom: 14 }}>
            El reporte SICE trae el área pero no la línea. En las áreas de esta lista la línea decide el
            anexo con que se evalúa, así que no se puede deducir: elíjala usted. Dentro de cada grupo puede
            aplicar la misma línea a todos y corregir después las excepciones.
          </div>

          {gruposPendientes.length === 0 && (
            <div style={aviso('exito')}>
              No queda ningún proyecto sin anexo. Todos tienen su rúbrica asignada.
            </div>
          )}

          {gruposPendientes.map(grupo => {
            const area = getArea(grupo.areaId);
            const lineas = getLineasDeArea(grupo.areaId);
            return (
              <div key={`${grupo.categoria}|${grupo.areaId}`} style={{ marginBottom: 22 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  padding: '9px 12px', background: C.gris100, borderRadius: 5, marginBottom: 8
                }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: CE.verdeOscuro }}>
                    {getCategoria(grupo.categoria)?.nombre} · {area?.nombre}
                  </span>
                  <span style={{ fontSize: 12, color: C.gris700 }}>
                    {grupo.proyectos.length} proyecto(s)
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: C.gris700, alignSelf: 'center' }}>Aplicar a todos:</span>
                    {lineas.map(l => (
                      <button key={l.id} type="button" onClick={() => aplicarATodoElGrupo(grupo, l.id)}
                        style={btn('secundario', { padding: '5px 10px', fontSize: 11.5 })}>
                        {l.anexoPorCategoria ? l.anexoPorCategoria[grupo.categoria] : l.anexo} · {l.nombre}
                      </button>
                    ))}
                  </span>
                </div>

                <div style={{ maxHeight: 340, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 5 }}>
                  <table style={S.tabla}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width: 44, textAlign: 'center' }}>N.°</th>
                        <th style={S.th}>Institución educativa</th>
                        <th style={S.th}>Título del trabajo</th>
                        <th style={{ ...S.th, width: 300 }}>Línea de participación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.proyectos.map(pr => (
                        <tr key={pr.id}>
                          <td style={{ ...S.td, textAlign: 'center', fontSize: 11 }}>{pr.ordenPresentacion || '—'}</td>
                          <td style={{ ...S.td, fontSize: 11 }}>{pr.institucionNombre}</td>
                          <td style={{ ...S.td, fontSize: 11 }}>{pr.tituloProyecto}</td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {lineas.map(l => {
                                const elegida = lineasElegidas[pr.id] === l.id;
                                const anexo = l.anexoPorCategoria ? l.anexoPorCategoria[grupo.categoria] : l.anexo;
                                return (
                                  <button key={l.id} type="button" onClick={() => elegirLinea(pr.id, l.id)}
                                    style={btn(elegida ? 'primario' : 'secundario', { padding: '5px 9px', fontSize: 11 })}>
                                    {anexo}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 9, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => { setVista('listado'); setLineasElegidas({}); }} style={btn('secundario')}>
              Volver
            </button>
            <button type="button" onClick={guardarLineas}
              disabled={guardandoLineas || totalElegidas === 0}
              style={(guardandoLineas || totalElegidas === 0) ? btnDeshabilitado(btn('primario')) : btn('primario')}>
              <Icon name="save" size={13} /> Guardar {totalElegidas} asignación(es)
            </button>
            <span style={{ fontSize: 12, color: C.gris700 }}>
              Quedan {pendientesDeLinea.length - totalElegidas} sin elegir.
            </span>
          </div>
        </div>
      )}

      {vista === 'jurados' && (
        <div>
          <div style={{ ...aviso('alerta'), marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 5 }}>
              Validación obligatoria del desglose de nombres
            </div>
            El padrón entregado no usa coma separadora entre apellidos y nombres en la mayoría de los
            registros, y las tildes se infirieron donde el original venía en mayúsculas sin acentuar.
            Estos nombres se imprimen en documentos legales firmados: {pendientesValidacion.length} registro(s)
            requieren que una persona los confirme contra el DNI antes del sellado del panel.
          </div>

          {esStaff && (
            <button type="button" onClick={sembrarJurados} style={{ ...btn('secundario'), marginBottom: 14 }}>
              <Icon name="upload" size={13} /> Sembrar padrón de jurados en Firestore
            </button>
          )}

          <div style={{ ...S.seccion, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.tabla}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: 90 }}>DNI</th>
                    <th style={S.th}>Nombre original del Excel</th>
                    <th style={S.th}>Apellidos</th>
                    <th style={S.th}>Nombres</th>
                    <th style={{ ...S.th, width: 70, textAlign: 'center' }}>Grupo</th>
                    <th style={{ ...S.th, width: 110, textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {juradosLocales.map(j => {
                    const pendiente = j.requiereValidacionNombre || j.tildesInferidas;
                    return (
                      <tr key={j.dni} style={{ background: pendiente ? '#FFFBEB' : C.blanco }}>
                        <td style={{ ...S.td, fontFamily: 'monospace' }}>{j.dni}</td>
                        <td style={{ ...S.td, fontSize: 11, color: C.gris500 }}>{j.nombreOriginal}</td>
                        <td style={S.td}>
                          <input
                            defaultValue={j.apellidos}
                            readOnly={!esStaff}
                            onBlur={e => esStaff && e.target.value !== j.apellidos
                              && validarNombreJurado(j.dni, {
                                apellidos: e.target.value,
                                nombreCompleto: `${e.target.value}, ${j.nombres}`
                              })}
                            style={{ ...S.input, fontSize: 11.5, padding: '5px 7px' }}
                          />
                        </td>
                        <td style={S.td}>
                          <input
                            defaultValue={j.nombres}
                            readOnly={!esStaff}
                            onBlur={e => esStaff && e.target.value !== j.nombres
                              && validarNombreJurado(j.dni, {
                                nombres: e.target.value,
                                nombreCompleto: `${j.apellidos}, ${e.target.value}`
                              })}
                            style={{ ...S.input, fontSize: 11.5, padding: '5px 7px' }}
                          />
                        </td>
                        <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>{j.grupoAsignado}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>
                          {pendiente ? (
                            esStaff ? (
                              <button type="button" onClick={() => validarNombreJurado(j.dni, { requiereValidacionNombre: false, tildesInferidas: false })}
                                style={btn('secundario', { padding: '4px 9px', fontSize: 10.5 })}>
                                Confirmar
                              </button>
                            ) : <span style={S.chip('#FFFBEB', C.alerta, '#FDE68A')}>Por validar</span>
                          ) : (
                            <span style={S.chip('#F0FDF4', C.exito, '#BBF7D0')}>Validado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...aviso('info'), marginTop: 14 }}>
            El padrón cubre únicamente el nivel Primaria (categorías A, B y C), organizado en tres equipos
            de cuatro miembros. No hay jurados registrados para las categorías D y E: el Panel de Firmas
            admite alta manual para cubrir ese caso. El campo tipo de miembro quedó por definir en los doce
            registros; las bases exigen dos docentes de Educación Básica y dos profesionales académicos por
            equipo, y esa asignación corresponde a la comisión organizadora.
          </div>
        </div>
      )}
    </div>
  );
}

function actualizarEstudiante(form, setForm, indice, cambios) {
  setForm({
    ...form,
    estudiantes: form.estudiantes.map((e, i) => (i === indice ? { ...e, ...cambios } : e))
  });
}

function Campo({ etiqueta, valor, onChange }) {
  return (
    <div>
      <label style={S.etiqueta}>{etiqueta}</label>
      <input value={valor || ''} onChange={e => onChange(e.target.value)} style={S.input} />
    </div>
  );
}

function Metrica({ etiqueta, valor, color }) {
  return (
    <div style={{ ...S.tarjeta, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || C.navy2 }}>{valor}</div>
      <div style={{ fontSize: 10.5, color: C.gris500, textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>
        {etiqueta}
      </div>
    </div>
  );
}
