import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { ensureRecurringGeneratedForToday } from "@/lib/recurring-auto";
import { ensureRecurringContributionsGeneratedForToday } from "@/lib/recurring-contributions-auto";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "דשבורד" },
  { href: "/dashboard/transactions", label: "תנועות" },
  { href: "/dashboard/import", label: "ייבוא מכרטיס אשראי" },
  { href: "/dashboard/rules", label: "כללי סיווג" },
  { href: "/dashboard/categories", label: "קטגוריות" },
  { href: "/dashboard/recurring", label: "הוצאות קבועות" },
  { href: "/dashboard/goals", label: "יעדי חיסכון" },
  { href: "/dashboard/monthly-summary", label: "סיכום חודשי" },
];

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { household, displayName, householdId } = await requireHousehold();

  const supabase = await createClient();
  await ensureRecurringGeneratedForToday(supabase, householdId);
  await ensureRecurringContributionsGeneratedForToday(supabase, householdId);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="font-bold">{household.name}</p>
            <p className="text-xs text-muted">שלום {displayName}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted">
              קוד הזמנה לבן/בת הזוג:{" "}
              <span className="font-mono font-semibold text-foreground">
                {household.invite_code}
              </span>
            </p>
            <form action={signOut}>
              <button className="text-sm text-muted hover:text-foreground" type="submit">
                התנתקות
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted hover:bg-slate-100 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
