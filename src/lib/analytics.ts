import { Influencer, InfluencerStats, Order, DashboardSummary, DateRange, DailyRevenue, CategoryRevenue, CampaignSummary, PeriodComparison, Compensation, OrderSource } from "./types";
import { REFERENCE_DATE, DACH_RETURN_BENCHMARKS } from "./constants";

// ─── Date filtering ────────────────────────────────────────────────────────

export function filterOrdersByDateRange(orders: Order[], range: DateRange): Order[] {
  if (range === "all") return orders;
  const ref = new Date(REFERENCE_DATE);
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date(ref);
  cutoff.setDate(ref.getDate() - days + 1);
  return orders.filter((o) => new Date(o.order_date) >= cutoff);
}

function filterOrdersByWindow(orders: Order[], endDate: Date, days: number): Order[] {
  const start = new Date(endDate);
  start.setDate(endDate.getDate() - days + 1);
  return orders.filter((o) => {
    const d = new Date(o.order_date);
    return d >= start && d <= endDate;
  });
}

// ─── Compensation cost calculation ────────────────────────────────────────

export function computeActualCost(compensation: Compensation, netRevenue: number): number {
  switch (compensation.type) {
    case "fixed":
      return compensation.fixed_eur ?? 0;
    case "commission":
      return (netRevenue * (compensation.commission_pct ?? 0)) / 100;
    case "hybrid":
      return (compensation.fixed_eur ?? 0) + (netRevenue * (compensation.commission_pct ?? 0)) / 100;
    case "per_post":
      return (compensation.per_post_eur ?? 0) * (compensation.posts_count ?? 0);
    case "barter":
      return compensation.fixed_eur ?? 0;
  }
}

// ─── Core stats ────────────────────────────────────────────────────────────

export function computeInfluencerStats(influencer: Influencer, orders: Order[]): InfluencerStats {
  const inf = orders.filter((o) => o.influencer_id === influencer.id);
  const gross_revenue = inf.reduce((s, o) => s + o.gross_value_eur, 0);
  const full_return_count = inf.filter((o) => o.return_type === "full").length;
  const partial_return_count = inf.filter((o) => o.return_type === "partial").length;
  const return_count = full_return_count + partial_return_count;
  const return_value = inf.reduce((s, o) => s + o.return_value_eur, 0);
  const net_revenue = gross_revenue - return_value;
  const return_rate = inf.length > 0 ? (return_count / inf.length) * 100 : 0;
  const actual_cost = computeActualCost(influencer.compensation, net_revenue);
  const profit = net_revenue - actual_cost;
  const roi = actual_cost > 0 ? (profit / actual_cost) * 100 : net_revenue > 0 ? 100 : 0;
  const aov = inf.length > 0 ? gross_revenue / inf.length : 0;
  const cost_per_order = inf.length > 0 ? actual_cost / inf.length : 0;
  const revenue_per_follower = influencer.followers > 0 ? net_revenue / influencer.followers : 0;

  return {
    influencer,
    total_orders: inf.length,
    gross_revenue,
    return_count,
    full_return_count,
    partial_return_count,
    return_value,
    net_revenue,
    return_rate,
    actual_cost,
    profit,
    roi,
    aov,
    cost_per_order,
    revenue_per_follower,
  };
}

export function computeDashboardSummary(stats: InfluencerStats[]): DashboardSummary {
  const total_gross_revenue = stats.reduce((s, x) => s + x.gross_revenue, 0);
  const total_net_revenue = stats.reduce((s, x) => s + x.net_revenue, 0);
  const total_profit = stats.reduce((s, x) => s + x.profit, 0);
  const total_orders = stats.reduce((s, x) => s + x.total_orders, 0);
  const avg_return_rate = stats.length > 0 ? stats.reduce((s, x) => s + x.return_rate, 0) / stats.length : 0;
  const avg_aov = stats.length > 0 ? stats.reduce((s, x) => s + x.aov, 0) / stats.length : 0;
  const best_performer = stats.reduce<InfluencerStats | null>(
    (best, x) => (best === null || x.roi > best.roi ? x : best),
    null
  );
  return { total_gross_revenue, total_net_revenue, total_profit, total_orders, avg_return_rate, avg_aov, best_performer };
}

// ─── Period comparison ─────────────────────────────────────────────────────

