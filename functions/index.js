const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { uploadFileToOneDrive } = require("./onedrive");
const { uploadFileToDrive } = require("./gdrive");

initializeApp();

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getMonthName(dateStr) {
  try {
    const parts = dateStr.split('-');
    const m = parseInt(parts[1], 10);
    return monthNames[m - 1] || 'Otros';
  } catch {
    return 'Otros';
  }
}

function getYear(dateStr) {
  try {
    return dateStr.split('-')[0] || '2026';
  } catch {
    return '2026';
  }
}

// 1. subirDocumentoMonitoreo
exports.subirDocumentoMonitoreo = onCall(
  {
    secrets: ["MS_CLIENT_ID", "MS_CLIENT_SECRET", "MS_TENANT", "SHAREPOINT_DRIVE_ID"],
    cors: true
  },
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "El usuario debe estar autenticado.");
    }

    const { categoria, tipoMonitoreo, programa, institucionNombre, personaNombre, fecha, base64, filename } = request.data;
    if (!base64 || !filename || !fecha || !programa || !personaNombre) {
      throw new HttpsError("invalid-argument", "Faltan parámetros obligatorios en la solicitud.");
    }

    const msClientId = process.env.MS_CLIENT_ID;
    const msClientSecret = process.env.MS_CLIENT_SECRET;
    const msTenant = process.env.MS_TENANT;
    const sharepointDriveId = process.env.SHAREPOINT_DRIVE_ID;

    if (!msClientId || !msClientSecret || !msTenant || !sharepointDriveId) {
      throw new HttpsError(
        "failed-precondition",
        "Las credenciales de Microsoft SharePoint/OneDrive no están configuradas en Firebase Secret Manager."
      );
    }

    try {
      const fileBuffer = Buffer.from(base64, 'base64');
      const cleanPersona = personaNombre.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      const prefix = tipoMonitoreo === 'director' ? 'DIR-' : 'PROF-';
      const folderName = `${prefix}${cleanPersona}`;
      
      const year = getYear(fecha);
      const month = getMonthName(fecha);
      const relativePath = `_AGEBATP/INFORME-MONITOREOS/${programa}/${year}/${month}/${folderName}/${filename}`;

      console.log(`Subiendo informe a OneDrive: ${relativePath}`);
      const uploadRes = await uploadFileToOneDrive({
        tenant: msTenant,
        clientId: msClientId,
        clientSecret: msClientSecret,
        driveId: sharepointDriveId,
        path: relativePath,
        fileBuffer
      });

      return {
        ok: true,
        linkOnedrive: uploadRes.webUrl
      };
    } catch (err) {
      console.error("Error al subir a OneDrive:", err);
      throw new HttpsError("internal", `Error interno al subir archivo a OneDrive: ${err.message}`);
    }
  }
);

// 2. subirEvidenciaActividad
exports.subirEvidenciaActividad = onCall(
  {
    secrets: ["GDRIVE_SA_JSON", "GDRIVE_SHARED_DRIVE_ID"],
    cors: true
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "El usuario debe estar autenticado.");
    }

    const { actividadNombre, fecha, base64, filename } = request.data;
    if (!base64 || !filename || !fecha || !actividadNombre) {
      throw new HttpsError("invalid-argument", "Faltan parámetros obligatorios en la solicitud.");
    }

    const saJson = process.env.GDRIVE_SA_JSON;
    const sharedDriveId = process.env.GDRIVE_SHARED_DRIVE_ID;

    if (!saJson || !sharedDriveId) {
      throw new HttpsError(
        "failed-precondition",
        "Las credenciales de Google Drive Shared Drive no están configuradas en Firebase Secret Manager."
      );
    }

    try {
      const fileBuffer = Buffer.from(base64, 'base64');
      const year = getYear(fecha);
      const month = getMonthName(fecha);
      const cleanActName = actividadNombre.replace(/[^a-zA-Z0-9 ]/g, '').trim();

      const pathSegments = ['EVIDENCIAS-ACTIVIDADES', year, month, cleanActName];

      console.log(`Subiendo evidencia a Google Drive: ${pathSegments.join('/')}/${filename}`);
      const uploadRes = await uploadFileToDrive({
        saJson,
        sharedDriveId,
        pathSegments,
        filename,
        mimeType: 'application/octet-stream', // general file type
        fileBuffer
      });

      return {
        ok: true,
        linkDrive: uploadRes.webViewLink
      };
    } catch (err) {
      console.error("Error al subir a Google Drive:", err);
      throw new HttpsError("internal", `Error interno al subir archivo a Google Drive: ${err.message}`);
    }
  }
);
