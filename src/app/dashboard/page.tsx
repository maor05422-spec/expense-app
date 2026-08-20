import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryPie } from "@/components/charts/category-pie";
import { MonthlyTrend } from "@/components/charts/monthly-trend";
import { formatCurrency, monthKey, monthLabel, monthRange, shiftMonth } from "@/lib/utils";
import type { Category, RecurringExpense } from "@/lib/types";

export default async function DashboardPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const currentMonth = monthKey();
  const { start, end } = monthRange(currentMonth);

  const [{ data: categories }, { data: monthTx }, { data: goals }, { data: members }, { data: recurring }] =
    await Promise.all([
      supabase.from("categories").select("*").eq("household_id", householdId),
      supabase
        .from("transactions")
        .select("amount, category_id, date, paid_by")
        .eq("household_id", householdId)
        .gte("date", start)
        .lte("date", end),
      supabase.from("savings_goals").select("current_amount").eq("household_id", householdId),
      supabase
        .from("household_members")
        .select("user_id, display_name")
        .eq("household_id", householdId),
      supabase
        .from("recurring_expenses")
        .select("*, categories(name, icon)")
        .eq("household_id", householdId)
        .eq("active", true),
    ]);

  const categoriesById = new Map((categories as Category[] | null ?? []).map((c) => [c.id, c]));
  const nameByUserId = new Map((members ?? []).map((m) => [m.user_id, m.display_name]));

  let totalExpenses = 0;
  let totalIncome = 0;
  const actualByCategory = new Map<string, number>();
  const expenseByPayer = new Map<string, number>();

  for (const t of monthTx ?? []) {
    const cat = t.category_id ? categoriesById.get(t.category_id) : undefined;
    if (cat?.type === "income") {
      totalIncome += Number(t.amount);
    } else {
      totalExpenses += Number(t.amount);
      if (t.category_id) {
        actualByCategory.set(t.category_id, (actualByCategory.get(t.category_id) ?? 0) + Number(t.amount));
      }
      if (t.paid_by) {
        expenseByPayer.set(t.paid_by, (expenseByPayer.get(t.paid_by) ?? 0) + Number(t.amount));
      }
    }
  }

  const payerBreakdown = Array.from(expenseByPayer.entries())
    .map(([userId, amount]) => ({
      name: nameByUserId.get(userId) ?? "לא ידוע",
      amount,
      pct: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalSaved = (goals ?? []).reduce((s, g) => s + Number(g.current_amount), 0);
  const expenseCategories = (categories as Category[] | null ?? []).filter((c) => c.type === "expense");
  const totalBudget = expenseCategories.reduce((s, c) => s + Number(c.monthly_budget), 0);

  const pieData = expenseCategories
    .map((c) => ({ name: c.name, icon: c.icon ?? "•", value: actualByCategory.get(c.id) ?? 0 }))
    .filter((c) => c.value > 0);

  // באנר תזכורות: הוצאות קבועות שיגיע זמנן ב-5 הימים הקרובים + קטגוריות שחרגו מהתקציב
  // החודש. מוצג ישירות בדשבורד בכל כניסה לאתר (בלי מייל/פוש/שירות חיצוני).
  const todayDay = new Date().getDate();
  const upcomingRecurring = (
    (recurring as (RecurringExpense & { categories: Pick<Category, "name" | "icon"> | null })[] | null) ?? []
  )
    .map((r) => ({ ...r, dueDay: Math.min(r.day_of_month, 28) }))
    .filter((r) => r.dueDay > todayDay && r.dueDay - todayDay <= 5)
    .sort((a, b) => a.dueDay - b.dueDay);

  const budgetAlerts = expenseCategories
    .map((c) => ({
      name: c.name,
      icon: c.icon ?? "•",
      actual: actualByCategory.get(c.id) ?? 0,
      budget: Number(c.monthly_budget),
    }))
    .filter((c) => c.budget > 0 && c.actual > c.budget);

  // מגמת 6 חודשים אחרונים
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth, i - 5));
  const trendRanges = months.map((m) => ({ month: m, ...monthRange(m) }));
  const earliestStart = trendRanges[0].start;

  const { data: trendTx } = await supabase
    .from("transactions")
    .select("amount, category_id, date")
    .eq("household_id", householdId)
    .gte("date", earliestStart)
    .lte("date", end);

  const trendData = trendRanges.map(({ month, start: s, end: e }) => {
    let expenses = 0;
    let income = 0;
    for (const t of trendTx ?? []) {
      if (t.date < s || t.date > e) continue;
      const cat = t.category_id ? categoriesById.get(t.category_id) : undefined;
      if (cat?.type === "income") income += Number(t.amount);
      else expenses += Number(t.amount);
    }
    return { label: monthLabel(month).split(" ")[0], expenses, income };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">דשבורד</h1>
        <p className="text-sm text-muted">{monthLabel(currentMonth)}</p>
      </div>

      {(upcomingRecurring.length > 0 || budgetAlerts.length > 0) && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="space-y-2 pt-4 text-sm">
            {upcomingRecurring.map((r) => (
              <p key={r.id}>
                🔔 <span className="font-medium">{r.description}</span> ({formatCurrency(r.amount)})
                בעוד {r.dueDay - todayDay} {r.dueDay - todayDay === 1 ? "יום" : "ימים"} - ב-
                {r.dueDay} בחודש
              </p>
            ))}
            {budgetAlerts.map((c) => (
              <p key={c.name} className="text-danger">
                ⚠ חריגה מהתקציב ב&quot;{c.icon} {c.name}&quot;: {formatCurrency(c.actual)} מתוך{" "}
                {formatCurrency(c.budget)}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>הוצאות החודש</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-bold">
            {formatCurrency(totalExpenses)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>הכנסות החודש</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-bold">
            {formatCurrency(totalIncome)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>תקציב שנותר</CardTitle>
          </CardHeader>
          <CardContent
            className={`pt-0 text-xl font-bold ${
              totalBudget - totalExpenses < 0 ? "text-danger" : ""
            }`}
          >
            {formatCurrency(totalBudget - totalExpenses)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>סה&quot;כ חיסכון</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-bold">
            {formatCurrency(totalSaved)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הוצאות לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPie data={pieData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מגמה - 6 חודשים אחרונים</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrend data={trendData} />
          </CardContent>
        </Card>
      </div>

      {payerBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>מי שילם הכי הרבה החודש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payerBreakdown.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted">
                    {formatCurrency(p.amount)} · {Math.round(p.pct)}%
                  </span>
                </div>
                <Progress value={p.pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>תקציב מול בפועל לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenseCategories.length === 0 && (
            <p className="text-sm text-muted">
              עדיין אין קטגוריות עם תקציב. אפשר להוסיף בעמוד &quot;קטגוריות&quot;.
            </p>
          )}
          {expenseCategories.map((c) => {
            const actual = actualByCategory.get(c.id) ?? 0;
            const budget = Number(c.monthly_budget);
            const pct = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
            const gap = budget - actual;
            const overBudget = budget > 0 && actual > budget;
            return (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>
                    {c.icon} {c.name}
                  </span>
                  <span className="text-muted">
                    {formatCurrency(actual)} / {formatCurrency(budget)}
                  </span>
                </div>
                <Progress value={pct} />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className={overBudget ? "font-medium text-danger" : "text-muted"}>
                    {budget === 0
                      ? actual > 0
                        ? `${formatCurrency(actual)} ללא תקציב מוגדר`
                        : "אין תקציב מוגדר"
                      : overBudget
                      ? `חריגה של ${formatCurrency(Math.abs(gap))}`
                      : `נותרו ${formatCurrency(gap)}`}
                  </span>
                  {budget > 0 && (
                    <span className={overBudget ? "font-medium text-danger" : "text-muted"}>
                      {Math.round(pct)}% מהתקציב
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
