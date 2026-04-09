"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
}

export function KPICard({ label, value, subtext, icon, trend, highlight }: KPICardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 flex flex-col gap-3 shadow-sm",
        highlight
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-gray-100"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span
          className={clsx(
            "p-2 rounded-xl",
            highlight ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
          )}
        >
          {icon}
        </span>
      </div>
      <div>
        <p
          className={clsx(
            "text-2xl font-bold tracking-tight",
            highlight ? "text-emerald-700" : "text-gray-900"
          )}
        >
          {value}
        </p>
        {subtext && (
          <p
            className={clsx(
              "text-xs mt-1",
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                ? "text-red-500"
                : "text-gray-400"
            )}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
