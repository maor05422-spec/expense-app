"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { STATUS, CHART_INK } from "./palette";
import { formatCurrency } from "@/lib/utils";

export type SavingsPoint = { label: string; cumulative: number; closed: boolean };

export function SavingsTrend({ data }: { data: SavingsPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            width={40}
            tickFormatter={(v) => `${Math.round(v / 100) / 10}k`}
          />
          <ReferenceLine y={0} stroke={CHART_INK.grid} />
          <Tooltip
            formatter={(value, _name, item) => [
              formatCurrency(Number(value)),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item?.payload as any)?.closed ? "חיסכון מצטבר" : "חיסכון מצטבר (חודש פתוח)",
            ]}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${CHART_INK.grid}`,
              fontSize: 13,
            }}
          />
          <Bar dataKey="cumulative" radius={[4, 4, 4, 4]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.cumulative >= 0 ? STATUS.good : STATUS.critical} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
