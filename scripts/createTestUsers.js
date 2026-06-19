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

const testCeba = {
  email: "eba.test@ugel03.edu.pe",
  password: "76628305",
  nombre: "Director de Prueba CEBA",
  nombres: "PRUEBA",
  apellidoPaterno: "DIRECTOR",
  apellidoMaterno: "CEBA",
  rol: "director",
  cargo: "DIRECTOR I.E.",
  institucionTipo: "CEBA",
  institucionId: "9999991", // Fictional Modular Code
  institucionNombre: "CEBA FICTICIO DE PRUEBAS",
  dni: "76628305",
  distrito: "BREÑA",
  tipoGestion: "ESTATAL"
};

const testCetpro = {
  email: "etp.test@ugel03.edu.pe",
  password: "76628305",
  nombre: "Director de Prueba CETPRO",
  nombres: "PRUEBA",
  apellidoPaterno: "DIRECTOR",
  apellidoMaterno: "CETPRO",
  rol: "director",
  cargo: "Director",
  institucionTipo: "CETPRO",
  institucionId: "9999992", // Fictional Modular Code
  institucionNombre: "CETPRO FICTICIO DE PRUEBAS",
  dni: "76628305",
  distrito: "BREÑA",
  tipoGestion: "ESTATAL"
};

async function createAccount(data) {
  let uid = "";
  try {
    const userRec = await auth.getUserByEmail(data.email);
    uid = userRec.uid;
    // Update password if user already exists
    await auth.updateUser(uid, {
      password: data.password,
      displayName: data.nombre
    });
    console.log(`[Auth] Usuario existente actualizado: ${data.email} (UID: ${uid})`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      const userRec = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.nombre,
        emailVerified: true
      });
      uid = userRec.uid;
      console.log(`[Auth] Usuario nuevo creado: ${data.email} (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  // Save to /usuarios/{uid} in Firestore
  await db.collection("usuarios").doc(uid).set({
    nombre: data.nombre,
    email: data.email,
    rol: data.rol,
    cargo: data.cargo,
    institucionTipo: data.institucionTipo,
    institucionId: data.institucionId,
    institucionNombre: data.institucionNombre,
    dni: data.dni,
    debeCambiarPassword: true,
    permisos: ["directorio"],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`[Firestore] Perfil de usuario guardado en /usuarios/${uid}`);

  // Save matching directory record
  const collName = data.institucionTipo === "CEBA" ? "directorioCeba" : "directorioCetpro";
  await db.collection(collName).doc(data.institucionId).set({
    id: data.institucionId,
    nombre: data.institucionNombre,
    correoInstitucional: data.email,
    dni: data.dni,
    nombres: data.nombres,
    apellidoPaterno: data.apellidoPaterno,
    apellidoMaterno: data.apellidoMaterno,
    cargo: data.cargo,
    distrito: data.distrito,
    tipoGestion: data.tipoGestion,
    actualizadoPor: "Sistema de Pruebas",
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`[Firestore] Ficha de directorio guardada en /${collName}/${data.institucionId}`);
}

async function run() {
  console.log("Iniciando creación de credenciales de prueba...");
  await createAccount(testCeba);
  await createAccount(testCetpro);
  console.log("🎉 Cuentas de prueba creadas exitosamente!");
}

run().catch(console.error);
