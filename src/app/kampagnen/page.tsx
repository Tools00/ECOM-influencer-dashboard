import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import { computeInfluencerStats, computeCampaignSummaries } from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { PlatformBadge } from "@/components/PlatformBadge";
import { formatEUR, formatPct } from "@/lib/formatters";
import { Megaphone, TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KampagnenPage() {
  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const stats = influencers.map((inf) => computeInfluencerStats(inf, orders));
  const campaigns = computeCampaignSummaries(stats).sort((a, b) => b.avg_roi - a.avg_roi);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <h1 className="text-sm font-semibold text-gray-800">Kampagnen</h1>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-5">
        <p className="text-xs text-gray-400">{campaigns.length} aktive Kampagnen</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {campaigns.map((campaign) => (
            <div key={campaign.campaign_name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Campaign header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Megaphone size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">{campaign.campaign_name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{campaign.influencers.length} Influencer</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{formatEUR(campaign.total_revenue)}</div>
                  <div className={clsx(
                    "text-xs font-semibold mt-0.5",
                    campaign.avg_roi >= 0 ? "text-emerald-600" : "text-red-500"
                  )}>
                    Ø ROI {campaign.avg_roi.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-50 mb-4 text-center">
                <div>
                  <div className="text-xs text-gray-400">Gesamtprofit</div>
                  <div className={clsx("text-sm font-bold mt-0.5", campaign.total_profit >= 0 ? "text-emerald-700" : "text-red-600")}>
                    {formatEUR(campaign.total_profit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Bestellungen</div>
                  <div className="text-sm font-bold text-gray-800 mt-0.5">
                    {campaign.influencers.reduce((s, i) => s + i.total_orders, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Ø Retourenquote</div>
                  <div className="text-sm font-bold text-gray-800 mt-0.5">
                    {formatPct(
                      campaign.influencers.reduce((s, i) => s + i.return_rate, 0) / campaign.influencers.length
                    )}
                  </div>
                </div>
              </div>

              {/* Influencer list */}
              <div className="space-y-2">
                {campaign.influencers.map((s) => (
                  <div key={s.influencer.id} className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                        {s.influencer.name.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-gray-700 truncate">{s.influencer.name}</span>
                      <PlatformBadge platform={s.influencer.platform} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500">{formatEUR(s.net_revenue)}</span>
                      <span className={clsx(
                        "flex items-center gap-0.5 text-xs font-semibold",
                        s.roi >= 0 ? "text-emerald-600" : "text-red-500"
                      )}>
                        {s.roi >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {s.roi.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
