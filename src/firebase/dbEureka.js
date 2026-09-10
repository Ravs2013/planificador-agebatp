/* ═══════════════════════════════════════════════════════════════
   FIRESTORE DB CAPA — EUREKA 2026 (Etapa UGEL — UGEL 03)

   Colecciones:
     eurekaParticipantes       {id}
     eurekaEvaluaciones        {participanteId}__J{numeroJurado}   <- clave por CASILLERO
     eurekaPanelFirmas         {scopeId}                            <- colección nueva
     eurekaConsolidados        {eventoId}__{etapa}__{categoria}__{areaId}
     eurekaActas               mismo id que el consolidado
     eurekaJuradosEvaluadores  {dni}
   ═══════════════════════════════════════════════════════════════ */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './config';
import {
  EUREKA_CONFIG, esCombinacionValida, consolidadoId, getArea, SLOTS_JURADO
} from '../data/eurekaConfigUGEL03';
import { resolverAnexo, resolverAnexoPorDefecto, resolverVariante, resolverEncuadre, barajarFisherYates, normalizarDNI, sanearCorreo } from '../utils/eurekaHelpers';
import { scopeIdDe, panelVacio, invalidarCacheDeScope } from '../utils/eurekaFirmas';

const MAX_BATCH = 450; // Firestore admite 500 operaciones por lote; se deja margen.

function validarCombinacion(categoria, areaId) {
  if (categoria && areaId && !esCombinacionValida(categoria, areaId)) {
    const area = getArea(areaId);
    throw new Error(
      `La combinación categoría ${categoria} — ${area ? area.nombre : areaId} no está habilitada en las bases de Eureka.`
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   1. PARTICIPANTES — eurekaParticipantes
   ───────────────────────────────────────────────────────────── */

export function subscribeEKParticipantes(filtros = {}, cb) {
  let q = collection(db, 'eurekaParticipantes');
  const constraints = [];
  if (filtros.categoria) constraints.push(where('categoria', '==', filtros.categoria));
  if (filtros.areaId) constraints.push(where('areaId', '==', filtros.areaId));
  if (filtros.etapa) constraints.push(where('etapa', '==', filtros.etapa));
  if (constraints.length > 0) q = query(q, ...constraints);

  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0));
    cb(list);
  }, error => {
    console.error('Error subscribiendo eurekaParticipantes:', error);
    cb([]);
  });
}

export async function addEKParticipante(data) {
  validarCombinacion(data.categoria, data.areaId);

  // El anexo se resuelve y se persiste al crear: la ficha no debe recalcularlo cada vez.
  const anexoEvaluacion = data.anexoEvaluacion || resolverAnexo({
    categoria: data.categoria,
    areaId: data.areaId,
    lineaId: data.lineaId
  });
  const variante = resolverVariante({ areaId: data.areaId, lineaId: data.lineaId });

  const id = data.id || `EK-${Date.now()}`;
  const ref = doc(db, 'eurekaParticipantes', id);
  const payload = {
    ...data,
    id,
    eventoId: data.eventoId || EUREKA_CONFIG.eventoId,
    etapa: data.etapa || EUREKA_CONFIG.etapa,
    anexoEvaluacion,
    varianteRubrica: data.varianteRubrica || variante || null,
    estado: data.estado || 'pendiente',
    ordenPresentacion: data.ordenPresentacion || 0,
    noSePresento: Boolean(data.noSePresento),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload);
  return id;
}