export function computePeriodComparison(
  influencers: Influencer[],
  orders: Order[],
  range: DateRange
): PeriodComparison {
  const ref = new Date(REFERENCE_DATE);
  let days: number;
  if (range === "7d") days = 7;
  else if (range === "30d") days = 30;
  else if (range === "90d") days = 90;
  else {
    // "all": tatsächliche Datumsspanne aus den Orders berechnen
    if (orders.length === 0) {
      days = 91;
    } else {
      const earliest = orders.reduce((min, o) => o.order_date < min ? o.order_date : min, orders[0].order_date);
      days = Math.ceil((ref.getTime() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const currentOrders = filterOrdersByWindow(orders, ref, days);
  const prevEnd = new Date(ref);
  prevEnd.setDate(ref.getDate() - days);
  const prevOrders = filterOrdersByWindow(orders, prevEnd, days);

  const currentStats = influencers.map((i) => computeInfluencerStats(i, currentOrders));
  const prevStats = influencers.map((i) => computeInfluencerStats(i, prevOrders));

  const current = computeDashboardSummary(currentStats);
  const previous = computeDashboardSummary(prevStats);

  function pct(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  return {
    current,
    previous,
    changes: {
      revenue_change_pct: pct(current.total_net_revenue, previous.total_net_revenue),
      orders_change_pct: pct(current.total_orders, previous.total_orders),
      profit_change_pct: pct(current.total_profit, previous.total_profit),
      return_rate_change: current.avg_return_rate - previous.avg_return_rate,
    },
  };
}

// ─── Time-series ───────────────────────────────────────────────────────────

export function computeDailyRevenue(orders: Order[]): DailyRevenue[] {
  const map = new Map<string, DailyRevenue>();
  for (const o of orders) {
    const d = o.order_date;
    if (!map.has(d)) map.set(d, { date: d, gross: 0, net: 0, orders: 0 });
    const entry = map.get(d)!;
    entry.gross += o.gross_value_eur;
    entry.net += o.gross_value_eur - o.return_value_eur;
    entry.orders += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Category breakdown ────────────────────────────────────────────────────

export function computeCategoryRevenue(orders: Order[]): CategoryRevenue[] {
  const map = new Map<string, { revenue: number; orders: number; returns: number }>();
  for (const o of orders) {
    if (!map.has(o.product_category)) map.set(o.product_category, { revenue: 0, orders: 0, returns: 0 });
    const e = map.get(o.product_category)!;
    e.revenue += o.gross_value_eur - o.return_value_eur;
    e.orders += 1;
    if (o.return_type !== "none") e.returns += 1;
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      revenue: v.revenue,
      orders: v.orders,
      return_rate: v.orders > 0 ? (v.returns / v.orders) * 100 : 0,
      benchmark_rate: DACH_RETURN_BENCHMARKS[category] ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── Campaigns ─────────────────────────────────────────────────────────────

export function computeCampaignSummaries(stats: InfluencerStats[]): CampaignSummary[] {
  const map = new Map<string, InfluencerStats[]>();
  for (const s of stats) {
    const c = s.influencer.campaign_name;
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(s);
  }
  return Array.from(map.entries()).map(([campaign_name, influencers]) => ({
    campaign_name,
    influencers,
    total_revenue: influencers.reduce((s, x) => s + x.net_revenue, 0),
    total_profit: influencers.reduce((s, x) => s + x.profit, 0),
    avg_roi: influencers.length > 0 ? influencers.reduce((s, x) => s + x.roi, 0) / influencers.length : 0,
  }));
}

// ─── Attribution breakdown ────────────────────────────────────────────────

export interface AttributionBreakdown {
  influencer: { orders: number; net_revenue: number };
  meta_ads: { orders: number; net_revenue: number };
  organic: { orders: number; net_revenue: number };
}

export function computeAttributionBreakdown(orders: Order[]): AttributionBreakdown {
  const result: AttributionBreakdown = {
    influencer: { orders: 0, net_revenue: 0 },
    meta_ads: { orders: 0, net_revenue: 0 },
    organic: { orders: 0, net_revenue: 0 },
  };
  for (const o of orders) {
    const net = o.gross_value_eur - o.return_value_eur;
    result[o.order_source].orders += 1;
    result[o.order_source].net_revenue += net;
  }
  return result;
}

// ─── Attribution Risk Score ───────────────────────────────────────────────

export type AttributionRisk = "none" | "low" | "high";

export interface AttributionRiskResult {
  risk: AttributionRisk;
  overlap_pct: number;               // Anteil Meta-Ads-Orders an Gesamt
  conservative_revenue: number;      // 0% Meta Ads dem Influencer angerechnet
  neutral_revenue: number;           // 50% Meta Ads dem Influencer angerechnet
  liberal_revenue: number;           // 100% Meta Ads dem Influencer angerechnet
}

export function computeAttributionRisk(
  breakdown: AttributionBreakdown
): AttributionRiskResult {
  const total = breakdown.influencer.orders + breakdown.meta_ads.orders + breakdown.organic.orders;
  const overlap_pct = total > 0 ? (breakdown.meta_ads.orders / total) * 100 : 0;

  const risk: AttributionRisk =
    overlap_pct === 0 ? "none" :
    overlap_pct < 20  ? "low"  : "high";

  const inf_net = breakdown.influencer.net_revenue;
  const meta_net = breakdown.meta_ads.net_revenue;

  return {
    risk,
    overlap_pct,
    conservative_revenue: inf_net,
    neutral_revenue:      inf_net + meta_net * 0.5,
    liberal_revenue:      inf_net + meta_net,
  };
}

// ─── Total net revenue sparkline (lückenlose Tagesserie) ──────────────────

export function computeTotalNetSparkline(orders: Order[], range: DateRange): number[] {
  if (range === "all") {
    // Für "all": chronologisch aggregierte Tageswerte (ohne Nullen)
    return computeDailyRevenue(orders).map((d) => d.net);
  }
  const ref = new Date(REFERENCE_DATE);
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(ref.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const dayNet = orders
      .filter((o) => o.order_date === iso)
      .reduce((s, o) => s + o.gross_value_eur - o.return_value_eur, 0);
    result.push(dayNet);
  }
  return result;
}

// ─── Sparkline ─────────────────────────────────────────────────────────────

export function computeSparklineData(orders: Order[], influencerId: string, days: number = 30): number[] {
  const ref = new Date(REFERENCE_DATE);
  const result: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(ref.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const dayRevenue = orders
      .filter((o) => o.influencer_id === influencerId && o.order_date === iso)
      .reduce((s, o) => s + o.gross_value_eur - o.return_value_eur, 0);
    result.push(dayRevenue);
  }
  return result;
}
