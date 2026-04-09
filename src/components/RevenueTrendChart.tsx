"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DailyRevenue } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";

interface Props {
  data: DailyRevenue[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

function formatEUR(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function RevenueTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-center h-64 text-sm text-gray-400">
        Keine Daten für diesen Zeitraum
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    Brutto: Math.round(d.gross),
    Netto: Math.round(d.net),
    orders: d.orders,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Umsatz-Verlauf</h3>
        <p className="text-xs text-gray-400 mt-0.5">Täglich · Brutto vs. Netto nach Retouren</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatEUR(value), name]}
            labelStyle={{ fontSize: 12, fontWeight: 600, color: "#111827" }}
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
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="Brutto"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Netto"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
