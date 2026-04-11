"use client";

import ExcelJS from "exceljs";
import { Download } from "lucide-react";
import { MonthlyReport } from "@/lib/analytics";
import { formatCompensation } from "@/lib/formatters";
import { InfluencerStats, Order } from "@/lib/types";

interface Props {
  report: MonthlyReport;
  variant: "kompakt" | "vollstaendig";
}

// ── Styles ───────────────────────────────────────────────────

const COLOR_PRIMARY    = "FF065F46"; // emerald-800
const COLOR_PRIMARY_BG = "FFD1FAE5"; // emerald-100
const COLOR_HEADER_BG  = "FF064E3B"; // emerald-900
const COLOR_BORDER     = "FFE5E7EB"; // gray-200
const COLOR_TITLE_BG   = "FFECFDF5"; // emerald-50
const COLOR_ALT_ROW    = "FFF9FAFB"; // gray-50

type ColDef = {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
  align?: "left" | "center" | "right";
};

function applyHeaderRow(ws: ExcelJS.Worksheet, rowIndex: number) {
  const row = ws.getRow(rowIndex);
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_HEADER_BG } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    cell.border = {
      top:    { style: "thin", color: { argb: COLOR_BORDER } },
      left:   { style: "thin", color: { argb: COLOR_BORDER } },
      bottom: { style: "thin", color: { argb: COLOR_BORDER } },
      right:  { style: "thin", color: { argb: COLOR_BORDER } },
    };
  });
}

function applyDataRows(ws: ExcelJS.Worksheet, fromRow: number, toRow: number) {
  for (let r = fromRow; r <= toRow; r++) {
    const row = ws.getRow(r);
    row.height = 18;
    const isAlt = (r - fromRow) % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF1F2937" } };
      cell.alignment = { vertical: "middle", indent: 1 };
      if (isAlt) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_ALT_ROW } };
      }
      cell.border = {
        bottom: { style: "hair", color: { argb: COLOR_BORDER } },
      };
    });
  }
}

function setupSheet(ws: ExcelJS.Worksheet, title: string, subtitle: string, cols: ColDef[]) {
  ws.columns = cols.map((c) => ({
    header: c.header,
    key:    c.key,
    width:  c.width,
    style:  c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  // Insert title rows ABOVE header
  ws.spliceRows(1, 0, [title]);
  ws.spliceRows(2, 0, [subtitle]);
  ws.spliceRows(3, 0, []);

  ws.mergeCells(1, 1, 1, cols.length);
  ws.mergeCells(2, 1, 2, cols.length);

  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: "Calibri", bold: true, size: 16, color: { argb: COLOR_PRIMARY } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TITLE_BG } };
  ws.getRow(1).height = 28;

  const subCell = ws.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { name: "Calibri", italic: true, size: 10, color: { argb: "FF6B7280" } };
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TITLE_BG } };
  ws.getRow(2).height = 18;

  // Header row is now at row 4
  applyHeaderRow(ws, 4);

  // Apply col-level alignment to data
  cols.forEach((c, idx) => {
    if (c.align) {
      ws.getColumn(idx + 1).alignment = { vertical: "middle", horizontal: c.align, indent: 1 };
    }
  });

  // Freeze panes — title + header
  ws.views = [{ state: "frozen", ySplit: 4, xSplit: 0 }];
  // Auto filter on header row
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: cols.length } };
}

function finalizeSheet(ws: ExcelJS.Worksheet, dataStartRow: number) {
  const lastRow = ws.lastRow?.number ?? dataStartRow;
  if (lastRow >= dataStartRow) {
    applyDataRows(ws, dataStartRow, lastRow);
  }
}

// ── Export ───────────────────────────────────────────────────

