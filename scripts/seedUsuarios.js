/* ════════════════════════════════════════════════════════════════
   Seeding Script for Firebase Users — AGEBATP UGEL 03
   Ejecuta esto en Node.js para inicializar las cuentas por defecto.
   ════════════════════════════════════════════════════════════════ */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Cargar la clave de cuenta de servicio de Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "./serviceAccountKey.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`\n❌ Error: No se encontró la clave de cuenta de servicio de Firebase.`);
  console.error(`Por favor genera un archivo de clave de cuenta de servicio desde la consola de Firebase:`);
  console.error(`Consola Firebase > Configuración del Proyecto > Cuentas de Servicio > Generar nueva clave privada`);
  console.error(`Guarda ese archivo como '${serviceAccountPath}' o define la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY.\n`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

// Usuarios por defecto para sembrar
const usuariosDePrueba = [
  {
    email: "admin@ugel03.gob.pe",
    password: "admin123",
    nombre: "Administrador AGEBATP",
    rol: "admin",
    cargo: "Coordinador",
    institucion: "UGEL 03",
    permisos: ["admin", "write_directories", "write_activities", "write_monitoreo"],
    telefono: "51900000000"
  },
  {
    email: "jaquispes@ugel03.gob.pe",
    password: "123456",
    nombre: "Juan Alberto Quispe Solano",
    rol: "personal",
    cargo: "Especialista ETP",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51990110372"
  },
  {
    email: "lgutierrez@ugel03.gob.pe",
    password: "123456",
    nombre: "Liz Miluska Gutierrez Silva",
    rol: "personal",
    cargo: "Especialista ETP",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51934842196"
  },
  {
    email: "nalbinoi@ugel03.gob.pe",
    password: "123456",
    nombre: "Nelida Albino Igreda",
    rol: "personal",
    cargo: "Especialista EBA",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51989948898"
  },
  {
    email: "fvillalobosg@ugel03.gob.pe",
    password: "123456",
    nombre: "Francisco Villalobos Gonzales",
    rol: "personal",
    cargo: "Especialista ETP",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51975052258"
  },
  {
    email: "lavasqueza@ugel03.gob.pe",
    password: "123456",
    nombre: "Lucy Ana Vasquez Aliaga",
    rol: "personal",
    cargo: "Especialista EBA",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51943210987"
  },
  {
    email: "bcuellar@ugel03.gob.pe",
    password: "123456",
    nombre: "Beronica Olinda Cuellar Cornelio",
    rol: "personal",
    cargo: "Especialista ETP",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51932109876"
  },
  {
    email: "rninamango@ugel03.gob.pe",
    password: "Lunadana",
    nombre: "Rosa Isabel Ninamango Baldeon",
    rol: "admin",
    cargo: "JEFATURA",
    institucion: "UGEL 03",
    permisos: ["admin", "write_directories", "write_activities", "write_monitoreo"],
    telefono: "51986875531"
  },
  {
    email: "n00276745@upn.pe",
    password: "123456",
    nombre: "Ricardo Alejandro Viera Suarez",
    rol: "personal",
    cargo: "SISTEMAS",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51917349479"
  },
  {
    email: "test@test.com",
    password: "password123",
    nombre: "Test User",
    rol: "publico",
    cargo: "Tester",
    institucion: "UGEL 03",
    permisos: [],
    telefono: "123456789"
  },
  {
    email: "isitasuyo@gmail.com",
    password: "123456",
    nombre: "Personal isitasuyo",
    rol: "personal",
    cargo: "Especialista",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51900000000"
  },
  {
    email: "agonzaless2019@gmail.com",
    password: "123456",
    nombre: "Personal agonzaless",
    rol: "personal",
    cargo: "Especialista",
    institucion: "UGEL 03",
    permisos: ["write_activities", "write_monitoreo"],
    telefono: "51900000000"
  }
];

async function seed() {
  console.log("🚀 Iniciando siembra de usuarios en Firebase Auth y Firestore...");

  for (const u of usuariosDePrueba) {
    let uid = "";
    try {
      // 1. Verificar si el usuario ya existe por email
      const userRecord = await auth.getUserByEmail(u.email);
      uid = userRecord.uid;
      console.log(`ℹ️ El usuario ${u.email} ya existe con UID: ${uid}. Actualizando datos...`);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Crear nuevo usuario si no existe
        const userRecord = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.nombre,
          emailVerified: true
        });
        uid = userRecord.uid;
        console.log(`✅ Usuario creado en Auth: ${u.email} (UID: ${uid})`);
      } else {
        console.error(`❌ Error al buscar/crear usuario ${u.email}:`, error);
        continue;
      }
    }

    // 2. Crear o actualizar el perfil en Firestore /usuarios/{uid}
    try {
      const userDocRef = db.collection("usuarios").doc(uid);
      await userDocRef.set({
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        cargo: u.cargo,
        institucion: u.institucion,
        permisos: u.permisos,
        telefono: u.telefono,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`   └─ Perfil guardado en Firestore para ${u.email}`);
    } catch (firestoreError) {
      console.error(`❌ Error al escribir perfil en Firestore para ${u.email}:`, firestoreError);
    }
  }

  console.log("\n🎉 Proceso de siembra finalizado con éxito.");
  process.exit(0);
}

seed();
