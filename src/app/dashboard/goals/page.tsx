import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { GoalManager } from "./goal-manager";
import type { SavingsGoal } from "@/lib/types";

export default async function GoalsPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at");

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">יעדי חיסכון</h1>
      <GoalManager goals={(goals as SavingsGoal[]) ?? []} />
    </div>
  );
}
