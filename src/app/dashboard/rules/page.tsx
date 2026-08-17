import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { RuleManager } from "./rule-manager";
import type { Category, KeywordRule } from "@/lib/types";

export default async function RulesPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase
      .from("keyword_rules")
      .select("*")
      .eq("household_id", householdId)
      .order("keyword"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-bold">סיווג אוטומטי לפי מילת מפתח</h1>
      <p className="mb-4 text-sm text-muted">
        כשמייבאים תנועות מכרטיס אשראי, המערכת מנסה לזהות את הקטגוריה לבד לפי שם בית העסק.
        כאן אפשר לראות ולנהל את כללי הזיהוי - וגם להוסיף כלל חדש כשמופיע בית עסק שלא זוהה.
      </p>
      <RuleManager
        categories={(categories as Category[]) ?? []}
        rules={(rules as KeywordRule[]) ?? []}
      />
    </div>
  );
}
