import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { RecurringManager } from "./recurring-manager";
import type { Category } from "@/lib/types";

export default async function RecurringPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const [{ data: recurring }, { data: categories }] = await Promise.all([
    supabase
      .from("recurring_expenses")
      .select("*, categories(name, icon)")
      .eq("household_id", householdId)
      .order("day_of_month"),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">הוצאות קבועות וחוזרות</h1>
      <RecurringManager
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recurring={(recurring as any) ?? []}
        categories={(categories as Category[]) ?? []}
      />
    </div>
  );
}
