"use client";

import { useState } from "react";
import { InfluencerStats } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";
import clsx from "clsx";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

type SortKey = keyof Pick<
  InfluencerStats,
  "gross_revenue" | "net_revenue" | "return_rate" | "profit" | "roi" | "total_orders"
>;

function fmt(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

interface Props {
  stats: InfluencerStats[];
}

export function InfluencerTable({ stats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...stats].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * mul;
  });

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    return (
      <button
        onClick={() => handleSort(k)}
        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        {label}
        <ArrowUpDown size={12} className={sortKey === k ? "text-emerald-600" : "text-gray-300"} />
      </button>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 font-medium text-left">
            <th className="px-4 py-3">Influencer</th>
            <th className="px-4 py-3"><SortBtn k="total_orders" label="Bestellungen" /></th>
            <th className="px-4 py-3"><SortBtn k="gross_revenue" label="Brutto-Umsatz" /></th>
            <th className="px-4 py-3"><SortBtn k="return_rate" label="Retourenquote" /></th>
            <th className="px-4 py-3"><SortBtn k="net_revenue" label="Netto-Umsatz" /></th>
            <th className="px-4 py-3">Partnerkosten</th>
            <th className="px-4 py-3"><SortBtn k="profit" label="Profit" /></th>
            <th className="px-4 py-3"><SortBtn k="roi" label="ROI" /></th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((s) => (
            <tr key={s.influencer.id} className="bg-white hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-900">{s.influencer.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{s.influencer.handle}</span>
                    <PlatformBadge platform={s.influencer.platform} />
                  </div>
                  <span className="text-xs text-gray-400">{s.influencer.niche}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">{s.total_orders}</td>
              <td className="px-4 py-3 text-gray-700">{fmt(s.gross_revenue)}</td>
              <td className="px-4 py-3">
                <span
                  className={clsx(
                    "font-medium",
                    s.return_rate > 25 ? "text-red-600" : s.return_rate > 15 ? "text-amber-600" : "text-emerald-600"
                  )}
                >
                  {fmtPct(s.return_rate)}
                </span>
                <span className="text-gray-400 text-xs ml-1">({s.return_count} Ret.)</span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{fmt(s.net_revenue)}</td>
              <td className="px-4 py-3 text-gray-500">{fmt(s.monthly_cost)}</td>
              <td className="px-4 py-3">
                <span className={clsx("font-semibold", s.profit >= 0 ? "text-emerald-700" : "text-red-600")}>
                  {fmt(s.profit)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={clsx("font-semibold", s.roi >= 0 ? "text-emerald-700" : "text-red-600")}>
                  {fmtPct(s.roi)}
                </span>
              </td>
              <td className="px-4 py-3">
                {s.profit >= 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp size={11} /> Profitabel
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <TrendingDown size={11} /> Verlust
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
