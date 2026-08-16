"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CATEGORICAL_PALETTE, CHART_INK } from "./palette";
import { formatCurrency } from "@/lib/utils";

export type TrendPoint = { label: string; expenses: number; income: number };

export function MonthlyTrend({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            axisLine={{ stroke: CHART_INK.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: CHART_INK.muted }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${Math.round(v / 100) / 10}k`}
          />
          <Tooltip
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              name === "expenses" ? "הוצאות" : "הכנסות",
            ]}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${CHART_INK.grid}`,
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="expenses"
            stroke={CATEGORICAL_PALETTE[7]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="income"
            stroke={CATEGORICAL_PALETTE[2]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: CATEGORICAL_PALETTE[7] }}
          />
          הוצאות
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: CATEGORICAL_PALETTE[2] }}
          />
          הכנסות
        </span>
      </div>
    </div>
  );
}
