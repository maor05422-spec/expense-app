"use client";

import { useState, useTransition } from "react";
import type { Category, Transaction } from "@/lib/types";
import { addTransaction, deleteTransaction, updateTransaction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Member = { user_id: string; display_name: string };
type TxRow = Transaction & { categories: Pick<Category, "name" | "icon"> | null };

function EditTransactionForm({
  transaction,
  categories,
  members,
  onDone,
}: {
  transaction: TxRow;
  categories: Category[];
  members: Member[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateTransaction(formData);
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-6 sm:items-end">
      <input type="hidden" name="id" value={transaction.id} />
      <div>
        <Label>סכום (₪)</Label>
        <Input name="amount" type="number" step="0.01" min="0" defaultValue={transaction.amount} required />
      </div>
      <div>
        <Label>תאריך</Label>
        <Input name="date" type="date" defaultValue={transaction.date} required />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label>קטגוריה</Label>
        <Select name="category_id" defaultValue={transaction.category_id ?? ""}>
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
        <Select name="paid_by" defaultValue={transaction.paid_by ?? ""}>
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
        <Input name="description" defaultValue={transaction.description ?? ""} placeholder="לדוגמה: סופר" />
      </div>
      <div className="col-span-2 flex gap-2 sm:col-span-6 sm:justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onDone} disabled={isPending}>
          ביטול
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "שומר..." : "שמירה"}
        </Button>
      </div>
    </form>
  );
}

export function TransactionManager({
  transactions,
  categories,
  members,
}: {
  transactions: TxRow[];
  categories: Category[];
  members: Member[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

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
        {transactions.map((t) =>
          editingId === t.id ? (
            <Card key={t.id}>
              <CardContent className="py-0">
                <EditTransactionForm
                  transaction={t}
                  categories={categories}
                  members={members}
                  onDone={() => setEditingId(null)}
                />
              </CardContent>
            </Card>
          ) : (
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
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(t.id)}>
                    עריכה
                  </Button>
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      מחיקה
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
