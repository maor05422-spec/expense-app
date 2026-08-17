"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { parsePdfStatement, parseSpreadsheet, type ParsedRow } from "@/lib/import-parser";

export type ParseResult = { rows: ParsedRow[]; error?: string };

/** שלב 1: מקבל קובץ שהועלה (Excel/CSV/PDF) ומחזיר רשימת תנועות מזוהות לתצוגה מקדימה */
export async function parseImportFile(formData: FormData): Promise<ParseResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { rows: [], error: "לא נבחר קובץ" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();

    let rows: ParsedRow[];
    if (name.endsWith(".pdf")) {
      rows = await parsePdfStatement(Buffer.from(arrayBuffer));
    } else {
      rows = parseSpreadsheet(arrayBuffer);
    }

    if (rows.length === 0) {
      return {
        rows: [],
        error: "לא הצלחנו לזהות תנועות בקובץ. נסו קובץ אחר או הזינו ידנית.",
      };
    }

    return { rows };
  } catch {
    return {
      rows: [],
      error: "אירעה שגיאה בקריאת הקובץ. ודאו שזהו קובץ Excel / CSV / PDF תקין.",
    };
  }
}

export type ImportRow = ParsedRow & { categoryId: string | null };

/** שלב 2: מכניס בבת אחת את התנועות שהמשתמש אישר (אחרי שיוך קטגוריה ומי שילם) */
export async function confirmImport(rows: ImportRow[], paidBy: string | null) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  if (rows.length === 0) return { inserted: 0 };

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

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");

  if (error) throw new Error(error.message);
  return { inserted: toInsert.length };
}
