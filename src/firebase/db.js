/* ════════════════════════════════════════════════════════════════
   Firestore Data Access Layer — AGEBATP UGEL 03
   ════════════════════════════════════════════════════════════════ */

import { db, firebaseConfig } from "./config";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
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
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { computePersonas, claveDoc } from "../utils/esinadHelpers";

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
    const list = snapshot.docs.map(mapDoc).map(a => {
      const progress = (a.progreso !== undefined && a.progreso !== null) ? a.progreso : (a.progress ?? 0);
      const status   = a.estado ?? a.status ?? 'pendiente';
      return { ...a, progress, progreso: progress, status, estado: status };
    });
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
    progress: data.progress || 0,
    progreso: data.progreso || 0,
    status: data.status || "pendiente",
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

/**
 * Fusión transaccional idempotente a esinadSemanas.
 * Lee el documento existente → fusiona documentos (por tipoDocumento)
 * y movimientos (por hash) → recalcula personas → escribe con merge.
 * Re-ejecutar con los mismos datos da el mismo resultado (idempotente).
 */
export async function mergeEsinadSemana(weekId, nuevosDocs, nuevosMov, meta = {}) {
  const ref = doc(db, "esinadSemanas", weekId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? snap.data() : {};
    // documentos: fusiona por tipoDocumento (clave única)
    const dMap = new Map();
    (prev.documentos || []).forEach(d => dMap.set(claveDoc(d), d));
    nuevosDocs.forEach(d => {
      const { semana, ...rest } = d;
      dMap.set(claveDoc(d), { ...(dMap.get(claveDoc(d)) || {}), ...rest });
    });
    const documentos = [...dMap.values()];
    // movimientos: fusiona por hash
    const mMap = new Map();
    (prev.movimientos || []).forEach(m => mMap.set(m.hash, m));
    nuevosMov.forEach(m => mMap.set(m.hash, { personId: m.personId, hash: m.hash }));
    const movimientos = [...mMap.values()];
    const payload = {
      id: weekId,
      semana: weekId,
      documentos,
      movimientos,
      personas: computePersonas(documentos, movimientos),
      totalFilas: movimientos.length,
      fechaCarga: new Date().toISOString(),
      nombreArchivo: meta.nombreArchivo || "Carga manual",
      origen: meta.origen || "manual",
    };
    if (!snap.exists()) payload.createdAt = serverTimestamp();
    tx.set(ref, payload, { merge: true });
  });
}

