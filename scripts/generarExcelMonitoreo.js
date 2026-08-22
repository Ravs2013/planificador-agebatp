import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

function extractRecord(d, programa) {
  const dg = d.datosGenerales || {};
  const dgCetpro = d.datosGeneralesCETPRO || {};
  const ds = d.datosSesion || {};

  // 1. DOCENTE
  const rawDocente = (
    d.docenteNombre ||
    dgCetpro.docenteNombre ||
    dg.docenteObservado ||
    dg.docente ||
    d.firmas?.docente?.nombre ||
    ""
  ).trim();

  // 2. INSTITUCIÓN
  const rawInstitucion = (
    d.institucionNombre ||
    dgCetpro.nombreCETPRO ||
    dg.institucionEducativa ||
    dg.institucion ||
    ""
  ).trim();

  // 3. ÁREA CURRICULAR
  let rawArea = (
    d.areaCurricular ||
    dg.areaCurricular ||
    ds.especialidad ||
    ds.programaEstudio ||
    ds.opcionOcupacional ||
    ds.moduloFormativo ||
    ds.nombreActividad ||
    d.instrumento ||
    d.sesionObservadaRef ||
    ""
  ).trim();

  // 4. GRADO / SECCIÓN
  const rawGrado = (
    d.grado ||
    dg.grado ||
    ds.ciclo ||
    d.plan ||
    ""
  ).trim();

  const rawSeccion = (
    d.seccion ||
    dg.seccion ||
    ds.turno ||
    ""
  ).trim();

  let gradoSecc = "";
  if (rawGrado && rawSeccion) {
    if (rawSeccion.toLowerCase().includes(rawGrado.toLowerCase())) {
      gradoSecc = rawSeccion;
    } else {
      gradoSecc = `${rawGrado} / ${rawSeccion}`;
    }
  } else {
    gradoSecc = rawGrado || rawSeccion || "—";
  }

  // 5. ALUMNOS MATRICULADOS
  let matriculados = null;
  if (d.estudiantesMatriculados != null && d.estudiantesMatriculados !== "") matriculados = d.estudiantesMatriculados;
  else if (dg.estudiantesMatriculados != null && dg.estudiantesMatriculados !== "") matriculados = dg.estudiantesMatriculados;
  else if (ds.matriculados != null && ds.matriculados !== "") matriculados = ds.matriculados;
  else if (d.estudiantesAsistentes != null && d.estudiantesAsistentes !== "") matriculados = d.estudiantesAsistentes;
  else if (ds.presentes != null && ds.presentes !== "") matriculados = ds.presentes;

  const numMatriculados = (matriculados != null && !isNaN(matriculados)) ? Number(matriculados) : 0;

  return {
    docente: rawDocente.toUpperCase() || "—",
    institucion: rawInstitucion.toUpperCase() || "—",
    areaCurricular: rawArea || "—",
    gradoSecc: gradoSecc || "—",
    matriculados: numMatriculados
  };
}

async function generarExcel() {
  console.log("Extrayendo colecciones de Firestore...");

  // 1. ETP
  const etpSnap = await db.collection("monitoreoDocenteEtp").get();
  const etpList = [];
  etpSnap.docs.forEach(doc => {
    etpList.push(extractRecord(doc.data(), "ETP"));
  });

  etpList.sort((a, b) => a.institucion.localeCompare(b.institucion) || a.docente.localeCompare(b.docente));

  // 2. EBA
  const ebaSnap = await db.collection("monitoreoDocenteEba").get();
  const ebaList = [];
  ebaSnap.docs.forEach(doc => {
    ebaList.push(extractRecord(doc.data(), "EBA"));
  });

  ebaList.sort((a, b) => a.institucion.localeCompare(b.institucion) || a.docente.localeCompare(b.docente));

  console.log(`Registros ETP procesados: ${etpList.length}`);
  console.log(`Registros EBA procesados: ${ebaList.length}`);

  // 3. Crear Libro
  const wb = XLSX.utils.book_new();
  const headers = ["Docente", "Institucion", "Area Curricular", "Grado/Secc", "Alumnos Matriculados"];

  // Helper anchos de columna
  const calcColWidths = (data) => {
    return data[0].map((_, colIdx) => {
      let maxLen = 12;
      data.forEach(row => {
        const cell = row[colIdx];
        if (cell != null) {
          const len = String(cell).length;
          if (len > maxLen) maxLen = len;
        }
      });
      return { wch: Math.min(maxLen + 4, 65) };
    });
  };

  // Hoja ETP
  const etpData = [
    headers,
    ...etpList.map(r => [r.docente, r.institucion, r.areaCurricular, r.gradoSecc, r.matriculados])
  ];
  const wsEtp = XLSX.utils.aoa_to_sheet(etpData);
  wsEtp["!cols"] = calcColWidths(etpData);
  XLSX.utils.book_append_sheet(wb, wsEtp, "ETP");

  // Hoja EBA
  const ebaData = [
    headers,
    ...ebaList.map(r => [r.docente, r.institucion, r.areaCurricular, r.gradoSecc, r.matriculados])
  ];
  const wsEba = XLSX.utils.aoa_to_sheet(ebaData);
  wsEba["!cols"] = calcColWidths(ebaData);
  XLSX.utils.book_append_sheet(wb, wsEba, "EBA");

  // Guardar en la raíz del proyecto y en la carpeta de artifacts
  const outPath1 = path.resolve("../Monitoreo_Docente_EBA_ETP.xlsx");
  const outPath2 = "C:/Users/perum/.gemini/antigravity-ide/brain/cd8a7af8-0b7e-4879-8191-34c6040dddf6/Monitoreo_Docente_EBA_ETP.xlsx";

  XLSX.writeFile(wb, outPath1);
  try {
    XLSX.writeFile(wb, outPath2);
  } catch (e) {}

  console.log(`\n¡Excel generado exitosamente!\nRuta: ${outPath1}`);
}

generarExcel().catch(console.error);
