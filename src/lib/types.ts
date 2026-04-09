export type Platform = "instagram" | "tiktok" | "youtube";
export type DateRange = "7d" | "30d" | "90d" | "all";
export type OrderSource = "influencer" | "meta_ads" | "organic";
export type ReturnType = "none" | "full" | "partial";

// ─── Compensation Models ───────────────────────────────────────────────────

export type CompensationType = "fixed" | "commission" | "hybrid" | "per_post" | "barter";
export type PaymentInterval = "monthly" | "weekly" | "biweekly";

export interface Compensation {
  type: CompensationType;
  interval?: PaymentInterval;    // for: fixed, hybrid
  fixed_eur?: number;            // for: fixed, hybrid, barter (product value)
  commission_pct?: number;       // for: commission, hybrid (0–100)
  per_post_eur?: number;         // for: per_post
  posts_count?: number;          // for: per_post (posts delivered in period)
}

// ─── Core entities ─────────────────────────────────────────────────────────

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  niche: string;
  discount_code: string;
  followers: number;
  campaign_name: string;
  compensation: Compensation;
}

export interface Order {
  id: string;
  influencer_id: string;
  order_date: string;
  gross_value_eur: number;
  return_type: ReturnType;
  return_value_eur: number;   // 0 for "none", full gross for "full", partial amount for "partial"
  product_category: string;
  item_count: number;
  order_source: OrderSource;
}

export interface InfluencerStats {
  influencer: Influencer;
  total_orders: number;
  gross_revenue: number;
  return_count: number;
  full_return_count: number;
  partial_return_count: number;
  return_value: number;
  net_revenue: number;
  return_rate: number;
  actual_cost: number;           // computed from compensation model
  profit: number;
  roi: number;
  aov: number;
  cost_per_order: number;
  revenue_per_follower: number;
}

export interface DashboardSummary {
  total_gross_revenue: number;
  total_net_revenue: number;
  total_profit: number;
  total_orders: number;
  avg_return_rate: number;
  best_performer: InfluencerStats | null;
  avg_aov: number;
}

export interface PeriodComparison {
  current: DashboardSummary;
  previous: DashboardSummary;
  changes: {
    revenue_change_pct: number;
    orders_change_pct: number;
    profit_change_pct: number;
    return_rate_change: number;
  };
}

export interface DailyRevenue {
  date: string;
  gross: number;
  net: number;
  orders: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  orders: number;
  return_rate: number;
}

export interface CampaignSummary {
  campaign_name: string;
  influencers: InfluencerStats[];
  total_revenue: number;
  total_profit: number;
  avg_roi: number;
}
