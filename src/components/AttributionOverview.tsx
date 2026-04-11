import { AttributionBreakdown } from "@/lib/analytics";
import { formatEUR } from "@/lib/formatters";
import { AlertTriangle } from "lucide-react";

interface Props {
  attribution: AttributionBreakdown;
}

export function AttributionOverview({ attribution }: Props) {
  const { influencer, meta_ads } = attribution;
  const total = influencer.orders + meta_ads.orders;
  const totalRevenue = influencer.net_revenue + meta_ads.net_revenue;

  const sources = [
    { label: "Influencer (ohne Meta-Overlap)", ...influencer, color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50" },
    { label: "Meta Ads Overlap", ...meta_ads, color: "bg-violet-500", textColor: "text-violet-700", bgLight: "bg-violet-50" },
  ];

  const influencerPct = total > 0 ? Math.round((influencer.orders / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Attribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">Discount-Code-Orders mit/ohne Meta-Referrer</p>
        </div>
        {meta_ads.orders > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
            <AlertTriangle size={12} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-700">{meta_ads.orders} Meta Ads</span>
          </div>
        )}
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-2.5 mb-4 gap-0.5">
        {sources.map((s) => {
          const pct = total > 0 ? (s.orders / total) * 100 : 0;
          if (pct === 0) return null;
          return <div key={s.label} className={s.color} style={{ width: `${pct}%` }} />;
        })}
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2.5">
        {sources.map((s) => {
          const pct = total > 0 ? (s.orders / total) * 100 : 0;
          return (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-xs text-gray-600">{s.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{s.orders} Bestellungen</span>
                <span className={`text-xs font-semibold ${s.textColor} ${s.bgLight} px-1.5 py-0.5 rounded`}>
                  {pct.toFixed(0)}%
                </span>
                <span className="text-xs font-medium text-gray-700 w-20 text-right">
                  {formatEUR(s.net_revenue)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note if overlap exists */}
      {meta_ads.orders > 0 && (
        <p className="text-xs text-amber-600 mt-3 pt-3 border-t border-gray-50">
          Echter Influencer-Umsatz: <span className="font-semibold">{formatEUR(influencer.net_revenue)}</span>
          {" "}({influencerPct}% von {formatEUR(totalRevenue)})
        </p>
      )}
    </div>
  );
}
