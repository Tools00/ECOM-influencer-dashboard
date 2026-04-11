"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MonthlyReport } from "@/lib/analytics";
import { formatEUR, formatPct } from "@/lib/formatters";
import { ExcelExportButton } from "./ExcelExportButton";
import { PDFExportButton } from "./PDFExportButton";
import clsx from "clsx";

interface Props {
  report: MonthlyReport;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function TrendBadge({ pct, inverse = false }: { pct: number; inverse?: boolean }) {
  const positive = inverse ? pct <= 0 : pct >= 0;
  const isNeutral = Math.abs(pct) < 0.1;
  if (isNeutral) return <span className="inline-flex items-center gap-0.5 text-xs text-gray-400"><Minus size={11} /> —</span>;
  return (
    <span className={clsx("inline-flex items-center gap-0.5 text-xs font-medium", positive ? "text-emerald-600" : "text-red-500")}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function MonatsabschlussClient({ report }: Props) {
  const router = useRouter();
  const { summary, prevSummary, changes, stats, attribution } = report;

  const isFutureMonth = report.month > new Date().toISOString().slice(0, 7);

  function navigate(month: string) {
    router.push(`/monatsabschluss?month=${month}`);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white print:hidden">
        <h1 className="text-sm font-semibold text-gray-800">Monatsabschluss</h1>
        <div className="flex items-center gap-2">
          {/* Monatsnavigation */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => navigate(prevMonth(report.month))}
              className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
              title="Vorheriger Monat"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-medium text-gray-700 px-3 min-w-[120px] text-center">
              {monthLabel(report.month)}
            </span>
            <button
              onClick={() => navigate(nextMonth(report.month))}
              disabled={isFutureMonth}
              className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Nächster Monat"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Export-Buttons */}
          <ExcelExportButton report={report} variant="kompakt" />
          <ExcelExportButton report={report} variant="vollstaendig" />
          <PDFExportButton report={report} />
        </div>
      </header>

      {/* Druckkopf (nur im Print sichtbar) */}
      <div className="hidden print:block px-8 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Monatsabschluss — {monthLabel(report.month)}</h1>
        <p className="text-xs text-gray-500 mt-0.5">Erstellt am {new Date().toLocaleDateString("de-DE")}</p>
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-6 print:bg-white print:px-8 print:py-4 print:space-y-5">

        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 print:grid-cols-3 print:gap-3">
          {[
            {
              label: "Netto-Umsatz",
              value: formatEUR(summary.total_net_revenue),
              prev: formatEUR(prevSummary.total_net_revenue),
              trend: <TrendBadge pct={changes.revenue_change_pct} />,
              highlight: true,
            },
            {
              label: "Brutto-Umsatz",
              value: formatEUR(summary.total_gross_revenue),
              prev: formatEUR(prevSummary.total_gross_revenue),
              trend: null,
            },
            {
              label: "Bestellungen",
              value: String(summary.total_orders),
              prev: String(prevSummary.total_orders),
              trend: <TrendBadge pct={changes.orders_change_pct} />,
            },
            {
              label: "Gesamtkosten",
              value: formatEUR(summary.total_net_revenue - summary.total_profit),
              prev: null,
              trend: null,
            },
            {
              label: "Profit",
              value: formatEUR(summary.total_profit),
              prev: formatEUR(prevSummary.total_profit),
              trend: <TrendBadge pct={changes.profit_change_pct} />,
            },
            {
              label: "Ø Retourenquote",
              value: formatPct(summary.avg_return_rate),
              prev: formatPct(prevSummary.avg_return_rate),
              trend: <TrendBadge pct={changes.return_rate_change} inverse />,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={clsx(
                "rounded-xl border p-4 bg-white shadow-sm print:shadow-none print:border-gray-200",
                kpi.highlight ? "border-emerald-200 ring-1 ring-emerald-100" : "border-gray-100"
              )}
            >
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <p className={clsx("text-lg font-bold mt-1", kpi.highlight ? "text-emerald-700" : "text-gray-900")}>
                {kpi.value}
              </p>
              {(kpi.prev !== null || kpi.trend) && (
                <div className="flex items-center gap-1.5 mt-1">
                  {kpi.trend}
                  {kpi.prev !== null && (
                    <span className="text-xs text-gray-400">vs. {kpi.prev}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Attribution-Zusammenfassung */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 print:shadow-none print:border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Attribution-Split</h3>
          <div className="grid grid-cols-2 gap-4">
            {(["influencer", "meta_ads"] as const).map((src) => {
              const d = attribution[src];
              const total = attribution.influencer.orders + attribution.meta_ads.orders;
              const pct = total > 0 ? (d.orders / total) * 100 : 0;
              const labels: Record<string, string> = {
                influencer: "Influencer (ohne Meta-Overlap)",
                meta_ads: "Meta Ads Overlap",
              };
              const colors: Record<string, string> = {
                influencer: "text-emerald-700 bg-emerald-50 border-emerald-200",
                meta_ads: "text-indigo-700 bg-indigo-50 border-indigo-200",
              };
              return (
                <div key={src} className={clsx("rounded-lg border p-3", colors[src])}>
                  <p className="text-xs font-medium">{labels[src]}</p>
                  <p className="text-base font-bold mt-0.5">{d.orders} Orders</p>
                  <p className="text-xs mt-0.5">{formatEUR(d.net_revenue)} · {pct.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Influencer-Tabelle */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Influencer — {monthLabel(report.month)}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{stats.filter((s) => s.total_orders > 0).length} von {stats.length} aktiv diesen Monat</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Influencer", "Orders", "Brutto", "Netto", "Retouren", "Quote", "Kosten", "Profit", "ROI", "Attribution"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats
                  .sort((a, b) => b.net_revenue - a.net_revenue)
                  .map((s) => {
                    const metaOrders = report.orders.filter(
                      (o) => o.influencer_id === s.influencer.id && o.order_source === "meta_ads"
                    ).length;
                    const overlapPct = s.total_orders > 0 ? (metaOrders / s.total_orders) * 100 : 0;
                    const hasOverlap = overlapPct >= 20;

                    return (
                      <tr key={s.influencer.id} className={clsx("hover:bg-gray-50 transition-colors", s.total_orders === 0 && "opacity-40")}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{s.influencer.name}</p>
                          <p className="text-gray-400">{s.influencer.handle}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{s.total_orders}</td>
                        <td className="px-4 py-3 text-gray-700">{formatEUR(s.gross_revenue)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{formatEUR(s.net_revenue)}</td>
                        <td className="px-4 py-3 text-gray-700">{s.return_count}</td>
                        <td className="px-4 py-3">
                          <span className={clsx("font-medium", s.return_rate > 30 ? "text-red-500" : s.return_rate > 20 ? "text-amber-500" : "text-gray-700")}>
                            {formatPct(s.return_rate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatEUR(s.actual_cost)}</td>
                        <td className="px-4 py-3">
                          <span className={clsx("font-medium", s.profit >= 0 ? "text-emerald-600" : "text-red-500")}>
                            {formatEUR(s.profit)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx("font-medium", s.roi >= 100 ? "text-emerald-600" : s.roi >= 0 ? "text-gray-700" : "text-red-500")}>
                            {s.roi.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {hasOverlap ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                              {overlapPct.toFixed(0)}% Meta
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr className="font-semibold text-gray-800">
                  <td className="px-4 py-3">Gesamt</td>
                  <td className="px-4 py-3">{summary.total_orders}</td>
                  <td className="px-4 py-3">{formatEUR(summary.total_gross_revenue)}</td>
                  <td className="px-4 py-3">{formatEUR(summary.total_net_revenue)}</td>
                  <td className="px-4 py-3">{stats.reduce((s, x) => s + x.return_count, 0)}</td>
                  <td className="px-4 py-3">{formatPct(summary.avg_return_rate)}</td>
                  <td className="px-4 py-3">{formatEUR(summary.total_net_revenue - summary.total_profit)}</td>
                  <td className="px-4 py-3">{formatEUR(summary.total_profit)}</td>
                  <td className="px-4 py-3" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Print-Footer */}
        <div className="hidden print:block text-xs text-gray-400 text-center pt-4 border-t border-gray-200">
          Vertraulich · Nur für internen Gebrauch
        </div>

      </main>
    </div>
  );
}