export async function updateEKParticipante(id, data) {
  await updateDoc(doc(db, 'eurekaParticipantes', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEKParticipante(id) {
  await deleteDoc(doc(db, 'eurekaParticipantes', id));
}

export async function getEKParticipantes(filtros = {}) {
  try {
    let q = collection(db, 'eurekaParticipantes');
    const constraints = [];
    if (filtros.categoria) constraints.push(where('categoria', '==', filtros.categoria));
    if (filtros.areaId) constraints.push(where('areaId', '==', filtros.areaId));
    if (constraints.length > 0) q = query(q, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error al obtener participantes de Eureka:', err);
    try {
      const snapAll = await getDocs(collection(db, 'eurekaParticipantes'));
      return snapAll.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => (!filtros.categoria || p.categoria === filtros.categoria)
          && (!filtros.areaId || p.areaId === filtros.areaId));
    } catch (e2) {
      return [];
    }
  }
}

/**
 * Sorteo del orden de presentación con Fisher-Yates, persistido atómicamente con
 * writeBatch. Se ejecuta en presencia de los delegados y deja registro de quién y cuándo.
 */
export async function sortearOrdenPresentacion({ categoria, areaId, usuario }) {
  validarCombinacion(categoria, areaId);
  const participantes = await getEKParticipantes({ categoria, areaId });
  if (participantes.length === 0) {
    throw new Error('No existen participantes registrados para realizar el sorteo.');
  }

  const barajados = barajarFisherYates(participantes);
  const ahora = new Date().toISOString();
  const responsable = usuario?.correo || usuario?.email || usuario?.nombre || 'Comisión organizadora';

  for (let i = 0; i < barajados.length; i += MAX_BATCH) {
    const lote = barajados.slice(i, i + MAX_BATCH);
    const batch = writeBatch(db);
    lote.forEach((item, idx) => {
      batch.update(doc(db, 'eurekaParticipantes', item.id), {
        ordenPresentacion: i + idx + 1,
        sorteoRealizadoEn: ahora,
        sorteoRealizadoPor: responsable,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }

  return barajados.length;
}

/** Carga masiva del padrón (SICE o manual) en lotes. */
export async function batchImportarParticipantes(lista = [], { soloNuevos = true, usuario } = {}) {
  if (!lista.length) return { importados: 0, omitidos: 0, rechazados: [] };

  let codigosExistentes = new Set();
  if (soloNuevos) {
    const snap = await getDocs(collection(db, 'eurekaParticipantes'));
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.codigoParticipante) codigosExistentes.add(data.codigoParticipante);
    });
  }

  const ahora = new Date().toISOString();
  const responsable = usuario?.correo || usuario?.email || usuario?.nombre || 'Comisión organizadora';
  const paraProcesar = [];
  const rechazados = [];
  let omitidos = 0;

  lista.forEach((p, idx) => {
    const cod = p.codigoParticipante || p.codigo || `EK26-SICE-${idx + 1}`;
    if (soloNuevos && codigosExistentes.has(cod)) { omitidos += 1; return; }
    try {
      validarCombinacion(p.categoria, p.areaId);
      // El reporte para jurados no trae la linea, y en primaria la linea decide el
      // anexo. Un proyecto sin anexo entra igual y queda marcado: rechazarlo obligaria
      // a teclear a mano cientos de trabajos que el reporte ya trae completos en todo
      // lo demas. Lo que no puede pasar es que se le genere una ficha sin anexo, y de
      // eso se encarga quien consume `anexoEvaluacion`.
      const encuadre = resolverEncuadre({
        categoria: p.categoria, areaId: p.areaId, lineaId: p.lineaId
      });
      const anexoEvaluacion = p.anexoEvaluacion || encuadre.anexo || resolverAnexoPorDefecto(p.categoria, p.areaId);
      paraProcesar.push({
        ...p,
        codigoParticipante: cod,
        anexoEvaluacion,
        requiereLinea: p.requiereLinea ?? encuadre.requiereLinea,
        requiereVariante: p.requiereVariante ?? encuadre.requiereVariante
      });
    } catch (err) {
      rechazados.push({ fila: idx + 1, codigo: cod, motivo: err.message });
    }
  });

  let importados = 0;
  for (let i = 0; i < paraProcesar.length; i += MAX_BATCH) {
    const chunk = paraProcesar.slice(i, i + MAX_BATCH);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const docId = item.id || item.codigoParticipante;
      batch.set(doc(db, 'eurekaParticipantes', docId), {
        ...item,
        id: docId,
        eventoId: EUREKA_CONFIG.eventoId,
        etapa: EUREKA_CONFIG.etapa,
        varianteRubrica: item.varianteRubrica
          || (item.lineaId ? resolverVariante({ areaId: item.areaId, lineaId: item.lineaId }) : null)
          || null,
        origen: item.origen || 'sice',
        importadoEl: ahora,
        importadoPor: responsable,
        estado: item.estado || 'pendiente',
        ordenPresentacion: item.ordenPresentacion || 0,
        updatedAt: serverTimestamp()
      }, { merge: true });
      importados += 1;
    });
    await batch.commit();
  }

  return { importados, omitidos, rechazados };
}

/**
 * Asigna la línea de participación a varios proyectos y recalcula lo que de ella depende.
 *
 * Existe porque el reporte SICE para jurados no trae la línea y en primaria la línea
 * decide el anexo: son cientos de proyectos a los que hay que ponérsela. Uno por uno
 * serían cientos de escrituras sueltas y una espera larga delante de la comisión.
 *
 * El anexo se recalcula aquí y no se acepta del cliente: es el dato que determina con qué
 * rúbrica se evalúa a un escolar, y no puede depender de que la pantalla lo haya
 * calculado bien.
 */
export async function batchAsignarLinea(asignaciones = [], usuario) {
  if (!asignaciones.length) return { actualizados: 0, rechazados: [] };

  const responsable = usuario?.correo || usuario?.email || usuario?.nombre || 'Comisión organizadora';
  const validas = [];
  const rechazados = [];

  asignaciones.forEach(a => {
    try {
      validarCombinacion(a.categoria, a.areaId);
      validas.push({
        id: a.id,
        lineaId: a.lineaId,
        anexoEvaluacion: resolverAnexo({ categoria: a.categoria, areaId: a.areaId, lineaId: a.lineaId }),
        varianteRubrica: resolverVariante({ areaId: a.areaId, lineaId: a.lineaId }) || null
      });
    } catch (err) {
      rechazados.push({ id: a.id, motivo: err.message });
    }
  });

  let actualizados = 0;
  for (let i = 0; i < validas.length; i += MAX_BATCH) {
    const chunk = validas.slice(i, i + MAX_BATCH);
    const batch = writeBatch(db);
    chunk.forEach(v => {
      batch.set(doc(db, 'eurekaParticipantes', v.id), {
        lineaId: v.lineaId,
        anexoEvaluacion: v.anexoEvaluacion,
        varianteRubrica: v.varianteRubrica,
        requiereLinea: false,
        requiereVariante: false,
        lineaAsignadaPor: responsable,
        lineaAsignadaEl: new Date().toISOString(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      actualizados += 1;
    });
    await batch.commit();
  }

  return { actualizados, rechazados };
}

/* ─────────────────────────────────────────────────────────────
   2. EVALUACIONES — eurekaEvaluaciones/{participanteId}__J{n}

   La clave determinista se ancla al CASILLERO de jurado, no a la persona: el evaluador
   operativo puede variar entre sesiones. Esto garantiza exactamente 3 evaluaciones por
   participante y hace trivial la resolución de firma.
   ───────────────────────────────────────────────────────────── */

export function evaluacionId(participanteId, numeroJurado) {
  return `${participanteId}__J${numeroJurado}`;
}

export function subscribeEKEvaluaciones(filtros = {}, cb) {
  let q = collection(db, 'eurekaEvaluaciones');
  const constraints = [];
  if (filtros.categoria) constraints.push(where('categoria', '==', filtros.categoria));
  if (filtros.areaId) constraints.push(where('areaId', '==', filtros.areaId));
  if (filtros.participanteId) constraints.push(where('participanteId', '==', filtros.participanteId));
  if (constraints.length > 0) q = query(q, ...constraints);

  return onSnapshot(q, snapshot => {
    cb(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, error => {
    console.error('Error subscribiendo eurekaEvaluaciones:', error);
    cb([]);
  });
}

export async function getEKEvaluacion(participanteId, numeroJurado) {
  const snap = await getDoc(doc(db, 'eurekaEvaluaciones', evaluacionId(participanteId, numeroJurado)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getEKEvaluaciones(filtros = {}) {
  try {
    let q = collection(db, 'eurekaEvaluaciones');
    const constraints = [];
    if (filtros.categoria) constraints.push(where('categoria', '==', filtros.categoria));
    if (filtros.areaId) constraints.push(where('areaId', '==', filtros.areaId));
    if (constraints.length > 0) q = query(q, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error al obtener evaluaciones de Eureka:', err);
    try {
      const snapAll = await getDocs(collection(db, 'eurekaEvaluaciones'));
      return snapAll.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => (!filtros.categoria || e.categoria === filtros.categoria)
          && (!filtros.areaId || e.areaId === filtros.areaId));
    } catch (e2) {
      return [];
    }
  }
}

/**
 * Guarda una evaluación. El estado solo puede ser 'borrador' o 'registrada':
 * en Eureka la condición de documento suscrito ya no vive en la ficha sino en el panel.
 * `evaluadorOperativo` registra quién capturó realmente los puntajes; es la salvaguarda
 * de auditoría del modelo de firma diferida y no debe omitirse.
 */
export async function saveEKEvaluacion(data, { usuario, accion = 'guardado' } = {}) {
  validarCombinacion(data.categoria, data.areaId);

  const numeroJurado = data.jurado?.numeroJurado;
  if (!SLOTS_JURADO.includes(numeroJurado)) {
    throw new Error(`El casillero de jurado debe ser uno de: ${SLOTS_JURADO.join(', ')}.`);
  }
  if (!data.participanteId) {
    throw new Error('La evaluación no tiene participante asociado.');
  }

  const docId = evaluacionId(data.participanteId, numeroJurado);
  const ref = doc(db, 'eurekaEvaluaciones', docId);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;
  const ahora = new Date().toISOString();

  const evaluadorOperativo = existente?.evaluadorOperativo || {
    uid: usuario?.uid || 'anon',
    correo: sanearCorreo(usuario?.correo || usuario?.email || ''),
    nombreCompleto: usuario?.nombreCompleto || usuario?.nombre || 'Evaluador no identificado',
    registradoEn: ahora
  };

  const historial = Array.isArray(existente?.historialEdiciones) ? [...existente.historialEdiciones] : [];
  historial.push({
    uid: usuario?.uid || 'anon',
    correo: sanearCorreo(usuario?.correo || usuario?.email || ''),
    en: ahora,
    accion
  });

  const payload = {
    ...data,
    id: docId,
    eventoId: data.eventoId || EUREKA_CONFIG.eventoId,
    etapa: data.etapa || EUREKA_CONFIG.etapa,
    estado: data.estado === 'registrada' ? 'registrada' : 'borrador',
    acreditacion: data.acreditacion || {},
    penalizaciones: data.penalizaciones || [],
    evaluadorOperativo,
    historialEdiciones: historial.slice(-50),
    updatedAt: serverTimestamp()
  };
  if (payload.estado === 'registrada' && !payload.registradaEn) {
    payload.registradaEn = ahora;
  }
  if (!existente) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(ref, payload, { merge: true });
  return docId;
}

export async function registrarEKEvaluacion(id, usuario) {
  await setDoc(doc(db, 'eurekaEvaluaciones', id), {
    estado: 'registrada',
    registradaEn: new Date().toISOString(),
    registradaPor: sanearCorreo(usuario?.correo || usuario?.email || '') || (usuario?.nombre || 'Evaluador'),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function reabrirEKEvaluacion(id, motivo, usuario) {
  await updateDoc(doc(db, 'eurekaEvaluaciones', id), {
    estado: 'borrador',
    reabiertaPor: sanearCorreo(usuario?.correo || usuario?.email || '') || (usuario?.nombre || 'Administrador'),
    reabiertaEn: new Date().toISOString(),
    motivoReapertura: motivo || 'Reapertura autorizada por la comisión organizadora',
    updatedAt: serverTimestamp()
  });
}

export async function deleteEKEvaluacion(id) {
  await deleteDoc(doc(db, 'eurekaEvaluaciones', id));
}

export async function limpiarEvaluacionesCategoriaArea(categoria, areaId) {
  const evals = await getEKEvaluaciones({ categoria, areaId });
  if (!evals.length) return 0;
  for (let i = 0; i < evals.length; i += MAX_BATCH) {
    const batch = writeBatch(db);
    evals.slice(i, i + MAX_BATCH).forEach(e => batch.delete(doc(db, 'eurekaEvaluaciones', e.id)));
    await batch.commit();
  }
  return evals.length;
}

/** Elimina las evaluaciones huérfanas y los duplicados por casillero de un alcance. */
export async function limpiarEvaluacionesHuerfanas(categoria, areaId, participantes = []) {
  const evaluaciones = await getEKEvaluaciones({ categoria, areaId });
  if (!evaluaciones.length) return 0;

  const idsValidos = new Set(participantes.map(p => p.id).filter(Boolean));
  const vistos = new Set();
  const aBorrar = [];

  evaluaciones.forEach(ev => {
    const pId = ev.participanteId || String(ev.id || '').split('__')[0];
    const slot = ev.jurado?.numeroJurado;
    const clave = `${pId}__J${slot}`;
    if (participantes.length > 0 && !idsValidos.has(pId)) { aBorrar.push(ev.id); return; }
    if (!SLOTS_JURADO.includes(slot)) { aBorrar.push(ev.id); return; }
    if (vistos.has(clave) && ev.id !== clave) { aBorrar.push(ev.id); return; }
    vistos.add(clave);
  });

  for (let i = 0; i < aBorrar.length; i += MAX_BATCH) {
    const batch = writeBatch(db);
    aBorrar.slice(i, i + MAX_BATCH).forEach(id => batch.delete(doc(db, 'eurekaEvaluaciones', id)));
    await batch.commit();
  }
  return aBorrar.length;
}

/* ─────────────────────────────────────────────────────────────
   3. PANEL DE FIRMAS OFICIAL — eurekaPanelFirmas/{scopeId}
   ───────────────────────────────────────────────────────────── */

/** Suscripción a TODOS los paneles. La cascada de resolución los necesita todos en mano. */
export function subscribeEKPaneles(cb) {
  return onSnapshot(collection(db, 'eurekaPanelFirmas'), snapshot => {
    const map = {};
    snapshot.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
    cb(map);
  }, error => {
    console.error('Error subscribiendo eurekaPanelFirmas:', error);
    cb({});
  });
}

export async function getEKPanel(scopeId) {
  const snap = await getDoc(doc(db, 'eurekaPanelFirmas', scopeId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getEKPaneles() {
  const snap = await getDocs(collection(db, 'eurekaPanelFirmas'));
  const map = {};
  snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
  return map;
}

/** Crea el panel si no existe. Devuelve el documento vigente. */
export async function asegurarEKPanel({ alcance, categoria, areaId }, usuario) {
  const id = scopeIdDe({ alcance, categoria, areaId });
  const ref = doc(db, 'eurekaPanelFirmas', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const base = panelVacio({ alcance, categoria, areaId });
  const payload = {
    ...base,
    historial: [{
      accion: 'creado',
      uid: usuario?.uid || 'anon',
      correo: sanearCorreo(usuario?.correo || usuario?.email || ''),
      en: new Date().toISOString()
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload);
  return payload;
}

/** Guarda el borrador del panel. No cambia el estado ni toca el historial de sellado. */
export async function guardarBorradorEKPanel(panel, usuario) {
  if (!panel?.id) throw new Error('El panel no tiene identificador de alcance.');
  const ref = doc(db, 'eurekaPanelFirmas', panel.id);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;

  if (existente && existente.estado === 'sellado') {
    throw new Error('El panel está sellado. Debe reabrirse antes de modificar a sus firmantes.');
  }

  const historial = Array.isArray(existente?.historial) ? [...existente.historial] : [];
  historial.push({
    accion: 'firmante_modificado',
    uid: usuario?.uid || 'anon',
    correo: sanearCorreo(usuario?.correo || usuario?.email || ''),
    en: new Date().toISOString()
  });

  await setDoc(ref, {
    ...panel,
    firmantes: (panel.firmantes || []).map(f => ({ ...f, dni: normalizarDNI(f.dni) })),
    estado: 'borrador',
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    historial: historial.slice(-100),
    updatedAt: serverTimestamp(),
    ...(existente ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });

  return panel.id;
}

/**
 * SELLA el panel. Desde este momento las firmas y datos de los tres jurados designados
 * gobiernan todas las fichas, consolidados y actas del alcance, y los documentos dejan de
 * emitirse como preliminares.
 */
export async function sellarEKPanel(panel, usuario) {
  if (!panel?.id) throw new Error('El panel no tiene identificador de alcance.');
  const ref = doc(db, 'eurekaPanelFirmas', panel.id);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;
  const ahora = new Date().toISOString();

  const historial = Array.isArray(existente?.historial) ? [...existente.historial] : [];
  historial.push({
    accion: 'sellado',
    uid: usuario?.uid || 'anon',
    correo: sanearCorreo(usuario?.correo || usuario?.email || ''),
    en: ahora
  });

  await setDoc(ref, {
    ...panel,
    firmantes: (panel.firmantes || []).map(f => ({ ...f, dni: normalizarDNI(f.dni) })),
    estado: 'sellado',
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    selladoPor: {
      uid: usuario?.uid || 'anon',
      correo: sanearCorreo(usuario?.correo || usuario?.email || '')
    },
    selladoEn: ahora,
    historial: historial.slice(-100),
    updatedAt: serverTimestamp(),
    ...(existente ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });

  return panel.id;
}

/**
 * Reabre un panel sellado. Exige motivo escrito, queda en el historial (que nunca se
 * borra) e invalida la caché local de firmas de ese alcance.
 */
export async function reabrirEKPanel(scopeId, motivo, usuario) {
  const texto = String(motivo || '').trim();
  if (texto.length < 10) {
    throw new Error('Reabrir el panel exige un motivo escrito de al menos 10 caracteres.');
  }
  const ref = doc(db, 'eurekaPanelFirmas', scopeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('El panel indicado no existe.');

  const historial = Array.isArray(snap.data().historial) ? [...snap.data().historial] : [];
  historial.push({
    accion: 'reabierto',
    uid: usuario?.uid || 'anon',
    correo: sanearCorreo(usuario?.correo || usuario?.email || ''),
    en: new Date().toISOString(),
    motivo: texto
  });

  await updateDoc(ref, {
    estado: 'borrador',
    historial,
    updatedAt: serverTimestamp()
  });

  invalidarCacheDeScope(scopeId);
  return scopeId;
}

/* ─────────────────────────────────────────────────────────────
   4. CONSOLIDADOS E19 — eurekaConsolidados
   ───────────────────────────────────────────────────────────── */

export function subscribeEKConsolidado(id, cb) {
  return onSnapshot(doc(db, 'eurekaConsolidados', id), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, error => {
    console.error('Error subscribiendo eurekaConsolidado:', error);
    cb(null);
  });
}

export function subscribeEKConsolidados(cb) {
  return onSnapshot(collection(db, 'eurekaConsolidados'), snapshot => {
    cb(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, error => {
    console.error('Error subscribiendo eurekaConsolidados:', error);
    cb([]);
  });
}

export async function setEKConsolidado(categoria, areaId, data) {
  const id = consolidadoId(categoria, areaId);
  await setDoc(doc(db, 'eurekaConsolidados', id), {
    ...data,
    id,
    categoria,
    areaId,
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    estado: data.estado || 'borrador',
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

export async function cerrarEKConsolidado(categoria, areaId, usuario) {
  const id = consolidadoId(categoria, areaId);
  await updateDoc(doc(db, 'eurekaConsolidados', id), {
    estado: 'cerrado',
    cerradoPor: sanearCorreo(usuario?.correo || usuario?.email || '') || (usuario?.nombre || 'Comisión organizadora'),
    cerradoEn: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
  return id;
}

export async function getEKConsolidados() {
  const snap = await getDocs(collection(db, 'eurekaConsolidados'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Registra la dirimencia colegiada de un empate. El motivo es obligatorio. */
export async function registrarDirimencia(categoria, areaId, { participanteId, ordenManual, motivo, usuario }) {
  const texto = String(motivo || '').trim();
  if (!texto) throw new Error('La dirimencia de un empate exige un motivo escrito.');

  await updateEKParticipante(participanteId, {
    ordenManual: Number(ordenManual),
    motivoDirimencia: texto,
    dirimenciaPor: sanearCorreo(usuario?.correo || usuario?.email || '') || (usuario?.nombre || 'Jurado calificador'),
    dirimenciaEn: new Date().toISOString()
  });

  const id = consolidadoId(categoria, areaId);
  const ref = doc(db, 'eurekaConsolidados', id);
  const snap = await getDoc(ref);
  const registros = snap.exists() && Array.isArray(snap.data().dirimencias) ? [...snap.data().dirimencias] : [];
  registros.push({
    participanteId,
    ordenManual: Number(ordenManual),
    motivo: texto,
    por: sanearCorreo(usuario?.correo || usuario?.email || ''),
    en: new Date().toISOString()
  });
  await setDoc(ref, {
    id, categoria, areaId,
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    dirimencias: registros,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ─────────────────────────────────────────────────────────────
   5. ACTAS E20 — eurekaActas
   ───────────────────────────────────────────────────────────── */

export function subscribeEKActa(id, cb) {
  return onSnapshot(doc(db, 'eurekaActas', id), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, error => {
    console.error('Error subscribiendo eurekaActa:', error);
    cb(null);
  });
}

export function subscribeEKActas(cb) {
  return onSnapshot(collection(db, 'eurekaActas'), snapshot => {
    cb(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }, error => {
    console.error('Error subscribiendo eurekaActas:', error);
    cb([]);
  });
}

export async function setEKActa(categoria, areaId, data) {
  const id = consolidadoId(categoria, areaId);
  // Las firmas no se guardan en el acta: se resuelven desde eurekaPanelFirmas al renderizar.
  const { firmantes, jurados, ...limpio } = data;
  await setDoc(doc(db, 'eurekaActas', id), {
    ...limpio,
    id,
    consolidadoId: id,
    categoria,
    areaId,
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    estado: data.estado || 'borrador',
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

export async function cerrarEKActa(categoria, areaId, { usuario, panelFirmasScopeId }) {
  const id = consolidadoId(categoria, areaId);
  await updateDoc(doc(db, 'eurekaActas', id), {
    estado: 'cerrada',
    panelFirmasScopeId: panelFirmasScopeId || null,
    cerradaPor: sanearCorreo(usuario?.correo || usuario?.email || '') || (usuario?.nombre || 'Comisión organizadora'),
    cerradaEn: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
  return id;
}

export async function getEKActas() {
  const snap = await getDocs(collection(db, 'eurekaActas'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ─────────────────────────────────────────────────────────────
   6. POOL OPERATIVO — eurekaJuradosEvaluadores/{dni}
   ───────────────────────────────────────────────────────────── */

export function subscribeEKJurados(cb) {
  return onSnapshot(collection(db, 'eurekaJuradosEvaluadores'), snapshot => {
    cb(snapshot.docs.map(d => ({ dni: d.id, ...d.data() })));
  }, error => {
    console.error('Error subscribiendo eurekaJuradosEvaluadores:', error);
    cb([]);
  });
}

export async function upsertEKJurado(jurado) {
  const dni = normalizarDNI(jurado.dni);
  if (!dni) throw new Error('El jurado evaluador debe tener DNI.');
  await setDoc(doc(db, 'eurekaJuradosEvaluadores', dni), {
    ...jurado,
    dni,
    correo: sanearCorreo(jurado.correo),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return dni;
}

/** Siembra el padrón operativo de jurados desde el seed local. */
export async function sembrarJuradosEureka(lista = [], usuario) {
  if (!lista.length) return 0;
  const ahora = new Date().toISOString();
  let escritos = 0;
  for (let i = 0; i < lista.length; i += MAX_BATCH) {
    const batch = writeBatch(db);
    lista.slice(i, i + MAX_BATCH).forEach(j => {
      const dni = normalizarDNI(j.dni);
      if (!dni) return;
      batch.set(doc(db, 'eurekaJuradosEvaluadores', dni), {
        ...j,
        dni,
        correo: sanearCorreo(j.correo),
        sembradoEn: ahora,
        sembradoPor: sanearCorreo(usuario?.correo || usuario?.email || '') || 'Comisión organizadora',
        updatedAt: serverTimestamp()
      }, { merge: true });
      escritos += 1;
    });
    await batch.commit();
  }
  return escritos;
}
