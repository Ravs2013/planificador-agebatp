import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function syncPaneles() {
  console.log('--- Sincronizando Paneles de Firmas CYE por Categoría ---');
  
  // 1. Obtener datos de GLOBAL (Categoría A), CAT_B y CAT_C
  const globalSnap = await db.collection('cyePanelFirmas').doc('GLOBAL').get();
  const catBSnap = await db.collection('cyePanelFirmas').doc('CAT_B').get();
  const catCSnap = await db.collection('cyePanelFirmas').doc('CAT_C').get();
  
  if (!globalSnap.exists || !catBSnap.exists || !catCSnap.exists) {
    throw new Error('Faltan documentos base en cyePanelFirmas');
  }

  const globalData = globalSnap.data();
  const catBData = catBSnap.data();
  const catCData = catCSnap.data();

  const adminAuditor = {
    uid: 'CWX6wANBwSTgM8fgtFFVei2gNoA3',
    correo: 'admin@ugel03.gob.pe',
    nombre: 'Administrador AGEBATP'
  };

  const ahora = new Date().toISOString();

  // 2. Preparar CAT_A (Firmas de Categoría A)
  const dataCatA = {
    ...globalData,
    id: 'CAT_A',
    alcance: 'CATEGORIA',
    categoria: 'A',
    estado: 'sellado',
    selladoPor: adminAuditor,
    selladoEn: globalData.selladoEn || ahora,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // 3. Preparar CAT_B (Firmas de Categoría B)
  const dataCatB = {
    ...catBData,
    id: 'CAT_B',
    alcance: 'CATEGORIA',
    categoria: 'B',
    estado: 'sellado',
    selladoPor: adminAuditor,
    selladoEn: catBData.selladoEn || ahora,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // 4. Preparar CAT_C (Firmas de Categoría C)
  const dataCatC = {
    ...catCData,
    id: 'CAT_C',
    alcance: 'CATEGORIA',
    categoria: 'C',
    estado: 'sellado',
    selladoPor: catCData.selladoPor || adminAuditor,
    selladoEn: catCData.selladoEn || ahora,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Guardar en Firestore
  await db.collection('cyePanelFirmas').doc('CAT_A').set(dataCatA, { merge: true });
  console.log('✓ Panel CAT_A guardado y sellado (3 firmas).');

  await db.collection('cyePanelFirmas').doc('A').set(dataCatA, { merge: true });
  console.log('✓ Panel A sincronizado con CAT_A.');

  await db.collection('cyePanelFirmas').doc('CAT_B').set(dataCatB, { merge: true });
  console.log('✓ Panel CAT_B guardado y sellado (3 firmas).');

  await db.collection('cyePanelFirmas').doc('B').set(dataCatB, { merge: true });
  console.log('✓ Panel B sincronizado con CAT_B.');

  await db.collection('cyePanelFirmas').doc('CAT_C').set(dataCatC, { merge: true });
  console.log('✓ Panel CAT_C guardado y sellado (3 firmas).');

  await db.collection('cyePanelFirmas').doc('C').set(dataCatC, { merge: true });
  console.log('✓ Panel C sincronizado con CAT_C.');

  // Sellar también GLOBAL
  await db.collection('cyePanelFirmas').doc('GLOBAL').set({
    estado: 'sellado',
    selladoPor: adminAuditor,
    selladoEn: globalData.selladoEn || ahora,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✓ Panel GLOBAL sellado.');

  console.log('=== Sincronización exitosa. Todas las categorías cuentan con panel sellado y firmas activas ===');
}

syncPaneles().catch(err => {
  console.error('Error sincronizando:', err);
  process.exit(1);
});
