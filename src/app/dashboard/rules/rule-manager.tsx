"use client";

import { useMemo, useState, useTransition } from "react";
import type { Category, KeywordRule } from "@/lib/types";
import { addKeywordRule, deleteKeywordRule, seedDefaultKeywordRules } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function RuleManager({
  categories,
  rules,
}: {
  categories: Category[];
  rules: KeywordRule[];
}) {
  const [isPending, startTransition] = useTransition();
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const categoryById = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  function handleSeed() {
    setSeedMessage(null);
    startTransition(async () => {
      const result = await seedDefaultKeywordRules();
      if (result) {
        setSeedMessage(
          result.inserted > 0
            ? `נוספו ${result.inserted} מילות מפתח (${result.skipped} דולגו כי אין קטגוריה תואמת).`
            : "לא נוספו מילות מפתח חדשות - כנראה שאין קטגוריות בשמות התואמים, או שכולן כבר קיימות."
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold">כלל חדש</h2>
          <form action={addKeywordRule} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
            <div className="col-span-2">
              <Label>מילת מפתח (בשם בית העסק)</Label>
              <Input name="keyword" placeholder="למשל: שופרסל" required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>קטגוריה</Label>
              <Select name="category_id" required defaultValue="">
                <option value="" disabled>
                  בחרו קטגוריה
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" size="sm">
              הוספת כלל
            </Button>
          </form>
        </CardContent>
      </Card>

      {rules.length === 0 && (
        <Card>
          <CardContent className="space-y-3 py-5 text-center">
            <p className="text-sm text-muted">
              עדיין אין כללי סיווג. אפשר להתחיל מרשימת ברירת המחדל (מבוססת על מילות המפתח
              הנפוצות שכבר צברתם בגיליון האקסל), ואז להוסיף/לערוך לפי הצורך.
            </p>
            <Button variant="secondary" onClick={handleSeed} disabled={isPending}>
              {isPending ? "טוען..." : "טעינת רשימת ברירת מחדל"}
            </Button>
            {seedMessage && <p className="text-xs text-muted">{seedMessage}</p>}
          </CardContent>
        </Card>
      )}

      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => {
            const cat = categoryById.get(rule.category_id);
            return (
              <Card key={rule.id}>
                <CardContent className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{rule.keyword}</span>
                    <span className="text-xs text-muted">→</span>
                    <span className="text-sm">
                      {cat ? `${cat.icon} ${cat.name}` : "קטגוריה לא נמצאה"}
                    </span>
                  </div>
                  <form action={deleteKeywordRule}>
                    <input type="hidden" name="id" value={rule.id} />
                    <Button variant="danger" size="sm" type="submit">
                      מחיקה
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
