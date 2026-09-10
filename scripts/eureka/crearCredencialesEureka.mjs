/* ════════════════════════════════════════════════════════════════
   Crea o actualiza las credenciales de los jurados de Eureka 2026.
   Usuario y contraseña: eurekagrado{1y2|3y4|5y6}jurado{1..4}@ugel03.gob.pe
   Escribe usuarios/{uid} con rol "jurado" y modulo "eureka".
   ════════════════════════════════════════════════════════════════ */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JURADOS = [
  /* ── Categoría A (1 y 2 Grado) ── */
  {
    correo: 'eurekagrado1y2jurado1@ugel03.gob.pe',
    nombreCompleto: 'Valderrama Barrientos, Ana Rosario',
    dni: '07943895',
    telefono: '962382336',
    correoPersonal: 'avalderrama@ugel03.gob.pe',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 1
  },
  {
    correo: 'eurekagrado1y2jurado2@ugel03.gob.pe',
    nombreCompleto: 'Pacheco Tello, Milagro Odila',
    dni: '09501677',
    telefono: '966506413',
    correoPersonal: 'pachecomila@hotmail.com',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 2
  },
  {
    correo: 'eurekagrado1y2jurado3@ugel03.gob.pe',
    nombreCompleto: 'Guerra Narro, Amparo del Rosario',
    dni: '09187543',
    telefono: '959354883',
    correoPersonal: 'amparodelrosa@gmail.com',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 3
  },
  {
    correo: 'eurekagrado1y2jurado4@ugel03.gob.pe',
    nombreCompleto: 'Villalobos Quiroz, Alexsander Demetrio',
    dni: '40506347',
    telefono: '989778738',
    correoPersonal: 'advillquir_80@hotmail.com',
    grupo: 'A',
    categoria: 'A',
    grados: '1 y 2 grado',
    numeroJurado: 4
  },

  /* ── Categoría B (3 y 4 Grado) ── */
  {
    correo: 'eurekagrado3y4jurado1@ugel03.gob.pe',
    nombreCompleto: 'González y Acosta, Margot Magdalena',
    dni: '22407181',
    telefono: '998068063',
    correoPersonal: 'mmgonzaleza@ugel03.gob.pe',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 1
  },
  {
    correo: 'eurekagrado3y4jurado2@ugel03.gob.pe',
    nombreCompleto: 'Aranguren Carbajal, Ada María Lilly',
    dni: '08048697',
    telefono: '940208993',
    correoPersonal: 'amalic2640@gmail.com',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 2
  },
  {
    correo: 'eurekagrado3y4jurado3@ugel03.gob.pe',
    nombreCompleto: 'Olivos Flores, José María',
    dni: '33589617',
    telefono: '945231618',
    correoPersonal: 'jolivos@ugel03.gob.pe',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 3
  },
  {
    correo: 'eurekagrado3y4jurado4@ugel03.gob.pe',
    nombreCompleto: 'Smith Díaz, Sandra',
    dni: '76197403',
    telefono: '932576986',
    correoPersonal: 'sandrasd54@gmail.com',
    grupo: 'B',
    categoria: 'B',
    grados: '3 y 4 grado',
    numeroJurado: 4
  },

  /* ── Categoría C (5 y 6 Grado) ── */
  {
    correo: 'eurekagrado5y6jurado1@ugel03.gob.pe',
    nombreCompleto: 'Castillo Urday, Haldanth Lester',
    dni: '09941664',
    telefono: '993785173',
    correoPersonal: 'lcastillou@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 1
  },
  {
    correo: 'eurekagrado5y6jurado2@ugel03.gob.pe',
    nombreCompleto: 'Sánchez Ortiz, María Delfina',
    dni: '08395747',
    telefono: '989686505',
    correoPersonal: 'msanchezo@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 2
  },
  {
    correo: 'eurekagrado5y6jurado3@ugel03.gob.pe',
    nombreCompleto: 'Arana Carhuancota, Mirtha Karina',
    dni: '09616898',
    telefono: '922585542',
    correoPersonal: 'maranac@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 3
  },
  {
    correo: 'eurekagrado5y6jurado4@ugel03.gob.pe',
    nombreCompleto: 'Guzmán Britto, Martín',
    dni: '07903991',
    telefono: '959949630',
    correoPersonal: 'mguzman@ugel03.gob.pe',
    grupo: 'C',
    categoria: 'C',
    grados: '5 y 6 grado',
    numeroJurado: 4
  }
];

const rutaClave = path.resolve(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(rutaClave)) {
  console.error(`No se encontró la clave de cuenta de servicio (${rutaClave}).`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(rutaClave, 'utf8')))
});

const auth = admin.auth();
const db = admin.firestore();

async function run() {
  console.log(`Iniciando creación/actualización de ${JURADOS.length} credenciales para Eureka 2026...\n`);

  let creadas = 0;
  let actualizadas = 0;

  for (const j of JURADOS) {
    const correo = j.correo.toLowerCase();
    const password = correo; // La contraseña es igual al correo solicitado
    let uid;

    try {
      const existente = await auth.getUserByEmail(correo);
      uid = existente.uid;
      await auth.updateUser(uid, {
        password,
        displayName: j.nombreCompleto
      });
      actualizadas += 1;
      console.log(`[ACTUALIZADO AUTH] ${correo}`);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
      const nuevo = await auth.createUser({
        email: correo,
        password,
        displayName: j.nombreCompleto,
        emailVerified: true
      });
      uid = nuevo.uid;
      creadas += 1;
      console.log(`[CREADO AUTH] ${correo}`);
    }

    // Escribir en la colección usuarios/{uid}
    await db.collection('usuarios').doc(uid).set({
      nombre: j.nombreCompleto,
      nombreCompleto: j.nombreCompleto,
      email: correo,
      rol: 'jurado',
      modulo: 'eureka',
      grupo: j.grupo,
      categoria: j.categoria,
      grados: j.grados,
      numeroJurado: j.numeroJurado,
      dni: j.dni,
      telefono: j.telefono,
      cargo: `Jurado calificador — Eureka 2026 (${j.grados})`,
      debeCambiarPassword: false,
      permisos: ['eureka'],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`  -> Firestore usuarios/${uid} actualizado para ${j.nombreCompleto} (DNI ${j.dni})\n`);
  }

  console.log(`\n¡Listo! Credenciales creadas: ${creadas}, actualizadas: ${actualizadas}. Total: ${JURADOS.length}.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error al aprovisionar credenciales Eureka:', err);
  process.exit(1);
});
