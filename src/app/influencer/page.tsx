import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import { computeInfluencerStats, computeSparklineData } from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { PlatformBadge } from "@/components/PlatformBadge";
import { CSVExportButton } from "@/components/CSVExportButton";
import { NewInfluencerButton } from "@/components/NewInfluencerModal";
import { KPICard } from "@/components/KPICard";
import { formatEUR, formatPct, formatCompact } from "@/lib/formatters";
import Link from "next/link";
import { TrendingUp, TrendingDown, Users } from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InfluencerListPage() {
  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const stats = influencers.map((inf) => computeInfluencerStats(inf, orders));
  const sorted = [...stats].sort((a, b) => b.roi - a.roi);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <h1 className="text-sm font-semibold text-gray-800">Influencer</h1>
        <div className="flex items-center gap-2">
          <NewInfluencerButton />
          <CSVExportButton stats={stats} />
        </div>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
        <div className="mb-5">
          <p className="text-xs text-gray-400">{stats.length} aktive Influencer · sortiert nach ROI</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((s) => {
            const sparkline = computeSparklineData(orders, s.influencer.id, 30);
            return (
              <Link
                key={s.influencer.id}
                href={`/influencer/${s.influencer.id}`}
                className="block group"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">
                        {s.influencer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{s.influencer.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400">{s.influencer.handle}</span>
                          <PlatformBadge platform={s.influencer.platform} />
                        </div>
                      </div>
                    </div>
                    <span className={clsx(
                      "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                      s.profit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"
                    )}>
                      ROI {s.roi.toFixed(0)}%
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div>
                      <div className="text-xs text-gray-400">Netto</div>
                      <div className="text-sm font-bold text-gray-800 mt-0.5">{formatEUR(s.net_revenue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Retouren</div>
                      <div className={clsx(
                        "text-sm font-bold mt-0.5",
                        s.return_rate > 25 ? "text-red-600" : s.return_rate > 15 ? "text-amber-600" : "text-gray-800"
                      )}>
                        {formatPct(s.return_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Orders</div>
                      <div className="text-sm font-bold text-gray-800 mt-0.5">{s.total_orders}</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1">
                      <Users size={11} />
                      {formatCompact(s.influencer.followers)}
                    </div>
                    <span className="text-gray-300">{s.influencer.campaign_name}</span>
                    <span className="group-hover:text-emerald-600 transition-colors">
                      {s.influencer.discount_code}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
