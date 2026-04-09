"use client";

import { useState } from "react";
import { Order } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/formatters";
import clsx from "clsx";

interface Props {
  orders: Order[];
}

type SortKey = "order_date" | "gross_value_eur" | "product_category";

export function InfluencerOrdersTable({ orders }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("order_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...orders].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "gross_value_eur") return (a.gross_value_eur - b.gross_value_eur) * mul;
    return a[sortKey].localeCompare(b[sortKey]) * mul;
  });

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Bestellhistorie</h3>
        <p className="text-xs text-gray-400 mt-0.5">{orders.length} Bestellungen gesamt</p>
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
                  {o.is_returned ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Retourniert
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
