/**
 * Orchestrator: Ein Simulationsdurchlauf.
 *
 * Pro Tick:
 *  1. Influencer ziehen (gewichtet nach orders_per_day)
 *  2. Order erstellen via Shopify Admin API
 *  3. Evtl. ältere Order fulfillon / refunden
 *
 * Aufruf: simulateTick(client, config, products, rng)
 */

import type { ShopifyClient } from "./shopifyApi";
import type { SimConfig, InfluencerSim } from "./config";
import { buildOrderPayload, computeOrderTotal } from "./orderFactory";

interface Product {
  id: number;
  title: string;
  product_type: string;
  variants: { id: number; price: string }[];
}

export interface TickResult {
  action: "createOrder" | "fulfillOrder" | "refundOrder";
  influencer: string;
  code: string;
  detail: string;
}

/**
 * Wählt einen Influencer gewichtet nach orders_per_day.
 */
function pickInfluencer(influencers: InfluencerSim[], rng: () => number): InfluencerSim {
  const total = influencers.reduce((s, i) => s + i.orders_per_day, 0);
  let r = rng() * total;
  for (const inf of influencers) {
    r -= inf.orders_per_day;
    if (r <= 0) return inf;
  }
  return influencers[influencers.length - 1]!;
}

/**
 * Erstellt eine neue Order.
 */
export async function simulateCreateOrder(
  client: ShopifyClient,
  config: SimConfig,
  products: Product[],
  rng: () => number,
  dryRun: boolean,
): Promise<TickResult> {
  const inf = pickInfluencer(config.influencers, rng);
  const payload = buildOrderPayload(inf, products, rng);

  if (dryRun) {
    const total = computeOrderTotal(payload.line_items, products);
    const itemCount = payload.line_items.reduce((s, li) => s + li.quantity, 0);
    return {
      action: "createOrder",
      influencer: inf.name,
      code: inf.code,
      detail: `[DRY] ${payload.line_items.length} Produkte, ${itemCount} Stück → ~${total.toFixed(0)} EUR (Ziel: ${inf.avg_order_eur}) | tags: ${payload.tags}`,
    };
  }

  const result = await client.createOrder(payload);
  return {
    action: "createOrder",
    influencer: inf.name,
    code: inf.code,
    detail: `Order ${result.order.name} (ID: ${result.order.id})`,
  };
}

/**
 * Fulfill einer zufälligen offenen Order.
 * Nutzt getRecentOrders um eine ID zu finden.
 */
export async function simulateFulfill(
  client: ShopifyClient,
  orderId: number,
  dryRun: boolean,
): Promise<TickResult> {
  if (dryRun) {
    return {
      action: "fulfillOrder",
      influencer: "—",
      code: "—",
      detail: `[DRY] Would fulfill order ${orderId}`,
    };
  }

  await client.fulfillOrder(orderId);
  return {
    action: "fulfillOrder",
    influencer: "—",
    code: "—",
    detail: `Fulfilled order ${orderId}`,
  };
}

/**
 * Refund einer zufälligen Order.
 */
export async function simulateRefund(
  client: ShopifyClient,
  orderId: number,
  fullRefund: boolean,
  dryRun: boolean,
): Promise<TickResult> {
  if (dryRun) {
    return {
      action: "refundOrder",
      influencer: "—",
      code: "—",
      detail: `[DRY] Would ${fullRefund ? "full" : "partial"} refund order ${orderId}`,
    };
  }

  await client.refundOrder(orderId, fullRefund);
  return {
    action: "refundOrder",
    influencer: "—",
    code: "—",
    detail: `${fullRefund ? "Full" : "Partial"} refund order ${orderId}`,
  };
}
