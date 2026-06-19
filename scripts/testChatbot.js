import admin from "firebase-admin";
import fs from "fs";
import { initializeApp } from "firebase/app";

// Load client-side firebase config
const envFile = fs.readFileSync(".env", "utf8");
const config = {};
envFile.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join("=").trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    config[key] = val;
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
};

console.log("Firebase config loaded:", firebaseConfig);

const app = initializeApp(firebaseConfig);

async function run() {
  const { getAI, GoogleAIBackend, getGenerativeModel } = await import("firebase/ai");
  
  console.log("Initializing AI...");
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  
  console.log("Getting generative model...");
  const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
  
  console.log("Starting chat...");
  
  const messages = [
    { role: "model", text: "¡Hola! Soy tu Asistente IA de AGEBATP. ¿En qué puedo ayudarte hoy?" }
  ];
  
  const firstUserIndex = messages.findIndex(msg => msg.role === "user");
  const historyMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : [];
  
  const historyFormatted = historyMessages.map(msg => ({
    role: msg.role === "assistant" ? "model" : msg.role,
    parts: [{ text: msg.text }]
  }));

  const chat = model.startChat({
    history: historyFormatted,
    systemInstruction: {
      parts: [{ text: "Eres un asistente de pruebas." }]
    }
  });
  
  console.log("Sending test message...");
  const result = await chat.sendMessage("Hola, esta es una prueba.");
  const text = typeof result.response.text === "function" ? result.response.text() : result.response.text;
  console.log("Response text:", text);
}

run().catch(console.error);
