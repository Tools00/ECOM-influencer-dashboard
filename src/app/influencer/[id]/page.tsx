import { notFound } from "next/navigation";
import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import {
  computeInfluencerStats,
  computeDailyRevenue,
  computeCategoryRevenue,
  computeSparklineData,
} from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { InfluencerDetailClient } from "@/components/InfluencerDetailClient";
import { InfluencerOrdersTable } from "@/components/InfluencerOrdersTable";
import { InfluencerCategoryBreakdown } from "@/components/InfluencerCategoryBreakdown";
import { RevenueTrendChart } from "@/components/RevenueTrendChart";
import { KPICard } from "@/components/KPICard";
import { formatEUR, formatPct } from "@/lib/formatters";
import Link from "next/link";
import { ChevronLeft, TrendingUp, ShoppingBag, RotateCcw, BarChart2, Users } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InfluencerDetailPage({ params }: Props) {
  const { id } = await params;

  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const influencer = influencers.find((i) => i.id === id);
  if (!influencer) notFound();

  const infOrders = orders.filter((o) => o.influencer_id === id);
  const stats = computeInfluencerStats(influencer, orders);
  const dailyRevenue = computeDailyRevenue(infOrders);
  const categoryRevenue = computeCategoryRevenue(infOrders);
  const sparkline = computeSparklineData(orders, id, 30);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <Link
          href="/influencer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={14} />
          Alle Influencer
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-sm font-semibold text-gray-800">{influencer.name}</h1>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-5">
        {/* Profile + inline editor (client) */}
        <InfluencerDetailClient stats={stats} />

        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            label="Netto-Umsatz"
            value={formatEUR(stats.net_revenue)}
            subtext="nach Retouren"
            icon={<TrendingUp size={16} />}
            trend={stats.profit >= 0 ? "up" : "down"}
            sparklineData={sparkline}
            highlight={stats.profit >= 0}
          />
          <KPICard
            label="Bestellungen"
            value={String(stats.total_orders)}
            subtext={`${stats.return_count} retourniert`}
            icon={<ShoppingBag size={16} />}
            trend="neutral"
          />
          <KPICard
            label="Retourenquote"
            value={formatPct(stats.return_rate)}
            subtext={stats.return_rate > 25 ? "Handlungsbedarf" : "Im Rahmen"}
            icon={<RotateCcw size={16} />}
            trend={stats.return_rate > 25 ? "down" : stats.return_rate < 15 ? "up" : "neutral"}
          />
          <KPICard
            label="Ø Bestellwert"
            value={formatEUR(stats.aov)}
            subtext="pro Bestellung"
            icon={<BarChart2 size={16} />}
            trend="neutral"
          />
          <KPICard
            label="ROI"
            value={formatPct(stats.roi)}
            subtext={formatEUR(stats.profit) + " Profit"}
            icon={<Users size={16} />}
            trend={stats.roi >= 50 ? "up" : stats.roi >= 0 ? "neutral" : "down"}
          />
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RevenueTrendChart data={dailyRevenue} />
          <InfluencerCategoryBreakdown data={categoryRevenue} />
        </section>

        {/* Orders table */}
        <InfluencerOrdersTable orders={infOrders} />
      </main>
    </div>
  );
}
