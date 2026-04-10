/**
 * Seed-Script: Mock-Daten → Supabase
 * Ausführen: npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { INFLUENCERS, ORDERS } from "../src/lib/mockData";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ .env.local fehlt oder SUPABASE_URL / SUPABASE_ANON_KEY nicht gesetzt");
  process.exit(1);
}

const supabase = createClient(url, key);

// ─── Influencers mappen ────────────────────────────────────

const influencerRows = INFLUENCERS.map((inf) => ({
  id:                   inf.id,
  name:                 inf.name,
  handle:               inf.handle,
  platform:             inf.platform,
  niche:                inf.niche,
  discount_code:        inf.discount_code,
  followers:            inf.followers,
  campaign_name:        inf.campaign_name,
  is_active:            inf.is_active,
  contract_start_date:  inf.contract_start_date ?? null,
  comp_type:            inf.compensation.type,
  comp_interval:        inf.compensation.interval ?? null,
  comp_fixed_eur:       inf.compensation.fixed_eur ?? null,
  comp_commission_pct:  inf.compensation.commission_pct ?? null,
  comp_per_post_eur:    inf.compensation.per_post_eur ?? null,
  comp_posts_count:     inf.compensation.posts_count ?? null,
  comp_start_date:      inf.compensation.start_date ?? null,
}));

// ─── Orders mappen ────────────────────────────────────────

const orderRows = ORDERS.map((o) => ({
  id:               o.id,
  influencer_id:    o.influencer_id,
  order_date:       o.order_date,
  gross_value_eur:  o.gross_value_eur,
  return_type:      o.return_type,
  return_value_eur: o.return_value_eur,
  product_category: o.product_category,
  item_count:       o.item_count,
  order_source:     o.order_source,
  shopify_order_id: o.shopify_order_id ?? null,
  customer_id:      o.customer_id ?? null,
  return_date:      o.return_date ?? null,
}));

// ─── Einspielen ──────────────────────────────────────────

async function seed() {
  console.log("🌱 Starte Seed...\n");

  // Reihenfolge: erst influencers (FK-Abhängigkeit)
  console.log(`→ ${influencerRows.length} Influencer einspielen...`);
  const { error: infErr } = await supabase
    .from("influencers")
    .upsert(influencerRows, { onConflict: "id" });

  if (infErr) {
    console.error("❌ Influencer-Fehler:", infErr.message);
    process.exit(1);
  }
  console.log(`✓ ${influencerRows.length} Influencer eingespielt`);

  // Orders in Batches (Supabase hat 1MB Limit pro Request)
  const BATCH = 50;
  console.log(`→ ${orderRows.length} Orders einspielen (Batch-Größe: ${BATCH})...`);

  for (let i = 0; i < orderRows.length; i += BATCH) {
    const batch = orderRows.slice(i, i + BATCH);
    const { error: ordErr } = await supabase
      .from("orders")
      .upsert(batch, { onConflict: "id" });

    if (ordErr) {
      console.error(`❌ Orders Batch ${i}–${i + BATCH} Fehler:`, ordErr.message);
      process.exit(1);
    }
    console.log(`  ✓ Batch ${i + 1}–${Math.min(i + BATCH, orderRows.length)}`);
  }

  console.log(`\n✅ Seed abgeschlossen — ${influencerRows.length} Influencer, ${orderRows.length} Orders`);
}

seed().catch((e) => {
  console.error("❌ Unerwarteter Fehler:", e);
  process.exit(1);
});
