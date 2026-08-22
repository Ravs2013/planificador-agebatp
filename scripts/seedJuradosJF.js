/* ════════════════════════════════════════════════════════════════
   Seeding Script para Jurados de Juegos Florales 2026 por Disciplina
   Crea 39 cuentas de usuario (3 jurados x 13 disciplinas).
   Ejecuta con Node.js en frontend/
   ════════════════════════════════════════════════════════════════ */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "./serviceAccountKey.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`\n❌ Error: No se encontró la clave de cuenta de servicio de Firebase ('${serviceAccountPath}').`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

const DISCIPLINAS = [
  { id: "teatro", prefix: "juradoteatro", label: "Teatro" },
  { id: "baile_urbano", prefix: "juradobaileurbano", label: "Baile Urbano" },
  { id: "danza_tradicional", prefix: "juradodanzatradicional", label: "Danza Tradicional" },
  { id: "canto_solista", prefix: "juradocantosolista", label: "Canto Solista" },
  { id: "ensamble_instrumental", prefix: "juradoensambleinstrumental", label: "Ensamble Instrumental" },
  { id: "banda_escolar", prefix: "juradobandaescolar", label: "Banda Escolar de Música" },
  { id: "pintura", prefix: "juradopintura", label: "Pintura" },
  { id: "escultura", prefix: "juradoescultura", label: "Escultura" },
  { id: "fotografia", prefix: "juradofotografia", label: "Fotografía" },
  { id: "arte_tradicional", prefix: "juradoartetradicional", label: "Arte Tradicional" },
  { id: "poesia", prefix: "juradopoesia", label: "Poesía" },
  { id: "historietas_interactivas", prefix: "juradohistorietas", label: "Historietas Interactivas" },
  { id: "corto_audiovisual", prefix: "juradocortoaudiovisual", label: "Corto Audiovisual" }
];

async function seedJurados() {
  console.log("🚀 Generando 39 cuentas de Jurados de Juegos Florales 2026 por disciplina...");
  let creados = 0;
  let actualizados = 0;

  for (const disc of DISCIPLINAS) {
    for (let num = 1; num <= 3; num++) {
      const email = `${disc.prefix}${num}@ugel03.gob.pe`;
      const password = `${disc.prefix}${num}`;
      const nombre = `JURADO ${num} — ${disc.label.toUpperCase()}`;

      let uid = "";
      try {
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
        // Actualizar contraseña si es necesario
        await auth.updateUser(uid, { password, displayName: nombre });
        actualizados++;
        console.log(`ℹ️ Usuario existente actualizado: ${email}`);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          const userRecord = await auth.createUser({
            email,
            password,
            displayName: nombre,
            emailVerified: true
          });
          uid = userRecord.uid;
          creados++;
          console.log(`✅ Usuario creado: ${email}`);
        } else {
          console.error(`❌ Error procesando ${email}:`, error);
          continue;
        }
      }

      // Guardar en Firestore usuarios/{uid}
      try {
        await db.collection("usuarios").doc(uid).set({
          nombre,
          email,
          rol: "jurado",
          cargo: `Jurado Calificador N.° ${num} — ${disc.label}`,
          disciplinaId: disc.id,
          numeroJurado: num,
          institucion: "UGEL 03",
          permisos: ["juegosflorales"],
          debeCambiarPassword: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (fErr) {
        console.error(`❌ Error guardando en Firestore ${email}:`, fErr);
      }
    }
  }

  console.log(`\n🎉 Siembra completada: ${creados} usuarios creados, ${actualizados} actualizados.`);
  process.exit(0);
}

seedJurados();
