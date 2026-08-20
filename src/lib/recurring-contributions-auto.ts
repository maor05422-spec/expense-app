import { createClient } from "@/lib/supabase/server";
import { monthKey, monthRange } from "@/lib/utils";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * בדיוק כמו ensureRecurringGeneratedForToday (recurring-auto.ts), אבל עבור הפקדות
 * אוטומטיות ליעדי חיסכון: בודק אילו הפקדות חוזרות פעילות הגיע יום החיוב שלהן החודש,
 * ועדיין אין להן הפקדה שנוצרה החודש - יוצר אותן, ומעדכן את current_amount של כל יעד
 * בהתאם (כמו addContribution הידנית).
 *
 * נקרא בשקט מתוך layout הדשבורד בכל טעינת עמוד. לא זורק שגיאה אם משהו נכשל.
 */
export async function ensureRecurringContributionsGeneratedForToday(
  supabase: SupabaseServerClient,
  householdId: string
) {
  try {
    const today = new Date();
    const todayDay = today.getDate();
    const month = monthKey(today);
    const { start, end } = monthRange(month);

    const { data: recurring } = await supabase
      .from("recurring_contributions")
      .select("*")
      .eq("household_id", householdId)
      .eq("active", true);

    if (!recurring || recurring.length === 0) return;

    const due = recurring.filter((r) => Math.min(r.day_of_month, 28) <= todayDay);
    if (due.length === 0) return;

    const { data: existing } = await supabase
      .from("savings_contributions")
      .select("recurring_contribution_id")
      .eq("household_id", householdId)
      .not("recurring_contribution_id", "is", null)
      .gte("date", start)
      .lte("date", end);

    const alreadyGenerated = new Set((existing ?? []).map((c) => c.recurring_contribution_id));
    const [year, monthNum] = month.split("-").map(Number);
    const date = `${year}-${String(monthNum).padStart(2, "0")}-${String(
      Math.min(today.getDate(), 28)
    ).padStart(2, "0")}`;

    const toInsert = due.filter((r) => !alreadyGenerated.has(r.id));
    if (toInsert.length === 0) return;

    await supabase.from("savings_contributions").insert(
      toInsert.map((r) => ({
        goal_id: r.goal_id,
        household_id: householdId,
        amount: r.amount,
        date,
        user_id: null,
        recurring_contribution_id: r.id,
      }))
    );

    // עדכון current_amount לכל יעד - סוכם לפי goal_id (למקרה שיש כמה הפקדות חוזרות לאותו יעד)
    const sumByGoal = new Map<string, number>();
    for (const r of toInsert) {
      sumByGoal.set(r.goal_id, (sumByGoal.get(r.goal_id) ?? 0) + Number(r.amount));
    }

    const goalIds = Array.from(sumByGoal.keys());
    const { data: goals } = await supabase
      .from("savings_goals")
      .select("id, current_amount")
      .eq("household_id", householdId)
      .in("id", goalIds);

    for (const g of goals ?? []) {
      const addAmount = sumByGoal.get(g.id) ?? 0;
      await supabase
        .from("savings_goals")
        .update({ current_amount: Number(g.current_amount) + addAmount })
        .eq("id", g.id)
        .eq("household_id", householdId);
    }
  } catch {
    // פעולת רקע - כשל כאן לא אמור למנוע טעינת הדשבורד
  }
}
