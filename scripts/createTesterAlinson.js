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

const userData = {
  email: "alinson@ugel03.gob.pe",
  password: "123456",
  nombre: "Alinson (Tester AGEBATP)",
  rol: "admin",
  cargo: "Administrador / Tester General",
  institucion: "UGEL 03",
  permisos: ["admin", "write_directories", "write_activities", "write_monitoreo"],
  telefono: "999999999",
  dni: "00000000",
  debeCambiarPassword: false
};

async function main() {
  console.log(`Iniciando creación/actualización de ${userData.email}...`);
  let uid = "";
  try {
    const userRec = await auth.getUserByEmail(userData.email);
    uid = userRec.uid;
    await auth.updateUser(uid, {
      password: userData.password,
      displayName: userData.nombre,
      emailVerified: true
    });
    console.log(`[Auth] Usuario existente actualizado: ${userData.email} (UID: ${uid})`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      const userRec = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.nombre,
        emailVerified: true
      });
      uid = userRec.uid;
      console.log(`[Auth] Usuario creado en Auth: ${userData.email} (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  // Firestore
  const userDocRef = db.collection("usuarios").doc(uid);
  await userDocRef.set({
    nombre: userData.nombre,
    email: userData.email,
    rol: userData.rol,
    cargo: userData.cargo,
    institucion: userData.institucion,
    permisos: userData.permisos,
    telefono: userData.telefono,
    dni: userData.dni,
    debeCambiarPassword: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`[Firestore] Perfil guardado en /usuarios/${uid}`);
  console.log("✅ Credenciales de prueba listas:");
  console.log(`   - Correo: ${userData.email}`);
  console.log(`   - Contraseña: ${userData.password}`);
  console.log(`   - Rol: ${userData.rol}`);
  console.log(`   - Permisos: ${userData.permisos.join(", ")}`);
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
