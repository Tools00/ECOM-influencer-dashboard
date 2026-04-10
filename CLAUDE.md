# CLAUDE.md — Influencer Dashboard

Pflichtlektüre vor jedem neuen Chat. Kein Recap, direkt weitermachen.

---

## Projekt-Basics

**Repo:** https://github.com/Tools00/ECOM-influencer-dashboard
**Production:** https://influencer-dashboard-wine.vercel.app
**Deploy:** `npx vercel --yes --prod`
**Lokal:** `npm run dev` (Port 3000)

**Kontext:** 30 Influencer, ~8k Orders/Monat für einen DACH E-Commerce-Shop.
Das Kernproblem: Meta Ads nutzen dieselben Discount Codes wie Influencer → Attribution-Overlap.
Retouren kommen via Shopify Tags: `retourniert`, `teilretourniert`.

---

## Tech-Stack

- **Next.js 16** App Router (nicht Pages Router)
- **TypeScript** strict mode — keine `any`, keine Type-Casts ohne Grund
- **Tailwind CSS** — keine zusätzlichen CSS-Dateien
- **Recharts** — für alle Charts
- **Supabase** — **LIVE** (kein Mock mehr). Client in `src/lib/supabase.ts`
- **Zod** — Validierung aller Supabase-Responses
- **Lucide React** — Icons
- **clsx** — conditional classNames

---

## Architektur-Regeln (nicht brechen ohne Absprache)

### Server / Client Split
- `Shell.tsx` ist Client Component (hält `collapsed`-State der Sidebar)
- Alle Pages (`page.tsx`) sind Server Components — kein `"use client"` dort
- `InfluencerDetailClient.tsx` ist Client Component (hält optimistic state für Vergütung + Bearbeiten + Aktiv-Toggle)
- `NewInfluencerModal.tsx` ist Client Component (Create + Edit in einem Modal)

### DateRange
- Wird via URL `searchParams` übergeben (`?range=30d`)
- Bookmarkable, kein lokaler State
- Typen: `"7d" | "30d" | "90d" | "all"`
- `REFERENCE_DATE` in `constants.ts` ist **dynamisch** (`new Date().toISOString().split("T")[0]`) — kein Fixwert mehr
- `REFERENCE_DATE_MOCK = "2024-03-31"` bleibt für Mock-Kompatibilität, wird aber nicht aktiv genutzt

### Datenfluss
```
Supabase → supabase.ts (fetchInfluencers, fetchOrders) → analytics.ts → page.tsx (Server) → Client Components
```
Mock-Daten (`mockData.ts`) existieren noch als Fallback wenn `USE_MOCK_DATA=true`, werden aber nicht genutzt.

### Vergütungsmodell
- Typ: `Compensation` in `types.ts`
- Berechnung: `computeActualCost(compensation, netRevenue)` in `analytics.ts`
- Modelle: `fixed | commission | hybrid | per_post | barter`
- Editierbar via `CompensationEditor.tsx` (optimistic) **und** via `EditInfluencerModal` (persistiert in Supabase)

---

## Datenmodell (aktueller Stand)

```ts
interface Order {
  id: string
  influencer_id: string
  order_date: string           // ISO "YYYY-MM-DD"
  gross_value_eur: number
  return_type: "none" | "full" | "partial"
  return_value_eur: number
  product_category: string
  item_count: number
  order_source: "influencer" | "meta_ads" | "organic"
  shopify_order_id?: string
  customer_id?: string
  return_date?: string
}

interface Influencer {
  id: string
  name: string
  handle: string
  platform: "instagram" | "tiktok" | "youtube"
  niche: string
  discount_code: string
  followers: number
  campaign_name: string
  compensation: Compensation
  is_active: boolean
  contract_start_date?: string
}
```

Supabase speichert Compensation flach: `comp_type`, `comp_interval`, `comp_fixed_eur`, `comp_commission_pct`, `comp_per_post_eur`, `comp_posts_count`, `comp_start_date`.

