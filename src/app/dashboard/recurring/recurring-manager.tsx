"use client";

import type { Category, RecurringExpense } from "@/lib/types";
import { addRecurring, toggleRecurring, deleteRecurring, generateTransactionsForMonth } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, monthKey, monthLabel } from "@/lib/utils";

export function RecurringManager({
  recurring,
  categories,
}: {
  recurring: (RecurringExpense & { categories: Pick<Category, "name" | "icon"> | null })[];
  categories: Category[];
}) {
  const currentMonth = monthKey();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div>
            <p className="text-sm font-semibold">יצירת תנועות ל{monthLabel(currentMonth)}</p>
            <p className="text-xs text-muted">
              יוצר תנועה עבור כל הוצאה קבועה פעילה שעוד לא נוצרה החודש
            </p>
          </div>
          <form action={generateTransactionsForMonth}>
            <input type="hidden" name="month" value={currentMonth} />
            <Button type="submit" size="sm">
              צור תנועות לחודש הנוכחי
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <h2 className="mb-3 text-sm font-semibold">הוצאה קבועה חדשה</h2>
          <form action={addRecurring} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
            <div>
              <Label>תיאור</Label>
              <Input name="description" required placeholder="לדוגמה: שכירות" />
            </div>
            <div>
              <Label>סכום (₪)</Label>
              <Input name="amount" type="number" step="0.01" min="0" required />
            </div>
            <div>
              <Label>יום חיוב בחודש</Label>
              <Input name="day_of_month" type="number" min="1" max="28" defaultValue={1} required />
            </div>
            <div>
              <Label>קטגוריה</Label>
              <Select name="category_id">
                <option value="">ללא</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" size="sm">
              הוספה
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {recurring.length === 0 && (
          <p className="text-sm text-muted">עדיין אין הוצאות קבועות.</p>
        )}
        {recurring.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{r.categories?.icon ?? "🔁"}</span>
                <div>
                  <p className="font-medium">{r.description}</p>
                  <p className="text-xs text-muted">
                    כל {r.day_of_month} בחודש
                    {r.categories?.name ? ` · ${r.categories.name}` : ""}
                    {!r.active ? " · מושהה" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(r.amount)}</span>
                <form action={toggleRecurring}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value={String(r.active)} />
                  <Button variant="secondary" size="sm" type="submit">
                    {r.active ? "השהיה" : "הפעלה"}
                  </Button>
                </form>
                <form action={deleteRecurring}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button variant="danger" size="sm" type="submit">
                    מחיקה
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
