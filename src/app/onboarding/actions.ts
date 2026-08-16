"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type OnboardingState = { error: string | null };

export async function createHouseholdAction(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const householdName = String(formData.get("householdName") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();

  if (!householdName || !displayName) {
    return { error: "יש למלא את כל השדות" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    household_name: householdName,
    member_display_name: displayName,
  });

  if (error) {
    return { error: "לא הצלחנו ליצור את הבית המשותף, נסו שוב" };
  }

  redirect("/dashboard");
}

export async function joinHouseholdAction(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const code = String(formData.get("code") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();

  if (!code || !displayName) {
    return { error: "יש למלא את כל השדות" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", {
    code,
    member_display_name: displayName,
  });

  if (error) {
    return { error: "קוד ההזמנה אינו תקין" };
  }

  redirect("/dashboard");
}
