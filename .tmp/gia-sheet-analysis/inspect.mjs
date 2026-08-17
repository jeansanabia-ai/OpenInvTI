import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/jean.sanabia/Downloads/Planilha de Inventário 2025.xlsx";
const outputDir = "C:/OpenInvTI/.tmp/gia-sheet-analysis/previews";
await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheetLines = (await workbook.inspect({ kind: "sheet", include: "id,name,address", maxChars: 20000 })).ndjson;
const sheets = sheetLines.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));

const norm = (value) => String(value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
const countValues = (values) => {
  const counts = new Map();
  for (const value of values.map(norm).filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

const results = [];
for (const record of sheets) {
  const sheet = workbook.worksheets.getItem(record.name);
  const used = sheet.getRange(record.address);
  const values = used.values;
  const formulas = used.formulas;
  let headerIndex = -1;
  let bestScore = 0;
  const known = ["estado", "status", "condição", "host /asset", "equip", "modelo", "série", "patrimonio", "usuário", "local", "setor", "hardware"];
  for (let r = 0; r < Math.min(values.length, 20); r += 1) {
    const row = values[r].map((v) => norm(v).toLocaleLowerCase("pt-BR"));
    const score = known.filter((name) => row.includes(name)).length;
    if (score > bestScore) { bestScore = score; headerIndex = r; }
  }

  const headers = headerIndex >= 0 ? values[headerIndex].map((v, i) => norm(v) || `COL_${i + 1}`) : [];
  const dataRows = headerIndex >= 0
    ? values.slice(headerIndex + 1).filter((row) => row.some((value) => norm(value)))
    : values.filter((row) => row.some((value) => norm(value)));
  const columns = headers.map((header, index) => {
    const raw = dataRows.map((row) => row[index]).filter((value) => norm(value));
    const counts = countValues(raw);
    return {
      index: index + 1,
      header,
      nonEmpty: raw.length,
      unique: counts.length,
      duplicates: counts.filter(([, count]) => count > 1).length,
      topValues: counts.slice(0, 8),
    };
  });
  const formulaCount = formulas.reduce((total, row) => total + row.filter((f) => String(f ?? "").trim()).length, 0);
  results.push({
    name: record.name,
    address: record.address,
    headerRow: headerIndex >= 0 ? headerIndex + 1 : null,
    dataRows: dataRows.length,
    formulaCount,
    columns,
  });

  const endCol = record.address.split(":")[1].replace(/\d+/g, "");
  const endRow = Math.min(values.length, Math.max(30, headerIndex + 15));
  const renderRange = `A1:${endCol}${endRow}`;
  const preview = await workbook.render({ sheetName: record.name, range: renderRange, scale: 1, format: "png" });
  const safeName = record.name.replace(/[<>:"/\\|?*]/g, "_");
  const previewPath = path.join(outputDir, `${safeName}.png`);
  await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
}

console.log(JSON.stringify({ workbook: { sheets: sheets.length }, sheets: results }, null, 2));
