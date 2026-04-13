/**
 * Shopify Dev Store Setup: ~70 Produkte + 30 Discount Codes automatisch anlegen.
 * Ausführen: npx tsx scripts/setup-shopify-store.ts
 *
 * Benötigt in .env.local:
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxxxx
 *   SHOPIFY_STORE=ecom-dach-test
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local laden
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

import config from "./seed-extension-config.json";

const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const STORE = process.env.SHOPIFY_STORE ?? "ecom-dach-test";

if (!TOKEN) {
  console.error("❌ SHOPIFY_ADMIN_TOKEN fehlt in .env.local");
  process.exit(1);
}

const BASE = `https://${STORE}.myshopify.com/admin/api/2024-01`;

async function shopifyRequest(endpoint: string, method: string, body?: unknown) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify ${method} ${endpoint} → ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Produkte ────────────────────────────────────────────────

interface ProductDef {
  title: string;
  product_type: string;
  price: string;
  body_html?: string;
}

const PRODUCTS: ProductDef[] = [
  // Fashion (10)
  { title: "Premium T-Shirt Weiß",       product_type: "Fashion", price: "39.90" },
  { title: "Slim Fit Jeans Dunkelblau",   product_type: "Fashion", price: "89.90" },
  { title: "Oversize Hoodie Schwarz",     product_type: "Fashion", price: "69.90" },
  { title: "Leder Sneakers Classic",      product_type: "Fashion", price: "129.90" },
  { title: "Sommerkleid Midi Floral",     product_type: "Fashion", price: "79.90" },
  { title: "Wollmantel Lang Camel",       product_type: "Fashion", price: "199.90" },
  { title: "Basic Tank Top 3er Pack",     product_type: "Fashion", price: "34.90" },
  { title: "Cargo Shorts Oliv",           product_type: "Fashion", price: "49.90" },
  { title: "Seidenbluse Champagner",      product_type: "Fashion", price: "99.90" },
  { title: "Strickpullover Merino",       product_type: "Fashion", price: "119.90" },

  // Beauty (10)
  { title: "Vitamin C Serum 30ml",        product_type: "Beauty", price: "34.90" },
  { title: "Hyaluron Feuchtigkeitscreme", product_type: "Beauty", price: "42.90" },
  { title: "Matte Lippenstift Set",       product_type: "Beauty", price: "28.90" },
  { title: "Retinol Nachtcreme",          product_type: "Beauty", price: "54.90" },
  { title: "Mascara Volumen Schwarz",     product_type: "Beauty", price: "19.90" },
  { title: "Gesichtsreinigung Gel",       product_type: "Beauty", price: "24.90" },
  { title: "Highlighter Palette Rose",    product_type: "Beauty", price: "38.90" },
  { title: "Sonnencreme SPF50 Bio",       product_type: "Beauty", price: "29.90" },
  { title: "Parfum Eau de Toilette 50ml", product_type: "Beauty", price: "79.90" },
  { title: "Haarkur Keratin Repair",      product_type: "Beauty", price: "22.90" },

  // Fitness (10)
  { title: "Yogamatte Premium 6mm",       product_type: "Fitness", price: "49.90" },
  { title: "Whey Protein Vanille 1kg",    product_type: "Fitness", price: "34.90" },
  { title: "Kurzhantel Set 2×5kg",        product_type: "Fitness", price: "44.90" },
  { title: "Fitnessbänder 5er Set",       product_type: "Fitness", price: "19.90" },
  { title: "Sport Leggings High Waist",   product_type: "Fitness", price: "59.90" },
  { title: "Shaker Bottle 750ml",         product_type: "Fitness", price: "14.90" },
  { title: "Springseil Speed Rope",       product_type: "Fitness", price: "24.90" },
  { title: "Foam Roller Massage",         product_type: "Fitness", price: "29.90" },
  { title: "BCAA Pulver Mango 500g",      product_type: "Fitness", price: "27.90" },
  { title: "Sportmatte Faltbar",          product_type: "Fitness", price: "39.90" },

  // Food (10)
  { title: "Bio Müsli Nuss-Crunch 750g",  product_type: "Food", price: "12.90" },
  { title: "Gewürzset DACH Klassiker",     product_type: "Food", price: "34.90" },
  { title: "Matcha Tee Premium 100g",      product_type: "Food", price: "24.90" },
  { title: "Olivenöl Extra Vergine 500ml", product_type: "Food", price: "18.90" },
  { title: "Proteinriegel Box 12 Stück",   product_type: "Food", price: "29.90" },
  { title: "Superfood Mix Pulver 300g",    product_type: "Food", price: "22.90" },
  { title: "Honig Manuka MGO 400+",        product_type: "Food", price: "49.90" },
  { title: "Kaffee Bohnen Bio 1kg",        product_type: "Food", price: "19.90" },
  { title: "Vegane Schokolade 5er Set",    product_type: "Food", price: "16.90" },
  { title: "Ingwer Shots 12er Pack",       product_type: "Food", price: "28.90" },

  // Tech (10)
  { title: "Bluetooth Kopfhörer ANC",      product_type: "Tech", price: "149.90" },
  { title: "Powerbank 20.000mAh USB-C",    product_type: "Tech", price: "39.90" },
  { title: "Smartwatch Fitness Tracker",    product_type: "Tech", price: "199.90" },
  { title: "Webcam 4K Streaming",          product_type: "Tech", price: "89.90" },
  { title: "USB-C Hub 7-in-1",             product_type: "Tech", price: "49.90" },
  { title: "Mechanische Tastatur RGB",     product_type: "Tech", price: "129.90" },
  { title: "Monitor Light Bar",            product_type: "Tech", price: "59.90" },
  { title: "Wireless Ladestation 3-in-1",  product_type: "Tech", price: "44.90" },
  { title: "Tablet Stand Aluminium",       product_type: "Tech", price: "34.90" },
  { title: "Noise Cancelling Earbuds",     product_type: "Tech", price: "79.90" },

  // Gaming (10)
  { title: "Gaming Controller Wireless",   product_type: "Gaming", price: "59.90" },
  { title: "Gaming Headset 7.1 Surround",  product_type: "Gaming", price: "89.90" },
  { title: "Mauspad XXL RGB",              product_type: "Gaming", price: "29.90" },
  { title: "Gaming Maus 16.000 DPI",       product_type: "Gaming", price: "69.90" },
  { title: "Capture Card 4K60",            product_type: "Gaming", price: "179.90" },
  { title: "Controller Grip Covers",       product_type: "Gaming", price: "14.90" },
  { title: "Gaming Stuhl Ergonomisch",     product_type: "Gaming", price: "349.90" },
  { title: "Streaming Mikrofon USB",       product_type: "Gaming", price: "99.90" },
  { title: "Gaming Brille Blaulicht",      product_type: "Gaming", price: "39.90" },
  { title: "LED Lightstrip RGB 3m",        product_type: "Gaming", price: "24.90" },

  // Lifestyle (10)
  { title: "Duftkerze Sandelholz 300g",    product_type: "Lifestyle", price: "32.90" },
  { title: "Notizbuch Leder A5",           product_type: "Lifestyle", price: "24.90" },
  { title: "Rucksack Urban Wasserdicht",   product_type: "Lifestyle", price: "89.90" },
  { title: "Trinkflasche Edelstahl 750ml", product_type: "Lifestyle", price: "29.90" },
  { title: "Sonnenbrille Polarisiert",     product_type: "Lifestyle", price: "49.90" },
  { title: "Reise Organizer Set",          product_type: "Lifestyle", price: "34.90" },
  { title: "Schlafmaske Seide",            product_type: "Lifestyle", price: "19.90" },
  { title: "Diffuser Aroma 200ml",         product_type: "Lifestyle", price: "44.90" },
  { title: "Weekender Tasche Canvas",      product_type: "Lifestyle", price: "79.90" },
  { title: "Wanduhr Minimalist Holz",      product_type: "Lifestyle", price: "54.90" },
];

// ─── Discount Codes ──────────────────────────────────────────

async function createProduct(p: ProductDef): Promise<void> {
  await shopifyRequest("/products.json", "POST", {
    product: {
      title: p.title,
      product_type: p.product_type,
      body_html: p.body_html ?? `<p>DACH E-Commerce Demo — ${p.product_type}</p>`,
      vendor: "ECOM DACH",
      status: "active",
      variants: [
        {
          price: p.price,
          inventory_management: null,      // kein Inventar-Tracking
          inventory_policy: "continue",    // immer verkaufbar
        },
      ],
    },
  });
}

async function createDiscountCode(code: string, percentage: number): Promise<void> {
  // 1) Price Rule erstellen
  const priceRule = await shopifyRequest("/price_rules.json", "POST", {
    price_rule: {
      title: code,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "percentage",
      value: `-${percentage}`,
      customer_selection: "all",
      usage_limit: null,              // unlimited
      starts_at: "2026-01-01T00:00:00Z",
    },
  });

  const priceRuleId = priceRule.price_rule.id;

  // 2) Discount Code an Price Rule hängen
  await shopifyRequest(`/price_rules/${priceRuleId}/discount_codes.json`, "POST", {
    discount_code: { code },
  });
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log("🏪 Shopify Dev Store Setup\n");
  console.log(`   Store: ${STORE}.myshopify.com`);
  console.log(`   Produkte: ${PRODUCTS.length}`);
  console.log(`   Discount Codes: ${config.influencers.length}\n`);

  // 1) Produkte
  console.log("📦 Produkte anlegen...");
  let created = 0;
  for (const p of PRODUCTS) {
    try {
      await createProduct(p);
      created++;
      if (created % 10 === 0) {
        console.log(`   ✓ ${created}/${PRODUCTS.length} — ${p.product_type}`);
      }
    } catch (err) {
      console.error(`   ❌ ${p.title}:`, (err as Error).message.slice(0, 120));
    }
    // Shopify Rate Limit: max 2 Calls/Sekunde
    await sleep(600);
  }
  console.log(`✓ ${created} Produkte angelegt\n`);

  // 2) Discount Codes
  console.log("🏷️  Discount Codes anlegen...");
  let codes = 0;
  for (const inf of config.influencers) {
    try {
      // Discount zwischen 10–20%, variiert pro Influencer
      const pct = parseInt(inf.code.replace(/[^0-9]/g, ""), 10) || 10;
      await createDiscountCode(inf.code, Math.min(pct, 25));
      codes++;
      console.log(`   ✓ ${inf.code} (${Math.min(pct, 25)}%) — ${inf.name}`);
    } catch (err) {
      console.error(`   ❌ ${inf.code}:`, (err as Error).message.slice(0, 120));
    }
    await sleep(600);
  }
  console.log(`✓ ${codes} Codes angelegt\n`);

  // 3) Webhook anlegen
  console.log("🔗 Webhooks registrieren...");
  const WEBHOOK_URL = "https://influencer-dashboard-wine.vercel.app/api/shopify/webhook";
  const topics = ["orders/create", "orders/updated", "refunds/create"];

  for (const topic of topics) {
    try {
      await shopifyRequest("/webhooks.json", "POST", {
        webhook: {
          topic,
          address: WEBHOOK_URL,
          format: "json",
        },
      });
      console.log(`   ✓ ${topic}`);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("already")) {
        console.log(`   ⏭ ${topic} (existiert bereits)`);
      } else {
        console.error(`   ❌ ${topic}:`, msg.slice(0, 120));
      }
    }
    await sleep(600);
  }

  console.log(`\n✅ Store-Setup abgeschlossen!`);
  console.log(`   ${created} Produkte · ${codes} Codes · ${topics.length} Webhooks`);
  console.log(`   Store: https://${STORE}.myshopify.com`);
  console.log(`   Admin: https://admin.shopify.com/store/${STORE}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("❌ Unerwarteter Fehler:", e);
  process.exit(1);
});
