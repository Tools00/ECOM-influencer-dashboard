export type Platform = "instagram" | "tiktok" | "youtube";

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  niche: string;
  discount_code: string;
  monthly_cost_eur: number;
  followers: number;
}

export interface Order {
  id: string;
  influencer_id: string;
  order_date: string; // ISO date string
  gross_value_eur: number;
  is_returned: boolean;
  return_value_eur: number;
  product_category: string;
}

export interface InfluencerStats {
  influencer: Influencer;
  total_orders: number;
  gross_revenue: number;
  return_count: number;
  return_value: number;
  net_revenue: number;
  return_rate: number; // 0–100
  monthly_cost: number;
  profit: number; // net_revenue - monthly_cost
  roi: number; // (profit / monthly_cost) * 100
}

export interface DashboardSummary {
  total_gross_revenue: number;
  total_net_revenue: number;
  total_profit: number;
  total_orders: number;
  avg_return_rate: number;
  best_performer: InfluencerStats | null;
}
