/* ════════════════════════════════════════════════════════════════
   Crea o actualiza las credenciales de los 2 jurados de COPAE 2026.
   Usuario y contraseña: jurado{1|2}copae@ugel03.gob.pe
   Escribe usuarios/{uid} con rol "jurado" y modulo "copae".
   ════════════════════════════════════════════════════════════════ */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jurados = [
  {
    correo: 'jurado1copae@ugel03.gob.pe',
    nombreCompleto: 'Jurado Evaluador N.° 1',
    numeroJurado: 1,
    cargo: 'Jurado evaluador 1 — Precongreso COPAE UGEL 03'
  },
  {
    correo: 'jurado2copae@ugel03.gob.pe',
    nombreCompleto: 'Jurado Evaluador N.° 2',
    numeroJurado: 2,
    cargo: 'Jurado evaluador 2 — Precongreso COPAE UGEL 03'
  }
];

const rutaClave = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(rutaClave)) {
  console.error(`No se encontró la clave de cuenta de servicio (${rutaClave}).`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(rutaClave, 'utf8')))
});

const auth = admin.auth();
const db = admin.firestore();

let creadas = 0;
let actualizadas = 0;

for (const j of jurados) {
  const correo = j.correo.toLowerCase();
  let uid;
  try {
    const existente = await auth.getUserByEmail(correo);
    uid = existente.uid;
    await auth.updateUser(uid, {
      password: correo,
      displayName: j.nombreCompleto
    });
    actualizadas += 1;
    console.log(`Usuario Auth actualizado: ${correo}`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    const nuevo = await auth.createUser({
      email: correo,
      password: correo,
      displayName: j.nombreCompleto,
      emailVerified: true
    });
    uid = nuevo.uid;
    creadas += 1;
    console.log(`Usuario Auth creado: ${correo}`);
  }

  await db.collection('usuarios').doc(uid).set({
    nombre: j.nombreCompleto,
    nombreCompleto: j.nombreCompleto,
    email: correo,
    rol: 'jurado',
    modulo: 'copae',
    numeroJurado: j.numeroJurado,
    cargo: j.cargo,
    permisos: ['copae'],
    debeCambiarPassword: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`Firestore usuarios/${uid} configurado para: ${correo}`);
}

console.log(`\nProceso finalizado. Creadas: ${creadas}, Actualizadas: ${actualizadas}.`);
process.exit(0);
