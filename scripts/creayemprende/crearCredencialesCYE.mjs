/* ════════════════════════════════════════════════════════════════
   Crea o actualiza las credenciales de los jurados de Crea y Emprende 2026.
   Usuario y contraseña: grupo{G}jurado{N}@ugel03.gob.pe (en minúsculas).
   Escribe usuarios/{uid} con rol "jurado" y modulo "creayemprende": sin ese documento
   las reglas de Firestore no permiten calificar.

   Uso (desde la raíz del proyecto):
     node scripts/creayemprende/crearCredencialesCYE.mjs --dry-run   (solo muestra)
     node scripts/creayemprende/crearCredencialesCYE.mjs             (crea o actualiza)
   Requiere serviceAccountKey.json o la variable FIREBASE_SERVICE_ACCOUNT_KEY.
   ════════════════════════════════════════════════════════════════ */

import admin from 'firebase-admin';
import fs from 'fs';

const jurados = JSON.parse(fs.readFileSync(new URL('./jurados-cye-2026.json', import.meta.url), 'utf8'));
const soloMostrar = process.argv.includes('--dry-run');

if (soloMostrar) {
  jurados.forEach(j => console.log(`${j.correo.padEnd(32)} Grupo ${j.grupo}  ${j.nombreCompleto}  DNI ${j.dni}`));
  console.log(`\n${jurados.length} credenciales. No se escribió nada.`);
  process.exit(0);
}

const rutaClave = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './serviceAccountKey.json';
if (!fs.existsSync(rutaClave)) {
  console.error(`No se encontró la clave de cuenta de servicio (${rutaClave}).`);
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(rutaClave, 'utf8'))) });
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
    await auth.updateUser(uid, { password: correo, displayName: j.nombreCompleto });
    actualizadas += 1;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    const nuevo = await auth.createUser({ email: correo, password: correo, displayName: j.nombreCompleto, emailVerified: true });
    uid = nuevo.uid;
    creadas += 1;
  }
  await db.collection('usuarios').doc(uid).set({
    nombre: j.nombreCompleto,
    nombreCompleto: j.nombreCompleto,
    email: correo,
    rol: 'jurado',
    modulo: 'creayemprende',
    grupo: j.grupo,
    numeroCredencial: j.numeroCredencial,
    categoriasCYE: j.categorias,
    dni: j.dni,
    cargo: `Jurado calificador — Crea y Emprende (Grupo ${j.grupo})`,
    institucion: j.institucion,
    permisos: ['creayemprende'],
    debeCambiarPassword: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`listo  ${correo}  ${j.nombreCompleto}`);
}
console.log(`\nCredenciales creadas: ${creadas}. Actualizadas: ${actualizadas}.`);
process.exit(0);
