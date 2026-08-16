import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * מחזיר את משתמש המשתמש המחובר ואת ה-household שהוא חבר בו.
 * אם אין משתמש מחובר - מפנה ל-/login.
 * אם המשתמש מחובר אך לא שייך לאף household - מפנה ל-/onboarding.
 */
export async function requireHousehold() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, display_name, households(id, name, invite_code)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  return {
    user,
    householdId: membership.household_id as string,
    displayName: membership.display_name as string,
    // @ts-expect-error - supabase-js לא מייצר טיפוסים אוטומטית ללא generate-types
    household: membership.households as { id: string; name: string; invite_code: string },
  };
}
