/* ═══════════════════════════════════════════════════════════════
   FIRESTORE — CONCURSO NACIONAL CREA Y EMPRENDE 2026 (Etapa UGEL 03)

   Colecciones:
     cyeParticipantes     {id}                          proyectos importados del SICE
     cyeProyectoEstado    {id}                          decisión de admisión, grupo, inasistencia
     cyeEvaluaciones      {participanteId}__J{slot}     una ficha por casillero de jurado
     cyePanelFirmas       {scopeId}                     GLOBAL o CAT_A / CAT_B / CAT_C
     cyeConsolidados      CYE-2026__UGEL__{categoria}   D14: dirimencia y cierre
     cyeActas             CYE-2026__UGEL__{categoria}   D15
     cyeJurados           {correo}                      jurados agregados en el módulo
   ═══════════════════════════════════════════════════════════════ */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, writeBatch, getFirestore
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from './config';
import { CYE_CONFIG, SLOTS_JURADO, consolidadoIdCYE, categoriasDeGrupo } from '../data/creaEmprendeConfig';
import { credencialCYE, siguienteNumeroCredencial } from '../data/creaEmprendeJurados';
import { evaluacionIdCYE, soloDigitos, normalizarTexto } from '../utils/creaEmprendeHelpers';
import { scopeIdCYE, panelVacioCYE, invalidarCacheDeScopeCYE, ALCANCES_CYE } from '../utils/creaEmprendeFirmas';

const MAX_LOTE = 450;

function auditor(usuario) {
  return {
    uid: usuario?.uid || 'anon',
    correo: String(usuario?.email || usuario?.correo || '').trim().toLowerCase(),
    nombre: usuario?.nombreCompleto || usuario?.nombre || ''
  };
}

function ahoraISO() {
  return new Date().toISOString();
}

/* ─────────────────────────────────────────────────────────────
   1. PROYECTOS IMPORTADOS DEL SICE
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEParticipantes(cb) {
  return onSnapshot(collection(db, 'cyeParticipantes'), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.error('Error suscribiendo cyeParticipantes:', err);
    cb([]);
  });
}

export async function importarParticipantesCYE(proyectos = [], usuario) {
  const quien = auditor(usuario);
  for (let i = 0; i < proyectos.length; i += MAX_LOTE) {
    const lote = writeBatch(db);
    proyectos.slice(i, i + MAX_LOTE).forEach(p => {
      lote.set(doc(db, 'cyeParticipantes', p.id), {
        ...p,
        eventoId: CYE_CONFIG.eventoId,
        etapa: CYE_CONFIG.etapa,
        importadoPor: quien.correo,
        importadoEn: ahoraISO(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await lote.commit();
  }
  return proyectos.length;
}

/* ─────────────────────────────────────────────────────────────
   2. ESTADO DEL PROYECTO: ADMISIÓN, GRUPO E INASISTENCIA
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEProyectoEstado(cb) {
  return onSnapshot(collection(db, 'cyeProyectoEstado'), snap => {
    const mapa = {};
    snap.docs.forEach(d => { mapa[d.id] = { id: d.id, ...d.data() }; });
    cb(mapa);
  }, err => {
    console.error('Error suscribiendo cyeProyectoEstado:', err);
    cb({});
  });
}

/**
 * Registra una decisión de la comisión con motivo y deja la huella en el historial.
 * accion: 'admitir' | 'no_admitir' | 'readmitir' | 'restablecer' | 'grupo' | 'inasistencia'
 */
