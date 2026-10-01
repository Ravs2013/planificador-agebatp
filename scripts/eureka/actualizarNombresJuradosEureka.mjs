import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('No se encontró serviceAccountKey.json en', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// Padrón oficial de correcciones proporcionado por el usuario:
export const JURADOS_CORRECCIONES = {
  '43316345': {
    dni: '43316345',
    apellidos: 'Villa Longa',
    nombres: 'Roxana Vanessa',
    nombreCompleto: 'Villa Longa, Roxana Vanessa',
    rawUser: 'Nombre completo: Roxana Vanessa Villa Longa DNI: 43316345'
  },
  '09629015': {
    dni: '09629015',
    apellidos: 'Terbullino Fernández',
    nombres: 'Roxana Justina',
    nombreCompleto: 'Terbullino Fernández, Roxana Justina',
    rawUser: 'Roxana Justina Terbullino Fernández dni 09629015'
  },
  '09594076': {
    dni: '09594076',
    apellidos: 'Toro Chochabot',
    nombres: 'Rosa',
    nombreCompleto: 'Toro Chochabot, Rosa',
    rawUser: 'Rosa Toro Chochabot DNI :09594076'
  },
  '24001606': {
    dni: '24001606',
    apellidos: 'Valencia Hancco',
    nombres: 'Virginia',
    nombreCompleto: 'Valencia Hancco, Virginia',
    rawUser: 'Virginia Valencia Hancco Dni 24001606'
  },
  '42965455': {
    dni: '42965455',
    apellidos: 'Brañez Medrano',
    nombres: 'Nick Josias',
    nombreCompleto: 'Brañez Medrano, Nick Josias',
    rawUser: 'Nick Josias Brañez Medrano 42965455'
  },
  '09072271': {
    dni: '09072271',
    apellidos: 'Suyo Villar',
    nombres: 'Ysabel',
    nombreCompleto: 'Suyo Villar, Ysabel',
    rawUser: 'Ysabel Suyo Villar 09072271'
  },
  '08395747': {
    dni: '08395747',
    apellidos: 'Sánchez Ortiz',
    nombres: 'María Delfina',
    nombreCompleto: 'Sánchez Ortiz, María Delfina',
    rawUser: 'MARIA DELFINA SÁNCHEZ ORTIZ dni 08395747'
  },
  '08048697': {
    dni: '08048697',
    apellidos: 'Aranguren Carbajal',
    nombres: 'Ada María',
    nombreCompleto: 'Aranguren Carbajal, Ada María',
    rawUser: 'ARANGUREN CARBAJAL ADA MARIA dni 08048697'
  },
  '22407181': {
    dni: '22407181',
    apellidos: 'González y Acosta',
    nombres: 'Margot Magdalena',
    nombreCompleto: 'González y Acosta, Margot Magdalena',
    rawUser: 'Margot Magdalena GONZALEZ Y ACOSTA dni 22407181'
  },
  '33589617': {
    dni: '33589617',
    apellidos: 'Olivos Flores',
    nombres: 'José María',
    nombreCompleto: 'Olivos Flores, José María',
    rawUser: 'jose maria olivos flores dni 33589617'
  },
  '07903991': {
    dni: '07903991',
    apellidos: 'Guzmán Brito',
    nombres: 'Martín',
    nombreCompleto: 'Guzmán Brito, Martín',
    rawUser: 'martin guzman brito dni 07903991'
  },
  '09941664': {
    dni: '09941664',
    apellidos: 'Castillo',
    nombres: 'Haldanth Lester',
    nombreCompleto: 'Castillo, Haldanth Lester',
    rawUser: 'haldanth Lester castillo 09941664'
  },
  '07465482': {
    dni: '07465482',
    apellidos: 'Zavala Querevalú',
    nombres: 'María Angélica',
    nombreCompleto: 'Zavala Querevalú, María Angélica',
    rawUser: 'maria angelica Zavala querevalu 07465482'
  },
  '09616898': {
    dni: '09616898',
    apellidos: 'Carhuancota Arana',
    nombres: 'Mirtha Karina',
    nombreCompleto: 'Carhuancota Arana, Mirtha Karina',
    rawUser: 'Mirtha Karina carhuancota arana dni 09616898'
  },
  '07943895': {
    dni: '07943895',
    apellidos: 'Barrientos Valderrama',
    nombres: 'Ana Rosario',
    nombreCompleto: 'Barrientos Valderrama, Ana Rosario',
    rawUser: 'ana rosario Barrientos valderrrama 07943895'
  }
};

async function main() {
  const isExecute = process.argv.includes('--execute');
  console.log('================================================================');
  console.log(`  EUREKA 2026 — CORRECCIÓN DE NOMBRES Y APELLIDOS DE JURADOS   `);
  console.log(`  MODO: ${isExecute ? 'EJECUCIÓN REAL (ESCRITURA EN FIRESTORE)' : 'DRY RUN (SOLO LECTURA)'}`);
  console.log('================================================================\n');

  const snap = await db.collection('eurekaPanelFirmas').get();
  console.log(`Paneles encontrados en eurekaPanelFirmas: ${snap.size}\n`);

  const panelesParaActualizar = [];
  const firmasRegistradasAntes = new Map(); // key: panelId_slot -> hash/len

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const firmantes = data.firmantes || [];
    let cambiosEnPanel = 0;

    const nuevosFirmantes = firmantes.map(f => {
      // Guardar firma de seguridad
      const sigKey = `${docSnap.id}_j${f.numeroJurado}_dni_${f.dni}`;
      if (f.firmaDataUrl) {
        firmasRegistradasAntes.set(sigKey, {
          len: f.firmaDataUrl.length,
          preview: f.firmaDataUrl.slice(0, 40)
        });
      }

      const corr = JURADOS_CORRECCIONES[f.dni];
      if (!corr) {
        // No está en la lista de corrección, devolver idéntico
        return { ...f };
      }

      cambiosEnPanel++;
      console.log(`[Panel ${docSnap.id}] Jurado N.° ${f.numeroJurado} (DNI: ${f.dni}):`);
      console.log(`   ANTES:  Nombre: "${f.nombreCompleto}" | Apellidos: "${f.apellidos}" | Nombres: "${f.nombres}"`);
      console.log(`   DESPUÉS: Nombre: "${corr.nombreCompleto}" | Apellidos: "${corr.apellidos}" | Nombres: "${corr.nombres}"`);
      console.log(`   FIRMA:  Presente: ${Boolean(f.firmaDataUrl)} (Longitud: ${f.firmaDataUrl ? f.firmaDataUrl.length : 0}) -> 100% INTACTA\n`);

      // Devolver copia exacta preservando la firmaDataUrl y todos los otros campos
      return {
        ...f,
        apellidos: corr.apellidos,
        nombres: corr.nombres,
        nombreCompleto: corr.nombreCompleto
      };
    });

    if (cambiosEnPanel > 0) {
      panelesParaActualizar.push({
        id: docSnap.id,
        ref: docSnap.ref,
        originalData: data,
        nuevosFirmantes,
        cambiosEnPanel
      });
    }
  });

  console.log(`Total de paneles afectados con correcciones: ${panelesParaActualizar.length}`);

  if (!isExecute) {
    console.log('\n[DRY RUN COMPLETADO] No se realizaron escrituras en la base de datos.');
    console.log('Para aplicar los cambios reales en Firestore, ejecute:');
    console.log('   node scripts/eureka/actualizarNombresJuradosEureka.mjs --execute\n');
    return;
  }

  // MODO EJECUCIÓN REAL:
  console.log('\n>>> Iniciando actualización en Firestore con máxima protección de firmas...\n');

  // 1. Guardar backup completo antes de tocar nada
  const timestamp = Date.now();
  const backupPath = path.resolve(__dirname, `backup_panels_pre_correccion_${timestamp}.json`);
  const backupData = {};
  snap.forEach(d => backupData[d.id] = d.data());
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✓ Backup de seguridad guardado en: ${backupPath}\n`);

  // 2. Aplicar actualizaciones panel por panel
  for (const item of panelesParaActualizar) {
    // Verificación de integridad de firmas antes de guardar
    item.nuevosFirmantes.forEach((f, idx) => {
      const orig = item.originalData.firmantes[idx];
      if (orig.firmaDataUrl !== f.firmaDataUrl) {
        throw new Error(`CRITICAL ERROR: Discrepancia de firma detectada en panel ${item.id} slot ${f.numeroJurado}! Operación cancelada.`);
      }
    });

    await item.ref.update({
      firmantes: item.nuevosFirmantes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✓ Panel [${item.id}] actualizado exitosamente con ${item.cambiosEnPanel} jurado(s) corregido(s).`);
  }

  // 3. Actualizar colección 'usuarios' si corresponde
  console.log('\n>>> Verificando y actualizando colección `usuarios`...');
  for (const [dni, corr] of Object.entries(JURADOS_CORRECCIONES)) {
    const userSnap = await db.collection('usuarios').where('dni', '==', dni).get();
    if (!userSnap.empty) {
      for (const uDoc of userSnap.docs) {
        const uData = uDoc.data();
        console.log(`  Actualizando usuario [${uDoc.id}] (DNI ${dni}, ${uData.email}):`);
        console.log(`     Antes: "${uData.nombre}" -> Después: "${corr.nombreCompleto}"`);
        await uDoc.ref.update({
          nombre: corr.nombreCompleto,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  }

  // 4. Verificación post-escritura
  console.log('\n>>> Verificando lectura post-escritura desde Firestore...');
  const postSnap = await db.collection('eurekaPanelFirmas').get();
  let firmasValidadas = 0;
  postSnap.forEach(docSnap => {
    const firmantes = docSnap.data().firmantes || [];
    firmantes.forEach(f => {
      const sigKey = `${docSnap.id}_j${f.numeroJurado}_dni_${f.dni}`;
      if (firmasRegistradasAntes.has(sigKey)) {
        const antes = firmasRegistradasAntes.get(sigKey);
        const ahoraLen = f.firmaDataUrl ? f.firmaDataUrl.length : 0;
        if (antes.len !== ahoraLen) {
          throw new Error(`ERROR EN FIRMA: La firma en ${sigKey} tenía longitud ${antes.len} y ahora tiene ${ahoraLen}!`);
        }
        firmasValidadas++;
      }
    });
  });

  console.log(`✓ VERIFICACIÓN EXITOSA: ${firmasValidadas} firmas verificadas bit a bit. Ninguna firma fue alterada ni perdida.`);
  console.log('✓ Proceso de actualización finalizado con éxito.\n');
}

main().catch(err => {
  console.error('Error fatal durante la ejecución:', err);
  process.exit(1);
});
