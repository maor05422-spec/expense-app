import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { TransactionManager } from "./transaction-manager";
import { MonthNav } from "@/components/month-nav";
import { monthKey, monthRange } from "@/lib/utils";
import type { Category } from "@/lib/types";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { householdId } = await requireHousehold();
  const supabase = await createClient();

  const params = await searchParams;
  const month = params.month || monthKey();
  const { start, end } = monthRange(month);

  const [{ data: transactions }, { data: categories }, { data: members }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, icon)")
      .eq("household_id", householdId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false }),
    supabase.from("categories").select("*").eq("household_id", householdId).order("name"),
    supabase
      .from("household_members")
      .select("user_id, display_name")
      .eq("household_id", householdId),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">תנועות</h1>
      <MonthNav basePath="/dashboard/transactions" month={month} />
      <TransactionManager
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactions={(transactions as any) ?? []}
        categories={(categories as Category[]) ?? []}
        members={members ?? []}
      />
    </div>
  );
}
