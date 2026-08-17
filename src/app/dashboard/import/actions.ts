"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { parsePdfStatement, parseSpreadsheet, type ParsedRow } from "@/lib/import-parser";
import { matchCategoryId } from "@/lib/keyword-rules";
import type { KeywordRule } from "@/lib/types";

export type ImportRow = ParsedRow & { categoryId: string | null; autoMatched: boolean };
export type ParseResult = { rows: ImportRow[]; error?: string };

/**
 * שלב 1: מקבל קובץ שהועלה (Excel/CSV/PDF) ומחזיר רשימת תנועות מזוהות לתצוגה מקדימה,
 * כשכל שורה מקבלת ניחוש קטגוריה אוטומטי לפי כללי מילות המפתח של הבית (אם קיימת התאמה).
 */
export async function parseImportFile(formData: FormData): Promise<ParseResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { rows: [], error: "לא נבחר קובץ" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();

    let parsed: ParsedRow[];
    if (name.endsWith(".pdf")) {
      parsed = await parsePdfStatement(Buffer.from(arrayBuffer));
    } else {
      parsed = parseSpreadsheet(arrayBuffer);
    }

    if (parsed.length === 0) {
      return {
        rows: [],
        error: "לא הצלחנו לזהות תנועות בקובץ. נסו קובץ אחר או הזינו ידנית.",
      };
    }

    const { householdId } = await requireHousehold();
    const supabase = await createClient();
    const { data: ruleRows } = await supabase
      .from("keyword_rules")
      .select("*")
      .eq("household_id", householdId);
    const rules = (ruleRows as KeywordRule[]) ?? [];

    const rows: ImportRow[] = parsed.map((r) => {
      const categoryId = matchCategoryId(r.description, rules);
      return { ...r, categoryId, autoMatched: categoryId !== null };
    });

    return { rows };
  } catch {
    return {
      rows: [],
      error: "אירעה שגיאה בקריאת הקובץ. ודאו שזהו קובץ Excel / CSV / PDF תקין.",
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
