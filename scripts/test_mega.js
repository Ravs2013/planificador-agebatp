import XLSX from "xlsx";
import fs from "fs";

const cebaPath = "C:\\Users\\perum\\Downloads\\MEGA_DIRECTORIO_CEBA_UGEL03.xlsx";

function inspectRows(filePath, sheetName, start, end) {
  if (fs.existsSync(filePath)) {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    console.log(`\n=== ROWS ${start}-${end} FOR ${sheetName} ===`);
    rows.slice(start, end + 1).forEach((row, i) => {
      const actualIdx = start + i;
      const cells = row.map((cell, colIdx) => {
        const addr = XLSX.utils.encode_cell({ r: actualIdx, c: colIdx });
        return `${addr}:${JSON.stringify(cell)}`;
      });
      console.log(`Row ${actualIdx}:`, cells.filter(c => c.split(":")[1] !== '""').join(" | "));
    });
  }
}

inspectRows(cebaPath, "01_Rosa Sta María", 14, 30);
