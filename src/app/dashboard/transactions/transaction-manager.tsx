"use client";

import type { Category, Transaction } from "@/lib/types";
import { addTransaction, deleteTransaction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Member = { user_id: string; display_name: string };

export function TransactionManager({
  transactions,
  categories,
  members,
}: {
  transactions: (Transaction & { categories: Pick<Category, "name" | "icon"> | null })[];
  categories: Category[];
  members: Member[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <h2 className="mb-3 text-sm font-semibold">תנועה חדשה</h2>
          <form action={addTransaction} className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
            <div>
              <Label>סכום (₪)</Label>
              <Input name="amount" type="number" step="0.01" min="0" required />
            </div>
            <div>
              <Label>תאריך</Label>
              <Input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
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
            <div>
              <Label>מי שילם</Label>
              <Select name="paid_by">
                <option value="">-</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>תיאור</Label>
              <Input name="description" placeholder="לדוגמה: סופר" />
            </div>
            <Button type="submit" size="sm">
              הוספה
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {transactions.length === 0 && (
          <p className="text-sm text-muted">אין תנועות בחודש הזה.</p>
        )}
        {transactions.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{t.categories?.icon ?? "💸"}</span>
                <div>
                  <p className="font-medium">
                    {t.description || t.categories?.name || "תנועה"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(t.date)}
                    {t.categories?.name ? ` · ${t.categories.name}` : ""}
                    {t.source === "recurring" ? " · הוצאה קבועה" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(t.amount)}</span>
                <form action={deleteTransaction}>
                  <input type="hidden" name="id" value={t.id} />
                  <Button variant="ghost" size="sm" type="submit">
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
