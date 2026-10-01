/* ═══════════════════════════════════════════════════════════════
   PRECONGRESO DE COPAE – UGEL 03 — CAPA DE DATOS FIRESTORE
   Colecciones:
     copaeParticipantes   {id} (19 CEBAs)
     copaeEvaluaciones    {cebaId}__J{numeroJurado}
     copaePanelFirmas     GLOBAL (Gobernanza de las 2 firmas de jurados)
     copaeConsolidado     GLOBAL (Observación final del jurado y metadata)
   ═══════════════════════════════════════════════════════════════ */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { COPAE_CONFIG, CEBAS_PARTICIPANTES_COPAE, SLOTS_JURADO_COPAE } from '../data/copaeConfig';
import { evaluacionIdCOPAE, calcularPuntajeFicha } from '../utils/copaeHelpers';
import { SCOPE_COPAE_GLOBAL, panelVacioCOPAE } from '../utils/copaeFirmas';

/* ─────────────────────────────────────────────────────────────
   1. PARTICIPANTES (CEBAs)
   ───────────────────────────────────────────────────────────── */

export function subscribeCOPAEParticipantes(cb) {
  const q = collection(db, 'copaeParticipantes');
  return onSnapshot(q, snapshot => {
    if (snapshot.empty) {
      // Si la colección está vacía en Firestore, usamos la semilla por defecto
      cb(CEBAS_PARTICIPANTES_COPAE);
    } else {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      cb(list);
    }
  }, error => {
    console.error('Error suscribiendo copaeParticipantes:', error);
    cb(CEBAS_PARTICIPANTES_COPAE);
  });
}

/**
 * Asegura que los 19 CEBAs estén persistidos en Firestore.
 */