export async function actualizarEstadoProyectoCYE(participanteId, cambios = {}, usuario, { accion, motivo = '' } = {}) {
  const ref = doc(db, 'cyeProyectoEstado', participanteId);
  const snap = await getDoc(ref);
  const previo = snap.exists() ? snap.data() : {};
  const historial = Array.isArray(previo.historial) ? [...previo.historial] : [];
  historial.push({ accion: accion || 'actualizacion', motivo: normalizarTexto(motivo), ...auditor(usuario), en: ahoraISO() });
  await setDoc(ref, {
    ...cambios,
    participanteId,
    historial: historial.slice(-60),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ─────────────────────────────────────────────────────────────
   3. EVALUACIONES — una por proyecto y casillero de jurado
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEEvaluaciones({ categoria } = {}, cb) {
  const ref = collection(db, 'cyeEvaluaciones');
  const q = categoria ? query(ref, where('categoria', '==', categoria)) : ref;
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.error('Error suscribiendo cyeEvaluaciones:', err);
    cb([]);
  });
}

export async function getCYEEvaluaciones({ categoria } = {}) {
  const ref = collection(db, 'cyeEvaluaciones');
  const q = categoria ? query(ref, where('categoria', '==', categoria)) : ref;
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export class CasilleroOcupadoError extends Error {
  constructor(evaluador) {
    super(`Este casillero ya fue calificado por ${evaluador?.nombre || evaluador?.correo || 'otro evaluador'}. Elija un casillero libre.`);
    this.name = 'CasilleroOcupadoError';
    this.evaluador = evaluador;
  }
}

/**
 * Guarda la ficha de un casillero. El primer evaluador queda como responsable de la captura
 * (evaluadorOperativo). Otro jurado no puede sobrescribirla; el personal de la comisión sí,
 * para transcribir fichas físicas o corregir con autorización.
 */
export async function saveCYEEvaluacion(data, { usuario, esStaff = false, accion = 'guardado' } = {}) {
  const slot = Number(data?.jurado?.numeroJurado);
  if (!SLOTS_JURADO.includes(slot)) throw new Error(`El casillero debe ser ${SLOTS_JURADO.join(', ')}.`);
  if (!data.participanteId) throw new Error('La evaluación no tiene proyecto asociado.');

  const id = evaluacionIdCYE(data.participanteId, slot);
  const ref = doc(db, 'cyeEvaluaciones', id);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;
  const quien = auditor(usuario);

  if (existente?.evaluadorOperativo?.uid && existente.evaluadorOperativo.uid !== quien.uid && !esStaff) {
    throw new CasilleroOcupadoError(existente.evaluadorOperativo);
  }

  const historial = Array.isArray(existente?.historialEdiciones) ? [...existente.historialEdiciones] : [];
  if (accion !== 'autoguardado' || historial.length === 0) {
    historial.push({ accion, uid: quien.uid, correo: quien.correo, en: ahoraISO() });
  }

  const payload = {
    ...data,
    id,
    eventoId: CYE_CONFIG.eventoId,
    etapa: CYE_CONFIG.etapa,
    estado: data.estado === 'registrada' ? 'registrada' : 'borrador',
    evaluadorOperativo: existente?.evaluadorOperativo || { ...quien, grupo: usuario?.grupo || null, registradoEn: ahoraISO() },
    historialEdiciones: historial.slice(-50),
    updatedAt: serverTimestamp()
  };
  if (payload.estado === 'registrada' && !existente?.registradaEn) payload.registradaEn = ahoraISO();
  if (!existente) payload.createdAt = serverTimestamp();

  await setDoc(ref, payload, { merge: true });
  return id;
}

export async function reabrirCYEEvaluacion(id, usuario) {
  const ref = doc(db, 'cyeEvaluaciones', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const historial = Array.isArray(snap.data().historialEdiciones) ? [...snap.data().historialEdiciones] : [];
  const quien = auditor(usuario);
  historial.push({ accion: 'correccion', uid: quien.uid, correo: quien.correo, en: ahoraISO() });
  await updateDoc(ref, { estado: 'borrador', registradaEn: null, historialEdiciones: historial.slice(-50), updatedAt: serverTimestamp() });
}

export async function deleteCYEEvaluacion(id) {
  await deleteDoc(doc(db, 'cyeEvaluaciones', id));
}

/* ─────────────────────────────────────────────────────────────
   4. PANEL DE FIRMAS OFICIAL
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEPaneles(cb) {
  return onSnapshot(collection(db, 'cyePanelFirmas'), snap => {
    const mapa = {};
    snap.docs.forEach(d => { mapa[d.id] = { id: d.id, ...d.data() }; });
    cb(mapa);
  }, err => {
    console.error('Error suscribiendo cyePanelFirmas:', err);
    cb({});
  });
}

function limpiarFirmantes(firmantes = []) {
  return firmantes.map(f => ({ ...f, dni: soloDigitos(f.dni).slice(0, 8) }));
}

export async function guardarBorradorCYEPanel(panel, usuario) {
  const id = scopeIdCYE({ alcance: panel.alcance, categoria: panel.categoria });
  const ref = doc(db, 'cyePanelFirmas', id);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;
  if (existente?.estado === 'sellado') throw new Error('El panel está sellado. Debe reabrirlo un administrador.');

  const base = existente || panelVacioCYE({ alcance: panel.alcance, categoria: panel.categoria });
  const historial = Array.isArray(base.historial) ? [...base.historial] : [];
  historial.push({ accion: existente ? 'firmantes_modificados' : 'creado', ...auditor(usuario), en: ahoraISO() });

  await setDoc(ref, {
    ...base,
    ...panel,
    id,
    alcance: panel.alcance,
    categoria: panel.alcance === ALCANCES_CYE.GLOBAL ? null : panel.categoria,
    firmantes: limpiarFirmantes(panel.firmantes),
    estado: 'borrador',
    historial: historial.slice(-100),
    updatedAt: serverTimestamp(),
    ...(existente ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });
  return id;
}

export async function sellarCYEPanel(panel, usuario) {
  const id = scopeIdCYE({ alcance: panel.alcance, categoria: panel.categoria });
  const ref = doc(db, 'cyePanelFirmas', id);
  const snap = await getDoc(ref);
  const existente = snap.exists() ? snap.data() : null;
  const historial = Array.isArray(existente?.historial) ? [...existente.historial] : [];
  const quien = auditor(usuario);
  historial.push({ accion: 'sellado', ...quien, en: ahoraISO() });

  await setDoc(ref, {
    ...(existente || {}),
    ...panel,
    id,
    eventoId: CYE_CONFIG.eventoId,
    etapa: CYE_CONFIG.etapa,
    categoria: panel.alcance === ALCANCES_CYE.GLOBAL ? null : panel.categoria,
    firmantes: limpiarFirmantes(panel.firmantes),
    estado: 'sellado',
    selladoPor: { uid: quien.uid, correo: quien.correo },
    selladoEn: ahoraISO(),
    historial: historial.slice(-100),
    updatedAt: serverTimestamp(),
    ...(existente ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });
  return id;
}

export async function reabrirCYEPanel(scopeId, motivo, usuario) {
  const texto = normalizarTexto(motivo);
  if (texto.length < 10) throw new Error('Reabrir el panel exige un motivo de al menos 10 caracteres.');
  const ref = doc(db, 'cyePanelFirmas', scopeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('El panel indicado no existe.');
  const historial = Array.isArray(snap.data().historial) ? [...snap.data().historial] : [];
  historial.push({ accion: 'reabierto', motivo: texto, ...auditor(usuario), en: ahoraISO() });
  await updateDoc(ref, { estado: 'borrador', historial, updatedAt: serverTimestamp() });
  invalidarCacheDeScopeCYE(scopeId);
  return scopeId;
}

/* ─────────────────────────────────────────────────────────────
   5. CONSOLIDADO D14 — dirimencia y cierre
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEConsolidados(cb) {
  return onSnapshot(collection(db, 'cyeConsolidados'), snap => {
    const mapa = {};
    snap.docs.forEach(d => { mapa[d.id] = { id: d.id, ...d.data() }; });
    cb(mapa);
  }, err => {
    console.error('Error suscribiendo cyeConsolidados:', err);
    cb({});
  });
}

export async function guardarDirimenciaCYE(categoria, { criterio, orden }, usuario) {
  const texto = normalizarTexto(criterio);
  if (texto.length < 10) throw new Error('Describa el criterio de desempate acordado por el jurado (mínimo 10 caracteres).');
  const id = consolidadoIdCYE(categoria);
  await setDoc(doc(db, 'cyeConsolidados', id), {
    id, categoria, eventoId: CYE_CONFIG.eventoId, etapa: CYE_CONFIG.etapa,
    dirimencia: { criterio: texto, orden, registradaPor: auditor(usuario).correo, registradaEn: ahoraISO() },
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function cerrarCYEConsolidado(categoria, { filas }, usuario) {
  const id = consolidadoIdCYE(categoria);
  const quien = auditor(usuario);
  await setDoc(doc(db, 'cyeConsolidados', id), {
    id, categoria, eventoId: CYE_CONFIG.eventoId, etapa: CYE_CONFIG.etapa,
    estado: 'cerrado', filas, cerradoPor: quien.correo, cerradoEn: ahoraISO(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function reabrirCYEConsolidado(categoria, motivo, usuario) {
  const texto = normalizarTexto(motivo);
  if (texto.length < 10) throw new Error('Indique el motivo de la reapertura (mínimo 10 caracteres).');
  const id = consolidadoIdCYE(categoria);
  await setDoc(doc(db, 'cyeConsolidados', id), {
    estado: 'borrador', reabiertoPor: auditor(usuario).correo, reabiertoEn: ahoraISO(), motivoReapertura: texto,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ─────────────────────────────────────────────────────────────
   6. ACTA D15
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEActas(cb) {
  return onSnapshot(collection(db, 'cyeActas'), snap => {
    const mapa = {};
    snap.docs.forEach(d => { mapa[d.id] = { id: d.id, ...d.data() }; });
    cb(mapa);
  }, err => {
    console.error('Error suscribiendo cyeActas:', err);
    cb({});
  });
}

export async function guardarCYEActa(categoria, datos, usuario, { cerrar = false } = {}) {
  const id = consolidadoIdCYE(categoria);
  const quien = auditor(usuario);
  await setDoc(doc(db, 'cyeActas', id), {
    ...datos,
    id, categoria, eventoId: CYE_CONFIG.eventoId, etapa: CYE_CONFIG.etapa,
    estado: cerrar ? 'cerrada' : 'borrador',
    ...(cerrar ? { cerradaPor: quien.correo, cerradaEn: ahoraISO() } : {}),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ─────────────────────────────────────────────────────────────
   7. JURADOS AGREGADOS EN EL MÓDULO
   ───────────────────────────────────────────────────────────── */

export function subscribeCYEJurados(cb) {
  return onSnapshot(collection(db, 'cyeJurados'), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.error('Error suscribiendo cyeJurados:', err);
    cb([]);
  });
}

/**
 * Registra un jurado nuevo y, si se pide, crea su credencial grupo{G}jurado{N}@ugel03.gob.pe.
 * La cuenta se crea en una instancia secundaria de Firebase: la sesión de la especialista
 * no se cierra. El documento usuarios/{uid} lo escribe la propia cuenta nueva (las reglas
 * vigentes permiten que cada usuario escriba su documento); si falla, se intenta con la
 * sesión principal.
 */
export async function agregarJuradoCYE(datos, usuario, { juradosFirestore = [], crearCredencial = true } = {}) {
  const grupo = Number(datos.grupo);
  const dni = soloDigitos(datos.dni);
  if (!grupo || grupo < 1) throw new Error('Indique el número de grupo.');
  if (dni.length !== 8) throw new Error('El DNI debe tener exactamente 8 dígitos.');
  if (!normalizarTexto(datos.apellidos) || !normalizarTexto(datos.nombres)) throw new Error('Complete apellidos y nombres.');

  const numeroCredencial = siguienteNumeroCredencial(grupo, juradosFirestore);
  const correo = credencialCYE(grupo, numeroCredencial);
  const categorias = datos.categorias?.length ? datos.categorias : categoriasDeGrupo(grupo);
  const apellidos = normalizarTexto(datos.apellidos);
  const nombres = normalizarTexto(datos.nombres);
  const nombreCompleto = `${apellidos}, ${nombres}`.toUpperCase();

  let credencialCreada = false;
  let advertencia = '';

  if (crearCredencial) {
    const nombreApp = `CYE-Alta-${Date.now()}`;
    let secundaria = null;
    try {
      secundaria = initializeApp(firebaseConfig, nombreApp);
      const authSec = getAuth(secundaria);
      let uid = null;
      try {
        const cred = await createUserWithEmailAndPassword(authSec, correo, correo);
        uid = cred.user.uid;
        credencialCreada = true;
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          advertencia = 'La credencial ya existía en Firebase; se registró el jurado con esa credencial.';
        } else {
          throw new Error(`No se pudo crear la credencial: ${err.message}`);
        }
      }

      if (uid) {
        const perfil = {
          nombre: nombreCompleto,
          nombreCompleto,
          email: correo,
          rol: 'jurado',
          modulo: 'creayemprende',
          cargo: `Jurado calificador — Crea y Emprende (Grupo ${grupo})`,
          grupo,
          numeroCredencial,
          categoriasCYE: categorias,
          dni,
          institucion: normalizarTexto(datos.institucion),
          permisos: ['creayemprende'],
          debeCambiarPassword: false,
          createdAt: serverTimestamp()
        };
        try {
          await setDoc(doc(getFirestore(secundaria), 'usuarios', uid), perfil, { merge: true });
        } catch (errSec) {
          try {
            await setDoc(doc(db, 'usuarios', uid), perfil, { merge: true });
          } catch (errPri) {
            advertencia = 'La credencial se creó, pero no se pudo guardar el perfil del usuario. El jurado igual podrá ingresar: el sistema reconoce el correo.';
          }
        }
        await signOut(authSec).catch(() => {});
      }
    } finally {
      if (secundaria) await deleteApp(secundaria).catch(() => {});
    }
  }

  await setDoc(doc(db, 'cyeJurados', correo), {
    correo,
    grupo,
    numeroCredencial,
    categorias,
    apellidos,
    nombres,
    nombreCompleto,
    dni,
    institucion: normalizarTexto(datos.institucion),
    cargo: normalizarTexto(datos.cargo),
    credencialCreada: credencialCreada || Boolean(advertencia),
    registradoPor: auditor(usuario).correo,
    registradoEn: ahoraISO(),
    origen: 'alta'
  }, { merge: true });

  return { correo, contrasena: correo, credencialCreada, advertencia, numeroCredencial };
}

/* ─────────────────────────────────────────────────────────────
   8. CALIBRACIÓN PREVIA ENTRE GRUPOS
   cyeCalibracionConfig/actual      proyectos ancla, estado y acuerdos por criterio
   cyeCalibracionFichas/{cat}__{uid} calificación individual de cada jurado
   Nada de esto interviene en los resultados oficiales.
   ───────────────────────────────────────────────────────────── */

export function subscribeCYECalibracionConfig(cb) {
  return onSnapshot(doc(db, 'cyeCalibracionConfig', 'actual'), snap => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, err => {
    console.error('Error suscribiendo cyeCalibracionConfig:', err);
    cb(null);
  });
}

export async function guardarCYECalibracionConfig(cambios, usuario) {
  await setDoc(doc(db, 'cyeCalibracionConfig', 'actual'), {
    ...cambios,
    actualizadoPor: auditor(usuario).correo,
    actualizadoEn: ahoraISO(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function subscribeCYECalibracionFichas(cb) {
  return onSnapshot(collection(db, 'cyeCalibracionFichas'), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.error('Error suscribiendo cyeCalibracionFichas:', err);
    cb([]);
  });
}

export async function guardarCYECalibracionFicha({ categoria, participanteId, puntajes, estado, puntajeTotal, completa }, usuario) {
  const quien = auditor(usuario);
  const id = `${categoria}__${quien.uid}`;
  await setDoc(doc(db, 'cyeCalibracionFichas', id), {
    id,
    categoria,
    participanteId,
    puntajes,
    puntajeTotal,
    completa,
    estado: estado === 'enviada' ? 'enviada' : 'borrador',
    jurado: { uid: quien.uid, correo: quien.correo, nombre: quien.nombre, grupo: usuario?.grupo || null },
    ...(estado === 'enviada' ? { enviadaEn: ahoraISO() } : {}),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

/** Reemplaza por completo los acuerdos de una categoría (permite borrar acuerdos). */
export async function guardarAcuerdosCalibracionCYE(categoria, acuerdos, usuario) {
  const ref = doc(db, 'cyeCalibracionConfig', 'actual');
  await setDoc(ref, { actualizadoPor: auditor(usuario).correo, actualizadoEn: ahoraISO(), updatedAt: serverTimestamp() }, { merge: true });
  await updateDoc(ref, { [`acuerdos.${categoria}`]: acuerdos });
}
