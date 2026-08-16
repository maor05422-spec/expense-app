"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";

export async function addCategory(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  await supabase.from("categories").insert({
    household_id: householdId,
    name: String(formData.get("name") || ""),
    icon: String(formData.get("icon") || "") || null,
    monthly_budget: Number(formData.get("monthly_budget") || 0),
    type: String(formData.get("type") || "expense"),
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
}

export async function updateCategory(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase
    .from("categories")
    .update({
      name: String(formData.get("name") || ""),
      icon: String(formData.get("icon") || "") || null,
      monthly_budget: Number(formData.get("monthly_budget") || 0),
      type: String(formData.get("type") || "expense"),
    })
    .eq("id", id)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
}

export async function deleteCategory(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("categories").delete().eq("id", id).eq("household_id", householdId);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
}
