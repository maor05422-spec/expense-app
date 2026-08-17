"use server";

import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import { revalidatePath } from "next/cache";
import { DEFAULT_KEYWORD_RULES } from "@/lib/keyword-rules";

export async function addKeywordRule(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const keyword = String(formData.get("keyword") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  if (!keyword || !categoryId) return;

  await supabase
    .from("keyword_rules")
    .upsert(
      { household_id: householdId, keyword, category_id: categoryId },
      { onConflict: "household_id,keyword" }
    );

  revalidatePath("/dashboard/rules");
}

export async function deleteKeywordRule(formData: FormData) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("keyword_rules").delete().eq("id", id).eq("household_id", householdId);

  revalidatePath("/dashboard/rules");
}

/** טוען לבית את רשימת ברירת המחדל (מבוססת על גיליון האקסל של המשפחה), מדלג על קטגוריות שלא קיימות */
export async function seedDefaultKeywordRules() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("household_id", householdId);

  const nameToId = new Map<string, string>();
  for (const c of categories ?? []) {
    nameToId.set(String(c.name).trim(), c.id as string);
  }

  const toInsert = DEFAULT_KEYWORD_RULES.map((r) => {
    const categoryId = nameToId.get(r.categoryName);
    if (!categoryId) return null;
    return { household_id: householdId, keyword: r.keyword, category_id: categoryId };
  }).filter((r): r is { household_id: string; keyword: string; category_id: string } => r !== null);

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: DEFAULT_KEYWORD_RULES.length };
  }

  await supabase
    .from("keyword_rules")
    .upsert(toInsert, { onConflict: "household_id,keyword", ignoreDuplicates: true });

  revalidatePath("/dashboard/rules");
  return { inserted: toInsert.length, skipped: DEFAULT_KEYWORD_RULES.length - toInsert.length };
}
