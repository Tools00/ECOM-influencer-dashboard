/**
 * Order-Factory: Baut realistische Shopify-Order-Payloads.
 *
 * Ziel: avg_order_eur des Influencers treffen (±30% Jitter).
 * Strategie: Mehrere Produkte + Quantities hinzufügen bis Zielwert erreicht.
 */

import type { InfluencerSim } from "./config";
import { generateCustomer } from "./customers";

interface Product {
  id: number;
  title: string;
  product_type: string;
  variants: { id: number; price: string }[];
}

export interface OrderPayload {
  line_items: { variant_id: number; quantity: number }[];
  tags: string;
  financial_status: string;
  customer: { first_name: string; last_name: string; email: string };
  shipping_address: {
    first_name: string; last_name: string;
    address1: string; city: string; zip: string;
    country_code: string;
  };
  note: string;
  discount_codes?: { code: string; amount: string; type: string }[];
}

/**
 * Wählt Nische gewichtet nach Influencer-Nischen-Verteilung.
 */
function pickNiche(inf: InfluencerSim, rng: () => number): string {
  const entries = Object.entries(inf.niches);
  let r = rng();
  for (const [niche, weight] of entries) {
    r -= weight;
    if (r <= 0) return niche;
  }
  return entries[entries.length - 1]![0];
}

/**
 * Filtert Produkte nach passendem product_type.
 */
function pickProduct(products: Product[], niche: string, rng: () => number): Product {
  const matching = products.filter((p) => p.product_type === niche);
  const pool = matching.length > 0 ? matching : products;
  return pool[Math.floor(rng() * pool.length)]!;
}

/**
 * Baut Line-Items die zusammen den Zielwert (avg_order_eur ± 30%) treffen.
 */
function buildLineItems(
  inf: InfluencerSim,
  products: Product[],
  niche: string,
  rng: () => number,
): { variant_id: number; quantity: number }[] {
  // Zielwert mit ±30% Jitter
  const jitter = 0.7 + rng() * 0.6; // 0.7 – 1.3
  const target = inf.avg_order_eur * jitter;

  const items: { variant_id: number; quantity: number }[] = [];
  let total = 0;
  let attempts = 0;

  while (total < target && attempts < 15) {
    attempts++;
    const product = pickProduct(products, niche, rng);
    const variant = product.variants[0];
    if (!variant) continue;

    const price = parseFloat(variant.price);
    const remaining = target - total;

    // Quantity: so viele wie nötig, max 3 pro Produkt
    const maxQty = Math.min(3, Math.max(1, Math.floor(remaining / price)));
    const qty = maxQty <= 1 ? 1 : Math.ceil(rng() * maxQty);

    // Prüfe ob schon im Warenkorb → Quantity erhöhen
    const existing = items.find((i) => i.variant_id === variant.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({ variant_id: variant.id, quantity: qty });
    }

    total += price * qty;

    // Wenn wir mindestens 70% des Ziels erreicht haben, ab und zu aufhören
    if (total >= target * 0.7 && rng() < 0.4) break;
  }

  // Fallback: mindestens 1 Produkt
  if (items.length === 0) {
    const product = pickProduct(products, niche, rng);
    const variant = product.variants[0];
    if (variant) items.push({ variant_id: variant.id, quantity: 1 });
  }

  return items;
}

/**
 * Berechnet den Gesamtpreis der Line-Items.
 */
export function computeOrderTotal(
  lineItems: { variant_id: number; quantity: number }[],
  products: Product[],
): number {
  const variantMap = new Map<number, number>();
  for (const p of products) {
    for (const v of p.variants) {
      variantMap.set(v.id, parseFloat(v.price));
    }
  }
  return lineItems.reduce((sum, li) => sum + (variantMap.get(li.variant_id) ?? 0) * li.quantity, 0);
}

/**
 * Erstellt einen realistischen Order-Payload für Shopify.
 */
export function buildOrderPayload(
  inf: InfluencerSim,
  products: Product[],
  rng: () => number,
): OrderPayload {
  const niche = pickNiche(inf, rng);
  const lineItems = buildLineItems(inf, products, niche, rng);

  // Meta-Overlap Tag?
  const isMeta = rng() < inf.meta_overlap_rate;

  const tags: string[] = [
    `inf:${inf.code}`,
    `sim:api`,
    `niche:${niche}`,
  ];
  if (isMeta) {
    tags.push("src:meta_ads");
  }

  const { customer, shipping_address } = generateCustomer(rng);

  // Discount: extrahiere Zahl aus Code (z.B. EMMA15 → 15%)
  const pctMatch = inf.code.match(/(\d+)/);
  const pct = pctMatch ? parseInt(pctMatch[1], 10) : 10;
  const total = computeOrderTotal(lineItems, products);
  const discountAmount = ((total * pct) / 100).toFixed(2);

  return {
    line_items: lineItems,
    tags: tags.join(", "),
    financial_status: "paid",
    customer,
    shipping_address,
    note: `Simulation · ${inf.name} · ${niche}`,
    discount_codes: [
      {
        code: inf.code,
        amount: discountAmount,
        type: "percentage",
      },
    ],
  };
}
