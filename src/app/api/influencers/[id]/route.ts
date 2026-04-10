import { NextRequest, NextResponse } from "next/server";
import { fetchInfluencers, fetchOrders, setInfluencerActive, updateInfluencer } from "@/lib/supabase";
import { Influencer } from "@/lib/types";
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { is_active?: boolean };

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active (boolean) fehlt" }, { status: 400 });
  }

  try {
    await setInfluencerActive(id, body.is_active);
    return NextResponse.json({ success: true, influencer_id: id, is_active: body.is_active });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as Omit<Influencer, "id">;

  if (!body.name || !body.handle || !body.discount_code || !body.platform) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  try {
    await updateInfluencer(id, body);
    return NextResponse.json({ success: true, influencer_id: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
