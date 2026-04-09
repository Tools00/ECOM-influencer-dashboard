"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InfluencerStats } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";
import { CompensationBadge } from "./CompensationBadge";
import clsx from "clsx";
import { ArrowUpDown, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

type SortKey = keyof Pick<
  InfluencerStats,
  "gross_revenue" | "net_revenue" | "return_rate" | "profit" | "roi" | "total_orders" | "aov" | "cost_per_order" | "actual_cost"
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
  const router = useRouter();
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 font-medium text-left text-xs">
            <th className="px-4 py-3 rounded-tl-xl">Influencer</th>
            <th className="px-4 py-3"><SortBtn k="total_orders" label="Bestellungen" /></th>
            <th className="px-4 py-3"><SortBtn k="gross_revenue" label="Brutto" /></th>
            <th className="px-4 py-3"><SortBtn k="return_rate" label="Retouren" /></th>
            <th className="px-4 py-3"><SortBtn k="net_revenue" label="Netto" /></th>
            <th className="px-4 py-3"><SortBtn k="aov" label="Ø Bestellwert" /></th>
            <th className="px-4 py-3"><SortBtn k="actual_cost" label="Kosten" /></th>
            <th className="px-4 py-3"><SortBtn k="profit" label="Profit" /></th>
            <th className="px-4 py-3 rounded-tr-xl"><SortBtn k="roi" label="ROI" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((s) => (
            <tr
              key={s.influencer.id}
              onClick={() => router.push(`/influencer/${s.influencer.id}`)}
              className="bg-white hover:bg-emerald-50 transition-colors cursor-pointer group"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {s.influencer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-xs">{s.influencer.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-gray-400 text-xs">{s.influencer.handle}</span>
                      <PlatformBadge platform={s.influencer.platform} />
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700 text-xs">{s.total_orders}</td>
              <td className="px-4 py-3 text-gray-700 text-xs">{fmt(s.gross_revenue)}</td>
              <td className="px-4 py-3 text-xs">
                <span
                  className={clsx(
                    "font-medium",
                    s.return_rate > 25 ? "text-red-600" : s.return_rate > 15 ? "text-amber-600" : "text-emerald-600"
                  )}
                >
                  {fmtPct(s.return_rate)}
                </span>
                <span className="text-gray-400 ml-1">({s.return_count})</span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900 text-xs">{fmt(s.net_revenue)}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{fmt(s.aov)}</td>
              <td className="px-4 py-3 text-xs">
                <div>{fmt(s.actual_cost)}</div>
                <CompensationBadge compensation={s.influencer.compensation} />
              </td>
              <td className="px-4 py-3 text-xs">
                <span className={clsx("font-semibold", s.profit >= 0 ? "text-emerald-700" : "text-red-600")}>
                  {fmt(s.profit)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx(
                    "inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs",
                    s.roi >= 50 ? "bg-emerald-100 text-emerald-700" :
                    s.roi >= 0 ? "bg-gray-100 text-gray-600" :
                    "bg-red-50 text-red-600"
                  )}>
                    {s.profit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {fmtPct(s.roi)}
                  </span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