export function ExcelExportButton({ report, variant }: Props) {
  async function handleExport() {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Influencer Dashboard";
    wb.created = new Date();
    wb.properties.date1904 = false;

    const month = report.month;
    const monthLabel = new Date(`${month}-01`).toLocaleDateString("de-DE", {
      month: "long",
      year:  "numeric",
    });

    const EUR_FMT = '#,##0.00 "€"';
    const PCT_FMT = '0.0"%"';
    const INT_FMT = "#,##0";

    if (variant === "kompakt") {
      const ws = wb.addWorksheet("Übersicht", {
        properties: { tabColor: { argb: COLOR_PRIMARY } },
      });
      setupSheet(
        ws,
        "Influencer-Übersicht",
        `Monatsbericht ${monthLabel}`,
        [
          { header: "Name",            key: "name",     width: 24 },
          { header: "Handle",          key: "handle",   width: 18 },
          { header: "Platform",        key: "platform", width: 12 },
          { header: "Nische",          key: "niche",    width: 16 },
          { header: "Kampagne",        key: "camp",     width: 22 },
          { header: "Bestellungen",    key: "orders",   width: 14, numFmt: INT_FMT, align: "right" },
          { header: "Brutto",          key: "gross",    width: 16, numFmt: EUR_FMT, align: "right" },
          { header: "Netto",           key: "net",      width: 16, numFmt: EUR_FMT, align: "right" },
          { header: "Retouren",        key: "ret",      width: 12, numFmt: INT_FMT, align: "right" },
          { header: "Retourenquote",   key: "retpct",   width: 14, numFmt: PCT_FMT, align: "right" },
          { header: "Kosten",          key: "cost",     width: 16, numFmt: EUR_FMT, align: "right" },
          { header: "Profit",          key: "profit",   width: 16, numFmt: EUR_FMT, align: "right" },
          { header: "ROI",             key: "roi",      width: 12, numFmt: PCT_FMT, align: "right" },
        ]
      );

      report.stats.forEach((s) => {
        ws.addRow({
          name:     s.influencer.name,
          handle:   s.influencer.handle,
          platform: s.influencer.platform,
          niche:    s.influencer.niche,
          camp:     s.influencer.campaign_name,
          orders:   s.total_orders,
          gross:    s.gross_revenue,
          net:      s.net_revenue,
          ret:      s.return_count,
          retpct:   s.return_rate,
          cost:     s.actual_cost,
          profit:   s.profit,
          roi:      s.roi,
        });
      });

      // Total row
      const lastDataRow = ws.lastRow!.number;
      const totalRow = ws.addRow({
        name:   "GESAMT",
        orders: report.stats.reduce((a, s) => a + s.total_orders, 0),
        gross:  report.stats.reduce((a, s) => a + s.gross_revenue, 0),
        net:    report.stats.reduce((a, s) => a + s.net_revenue, 0),
        ret:    report.stats.reduce((a, s) => a + s.return_count, 0),
        cost:   report.stats.reduce((a, s) => a + s.actual_cost, 0),
        profit: report.stats.reduce((a, s) => a + s.profit, 0),
      });
      totalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11, color: { argb: COLOR_PRIMARY } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARY_BG } };
        cell.border = {
          top:    { style: "medium", color: { argb: COLOR_PRIMARY } },
          bottom: { style: "medium", color: { argb: COLOR_PRIMARY } },
        };
      });
      finalizeSheet(ws, 5);
      // Re-style total row after finalize override
      totalRow.height = 22;

      await downloadWorkbook(wb, `kompakt-${month}.xlsx`);
      return;
    }

    // ── Vollständig: 4 Sheets ───────────────────────────────────

    // KPI Cover Sheet
    const wsCover = wb.addWorksheet("KPIs", {
      properties: { tabColor: { argb: "FF6366F1" } },
    });
    wsCover.columns = [
      { key: "label", width: 32 },
      { key: "value", width: 24 },
    ];
    wsCover.addRow(["Influencer-Monatsbericht"]);
    wsCover.addRow([monthLabel]);
    wsCover.addRow([]);
    wsCover.mergeCells("A1:B1");
    wsCover.mergeCells("A2:B2");
    const c1 = wsCover.getCell("A1");
    c1.font = { bold: true, size: 22, color: { argb: COLOR_PRIMARY } };
    c1.alignment = { horizontal: "left", indent: 1 };
    wsCover.getRow(1).height = 36;
    const c2 = wsCover.getCell("A2");
    c2.font = { italic: true, size: 12, color: { argb: "FF6B7280" } };
    c2.alignment = { horizontal: "left", indent: 1 };

    const kpis: [string, number | string, string?][] = [
      ["Brutto-Umsatz",      report.summary.total_gross_revenue, EUR_FMT],
      ["Netto-Umsatz",       report.summary.total_net_revenue,   EUR_FMT],
      ["Profit",             report.summary.total_profit,        EUR_FMT],
      ["Bestellungen",       report.summary.total_orders,        INT_FMT],
      ["Ø Bestellwert",      report.summary.avg_aov,             EUR_FMT],
      ["Ø Retourenquote",    report.summary.avg_return_rate,     PCT_FMT],
      ["Anzahl Influencer",  report.stats.length,                INT_FMT],
    ];
    kpis.forEach(([label, value, fmt]) => {
      const r = wsCover.addRow([label, value]);
      r.height = 22;
      r.getCell(1).font = { bold: true, size: 11, color: { argb: "FF374151" } };
      r.getCell(1).alignment = { vertical: "middle", indent: 1 };
      r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_TITLE_BG } };
      r.getCell(2).font = { bold: true, size: 12, color: { argb: COLOR_PRIMARY } };
      r.getCell(2).alignment = { vertical: "middle", horizontal: "right", indent: 1 };
      if (fmt) r.getCell(2).numFmt = fmt;
      r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_PRIMARY_BG } };
    });
    wsCover.views = [{ state: "frozen", ySplit: 2 }];

    // Sheet 1: Übersicht (vollständig)
    const wsOver = wb.addWorksheet("Übersicht", {
      properties: { tabColor: { argb: COLOR_PRIMARY } },
    });
    setupSheet(
      wsOver,
      "Influencer-Übersicht (vollständig)",
      `Monatsbericht ${monthLabel}`,
      [
        { header: "Name",              key: "name",     width: 24 },
        { header: "Handle",            key: "handle",   width: 18 },
        { header: "Platform",          key: "platform", width: 12 },
        { header: "Nische",            key: "niche",    width: 16 },
        { header: "Kampagne",          key: "camp",     width: 22 },
        { header: "Bestellungen",      key: "orders",   width: 14, numFmt: INT_FMT, align: "right" },
        { header: "Brutto",            key: "gross",    width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "Netto",             key: "net",      width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "Retouren",          key: "ret",      width: 12, numFmt: INT_FMT, align: "right" },
        { header: "Retourenquote",     key: "retpct",   width: 14, numFmt: PCT_FMT, align: "right" },
        { header: "Kosten",            key: "cost",     width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "Profit",            key: "profit",   width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "ROI",               key: "roi",      width: 12, numFmt: PCT_FMT, align: "right" },
        { header: "Ø Bestellwert",     key: "aov",      width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "Kosten/Order",      key: "cpo",      width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "Umsatz/Follower",   key: "rpf",      width: 18, numFmt: '0.0000 "€"', align: "right" },
      ]
    );
    report.stats.forEach((s: InfluencerStats) => {
      wsOver.addRow({
        name:     s.influencer.name,
        handle:   s.influencer.handle,
        platform: s.influencer.platform,
        niche:    s.influencer.niche,
        camp:     s.influencer.campaign_name,
        orders:   s.total_orders,
        gross:    s.gross_revenue,
        net:      s.net_revenue,
        ret:      s.return_count,
        retpct:   s.return_rate,
        cost:     s.actual_cost,
        profit:   s.profit,
        roi:      s.roi,
        aov:      s.aov,
        cpo:      s.cost_per_order,
        rpf:      s.revenue_per_follower,
      });
    });
    finalizeSheet(wsOver, 5);

    // Sheet 2: Orders
    const wsOrders = wb.addWorksheet("Orders", {
      properties: { tabColor: { argb: "FFF59E0B" } },
    });
    const influencerMap = new Map(report.stats.map((s) => [s.influencer.id, s.influencer.name]));
    setupSheet(
      wsOrders,
      "Alle Bestellungen",
      `${report.orders.length} Orders im Zeitraum ${monthLabel}`,
      [
        { header: "Order-ID",         key: "id",       width: 28 },
        { header: "Influencer",       key: "inf",      width: 22 },
        { header: "Datum",            key: "date",     width: 13 },
        { header: "Quelle",           key: "src",      width: 14 },
        { header: "Brutto",           key: "gross",    width: 14, numFmt: EUR_FMT, align: "right" },
        { header: "Retourentyp",      key: "rt",       width: 14 },
        { header: "Retourenbetrag",   key: "rv",       width: 16, numFmt: EUR_FMT, align: "right" },
        { header: "Netto",            key: "net",      width: 14, numFmt: EUR_FMT, align: "right" },
        { header: "Kategorie",        key: "cat",      width: 16 },
        { header: "Artikel",          key: "items",    width: 10, numFmt: INT_FMT, align: "right" },
        { header: "Shopify-ID",       key: "shop",     width: 24 },
      ]
    );
    report.orders.forEach((o: Order) => {
      wsOrders.addRow({
        id:    o.id,
        inf:   influencerMap.get(o.influencer_id) ?? o.influencer_id,
        date:  o.order_date,
        src:   o.order_source,
        gross: o.gross_value_eur,
        rt:    o.return_type,
        rv:    o.return_value_eur,
        net:   o.gross_value_eur - o.return_value_eur,
        cat:   o.product_category,
        items: o.item_count,
        shop:  o.shopify_order_id ?? "",
      });
    });
    finalizeSheet(wsOrders, 5);

    // Sheet 3: Attribution
    const wsAttr = wb.addWorksheet("Attribution", {
      properties: { tabColor: { argb: "FFEF4444" } },
    });
    setupSheet(
      wsAttr,
      "Attribution-Split pro Influencer",
      `Influencer vs. Meta Ads vs. Organic — ${monthLabel}`,
      [
        { header: "Influencer",          key: "name",   width: 22 },
        { header: "Handle",              key: "handle", width: 18 },
        { header: "Influencer-Orders",   key: "io",     width: 18, numFmt: INT_FMT, align: "right" },
        { header: "Influencer-Netto",    key: "in",     width: 18, numFmt: EUR_FMT, align: "right" },
        { header: "Meta Ads-Orders",     key: "mo",     width: 18, numFmt: INT_FMT, align: "right" },
        { header: "Meta Ads-Netto",      key: "mn",     width: 18, numFmt: EUR_FMT, align: "right" },
        { header: "Organic-Orders",      key: "oo",     width: 16, numFmt: INT_FMT, align: "right" },
        { header: "Organic-Netto",       key: "on",     width: 18, numFmt: EUR_FMT, align: "right" },
        { header: "Overlap % (Meta)",    key: "ov",     width: 18, numFmt: PCT_FMT, align: "right" },
      ]
    );
    report.stats.forEach((s) => {
      const orders = report.orders.filter((o) => o.influencer_id === s.influencer.id);
      const inf = orders.filter((o) => o.order_source === "influencer");
      const meta = orders.filter((o) => o.order_source === "meta_ads");
      const org = orders.filter((o) => o.order_source === "organic");
      const net = (arr: Order[]) =>
        arr.reduce((sum, o) => sum + o.gross_value_eur - o.return_value_eur, 0);
      const total = inf.length + meta.length + org.length;
      wsAttr.addRow({
        name:   s.influencer.name,
        handle: s.influencer.handle,
        io:     inf.length,
        in:     net(inf),
        mo:     meta.length,
        mn:     net(meta),
        oo:     org.length,
        on:     net(org),
        ov:     total > 0 ? (meta.length / total) * 100 : 0,
      });
    });
    finalizeSheet(wsAttr, 5);

    // Sheet 4: Vergütung
    const wsComp = wb.addWorksheet("Vergütung", {
      properties: { tabColor: { argb: "FF8B5CF6" } },
    });
    setupSheet(
      wsComp,
      "Vergütungsmodelle & Kosten",
      `Pro Influencer — ${monthLabel}`,
      [
        { header: "Name",                  key: "name",   width: 22 },
        { header: "Handle",                key: "handle", width: 18 },
        { header: "Modell",                key: "type",   width: 14 },
        { header: "Vergütung (Detail)",    key: "detail", width: 30 },
        { header: "Kampagne",              key: "camp",   width: 22 },
        { header: "Vertragsbeginn",        key: "start",  width: 16 },
        { header: "Berechnete Kosten",     key: "cost",   width: 20, numFmt: EUR_FMT, align: "right" },
        { header: "Netto-Umsatz Basis",    key: "net",    width: 20, numFmt: EUR_FMT, align: "right" },
      ]
    );
    report.stats.forEach((s) => {
      wsComp.addRow({
        name:   s.influencer.name,
        handle: s.influencer.handle,
        type:   s.influencer.compensation.type,
        detail: formatCompensation(s.influencer.compensation),
        camp:   s.influencer.campaign_name,
        start:  s.influencer.contract_start_date ?? "",
        cost:   s.actual_cost,
        net:    s.net_revenue,
      });
    });
    finalizeSheet(wsComp, 5);

    await downloadWorkbook(wb, `vollstaendig-${month}.xlsx`);
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

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
