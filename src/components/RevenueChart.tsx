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

interface Props {
  stats: InfluencerStats[];
}

const EUR = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

export function RevenueChart({ stats }: Props) {
  const data = stats.map((s) => ({
    name: s.influencer.handle,
    "Brutto-Umsatz": Math.round(s.gross_revenue),
    "Netto-Umsatz": Math.round(s.net_revenue),
    Profit: Math.round(s.profit),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Umsatz & Profit pro Influencer</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
          <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip
            formatter={(v: number) => EUR(v)}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Brutto-Umsatz" fill="#d1fae5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Netto-Umsatz" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Profit" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
