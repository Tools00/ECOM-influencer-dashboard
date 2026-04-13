import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/orders/recent
 * Liefert die 20 neuesten Orders mit Influencer-Info — ohne Cache.
 * Wird vom LiveOrdersFeed alle 15s gepollt.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "DB nicht konfiguriert" }, { status: 500 });
  }

  const supabase = createClient(url, key);

  // Neueste Orders direkt aus DB (kein Cache)
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("id, influencer_id, order_date, gross_value_eur, return_type, product_category, order_source, shopify_order_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (ordersErr) {
    return NextResponse.json({ error: ordersErr.message }, { status: 500 });
  }

  // Influencer-Namen für die Order-IDs holen
  const infIds = [...new Set((orders ?? []).map((o) => o.influencer_id))];
  const { data: influencers } = await supabase
    .from("influencers")
    .select("id, name, handle, platform")
    .in("id", infIds);

  const infMap = new Map((influencers ?? []).map((i) => [i.id, i]));

  const enriched = (orders ?? []).map((o) => ({
    id: o.id,
    order_date: o.order_date,
    gross_value_eur: o.gross_value_eur,
    return_type: o.return_type,
    product_category: o.product_category,
    order_source: o.order_source,
    shopify_order_id: o.shopify_order_id,
    influencer: infMap.get(o.influencer_id) ?? null,
  }));

  return NextResponse.json({ orders: enriched, ts: Date.now() });
}
