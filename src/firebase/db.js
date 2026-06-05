/* ════════════════════════════════════════════════════════════════
   Firestore Data Access Layer — AGEBATP UGEL 03
   ════════════════════════════════════════════════════════════════ */

import { db } from "./config";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

// Helper to safely convert Firestore timestamps to ISO strings for compatibility
export function mapDoc(docSnap) {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
  };
}

// ── USUARIOS ──
export function subscribeUsuarios(callback) {
  const q = query(collection(db, "usuarios"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to usuarios:", err));
}

export async function getUsuario(uid) {
  const docSnap = await getDoc(doc(db, "usuarios", uid));
  return mapDoc(docSnap);
}

export async function updateUsuario(uid, data) {
  const ref = doc(db, "usuarios", uid);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ── ACTIVIDADES ──
export function subscribeActividades(callback) {
  const q = query(collection(db, "actividades"), orderBy("date", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to actividades:", err));
}

export async function addActividad(data) {
  const id = data.id || `ACT-${Date.now()}`;
  const ref = doc(db, "actividades", id);
  const docData = {
    ...data,
    id,
    checklist: data.checklist || {},
    progreso: data.progreso || 0,
    estado: data.estado || "pendiente",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, docData);
  return id;
}

export async function updateActividad(id, data) {
  const ref = doc(db, "actividades", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteActividad(id) {
  const ref = doc(db, "actividades", id);
  await deleteDoc(ref);
}

// ── EVIDENCIAS (Subcolección de Actividades) ──
export function subscribeEvidencias(actId, callback) {
  const q = query(collection(db, "actividades", actId, "evidencias"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error(`Error subscribing to evidencias for ${actId}:`, err));
}

export async function addEvidencia(actId, data) {
  const collRef = collection(db, "actividades", actId, "evidencias");
  const docData = {
    ...data,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collRef, docData);
  return docRef.id;
}

// ── REUNIONES ──
export function subscribeReuniones(callback) {
  const q = query(collection(db, "reuniones"), orderBy("fecha", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to reuniones:", err));
}

export async function addReunion(data) {
  const id = data.id || `REU-${Date.now()}`;
  const ref = doc(db, "reuniones", id);
  const docData = {
    ...data,
    id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, docData);
  return id;
}

export async function updateReunion(id, data) {
  const ref = doc(db, "reuniones", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ── MONITOREO SEMANAL ──
export function subscribeMonitoreoSemanal(callback) {
  const q = query(collection(db, "monitoreoSemanal"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to monitoreoSemanal:", err));
}

export async function setMonitoreoSemanal(semana, data) {
  const ref = doc(db, "monitoreoSemanal", semana);
  await setDoc(ref, {
    ...data,
    semana,
    updatedAt: serverTimestamp()
  });
}

// ── MONITOREO ACUMULADO ──
export function subscribeMonitoreoAcumulado(callback) {
  const q = query(collection(db, "monitoreoAcumulado"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to monitoreoAcumulado:", err));
}

export async function setMonitoreoAcumulado(id, data) {
  const ref = doc(db, "monitoreoAcumulado", id);
  await setDoc(ref, {
    ...data,
    id,
    updatedAt: serverTimestamp()
  });
}

// ── E-SINAD SEMANAS ──
export function subscribeEsinadSemanas(callback) {
  const q = query(collection(db, "esinadSemanas"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to esinadSemanas:", err));
}

export async function addEsinadSemana(data) {
  const id = data.id || `SINAD-${Date.now()}`;
  const ref = doc(db, "esinadSemanas", id);
  await setDoc(ref, {
    ...data,
    id,
    createdAt: serverTimestamp()
  });
  return id;
}

export async function deleteEsinadSemana(id) {
  const ref = doc(db, "esinadSemanas", id);
  await deleteDoc(ref);
}


// ── DIRECTORIO CEBA ──
export function subscribeDirectorioCeba(callback) {
  const q = query(collection(db, "directorioCeba"), orderBy("nombre", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to directorioCeba:", err));
}

export async function addCeba(data) {
  const collRef = collection(db, "directorioCeba");
  const docRef = await addDoc(collRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCeba(id, data) {
  const ref = doc(db, "directorioCeba", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCeba(id) {
  const ref = doc(db, "directorioCeba", id);
  await deleteDoc(ref);
}

function slugify(text) {
  return (text || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 60) || `auto-${Date.now()}`;
}

function getCebaId(item) {
  return (item.codigoModularAvanzado && String(item.codigoModularAvanzado).trim()) ||
         (item.codigoModularInicialIntermedio && String(item.codigoModularInicialIntermedio).trim()) ||
         (item.codModular && String(item.codModular).trim()) ||
         slugify(item.nombre);
}

export async function batchSetCebas(items, userId, userName) {
  // Firestore writeBatch max = 500 operations; chunk if needed
  const BATCH_SIZE = 450;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const id = getCebaId(item);
      const ref = doc(db, "directorioCeba", id);
      batch.set(ref, {
        ...item,
        id,
        actualizadoPor: userName || userId || 'sistema',
        actualizadoEn: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }
}

// ── DIRECTORIO CETPRO ──
export function subscribeDirectorioCetpro(callback) {
  const q = query(collection(db, "directorioCetpro"), orderBy("nombre", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to directorioCetpro:", err));
}

export async function addCetpro(data) {
  const collRef = collection(db, "directorioCetpro");
  const docRef = await addDoc(collRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCetpro(id, data) {
  const ref = doc(db, "directorioCetpro", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCetpro(id) {
  const ref = doc(db, "directorioCetpro", id);
  await deleteDoc(ref);
}

function getCetproId(item) {
  return (item.codigoModular && String(item.codigoModular).trim()) ||
         (item.codModular && String(item.codModular).trim()) ||
         slugify(item.nombre);
}

export async function batchSetCetpros(items, userId, userName) {
  const BATCH_SIZE = 450;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const id = getCetproId(item);
      const ref = doc(db, "directorioCetpro", id);
      batch.set(ref, {
        ...item,
        id,
        actualizadoPor: userName || userId || 'sistema',
        actualizadoEn: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }
}

// ── REQUERIMIENTOS CEBA ──
export function subscribeReqCeba(callback) {
  const q = query(collection(db, "requerimientosCeba"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to requerimientosCeba:", err));
}

export async function setReqCeba(id, data) {
  const ref = doc(db, "requerimientosCeba", id);
  await setDoc(ref, {
    ...data,
    id,
    updatedAt: serverTimestamp()
  });
}

export async function batchSetReqCeba(items) {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const id = item.id || doc(collection(db, "requerimientosCeba")).id;
    const ref = doc(db, "requerimientosCeba", id);
    batch.set(ref, {
      ...item,
      id,
      updatedAt: serverTimestamp()
    });
  });
  await batch.commit();
}

export async function deleteReqCeba(id) {
  const ref = doc(db, "requerimientosCeba", id);
  await deleteDoc(ref);
}

// ── REQUERIMIENTOS CETPRO ──
export function subscribeReqCetpro(callback) {
  const q = query(collection(db, "requerimientosCetpro"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to requerimientosCetpro:", err));
}

export async function setReqCetpro(id, data) {
  const ref = doc(db, "requerimientosCetpro", id);
  await setDoc(ref, {
    ...data,
    id,
    updatedAt: serverTimestamp()
  });
}

export async function batchSetReqCetpro(items) {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const id = item.id || doc(collection(db, "requerimientosCetpro")).id;
    const ref = doc(db, "requerimientosCetpro", id);
    batch.set(ref, {
      ...item,
      id,
      updatedAt: serverTimestamp()
    });
  });
  await batch.commit();
}

export async function deleteReqCetpro(id) {
  const ref = doc(db, "requerimientosCetpro", id);
  await deleteDoc(ref);
}

// ── MATRIZ DE REFERENCIA ──
export async function getMatriz(tipo) {
  const docSnap = await getDoc(doc(db, "matrizReferencia", tipo));
  return mapDoc(docSnap);
}

export async function setMatriz(tipo, data) {
  const ref = doc(db, "matrizReferencia", tipo);
  await setDoc(ref, {
    ...data,
    tipo,
    updatedAt: serverTimestamp()
  });
}

// ── CONFIGURACION GENERAL ──
export function subscribeConfig(id, callback) {
  const ref = doc(db, "config", id);
  return onSnapshot(ref, (snapshot) => {
    callback(mapDoc(snapshot));
  }, (err) => console.error(`Error subscribing to config ${id}:`, err));
}

export async function getConfig(id) {
  const docSnap = await getDoc(doc(db, "config", id));
  return mapDoc(docSnap);
}

export async function setConfig(id, data) {
  const ref = doc(db, "config", id);
  await setDoc(ref, {
    ...data,
    id,
    updatedAt: serverTimestamp()
  });
}

// ── RECLAMACIONES ──
export async function addReclamacion(data) {
  // Generate code: REC-YYYY-XXXXX
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  const codigo = `REC-${year}-${rand}`;
  
  const id = codigo;
  const ref = doc(db, "reclamaciones", id);
  const docData = {
    ...data,
    codigo,
    id,
    estado: 'pendiente',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, docData);
  return docData;
}

export function subscribeReclamaciones(callback) {
  const q = query(collection(db, "reclamaciones"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to reclamaciones:", err));
}

