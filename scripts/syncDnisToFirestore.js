import admin from "firebase-admin";
import fs from "fs";
import XLSX from "xlsx";

const serviceAccountPath = "./serviceAccountKey.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("No se encontró serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const cebaPath = "C:\\Users\\perum\\Downloads\\Directorio_Completo_ceba_UGEL03 (4).xlsx";
const cetproPath = "C:\\Users\\perum\\Downloads\\directorio cetpro oficial (1).xlsx";

function normalizeDni(dni) {
  if (dni === undefined || dni === null) return "";
  const raw = String(dni).trim().replace(/[^0-9]/g, "");
  if (raw.length === 0) return "";
  return raw.padStart(8, '0');
}

async function run() {
  const emailToDni = {};
  
  // 1. Process CEBA Excel
  if (fs.existsSync(cebaPath)) {
    const wb = XLSX.readFile(cebaPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const rawDni = row[11];
      const email = String(row[12] || '').trim().toLowerCase();
      const dni = normalizeDni(rawDni);
      if (email && dni) {
        emailToDni[email] = dni;
      }
    }
  }

  // 2. Process CETPRO Excel
  if (fs.existsSync(cetproPath)) {
    const wb = XLSX.readFile(cetproPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const rawDni = row[10];
      const email = String(row[11] || '').trim().toLowerCase();
      const dni = normalizeDni(rawDni);
      if (email && dni) {
        emailToDni[email] = dni;
      }
    }
  }

  console.log(`Loaded ${Object.keys(emailToDni).length} DNI mappings from Excel.`);

  // 3. Fetch all Firestore users
  const snap = await db.collection("usuarios").get();
  let updatedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const email = (data.email || "").trim().toLowerCase();
    
    // If the DNI is in our Excel list and not already set in Firestore (or we want to update it)
    if (email && emailToDni[email]) {
      const targetDni = emailToDni[email];
      if (data.dni !== targetDni) {
        await doc.ref.update({
          dni: targetDni,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
        console.log(`Updated DNI for ${email} -> ${targetDni}`);
      }
    }
  }

  console.log(`Sync completed. Updated ${updatedCount} user profiles in Firestore.`);
}

run().catch(console.error);