export async function uploadEsinadExcelData(weekRecords, monitoreoRecords, acumuladoData) {
  const BATCH_SIZE = 450;

  // 1. Clear all existing esinadSemanas
  const esinadSnap = await getDocs(collection(db, "esinadSemanas"));
  const esinadDocs = esinadSnap.docs;
  for (let i = 0; i < esinadDocs.length; i += BATCH_SIZE) {
    const chunk = esinadDocs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  // 2. Clear all existing monitoreoSemanal
  const monitoreoSnap = await getDocs(collection(db, "monitoreoSemanal"));
  const monitoreoDocs = monitoreoSnap.docs;
  for (let i = 0; i < monitoreoDocs.length; i += BATCH_SIZE) {
    const chunk = monitoreoDocs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  // 3. Write new weekRecords to esinadSemanas
  for (let i = 0; i < weekRecords.length; i += BATCH_SIZE) {
    const chunk = weekRecords.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(record => {
      const id = record.semana || `SINAD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const ref = doc(db, "esinadSemanas", id);
      batch.set(ref, {
        ...record,
        id,
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
  }

  // 4. Write new monitoreoRecords to monitoreoSemanal
  for (let i = 0; i < monitoreoRecords.length; i += BATCH_SIZE) {
    const chunk = monitoreoRecords.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(record => {
      const ref = doc(db, "monitoreoSemanal", record.semana);
      batch.set(ref, {
        ...record,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }

  // 5. Update monitoreoAcumulado resumen
  const resumenRef = doc(db, "monitoreoAcumulado", "resumen");
  await setDoc(resumenRef, {
    values: acumuladoData,
    id: "resumen",
    updatedAt: serverTimestamp()
  });
}

export async function deleteEsinadSemanaAndSync(semana, newAcumuladoData) {
  // 1. Delete from esinadSemanas
  const esinadRef = doc(db, "esinadSemanas", semana);
  await deleteDoc(esinadRef);

  // 2. Delete from monitoreoSemanal
  const monitoreoRef = doc(db, "monitoreoSemanal", semana);
  await deleteDoc(monitoreoRef);

  // 3. Update monitoreoAcumulado
  const resumenRef = doc(db, "monitoreoAcumulado", "resumen");
  await setDoc(resumenRef, {
    values: newAcumuladoData,
    id: "resumen",
    updatedAt: serverTimestamp()
  });
}

// ── AUXILIAR: CREAR CREDENCIALES PARA DIRECTORES (E-mail + DNI) ──
export async function crearCredencialesDirector(email, dni, nombre, institucionId, institucionTipo, cargo) {
  if (!email || !dni || dni.trim().length < 6 || !email.includes("@")) {
    console.warn(`No se pueden crear credenciales para ${nombre}: correo o DNI no válido.`, { email, dni });
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanDni = dni.trim();

  let uid = null;
  const secondaryAppName = `TempSec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let secondaryApp = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanDni);
    uid = userCredential.user.uid;
    console.log(`[Auth] Usuario creado exitosamente: ${cleanEmail}`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`[Auth] El correo ${cleanEmail} ya está en uso.`);
    } else {
      console.error(`[Auth] Error al registrar ${cleanEmail}:`, error);
    }
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(e => console.error("Error al destruir app secundaria:", e));
    }
  }

  try {
    let finalUid = uid;
    if (!finalUid) {
      const q = query(collection(db, "usuarios"), where("email", "==", cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        finalUid = snap.docs[0].id;
      }
    }

    if (finalUid) {
      const userRef = doc(db, "usuarios", finalUid);
      await setDoc(userRef, {
        nombre: nombre.trim(),
        email: cleanEmail,
        rol: "director",
        institucionId: institucionId,
        institucionTipo: institucionTipo,
        cargo: cargo || "Director",
        dni: cleanDni,
        debeCambiarPassword: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Registro de usuario guardado para ${cleanEmail}`);
    }
  } catch (err) {
    console.error(`[Firestore] Error al registrar datos de usuario para ${cleanEmail}:`, err);
  }
}

export async function crearCredencialesDirectorBatch(directores) {
  const validDirectores = directores.filter(d => d.email && d.dni && d.dni.trim().length >= 6 && d.email.includes("@"));
  if (validDirectores.length === 0) return;

  const secondaryAppName = `TempSecBatch-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let secondaryApp = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    for (const d of validDirectores) {
      const cleanEmail = d.email.trim().toLowerCase();
      const cleanDni = d.dni.trim();
      let uid = null;

      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanDni);
        uid = userCredential.user.uid;
        console.log(`[Batch-Auth] Usuario creado: ${cleanEmail}`);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          const q = query(collection(db, "usuarios"), where("email", "==", cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            uid = snap.docs[0].id;
          }
        } else {
          console.error(`[Batch-Auth] Error para ${cleanEmail}:`, error);
        }
      }

      if (uid) {
        try {
          const userRef = doc(db, "usuarios", uid);
          await setDoc(userRef, {
            nombre: d.nombre.trim(),
            email: cleanEmail,
            rol: "director",
            institucionId: d.institucionId,
            institucionTipo: d.institucionTipo,
            cargo: d.cargo || "Director",
            dni: cleanDni,
            debeCambiarPassword: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log(`[Batch-Firestore] Guardado: ${cleanEmail}`);
        } catch (err) {
          console.error(`[Batch-Firestore] Error para ${cleanEmail}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`[Batch] Error general en proceso por lote:`, err);
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(e => console.error("Error al destruir app secundaria batch:", e));
    }
  }
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
  
  // Crear credenciales
  const fullName = [data.nombres, data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(" ");
  await crearCredencialesDirector(data.correoInstitucional, data.dni, fullName || data.nombre, docRef.id, "CEBA", data.cargo);

  return docRef.id;
}

export async function updateCeba(id, data) {
  const ref = doc(db, "directorioCeba", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });

  // Crear o actualizar credenciales
  const fullName = [data.nombres, data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(" ");
  await crearCredencialesDirector(data.correoInstitucional, data.dni, fullName || data.nombre, id, "CEBA", data.cargo);
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
  const directoresToCreate = [];

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

      const fullName = [item.nombres, item.apellidoPaterno, item.apellidoMaterno].filter(Boolean).join(" ");
      directoresToCreate.push({
        email: item.correoInstitucional,
        dni: item.dni,
        nombre: fullName || item.nombre,
        institucionId: id,
        institucionTipo: "CEBA",
        cargo: item.cargo
      });
    });
    await batch.commit();
  }

  // Crear credenciales en batch
  await crearCredencialesDirectorBatch(directoresToCreate);
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

  const fullName = [data.nombres, data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(" ");
  await crearCredencialesDirector(data.correoInstitucional, data.dni, fullName || data.nombre, docRef.id, "CETPRO", data.cargo);

  return docRef.id;
}

export async function updateCetpro(id, data) {
  const ref = doc(db, "directorioCetpro", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });

  const fullName = [data.nombres, data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(" ");
  await crearCredencialesDirector(data.correoInstitucional, data.dni, fullName || data.nombre, id, "CETPRO", data.cargo);
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
  const directoresToCreate = [];

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

      const fullName = [item.nombres, item.apellidoPaterno, item.apellidoMaterno].filter(Boolean).join(" ");
      directoresToCreate.push({
        email: item.correoInstitucional,
        dni: item.dni,
        nombre: fullName || item.nombre,
        institucionId: id,
        institucionTipo: "CETPRO",
        cargo: item.cargo
      });
    });
    await batch.commit();
  }

  // Crear credenciales en batch
  await crearCredencialesDirectorBatch(directoresToCreate);
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

// ── MONITOREO DOCENTE (EBA / ETP) ──
export function colMonitoreoDocente(programa) {
  return programa === 'ETP' ? 'monitoreoDocenteEtp' : 'monitoreoDocenteEba';
}

export function subscribeMonitoreoDocente(programa, callback) {
  const colName = colMonitoreoDocente(programa);
  const q = query(collection(db, colName), orderBy("fechaEjecucionISO", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error(`Error subscribing to ${colName}:`, err));
}

export async function batchSetMonitoreoDocente(programa, items, userId, userName) {
  const colName = colMonitoreoDocente(programa);
  const BATCH_SIZE = 450;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(record => {
      const id = record.id;
      const ref = doc(db, colName, id);
      batch.set(ref, {
        ...record,
        cargadoPor: userName,
        cargadoPorUid: userId,
        createdAt: record.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }
}

export async function deleteMonitoreoDocente(programa, id) {
  const colName = colMonitoreoDocente(programa);
  const ref = doc(db, colName, id);
  await deleteDoc(ref);
}

export async function updateMonitoreoDocente(programa, id, data) {
  const colName = colMonitoreoDocente(programa);
  const ref = doc(db, colName, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ── MONITOREO DIRECTOR (EBA / ETP) ──
export function colMonitoreoDirector(programa) {
  return programa === 'ETP' ? 'monitoreoDirectorEtp' : 'monitoreoDirectorEba';
}

export function subscribeMonitoreoDirector(programa, callback) {
  const colName = colMonitoreoDirector(programa);
  const q = query(collection(db, colName), orderBy("fechaEjecucionISO", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error(`Error subscribing to ${colName}:`, err));
}

export async function batchSetMonitoreoDirector(programa, items, userId, userName) {
  const colName = colMonitoreoDirector(programa);
  const BATCH_SIZE = 450;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(record => {
      const id = record.id;
      const ref = doc(db, colName, id);
      batch.set(ref, {
        ...record,
        cargadoPor: userName,
        cargadoPorUid: userId,
        createdAt: record.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }
}

export async function deleteMonitoreoDirector(programa, id) {
  const colName = colMonitoreoDirector(programa);
  const ref = doc(db, colName, id);
  await deleteDoc(ref);
}

export async function updateMonitoreoDirector(programa, id, data) {
  const colName = colMonitoreoDirector(programa);
  const ref = doc(db, colName, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ── INFORMES Y OFICIOS DE MONITOREO ──
export function subscribeInformesMonitoreo(callback) {
  const q = query(collection(db, "informesMonitoreo"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(mapDoc);
    callback(list);
  }, (err) => console.error("Error subscribing to informesMonitoreo:", err));
}

export async function addInformeMonitoreo(data) {
  const id = data.id || `INF-${Date.now()}`;
  const ref = doc(db, "informesMonitoreo", id);
  const docData = {
    ...data,
    id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, docData);
  return id;
}

export async function updateInformeMonitoreo(id, data) {
  const ref = doc(db, "informesMonitoreo", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteInformeMonitoreo(id) {
  const ref = doc(db, "informesMonitoreo", id);
  await deleteDoc(ref);
}

export async function getInformeMonitoreo(id) {
  const docSnap = await getDoc(doc(db, "informesMonitoreo", id));
  return mapDoc(docSnap);
}

