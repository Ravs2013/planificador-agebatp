import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = 'C:\\Windows\\Fonts\\MTCORSVA.TTF';
const outputPath = path.join(__dirname, '..', 'src', 'pdf', 'fuenteCorsiva.js');

try {
  if (!fs.existsSync(fontPath)) {
    console.error('La fuente Monotype Corsiva no existe en la ruta especificada.');
    process.exit(1);
  }

  const fontBuffer = fs.readFileSync(fontPath);
  const base64Data = fontBuffer.toString('base64');

  const fileContent = `// Fuente Monotype Corsiva en Base64 para jsPDF\nexport const FONT_CORSIVA = "${base64Data}";\n`;
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log('Fuente Monotype Corsiva extraída y escrita exitosamente.');
} catch (error) {
  console.error('Error al extraer la fuente:', error);
  process.exit(1);
}
