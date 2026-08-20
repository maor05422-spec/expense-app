import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { monthKey, monthLabel, monthRange, shiftMonth } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { MonthlySummaryView, type MonthRow } from "./monthly-summary-view";

const MONTHS_BACK = 12;

export default async function MonthlySummaryPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const currentMonth = monthKey();
  const months = Array.from({ length: MONTHS_BACK }, (_, i) => shiftMonth(currentMonth, i - (MONTHS_BACK - 1)));
  const ranges = months.map((m) => ({ month: m, ...monthRange(m) }));
  const earliestStart = ranges[0].start;
  const latestEnd = ranges[ranges.length - 1].end;

  const [{ data: categories }, { data: tx }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId),
    supabase
      .from("transactions")
      .select("amount, category_id, date")
      .eq("household_id", householdId)
      .gte("date", earliestStart)
      .lte("date", latestEnd),
  ]);

  const categoriesById = new Map((categories as Category[] | null ?? []).map((c) => [c.id, c]));

  let cumulative = 0;
  const rows: MonthRow[] = ranges.map(({ month, start, end }) => {
    let income = 0;
    let expenses = 0;
    for (const t of tx ?? []) {
      if (t.date < start || t.date > end) continue;
      const cat = t.category_id ? categoriesById.get(t.category_id) : undefined;
      if (cat?.type === "income") income += Number(t.amount);
      else expenses += Number(t.amount);
    }
    const closed = income > 0;
    const savings = income - expenses;
    if (closed) cumulative += savings;

    return {
      month,
      label: monthLabel(month),
      income,
      expenses,
      savings,
      savingsPct: income > 0 ? (savings / income) * 100 : null,
      closed,
      cumulative,
    };
  });

  return (
    <div>
      <h1 className="mb-1 text-lg font-bold">סיכום חודשי</h1>
      <p className="mb-4 text-sm text-muted">
        בסוף כל חודש מזינים רק את סכום ההכנסה - שאר הנתונים (הוצאות, חיסכון, אחוז חיסכון)
        מחושבים לבד מהתנועות שכבר נרשמו.
      </p>
      <MonthlySummaryView rows={rows} currentMonth={currentMonth} />
    </div>
  );
}
