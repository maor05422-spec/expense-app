"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { parsePdfStatement, parseSpreadsheet, type ParsedRow } from "@/lib/import-parser";
import { matchCategoryId } from "@/lib/keyword-rules";
import type { KeywordRule } from "@/lib/types";

export type ImportRow = ParsedRow & {
  categoryId: string | null;
  autoMatched: boolean;
  sourceFile: string;
};
export type ParseResult = { rows: ImportRow[]; error?: string; warning?: string };

async function parseOneFile(file: File): Promise<ParsedRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    return parsePdfStatement(Buffer.from(arrayBuffer));
  }
  return parseSpreadsheet(arrayBuffer);
}

/**
 * שלב 1: מקבל קובץ אחד או שניים שהועלו (Excel/CSV/PDF - למשל דוח מאסטרקארד + דוח ויזה
 * לאותו חודש), ומחזיר רשימה מאוחדת אחת של תנועות מזוהות לתצוגה מקדימה. כל שורה מקבלת
 * ניחוש קטגוריה אוטומטי לפי כללי מילות המפתח של הבית (אם קיימת התאמה), ותיוג לפי שם
 * הקובץ שממנו הגיעה - כדי שיהיה קל להבחין בין הכרטיסים בתצוגה המקדימה.
 */
export async function parseImportFile(formData: FormData): Promise<ParseResult> {
  const files = formData
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { rows: [], error: "לא נבחר קובץ" };
  }

  try {
    const perFileResults = await Promise.all(
      files.map(async (file) => {
        try {
          const parsed = await parseOneFile(file);
          return { file, parsed, error: null as string | null };
        } catch {
          return { file, parsed: [] as ParsedRow[], error: file.name };
        }
      })
    );

    const failedFiles = perFileResults.filter((r) => r.error).map((r) => r.file.name);
    const allParsed = perFileResults.flatMap((r) =>
      r.parsed.map((p) => ({ ...p, sourceFile: r.file.name }))
    );

    if (allParsed.length === 0) {
      return {
        rows: [],
        error:
          failedFiles.length > 0
            ? `לא הצלחנו לקרוא את הקובץ/ים: ${failedFiles.join(", ")}. ודאו שאלו קבצי Excel / CSV / PDF תקינים.`
            : "לא הצלחנו לזהות תנועות בקבצים. נסו קבצים אחרים או הזינו ידנית.",
      };
    }

    const { householdId } = await requireHousehold();
    const supabase = await createClient();
    const { data: ruleRows } = await supabase
      .from("keyword_rules")
      .select("*")
      .eq("household_id", householdId);
    const rules = (ruleRows as KeywordRule[]) ?? [];

    const rows: ImportRow[] = allParsed.map((r) => {
      const categoryId = matchCategoryId(r.description, rules);
      return { ...r, categoryId, autoMatched: categoryId !== null };
    });

    // ממיינים לפי תאריך כדי שתנועות משני הכרטיסים יוצגו בסדר כרונולוגי אחד, לא קובץ-אחרי-קובץ
    rows.sort((a, b) => a.date.localeCompare(b.date));

    return {
      rows,
      warning:
        failedFiles.length > 0
          ? `שימו לב: לא הצלחנו לקרוא את הקובץ "${failedFiles.join(", ")}" - שאר הקבצים כן נטענו.`
          : undefined,
    };
  } catch {
    return {
      rows: [],
      error: "אירעה שגיאה בקריאת הקבצים. ודאו שאלו קבצי Excel / CSV / PDF תקינים.",
    };
  }
}

/**
 * שלב 2: מכניס בבת אחת את התנועות שהמשתמש אישר (אחרי שיוך קטגוריה ומי שילם).
 * כל שורה שלא זוהתה אוטומטית וקיבלה קטגוריה ידנית מהמשתמש - נשמרת ככלל מילת מפתח
 * חדש, כדי שבפעם הבאה בית העסק הזה יזוהה לבד (בדיוק כמו בגיליון האקסל המקורי).
 */
export async function confirmImport(rows: ImportRow[], paidBy: string | null) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  if (rows.length === 0) return { inserted: 0, learned: 0 };

  const toInsert = rows.map((r) => ({
    household_id: householdId,
    category_id: r.categoryId || null,
    amount: r.amount,
    date: r.date,
    description: r.description,
    paid_by: paidBy || null,
    source: "manual" as const,
  }));

  const { error } = await supabase.from("transactions").insert(toInsert);
  if (error) throw new Error(error.message);

  // למידה: שורות שלא זוהו אוטומטית אבל קיבלו קטגוריה ידנית - הופכות לכלל קבוע
  const newRuleCandidates = rows.filter(
    (r) => !r.autoMatched && r.categoryId && r.description.trim()
  );
  let learned = 0;
  if (newRuleCandidates.length > 0) {
    const toUpsert = newRuleCandidates.map((r) => ({
      household_id: householdId,
      keyword: r.description.trim(),
      category_id: r.categoryId as string,
    }));
    const { error: ruleError, data } = await supabase
      .from("keyword_rules")
      .upsert(toUpsert, { onConflict: "household_id,keyword", ignoreDuplicates: true })
      .select("id");
    if (!ruleError) learned = data?.length ?? 0;
  }

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rules");

  return { inserted: toInsert.length, learned };
}
