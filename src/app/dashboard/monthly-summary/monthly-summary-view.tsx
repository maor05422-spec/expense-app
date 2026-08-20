"use client";

import { useMemo, useState } from "react";
import { setMonthlyIncome } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavingsTrend } from "@/components/charts/savings-trend";
import { formatCurrency } from "@/lib/utils";

export type MonthRow = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
  savingsPct: number | null;
  closed: boolean;
  cumulative: number;
};

function StatusBadge({ row }: { row: MonthRow }) {
  if (!row.closed) {
    return <span className="text-xs text-muted">⏳ פתוח - טרם הוזנה הכנסה</span>;
  }
  if (row.savings >= 0) {
    return <span className="text-xs font-medium text-success">✔ בפלוס</span>;
  }
  return <span className="text-xs font-medium text-danger">⚠ בגירעון</span>;
}

export function MonthlySummaryView({
  rows,
  currentMonth,
}: {
  rows: MonthRow[];
  currentMonth: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const current = rows.find((r) => r.month === currentMonth) ?? rows[rows.length - 1];
  const selectedRow = rows.find((r) => r.month === selectedMonth);

  // מהחודש הישן ביותר לחדש ביותר עבור הגרף, כמו בשאר הדשבורד
  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        label: r.label.split(" ")[0],
        cumulative: r.cumulative,
        closed: r.closed,
      })),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>הכנסה - {current.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-bold">
            {formatCurrency(current.income)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>הוצאות - {current.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-bold">
            {formatCurrency(current.expenses)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>חיסכון החודש</CardTitle>
          </CardHeader>
          <CardContent
            className={`pt-0 text-xl font-bold ${current.savings < 0 ? "text-danger" : ""}`}
          >
            {formatCurrency(current.savings)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>אחוז חיסכון</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-bold">
            {current.savingsPct === null ? "-" : `${Math.round(current.savingsPct)}%`}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <h2 className="mb-3 text-sm font-semibold">עדכון הכנסה חודשית (סגירת חודש)</h2>
          <form
            action={setMonthlyIncome}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end"
          >
            <div>
              <Label>חודש</Label>
              <Select
                name="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {[...rows].reverse().map((r) => (
                  <option key={r.month} value={r.month}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>סכום הכנסה (₪)</Label>
              <Input
                key={selectedMonth}
                name="amount"
                type="number"
                step="1"
                min="0"
                defaultValue={selectedRow?.income || ""}
                placeholder="0"
                required
              />
            </div>
            <Button type="submit" size="sm">
              שמירה
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted">
            שמירה חוזרת על אותו חודש מעדכנת את הסכום ולא יוצרת רישום כפול.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>חיסכון מצטבר (חודשים סגורים בלבד)</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsTrend data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>היסטוריה - 12 חודשים אחרונים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...rows].reverse().map((r) => (
            <div
              key={r.month}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
            >
              <span className="w-24 font-medium">{r.label}</span>
              <span className="text-muted">
                הכנסה: <span className="text-foreground">{formatCurrency(r.income)}</span>
              </span>
              <span className="text-muted">
                הוצאות: <span className="text-foreground">{formatCurrency(r.expenses)}</span>
              </span>
              <span className="text-muted">
                חיסכון:{" "}
                <span className={r.savings < 0 ? "text-danger" : "text-foreground"}>
                  {formatCurrency(r.savings)}
                </span>
                {r.savingsPct !== null ? ` (${Math.round(r.savingsPct)}%)` : ""}
              </span>
              <StatusBadge row={r} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
