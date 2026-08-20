"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";

export async function addGoal(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  await supabase.from("savings_goals").insert({
    household_id: householdId,
    name: String(formData.get("name") || ""),
    target_amount: Number(formData.get("target_amount") || 0),
    target_date: String(formData.get("target_date") || "") || null,
    icon: String(formData.get("icon") || "🎯"),
  });

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
}

export async function deleteGoal(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("savings_goals").delete().eq("id", id).eq("household_id", householdId);

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
}

export async function addRecurringContribution(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  await supabase.from("recurring_contributions").insert({
    household_id: householdId,
    goal_id: String(formData.get("goal_id") || ""),
    amount: Number(formData.get("amount") || 0),
    day_of_month: Number(formData.get("day_of_month") || 1),
    active: true,
  });

  revalidatePath("/dashboard/goals");
}

export async function toggleRecurringContribution(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";

  await supabase
    .from("recurring_contributions")
    .update({ active: !active })
    .eq("id", id)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/goals");
}

export async function deleteRecurringContribution(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase
    .from("recurring_contributions")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/goals");
}

export async function addContribution(formData: FormData) {
  const { householdId, user } = await requireHousehold();
  const supabase = await createClient();
  const goalId = String(formData.get("goal_id"));
  const amount = Number(formData.get("amount") || 0);

  if (amount <= 0) return;

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", goalId)
    .eq("household_id", householdId)
    .single();

  if (!goal) return;

  await supabase.from("savings_contributions").insert({
    goal_id: goalId,
    household_id: householdId,
    amount,
    user_id: user.id,
  });

  await supabase
    .from("savings_goals")
    .update({ current_amount: Number(goal.current_amount) + amount })
    .eq("id", goalId)
    .eq("household_id", householdId);

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
}
