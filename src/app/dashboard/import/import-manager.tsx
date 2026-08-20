"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseImportFile, confirmImport, type ImportRow } from "./actions";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Member = { user_id: string; display_name: string };
type Row = ImportRow & { include: boolean };

export function ImportManager({
  categories,
  members,
}: {
  categories: Category[];
  members: Member[];
}) {
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [rows, setRows] = useState<Row[]>([]);
  const [paidBy, setPaidBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [insertedCount, setInsertedCount] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleParse(formData: FormData) {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await parseImportFile(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setWarning(result.warning ?? null);
      setRows(result.rows.map((r) => ({ ...r, include: true })));
      setStep("review");
    });
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function handleConfirm() {
    setError(null);
    const included = rows.filter((r) => r.include);
    startTransition(async () => {
      try {
        const result = await confirmImport(included, paidBy || null);
        setInsertedCount(result.inserted);
        setLearnedCount(result.learned);
        setStep("done");
        router.refresh();
      } catch {
        setError("אירעה שגיאה בייבוא התנועות. נסו שוב.");
      }
    });
  }

  const includedCount = rows.filter((r) => r.include).length;
  const includedTotal = rows.filter((r) => r.include).reduce((s, r) => s + r.amount, 0);
  const distinctSourceFiles = new Set(rows.map((r) => r.sourceFile)).size;

  if (step === "done") {
    return (
      <Card>
        <CardContent className="space-y-4 py-6 text-center">
          <p className="text-2xl">✅</p>
          <p className="font-semibold">יובאו בהצלחה {insertedCount} תנועות</p>
          {learnedCount > 0 && (
            <p className="text-sm text-muted">
              נלמדו {learnedCount} בתי עסק חדשים - בפעם הבאה הם יסווגו אוטומטית.{" "}
              <a href="/dashboard/rules" className="text-primary underline">
                לצפייה בכללי הסיווג
              </a>
            </p>
          )}
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                setStep("upload");
                setRows([]);
              }}
              variant="secondary"
            >
              ייבוא קובץ נוסף
            </Button>
            <Button onClick={() => router.push("/dashboard/transactions")}>
              מעבר לתנועות
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm text-muted">
              העלו קובץ הוצאות שהורדתם מאתר חברת האשראי (Excel, CSV או PDF) - המערכת תזהה
              אוטומטית את התאריכים, התיאורים והסכומים, ותציג לכם אותם לבדיקה ואישור לפני
              שהם נכנסים בפועל. יש שני כרטיסים באותו חודש (למשל מאסטרקארד וויזה)? אפשר
              לבחור את שני הקבצים יחד - הם ייכנסו לאותה רשימת בדיקה אחת, ממוינת לפי תאריך.
            </p>
            <form action={handleParse} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label>קובץ/ים (xlsx / csv / pdf) - אפשר לבחור עד 2 יחד</Label>
                <input
                  name="file"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  multiple
                  required
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "מנתח..." : "ניתוח הקבצים"}
              </Button>
            </form>
            {error && <p className="text-sm text-danger">{error}</p>}
          </CardContent>
        </Card>
        <p className="text-xs text-muted">
          שימו לב: זיהוי הקובץ הוא אוטומטי ואינו מושלם, בעיקר בקבצי PDF - חשוב לעבור על
          הרשימה ולבדוק שהיא נכונה לפני האישור הסופי.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {warning && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          {warning}
        </p>
      )}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-4">
          <div>
            <Label>מי שילם (לכל התנועות בקובץ)</Label>
            <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              <option value="">-</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-sm text-muted">
            נבחרו {includedCount} תנועות · סה&quot;כ {formatCurrency(includedTotal)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <Card key={i} className={row.include ? "" : "opacity-50"}>
            <CardContent className="grid grid-cols-2 items-center gap-2 py-3 sm:grid-cols-12">
              <input
                type="checkbox"
                checked={row.include}
                onChange={(e) => updateRow(i, { include: e.target.checked })}
                className="col-span-2 h-4 w-4 sm:col-span-1"
              />
              <div className="col-span-2 sm:col-span-2">
                <Input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(i, { date: e.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <Input
                  value={row.description}
                  onChange={(e) => updateRow(i, { description: e.target.value })}
                />
                {distinctSourceFiles > 1 && (
                  <p className="mt-1 truncate text-xs text-muted" title={row.sourceFile}>
                    מתוך: {row.sourceFile}
                  </p>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(i, { amount: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1 sm:col-span-3">
                <Select
                  value={row.categoryId ?? ""}
                  onChange={(e) => updateRow(i, { categoryId: e.target.value || null })}
                >
                  <option value="">ללא קטגוריה</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </Select>
                {row.autoMatched ? (
                  <p className="mt-1 text-xs text-primary">✓ זוהה אוטומטית</p>
                ) : row.categoryId ? (
                  <p className="mt-1 text-xs text-muted">ייזכר לפעם הבאה</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">בית עסק חדש - בחרו קטגוריה</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setStep("upload");
            setRows([]);
          }}
        >
          ביטול
        </Button>
        <Button onClick={handleConfirm} disabled={isPending || includedCount === 0}>
          {isPending ? "מייבא..." : `ייבוא ${includedCount} תנועות`}
        </Button>
      </div>
    </div>
  );
}
