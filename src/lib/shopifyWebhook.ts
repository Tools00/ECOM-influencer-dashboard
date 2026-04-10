import crypto from "crypto";

// ─── HMAC Verification ────────────────────────────────────

/**
 * Prüft die Shopify-Webhook-Signatur (HMAC-SHA256, Base64).
 * Gibt true zurück wenn gültig — immer timing-safe.
 */
export function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false; // Buffers ungleicher Länge
  }
}

// ─── Shopify Payload-Typen ─────────────────────────────────

export interface ShopifyDiscountCode {
  code: string;
  amount: string;
  type: string;
}

export interface ShopifyLineItem {
  title: string;
  quantity: number;
  price: string;
  product_type: string;
}

export interface ShopifyCustomer {
  id: number;
}

export interface ShopifyOrder {
  id: number;
  created_at: string;           // ISO 8601
  total_price: string;          // "49.99"
  tags: string;                 // "retourniert, ..."
  financial_status: string;     // "paid" | "refunded" | "partially_refunded" | ...
  discount_codes: ShopifyDiscountCode[];
  line_items: ShopifyLineItem[];
  customer?: ShopifyCustomer;
}

export interface ShopifyRefundLineItem {
  quantity: number;
  line_item: {
    price: string;
    quantity: number;
  };
}

export interface ShopifyRefund {
  id: number;
  order_id: number;
  created_at: string;
  refund_line_items: ShopifyRefundLineItem[];
}

// ─── Mapping-Funktionen ────────────────────────────────────

/**
 * Shopify-Tags → return_type + return_date.
 * Shopify-Tags sind kommasepariert, z.B. "retourniert, premium".
 */
export function parseReturnType(tags: string): {
  return_type: "none" | "full" | "partial";
  return_date: string | null;
} {
  const tagList = tags
    .split(",")
    .map((t) => t.trim().toLowerCase());

  if (tagList.includes("retourniert")) {
    return { return_type: "full", return_date: todayISO() };
  }
  if (tagList.includes("teilretourniert")) {
    return { return_type: "partial", return_date: todayISO() };
  }
  return { return_type: "none", return_date: null };
}

/**
 * Summiert alle Erstattungsbeträge aus einem Shopify-Refund.
 */
export function computeRefundAmount(refund: ShopifyRefund): number {
  return refund.refund_line_items.reduce((sum, item) => {
    return sum + parseFloat(item.line_item.price) * item.quantity;
  }, 0);
}

/**
 * Bestimmt die Produktkategorie aus dem ersten Line-Item.
 * Fallback: "Sonstiges".
 */
export function parseCategory(lineItems: ShopifyLineItem[]): string {
  const type = lineItems?.[0]?.product_type?.trim();
  return type || "Sonstiges";
}

/**
 * Zählt alle bestellten Artikel über alle Line-Items.
 */
export function parseItemCount(lineItems: ShopifyLineItem[]): number {
  return lineItems.reduce((sum, li) => sum + li.quantity, 0) || 1;
}

// ─── Helpers ───────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
