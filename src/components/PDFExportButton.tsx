"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";
import { MonthlyReport } from "@/lib/analytics";
import { Order } from "@/lib/types";

interface Props {
  report: MonthlyReport;
}

// Brand colors (RGB tuples)
const C_PRIMARY: [number, number, number] = [6, 95, 70];   // emerald-800
const C_PRIMARY_BG: [number, number, number] = [209, 250, 229]; // emerald-100
const C_TEXT: [number, number, number] = [31, 41, 55];     // gray-800
const C_MUTED: [number, number, number] = [107, 114, 128]; // gray-500
const C_DANGER: [number, number, number] = [239, 68, 68];  // red-500
const C_AMBER: [number, number, number] = [245, 158, 11];  // amber-500

function fmtEUR(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtEURPrecise(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}
function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
function fmtInt(n: number): string {
  return new Intl.NumberFormat("de-DE").format(n);
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("de-DE", {
    month: "long",
    year:  "numeric",
  });
}

export function PDFExportButton({ report }: Props) {
  function handleExport() {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;

    // ── Page 1: Cover + KPIs ─────────────────────────────────

    // Header band
    doc.setFillColor(...C_PRIMARY);
    doc.rect(0, 0, pageW, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Influencer-Monatsbericht", margin, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(monthLabel(report.month), margin, 27);

    doc.setFontSize(9);
    const generatedAt = new Date().toLocaleDateString("de-DE", {
      day: "2-digit", month: "long", year: "numeric",
    });
    doc.text(`Erstellt am ${generatedAt}`, pageW - margin, 27, { align: "right" });

    // KPI Section
    let y = 52;
    doc.setTextColor(...C_TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Kennzahlen", margin, y);
    y += 6;

    const kpis: { label: string; value: string; trend?: string; trendUp?: boolean }[] = [
      {
        label: "Netto-Umsatz",
        value: fmtEURPrecise(report.summary.total_net_revenue),
        trend: `${report.changes.revenue_change_pct >= 0 ? "+" : ""}${report.changes.revenue_change_pct.toFixed(1)}% vs. Vormonat`,
        trendUp: report.changes.revenue_change_pct >= 0,
      },
      {
        label: "Brutto-Umsatz",
        value: fmtEURPrecise(report.summary.total_gross_revenue),
      },
      {
        label: "Profit",
        value: fmtEURPrecise(report.summary.total_profit),
        trend: `${report.changes.profit_change_pct >= 0 ? "+" : ""}${report.changes.profit_change_pct.toFixed(1)}% vs. Vormonat`,
        trendUp: report.changes.profit_change_pct >= 0,
      },
      {
        label: "Bestellungen",
        value: fmtInt(report.summary.total_orders),
        trend: `${report.changes.orders_change_pct >= 0 ? "+" : ""}${report.changes.orders_change_pct.toFixed(1)}% vs. Vormonat`,
        trendUp: report.changes.orders_change_pct >= 0,
      },
      {
        label: "Ø Bestellwert",
        value: fmtEURPrecise(report.summary.avg_aov),
      },
      {
        label: "Ø Retourenquote",
        value: fmtPct(report.summary.avg_return_rate),
        trend: `${report.changes.return_rate_change >= 0 ? "+" : ""}${report.changes.return_rate_change.toFixed(1)}pp vs. Vormonat`,
        trendUp: report.changes.return_rate_change <= 0,
      },
    ];

    const cardW = (pageW - margin * 2 - 8) / 3;
    const cardH = 24;
    kpis.forEach((kpi, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = margin + col * (cardW + 4);
      const cy = y + row * (cardH + 4);

      // Card background
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "FD");

      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C_MUTED);
      doc.text(kpi.label.toUpperCase(), cx + 3, cy + 5);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...C_PRIMARY);
      doc.text(kpi.value, cx + 3, cy + 13);

      // Trend
      if (kpi.trend) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(
          ...(kpi.trendUp ? C_PRIMARY : C_DANGER)
        );
        doc.text(kpi.trend, cx + 3, cy + 20);
      }
    });

    y += Math.ceil(kpis.length / 3) * (cardH + 4) + 8;

    // ── Attribution-Split ────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C_TEXT);
    doc.text("Attribution-Split", margin, y);
    y += 5;

    const attr = report.attribution;
    const totalOrders = attr.influencer.orders + attr.meta_ads.orders + attr.organic.orders;
    const attrRows: [string, string, string, string][] = [
      [
        "Influencer (eigene Codes)",
        fmtInt(attr.influencer.orders),
        fmtEURPrecise(attr.influencer.net_revenue),
        totalOrders > 0 ? fmtPct((attr.influencer.orders / totalOrders) * 100) : "—",
      ],
      [
        "Meta Ads (Overlap-Risiko)",
        fmtInt(attr.meta_ads.orders),
        fmtEURPrecise(attr.meta_ads.net_revenue),
        totalOrders > 0 ? fmtPct((attr.meta_ads.orders / totalOrders) * 100) : "—",
      ],
      [
        "Organic",
        fmtInt(attr.organic.orders),
        fmtEURPrecise(attr.organic.net_revenue),
        totalOrders > 0 ? fmtPct((attr.organic.orders / totalOrders) * 100) : "—",
      ],
    ];

    autoTable(doc, {
      startY: y,
      head:   [["Quelle", "Orders", "Netto-Umsatz", "Anteil"]],
      body:   attrRows,
      theme:  "grid",
      margin: { left: margin, right: margin },
      styles: {
        font:      "helvetica",
        fontSize:  9,
        cellPadding: 2.5,
        textColor: C_TEXT,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: C_PRIMARY,
        textColor: 255,
        fontStyle: "bold",
        halign:    "left",
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    // Footer page 1
    drawFooter(doc, 1, pageW, pageH, margin);

    // ── Page 2+: Influencer-Tabelle (landscape) ──────────────
    doc.addPage("a4", "landscape");
    const pageW2 = doc.internal.pageSize.getWidth();
    const pageH2 = doc.internal.pageSize.getHeight();

    doc.setFillColor(...C_PRIMARY_BG);
    doc.rect(0, 0, pageW2, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C_PRIMARY);
    doc.text("Influencer-Performance", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(monthLabel(report.month), pageW2 - margin, 12, { align: "right" });

    const sortedStats = [...report.stats].sort((a, b) => b.net_revenue - a.net_revenue);
    const tableBody = sortedStats.map((s) => {
      const metaOrders = report.orders.filter(
        (o: Order) => o.influencer_id === s.influencer.id && o.order_source === "meta_ads"
      ).length;
      const overlapPct = s.total_orders > 0 ? (metaOrders / s.total_orders) * 100 : 0;
      return [
        s.influencer.name,
        s.influencer.platform,
        fmtInt(s.total_orders),
        fmtEUR(s.net_revenue),
        fmtPct(s.return_rate),
        fmtEUR(s.actual_cost),
        fmtEUR(s.profit),
        `${s.roi.toFixed(0)}%`,
        overlapPct >= 20 ? `${overlapPct.toFixed(0)}%` : "—",
      ];
    });

    // Totals row
    const totalRet = sortedStats.reduce((a, s) => a + s.return_count, 0);
    const totalGrossOrders = sortedStats.reduce((a, s) => a + s.total_orders, 0);
    tableBody.push([
      "GESAMT",
      "",
      fmtInt(totalGrossOrders),
      fmtEUR(report.summary.total_net_revenue),
      fmtPct(report.summary.avg_return_rate),
      fmtEUR(report.summary.total_net_revenue - report.summary.total_profit),
      fmtEUR(report.summary.total_profit),
      "",
      `${totalRet} Ret.`,
    ]);

    autoTable(doc, {
      startY: 24,
      head:   [["Influencer", "Platform", "Orders", "Netto", "Quote", "Kosten", "Profit", "ROI", "Meta-Overlap"]],
      body:   tableBody,
      theme:  "striped",
      margin: { left: margin, right: margin },
      styles: {
        font:      "helvetica",
        fontSize:  8,
        cellPadding: 2,
        textColor: C_TEXT,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: C_PRIMARY,
        textColor: 255,
        fontStyle: "bold",
        halign:    "left",
        fontSize:  8,
      },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: "bold" },
        1: { cellWidth: 22 },
        2: { cellWidth: 18, halign: "right" },
        3: { cellWidth: 28, halign: "right" },
        4: { cellWidth: 18, halign: "right" },
        5: { cellWidth: 26, halign: "right" },
        6: { cellWidth: 28, halign: "right" },
        7: { cellWidth: 18, halign: "right" },
        8: { cellWidth: 28, halign: "right" },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didParseCell: (data) => {
        // Highlight totals row
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fillColor = C_PRIMARY_BG;
          data.cell.styles.textColor = C_PRIMARY;
          data.cell.styles.fontStyle = "bold";
        }
        // Color ROI column
        if (data.column.index === 7 && data.section === "body" && data.row.index < tableBody.length - 1) {
          const raw = String(data.cell.raw ?? "");
          const v = parseFloat(raw);
          if (!isNaN(v)) {
            if (v >= 100) data.cell.styles.textColor = C_PRIMARY;
            else if (v < 0) data.cell.styles.textColor = C_DANGER;
          }
        }
        // Color return rate
        if (data.column.index === 4 && data.section === "body" && data.row.index < tableBody.length - 1) {
          const raw = String(data.cell.raw ?? "");
          const v = parseFloat(raw);
          if (!isNaN(v)) {
            if (v > 30) data.cell.styles.textColor = C_DANGER;
            else if (v > 20) data.cell.styles.textColor = C_AMBER;
          }
        }
      },
      didDrawPage: () => {
        const pageNum = doc.getCurrentPageInfo().pageNumber;
        drawFooter(doc, pageNum, pageW2, pageH2, margin);
      },
    });

    doc.save(`influencer-bericht-${report.month}.pdf`);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
    >
      <FileText size={13} />
      PDF-Bericht
    </button>
  );
}

function drawFooter(
  doc: jsPDF,
  pageNum: number,
  pageW: number,
  pageH: number,
  margin: number
) {
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.1);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C_MUTED);
  doc.text("Influencer Dashboard · DACH E-Commerce", margin, pageH - 7);
  doc.text(`Vertraulich · Seite ${pageNum}`, pageW - margin, pageH - 7, { align: "right" });
}
