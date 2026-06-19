import admin from "firebase-admin";
import fs from "fs";

const serviceAccountPath = "./serviceAccountKey.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("No se encontró serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function run() {
  console.log("Listing Firebase Auth users...");
  const authUsers = [];
  
  let nextPageToken = undefined;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    listUsersResult.users.forEach((userRecord) => {
      authUsers.push(userRecord.toJSON());
    });
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`Found ${authUsers.length} users in Firebase Authentication.`);

  // Get all users from Firestore usuarios collection
  const usersSnap = await db.collection("usuarios").get();
  const firestoreUsers = {};
  usersSnap.forEach(doc => {
    firestoreUsers[doc.id] = { id: doc.id, ...doc.data() };
  });

  console.log("MARKDOWN_START");
  console.log("| UID | Nombre | Correo (Usuario) | Rol | Cargo | DNI / Clave (si está en DB) |");
  console.log("| --- | --- | --- | --- | --- | --- |");

  authUsers.forEach(au => {
    const fu = firestoreUsers[au.uid] || {};
    // If we have DNI or password stored in firestore
    const pwdOrDni = fu.dni || "—";
    const name = fu.nombre || au.displayName || "—";
    const email = au.email || fu.email || "—";
    const rol = fu.rol || "—";
    const cargo = fu.cargo || "—";
    console.log(`| ${au.uid} | ${name} | ${email} | ${rol} | ${cargo} | ${pwdOrDni} |`);
  });
  console.log("MARKDOWN_END");
}

run().catch(console.error);
