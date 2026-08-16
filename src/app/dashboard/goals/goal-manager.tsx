"use client";

import { useState } from "react";
import type { SavingsGoal } from "@/lib/types";
import { addGoal, deleteGoal, addContribution } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";

export function GoalManager({ goals }: { goals: SavingsGoal[] }) {
  const [openContribution, setOpenContribution] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <h2 className="mb-3 text-sm font-semibold">יעד חיסכון חדש</h2>
          <form action={addGoal} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
            <div>
              <Label>שם היעד</Label>
              <Input name="name" required placeholder="לדוגמה: קרן חירום" />
            </div>
            <div>
              <Label>סכום יעד (₪)</Label>
              <Input name="target_amount" type="number" step="1" min="0" required />
            </div>
            <div>
              <Label>תאריך יעד (לא חובה)</Label>
              <Input name="target_date" type="date" />
            </div>
            <div>
              <Label>אייקון</Label>
              <Input name="icon" defaultValue="🎯" maxLength={2} />
            </div>
            <Button type="submit" size="sm">
              הוספה
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.length === 0 && (
          <p className="text-sm text-muted">עדיין אין יעדי חיסכון.</p>
        )}
        {goals.map((g) => {
          const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
          const remaining = Math.max(0, g.target_amount - g.current_amount);

          let monthsLeft: number | null = null;
          if (g.target_date) {
            const now = new Date();
            const target = new Date(g.target_date);
            monthsLeft = Math.max(
              1,
              (target.getFullYear() - now.getFullYear()) * 12 +
                (target.getMonth() - now.getMonth())
            );
          }

          return (
            <Card key={g.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{g.icon}</span>
                    <div>
                      <p className="font-medium">{g.name}</p>
                      {g.target_date && (
                        <p className="text-xs text-muted">יעד: {formatDate(g.target_date)}</p>
                      )}
                    </div>
                  </div>
                  <form action={deleteGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      מחיקה
                    </Button>
                  </form>
                </div>

                <Progress value={pct} />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {formatCurrency(g.current_amount)} מתוך {formatCurrency(g.target_amount)}
                  </span>
                  <span className="font-medium">{pct.toFixed(0)}%</span>
                </div>

                {remaining > 0 && monthsLeft && (
                  <p className="text-xs text-muted">
                    נשארו {formatCurrency(Math.ceil(remaining / monthsLeft))} לחודש כדי להגיע ליעד בזמן
                  </p>
                )}

                {openContribution === g.id ? (
                  <form
                    action={async (fd) => {
                      await addContribution(fd);
                      setOpenContribution(null);
                    }}
                    className="flex gap-2"
                  >
                    <input type="hidden" name="goal_id" value={g.id} />
                    <Input name="amount" type="number" step="1" min="1" placeholder="סכום" required />
                    <Button type="submit" size="sm">
                      הפקדה
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setOpenContribution(g.id)}
                  >
                    הוספת הפקדה
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
