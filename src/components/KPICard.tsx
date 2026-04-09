"use client";

import { ReactNode } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import clsx from "clsx";

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendPct?: number;
  sparklineData?: number[];
  highlight?: boolean;
}

export function KPICard({ label, value, subtext, icon, trend, trendPct, sparklineData, highlight }: KPICardProps) {
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-gray-400";
  const trendSymbol = trend === "up" ? "▲" : trend === "down" ? "▼" : "";

  return (
    <div className={clsx(
      "rounded-2xl border p-5 flex flex-col gap-3 shadow-sm",
      highlight ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className={clsx("p-2 rounded-xl", highlight ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500")}>
          {icon}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={clsx("text-2xl font-bold tracking-tight", highlight ? "text-emerald-700" : "text-gray-900")}>
            {value}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {trendPct !== undefined && (
              <span className={clsx("text-xs font-semibold", trendColor)}>
                {trendSymbol} {Math.abs(trendPct).toFixed(1)}%
              </span>
            )}
            {subtext && <span className="text-xs text-gray-400">{subtext}</span>}
          </div>
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-8 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((v, i) => ({ v, i }))}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={highlight ? "#059669" : "#10b981"}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
