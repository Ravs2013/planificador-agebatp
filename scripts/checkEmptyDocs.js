import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function checkEmptyDocs() {
  const etpSnap = await db.collection("monitoreoDocenteEtp").get();
  console.log("Docs ETP vacíos o sin docente:");
  let countEtpEmpty = 0;
  etpSnap.docs.forEach(d => {
    const data = d.data();
    if (!data.docenteNombre && !data.institucionNombre) {
      countEtpEmpty++;
      console.log("ETP doc id:", d.id, "data:", data);
    }
  });
  console.log(`Total ETP vacíos: ${countEtpEmpty}`);

  const ebaSnap = await db.collection("monitoreoDocenteEba").get();
  console.log("\nDocs EBA vacíos o sin docente:");
  let countEbaEmpty = 0;
  ebaSnap.docs.forEach(d => {
    const data = d.data();
    if (!data.docenteNombre && !data.institucionNombre) {
      countEbaEmpty++;
      console.log("EBA doc id:", d.id, "data:", data);
    }
  });
  console.log(`Total EBA vacíos: ${countEbaEmpty}`);
}

checkEmptyDocs().catch(console.error);
