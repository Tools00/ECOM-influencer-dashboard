import { AttributionBreakdown, computeAttributionRisk } from "@/lib/analytics";
import { formatEUR, formatPct } from "@/lib/formatters";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Props {
  attribution: AttributionBreakdown;
  discountCode: string;
  totalNetRevenue: number;
}

export function AttributionAlert({ attribution, discountCode, totalNetRevenue }: Props) {
  const { meta_ads, organic, influencer } = attribution;
  const total = influencer.orders + meta_ads.orders + organic.orders;
  const risk = computeAttributionRisk(attribution);

  if (risk.risk === "none") {
    return (
      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
        <CheckCircle size={15} className="text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700">
          Alle {total} Bestellungen mit Code <span className="font-semibold">{discountCode}</span> kommen direkt vom Influencer — keine Überschneidung mit Meta Ads.
        </p>
      </div>
    );
  }

  const riskColor = risk.risk === "low"
    ? { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", title: "text-amber-800", badge: "bg-amber-100 text-amber-700" }
    : { bg: "bg-red-50",   border: "border-red-200",   icon: "text-red-500",   title: "text-red-800",   badge: "bg-red-100 text-red-600" };

  const empfehlung = risk.risk === "low"
    ? "Überschneidung gering — ROI-Berechnung bleibt zuverlässig. Beobachten."
    : "Hohe Überschneidung — separaten Meta-Ads-Discount Code einrichten um Attribution zu bereinigen.";

  return (
    <div className={`${riskColor.bg} border ${riskColor.border} rounded-xl px-4 py-3 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className={`${riskColor.icon} shrink-0`} />
          <p className={`text-xs font-semibold ${riskColor.title}`}>
            Code <span className="font-mono">{discountCode}</span> auch in Meta Ads aktiv
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColor.badge}`}>
          {formatPct(risk.overlap_pct)} Overlap
        </span>
      </div>

      {/* Bestellungs-Split */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/60 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Influencer</p>
          <p className="text-sm font-bold text-emerald-700">{influencer.orders}</p>
          <p className="text-xs text-gray-400">{formatEUR(influencer.net_revenue)}</p>
        </div>
        <div className="bg-white/60 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Meta Ads</p>
          <p className="text-sm font-bold text-violet-700">{meta_ads.orders}</p>
          <p className="text-xs text-gray-400">{formatEUR(meta_ads.net_revenue)}</p>
        </div>
        <div className="bg-white/60 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Gesamt</p>
          <p className="text-sm font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-400">{formatEUR(totalNetRevenue)}</p>
        </div>
      </div>

      {/* Umsatz-Szenarien */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Geschätzter INF-Umsatz (Szenario)</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/60 rounded-lg px-2 py-1.5">
            <p className="text-xs text-gray-400">Konservativ</p>
            <p className="text-xs font-semibold text-gray-700">{formatEUR(risk.conservative_revenue)}</p>
            <p className="text-xs text-gray-300">0% Meta</p>
          </div>
          <div className="bg-white/60 rounded-lg px-2 py-1.5 ring-1 ring-gray-200">
            <p className="text-xs text-gray-400">Neutral</p>
            <p className="text-xs font-semibold text-gray-800">{formatEUR(risk.neutral_revenue)}</p>
            <p className="text-xs text-gray-300">50% Meta</p>
          </div>
          <div className="bg-white/60 rounded-lg px-2 py-1.5">
            <p className="text-xs text-gray-400">Liberal</p>
            <p className="text-xs font-semibold text-gray-700">{formatEUR(risk.liberal_revenue)}</p>
            <p className="text-xs text-gray-300">100% Meta</p>
          </div>
        </div>
      </div>

      {/* Empfehlung */}
      <div className="flex items-start gap-2 bg-white/50 rounded-lg px-3 py-2">
        <Info size={12} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">{empfehlung}</p>
      </div>
    </div>
  );
}
