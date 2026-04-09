import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import { computeInfluencerStats, computeDashboardSummary } from "@/lib/analytics";
import { KPICard } from "@/components/KPICard";
import { InfluencerTable } from "@/components/InfluencerTable";
import { RevenueChart } from "@/components/RevenueChart";
import { ReturnRateChart } from "@/components/ReturnRateChart";
import {
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  Euro,
  Award,
} from "lucide-react";

function EUR(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage() {
  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const stats = influencers.map((inf) => computeInfluencerStats(inf, orders));
  const summary = computeDashboardSummary(stats);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Influencer Performance Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              März 2024 · Shopify-Daten via Discount Code Tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
              Live-Daten
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            label="Brutto-Umsatz"
            value={EUR(summary.total_gross_revenue)}
            subtext={`${summary.total_orders} Bestellungen`}
            icon={<ShoppingBag size={18} />}
          />
          <KPICard
            label="Netto-Umsatz"
            value={EUR(summary.total_net_revenue)}
            subtext="nach Retouren"
            icon={<Euro size={18} />}
          />
          <KPICard
            label="Gesamtprofit"
            value={EUR(summary.total_profit)}
            subtext={summary.total_profit >= 0 ? "Positiv" : "Verlust"}
            trend={summary.total_profit >= 0 ? "up" : "down"}
            icon={<TrendingUp size={18} />}
            highlight={summary.total_profit >= 0}
          />
          <KPICard
            label="Ø Retourenquote"
            value={`${summary.avg_return_rate.toFixed(1)}%`}
            subtext={summary.avg_return_rate > 20 ? "Handlungsbedarf" : "Im Rahmen"}
            trend={summary.avg_return_rate > 20 ? "down" : "neutral"}
            icon={<RotateCcw size={18} />}
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
            icon={<Award size={18} />}
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart stats={stats} />
          </div>
          <div>
            <ReturnRateChart stats={stats} />
          </div>
        </section>

        {/* Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Influencer im Detail
            </h2>
            <span className="text-xs text-gray-400">
              Klick auf Spaltenheader zum Sortieren
            </span>
          </div>
          <InfluencerTable stats={stats} />
        </section>

        {/* Footer note */}
        <footer className="text-center text-xs text-gray-300 py-4">
          Attributionsmodell: Discount Code → Shopify Order → Influencer ID ·
          Retourenwert basiert auf vollständig retournierten Bestellungen ·
          Partnerschaftskosten = monatliche Fixkosten
        </footer>
      </div>
    </main>
  );
}
