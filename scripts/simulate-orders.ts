#!/usr/bin/env npx tsx
/**
 * API Order Simulator (Option B).
 *
 * Erstellt realistische Orders im Shopify Dev Store via Admin API.
 * Triggert echte Webhooks → Supabase → Live-Dashboard.
 *
 * Nutzung:
 *   npx tsx scripts/simulate-orders.ts                          # 10 Orders sofort
 *   npx tsx scripts/simulate-orders.ts --count 50               # 50 Orders sofort
 *   npx tsx scripts/simulate-orders.ts --count 50 --spread 120  # 50 Orders über 120 Min verteilt
 *   npx tsx scripts/simulate-orders.ts --dry-run                # nur loggen
 *   npx tsx scripts/simulate-orders.ts --count 50 --lifecycle   # mit refunds/fulfills
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ─── .env.local laden ────────────────────────────────────────
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
} catch { /* ok */ }

import { createShopifyClient } from "../src/simulator/shopifyApi";
import { loadSimConfig } from "../src/simulator/config";
import { simulateCreateOrder, simulateFulfill, simulateRefund } from "../src/simulator/index";

// ─── CLI Args ────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): boolean {
  return args.includes(`--${name}`);
}
function opt(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1]! : fallback;
}

const DRY_RUN = flag("dry-run");
const COUNT = parseInt(opt("count", "10"), 10);
const SPREAD_MINUTES = parseInt(opt("spread", "0"), 10);
const WITH_LIFECYCLE = flag("refund") || flag("lifecycle");

// ─── RNG (seedable) ──────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(Date.now());

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
  const STORE = process.env.SHOPIFY_STORE ?? "ecom-dach-test";

  if (!TOKEN) {
    console.error("❌ SHOPIFY_ADMIN_TOKEN fehlt in .env.local");
    process.exit(1);
  }

  const client = createShopifyClient(STORE, TOKEN);
  const config = loadSimConfig();

  console.log("🚀 API Order Simulator");
  console.log(`   Store: ${STORE}.myshopify.com`);
  console.log(`   Influencer: ${config.influencers.length}`);
  console.log(`   Orders: ${COUNT}`);
  console.log(`   Dry Run: ${DRY_RUN}`);
  console.log(`   Spread: ${SPREAD_MINUTES > 0 ? `${SPREAD_MINUTES} Min (~${Math.round(SPREAD_MINUTES * 60 / COUNT)}s zwischen Orders)` : "sofort"}`);
  console.log(`   Lifecycle (refund/fulfill): ${WITH_LIFECYCLE}`);
  console.log();

  // 1) Produkte laden
  console.log("📦 Lade Produkte...");
  const products = await client.listProducts();
  console.log(`   ${products.length} Produkte geladen\n`);

  if (products.length === 0) {
    console.error("❌ Keine Produkte im Store. Erst setup-shopify-store.ts ausführen.");
    process.exit(1);
  }

  // 2) Orders erstellen
  // Spread: Basisintervall + ±30% Jitter für realistische Verteilung
  const baseDelayMs = SPREAD_MINUTES > 0 ? (SPREAD_MINUTES * 60 * 1000) / COUNT : 0;

  const startTime = Date.now();
  const endTimeStr = SPREAD_MINUTES > 0
    ? new Date(startTime + SPREAD_MINUTES * 60 * 1000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "";

  console.log(`🛒 Erstelle Orders...${endTimeStr ? ` (bis ca. ${endTimeStr})` : ""}\n`);
  const createdOrderIds: number[] = [];
  let errors = 0;

  for (let i = 1; i <= COUNT; i++) {
    try {
      const result = await simulateCreateOrder(client, config, products, rng, DRY_RUN);
      const now = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      console.log(`  [${now}] [${i}/${COUNT}] ${result.code} — ${result.detail}`);

      // ID aus Detail extrahieren für Lifecycle-Aktionen
      if (!DRY_RUN) {
        const idMatch = result.detail.match(/ID: (\d+)/);
        if (idMatch) createdOrderIds.push(parseInt(idMatch[1], 10));
      }
    } catch (err) {
      errors++;
      console.error(`  [${i}/${COUNT}] ❌ ${(err as Error).message.slice(0, 120)}`);
    }

    // Warten vor der nächsten Order (nicht nach der letzten)
    if (baseDelayMs > 0 && i < COUNT) {
      const jitter = 1 + (rng() - 0.5) * 0.6; // ±30%
      const waitMs = Math.round(baseDelayMs * jitter);
      const waitSec = Math.round(waitMs / 1000);
      console.log(`  ⏳ Nächste Order in ${waitSec}s...`);
      await sleep(waitMs);
    }
  }

  console.log(`\n✓ ${COUNT - errors} Orders erstellt, ${errors} Fehler\n`);

  // 3) Lifecycle-Aktionen (optional)
  if (WITH_LIFECYCLE && createdOrderIds.length >= 3) {
    console.log("📦 Fulfillments + Refunds...\n");

    // ~60% fulfill
    const fulfillCount = Math.floor(createdOrderIds.length * 0.6);
    for (let i = 0; i < fulfillCount; i++) {
      const orderId = createdOrderIds[i]!;
      try {
        // Kleine Pause damit Shopify die Order verarbeitet
        await sleep(1500);
        const result = await simulateFulfill(client, orderId, DRY_RUN);
        console.log(`  📦 ${result.detail}`);
      } catch (err) {
        console.error(`  ❌ Fulfill ${orderId}: ${(err as Error).message.slice(0, 100)}`);
      }
    }

    // ~15% refund (aus fulfilled)
    const refundCount = Math.max(1, Math.floor(createdOrderIds.length * 0.15));
    for (let i = 0; i < refundCount; i++) {
      const orderId = createdOrderIds[i]!;
      const fullRefund = rng() < 0.6;
      try {
        await sleep(1500);
        const result = await simulateRefund(client, orderId, fullRefund, DRY_RUN);
        console.log(`  ↩️  ${result.detail}`);
      } catch (err) {
        console.error(`  ❌ Refund ${orderId}: ${(err as Error).message.slice(0, 100)}`);
      }
    }

    console.log();
  }

  // 4) Summary
  const totalOrders = DRY_RUN ? 0 : await client.getOrderCount().catch(() => 0);
  console.log("✅ Simulation abgeschlossen!");
  console.log(`   ${COUNT - errors} neue Orders`);
  if (totalOrders > 0) console.log(`   ${totalOrders} Orders insgesamt im Store`);
  console.log(`   Store: https://admin.shopify.com/store/${STORE}/orders`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("❌ Fehler:", e);
  process.exit(1);
});
