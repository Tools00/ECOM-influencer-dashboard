import { InfluencerStats } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";
import { CompensationBadge } from "./CompensationBadge";
import { formatEUR, formatCompact, formatCompensation } from "@/lib/formatters";
import { computeActualCost } from "@/lib/analytics";
import { Users, Tag, Briefcase, TrendingUp } from "lucide-react";
import clsx from "clsx";

interface Props {
  stats: InfluencerStats;
}

export function InfluencerProfileCard({ stats }: Props) {
  const { influencer } = stats;
  const initial = influencer.name.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 shrink-0">
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{influencer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{influencer.handle}</span>
                <PlatformBadge platform={influencer.platform} />
              </div>
            </div>
            <span className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full",
              stats.profit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"
            )}>
              {stats.profit >= 0 ? "Profitabel" : "Verlust"}
            </span>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users size={14} className="text-gray-400 shrink-0" />
              <span>{formatCompact(influencer.followers)} Follower</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Tag size={14} className="text-gray-400 shrink-0" />
              <span>{influencer.discount_code}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Briefcase size={14} className="text-gray-400 shrink-0" />
              <span>{influencer.campaign_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <TrendingUp size={14} className="text-gray-400 shrink-0" />
              <span>ROI {stats.roi.toFixed(0)}%</span>
            </div>
          </div>

          {/* Niche + Compensation */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              {influencer.niche}
            </span>
            <CompensationBadge compensation={influencer.compensation} showDetail />
          </div>

          {/* Compensation detail box */}
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-400">Vergütungsmodell</div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5 capitalize">
                  {formatCompensation(influencer.compensation)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Tatsächliche Kosten</div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">
                  {formatEUR(stats.actual_cost)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Profit</div>
                <div className={clsx(
                  "text-xs font-semibold mt-0.5",
                  stats.profit >= 0 ? "text-emerald-700" : "text-red-600"
                )}>
                  {formatEUR(stats.profit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
