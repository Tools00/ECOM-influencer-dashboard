"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { InfluencerStats } from "@/lib/types";

interface Props {
  stats: InfluencerStats[];
}

function getColor(rate: number) {
  if (rate > 25) return "#ef4444";
  if (rate > 15) return "#f59e0b";
  return "#10b981";
}

export function ReturnRateChart({ stats }: Props) {
  const data = stats
    .map((s) => ({
      name: s.influencer.handle,
      rate: parseFloat(s.return_rate.toFixed(1)),
    }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Retourenquote</h3>
      <p className="text-xs text-gray-400 mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />{"< 15% gut · "}
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />{"15–25% ok · "}
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />{"> 25% kritisch"}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[0, 40]} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#6b7280" }} width={90} />
          <Tooltip
            formatter={(v: number) => [`${v}%`, "Retourenquote"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
          />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
