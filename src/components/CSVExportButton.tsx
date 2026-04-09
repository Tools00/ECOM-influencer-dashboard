"use client";

import { InfluencerStats } from "@/lib/types";
import { Download } from "lucide-react";

interface Props {
  stats: InfluencerStats[];
  filename?: string;
}

function toCSV(stats: InfluencerStats[]): string {
  const headers = [
    "Name", "Handle", "Platform", "Nische", "Kampagne",
    "Bestellungen", "Brutto (EUR)", "Retouren", "Retourenquote (%)",
    "Netto (EUR)", "Ø Bestellwert (EUR)", "Kosten (EUR)",
    "Kosten/Order (EUR)", "Profit (EUR)", "ROI (%)",
  ];

  const rows = stats.map((s) => [
    s.influencer.name,
    s.influencer.handle,
    s.influencer.platform,
    s.influencer.niche,
    s.influencer.campaign_name,
    s.total_orders,
    s.gross_revenue.toFixed(2),
    s.return_count,
    s.return_rate.toFixed(1),
    s.net_revenue.toFixed(2),
    s.aov.toFixed(2),
    s.monthly_cost.toFixed(2),
    s.cost_per_order.toFixed(2),
    s.profit.toFixed(2),
    s.roi.toFixed(1),
  ]);

  const lines = [headers, ...rows].map((row) =>
    row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")
  );

  return "\uFEFF" + lines.join("\r\n");
}

export function CSVExportButton({ stats, filename = "influencer-report.csv" }: Props) {
  function handleExport() {
    const csv = toCSV(stats);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all"
    >
      <Download size={13} />
      CSV Export
    </button>
  );
}