export async function asegurarParticipantesCOPAE() {
  try {
    const snap = await getDocs(collection(db, 'copaeParticipantes'));
    if (snap.empty) {
      const batch = writeBatch(db);
      CEBAS_PARTICIPANTES_COPAE.forEach(ceba => {
        const ref = doc(db, 'copaeParticipantes', ceba.id);
        batch.set(ref, {
          ...ceba,
          eventoId: COPAE_CONFIG.eventoId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      console.log('Se sembraron exitosamente los 19 CEBAs de COPAE.');
    }
  } catch (err) {
    console.warn('Asegurar participantes COPAE:', err);
  }
}

/* ─────────────────────────────────────────────────────────────
   2. EVALUACIONES INDIVIDUALES
   ───────────────────────────────────────────────────────────── */

export function subscribeCOPAEEvaluaciones(cb) {
  const q = collection(db, 'copaeEvaluaciones');
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(list);
  }, error => {
    console.error('Error suscribiendo copaeEvaluaciones:', error);
    cb([]);
  });
}

export async function saveCOPAEEvaluacion(data, { usuario } = {}) {
  const cebaId = data.cebaId;
  const numeroJurado = Number(data.numeroJurado);
  if (!cebaId || !SLOTS_JURADO_COPAE.includes(numeroJurado)) {
    throw new Error('Datos incompletos para guardar la evaluación de COPAE.');
  }

  const docId = evaluacionIdCOPAE(cebaId, numeroJurado);
  const ref = doc(db, 'copaeEvaluaciones', docId);
  const puntajeTotal = calcularPuntajeFicha(data.puntajes, Boolean(data.esNsp));

  const payload = {
    ...data,
    id: docId,
    cebaId,
    numeroJurado,
    puntajeTotal,
    esNsp: Boolean(data.esNsp),
    observaciones: data.observaciones || '',
    fecha: data.fecha || COPAE_CONFIG.fechaPorDefecto,
    eventoId: COPAE_CONFIG.eventoId,
    evaluadorOperativo: {
      uid: usuario?.uid || 'anon',
      correo: usuario?.email || usuario?.correo || '',
      nombreCompleto: usuario?.nombreCompleto || usuario?.nombre || `Jurado ${numeroJurado}`
    },
    updatedAt: serverTimestamp()
  };

  await setDoc(ref, payload, { merge: true });
  return docId;
}

export async function deleteCOPAEEvaluacion(cebaId, numeroJurado) {
  const docId = evaluacionIdCOPAE(cebaId, numeroJurado);
  const ref = doc(db, 'copaeEvaluaciones', docId);
  await deleteDoc(ref);
}

/* ─────────────────────────────────────────────────────────────
   3. PANEL DE FIRMAS OFICIAL (GOBERNANZA DE LOS 2 JURADOS)
   ───────────────────────────────────────────────────────────── */

export function subscribeCOPAEPanel(cb) {
  const ref = doc(db, 'copaePanelFirmas', SCOPE_COPAE_GLOBAL);
  return onSnapshot(ref, snap => {
    if (snap.exists()) {
      cb({ id: snap.id, ...snap.data() });
    } else {
      cb(panelVacioCOPAE());
    }
  }, error => {
    console.error('Error suscribiendo copaePanelFirmas:', error);
    cb(panelVacioCOPAE());
  });
}

export async function guardarBorradorCOPAEPanel(panel, usuario) {
  const ref = doc(db, 'copaePanelFirmas', SCOPE_COPAE_GLOBAL);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;

  if (existente && existente.estado === 'sellado') {
    throw new Error('El panel está sellado. Debe reabrirse antes de modificar firmas o datos.');
  }

  const payload = {
    ...panelVacioCOPAE(),
    ...panel,
    id: SCOPE_COPAE_GLOBAL,
    estado: 'borrador',
    eventoId: COPAE_CONFIG.eventoId,
    modificadoPor: {
      uid: usuario?.uid || 'anon',
      correo: usuario?.email || usuario?.correo || ''
    },
    updatedAt: serverTimestamp(),
    ...(existente ? {} : { createdAt: serverTimestamp() })
  };

  await setDoc(ref, payload, { merge: true });
  return SCOPE_COPAE_GLOBAL;
}

export async function sellarCOPAEPanel(panel, usuario) {
  const ref = doc(db, 'copaePanelFirmas', SCOPE_COPAE_GLOBAL);
  const ahora = new Date().toISOString();

  const payload = {
    ...panelVacioCOPAE(),
    ...panel,
    id: SCOPE_COPAE_GLOBAL,
    estado: 'sellado',
    eventoId: COPAE_CONFIG.eventoId,
    selladoEn: ahora,
    selladoPor: {
      uid: usuario?.uid || 'anon',
      correo: usuario?.email || usuario?.correo || '',
      nombre: usuario?.nombreCompleto || usuario?.nombre || 'Administrador'
    },
    updatedAt: serverTimestamp()
  };

  await setDoc(ref, payload, { merge: true });
  return SCOPE_COPAE_GLOBAL;
}

export async function reabrirCOPAEPanel(motivo, usuario) {
  const ref = doc(db, 'copaePanelFirmas', SCOPE_COPAE_GLOBAL);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const existente = snap.data();
  const historialReaperturas = Array.isArray(existente.historialReaperturas)
    ? [...existente.historialReaperturas]
    : [];

  historialReaperturas.push({
    motivo: motivo || 'Corrección solicitada',
    reabiertoPor: usuario?.email || usuario?.nombre || 'Administrador',
    reabiertoEn: new Date().toISOString()
  });

  await setDoc(ref, {
    estado: 'borrador',
    historialReaperturas,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ─────────────────────────────────────────────────────────────
   4. CONSOLIDADO Y OBSERVACIÓN FINAL DEL JURADO
   ───────────────────────────────────────────────────────────── */

export function subscribeCOPAEConsolidado(cb) {
  const ref = doc(db, 'copaeConsolidado', SCOPE_COPAE_GLOBAL);
  return onSnapshot(ref, snap => {
    if (snap.exists()) {
      cb({ id: snap.id, ...snap.data() });
    } else {
      cb({ observacionFinal: '', updatedAt: null });
    }
  }, error => {
    console.error('Error suscribiendo copaeConsolidado:', error);
    cb({ observacionFinal: '', updatedAt: null });
  });
}

export async function guardarObservacionFinalCOPAE(observacion, usuario) {
  const ref = doc(db, 'copaeConsolidado', SCOPE_COPAE_GLOBAL);
  await setDoc(ref, {
    observacionFinal: observacion || '',
    actualizadoPor: {
      uid: usuario?.uid || 'anon',
      correo: usuario?.email || usuario?.correo || ''
    },
    updatedAt: serverTimestamp()
  }, { merge: true });
}
