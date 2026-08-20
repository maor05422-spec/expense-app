import { createClient } from "@/lib/supabase/server";
import { monthKey, monthRange } from "@/lib/utils";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * בודק אם יש הוצאות קבועות פעילות שיום החיוב שלהן החודש כבר הגיע (או הגיע היום),
 * ועדיין אין להן תנועה שנוצרה החודש - ואם כן, יוצר אותן אוטומטית.
 *
 * נקרא בשקט מתוך layout הדשבורד בכל טעינת עמוד, כך שברגע שמאור או אנאל נכנסים
 * לאפליקציה - כל הוצאה קבועה שהגיע תורה מתווספת לבד, בלי צורך בלחיצת כפתור.
 * לא זורק שגיאה אם משהו נכשל - זו פעולת רקע, ולא רוצים שהיא תפיל את טעינת הדף.
 */
export async function ensureRecurringGeneratedForToday(
  supabase: SupabaseServerClient,
  householdId: string
) {
  try {
    const today = new Date();
    const todayDay = today.getDate();
    const month = monthKey(today);
    const { start, end } = monthRange(month);

    const { data: recurring } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("household_id", householdId)
      .eq("active", true);

    if (!recurring || recurring.length === 0) return;

    const due = recurring.filter((r) => Math.min(r.day_of_month, 28) <= todayDay);
    if (due.length === 0) return;

    const { data: existing } = await supabase
      .from("transactions")
      .select("recurring_id")
      .eq("household_id", householdId)
      .eq("source", "recurring")
      .gte("date", start)
      .lte("date", end);

    const alreadyGenerated = new Set((existing ?? []).map((t) => t.recurring_id));
    const [year, monthNum] = month.split("-").map(Number);

    const toInsert = due
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
  } catch {
    // פעולת רקע - כשל כאן לא אמור למנוע טעינת הדשבורד
  }
}
