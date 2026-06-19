/* ════════════════════════════════════════════════════════════════
   Firebase Storage / Webhook File Upload — AGEBATP UGEL 03
   ════════════════════════════════════════════════════════════════ */

import { storage } from "./config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { API } from "../api/endpoints";

/**
 * Uploads a file to Firebase Storage or falls back to n8n webhook upload.
 * Supports both JS File objects and custom { name, base64, mimeType } objects.
 * 
 * @param {string} actId Actividad ID
 * @param {string} personalId Personal ID who uploads the file
 * @param {File|object} file File object or { name, base64, mimeType }
 * @param {function} onProgress Progress callback (0 to 100)
 * @returns {Promise<string>} Download URL
 */
export async function uploadEvidencia(actId, personalId, file, onProgress = null) {
  const useFirebaseStorage = import.meta.env.VITE_USE_FIREBASE_STORAGE === "true";

  if (useFirebaseStorage) {
    try {
      let fileBlob = null;
      let fileName = "";

      if (file instanceof File) {
        fileBlob = file;
        fileName = file.name;
      } else if (file && file.base64) {
        const byteCharacters = atob(file.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileBlob = new Blob([byteArray], { type: file.mimeType });
        fileName = file.name;
      } else {
        throw new Error("Formato de archivo inválido para subida a Firebase Storage.");
      }

      const storageRef = ref(storage, `evidencias/${actId}/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, fileBlob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error("Error en Firebase Storage upload:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (e) {
      console.warn("Fallo subida a Firebase Storage, intentando fallback a Webhook n8n:", e);
    }
  }

  // Fallback to n8n Webhook
  let fileData = file;
  if (file instanceof File) {
    fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve({
          name: file.name,
          mimeType: file.type,
          base64: base64
        });
      };
      reader.onerror = (error) => reject(error);
    });
  }

  if (onProgress) onProgress(30);
  const result = await API.subirEvidencia(actId, personalId, fileData);
  if (onProgress) onProgress(100);

  if (result && result.success && result.url) {
    return result.url;
  } else if (result && result.url) {
    return result.url;
  } else {
    throw new Error((result && result.message) || "Error al subir evidencia vía webhook de n8n");
  }
}

/**
 * Sube una evidencia al endpoint de la Herramienta E-SINAD (Drive/OneDrive).
 * La herramienta crea la estructura de carpetas:
 *   EVIDENCIAS-ACTIVIDADES / Año / Mes / Día / NombreActividad / (archivo)
 * 
 * @param {object} params
 * @param {string} params.actividadId - ID de la actividad
 * @param {string} params.actividadNombre - Nombre/título de la actividad
 * @param {string} params.fecha - Fecha en formato YYYY-MM-DD
 * @param {object} params.file - { name, mimeType, base64 }
 * @returns {Promise<{ ok: boolean, linkDrive: string|null, linkOnedrive: string|null, carpeta: string }>}
 */
export async function uploadEvidenciaDrive({ actividadId, actividadNombre, fecha, file }) {
  const base = import.meta.env.VITE_ESINAD_API;
  const token = import.meta.env.VITE_EVIDENCIA_TOKEN || "";
  if (!base) throw new Error("VITE_ESINAD_API no configurado");

  const res = await fetch(`${base.replace(/\/+$/, "")}/api/evidencia`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Evidencia-Token": token,
    },
    body: JSON.stringify({
      actividadId,
      actividadNombre,
      fecha,
      archivo: file,
    }),
  });

  if (!res.ok) throw new Error(`Subida a Drive falló: HTTP ${res.status}`);
  return res.json(); // { ok, linkDrive, linkOnedrive, carpeta }
}

