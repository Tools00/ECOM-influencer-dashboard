import { NextRequest, NextResponse } from "next/server";
import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import {
  computeInfluencerStats,
  computeDailyRevenue,
  computeCategoryRevenue,
  computeSparklineData,
} from "@/lib/analytics";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const influencer = influencers.find((i) => i.id === id);
  if (!influencer) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }

  const infOrders = orders.filter((o) => o.influencer_id === id);
  const stats = computeInfluencerStats(influencer, orders);
  const daily = computeDailyRevenue(infOrders);
  const categories = computeCategoryRevenue(infOrders);
  const sparkline = computeSparklineData(orders, id, 30);

  return NextResponse.json({
    stats,
    orders: infOrders,
    daily,
    categories,
    sparkline,
  });
}
