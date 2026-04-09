export type Platform = "instagram" | "tiktok" | "youtube";
export type DateRange = "7d" | "30d" | "90d" | "all";

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  niche: string;
  discount_code: string;
  monthly_cost_eur: number;
  followers: number;
  campaign_name: string;
}

export interface Order {
  id: string;
  influencer_id: string;
  order_date: string;
  gross_value_eur: number;
  is_returned: boolean;
  return_value_eur: number;
  product_category: string;
  item_count: number;
}

export interface InfluencerStats {
  influencer: Influencer;
  total_orders: number;
  gross_revenue: number;
  return_count: number;
  return_value: number;
  net_revenue: number;
  return_rate: number;
  monthly_cost: number;
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
