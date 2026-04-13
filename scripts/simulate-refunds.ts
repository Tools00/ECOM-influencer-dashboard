#!/usr/bin/env npx tsx
/**
 * Refund-Simulator: Erstellt realistische Retouren auf bestehende Shopify-Orders.
 *
 * Nutzung:
 *   npx tsx scripts/simulate-refunds.ts                     # 10 Refunds
 *   npx tsx scripts/simulate-refunds.ts --count 20          # 20 Refunds
 *   npx tsx scripts/simulate-refunds.ts --spread 120        # über 2h verteilt
 *   npx tsx scripts/simulate-refunds.ts --dry-run           # nur loggen
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

// ─── CLI Args ────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name: string): boolean { return args.includes(`--${name}`); }
function opt(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1]! : fallback;
}

const DRY_RUN = flag("dry-run");
const COUNT = parseInt(opt("count", "10"), 10);
const SPREAD_MINUTES = parseInt(opt("spread", "0"), 10);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── RNG ─────────────────────────────────────────────────────
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

  console.log("↩️  Refund-Simulator");
  console.log(`   Store: ${STORE}.myshopify.com`);
  console.log(`   Refunds: ${COUNT}`);
  console.log(`   Dry Run: ${DRY_RUN}`);
  console.log(`   Spread: ${SPREAD_MINUTES > 0 ? `${SPREAD_MINUTES} Min` : "sofort"}`);
  console.log();

  // Alle Orders laden (die noch nicht refunded sind)
  console.log("📦 Lade Orders...");
  const res = await fetch(
    `https://${STORE}.myshopify.com/admin/api/2024-01/orders.json?limit=250&status=any&financial_status=paid&fields=id,name,total_price,tags`,
    { headers: { "X-Shopify-Access-Token": TOKEN } }
  );
  const { orders } = await res.json() as { orders: { id: number; name: string; total_price: string; tags: string }[] };

  // Nur Simulator-Orders (mit sim:api Tag)
  const simOrders = orders.filter((o) => (o.tags ?? "").includes("sim:api"));
  console.log(`   ${simOrders.length} Simulator-Orders gefunden (paid)\n`);

  if (simOrders.length === 0) {
    console.error("❌ Keine refundbaren Orders. Erst simulate-orders.ts ausführen.");
    process.exit(1);
  }

  const baseDelayMs = SPREAD_MINUTES > 0 ? (SPREAD_MINUTES * 60 * 1000) / COUNT : 0;
  let errors = 0;
  let done = 0;

  // Zufällige Auswahl
  const shuffled = [...simOrders].sort(() => rng() - 0.5);
  const toRefund = shuffled.slice(0, Math.min(COUNT, shuffled.length));

  console.log(`↩️  Erstelle ${toRefund.length} Refunds...\n`);

  for (let i = 0; i < toRefund.length; i++) {
    const order = toRefund[i]!;
    const fullRefund = rng() < 0.6; // 60% Vollretoure, 40% Teilretoure
    const type = fullRefund ? "Voll" : "Teil";

    try {
      if (DRY_RUN) {
        console.log(`  [${i + 1}/${toRefund.length}] [DRY] ${type}retoure ${order.name} (${order.total_price} USD)`);
      } else {
        await client.refundOrder(order.id, fullRefund);
        console.log(`  [${i + 1}/${toRefund.length}] ✅ ${type}retoure ${order.name} (${order.total_price} USD)`);
      }
      done++;
    } catch (err) {
      errors++;
      console.error(`  [${i + 1}/${toRefund.length}] ❌ ${order.name}: ${(err as Error).message.slice(0, 120)}`);
    }

    if (baseDelayMs > 0 && i < toRefund.length - 1) {
      const jitter = 1 + (rng() - 0.5) * 0.6;
      const waitMs = Math.round(baseDelayMs * jitter);
      console.log(`  ⏳ Nächster Refund in ${Math.round(waitMs / 1000)}s...`);
      await sleep(waitMs);
    }
  }

  console.log(`\n✅ Refund-Simulation abgeschlossen!`);
  console.log(`   ${done} Refunds, ${errors} Fehler`);
}

main().catch((e) => {
  console.error("❌ Fehler:", e);
  process.exit(1);
});
