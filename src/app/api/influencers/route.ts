import { NextRequest, NextResponse } from "next/server";
import { fetchInfluencers, fetchOrders, createInfluencer, invalidateInfluencersCache } from "@/lib/supabase";
import {
  computeInfluencerStats,
  computeDashboardSummary,
  computePeriodComparison,
  computeCampaignSummaries,
  filterOrdersByDateRange,
} from "@/lib/analytics";
import { DateRange, Influencer } from "@/lib/types";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<Influencer, "id">;

    if (!body.name || !body.handle || !body.discount_code || !body.platform) {
      return NextResponse.json({ error: "Pflichtfelder fehlen: name, handle, discount_code, platform" }, { status: 400 });
    }
    if (!body.compensation?.type) {
      return NextResponse.json({ error: "Vergütungsmodell fehlt" }, { status: 400 });
    }

    const influencer = await createInfluencer(body);
    invalidateInfluencersCache();
    return NextResponse.json({ influencer }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
