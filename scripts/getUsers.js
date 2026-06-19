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
  const snap = await db.collection("usuarios").get();
  const users = [];
  snap.forEach(doc => {
    users.push({ id: doc.id, ...doc.data() });
  });

  console.log("MARKDOWN_START");
  console.log("| Nombre | Correo (Usuario) | Rol | Cargo | DNI / Clave |");
  console.log("| --- | --- | --- | --- | --- |");
  users.forEach(u => {
    const pwdOrDni = u.dni || "—";
    console.log(`| ${u.nombre || "—"} | ${u.email || "—"} | ${u.rol || "—"} | ${u.cargo || "—"} | ${pwdOrDni} |`);
  });
  console.log("MARKDOWN_END");
}

run().catch(console.error);
