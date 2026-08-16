import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number; // 0-100+
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const overBudget = value > 100;

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          overBudget ? "bg-danger" : pct > 85 ? "bg-warning" : "bg-primary",
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
