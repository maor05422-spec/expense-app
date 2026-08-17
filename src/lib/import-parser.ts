// פענוח קבצי הוצאות (Excel / CSV / PDF) שמורדים מאתרי חברות האשראי
// ומיפוי גמיש (heuristic) של עמודות תאריך / תיאור / סכום, כי לכל חברה פורמט שונה.

export type ParsedRow = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
};

// סדר החשיבות חשוב: רומזים ספציפיים יותר קודם, כדי שלא "יתפסו" בטעות עמודה של שדה אחר
// (לדוגמה: "עסק" הוא גם תת-מחרוזת של "עסקה", ולכן חייב תמיד לבוא אחרי הרומזים המדויקים יותר)
const DATE_HEADER_HINTS = ["תאריך עסקה", "תאריך רכישה", "תאריך חיוב", "תאריך", "date"];
const DESC_HEADER_HINTS = [
  "שם בית עסק",
  "בית עסק",
  "תיאור",
  "פרטי עסקה",
  "פרטים",
  "description",
  "merchant",
];
const AMOUNT_HEADER_HINTS = [
  "סכום חיוב באשראי",
  "סכום חיוב",
  "סכום עסקה",
  "סכום",
  "amount",
  "חיוב",
];

function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase();
}

/** מנסה לפרש טקסט כתאריך בפורמטים נפוצים בישראל (DD/MM/YYYY, DD-MM-YY וכו') ומחזיר YYYY-MM-DD */
export function tryParseDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;

  // תאריך שכבר הגיע כאובייקט Date (נפוץ בקבצי Excel אמיתיים)
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }

  // מספר סידורי של Excel (ימים מאז 1899-12-30)
  if (typeof raw === "number" && raw > 20000 && raw < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + raw * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  const s = String(raw).trim();

  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return toISO(+m[1], +m[2], +m[3]);

  // DD/MM/YYYY או DD-MM-YYYY
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return toISO(+m[3], +m[2], +m[1]);

  // DD/MM/YY
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/);
  if (m) return toISO(2000 + +m[3], +m[2], +m[1]);

  return null;
}

