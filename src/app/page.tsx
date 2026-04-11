import { Suspense } from "react";
import { fetchInfluencers, fetchOrders } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import {
  computeInfluencerStats,
  computeDashboardSummary,
  computePeriodComparison,
  computeDailyRevenue,
  computeCategoryRevenue,
  computeAttributionBreakdown,
  computeTotalNetSparkline,
  filterOrdersByDateRange,
} from "@/lib/analytics";
import { DateRange } from "@/lib/types";
import { KPICard } from "@/components/KPICard";
import { InfluencerTable } from "@/components/InfluencerTable";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";
import { CategoryDonutChart } from "@/components/CategoryDonutChart";
import { RecentOrdersFeed } from "@/components/RecentOrdersFeed";
import { AttributionOverview } from "@/components/AttributionOverview";
import { Header } from "@/components/layout/Header";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { formatEUR, formatPct } from "@/lib/formatters";
import {
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  Euro,
  Award,
  BarChart2,
} from "lucide-react";

function isValidRange(v: unknown): v is DateRange {
  return v === "7d" || v === "30d" || v === "90d" || v === "all";
}

interface Props {
  searchParams: Promise<{ range?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const range: DateRange = isValidRange(params.range) ? params.range : "30d";

  const [influencers, allOrders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const filteredOrders = filterOrdersByDateRange(allOrders, range);
  const stats = influencers.map((inf) => computeInfluencerStats(inf, filteredOrders));
  const summary = computeDashboardSummary(stats);
  const comparison = computePeriodComparison(influencers, allOrders, range);
  const dailyRevenue = computeDailyRevenue(filteredOrders);
  const categoryRevenue = computeCategoryRevenue(filteredOrders);
  const attribution = computeAttributionBreakdown(filteredOrders);
  const netSparkline = computeTotalNetSparkline(filteredOrders, range);

  const { changes } = comparison;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <h1 className="text-sm font-semibold text-gray-800">Dashboard</h1>
        <Suspense>
          <DateRangeSelector current={range} />
        </Suspense>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-6">

        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            label="Netto-Umsatz"
            value={formatEUR(summary.total_net_revenue)}
            subtext="nach Retouren"
            icon={<Euro size={16} />}
            trend={changes.revenue_change_pct >= 0 ? "up" : "down"}
            trendPct={changes.revenue_change_pct}
            sparklineData={netSparkline}
            highlight
          />
          <KPICard
            label="Brutto-Umsatz"
            value={formatEUR(summary.total_gross_revenue)}
            subtext={`${summary.total_orders} Bestellungen`}
            icon={<ShoppingBag size={16} />}
            trend={changes.orders_change_pct >= 0 ? "up" : "down"}
            trendPct={changes.orders_change_pct}
          />
          <KPICard
            label="Gesamtprofit"
            value={formatEUR(summary.total_profit)}
            subtext={summary.total_profit >= 0 ? "Im Plus" : "Im Minus"}
            icon={<TrendingUp size={16} />}
            trend={changes.profit_change_pct >= 0 ? "up" : "down"}
            trendPct={changes.profit_change_pct}
          />
          <KPICard
            label="Ø Retourenquote"
            value={formatPct(summary.avg_return_rate)}
            subtext={summary.avg_return_rate > 20 ? "Handlungsbedarf" : "Im Rahmen"}
            icon={<RotateCcw size={16} />}
            trend={changes.return_rate_change <= 0 ? "up" : "down"}
            trendPct={Math.abs(changes.return_rate_change)}
          />
          <KPICard
            label="Ø Bestellwert"
            value={formatEUR(summary.avg_aov)}
            subtext="pro Bestellung"
            icon={<BarChart2 size={16} />}
            trend="neutral"
          />
          <KPICard
            label="Top Performer"
            value={summary.best_performer?.influencer.handle ?? "–"}
            subtext={
              summary.best_performer
                ? `ROI ${summary.best_performer.roi.toFixed(0)}%`
                : undefined
            }
            trend="up"
            icon={<Award size={16} />}
          />
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RevenueTrendChart data={dailyRevenue} />
          </div>
          <div>
            <CategoryDonutChart data={categoryRevenue} />
          </div>
        </section>

        {/* Table + Attribution + Recent Orders */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Influencer im Detail</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Klick auf Zeile für Detailansicht</p>
                </div>
              </div>
              <InfluencerTable stats={stats} />
            </div>
          </div>
          <div className="space-y-5">
            <AttributionOverview attribution={attribution} />
            <RecentOrdersFeed orders={filteredOrders} influencers={influencers} />
          </div>
        </section>

      </main>
    </div>
  );
}
