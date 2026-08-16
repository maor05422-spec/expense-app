import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "./category-manager";
import type { Category } from "@/lib/types";

export default async function CategoriesPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", householdId)
    .order("type")
    .order("name");

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">קטגוריות ותקציב חודשי</h1>
      <CategoryManager categories={(categories as Category[]) ?? []} />
    </div>
  );
}
