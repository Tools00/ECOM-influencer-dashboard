import { Influencer, InfluencerStats, Order, DashboardSummary } from "./types";

export function computeInfluencerStats(
  influencer: Influencer,
  orders: Order[]
): InfluencerStats {
  const influencerOrders = orders.filter((o) => o.influencer_id === influencer.id);

  const gross_revenue = influencerOrders.reduce((sum, o) => sum + o.gross_value_eur, 0);
  const return_count = influencerOrders.filter((o) => o.is_returned).length;
  const return_value = influencerOrders.reduce((sum, o) => sum + o.return_value_eur, 0);
  const net_revenue = gross_revenue - return_value;
  const return_rate = influencerOrders.length > 0
    ? (return_count / influencerOrders.length) * 100
    : 0;
  const profit = net_revenue - influencer.monthly_cost_eur;
  const roi = influencer.monthly_cost_eur > 0
    ? (profit / influencer.monthly_cost_eur) * 100
    : 0;

  return {
    influencer,
    total_orders: influencerOrders.length,
    gross_revenue,
    return_count,
    return_value,
    net_revenue,
    return_rate,
    monthly_cost: influencer.monthly_cost_eur,
    profit,
    roi,
  };
}

export function computeDashboardSummary(stats: InfluencerStats[]): DashboardSummary {
  const total_gross_revenue = stats.reduce((s, x) => s + x.gross_revenue, 0);
  const total_net_revenue = stats.reduce((s, x) => s + x.net_revenue, 0);
  const total_profit = stats.reduce((s, x) => s + x.profit, 0);
  const total_orders = stats.reduce((s, x) => s + x.total_orders, 0);
  const avg_return_rate =
    stats.length > 0 ? stats.reduce((s, x) => s + x.return_rate, 0) / stats.length : 0;
  const best_performer = stats.reduce<InfluencerStats | null>(
    (best, x) => (best === null || x.roi > best.roi ? x : best),
    null
  );

  return {
    total_gross_revenue,
    total_net_revenue,
    total_profit,
    total_orders,
    avg_return_rate,
    best_performer,
  };
}
