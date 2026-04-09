# Influencer Performance Dashboard — Architecture

## What this is

A production-ready Next.js dashboard that tracks Shopify influencer partnerships across three core dimensions:
- **Revenue per influencer** (gross and net)
- **Return rates** (count, value, and %)
- **Partnership profitability** (net revenue − monthly fixed cost = profit; expressed as ROI %)

Works out-of-the-box with mock data. Switch to Supabase by adding two env vars.

---

## Architecture decisions

### 1. Attribution via Discount Codes

**Decision:** Track influencers through unique Shopify discount codes (e.g., `SOPHIE10`, `MAX15`), not UTM parameters.

**Why:** Discount codes are the most reliable attribution signal in Shopify. UTM parameters get lost when customers switch devices or use ad blockers. A discount code is attached to the order object itself — it survives checkout, returns processing, and data exports. Every order row in Shopify's orders API contains `discount_codes[]`, so attribution is zero-ambiguity.

**Trade-off:** Codes don't capture organic brand awareness (someone who buys without using the code). Accepted — we're measuring partnership ROI, not total brand lift.

---

### 2. Supabase (PostgreSQL) as the data layer

**Decision:** PostgreSQL via Supabase, not Firebase Firestore.

**Why:** Influencer analytics are inherently relational and aggregate-heavy (SUM, GROUP BY, JOIN). PostgreSQL handles this with SQL views and indexes rather than client-side map/reduce. Supabase gives us:
- A `influencer_monthly_stats` view for future date-range filtering without API changes
- Row-level security (RLS) for multi-tenant access if needed
- Real-time subscriptions for a live-updating dashboard (future feature)
- Shopify webhooks can write directly to Supabase via a simple edge function

**Production data flow:**
```
Shopify order created
  → webhook → Supabase Edge Function
  → INSERT into orders (discount_code → influencer_id lookup)
  → Dashboard queries via Supabase client
```

---

### 3. Next.js 14 with Server Components

**Decision:** Fetch data on the server (React Server Component), not client-side with `useEffect`.

**Why:** Eliminates loading spinners and layout shift. The dashboard renders fully server-side with real data — the HTML that arrives in the browser is already populated. Only the charts (Recharts) and the sortable table need client-side JavaScript, so they're marked `"use client"` selectively.

**Benefit for SEO / sharing:** A screenshot or share link of the dashboard shows actual data immediately.

---

### 4. Profitability formula

```
gross_revenue     = SUM(order.gross_value_eur)
return_value      = SUM(order.return_value_eur)       ← full refund only
net_revenue       = gross_revenue − return_value
profit            = net_revenue − monthly_cost_eur
ROI               = (profit / monthly_cost_eur) × 100
```

**Simplification accepted:** Return value = full order value for fully returned orders. Partial returns would require line-item data from the Shopify Orders API — achievable by extending the schema with an `order_items` table and a `refunds` table. Left as a schema-ready extension point.

---

### 5. Mock data fallback

**Decision:** Ship with realistic hardcoded mock data that activates when `USE_MOCK_DATA=true` or Supabase env vars are absent.

**Why:** The application runs without any external dependency for demos, reviews, and local development. The mock data is seeded in `supabase/seed.sql` — the exact same rows — so mock ↔ production produces identical output.

---

## File structure

```
src/
├── app/
│   ├── page.tsx              # Server component — fetches & renders dashboard
│   ├── layout.tsx            # Root layout (font, metadata)
│   ├── globals.css
│   └── api/influencers/
│       └── route.ts          # REST endpoint: GET /api/influencers → JSON
├── components/
│   ├── KPICard.tsx           # Summary metric card
│   ├── InfluencerTable.tsx   # Sortable detail table (client)
│   ├── RevenueChart.tsx      # Grouped bar chart (client, Recharts)
│   ├── ReturnRateChart.tsx   # Horizontal bar chart, colour-coded (client)
│   └── PlatformBadge.tsx     # Instagram / TikTok / YouTube pill
└── lib/
    ├── types.ts              # Influencer, Order, InfluencerStats, DashboardSummary
    ├── mockData.ts           # 78 seeded orders across 5 influencers
    ├── analytics.ts          # Pure functions: computeInfluencerStats, computeDashboardSummary
    └── supabase.ts           # Supabase client + mock fallback

supabase/
├── migrations/001_schema.sql  # Tables, indexes, monthly stats view
└── seed.sql                   # Identical data to mockData.ts
```

---

## How to run

```bash
# 1. Install dependencies
npm install

# 2. Copy env file (mock data works without changes)
cp .env.example .env.local

# 3. Start development server
npm run dev
# → http://localhost:3000

# 4. (Optional) Connect to Supabase
# Edit .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Then run: supabase db push  (requires Supabase CLI)
# Then run: psql $DATABASE_URL -f supabase/seed.sql
```

---

## Future extensions (production roadmap)

| Feature | Approach |
|---|---|
| Date range filter | URL search params → server component re-fetch; `influencer_monthly_stats` view already supports this |
| Shopify webhook ingestion | Supabase Edge Function verifies HMAC, resolves discount_code → influencer_id, inserts order row |
| Klaviyo attribution | Join on email; Klaviyo sends `$attributed_revenue` per influencer campaign flow |
| Multi-tenant (agency) | Supabase RLS policies per `brand_id` column on both tables |
| Alerts | Supabase pg_cron + email/Slack if return_rate > threshold |
| Export | `/api/influencers?format=csv` endpoint; same analytics function, different serializer |

---

## AI tools used in this build

| Tool | Where used |
|---|---|
| **Claude Code** | Architecture planning, TypeScript types, analytics logic, full codebase generation |
| **Claude (chat)** | Reviewed Supabase schema design, SQL view logic |

**Where AI genuinely helped:** Scaffolding the full file structure quickly, writing the Recharts configuration, generating realistic mock data with correct numeric distributions (return rates, AOV variance by category).

**Where I kept critical thinking:** The attribution strategy (discount codes vs UTMs) — AI defaulted to UTM, I overrode to discount codes because they're order-attached. The profitability formula — I explicitly separated gross/net/profit rather than letting AI collapse them into a single "revenue" field. The mock/production fallback design — ensures the demo runs without external dependencies, which matters for review.
