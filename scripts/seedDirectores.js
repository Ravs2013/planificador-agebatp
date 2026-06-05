/* ════════════════════════════════════════════════════════════════
   Seeding Script for Directors (CEBA & CETPRO) — AGEBATP UGEL 03
   Ejecuta esto en Node.js para registrar las cuentas de directores.
   ════════════════════════════════════════════════════════════════ */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

// Cargar la clave de cuenta de servicio de Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "./serviceAccountKey.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`\n❌ Error: No se encontró la clave de cuenta de servicio de Firebase.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const cebaPath = "C:\\Users\\perum\\Downloads\\Directorio_Completo_ceba_UGEL03 (4).xlsx";
const cetproPath = "C:\\Users\\perum\\Downloads\\directorio cetpro oficial (1).xlsx";

function normalizeDni(dni) {
  if (dni === undefined || dni === null) return "";
  const raw = String(dni).trim().replace(/[^0-9]/g, "");
  if (raw.length === 0) return "";
  return raw.padStart(8, '0');
}

function validateEmail(email) {
  if (!email) return false;
  const em = String(email).trim().toLowerCase();
  // Basic email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
}

async function processDirectors() {
  console.log("🚀 Iniciando registro de directores en Firebase Auth y Firestore...");
  const skipped = [];
  let registeredCount = 0;

  // 1. Procesar CEBA
  if (fs.existsSync(cebaPath)) {
    console.log(`\nReading CEBA: ${cebaPath}`);
    const wb = XLSX.readFile(cebaPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Data rows start at index 4 (5th row)
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

      const instId = String(row[3] || row[2] || '').trim(); // modular code
      const instNombre = String(row[4] || '').trim();
      const cargo = String(row[7] || 'Director').trim();
      const apePaterno = String(row[8] || '').trim();
      const apeMaterno = String(row[9] || '').trim();
      const nombres = String(row[10] || '').trim();
      const rawDni = row[11];
      const email = String(row[12] || '').trim().toLowerCase();
      const telefono = String(row[14] || '').trim();

      const dni = normalizeDni(rawDni);
      const fullName = `${nombres} ${apePaterno} ${apeMaterno}`.trim();

      if (!instId) {
        skipped.push({ row: i + 1, name: fullName, email, reason: "Código modular ausente" });
        continue;
      }
      if (!validateEmail(email)) {
        skipped.push({ row: i + 1, name: fullName, email, reason: `Correo institucional inválido o ausente: "${email}"` });
        continue;
      }
      if (!dni || dni.length < 6) {
        skipped.push({ row: i + 1, name: fullName, email, reason: `DNI inválido o ausente: "${rawDni}"` });
        continue;
      }

      try {
        let uid = "";
        try {
          const userRec = await auth.getUserByEmail(email);
          uid = userRec.uid;
          console.log(`[CEBA] Director ${email} ya existe. Sincronizando datos en Firestore...`);
        } catch (authErr) {
          if (authErr.code === "auth/user-not-found") {
            const userRec = await auth.createUser({
              email,
              password: dni,
              displayName: fullName,
              emailVerified: true
            });
            uid = userRec.uid;
            console.log(`[CEBA] Director creado: ${email} con clave DNI: ${dni}`);
          } else {
            throw authErr;
          }
        }

        // Guardar o actualizar perfil en Firestore
        await db.collection("usuarios").doc(uid).set({
          nombre: fullName,
          email,
          rol: "director",
          cargo: cargo || "Director",
          institucionTipo: "CEBA",
          institucionId: instId,
          institucionNombre: instNombre,
          debeCambiarPassword: true,
          permisos: ["directorio"],
          telefono,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        registeredCount++;
      } catch (err) {
        console.error(`❌ Error al procesar director en fila ${i + 1} (${email}):`, err);
        skipped.push({ row: i + 1, name: fullName, email, reason: `Error Firebase: ${err.message}` });
      }
    }
  } else {
    console.warn(`⚠️ Archivo CEBA no encontrado en ${cebaPath}`);
  }

  // 2. Procesar CETPRO
  if (fs.existsSync(cetproPath)) {
    console.log(`\nReading CETPRO: ${cetproPath}`);
    const wb = XLSX.readFile(cetproPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const instId = String(row[2] || '').trim(); // modular code
      const instNombre = String(row[3] || '').trim();
      const cargo = String(row[6] || 'Director').trim();
      const apePaterno = String(row[7] || '').trim();
      const apeMaterno = String(row[8] || '').trim();
      const nombres = String(row[9] || '').trim();
      const rawDni = row[10];
      const email = String(row[11] || '').trim().toLowerCase();
      const telefono = String(row[13] || '').trim();

      const dni = normalizeDni(rawDni);
      const fullName = `${nombres} ${apePaterno} ${apeMaterno}`.trim();

      if (!instId) {
        skipped.push({ row: i + 1, name: fullName, email, reason: "Código modular ausente" });
        continue;
      }
      if (!validateEmail(email)) {
        skipped.push({ row: i + 1, name: fullName, email, reason: `Correo institucional inválido o ausente: "${email}"` });
        continue;
      }
      if (!dni || dni.length < 6) {
        skipped.push({ row: i + 1, name: fullName, email, reason: `DNI inválido o ausente: "${rawDni}"` });
        continue;
      }

      try {
        let uid = "";
        try {
          const userRec = await auth.getUserByEmail(email);
          uid = userRec.uid;
          console.log(`[CETPRO] Director ${email} ya existe. Sincronizando datos en Firestore...`);
        } catch (authErr) {
          if (authErr.code === "auth/user-not-found") {
            const userRec = await auth.createUser({
              email,
              password: dni,
              displayName: fullName,
              emailVerified: true
            });
            uid = userRec.uid;
            console.log(`[CETPRO] Director creado: ${email} con clave DNI: ${dni}`);
          } else {
            throw authErr;
          }
        }

        // Guardar o actualizar perfil en Firestore
        await db.collection("usuarios").doc(uid).set({
          nombre: fullName,
          email,
          rol: "director",
          cargo: cargo || "Director",
          institucionTipo: "CETPRO",
          institucionId: instId,
          institucionNombre: instNombre,
          debeCambiarPassword: true,
          permisos: ["directorio"],
          telefono,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        registeredCount++;
      } catch (err) {
        console.error(`❌ Error al procesar director en fila ${i + 1} (${email}):`, err);
        skipped.push({ row: i + 1, name: fullName, email, reason: `Error Firebase: ${err.message}` });
      }
    }
  } else {
    console.warn(`⚠️ Archivo CETPRO no encontrado en ${cetproPath}`);
  }

  // Reporte de Omitidos
  console.log(`\n=== 📊 RESUMEN DE REGISTRO DE DIRECTORES ===`);
  console.log(`✅ Directores registrados/sincronizados con éxito: ${registeredCount}`);
  console.log(`⚠️ Filas omitidas: ${skipped.length}`);
  
  if (skipped.length > 0) {
    console.log("\nDetalle de filas omitidas:");
    skipped.forEach(s => {
      console.log(` - Fila ${s.row} | ${s.name || "Sin nombre"} | ${s.email || "Sin correo"} | Motivo: ${s.reason}`);
    });
  }

  console.log("\n🎉 Proceso finalizado.");
  process.exit(0);
}

processDirectors();