---

## Supabase

**URL:** in `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`
**Anon Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Service Role Key:** `SUPABASE_SERVICE_ROLE_KEY` (nur API Routes / Webhook)
**Tabellen:** `influencers`, `orders`
**Stand:** 5 Influencer, ~180 Orders (177 Mock-Seed + echte Webhook-Orders)

Wichtige Funktionen in `supabase.ts`:
- `fetchInfluencers()` — liest alle Influencer inkl. inaktiver
- `fetchOrders()` — alle Orders sortiert nach Datum
- `createInfluencer()` — INSERT mit generierter ID
- `updateInfluencer()` — UPDATE aller Felder
- `setInfluencerActive()` — is_active toggle
- `updateCompensation()` — nur Vergütungsfelder

---

## Shopify Webhook

**Route:** `POST /api/shopify/webhook`
**Events:** `orders/create`, `orders/updated`, `refunds/create`
**HMAC-Verification:** `SHOPIFY_WEBHOOK_SECRET`
**Logik:**
- Discount Code → Influencer-Lookup → `order_source`
- `financial_status: "refunded"` → `return_type: "full"` (Vorrang)
- Tags `retourniert`/`teilretourniert` → `return_type`
- Refund-Betrag via `refund_line_items`

---

## Sprint-Roadmap

### Abgeschlossen
- **Sprint 1–1D:** MVP, Layout, Vergütungsmodelle, Modal
- **Sprint 2A:** `order_source` + `return_type`
- **Sprint 2B:** Attribution-UI (`AttributionAlert`, `AttributionOverview`)
- **Sprint 2C / 3A:** Schema-Erweiterung, Supabase live, Zod-Validierung
- **Sprint 3B:** Shopify Webhook live
- **Sprint 3C:** Attribution-Risk-Score + Einstellungen-Seite
- **Sprint 4A:** `REFERENCE_DATE` dynamisch, Skeleton-Loading (`loading.tsx`), Error Boundaries (`error.tsx`)
- **Sprint 4B:** Influencer-Admin — `NewInfluencerModal`, Deaktivieren, Compensation persistiert
- **Sprint 4B.1:** Influencer bearbeiten (`EditInfluencerModal`), Reaktivieren-Button, `PUT /api/influencers/[id]`

### Zurückgestellt
- **Sprint 4A.2 (Auth/Login):** Supabase Auth, Magic Link, `middleware.ts` schützt alle Routes. Kein Blocker solange Dashboard intern. Jederzeit nachholen.

### Nächstes — Sprint 4C: Monatsabschluss + Reporting

**Neue Seite `/monatsabschluss`:**
- Beliebiger Monatsauswahl via URL param `?month=2024-03`
- KPI-Cards: Umsatz brutto/netto, Retouren, Gesamtkosten, Profit, ROI
- Tabelle: alle Influencer mit monatlichen Einzelwerten + Attribution-Split (Influencer vs. Meta Ads vs. Organic)
- Vergleich Vormonat (+/- %)
- Pro Influencer: Einzelbericht-Button → separates druckbares PDF (für Streitfälle / Abrechnungen)
- Gesamt-PDF: `window.print()` + Print-CSS (keine neue Dependency)

**Excel-Export (.xlsx via SheetJS) — zwei Varianten:**
- **Kompakt** (`kompakt-2024-03.xlsx`): 1 Sheet — Name, Umsatz netto, Retouren, Kosten, Profit, ROI
- **Vollständig** (`vollständig-2024-03.xlsx`): 4 Sheets:
  - Tab 1: Übersicht (ein Influencer pro Zeile, Monatssummen)
  - Tab 2: Order-Details (jede einzelne Bestellung des Monats)
  - Tab 3: Attribution-Split (Influencer vs. Meta Ads vs. Organic)
  - Tab 4: Vergütungsübersicht (was wurde fällig)
- Neue Dependency: `xlsx` (SheetJS) — einzige neue Dependency in Sprint 4C

