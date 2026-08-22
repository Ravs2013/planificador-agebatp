import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const auth = admin.auth();

async function inspectTeatroUsers() {
  for (let num = 1; num <= 3; num++) {
    const email = `juradoteatro${num}@ugel03.gob.pe`;
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log(`Auth user ${email}:`, { uid: userRecord.uid, displayName: userRecord.displayName });
      const docSnap = await db.collection("usuarios").doc(userRecord.uid).get();
      if (docSnap.exists) {
        console.log(`Firestore user ${email}:`, docSnap.data());
      } else {
        console.log(`Firestore doc does not exist for ${email}`);
      }
    } catch (e) {
      console.log(`Error checking ${email}:`, e.message);
    }
  }
}

inspectTeatroUsers().catch(console.error);
