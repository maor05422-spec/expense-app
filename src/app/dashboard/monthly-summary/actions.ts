"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { monthRange } from "@/lib/utils";

/** שם ואייקון קבועים לקטגוריית ה"עוגן" שמשמשת לרישום הכנסת החודש - נוצרת אוטומטית בפעם הראשונה */
const INCOME_CATEGORY_NAME = "הכנסה חודשית";
const INCOME_CATEGORY_ICON = "💰";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getOrCreateIncomeCategoryId(supabase: SupabaseServerClient, householdId: string) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("name", INCOME_CATEGORY_NAME)
    .eq("type", "income")
    .order("created_at", { ascending: true })
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id as string;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      household_id: householdId,
      name: INCOME_CATEGORY_NAME,
      icon: INCOME_CATEGORY_ICON,
      type: "income",
      monthly_budget: 0,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "יצירת קטגוריית הכנסה נכשלה");
  return created.id as string;
}

/**
 * "סגירת חודש": קובע/מעדכן את סכום ההכנסה הכולל לחודש נתון.
 * זו הפעולה היחידה שהמשתמש צריך לבצע בסוף כל חודש - שאר החישובים (הוצאות, חיסכון, אחוזים)
 * נגזרים אוטומטית מהתנועות הקיימות. שמירה חוזרת על אותו חודש מעדכנת את הסכום ולא יוצרת כפילות.
 */
export async function setMonthlyIncome(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const month = String(formData.get("month") || "");
  const amount = Number(formData.get("amount") || 0);
  if (!month || Number.isNaN(amount)) return;

  const categoryId = await getOrCreateIncomeCategoryId(supabase, householdId);
  const { start, end } = monthRange(month);

  const { data: existingRows } = await supabase
    .from("transactions")
    .select("id")
    .eq("household_id", householdId)
    .eq("category_id", categoryId)
    .gte("date", start)
    .lte("date", end)
    .order("created_at", { ascending: true })
    .limit(1);

  const existingId = existingRows?.[0]?.id as string | undefined;

  if (existingId) {
    await supabase
      .from("transactions")
      .update({ amount })
      .eq("id", existingId)
      .eq("household_id", householdId);
  } else {
    await supabase.from("transactions").insert({
      household_id: householdId,
      category_id: categoryId,
      amount,
      date: start,
      description: INCOME_CATEGORY_NAME,
      source: "manual",
    });
  }

  revalidatePath("/dashboard/monthly-summary");
  revalidatePath("/dashboard");
}
