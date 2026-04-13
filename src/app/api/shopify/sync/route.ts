import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, invalidateOrdersCache } from "@/lib/supabase";
import {
  parseReturnType,
  parseCategory,
  parseItemCount,
  parseOrderSource,
  ShopifyOrder,
} from "@/lib/shopifyWebhook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/shopify/sync
 * Sync-Fallback: Holt alle neuen Shopify-Orders die noch nicht in Supabase sind.
 * Wird vom LiveOrdersFeed als Fallback aufgerufen oder manuell getriggert.
 *
 * Query-Params:
 *   ?secret=<SYNC_SECRET> — einfacher Auth-Schutz
 */
export async function GET(req: NextRequest) {
  // Auth: einfacher Secret-Check (optional in dev)
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SHOPIFY_SYNC_SECRET ?? "";

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN;
  const shopifyStore = process.env.SHOPIFY_STORE ?? "ecom-dach-test";

  if (!shopifyToken) {
    return NextResponse.json({ error: "SHOPIFY_ADMIN_TOKEN fehlt" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();

  // Höchste Shopify-Order-ID in Supabase finden
  const { data: latest } = await supabase
    .from("orders")
    .select("shopify_order_id")
    .not("shopify_order_id", "is", null)
    .order("shopify_order_id", { ascending: false })
    .limit(1)
    .single();

  const sinceId = latest?.shopify_order_id ?? "0";

  // Neue Orders von Shopify holen
  const shopifyUrl = `https://${shopifyStore}.myshopify.com/admin/api/2024-01/orders.json?limit=250&status=any&since_id=${sinceId}&fields=id,name,created_at,total_price,financial_status,discount_codes,tags,line_items,customer,source_name,referring_site`;

  const res = await fetch(shopifyUrl, {
    headers: { "X-Shopify-Access-Token": shopifyToken },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Shopify API: ${res.status}` }, { status: 502 });
  }

  const { orders: shopifyOrders } = (await res.json()) as { orders: ShopifyOrder[] };

  if (shopifyOrders.length === 0) {
    return NextResponse.json({ synced: 0, message: "Alles aktuell" });
  }

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const order of shopifyOrders) {
    const shopifyOrderId = String(order.id);

    // Influencer über Discount Code ermitteln
    const discountCode = order.discount_codes?.[0]?.code ?? null;
    let influencer_id: string | null = null;
    let order_source: "influencer" | "meta_ads" = "influencer";

    if (discountCode) {
      const { data } = await supabase
        .from("influencers")
        .select("id")
        .ilike("discount_code", discountCode)
        .maybeSingle();

      if (data) {
        influencer_id = data.id;
        order_source = parseOrderSource(order);
      }
    }

    if (!influencer_id) {
      skipped++;
      continue;
    }

    const grossValue = parseFloat(order.total_price);

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

    const returnValue = return_type === "full" ? grossValue : 0;

    const orderRow = {
      influencer_id,
      order_date: order.created_at.slice(0, 10),
      gross_value_eur: grossValue,
      return_type,
      return_value_eur: returnValue,
      product_category: parseCategory(order.line_items ?? [], order.tags),
      item_count: parseItemCount(order.line_items ?? []),
      order_source,
      shopify_order_id: shopifyOrderId,
      customer_id: order.customer?.id ? String(order.customer.id) : null,
      return_date,
    };

    // Check-then-insert (skip if already exists)
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("shopify_order_id", shopifyOrderId)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("orders")
      .insert({ id: crypto.randomUUID(), ...orderRow });

    if (error) {
      errors++;
    } else {
      synced++;
    }
  }

  if (synced > 0) {
    invalidateOrdersCache();
  }

  return NextResponse.json({
    synced,
    skipped,
    errors,
    total_checked: shopifyOrders.length,
  });
}
