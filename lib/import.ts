import * as XLSX from "xlsx";

/**
 * Lit un fichier .xlsx, .xls ou .csv et renvoie ses lignes comme un tableau
 * d'objets, avec les en-têtes de colonnes comme clés.
 * Fonctionne pour les deux formats grâce à la librairie xlsx (SheetJS),
 * qui détecte automatiquement le type de fichier.
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

/**
 * Cherche la valeur d'une colonne parmi plusieurs noms possibles (les gens
 * nomment rarement leurs colonnes exactement pareil : "Nom", "nom", "Name"...)
 */
export function pick(row: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    for (const rowKey of Object.keys(row)) {
      if (rowKey.trim().toLowerCase() === key.toLowerCase()) {
        return String(row[rowKey] ?? "").trim();
      }
    }
  }
  return "";
}
