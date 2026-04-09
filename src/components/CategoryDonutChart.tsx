"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CategoryRevenue } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";

interface Props {
  data: CategoryRevenue[];
}

function formatEUR(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function CategoryDonutChart({ data }: Props) {
  const top = data.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Umsatz nach Kategorie</h3>
        <p className="text-xs text-gray-400 mt-0.5">Netto · Top 6 Kategorien</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={top}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            labelLine={false}
            label={renderCustomLabel}
            isAnimationActive={false}
          >
            {top.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatEUR(value), "Netto-Umsatz"]}
            contentStyle={{
              border: "1px solid #f3f4f6",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 12px",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
