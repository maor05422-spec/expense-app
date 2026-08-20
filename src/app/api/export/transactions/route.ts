import { NextRequest } from "next/server";
import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { monthRange, monthLabel } from "@/lib/utils";

/** עוטף שדה CSV במרכאות אם הוא מכיל פסיק, מרכאות או שורה חדשה, ומכפיל מרכאות פנימיות */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * מייצא את כל התנועות של הבית (או של חודש ספציפי, אם מועבר ?month=YYYY-MM) לקובץ CSV,
 * להורדה ופתיחה ישירה באקסל. נכתב עם BOM כדי שעברית תוצג נכון באקסל.
 */
export async function GET(request: NextRequest) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const month = request.nextUrl.searchParams.get("month");

  let query = supabase
    .from("transactions")
    .select("date, description, amount, source, paid_by, categories(name)")
    .eq("household_id", householdId)
    .order("date", { ascending: false });

  if (month) {
    const { start, end } = monthRange(month);
    query = query.gte("date", start).lte("date", end);
  }

  const [{ data: transactions }, { data: members }] = await Promise.all([
    query,
    supabase
      .from("household_members")
      .select("user_id, display_name")
      .eq("household_id", householdId),
  ]);

  const nameByUserId = new Map((members ?? []).map((m) => [m.user_id, m.display_name]));

  const rows = (transactions ?? []) as unknown as {
    date: string;
    description: string | null;
    amount: number;
    source: string;
    paid_by: string | null;
    categories: { name: string } | null;
  }[];

  const header = ["תאריך", "תיאור", "קטגוריה", "סכום", "מי שילם", "מקור"];
  const lines = [header.map(csvField).join(",")];

  for (const t of rows) {
    lines.push(
      [
        t.date,
        t.description ?? "",
        t.categories?.name ?? "",
        String(t.amount),
        (t.paid_by && nameByUserId.get(t.paid_by)) || "",
        t.source === "recurring" ? "הוצאה קבועה" : "ידני",
      ]
        .map((v) => csvField(String(v)))
        .join(",")
    );
  }

  const csv = "﻿" + lines.join("\n");
  const filename = month ? `תנועות-${monthLabel(month)}.csv` : "תנועות-כל-הזמנים.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export.csv"; filename*=UTF-8''${encodeURIComponent(
        filename
      )}`,
    },
  });
}
