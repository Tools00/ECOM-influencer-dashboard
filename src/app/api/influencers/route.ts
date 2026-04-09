import { NextRequest, NextResponse } from "next/server";
import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import {
  computeInfluencerStats,
  computeDashboardSummary,
  computePeriodComparison,
  computeCampaignSummaries,
  filterOrdersByDateRange,
} from "@/lib/analytics";
import { DateRange } from "@/lib/types";

function isValidRange(v: unknown): v is DateRange {
  return v === "7d" || v === "30d" || v === "90d" || v === "all";
}

export async function GET(req: NextRequest) {
  try {
    const range: DateRange = isValidRange(req.nextUrl.searchParams.get("range"))
      ? (req.nextUrl.searchParams.get("range") as DateRange)
      : "30d";

    const [influencers, allOrders] = await Promise.all([fetchInfluencers(), fetchOrders()]);
    const filteredOrders = filterOrdersByDateRange(allOrders, range);
    const stats = influencers.map((inf) => computeInfluencerStats(inf, filteredOrders));
    const summary = computeDashboardSummary(stats);
    const comparison = computePeriodComparison(influencers, allOrders, range);
    const campaigns = computeCampaignSummaries(stats);

    return NextResponse.json({ stats, summary, comparison, campaigns, range });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
