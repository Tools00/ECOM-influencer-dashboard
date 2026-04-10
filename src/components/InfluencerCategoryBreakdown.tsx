"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export function InfluencerCategoryBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-400 text-center py-10">
        Keine Kategoriedaten
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.category,
    Umsatz: Math.round(d.revenue),
    Retourenquote: parseFloat(d.return_rate.toFixed(1)),
    Benchmark: d.benchmark_rate > 0 ? d.benchmark_rate : null,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Kategorien-Breakdown</h3>
        <p className="text-xs text-gray-400 mt-0.5">Netto-Umsatz pro Kategorie</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [formatEUR(value), "Netto-Umsatz"]}
            contentStyle={{
              border: "1px solid #f3f4f6",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 12px",
            }}
          />
          <Bar
            dataKey="Umsatz"
            fill={CHART_COLORS.primary}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
