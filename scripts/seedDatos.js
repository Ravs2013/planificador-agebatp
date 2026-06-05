/* ════════════════════════════════════════════════════════════════
   Seeding Script for Initial Data from Excel — AGEBATP UGEL 03
   Ejecuta esto en Node.js para cargar las actividades, expedientes y reuniones.
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

const db = admin.firestore();

const excelPath = "C:\\Users\\perum\\Downloads\\AGEBATP_Actividades (5).xlsx";

function excelDateToDateString(val) {
  if (typeof val === 'number') {
    // Excel base date is Dec 30, 1899
    const date = new Date((val - 25569) * 86400 * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return val;
}

function excelTimeToTimeString(val) {
  if (typeof val === 'number') {
    const totalSeconds = Math.round(val * 24 * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return val;
}

function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "2026-W12"; // Fallback week
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function seed() {
  console.log("🚀 Iniciando siembra de datos desde Excel...");
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: No se encontró el archivo Excel en ${excelPath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);

  // 1. Sembrar Actividades
  if (workbook.SheetNames.includes("Actividades")) {
    console.log("Reading Actividades...");
    const sheet = workbook.Sheets["Actividades"];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Encontradas ${rows.length} actividades en Excel.`);

    const batch = db.batch();
    let count = 0;

    for (const r of rows) {
      const id = r.actividad_id || `ACT-${Date.now()}-${count}`;
      
      let assigned = [];
      if (r.personal_asignado) {
        try {
          assigned = JSON.parse(r.personal_asignado);
        } catch (e) {
          if (typeof r.personal_asignado === 'string') {
            assigned = r.personal_asignado.split(',').map(x => parseInt(x.trim())).filter(Boolean);
          } else if (typeof r.personal_asignado === 'number') {
            assigned = [r.personal_asignado];
          }
        }
      }

      let actions = [];
      if (r.acciones) {
        try {
          actions = JSON.parse(r.acciones);
        } catch (e) {
          if (typeof r.acciones === 'string') {
            actions = r.acciones.split(',').map(x => x.trim()).filter(Boolean);
          }
        }
      }

      const docRef = db.collection("actividades").doc(id);
      batch.set(docRef, {
        id,
        title: r.titulo || "",
        type: r.tipo || "estrategica",
        date: excelDateToDateString(r.fecha_inicio) || "",
        endDate: excelDateToDateString(r.fecha_fin) || "",
        time: r.horario || "",
        location: r.lugar || "",
        priority: r.prioridad || "media",
        description: r.descripcion || "",
        assigned: assigned,
        actions: actions,
        progress: typeof r.progreso === 'number' ? r.progreso : 0,
        status: r.estado || "pendiente",
        created_by: r.creado_por || "Admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      count++;
    }

    await batch.commit();
    console.log(`✅ ${count} actividades sembradas/actualizadas.`);
  }

  // 2. Sembrar Expedientes (Esinad Semanas)
  if (workbook.SheetNames.includes("Expedientes")) {
    console.log("Reading Expedientes...");
    const sheet = workbook.Sheets["Expedientes"];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Encontrados ${rows.length} expedientes en Excel.`);

    // Group expedientes by week
    const weeksMap = new Map();

    for (const r of rows) {
      const regDate = r.fecha_registro || new Date().toISOString();
      const weekKey = getISOWeek(regDate);

      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, []);
      }

      // Map categories
      let cat = "Memorandums";
      const excelCat = String(r.categoria || "").toLowerCase();
      if (excelCat.includes("informe")) cat = "Informes";
      else if (excelCat.includes("oficio multiple") || excelCat.includes("of. multiples")) cat = "Of. Multiples";
      else if (excelCat.includes("oficio")) cat = "Oficios";
      else if (excelCat.includes("memorandum") || excelCat.includes("memo")) cat = "Memorandums";

      weeksMap.get(weekKey).push({
        expediente: r.expediente_id || "",
        asuntoExpediente: r.asunto || "",
        asuntoRespuesta: r.asunto || "",
        especialista: r.especialista || "",
        remiteOficina: r.oficina || "",
        categoria: cat,
        tipoDocumento: r.expediente_id || "",
        fechaDerivacion: excelDateToDateString(r.fecha_vencimiento) || "",
        origen: r.origen || "",
        fechaIngreso: excelDateToDateString(r.fecha_vencimiento) || "",
        destino: "agebatp",
        tipo: "ETP", // default type
        personId: 9, // Default person ID for system/systems admin
        shortName: r.especialista ? r.especialista.split(' ')[0] : "Especialista"
      });
    }

    for (const [week, docs] of weeksMap.entries()) {
      const weekRef = db.collection("esinadSemanas").doc(week);
      
      // Get existing week document to avoid overwriting existing documents if run multiple times
      const weekDoc = await weekRef.get();
      let mergedDocs = docs;
      if (weekDoc.exists) {
        const existingDocs = weekDoc.data().documentos || [];
        const existingIds = new Set(existingDocs.map(d => d.expediente));
        const newDocs = docs.filter(d => !existingIds.has(d.expediente));
        mergedDocs = [...existingDocs, ...newDocs];
      }

      await weekRef.set({
        id: week,
        semana: week,
        documentos: mergedDocs,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`   └─ Semana ${week} guardada con ${docs.length} documentos.`);
    }
    console.log(`✅ Sembrado de expedientes finalizado.`);
  }

  // 3. Sembrar Solicitudes de Reunión
  if (workbook.SheetNames.includes("Solicitudes_Reunion")) {
    console.log("Reading Solicitudes_Reunion...");
    const sheet = workbook.Sheets["Solicitudes_Reunion"];
    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Encontradas ${rows.length} solicitudes de reunión en Excel.`);

    const batch = db.batch();
    let count = 0;

    for (const r of rows) {
      const id = r.reunion_id || `REU-${Date.now()}-${count}`;
      
      const docRef = db.collection("reuniones").doc(id);
      batch.set(docRef, {
        id,
        nombre: r.solicitante_nombre || "",
        telefono: String(r.solicitante_telefono || ""),
        email: r.solicitante_email || "",
        cargo: r.solicitante_cargo || "",
        institucion: r.solicitante_institucion || "",
        fecha: excelDateToDateString(r.fecha_propuesta) || "",
        hora: excelTimeToTimeString(r.hora_propuesta) || "",
        motivo: r.motivo || "",
        descripcion: r.comentario_solicitante || "",
        personal_id: String(r.personal_destino_id || "8"),
        jefatura_id: "7", // default jefatura id
        estado: r.estado || "pendiente",
        comentario_admin: r.comentario_admin || "",
        respondido_por: r.respondido_por || "",
        fecha_respuesta: r.fecha_respuesta || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      count++;
    }

    await batch.commit();
    console.log(`✅ ${count} solicitudes de reunión sembradas/actualizadas.`);
  }

  console.log("\n🎉 Carga de datos iniciales completada con éxito.");
  process.exit(0);
}

seed();
