import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  verifyShopifyHmac,
  parseReturnType,
  parseCategory,
  parseItemCount,
  computeRefundAmount,
  ShopifyOrder,
  ShopifyRefund,
} from "@/lib/shopifyWebhook";

// ─── POST /api/shopify/webhook ─────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── HMAC-Verification ──
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";

  if (secret && !verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") ?? "";

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (topic) {
      case "orders/create":
      case "orders/updated":
        await handleOrderUpsert(supabase, payload as ShopifyOrder);
        break;

      case "refunds/create":
        await handleRefundCreate(supabase, payload as ShopifyRefund);
        break;

      default:
        // Unbekanntes Topic — Shopify erwartet 200 zurück
        return NextResponse.json({ ok: true, skipped: topic });
    }

    return NextResponse.json({ ok: true, topic });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error(`[shopify/webhook] ${topic}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── orders/create + orders/updated ───────────────────────

async function handleOrderUpsert(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ShopifyOrder
) {
  const shopifyOrderId = String(order.id);

  // Influencer über Discount Code ermitteln
  const discountCode = order.discount_codes?.[0]?.code ?? null;
  let influencer_id: string | null = null;
  let order_source: "influencer" | "meta_ads" | "organic" = "organic";

  if (discountCode) {
    const { data } = await supabase
      .from("influencers")
      .select("id")
      .ilike("discount_code", discountCode)
      .maybeSingle();

    if (data) {
      influencer_id = data.id;
      order_source = "influencer";
    } else {
      // Discount Code existiert, aber kein Influencer-Match → Meta Ads
      order_source = "meta_ads";
    }
  }

  if (!influencer_id) {
    // Ohne Influencer-Zuordnung kein Eintrag möglich
    console.log(
      `[shopify/webhook] Order ${shopifyOrderId} übersprungen — kein Influencer-Match (source: ${order_source})`
    );
    return;
  }

  const grossValue = parseFloat(order.total_price);

  // financial_status hat Vorrang vor Tags (wird von Shopify bei Refunds automatisch gesetzt)
  let return_type: "none" | "full" | "partial";
  let return_date: string | null = null;
  if (order.financial_status === "refunded") {
    return_type = "full";
    return_date = new Date().toISOString().slice(0, 10);
  } else if (order.financial_status === "partially_refunded") {
    return_type = "partial";
    return_date = new Date().toISOString().slice(0, 10);
  } else {
    ({ return_type, return_date } = parseReturnType(order.tags ?? ""));
  }

  // return_value_eur bei Vollretoure = grossValue; Teilretoure wird über refunds/create befüllt
  const returnValue = return_type === "full" ? grossValue : 0;

  const orderRow = {
    influencer_id,
    order_date: order.created_at.slice(0, 10),
    gross_value_eur: grossValue,
    return_type,
    return_value_eur: returnValue,
    product_category: parseCategory(order.line_items ?? []),
    item_count: parseItemCount(order.line_items ?? []),
    order_source,
    shopify_order_id: shopifyOrderId,
    customer_id: order.customer?.id ? String(order.customer.id) : null,
    return_date,
  };

  // Prüfen ob Order bereits existiert (für upsert ohne UUID-Kollision)
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("shopify_order_id", shopifyOrderId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("orders")
      .update(orderRow)
      .eq("shopify_order_id", shopifyOrderId);
  } else {
    await supabase
      .from("orders")
      .insert({ id: crypto.randomUUID(), ...orderRow });
  }
}

// ─── refunds/create ────────────────────────────────────────

async function handleRefundCreate(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  refund: ShopifyRefund
) {
  const shopifyOrderId = String(refund.order_id);
  const refundAmount = computeRefundAmount(refund);
  const refundDate = refund.created_at.slice(0, 10);

  console.log(
    `[shopify/webhook] refunds/create — order ${shopifyOrderId}, refund_line_items: ${refund.refund_line_items?.length ?? 0}, computed amount: ${refundAmount}`
  );

  const { data: existing } = await supabase
    .from("orders")
    .select("id, gross_value_eur, return_value_eur")
    .eq("shopify_order_id", shopifyOrderId)
    .maybeSingle();

  if (!existing) {
    console.log(
      `[shopify/webhook] Refund für unbekannte Order ${shopifyOrderId} übersprungen`
    );
    return;
  }

  // Fallback: wenn refund_line_items leer → Shopify Admin-Refund ohne Line Items → als Vollretoure werten
  const totalRefund = refundAmount > 0
    ? (existing.return_value_eur ?? 0) + refundAmount
    : existing.gross_value_eur;

  const isFullReturn = totalRefund >= existing.gross_value_eur * 0.95;

  const { error } = await supabase
    .from("orders")
    .update({
      return_type: isFullReturn ? "full" : "partial",
      return_value_eur: Math.min(totalRefund, existing.gross_value_eur),
      return_date: refundDate,
    })
    .eq("shopify_order_id", shopifyOrderId);

  console.log(
    `[shopify/webhook] Refund update — order ${shopifyOrderId}: return_type=${isFullReturn ? "full" : "partial"}, amount=${Math.min(totalRefund, existing.gross_value_eur)}, error=${error?.message ?? "none"}`
  );
}
