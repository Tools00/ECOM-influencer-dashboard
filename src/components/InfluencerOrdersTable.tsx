"use client";

import { useState } from "react";
import { Order, OrderSource } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/formatters";
import clsx from "clsx";

interface Props {
  orders: Order[];
}

type SortKey = "order_date" | "gross_value_eur" | "product_category";
type SourceFilter = "all" | OrderSource;

const SOURCE_LABELS: Record<OrderSource, string> = {
  influencer: "Influencer",
  meta_ads: "Meta Ads",
  organic: "Organisch",
};

const SOURCE_STYLES: Record<OrderSource, string> = {
  influencer: "text-emerald-700 bg-emerald-50",
  meta_ads: "text-violet-700 bg-violet-50",
  organic: "text-gray-600 bg-gray-100",
};

export function InfluencerOrdersTable({ orders }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("order_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = sourceFilter === "all" ? orders : orders.filter((o) => o.order_source === sourceFilter);

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "gross_value_eur") return (a.gross_value_eur - b.gross_value_eur) * mul;
    return a[sortKey].localeCompare(b[sortKey]) * mul;
  });

  const metaAdsCount = orders.filter((o) => o.order_source === "meta_ads").length;

  function Th({ k, label }: { k: SortKey; label: string }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800"
        onClick={() => handleSort(k)}
      >
        {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
      </th>
    );
  }

  const filterTabs: { key: SourceFilter; label: string; count: number }[] = [
    { key: "all", label: "Alle", count: orders.length },
    { key: "influencer", label: "Influencer", count: orders.filter((o) => o.order_source === "influencer").length },
    { key: "meta_ads", label: "Meta Ads", count: metaAdsCount },
    { key: "organic", label: "Organisch", count: orders.filter((o) => o.order_source === "organic").length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Bestellhistorie</h3>
          <p className="text-xs text-gray-400 mt-0.5">{orders.length} Bestellungen gesamt</p>
        </div>
        {/* Source filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={clsx(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                sourceFilter === key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {label}
              {count > 0 && (
                <span className={clsx(
                  "ml-1.5 text-xs font-semibold",
                  key === "meta_ads" && count > 0 ? "text-violet-600" : "text-gray-400"
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-50 text-xs">
              <Th k="order_date" label="Datum" />
              <Th k="product_category" label="Kategorie" />
              <Th k="gross_value_eur" label="Brutto" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Netto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Artikel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Quelle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-xs text-gray-600">{formatDate(o.order_date)}</td>
                <td className="px-4 py-2.5 text-xs text-gray-700">{o.product_category}</td>
                <td className="px-4 py-2.5 text-xs font-medium text-gray-800">
                  {formatEUR(o.gross_value_eur)}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">
                  {formatEUR(o.gross_value_eur - o.return_value_eur)}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{o.item_count}</td>
                <td className="px-4 py-2.5">
                  <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", SOURCE_STYLES[o.order_source])}>
                    {SOURCE_LABELS[o.order_source]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {o.return_type === "full" ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Retourniert
                    </span>
                  ) : o.return_type === "partial" ? (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      Teilretour
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Abgeschlossen
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
