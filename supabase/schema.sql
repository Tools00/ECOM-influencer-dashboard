-- ============================================================
-- ECOM Influencer Dashboard — Supabase Schema
-- Sprint 3A · Region: EU
-- ============================================================

-- ─── influencers ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS influencers (
  id                    TEXT PRIMARY KEY,
  name                  TEXT        NOT NULL,
  handle                TEXT        NOT NULL,
  platform              TEXT        NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  niche                 TEXT        NOT NULL,
  discount_code         TEXT        NOT NULL UNIQUE,
  followers             INTEGER     NOT NULL DEFAULT 0,
  campaign_name         TEXT        NOT NULL,
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  contract_start_date   TEXT,                          -- ISO "YYYY-MM-DD"

  -- Compensation (geflacht — Verlauf via compensation_history in Sprint 3B)
  comp_type             TEXT        NOT NULL CHECK (comp_type IN ('fixed', 'commission', 'hybrid', 'per_post', 'barter')),
  comp_interval         TEXT        CHECK (comp_interval IN ('monthly', 'weekly', 'biweekly')),
  comp_fixed_eur        NUMERIC(10,2),
  comp_commission_pct   NUMERIC(5,2),
  comp_per_post_eur     NUMERIC(10,2),
  comp_posts_count      INTEGER,
  comp_start_date       TEXT,                          -- ISO "YYYY-MM-DD"

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── orders ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT        PRIMARY KEY,
  influencer_id       TEXT        NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  order_date          TEXT        NOT NULL,            -- ISO "YYYY-MM-DD"
  gross_value_eur     NUMERIC(10,2) NOT NULL,
  return_type         TEXT        NOT NULL DEFAULT 'none' CHECK (return_type IN ('none', 'full', 'partial')),
  return_value_eur    NUMERIC(10,2) NOT NULL DEFAULT 0,
  product_category    TEXT        NOT NULL,
  item_count          INTEGER     NOT NULL DEFAULT 1,
  order_source        TEXT        NOT NULL DEFAULT 'influencer' CHECK (order_source IN ('influencer', 'meta_ads', 'organic')),
  shopify_order_id    TEXT,                            -- Shopify Order ID (Sprint 3B)
  customer_id         TEXT,                            -- Shopify Customer ID (Sprint 3B)
  return_date         TEXT,                            -- ISO "YYYY-MM-DD" (Sprint 3B)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indizes für Performance ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_influencer_id ON orders(influencer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date    ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_source  ON orders(order_source);
CREATE INDEX IF NOT EXISTS idx_orders_return_type   ON orders(return_type);

-- ─── updated_at Trigger ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── RLS — intern, kein öffentlicher Zugriff ─────────────────
-- Dashboard ist intern → RLS deaktiviert (kein Auth in Sprint 3A)
-- Sprint 4: RLS + Auth einschalten

ALTER TABLE influencers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders      DISABLE ROW LEVEL SECURITY;
