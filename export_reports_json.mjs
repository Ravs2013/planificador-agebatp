import XLSX from 'xlsx';
import fs from 'fs';

const pathDoc = 'C:/Users/perum/Desktop/excel de ejemplo/Nueva carpeta/Reporte_Docentes.xls';
const pathPart = 'C:/Users/perum/Desktop/excel de ejemplo/Nueva carpeta/Reporte_Participantes.xls';

const wbDoc = XLSX.readFile(pathDoc);
const dataDoc = XLSX.utils.sheet_to_json(wbDoc.Sheets[wbDoc.SheetNames[0]]);

const wbPart = XLSX.readFile(pathPart);
const dataPart = XLSX.utils.sheet_to_json(wbPart.Sheets[wbPart.SheetNames[0]]);

fs.writeFileSync('scratch_docentes.json', JSON.stringify(dataDoc, null, 2), 'utf8');
fs.writeFileSync('scratch_participantes.json', JSON.stringify(dataPart, null, 2), 'utf8');

console.log(`Successfully exported:`);
console.log(`  scratch_docentes.json (${dataDoc.length} rows)`);
console.log(`  scratch_participantes.json (${dataPart.length} rows)`);
