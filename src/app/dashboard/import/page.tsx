import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { ImportManager } from "./import-manager";
import type { Category } from "@/lib/types";

export default async function ImportPage() {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const [{ data: categories }, { data: members }] = await Promise.all([
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase
      .from("household_members")
      .select("user_id, display_name")
      .eq("household_id", householdId),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">ייבוא תנועות מכרטיס אשראי</h1>
      <ImportManager categories={(categories as Category[]) ?? []} members={members ?? []} />
    </div>
  );
}
