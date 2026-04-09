import { NextResponse } from "next/server";
import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import { computeInfluencerStats, computeDashboardSummary } from "@/lib/analytics";

export async function GET() {
  try {
    const [influencers, orders] = await Promise.all([fetchInfluencers(), fetchOrders()]);
    const stats = influencers.map((inf) => computeInfluencerStats(inf, orders));
    const summary = computeDashboardSummary(stats);
    return NextResponse.json({ stats, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
