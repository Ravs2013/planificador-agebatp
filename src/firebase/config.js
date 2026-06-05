/* ════════════════════════════════════════════════════════════════
   Firebase Configuration — AGEBATP UGEL 03
   Lee todas las credenciales de variables de entorno (VITE_*)
   ════════════════════════════════════════════════════════════════ */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* Habilitar persistencia offline multi-tab para Firestore */
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn(
      "Firestore offline: multiples tabs abiertos, solo uno puede habilitar persistencia."
    );
  } else if (err.code === "unimplemented") {
    console.warn("Firestore offline: este navegador no soporta persistencia.");
  }
});

/* ── Firebase App Check (reCAPTCHA v3) ──
   Protege Firestore, Storage y AI Logic contra abusos.
   En desarrollo se usa debug token; en producción se requiere
   la clave del sitio reCAPTCHA v3 en VITE_RECAPTCHA_SITE_KEY. */
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  import("firebase/app-check").then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[OK] Firebase App Check inicializado con reCAPTCHA v3");
    } catch (e) {
      console.warn("[WARN] Error al inicializar App Check:", e);
    }
  });
}

/* ── Firebase AI Logic (Gemini) ──
   Se carga de forma lazy para no bloquear el arranque si el usuario
   no tiene AI Logic habilitado. */
let _ai = null;
let _chatModel = null;

export async function getAIInstance() {
  if (!_ai) {
    const { getAI, GoogleAIBackend } = await import("firebase/ai");
    _ai = getAI(app, { backend: new GoogleAIBackend() });
  }
  return _ai;
}

export async function getChatModel() {
  if (!_chatModel) {
    const ai = await getAIInstance();
    const { getGenerativeModel } = await import("firebase/ai");
    _chatModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
  }
  return _chatModel;
}


