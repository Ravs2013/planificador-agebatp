import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "dummy",
  authDomain: "dummy",
  projectId: "dummy",
  storageBucket: "dummy",
  messagingSenderId: "dummy",
  appId: "dummy",
};

const app = initializeApp(firebaseConfig);

async function test() {
  try {
    const { getVertexAI, getGenerativeModel } = await import("firebase/vertexai");
    console.log("SUCCESS: firebase/vertexai imported. getVertexAI:", typeof getVertexAI, "getGenerativeModel:", typeof getGenerativeModel);
  } catch (e) {
    console.error("FAILED to import firebase/vertexai:", e.message);
  }

  try {
    const { getAI, GoogleAIBackend } = await import("firebase/ai");
    console.log("SUCCESS: firebase/ai imported. getAI:", typeof getAI);
  } catch (e) {
    console.error("FAILED to import firebase/ai:", e.message);
  }
}

test();
