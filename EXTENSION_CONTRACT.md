# Extension Contract — shopsim ↔ Dashboard

Dieser Vertrag definiert die Schnittstelle zwischen der Shopify-Simulations-Extension
(`shopsim-extension`, separates Repo) und dem Influencer Dashboard. Änderungen an
diesem Dokument müssen in beiden Repos nachgezogen werden.

---

## 1. Verantwortung

| Aufgabe                          | shopsim Extension | Shopify Dev Store | Dashboard Webhook |
|----------------------------------|:-----------------:|:-----------------:|:-----------------:|
| Influencer-Config + Seed-Gewichtung | ✅              | —                 | —                 |
| Produkt-Auswahl nach Niche       | ✅                | —                 | —                 |
| Discount-Code im Checkout eingeben | ✅              | —                 | —                 |
| Fake-Kundendaten (DACH)          | ✅                | —                 | —                 |
| Source-Tag an Order (`src:meta_ads`) | ✅            | —                 | —                 |
| Retoure auslösen (Refund-API)    | ✅                | —                 | —                 |
| Fulfillment markieren            | ✅                | —                 | —                 |
| `product_type` am Produkt        | —                 | ✅ (einmal angelegt) | —               |
| Retouren-Tag `retourniert`       | —                 | ✅ (automatisch via Refund) | —      |
| Webhook-Versand                  | —                 | ✅                | —                 |
| `order_source` ableiten          | —                 | —                 | ✅                |
| Attribution-Risk-Score           | —                 | —                 | ✅                |
| ROI / Vergütung / Reporting      | —                 | —                 | ✅                |

**Kurzfassung:** Die Extension ist ein dummer Click-Bot mit Config-Datei. Sie
rechnet nichts, kennt das Dashboard nicht, sendet auch nichts ans Dashboard —
alles läuft über Shopify-Webhooks.

---

## 2. Datenfluss

```
shopsim Extension
  │
  │ 1. GET Storefront (Produktliste lesen, einmalig cachen)
  │ 2. POST Checkout-Flow (Browser-Automatisierung)
  │    + Discount-Code
  │    + Tag: "src:influencer" | "src:meta_ads"
  │
  ▼
Shopify Dev Store `ecom-dach-test`
  │
  │ Webhook: orders/create, orders/updated, refunds/create
  │
  ▼
Dashboard /api/shopify/webhook
  │
  │ 1. HMAC-Verify
  │ 2. Discount-Code → Influencer-Lookup
  │ 3. parseOrderSource() — Tag/Referrer/UTM → influencer | meta_ads
  │ 4. parseReturnType() — financial_status + Tags
  │ 5. INSERT/UPDATE in Supabase orders
  │
  ▼
Supabase → Dashboard UI (Live-Update)
```

---

## 3. Was die Extension an Shopify schicken muss

Beim Checkout-Abschluss jeder simulierten Order:

### 3.1 Discount-Code
- Genau **ein** Code pro Order aus der Extension-Config
- Code muss exakt dem `discount_code`-Feld eines aktiven Influencers im
  Dashboard entsprechen (case-insensitive Match)

### 3.2 Order-Tags (beim Checkout setzen)
Die Extension **muss** pro Order **genau einen** der folgenden Tags setzen:

| Tag              | Bedeutung                                           |
|------------------|-----------------------------------------------------|
| `src:influencer` | Reine Influencer-Attribution (kein Meta-Overlap)    |
| `src:meta_ads`   | Gleicher Code wurde auch über Meta-Ad benutzt       |

**Verteilung pro Influencer** (Beispielwerte — final in Extension-Config):
- Fashion/Beauty Instagram:   25–40% `src:meta_ads`
- Tech/Gaming Instagram:      10–15% `src:meta_ads`
- YouTube (alle Nischen):     10–20% `src:meta_ads`
- Rest:                       ergibt `src:influencer`

### 3.3 Produkt-Auswahl
- Produkte werden nach Niche-Gewichtung des jeweiligen Influencers gezogen
- Shopify `product_type` am Produkt wird vom Dashboard als `product_category`
  gelesen — muss im Dev Store **einmalig** sauber gepflegt sein:
  - `Fashion`, `Beauty`, `Fitness`, `Food`, `Tech`, `Gaming`, `Lifestyle`

### 3.4 Retouren (Refund-Flow)
Die Extension triggert nach 3–10 Tagen mit Wahrscheinlichkeit = `refund_rate`
des Influencers einen Refund via Shopify Admin API:

- **Full Refund:** komplette Order-Summe
- **Partial Refund:** 30–70% der Order-Summe

Shopify setzt dabei automatisch `financial_status: refunded` /
`partially_refunded`. Das Dashboard liest beides via Webhook.

### 3.5 Fulfillment
Nach 1–2 Tagen jede Order via Admin API als `fulfilled` markieren.
Wird vom Dashboard aktuell nicht ausgewertet, aber für realistische
Shop-Optik im Admin-Panel wichtig.

---

## 4. Was das Dashboard aus dem Webhook-Payload liest

| Shopify-Feld                     | Dashboard-Feld         |
|----------------------------------|------------------------|
| `id`                             | `shopify_order_id`     |
| `created_at`                     | `order_date`           |
| `total_price`                    | `gross_value_eur`      |
| `discount_codes[0].code`         | → `influencer_id` Lookup |
| `tags: src:meta_ads`             | `order_source=meta_ads` |
| `referring_site` (facebook.com)  | `order_source=meta_ads` |
| `landing_site?utm_source=meta`   | `order_source=meta_ads` |
| `customer.id`                    | `customer_id`          |
| `line_items[0].product_type`     | `product_category`     |
| `line_items[].quantity` (sum)    | `item_count`           |
| `financial_status: refunded`     | `return_type=full`     |
| `financial_status: partially_refunded` | `return_type=partial` |
| `tags: retourniert`              | `return_type=full`     |
| `tags: teilretourniert`          | `return_type=partial`  |
| `refund_line_items[].subtotal`   | `return_value_eur`     |

**Wichtig:** Orders **ohne** Discount-Code werden vom Dashboard-Webhook
ignoriert (`return` ohne DB-Insert). Sie gehören nicht in die Influencer-
Abrechnung.

---

## 5. Extension-Config Format (Referenz)

Die Extension speichert ihre Influencer-Liste in `chrome.storage.local`.
Struktur:

```ts
interface ExtInfluencer {
  code: string;                          // muss mit Dashboard discount_code matchen
  name: string;                          // nur für Logs/Debug
  niches: Record<string, number>;        // product_type → Gewicht (Summe = 1.0)
  avg_order_eur: number;                 // Ziel-Warenkorbwert
  orders_per_day: number;                // Tagesrate
  meta_overlap_rate: number;             // 0.0–0.5 — Anteil src:meta_ads
  refund_rate: number;                   // 0.0–0.4 — Anteil Retouren
}
```

Beim ersten Start der Extension kann die Config aus
`scripts/seed-extension-config.json` (siehe Dashboard-Repo) importiert werden.

---

## 6. Versionierung

| Version | Datum      | Änderung                                            |
|---------|------------|-----------------------------------------------------|
| 1.0     | 2026-04-12 | Initialer Vertrag — 2 Source-Kategorien, Tag-basiert |
