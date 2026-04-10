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
- **Sprint 4C:** Monatsabschluss-Seite (`/monatsabschluss`), Excel-Export kompakt/vollständig (SheetJS), PDF via Print-CSS

---

## Demo-Prep (Bewerbung bei SaaS-Firma Leo)

**Ziel:** Dashboard mit realistischen Echtdaten demonstrieren — 30 Influencer, ~8.000 Orders/Monat (267/Tag, 11/Stunde), Ø 375–625 EUR/Order, ~3–5M EUR Umsatz/Monat. Zeitraum: 1. Januar 2026 bis gestern. Ab heute: echte Live-Orders via Shopify Dev Store.

### Demo-Sprint A — Seed-Daten (30 Influencer + ~27.000 Orders)

**30 Influencer-Profile (fiktiv, realistisch DACH):**
- Platform-Mix: Instagram (12), TikTok (10), YouTube (8)
- Nischen: Fashion (6), Beauty (5), Fitness (4), Food (4), Tech (4), Gaming (3), Lifestyle (4)
- Vergütungsmodelle: gemischt (fixed, commission, hybrid, per_post, barter)

**Umsatz-Verteilung:**
- Top 5–8 Influencer: ~60% des Umsatzes
- YouTube: hohe Ø Order-Values (500–800 EUR), weniger Orders aber mehr Umsatz
- Instagram/TikTok: mehr Orders, niedrigere Ø Werte (150–350 EUR)
- Langfristige Kanäle (YouTube) → geringerer Meta-Overlap (10–20%)
- Short-Form (TikTok/Reels) → höherer Meta-Overlap (25–40%)

**Attribution-Overlap-Logik:**
- ~30% aller Influencer-Orders kommen gleichzeitig über Meta Ads rein (gleicher Discount Code)
- Fashion/Beauty: 30–40% Overlap
- Tech/Gaming: 10–15% Overlap
- YouTube: 10–20% Overlap
- Overlap-Orders: `order_source = "meta_ads"` mit Influencer-Discount Code

**Seed-Script:** `scripts/seed-demo.ts` — Supabase bulk INSERT via Service Role Key

### Demo-Sprint B — Filter, Sortierung & Tags

**Filter (kombinierbar):**
- Platform: Instagram / TikTok / YouTube
- Nische: alle vorhandenen Nischen
- Kampagne
- Status: aktiv / inaktiv
- Tag: beliebige Tags
- Performance-Tier: automatisch aus ROI (Top / Mid / Low)

**Sortierung (auf jede Spalte):**
- Umsatz netto, Brutto, ROI, Retourenquote, Follower, Orders, Kosten, Profit

**Tag-System:**
- Vorgeschlagene Tags: `VIP`, `Top Performer`, `Risiko`, `Pause`, `Neu`, `Langzeit-Partner`
- Freie Tags: User kann beliebig neue Tags erstellen
- Tags filterbar: Klick auf Tag → filtert Influencer-Liste
- Smart Suggestion: beim Erstellen eines neuen Tags → schlägt passende andere Influencer vor
- Tags in Supabase: eigene `tags`-Tabelle + `influencer_tags` Join-Tabelle

### Demo-Sprint C — Chrome Extension: Shop-Simulator

**Ziel:** Dauerhafte, selbstständige Simulation echter Shopify-Checkouts ohne KI-API-Abhängigkeit.

**Aufbau (separates Repo: `ecom-shop-simulator-extension`):**
- Chrome Extension (Manifest V3)
- Läuft im Hintergrund (Service Worker)
- Besucht Shopify Dev Store `ecom-dach-test` automatisch
- Wählt zufällige Produkte, legt in Warenkorb, gibt Discount Code ein, schließt Checkout ab
- Rotiert über alle 30 Influencer-Discount-Codes (gewichtet nach Tier)
- Simuliert realistische DACH-Kundendaten (Name, Adresse, E-Mail)
- Intervall: alle 5–8 Minuten ein Checkout → ~267 Orders/Tag
- Triggers echte Shopify Webhooks → Supabase → Live-Dashboard-Update
- Konfigurierbar: Pause, Geschwindigkeit, Influencer-Gewichtung
- **Keine KI-API** — reine Browser-Automatisierung

---

### Nächste Sprints — Kurzfristig

**Sprint 5A — Auth & Zugriffskontrolle**
- Supabase Auth + Magic Link Login
- `middleware.ts` schützt alle Routes außer Webhook
- Rollen: Admin (Shop-Besitzer) vs. Read-only (Influencer-Bericht)

**Sprint 5B — Influencer-Berichtsansicht (Read-only)**
- Influencer-eigener Login-Link
- Schreibgeschützte Ansicht des eigenen Monatsberichts
- Grundlage: Streitvermeidung + transparente Abrechnung

**Sprint 5C — Alerts & Benachrichtigungen**
- Alert wenn Attribution-Risk-Score kritisch steigt
- Alert wenn Retourenquote DACH-Benchmark überschreitet
- E-Mail-Notifications bei Schwellenwert-Überschreitungen (Resend oder Supabase SMTP)

**Sprint 5D — Automatisierung**
- Monatsabschluss-Bericht automatisch am 1. jeden Monats (Vercel Cron)
- E-Mail-Versand des Influencer-Einzelberichts direkt aus App

### Langfristig

**Sprint 6A — Dashboard-Vertiefung**
- Cohort-Analyse (Influencer-Performance über mehrere Monate)
- LTV pro Influencer (Customer Lifetime Value der geworbenen Kunden)

**Sprint 6B — Multi-Tenant / SaaS-Ready**
- Mehrere Shops / Workspaces pro Account
- Onboarding-Flow für neue Shops
- Billing-Grundstruktur (vorbereitet für SaaS-Monetarisierung)

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
