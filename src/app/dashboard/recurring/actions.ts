"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { monthKey, monthRange } from "@/lib/utils";

export async function addRecurring(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  await supabase.from("recurring_expenses").insert({
    household_id: householdId,
    category_id: String(formData.get("category_id") || "") || null,
    amount: Number(formData.get("amount") || 0),
    description: String(formData.get("description") || ""),
    day_of_month: Number(formData.get("day_of_month") || 1),
    active: true,
  });

  revalidatePath("/dashboard/recurring");
}

export async function toggleRecurring(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";

  await supabase
    .from("recurring_expenses")
    .update({ active: !active })
    .eq("id", id)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/recurring");
}

export async function deleteRecurring(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/recurring");
}

/** יוצר תנועה עבור כל הוצאה קבועה פעילה שעדיין אין לה תנועה בחודש הנתון */
export async function generateTransactionsForMonth(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const month = String(formData.get("month") || monthKey());
  const { start, end } = monthRange(month);

  const { data: recurring } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("household_id", householdId)
    .eq("active", true);

  const { data: existing } = await supabase
    .from("transactions")
    .select("recurring_id")
    .eq("household_id", householdId)
    .eq("source", "recurring")
    .gte("date", start)
    .lte("date", end);

  const alreadyGenerated = new Set((existing ?? []).map((t) => t.recurring_id));
  const [year, monthNum] = month.split("-").map(Number);

  const toInsert = (recurring ?? [])
    .filter((r) => !alreadyGenerated.has(r.id))
    .map((r) => ({
      household_id: householdId,
      category_id: r.category_id,
      amount: r.amount,
      description: r.description,
      date: `${year}-${String(monthNum).padStart(2, "0")}-${String(
        Math.min(r.day_of_month, 28)
      ).padStart(2, "0")}`,
      source: "recurring" as const,
      recurring_id: r.id,
    }));

  if (toInsert.length > 0) {
    await supabase.from("transactions").insert(toInsert);
  }

  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}
