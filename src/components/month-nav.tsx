import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/utils";

export function MonthNav({ basePath, month }: { basePath: string; month: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Link
        href={`${basePath}?month=${shiftMonth(month, -1)}`}
        className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        חודש קודם
      </Link>
      <h2 className="text-base font-semibold">{monthLabel(month)}</h2>
      <Link
        href={`${basePath}?month=${shiftMonth(month, 1)}`}
        className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        חודש הבא
      </Link>
    </div>
  );
}
