"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import { addCategory, updateCategory, deleteCategory } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const ICONS = ["🛒", "🏠", "🚗", "🎉", "💊", "📚", "👕", "🐾", "💡", "💰", "📱", "✈️"];

function CategoryForm({
  category,
  onDone,
}: {
  category?: Category;
  onDone?: () => void;
}) {
  const isEdit = !!category;
  const action = isEdit ? updateCategory : addCategory;

  return (
    <form
      action={async (fd) => {
        await action(fd);
        onDone?.();
      }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end"
    >
      {isEdit && <input type="hidden" name="id" value={category.id} />}
      <div className="col-span-2 sm:col-span-1">
        <Label>שם</Label>
        <Input name="name" defaultValue={category?.name} required />
      </div>
      <div>
        <Label>אייקון</Label>
        <Select name="icon" defaultValue={category?.icon ?? ICONS[0]}>
          {ICONS.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>סוג</Label>
        <Select name="type" defaultValue={category?.type ?? "expense"}>
          <option value="expense">הוצאה</option>
          <option value="income">הכנסה</option>
        </Select>
      </div>
      <div>
        <Label>תקציב חודשי (₪)</Label>
        <Input
          name="monthly_budget"
          type="number"
          step="1"
          min="0"
          defaultValue={category?.monthly_budget ?? 0}
        />
      </div>
      <Button type="submit" size="sm">
        {isEdit ? "שמירה" : "הוספת קטגוריה"}
      </Button>
    </form>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <h2 className="mb-3 text-sm font-semibold">קטגוריה חדשה</h2>
          <CategoryForm />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-muted">עדיין אין קטגוריות. הוסיפו את הראשונה למעלה.</p>
        )}
        {categories.map((cat) =>
          editingId === cat.id ? (
            <Card key={cat.id}>
              <CardContent className="pt-4">
                <CategoryForm category={cat} onDone={() => setEditingId(null)} />
              </CardContent>
            </Card>
          ) : (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted">
                      {cat.type === "expense" ? "הוצאה" : "הכנסה"} · תקציב חודשי:{" "}
                      {formatCurrency(cat.monthly_budget)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(cat.id)}>
                    עריכה
                  </Button>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <Button variant="danger" size="sm" type="submit">
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
