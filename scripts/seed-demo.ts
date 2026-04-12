/**
 * Demo-Seed: 30 Influencer + ~27.000 Orders → Supabase
 * Zeitraum: 2026-01-01 bis gestern
 * Ausführen: npx tsx scripts/seed-demo.ts
 *
 * WARNUNG: Löscht vorhandene orders + influencers und ersetzt sie komplett!
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local manuell laden (tsx hat kein auto-loading)
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch { /* .env.local optional */ }

import config from "./seed-extension-config.json";

// ─── Supabase ─────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ SUPABASE_URL oder KEY fehlt in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

// ─── Seed-RNG (deterministisch) ──────────────────────────────

let _seed = 42;
function srand(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}
function randInt(min: number, max: number): number {
  return Math.floor(srand() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number): number {
  return min + srand() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function weightedPick(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = srand() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

// ─── Datumshilfe ──────────────────────────────────────────────

const START = new Date("2026-01-01");
const NOW = new Date();
NOW.setDate(NOW.getDate() - 1); // gestern
const DAYS = Math.floor((NOW.getTime() - START.getTime()) / 86400000) + 1;

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ─── Stündliche Verteilung (realistisch: Peak Mittag+Abend) ──

const HOUR_WEIGHTS = [
  0.02, 0.01, 0.01, 0.01, 0.01, 0.02,  // 0–5
  0.03, 0.04, 0.05, 0.06, 0.07, 0.08,  // 6–11
  0.09, 0.08, 0.07, 0.06, 0.06, 0.05,  // 12–17
  0.04, 0.05, 0.06, 0.05, 0.04, 0.03,  // 18–23
];
// Nicht verwendet für Sortierung, aber könnte für Minute-Level verwendet werden

// ─── Compensation-Modelle generieren ─────────────────────────

type CompType = "fixed" | "commission" | "hybrid" | "per_post" | "barter";
const COMP_DISTRIBUTION: CompType[] = [
  "commission", "commission", "commission", "commission", "commission",
  "commission", "commission", "commission", "commission", "commission",
  "fixed", "fixed", "fixed", "fixed", "fixed",
  "hybrid", "hybrid", "hybrid", "hybrid",
  "per_post", "per_post", "per_post",
  "barter", "barter", "barter",
  "commission", "commission", "fixed", "hybrid",
];

function generateComp(idx: number): {
  type: CompType;
  interval?: string;
  fixed_eur?: number;
  commission_pct?: number;
  per_post_eur?: number;
  posts_count?: number;
} {
  const type = COMP_DISTRIBUTION[idx % COMP_DISTRIBUTION.length];
  switch (type) {
    case "fixed":
      return { type, interval: pick(["monthly", "biweekly"]), fixed_eur: randInt(5, 30) * 100 };
    case "commission":
      return { type, commission_pct: randInt(5, 15) };
    case "hybrid":
      return {
        type,
        interval: "monthly",
        fixed_eur: randInt(3, 15) * 100,
        commission_pct: randInt(3, 8),
      };
    case "per_post":
      return { type, per_post_eur: randInt(2, 10) * 50, posts_count: randInt(4, 12) };
    case "barter":
      return { type, fixed_eur: randInt(1, 8) * 100 };
  }
}

// ─── DACH-Namen für Handles ──────────────────────────────────

const HANDLE_PREFIXES_IG = ["style.", "beauty.", "daily.", "the.", "its.", "by.", "x.", ""];
const HANDLE_PREFIXES_TT = ["", "", "its", "real", "the", ""];
const HANDLE_PREFIXES_YT = ["", "", "", ""];

function generateHandle(name: string, platform: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (platform === "instagram") {
    return "@" + pick(HANDLE_PREFIXES_IG) + base;
  }
  if (platform === "tiktok") {
    return "@" + pick(HANDLE_PREFIXES_TT) + base;
  }
  return "@" + base;
}

// ─── Campaign-Namen ──────────────────────────────────────────

const CAMPAIGNS = [
  "Spring 2026", "DACH Q1", "Summer Drop", "Evergreen", "Brand Awareness",
  "New Collection", "Holiday Push", "Relaunch", "Collab 2026", "Lifestyle Push",
];

// ─── Tags ────────────────────────────────────────────────────

function generateTags(idx: number, ordersPerDay: number, refundRate: number): string[] {
  const tags: string[] = [];
  if (ordersPerDay >= 12) tags.push("VIP");
  if (ordersPerDay >= 10) tags.push("Top Performer");
  if (refundRate >= 0.28) tags.push("Risiko");
  if (idx < 3) tags.push("Langzeit-Partner");
  if (idx >= 27) tags.push("Neu");
  return tags;
}

// ─── Influencer-Rows generieren ──────────────────────────────

interface InfRow {
  id: string;
  name: string;
  handle: string;
  platform: string;
  niche: string;
  discount_code: string;
  followers: number;
  campaign_name: string;
  is_active: boolean;
  contract_start_date: string;
  comp_type: string;
  comp_interval: string | null;
  comp_fixed_eur: number | null;
  comp_commission_pct: number | null;
  comp_per_post_eur: number | null;
  comp_posts_count: number | null;
  comp_start_date: string | null;
  tags: string[];
}

const influencerRows: InfRow[] = config.influencers.map((inf, idx) => {
  const comp = generateComp(idx);
  const primaryNiche = Object.entries(inf.niches).sort((a, b) => b[1] - a[1])[0][0];
  const followersBase: Record<string, [number, number]> = {
    instagram: [50_000, 800_000],
    tiktok:    [80_000, 1_500_000],
    youtube:   [30_000, 500_000],
  };
  const [fMin, fMax] = followersBase[inf.platform] ?? [10_000, 200_000];

  return {
    id:                   `inf_demo_${String(idx + 1).padStart(3, "0")}`,
    name:                 inf.name,
    handle:               generateHandle(inf.name, inf.platform),
    platform:             inf.platform,
    niche:                primaryNiche,
    discount_code:        inf.code,
    followers:            randInt(fMin, fMax),
    campaign_name:        pick(CAMPAIGNS),
    is_active:            idx < 27,  // letzte 3 inaktiv
    contract_start_date:  dateStr(addDays(START, -randInt(30, 365))),
    comp_type:            comp.type,
    comp_interval:        comp.interval ?? null,
    comp_fixed_eur:       comp.fixed_eur ?? null,
    comp_commission_pct:  comp.commission_pct ?? null,
    comp_per_post_eur:    comp.per_post_eur ?? null,
    comp_posts_count:     comp.posts_count ?? null,
    comp_start_date:      dateStr(START),
    tags:                 generateTags(idx, inf.orders_per_day, inf.refund_rate),
  };
});

// ─── Orders generieren ───────────────────────────────────────

interface OrdRow {
  id: string;
  influencer_id: string;
  order_date: string;
  gross_value_eur: number;
  return_type: string;
  return_value_eur: number;
  product_category: string;
  item_count: number;
  order_source: string;
  return_date: string | null;
  customer_id: string | null;
}

const PRODUCT_CATEGORIES = ["Fashion", "Beauty", "Fitness", "Food", "Tech", "Gaming", "Lifestyle"];

const orderRows: OrdRow[] = [];
let orderId = 1;

for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
  const date = addDays(START, dayOffset);
  const dayStr = dateStr(date);
  const dow = date.getDay(); // 0=So, 6=Sa
  // Wochenende: 30% weniger Orders
  const weekendFactor = (dow === 0 || dow === 6) ? 0.7 : 1.0;

  for (const [idx, infCfg] of config.influencers.entries()) {
    const inf = influencerRows[idx];
    if (!inf.is_active && dayOffset > DAYS * 0.8) continue; // inaktive stoppen nach 80%

    // Orders pro Tag mit Jitter
    const baseRate = infCfg.orders_per_day * weekendFactor;
    const todayOrders = Math.round(baseRate + randFloat(-baseRate * 0.3, baseRate * 0.3));

    for (let o = 0; o < Math.max(0, todayOrders); o++) {
      const oid = `ord_demo_${String(orderId++).padStart(6, "0")}`;

      // Nische-gewichtete Kategorie
      const category = weightedPick(infCfg.niches as Record<string, number>);

      // Bestellwert: avg ± 40%
      const grossRaw = infCfg.avg_order_eur * randFloat(0.6, 1.4);
      const gross = Math.round(grossRaw * 100) / 100;

      // item_count: korreliert mit Wert
      const items = gross > 400 ? randInt(1, 3) : gross > 150 ? randInt(1, 4) : randInt(1, 6);

      // order_source: meta_ads mit Overlap-Rate (± 10% Schwankung)
      const effectiveOverlap = Math.max(0, Math.min(0.5,
        infCfg.meta_overlap_rate + randFloat(-0.10, 0.10)
      ));
      const source: string = srand() < effectiveOverlap ? "meta_ads" : "influencer";

      // Retoure
      let returnType = "none";
      let returnValue = 0;
      let returnDate: string | null = null;
      const effectiveRefund = Math.max(0, Math.min(0.5,
        infCfg.refund_rate + randFloat(-0.08, 0.08)
      ));

      if (srand() < effectiveRefund && dayOffset < DAYS - 10) {
        // Retoure erst nach 3–14 Tagen
        const retDelay = randInt(3, 14);
        const retDate = addDays(date, retDelay);
        if (retDate <= NOW) {
          returnDate = dateStr(retDate);
          if (srand() < 0.6) {
            returnType = "full";
            returnValue = gross;
          } else {
            returnType = "partial";
            returnValue = Math.round(gross * randFloat(0.3, 0.7) * 100) / 100;
          }
        }
      }

      // customer_id: wiederkehrende Kunden (20% Chance gleiche ID wie vorher)
      const custId = `cust_${randInt(1, Math.round(orderId * 0.8))}`;

      orderRows.push({
        id: oid,
        influencer_id: inf.id,
        order_date: dayStr,
        gross_value_eur: gross,
        return_type: returnType,
        return_value_eur: returnValue,
        product_category: category,
        item_count: items,
        order_source: source,
        return_date: returnDate,
        customer_id: custId,
      });
    }
  }
}

// ─── Statistik ───────────────────────────────────────────────

const totalGross = orderRows.reduce((s, o) => s + o.gross_value_eur, 0);
const totalReturns = orderRows.filter((o) => o.return_type !== "none").length;
const totalMeta = orderRows.filter((o) => o.order_source === "meta_ads").length;

console.log(`\n📊 Seed-Statistik:`);
console.log(`   ${influencerRows.length} Influencer (${influencerRows.filter(i => i.is_active).length} aktiv)`);
console.log(`   ${orderRows.length.toLocaleString("de-DE")} Orders über ${DAYS} Tage`);
console.log(`   ${(orderRows.length / DAYS).toFixed(0)} Orders/Tag Ø`);
console.log(`   ${(totalGross / 1_000_000).toFixed(2)}M € Brutto-Gesamtumsatz`);
console.log(`   ${totalReturns} Retouren (${((totalReturns / orderRows.length) * 100).toFixed(1)}%)`);
console.log(`   ${totalMeta} Meta-Ads Overlap (${((totalMeta / orderRows.length) * 100).toFixed(1)}%)`);
console.log();

// ─── In Supabase schreiben ───────────────────────────────────

async function seed() {
  // 1) Alte Daten löschen
  console.log("🗑️  Alte Orders löschen...");
  const { error: delOrd } = await supabase.from("orders").delete().neq("id", "___never___");
  if (delOrd) { console.error("❌", delOrd.message); process.exit(1); }

  console.log("🗑️  Alte Influencer löschen...");
  const { error: delInf } = await supabase.from("influencers").delete().neq("id", "___never___");
  if (delInf) { console.error("❌", delInf.message); process.exit(1); }

  // 2) Influencer einspielen
  console.log(`→ ${influencerRows.length} Influencer einspielen...`);
  const { error: infErr } = await supabase.from("influencers").insert(influencerRows);
  if (infErr) { console.error("❌", infErr.message); process.exit(1); }
  console.log(`✓ ${influencerRows.length} Influencer`);

  // 3) Orders in Batches (Supabase max ~1000 pro Request)
  const BATCH = 500;
  console.log(`→ ${orderRows.length.toLocaleString("de-DE")} Orders einspielen (Batch ${BATCH})...`);

  for (let i = 0; i < orderRows.length; i += BATCH) {
    const batch = orderRows.slice(i, i + BATCH);
    const { error: ordErr } = await supabase.from("orders").insert(batch);
    if (ordErr) {
      console.error(`❌ Batch ${i}–${i + BATCH}:`, ordErr.message);
      process.exit(1);
    }
    if ((i / BATCH) % 10 === 0 || i + BATCH >= orderRows.length) {
      const pct = Math.min(100, Math.round(((i + BATCH) / orderRows.length) * 100));
      console.log(`  ✓ ${Math.min(i + BATCH, orderRows.length).toLocaleString("de-DE")} / ${orderRows.length.toLocaleString("de-DE")} (${pct}%)`);
    }
  }

  console.log(`\n✅ Seed abgeschlossen!`);
}

seed().catch((e) => {
  console.error("❌ Unerwarteter Fehler:", e);
  process.exit(1);
});
