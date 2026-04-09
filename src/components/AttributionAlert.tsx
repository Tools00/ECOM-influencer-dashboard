import { AttributionBreakdown } from "@/lib/analytics";
import { formatEUR, formatPct } from "@/lib/formatters";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  attribution: AttributionBreakdown;
  discountCode: string;
  totalNetRevenue: number;
}

export function AttributionAlert({ attribution, discountCode, totalNetRevenue }: Props) {
  const { meta_ads, organic, influencer } = attribution;
  const total = influencer.orders + meta_ads.orders + organic.orders;
  const influencerPct = total > 0 ? (influencer.orders / total) * 100 : 100;

  if (meta_ads.orders === 0) {
    return (
      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
        <CheckCircle size={15} className="text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700">
          Alle {total} Bestellungen mit Code <span className="font-semibold">{discountCode}</span> kommen direkt vom Influencer — keine Überschneidung mit Meta Ads.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-800">
          Attribution-Überschneidung — Code <span className="font-mono">{discountCode}</span> auch in Meta Ads aktiv
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="text-center">
          <p className="text-xs text-gray-500">Influencer-Bestellungen</p>
          <p className="text-sm font-bold text-emerald-700">{influencer.orders}</p>
          <p className="text-xs text-gray-400">{formatEUR(influencer.net_revenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Meta Ads</p>
          <p className="text-sm font-bold text-violet-700">{meta_ads.orders}</p>
          <p className="text-xs text-gray-400">{formatEUR(meta_ads.net_revenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Echter INF-Anteil</p>
          <p className="text-sm font-bold text-gray-800">{formatPct(influencerPct)}</p>
          <p className="text-xs text-gray-400">von {formatEUR(totalNetRevenue)}</p>
        </div>
      </div>
    </div>
  );
}
