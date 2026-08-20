"use client";

import { useState } from "react";
import type { SavingsGoal, RecurringContribution } from "@/lib/types";
import {
  addGoal,
  deleteGoal,
  addContribution,
  addRecurringContribution,
  toggleRecurringContribution,
  deleteRecurringContribution,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";

export function GoalManager({
  goals,
  recurringContributions,
}: {
  goals: SavingsGoal[];
  recurringContributions: RecurringContribution[];
}) {
  const [openContribution, setOpenContribution] = useState<string | null>(null);
  const goalsById = new Map(goals.map((g) => [g.id, g]));

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

      {goals.length > 0 && (
        <>
          <Card>
            <CardContent className="space-y-1 pt-4">
              <p className="text-sm font-semibold">✓ הפקדות אוטומטיות</p>
              <p className="text-xs text-muted">
                אפשר להגדיר הפקדה חודשית קבועה ליעד חיסכון - ברגע שמישהו מכם נכנס לאפליקציה
                ביום שהוגדר (או אחריו), ההפקדה נכנסת לבד ליעד, בלי צורך ללחוץ על כלום.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h2 className="mb-3 text-sm font-semibold">הפקדה אוטומטית חדשה</h2>
              <form
                action={addRecurringContribution}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end"
              >
                <div>
                  <Label>יעד</Label>
                  <Select name="goal_id" required defaultValue="">
                    <option value="" disabled>
                      בחרו יעד...
                    </option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.icon} {g.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>סכום חודשי (₪)</Label>
                  <Input name="amount" type="number" step="1" min="1" required />
                </div>
                <div>
                  <Label>יום הפקדה בחודש</Label>
                  <Input name="day_of_month" type="number" min="1" max="28" defaultValue={1} required />
                </div>
                <Button type="submit" size="sm">
                  הוספה
                </Button>
              </form>
            </CardContent>
          </Card>

          {recurringContributions.length > 0 && (
            <div className="space-y-2">
              {recurringContributions.map((r) => {
                const goal = goalsById.get(r.goal_id);
                return (
                  <Card key={r.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{goal?.icon ?? "🎯"}</span>
                        <div>
                          <p className="font-medium">{goal?.name ?? "יעד שנמחק"}</p>
                          <p className="text-xs text-muted">
                            כל {r.day_of_month} בחודש
                            {!r.active ? " · מושהה" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(r.amount)}</span>
                        <form action={toggleRecurringContribution}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="active" value={String(r.active)} />
                          <Button variant="secondary" size="sm" type="submit">
                            {r.active ? "השהיה" : "הפעלה"}
                          </Button>
                        </form>
                        <form action={deleteRecurringContribution}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button variant="danger" size="sm" type="submit">
                            מחיקה
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

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
