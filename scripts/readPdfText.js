import admin from "firebase-admin"; // Just to make sure ES modules work or we can import fs
import fs from "fs";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfPath = "C:\\Users\\perum\\Desktop\\Monitoreo etp fichas escaneadas\\000215051 - MENDOZA SANTOS, JOSE FELIX - FICHA.pdf";

if (!fs.existsSync(pdfPath)) {
  console.error("No se encontro el archivo PDF en la ruta:", pdfPath);
  process.exit(1);
}

async function run() {
  const buf = fs.readFileSync(pdfPath);
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(it => it.str).join('\n') + '\n';
  }
  
  console.log("=== PDF RAW TEXT ===");
  console.log(text);
}

run().catch(console.error);
