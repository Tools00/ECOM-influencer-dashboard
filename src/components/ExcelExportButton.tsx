"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { MonthlyReport } from "@/lib/analytics";
import { formatCompensation } from "@/lib/formatters";

interface Props {
  report: MonthlyReport;
  variant: "kompakt" | "vollstaendig";
}

function colWidth(wpx: number) {
  return { wpx };
}

export function ExcelExportButton({ report, variant }: Props) {
  function handleExport() {
    const wb = XLSX.utils.book_new();
    const month = report.month; // "YYYY-MM"

    if (variant === "kompakt") {
      const headers = [
        "Name", "Handle", "Platform", "Nische", "Kampagne",
        "Bestellungen", "Brutto (EUR)", "Netto (EUR)",
        "Retouren", "Retourenquote (%)", "Kosten (EUR)", "Profit (EUR)", "ROI (%)",
      ];
      const rows = report.stats.map((s) => [
        s.influencer.name,
        s.influencer.handle,
        s.influencer.platform,
        s.influencer.niche,
        s.influencer.campaign_name,
        s.total_orders,
        +s.gross_revenue.toFixed(2),
        +s.net_revenue.toFixed(2),
        s.return_count,
        +s.return_rate.toFixed(1),
        +s.actual_cost.toFixed(2),
        +s.profit.toFixed(2),
        +s.roi.toFixed(1),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [20, 16, 12, 16, 18, 12, 14, 14, 12, 16, 14, 14, 10].map(colWidth);
      XLSX.utils.book_append_sheet(wb, ws, "Übersicht");
      XLSX.writeFile(wb, `kompakt-${month}.xlsx`);
      return;
    }

    // ── Vollständig: 4 Sheets ──────────────────────────────────────────────

    // Sheet 1: Übersicht
    const overviewHeaders = [
      "Name", "Handle", "Platform", "Nische", "Kampagne",
      "Bestellungen", "Brutto (EUR)", "Netto (EUR)", "Retouren",
      "Retourenquote (%)", "Kosten (EUR)", "Profit (EUR)", "ROI (%)",
      "Ø Bestellwert (EUR)", "Kosten/Order (EUR)", "Umsatz/Follower",
    ];
    const overviewRows = report.stats.map((s) => [
      s.influencer.name,
      s.influencer.handle,
      s.influencer.platform,
      s.influencer.niche,
      s.influencer.campaign_name,
      s.total_orders,
      +s.gross_revenue.toFixed(2),
      +s.net_revenue.toFixed(2),
      s.return_count,
      +s.return_rate.toFixed(1),
      +s.actual_cost.toFixed(2),
      +s.profit.toFixed(2),
      +s.roi.toFixed(1),
      +s.aov.toFixed(2),
      +s.cost_per_order.toFixed(2),
      +s.revenue_per_follower.toFixed(4),
    ]);
    const wsOverview = XLSX.utils.aoa_to_sheet([overviewHeaders, ...overviewRows]);
    wsOverview["!cols"] = [20, 16, 12, 16, 18, 12, 14, 14, 12, 16, 14, 14, 10, 16, 16, 18].map(colWidth);
    XLSX.utils.book_append_sheet(wb, wsOverview, "Übersicht");

    // Sheet 2: Orders
    const orderHeaders = [
      "Order-ID", "Influencer", "Datum", "Quelle",
      "Brutto (EUR)", "Retourentyp", "Retourenbetrag (EUR)",
      "Netto (EUR)", "Kategorie", "Artikel", "Shopify-Order-ID",
    ];
    const influencerMap = new Map(report.stats.map((s) => [s.influencer.id, s.influencer.name]));
    const orderRows = report.orders.map((o) => [
      o.id,
      influencerMap.get(o.influencer_id) ?? o.influencer_id,
      o.order_date,
      o.order_source,
      +o.gross_value_eur.toFixed(2),
      o.return_type,
      +o.return_value_eur.toFixed(2),
      +(o.gross_value_eur - o.return_value_eur).toFixed(2),
      o.product_category,
      o.item_count,
      o.shopify_order_id ?? "",
    ]);
    const wsOrders = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
    wsOrders["!cols"] = [28, 20, 12, 14, 14, 14, 18, 12, 16, 10, 24].map(colWidth);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    // Sheet 3: Attribution-Split
    const attrHeaders = [
      "Influencer", "Handle",
      "Influencer-Orders", "Influencer-Netto (EUR)",
      "Meta Ads-Orders", "Meta Ads-Netto (EUR)",
      "Organic-Orders", "Organic-Netto (EUR)",
      "Overlap % (Meta Ads)",
    ];
    const attrRows = report.stats.map((s) => {
      const infOrders = report.orders.filter(
        (o) => o.influencer_id === s.influencer.id && o.order_source === "influencer"
      );
      const metaOrders = report.orders.filter(
        (o) => o.influencer_id === s.influencer.id && o.order_source === "meta_ads"
      );
      const orgOrders = report.orders.filter(
        (o) => o.influencer_id === s.influencer.id && o.order_source === "organic"
      );
      const net = (arr: typeof infOrders) =>
        arr.reduce((s, o) => s + o.gross_value_eur - o.return_value_eur, 0);
      const total = infOrders.length + metaOrders.length + orgOrders.length;
      const overlapPct = total > 0 ? +((metaOrders.length / total) * 100).toFixed(1) : 0;
      return [
        s.influencer.name,
        s.influencer.handle,
        infOrders.length,
        +net(infOrders).toFixed(2),
        metaOrders.length,
        +net(metaOrders).toFixed(2),
        orgOrders.length,
        +net(orgOrders).toFixed(2),
        overlapPct,
      ];
    });
    const wsAttr = XLSX.utils.aoa_to_sheet([attrHeaders, ...attrRows]);
    wsAttr["!cols"] = [20, 16, 18, 20, 16, 20, 16, 20, 18].map(colWidth);
    XLSX.utils.book_append_sheet(wb, wsAttr, "Attribution");

    // Sheet 4: Vergütung
    const compHeaders = [
      "Name", "Handle", "Vergütungsmodell", "Vergütung (Detail)",
      "Kampagne", "Vertragsbeginn", "Berechnete Kosten (EUR)", "Netto-Umsatz Basis (EUR)",
    ];
    const compRows = report.stats.map((s) => [
      s.influencer.name,
      s.influencer.handle,
      s.influencer.compensation.type,
      formatCompensation(s.influencer.compensation),
      s.influencer.campaign_name,
      s.influencer.contract_start_date ?? "",
      +s.actual_cost.toFixed(2),
      +s.net_revenue.toFixed(2),
    ]);
    const wsComp = XLSX.utils.aoa_to_sheet([compHeaders, ...compRows]);
    wsComp["!cols"] = [20, 16, 18, 26, 18, 16, 22, 22].map(colWidth);
    XLSX.utils.book_append_sheet(wb, wsComp, "Vergütung");

    XLSX.writeFile(wb, `vollstaendig-${month}.xlsx`);
  }

  const isKompakt = variant === "kompakt";
  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
        isKompakt
          ? "text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
          : "text-emerald-700 hover:text-emerald-900 border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100"
      }`}
    >
      <Download size={13} />
      {isKompakt ? "Kompakt .xlsx" : "Vollständig .xlsx"}
    </button>
  );
}
