/* ════════════════════════════════════════════════════════════════
   Actualiza el estado de admisión de los proyectos de Secundaria
   (Categorías D y E) en Firestore según el Comunicado Oficial 04-2026.
   89 Aptos (43 en D, 46 en E)
   163 Retirados / No seleccionados (65 en D, 98 en E)
   ════════════════════════════════════════════════════════════════ */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rutaClave = path.resolve(__dirname, '../../serviceAccountKey.json');

if (!fs.existsSync(rutaClave)) {
  console.error(`No se encontró la clave de cuenta de servicio (${rutaClave}).`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(rutaClave, 'utf8')))
});

const db = admin.firestore();

// Leer archivo de IDs aptos generado por el analizador
const rutaAptos = path.resolve(__dirname, '../../../scripts/aptos_secundaria_ids.json');
if (!fs.existsSync(rutaAptos)) {
  console.error(`No se encontró el archivo de IDs aptos (${rutaAptos}).`);
  process.exit(1);
}

const { aptos_ids } = JSON.parse(fs.readFileSync(rutaAptos, 'utf8'));
const setAptos = new Set(aptos_ids);

console.log(`Cargados ${setAptos.size} IDs aptos para Categorías D y E.\n`);

async function run() {
  const snap = await db.collection('eurekaParticipantes').get();
  console.log(`Total documentos leídos en Firestore: ${snap.size}`);

  const ahora = new Date().toISOString();
  let d_aptos = 0;
  let d_retirados = 0;
  let e_aptos = 0;
  let e_retirados = 0;
  let otros = 0;

  const lotes = [];
  let currentBatch = db.batch();
  let opCount = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const cat = data.categoria;
    const docId = docSnap.id;

    if (cat === 'D' || cat === 'E') {
      const esApto = setAptos.has(docId);
      const estado = esApto ? 'apto' : 'retirado';
      const motivo = esApto
        ? 'Apto — Seleccionado para la fase presencial (Comunicado 04-2026)'
        : 'No seleccionado para la fase presencial (Comunicado 04-2026)';

      if (cat === 'D') {
        if (esApto) d_aptos++; else d_retirados++;
      } else {
        if (esApto) e_aptos++; else e_retirados++;
      }

      currentBatch.set(docSnap.ref, {
        admision: {
          estado,
          motivo,
          responsable: 'Comisión Organizadora UGEL 03',
          en: ahora,
          fuente: 'Comunicado 04-2026'
        },
        estado,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      opCount++;
      if (opCount === 450) {
        lotes.push(currentBatch);
        currentBatch = db.batch();
        opCount = 0;
      }
    } else {
      otros++;
    }
  });

  if (opCount > 0) {
    lotes.push(currentBatch);
  }

  console.log(`Comprometiendo ${lotes.length} lote(s) en Firestore...`);
  for (const lote of lotes) {
    await lote.commit();
  }

  console.log('\n================ RESUMEN DE ACTUALIZACIÓN EN FIRESTORE ================');
  console.log(`Categoría D: ${d_aptos} aptos, ${d_retirados} retirados. (Total: ${d_aptos + d_retirados})`);
  console.log(`Categoría E: ${e_aptos} aptos, ${e_retirados} retirados. (Total: ${e_aptos + e_retirados})`);
  console.log(`Otras categorías (A, B, C) preservadas sin cambios: ${otros}`);
  console.log('========================================================================\n');
  console.log('¡Actualización completada exitosamente!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error durante la actualización en Firestore:', err);
  process.exit(1);
});
