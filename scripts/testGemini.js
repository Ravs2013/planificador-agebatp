import { initializeApp } from "firebase/app";
import { getAI, GoogleAIBackend, getGenerativeModel } from "firebase/ai";
import fs from "fs";

// Parse .env manually
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  envContent.split("\n").forEach(line => {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*([^#\r\n]+)/);
    if (match) {
      process.env[match[1]] = match[2].trim();
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log("Config:", firebaseConfig);

console.log("Inicializando Firebase...");
const app = initializeApp(firebaseConfig);

console.log("Inicializando Firebase AI...");
try {
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, { model: "gemini-1.5-flash" });
  
  console.log("Enviando mensaje de prueba a Gemini...");
  const result = await model.generateContent("Hola, eres el asistente de AGEBATP. Responde con un saludo breve.");
  console.log("Respuesta obtenida:");
  console.log(result.response.text);
} catch (error) {
  console.error("Error capturado durante la ejecucion:");
  console.error(error);
}
