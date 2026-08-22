/* ═══════════════════════════════════════════════════════════════
   FIRESTORE DB CAPA — JUEGOS FLORALES JFEN 2026
   ═══════════════════════════════════════════════════════════════ */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { esCombinacionValida, getDisciplinaUGEL03 } from '../data/juegosFloralesUGEL03';

/* ─────────────────────────────────────────────────────────────
   1. PARTICIPANTES (jfParticipantes)
   ───────────────────────────────────────────────────────────── */

export function subscribeJFParticipantes(filtros = {}, cb) {
  let q = collection(db, 'jfParticipantes');
  const constraints = [];

  if (filtros.disciplinaId) {
    constraints.push(where('disciplinaId', '==', filtros.disciplinaId));
  }
  if (filtros.categoria) {
    constraints.push(where('categoria', '==', filtros.categoria));
  }
  if (filtros.etapa) {
    constraints.push(where('etapa', '==', filtros.etapa));
  }

  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Ordenar por ordenPresentacion o por codigo
    list.sort((a, b) => (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0));
    cb(list);
  }, (error) => {
    console.error("Error subscribiendo jfParticipantes:", error);
    cb([]);
  });
}

export async function addJFParticipante(data) {
  const disciplinaId = data.disciplinaId;
  const categoria = data.categoria;

  if (disciplinaId && categoria && !esCombinacionValida(disciplinaId, categoria)) {
    const disc = getDisciplinaUGEL03(disciplinaId);
    const discNombre = disc ? disc.label : disciplinaId;
    throw new Error(`La combinación ${discNombre} — categoría ${categoria} no está programada en la etapa UGEL según el Comunicado 01.`);
  }

  const id = data.id || `JF-${Date.now()}`;
  const ref = doc(db, 'jfParticipantes', id);
  const payload = {
    ...data,
    id,
    eventoId: data.eventoId || "JFEN-2026",
    etapa: data.etapa || "UGEL",
    estado: data.estado || "pendiente",
    ordenPresentacion: data.ordenPresentacion || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload);
  return id;
}

