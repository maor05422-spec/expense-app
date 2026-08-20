"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";

export async function addTransaction(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  await supabase.from("transactions").insert({
    household_id: householdId,
    category_id: String(formData.get("category_id") || "") || null,
    amount: Number(formData.get("amount") || 0),
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    description: String(formData.get("description") || "") || null,
    paid_by: String(formData.get("paid_by") || "") || null,
    source: "manual",
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}

export async function updateTransaction(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase
    .from("transactions")
    .update({
      category_id: String(formData.get("category_id") || "") || null,
      amount: Number(formData.get("amount") || 0),
      date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
      description: String(formData.get("description") || "") || null,
      paid_by: String(formData.get("paid_by") || "") || null,
    })
    .eq("id", id)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("transactions").delete().eq("id", id).eq("household_id", householdId);

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
}
