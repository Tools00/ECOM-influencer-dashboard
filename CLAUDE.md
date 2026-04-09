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
- **Supabase** — noch nicht aktiv, Mock-Modus läuft über `src/lib/mockData.ts`
- **Lucide React** — Icons
- **clsx** — conditional classNames

---

## Architektur-Regeln (nicht brechen ohne Absprache)

### Server / Client Split
- `Shell.tsx` ist Client Component (hält `collapsed`-State der Sidebar)
- Alle Pages (`page.tsx`) sind Server Components — kein `"use client"` dort
- `InfluencerDetailClient.tsx` ist die einzige Client Component auf der Detail-Seite (hält optimistic state für Vergütungseditor)

### DateRange
- Wird via URL `searchParams` übergeben (`?range=30d`)
- Bookmarkable, kein lokaler State
- Typen: `"7d" | "30d" | "90d" | "all"`
- `REFERENCE_DATE = "2024-03-31"` in `constants.ts` — Fixpunkt für Mock-Daten

### Datenfluss
```
mockData.ts → analytics.ts → page.tsx (Server) → Client Components
```
Kein direktes Lesen von mockData in Components — immer über analytics-Funktionen.

### Vergütungsmodell
- Typ: `Compensation` in `types.ts` — kein `monthly_cost_eur` (abgeschafft)
- Berechnung: `computeActualCost(compensation, netRevenue)` in `analytics.ts`
- Modelle: `fixed | commission | hybrid | per_post | barter`
- Editierbar via Modal in `CompensationEditor.tsx` mit optimistic update

---

## Datenmodell (aktueller Stand)

```ts
interface Order {
  id: string
  influencer_id: string
  order_date: string           // ISO "YYYY-MM-DD"
  gross_value_eur: number
  return_type: "none" | "full" | "partial"   // Sprint 2A
  return_value_eur: number     // 0 / voll / Teilbetrag
  product_category: string
  item_count: number
  order_source: "influencer" | "meta_ads" | "organic"  // Sprint 2A
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
}
```

**Wichtig:** `is_returned: boolean` existiert nicht mehr — wurde in Sprint 2A durch `return_type` ersetzt.

---

## Sprint-Roadmap

### Abgeschlossen
- **Sprint 1:** MVP — KPI-Cards, Influencer-Tabelle, Detail-Seite, Kampagnen-View
- **Sprint 1B:** Multi-Page SaaS Layout, Sidebar, DateRange via URL
- **Sprint 1C:** Flexible Vergütungsmodelle (`Compensation`-Typ, `computeActualCost`)
- **Sprint 1D:** Editable Compensation Modal (optimistic state)
- **Sprint 2A:** `order_source` + `return_type: "none"|"full"|"partial"` (statt `is_returned: boolean`)
- **Sprint 2B:** Attribution-UI — `AttributionAlert` + `AttributionOverview`, Quelle-Filter in Orders, Return-Split im KPI

### Nächste Schritte — Sprint 3 (Supabase)

### Sprint 3 (Supabase)
- Supabase-Schema aus aktuellem `types.ts` ableiten
- Mock-Daten durch echte Queries ersetzen
- Shopify-Tags → `return_type` Mapping
- `order_source` via Shopify-Metafelder oder UTM-Attribution befüllen

---

## Datei-Übersicht

```
src/
├── app/
│   ├── page.tsx                    # Dashboard (Server)
│   ├── influencer/
│   │   ├── page.tsx                # Influencer-Liste (Server)
│   │   └── [id]/page.tsx           # Influencer-Detail (Server)
│   ├── kampagnen/page.tsx          # Kampagnen-View (Server)
│   └── api/influencers/            # API Routes (für Client-seitige Updates)
├── components/
│   ├── layout/Shell.tsx            # Client — Sidebar collapsed state
│   ├── InfluencerDetailClient.tsx  # Client — optimistic state
│   ├── CompensationEditor.tsx      # Client — Modal
│   └── ...                         # Alle anderen: reine Render-Components
└── lib/
    ├── types.ts                    # Alle Typen — Single source of truth
    ├── mockData.ts                 # INFLUENCERS + ORDERS arrays
    ├── analytics.ts                # Alle Berechnungen
    ├── constants.ts                # NAV_ITEMS, DACH_RETURN_BENCHMARKS, CHART_COLORS, REFERENCE_DATE
    └── formatters.ts               # formatEUR, formatDate, etc.
```

---

## Konventionen

- Keine neuen Abhängigkeiten ohne Grund — der Stack ist bewusst schlank
- Neue Felder zuerst in `types.ts`, dann `mockData.ts`, dann `analytics.ts`, dann UI
- Deutsche UI-Texte (Produkt ist für DACH-Markt)
- `npm run build` muss nach jeder Änderung grün sein — TypeScript-Fehler nie committen
- Commit-Format: `feat:`, `fix:`, `refactor:` — kein Scope nötig außer bei großen Bereichen