export async function updateJFParticipante(id, data) {
  const ref = doc(db, 'jfParticipantes', id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteJFParticipante(id) {
  const ref = doc(db, 'jfParticipantes', id);
  await deleteDoc(ref);
}

/** Sortear aleatoriamente el orden de presentación 1..n de los participantes */
export async function sortearOrdenPresentacion({ disciplinaId, categoria, usuario }) {
  if (!esCombinacionValida(disciplinaId, categoria)) {
    throw new Error(`La combinación ${disciplinaId} — categoría ${categoria} no está habilitada.`);
  }

  const q = query(
    collection(db, 'jfParticipantes'),
    where('disciplinaId', '==', disciplinaId),
    where('categoria', '==', categoria)
  );

  const snap = await getDocs(q);
  const docsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (docsList.length === 0) {
    throw new Error("No existen participantes registrados para realizar el sorteo.");
  }

  // Algoritmo Fisher-Yates para barajar aleatoriamente
  const barajados = [...docsList];
  for (let i = barajados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [barajados[i], barajados[j]] = [barajados[j], barajados[i]];
  }

  const batch = writeBatch(db);
  const ahora = new Date().toISOString();
  const usuarioNombre = usuario?.nombre || usuario?.email || "Staff";

  barajados.forEach((item, index) => {
    const ref = doc(db, 'jfParticipantes', item.id);
    batch.update(ref, {
      ordenPresentacion: index + 1,
      sorteoRealizadoEn: ahora,
      sorteoRealizadoPor: usuarioNombre,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
  return barajados.length;
}

/* ─────────────────────────────────────────────────────────────
   2. EVALUACIONES INDIVIDUALES D1 (jfEvaluaciones)
   ───────────────────────────────────────────────────────────── */

export function subscribeJFEvaluaciones(filtros = {}, cb) {
  let q = collection(db, 'jfEvaluaciones');
  const constraints = [];

  if (filtros.disciplinaId) {
    constraints.push(where('disciplinaId', '==', filtros.disciplinaId));
  }
  if (filtros.categoria) {
    constraints.push(where('categoria', '==', filtros.categoria));
  }
  if (filtros.participanteId) {
    constraints.push(where('participanteId', '==', filtros.participanteId));
  }
  if (filtros.juradoUid) {
    constraints.push(where('jurado.uid', '==', filtros.juradoUid));
  }

  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  }, (error) => {
    console.error("Error subscribiendo jfEvaluaciones:", error);
    cb([]);
  });
}

export async function getJFEvaluacion(participanteId, juradoUid) {
  const docId = `${participanteId}__${juradoUid}`;
  const ref = doc(db, 'jfEvaluaciones', docId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveJFEvaluacion(data) {
  const disciplinaId = data.disciplinaId;
  const categoria = data.categoria;

  // Validación dura de alcance UGEL 03
  if (disciplinaId && categoria && !esCombinacionValida(disciplinaId, categoria)) {
    const disc = getDisciplinaUGEL03(disciplinaId);
    const discNombre = disc ? disc.label : disciplinaId;
    throw new Error(`La combinación ${discNombre} — categoría ${categoria} no está programada en la etapa UGEL según el Comunicado 01.`);
  }

  const juradoUid = data.jurado?.uid || "anon";
  const participanteId = data.participanteId || "unknown";
  const docId = data.id || `${participanteId}__${juradoUid}`;
  const ref = doc(db, 'jfEvaluaciones', docId);

  const payload = {
    ...data,
    id: docId,
    eventoId: data.eventoId || "JFEN-2026",
    etapa: data.etapa || "UGEL",
    estado: data.estado || "borrador",
    acreditacion: data.acreditacion || {},
    updatedAt: serverTimestamp()
  };

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(ref, payload, { merge: true });
  return docId;
}

export async function firmarJFEvaluacion(id, firmaDataUrl) {
  const ref = doc(db, 'jfEvaluaciones', id);
  await setDoc(ref, {
    'jurado.firmaDataUrl': firmaDataUrl || null,
    estado: 'firmada',
    firmadaEn: new Date().toISOString(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function reabrirJFEvaluacion(id, motivo, usuario) {
  const ref = doc(db, 'jfEvaluaciones', id);
  await updateDoc(ref, {
    estado: 'borrador',
    reabiertaPor: usuario?.nombre || usuario?.email || 'Admin',
    reabiertaEn: new Date().toISOString(),
    motivoReapertura: motivo || 'Reapertura autorizada por administrador',
    updatedAt: serverTimestamp()
  });
}

export async function deleteJFEvaluacion(id) {
  const ref = doc(db, 'jfEvaluaciones', id);
  await deleteDoc(ref);
}

export async function deleteJFConsolidado(id) {
  const ref = doc(db, 'jfConsolidados', id);
  await deleteDoc(ref).catch(() => {});
}

export async function deleteJFActa(id) {
  const ref = doc(db, 'jfActas', id);
  await deleteDoc(ref).catch(() => {});
}

export async function limpiarEvaluacionesCategoria(disciplinaId, categoria) {
  const q = query(
    collection(db, 'jfEvaluaciones')
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  let count = 0;

  snap.docs.forEach(d => {
    const data = d.data();
    const matchDisc = !disciplinaId || data.disciplinaId === disciplinaId || d.id.includes(disciplinaId);
    const matchCat = !categoria || data.categoria === categoria || data.participanteSnapshot?.categoria === categoria;
    if (matchDisc && matchCat) {
      batch.delete(d.ref);
      count++;
    }
  });

  const docId = `JFEN-2026__UGEL__${disciplinaId}__${categoria}`;
  const refConsolidado = doc(db, 'jfConsolidados', docId);
  const refActa = doc(db, 'jfActas', docId);

  batch.delete(refConsolidado);
  batch.delete(refActa);

  await batch.commit();
  return count;
}

export async function limpiarEvaluacionesHuerfanas(disciplinaId, categoria, participantes = []) {
  const q = query(collection(db, 'jfEvaluaciones'));
  const snap = await getDocs(q);
  const partIdsSet = new Set(participantes.map(p => p.id).filter(Boolean));
  const partCodigosSet = new Set(participantes.map(p => p.codigoParticipante || p.codigo).filter(Boolean));

  const batch = writeBatch(db);
  let deletedCount = 0;
  const dedupMap = new Map();

  snap.docs.forEach(d => {
    const data = d.data();
    const matchDisc = !disciplinaId || data.disciplinaId === disciplinaId || d.id.includes(disciplinaId);
    const matchCat = !categoria || data.categoria === categoria || data.participanteSnapshot?.categoria === categoria;

    if (!matchDisc || !matchCat) return;

    const pId = data.participanteId || data.participanteSnapshot?.id || d.id.split('__')[0];
    const pCod = data.codigoParticipante || data.participanteSnapshot?.codigoParticipante || data.participanteSnapshot?.codigo;

    const esValido = (pId && partIdsSet.has(pId)) || (pCod && partCodigosSet.has(pCod));

    if (!esValido || pId === 'unknown' || pCod === 'JF-2026') {
      batch.delete(d.ref);
      deletedCount++;
      return;
    }

    const jurNum = data.jurado?.numeroJurado || data.juradoId || 1;
    const key = `${pId}__jurado_${jurNum}`;

    if (!dedupMap.has(key)) {
      dedupMap.set(key, { ref: d.ref, data });
    } else {
      const prev = dedupMap.get(key);
      const prevTieneFirma = Boolean(prev.data.jurado?.firmaDataUrl);
      const currTieneFirma = Boolean(data.jurado?.firmaDataUrl);

      if (!prevTieneFirma && currTieneFirma) {
        batch.delete(prev.ref);
        dedupMap.set(key, { ref: d.ref, data });
        deletedCount++;
      } else {
        batch.delete(d.ref);
        deletedCount++;
      }
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
  }
  return deletedCount;
}

/* ─────────────────────────────────────────────────────────────
   3. CONSOLIDADOS A10 (jfConsolidados)
   ───────────────────────────────────────────────────────────── */

export function subscribeJFConsolidado(id, cb) {
  const ref = doc(db, 'jfConsolidados', id);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (error) => {
    console.error("Error subscribiendo jfConsolidado:", error);
    cb(null);
  });
}

export function subscribeJFConsolidados(filtros = {}, cb) {
  let q = collection(db, 'jfConsolidados');
  const constraints = [];

  if (filtros.disciplinaId) {
    constraints.push(where('disciplinaId', '==', filtros.disciplinaId));
  }

  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  }, (error) => {
    console.error("Error subscribiendo jfConsolidados:", error);
    cb([]);
  });
}

export async function setJFConsolidado(id, data) {
  const ref = doc(db, 'jfConsolidados', id);
  const payload = {
    ...data,
    id,
    eventoId: data.eventoId || "JFEN-2026",
    etapa: data.etapa || "UGEL",
    estado: data.estado || "borrador",
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload, { merge: true });
}

export async function cerrarJFConsolidado(id, usuario) {
  const ref = doc(db, 'jfConsolidados', id);
  await updateDoc(ref, {
    estado: 'cerrado',
    cerradoPor: usuario?.nombre || usuario?.email || 'Staff',
    cerradoEn: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
}

/* ─────────────────────────────────────────────────────────────
   4. ACTAS A11 (jfActas)
   ───────────────────────────────────────────────────────────── */

export function subscribeJFActa(id, cb) {
  const ref = doc(db, 'jfActas', id);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (error) => {
    console.error("Error subscribiendo jfActa:", error);
    cb(null);
  });
}

export function subscribeJFActas(filtros = {}, cb) {
  let q = collection(db, 'jfActas');
  const constraints = [];

  if (filtros.disciplinaId) {
    constraints.push(where('disciplinaId', '==', filtros.disciplinaId));
  }

  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  }, (error) => {
    console.error("Error subscribiendo jfActas:", error);
    cb([]);
  });
}

export async function setJFActa(id, data) {
  const ref = doc(db, 'jfActas', id);
  const payload = {
    ...data,
    id,
    eventoId: data.eventoId || "JFEN-2026",
    etapa: data.etapa || "UGEL",
    estado: data.estado || "borrador",
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload, { merge: true });
}

export async function cerrarJFActa(id, usuario) {
  const ref = doc(db, 'jfActas', id);
  await updateDoc(ref, {
    estado: 'cerrada',
    cerradaPor: usuario?.nombre || usuario?.email || 'Staff',
    cerradaEn: new Date().toISOString(),
    updatedAt: serverTimestamp()
  });
}

/** Carga masiva del padrón SICE a Firestore en lotes de máximo 450 registros */
export async function batchImportarPadronSICE(participantesList = [], { soloNuevos = true, usuario } = {}) {
  if (!participantesList || participantesList.length === 0) {
    return { importados: 0, omitidos: 0 };
  }

  // Si soloNuevos es true, obtener códigos de participantes existentes en Firestore
  let codigosExistentes = new Set();
  if (soloNuevos) {
    const snap = await getDocs(collection(db, 'jfParticipantes'));
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.codigo) codigosExistentes.add(data.codigo);
      if (data.codigoParticipante) codigosExistentes.add(data.codigoParticipante);
    });
  }

  let importados = 0;
  let omitidos = 0;
  const ahora = new Date().toISOString();
  const usuarioNombre = usuario?.nombre || usuario?.email || "Admin/Staff";

  // Filtrar y preparar lista a procesar
  const paraProcesar = [];
  participantesList.forEach((p, idx) => {
    const cod = p.codigo || p.codigoParticipante || `JF26-SICE-${idx}`;
    if (soloNuevos && codigosExistentes.has(cod)) {
      omitidos++;
    } else {
      paraProcesar.push({ ...p, cod });
    }
  });

  // Dividir en lotes de 450
  const CHUNK_SIZE = 450;
  for (let i = 0; i < paraProcesar.length; i += CHUNK_SIZE) {
    const chunk = paraProcesar.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(item => {
      const docId = item.id || item.cod;
      const ref = doc(db, 'jfParticipantes', docId);

      const payload = {
        id: docId,
        eventoId: item.eventoId || "JFEN-2026",
        etapa: item.etapa || "UGEL",
        disciplinaId: item.disciplinaId,
        disciplinaNombre: item.disciplina || item.disciplinaNombre || '',
        categoria: item.categoria,
        codigoParticipante: item.cod,
        codigo: item.cod,
        iieeId: item.iieeId || '',
        institucionNombre: item.iiee || item.institucionNombre || item.institucion?.nombre || '',
        institucion: {
          nombre: item.iiee || item.institucionNombre || item.institucion?.nombre || '',
          codigoModular: item.codigoModular || item.institucion?.codigoModular || '000000',
          ugel: item.ugel || 'UGEL 03',
          dre: item.dre || 'DRE LIMA METROPOLITANA',
          region: 'Lima',
          provincia: 'Lima',
          distrito: 'Pueblo Libre'
        },
        tituloObra: item.titulo || item.tituloObra || '',
        seudonimo: item.seudonimo || '',
        urlTrabajo: item.enlace || item.urlTrabajo || '',
        estudiantes: item.estudiantes || [],
        docenteAsesor: item.docenteAsesor || {},
        origen: item.origen || "sice",
        importadoEl: ahora,
        importadoPor: usuarioNombre,
        estado: item.estado || "pendiente",
        ordenPresentacion: item.ordenPresentacion || 0,
        updatedAt: serverTimestamp()
      };

      batch.set(ref, payload, { merge: true });
      importados++;
    });

    await batch.commit();
  }

  return { importados, omitidos };
}

