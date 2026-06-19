import admin from "firebase-admin";
import fs from "fs";

const serviceAccountPath = "./serviceAccountKey.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error("No se encontró serviceAccountKey.json en la raíz.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  // 1. Fetch all users from Firestore 'usuarios'
  const usersSnap = await db.collection("usuarios").get();
  const users = [];
  usersSnap.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });

  // 2. Fetch all from directorioCeba
  const cebaSnap = await db.collection("directorioCeba").get();
  const cebasByEmail = {};
  cebaSnap.forEach(doc => {
    const data = doc.data();
    if (data.correoInstitucional) {
      cebasByEmail[data.correoInstitucional.trim().toLowerCase()] = data;
    }
  });

  // 3. Fetch all from directorioCetpro
  const cetproSnap = await db.collection("directorioCetpro").get();
  const cetprosByEmail = {};
  cetproSnap.forEach(doc => {
    const data = doc.data();
    if (data.correoInstitucional) {
      cetprosByEmail[data.correoInstitucional.trim().toLowerCase()] = data;
    }
  });

  console.log("MARKDOWN_START");
  console.log("| Nombre | Correo (Usuario) | Rol | Cargo | Tipo Inst. | Inst. Nombre | DNI / Clave |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");

  // Default hardcoded passwords for seeded specialists/admins
  const seedPasswords = {
    "admin@ugel03.gob.pe": "admin123",
    "jaquispes@ugel03.gob.pe": "123456",
    "lgutierrez@ugel03.gob.pe": "123456",
    "nalbinoi@ugel03.gob.pe": "123456",
    "fvillalobosg@ugel03.gob.pe": "123456",
    "lavasqueza@ugel03.gob.pe": "123456",
    "bcuellar@ugel03.gob.pe": "123456",
    "rninamango@ugel03.gob.pe": "Lunadana",
    "n00276745@upn.pe": "123456",
    "test@test.com": "password123",
    "isitasuyo@gmail.com": "123456",
    "agonzaless2019@gmail.com": "123456",
    "admin@agebatp.gob.pe": "admin123",
    "jefatura@agebatp.gob.pe": "admin123",
    "personal@agebatp.gob.pe": "123456"
  };

  users.forEach(u => {
    const emailKey = (u.email || "").trim().toLowerCase();
    
    // Find DNI from usuarios first, then from directorio collections, then fallback
    let dni = u.dni || "";
    let instTipo = u.institucionTipo || "";
    let instNombre = u.institucionNombre || "";

    if (!dni && emailKey) {
      if (cebasByEmail[emailKey]) {
        dni = cebasByEmail[emailKey].dni || "";
        instTipo = "CEBA";
        instNombre = cebasByEmail[emailKey].nombre || cebasByEmail[emailKey].institucionNombre || "";
      } else if (cetprosByEmail[emailKey]) {
        dni = cetprosByEmail[emailKey].dni || "";
        instTipo = "CETPRO";
        instNombre = cetprosByEmail[emailKey].nombre || cetprosByEmail[emailKey].institucionNombre || "";
      }
    }

    const pwdOrDni = dni || seedPasswords[emailKey] || "—";
    
    console.log(`| ${u.nombre || "—"} | ${u.email || "—"} | ${u.rol || "—"} | ${u.cargo || "—"} | ${instTipo || "—"} | ${instNombre || "—"} | ${pwdOrDni} |`);
  });
  console.log("MARKDOWN_END");
}

run().catch(console.error);
