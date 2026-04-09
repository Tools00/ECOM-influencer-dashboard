"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { InfluencerStats } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";

interface Props {
  stats: InfluencerStats[];
}

const EUR = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

export function RevenueChart({ stats }: Props) {
  const data = stats.map((s) => ({
    name: s.influencer.handle,
    "Brutto": Math.round(s.gross_revenue),
    "Netto": Math.round(s.net_revenue),
    "Profit": Math.round(s.profit),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Umsatz & Profit pro Influencer</h3>
      <p className="text-xs text-gray-400 mb-4">Gesamtzeitraum · Brutto / Netto / Profit</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            width={36}
          />
          <Tooltip
            formatter={(v: number) => EUR(v)}
            contentStyle={{ borderRadius: 8, border: "1px solid #f3f4f6", fontSize: 12, padding: "8px 12px" }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Brutto" fill={CHART_COLORS.secondaryLight} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="Netto" fill={CHART_COLORS.primaryMid} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="Profit" fill={CHART_COLORS.primaryDark} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