function toISO(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** מנסה לפרש טקסט/מספר כסכום כספי (תומך בפסיקים, סימן ₪, ומינוסים) */
export function tryParseAmount(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Math.abs(raw);

  const s = String(raw)
    .replace(/[₪,\s]/g, "")
    .replace(/^\((.+)\)$/, "-$1"); // (100) -> -100

  const n = Number(s);
  if (isNaN(n)) return null;
  return Math.abs(n);
}

/** מפענח קובץ Excel/CSV (buffer) ומחזיר שורות מזוהות */
export function parseSpreadsheet(buffer: ArrayBuffer): ParsedRow[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");

  const bytes = new Uint8Array(buffer);
  // קבצי xlsx/xls בינאריים מתחילים ב-"PK" (חתימת ZIP) או בחתימת OLE הישנה של Excel;
  // כל דבר אחר (כולל CSV) מטופל כטקסט, כדי שעברית תיקרא נכון (UTF-8) ולא תתקלקל
  const isBinarySpreadsheet =
    bytes.length > 2 &&
    ((bytes[0] === 0x50 && bytes[1] === 0x4b) || (bytes[0] === 0xd0 && bytes[1] === 0xcf));

  const workbook = isBinarySpreadsheet
    ? XLSX.read(buffer, { type: "buffer", cellDates: true })
    : XLSX.read(new TextDecoder("utf-8").decode(buffer).replace(/^﻿/, ""), {
        type: "string",
        cellDates: true,
      });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  if (rows.length === 0) return [];

  // מציאת שורת הכותרות (השורה הראשונה עם לפחות 2 תאים לא ריקים)
  let headerRowIndex = rows.findIndex((r) => r.filter((c) => c != null && c !== "").length >= 2);
  if (headerRowIndex === -1) headerRowIndex = 0;
  const header = rows[headerRowIndex].map(normalizeHeader);

  // מחפש עמודה לפי רשימת רומזים (בסדר עדיפות), תוך התעלמות מעמודות שכבר שויכו לשדה אחר
  const findCol = (hints: string[], taken: Set<number>) => {
    for (const hint of hints) {
      const idx = header.findIndex((h, i) => !taken.has(i) && h.includes(hint.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const taken = new Set<number>();
  let dateCol = findCol(DATE_HEADER_HINTS, taken);
  if (dateCol !== -1) taken.add(dateCol);
  let amountCol = findCol(AMOUNT_HEADER_HINTS, taken);
  if (amountCol !== -1) taken.add(amountCol);
  let descCol = findCol(DESC_HEADER_HINTS, taken);
  if (descCol !== -1) taken.add(descCol);

  const dataRows = rows.slice(headerRowIndex + 1);

  // אם לא זיהינו לפי כותרות - ננחש לפי תוכן העמודות
  if (dateCol === -1 || amountCol === -1) {
    const colCount = Math.max(...rows.map((r) => r.length));
    const dateScores = new Array(colCount).fill(0);
    const numScores = new Array(colCount).fill(0);
    const textLen = new Array(colCount).fill(0);

    for (const row of dataRows) {
      for (let c = 0; c < colCount; c++) {
        const v = row[c];
        if (tryParseDate(v)) dateScores[c]++;
        else if (tryParseAmount(v) != null && typeof v !== "string") numScores[c]++;
        else if (typeof v === "string" && tryParseAmount(v) != null) numScores[c] += 0.5;
        if (typeof v === "string") textLen[c] += v.length;
      }
    }

    if (dateCol === -1) dateCol = dateScores.indexOf(Math.max(...dateScores));
    if (amountCol === -1) {
      // מעדיפים את העמודה הימנית ביותר עם ציון גבוה (לרוב "סכום חיוב" מגיע אחרי "סכום עסקה מקורי")
      let best = -1;
      let bestScore = 0;
      for (let c = 0; c < colCount; c++) {
        if (numScores[c] >= bestScore) {
          bestScore = numScores[c];
          best = c;
        }
      }
      amountCol = best;
    }
    if (descCol === -1) {
      let best = -1;
      let bestLen = -1;
      for (let c = 0; c < colCount; c++) {
        if (c === dateCol || c === amountCol) continue;
        if (textLen[c] > bestLen) {
          bestLen = textLen[c];
          best = c;
        }
      }
      descCol = best;
    }
  }

  const result: ParsedRow[] = [];
  for (const row of dataRows) {
    const date = tryParseDate(row[dateCol]);
    const amount = tryParseAmount(row[amountCol]);
    if (!date || amount == null || amount === 0) continue;
    const description = descCol >= 0 ? String(row[descCol] ?? "").trim() : "";
    result.push({ date, description: description || "ללא תיאור", amount });
  }

  return result;
}

/** מפענח קובץ PDF (best-effort) - מחפש שורות שמכילות תאריך + סכום */
export async function parsePdfStatement(buffer: Buffer): Promise<ParsedRow[]> {
  // ה-import הזה במכוון עוקף את index.js של pdf-parse (יש בו קוד דמו שנכשל בסביבת שרת)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer);
  const lines: string[] = data.text.split("\n").map((l: string) => l.trim()).filter(Boolean);

  const lineRegex =
    /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}).{2,80}?([\d,]+\.\d{2}|[\d,]+)\s*(?:₪|ש"ח)?\s*$/;

  const result: ParsedRow[] = [];
  for (const line of lines) {
    const m = line.match(lineRegex);
    if (!m) continue;
    const date = tryParseDate(m[1]);
    const amount = tryParseAmount(m[2]);
    if (!date || amount == null || amount === 0) continue;
    const description = line
      .replace(m[1], "")
      .replace(m[2], "")
      .replace(/₪|ש"ח/g, "") // מסירים רק את סימני המטבע בסוף השורה, לא כל תו ח/" שבתיאור עצמו
      .trim();
    result.push({ date, description: description || "ללא תיאור", amount });
  }

  return result;
}
