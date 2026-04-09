import { InfluencerStats } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";
import { formatEUR, formatCompact } from "@/lib/formatters";
import { Users, Tag, Briefcase, DollarSign } from "lucide-react";
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
              <DollarSign size={14} className="text-gray-400 shrink-0" />
              <span>{formatEUR(influencer.monthly_cost_eur)}/Monat</span>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded-lg">
            {influencer.niche}
          </div>
        </div>
      </div>
    </div>
  );
}
