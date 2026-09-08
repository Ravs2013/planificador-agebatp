import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { PARTICIPANTES_SICE } from './src/data/juegosFloralesPadronSICE.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathDoc = 'C:/Users/perum/Desktop/excel de ejemplo/Nueva carpeta/Reporte_Docentes.xls';
const pathPart = 'C:/Users/perum/Desktop/excel de ejemplo/Nueva carpeta/Reporte_Participantes.xls';

const wbDoc = XLSX.readFile(pathDoc);
const dataDoc = XLSX.utils.sheet_to_json(wbDoc.Sheets[wbDoc.SheetNames[0]]);

const wbPart = XLSX.readFile(pathPart);
const dataPart = XLSX.utils.sheet_to_json(wbPart.Sheets[wbPart.SheetNames[0]]);

console.log(`Total PARTICIPANTES_SICE: ${PARTICIPANTES_SICE.length}`);
console.log(`Total Reporte_Docentes: ${dataDoc.length}`);
console.log(`Total Reporte_Participantes: ${dataPart.length}`);

function norm(s) {
  return String(s || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^IE\s*-\s*|^CEBA\s*-\s*/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

function normCat(c) {
  const m = String(c || '').match(/[DEFH]/i);
  return m ? m[0].toUpperCase() : '';
}

let matchedDoc = 0;
let matchedPart = 0;
const unmatched = [];

PARTICIPANTES_SICE.forEach(p => {
  const pIIEE = norm(p.iiee);
  const pCat = normCat(p.categoria);
  const pDisc = norm(p.disciplina);
  const pTit = norm(p.titulo);
  const pSeu = norm(p.seudonimo);

  // Match Docente
  let dMatches = dataDoc.filter(d => {
    const dIIEE = norm(d.NOMBRE_IIEE);
    const dCat = normCat(d.CATEGORIA);
    const dDisc = norm(d.DISCIPLINA);
    return dCat === pCat && dDisc === pDisc && (dIIEE === pIIEE || dIIEE.includes(pIIEE) || pIIEE.includes(dIIEE));
  });

  // Match Participantes
  let ptMatches = dataPart.filter(pt => {
    const ptIIEE = norm(pt.NOMBRE_IIEE);
    const ptCat = normCat(pt.CATEGORIA);
    const ptDisc = norm(pt.DISCIPLINA);
    const ptTit = norm(pt.TITULO_PROYECTO);
    const ptSeu = norm(pt.PSEUDONIMO);

    if (ptCat === pCat && ptDisc === pDisc) {
      if (pTit && ptTit && ptTit === pTit) return true;
      if (pSeu && ptSeu && ptSeu === pSeu) return true;
      if (ptIIEE === pIIEE || ptIIEE.includes(pIIEE) || pIIEE.includes(ptIIEE)) return true;
    }
    return false;
  });

  if (dMatches.length > 0) matchedDoc++;
  else unmatched.push({ type: 'Docente', p });

  if (ptMatches.length > 0) matchedPart++;
  else unmatched.push({ type: 'Participante', p });
});

console.log(`\nDocentes matched: ${matchedDoc} / ${PARTICIPANTES_SICE.length}`);
console.log(`Participantes matched: ${matchedPart} / ${PARTICIPANTES_SICE.length}`);

if (unmatched.length > 0) {
  console.log('\nUnmatched items:', unmatched);
}
