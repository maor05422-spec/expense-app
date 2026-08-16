"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORICAL_PALETTE, CHART_INK } from "./palette";
import { formatCurrency } from "@/lib/utils";

export type CategorySlice = { name: string; icon: string; value: number };

const MAX_SLOTS = 7; // 8-1: השמינית שמורה ל"אחר"

export function CategoryPie({ data }: { data: CategorySlice[] }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, MAX_SLOTS);
  const restTotal = sorted.slice(MAX_SLOTS).reduce((s, d) => s + d.value, 0);
  const slices = restTotal > 0 ? [...head, { name: "אחר", icon: "•", value: restTotal }] : head;

  const total = slices.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted">אין הוצאות בחודש הזה עדיין.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              cornerRadius={4}
              stroke="#fcfcfb"
              strokeWidth={2}
            >
              {slices.map((_, i) => (
                <Cell key={i} fill={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${CHART_INK.grid}`,
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length] }}
              />
              <span className="truncate">
                {s.icon} {s.name}
              </span>
            </span>
            <span className="shrink-0 text-muted">
              {formatCurrency(s.value)} · {((s.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