**Technisch:**
- Neue Supabase-Query: Orders gefiltert nach Monat
- Neue Analytics-Funktion: `computeMonthlyStats(influencers, orders, month)`
- Modular aufgebaut für spätere Ergänzungen

### Geplante Features für später (Backlog)

**Reporting / Export:**
- E-Mail-Versand des Influencer-Einzelberichts direkt aus der App
- Automatischer Monatsabschluss via Cron (auto-generierter Bericht am 1. jeden Monats)
- Influencer-eigener Login-Link mit schreibgeschützter Berichtsansicht (für transparente Abrechnung)
- CSV/Excel-Export mit Order-Detail-Ebene (eine Zeile pro Order statt pro Influencer)

**Auth / Zugriffskontrolle (Sprint 4A.2 — zurückgestellt):**
- Supabase Auth, Magic Link
- `middleware.ts` schützt alle Routes
- Verschiedene Rollen: Admin (Shop-Besitzer) vs. Read-only (Influencer-Bericht)
- Kein Blocker solange Dashboard intern — jederzeit nachholen

**Dashboard-Vertiefung:**
- Cohort-Analyse (Influencer-Performance über Zeit)
- LTV pro Influencer (Customer Lifetime Value der geworbenen Kunden)
- Automatische Alerts wenn Attribution-Risk steigt oder Return-Rate Benchmark überschreitet
- Notifications / E-Mail-Alerts bei Schwellenwert-Überschreitungen

---

## Datei-Übersicht

```
src/
├── app/
│   ├── page.tsx                         # Dashboard (Server)
│   ├── loading.tsx                      # Skeleton Dashboard
│   ├── error.tsx                        # Error Boundary (Client)
│   ├── influencer/
│   │   ├── page.tsx                     # Influencer-Liste (Server)
│   │   └── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx                 # Influencer-Detail (Server)
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── kampagnen/
│   │   ├── page.tsx                     # Kampagnen-View (Server)
│   │   └── loading.tsx
│   ├── einstellungen/page.tsx
│   └── api/
│       ├── influencers/route.ts         # GET (stats) + POST (neu anlegen)
│       ├── influencers/[id]/route.ts    # GET + PATCH (is_active) + PUT (vollständig)
│       ├── influencers/[id]/compensation/route.ts  # PATCH Vergütung
│       └── shopify/webhook/route.ts     # Shopify Webhook
├── components/
│   ├── layout/Shell.tsx                 # Client — Sidebar collapsed state
│   ├── InfluencerDetailClient.tsx       # Client — optimistic state, Edit, Toggle
│   ├── CompensationEditor.tsx           # Client — Vergütungs-Modal
│   ├── NewInfluencerModal.tsx           # Client — Create + Edit Modal (InfluencerFormModal)
│   ├── SkeletonBlock.tsx                # Shared animate-pulse Block
│   └── ...                              # Alle anderen: reine Render-Components
└── lib/
    ├── types.ts                         # Alle Typen — Single source of truth
    ├── mockData.ts                      # Fallback-Daten (USE_MOCK_DATA=true)
    ├── analytics.ts                     # Alle Berechnungen (pure functions)
    ├── supabase.ts                      # DB-Client, Zod-Schemas, fetch/create/update
    ├── constants.ts                     # NAV_ITEMS, DACH_RETURN_BENCHMARKS, CHART_COLORS, REFERENCE_DATE
    └── formatters.ts                    # formatEUR, formatDate, etc.
```

---

## Konventionen

- Keine neuen Abhängigkeiten ohne Grund — der Stack ist bewusst schlank
- Neue Felder zuerst in `types.ts`, dann `supabase.ts` (Schema + Funktion), dann `analytics.ts`, dann UI
- Deutsche UI-Texte (Produkt ist für DACH-Markt)
- `npm run build` muss nach jeder Änderung grün sein — TypeScript-Fehler nie committen
- Commit-Format: `feat:`, `fix:`, `refactor:` — kein Scope nötig außer bei großen Bereichen
