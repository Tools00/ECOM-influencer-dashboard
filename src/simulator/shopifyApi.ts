/**
 * Thin wrapper um Shopify Admin REST API.
 * Einziger Ort der fetch + Token anfasst.
 */

const RATE_DELAY_MS = 550; // Shopify: max 2 calls/s für Legacy Apps

let _lastCall = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = RATE_DELAY_MS - (now - _lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  _lastCall = Date.now();
}

export function createShopifyClient(store: string, token: string) {
  const base = `https://${store}.myshopify.com/admin/api/2024-01`;

  async function request<T = unknown>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    await throttle();
    const res = await fetch(`${base}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify ${method} ${endpoint} → ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  }

  return {
    // ─── Products ──────────────────────────────
    async listProducts(): Promise<{ id: number; title: string; product_type: string; variants: { id: number; price: string }[] }[]> {
      type ProductEntry = { id: number; title: string; product_type: string; variants: { id: number; price: string }[] };
      const pages: ProductEntry[] = [];
      let url = "/products.json?limit=250&fields=id,title,product_type,variants";
      while (url) {
        const res = await request<{ products: ProductEntry[] }>("GET", url);
        pages.push(...res.products);
        // Pagination: Shopify Link header — simplified, nur erste Seite reicht für ~70 Produkte
        break;
      }
      return pages;
    },

    // ─── Orders ────────────────────────────────
    async createOrder(order: {
      line_items: { variant_id: number; quantity: number }[];
      discount_codes?: { code: string; amount: string; type: string }[];
      tags?: string;
      financial_status?: string;
      customer?: { first_name: string; last_name: string; email: string };
      shipping_address?: {
        first_name: string; last_name: string;
        address1: string; city: string; zip: string;
        country_code: string; province?: string;
      };
      note?: string;
    }): Promise<{ order: { id: number; name: string } }> {
      return request("POST", "/orders.json", {
        order: {
          ...order,
          send_receipt: false,
          send_fulfillment_receipt: false,
          inventory_behaviour: "bypass",
        },
      });
    },

    // ─── Fulfillment ───────────────────────────
    async fulfillOrder(orderId: number): Promise<void> {
      // Erst fulfillment_orders holen
      const foRes = await request<{ fulfillment_orders: { id: number; status: string }[] }>(
        "GET", `/orders/${orderId}/fulfillment_orders.json`
      );
      const open = foRes.fulfillment_orders.find((fo) => fo.status === "open");
      if (!open) return;

      await request("POST", "/fulfillments.json", {
        fulfillment: {
          line_items_by_fulfillment_order: [
            { fulfillment_order_id: open.id },
          ],
          tracking_info: {
            number: `SIM${orderId}`,
            company: "DHL",
          },
        },
      });
    },

    // ─── Refund ────────────────────────────────
    async refundOrder(
      orderId: number,
      fullRefund: boolean
    ): Promise<void> {
      // Erst Order holen um Line-Items + Currency zu kennen
      const orderRes = await request<{ order: { currency: string; line_items: { id: number; quantity: number }[] } }>(
        "GET", `/orders/${orderId}.json?fields=currency,line_items`
      );
      const { currency, line_items } = orderRes.order;

      // Refund direkt mit Line-Items (ohne calculate — API-Orders haben "manual" gateway)
      const refundPayload = {
        refund_line_items: line_items.map((li) => ({
          line_item_id: li.id,
          quantity: fullRefund ? li.quantity : Math.max(1, Math.floor(li.quantity / 2)),
          restock_type: "no_restock" as const,
        })),
        notify: false,
        note: fullRefund ? "Vollretoure (Simulation)" : "Teilretoure (Simulation)",
      };

      await request("POST", `/orders/${orderId}/refunds.json`, { refund: refundPayload });
    },

    // ─── Util ──────────────────────────────────
    async getOrderCount(): Promise<number> {
      const res = await request<{ count: number }>("GET", "/orders/count.json?status=any");
      return res.count;
    },
  };
}

export type ShopifyClient = ReturnType<typeof createShopifyClient>;
