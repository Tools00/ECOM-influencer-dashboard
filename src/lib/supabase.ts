import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Influencer, Order } from "./types";
import { INFLUENCERS, ORDERS } from "./mockData";

// ─── Client ────────────────────────────────────────────────

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useMock      = process.env.USE_MOCK_DATA === "true" || !supabaseUrl || !supabaseKey;

export const supabase = useMock
  ? null
  : createClient(supabaseUrl!, supabaseKey!);

// ─── Zod Schemas (DB-Zeilen → TypeScript) ──────────────────

const InfluencerRowSchema = z.object({
  id:                   z.string(),
  name:                 z.string(),
  handle:               z.string(),
  platform:             z.enum(["instagram", "tiktok", "youtube"]),
  niche:                z.string(),
  discount_code:        z.string(),
  followers:            z.number().int(),
  campaign_name:        z.string(),
  is_active:            z.boolean(),
  contract_start_date:  z.string().nullable().optional(),
  comp_type:            z.enum(["fixed", "commission", "hybrid", "per_post", "barter"]),
  comp_interval:        z.enum(["monthly", "weekly", "biweekly"]).nullable().optional(),
  comp_fixed_eur:       z.number().nullable().optional(),
  comp_commission_pct:  z.number().nullable().optional(),
  comp_per_post_eur:    z.number().nullable().optional(),
  comp_posts_count:     z.number().int().nullable().optional(),
  comp_start_date:      z.string().nullable().optional(),
}).transform((row): Influencer => ({
  id:                   row.id,
  name:                 row.name,
  handle:               row.handle,
  platform:             row.platform,
  niche:                row.niche,
  discount_code:        row.discount_code,
  followers:            row.followers,
  campaign_name:        row.campaign_name,
  is_active:            row.is_active,
  contract_start_date:  row.contract_start_date ?? undefined,
  compensation: {
    type:           row.comp_type,
    interval:       row.comp_interval ?? undefined,
    fixed_eur:      row.comp_fixed_eur ?? undefined,
    commission_pct: row.comp_commission_pct ?? undefined,
    per_post_eur:   row.comp_per_post_eur ?? undefined,
    posts_count:    row.comp_posts_count ?? undefined,
    start_date:     row.comp_start_date ?? undefined,
  },
}));

const OrderRowSchema = z.object({
  id:               z.string(),
  influencer_id:    z.string(),
  order_date:       z.string(),
  gross_value_eur:  z.number(),
  return_type:      z.enum(["none", "full", "partial"]),
  return_value_eur: z.number(),
  product_category: z.string(),
  item_count:       z.number().int(),
  order_source:     z.enum(["influencer", "meta_ads", "organic"]),
  shopify_order_id: z.string().nullable().optional(),
  customer_id:      z.string().nullable().optional(),
  return_date:      z.string().nullable().optional(),
}).transform((row): Order => ({
  id:               row.id,
  influencer_id:    row.influencer_id,
  order_date:       row.order_date,
  gross_value_eur:  row.gross_value_eur,
  return_type:      row.return_type,
  return_value_eur: row.return_value_eur,
  product_category: row.product_category,
  item_count:       row.item_count,
  order_source:     row.order_source,
  shopify_order_id: row.shopify_order_id ?? undefined,
  customer_id:      row.customer_id ?? undefined,
  return_date:      row.return_date ?? undefined,
}));

const InfluencersSchema = z.array(InfluencerRowSchema);
const OrdersSchema      = z.array(OrderRowSchema);

// ─── Fetch-Funktionen ──────────────────────────────────────

export async function fetchInfluencers(): Promise<Influencer[]> {
  if (useMock || !supabase) return INFLUENCERS;

  const { data, error } = await supabase
    .from("influencers")
    .select("*")
    .order("name");

  if (error) throw new Error(`Supabase fetchInfluencers: ${error.message}`);

  const parsed = InfluencersSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Supabase Validierungsfehler (influencers):", parsed.error.flatten());
    throw new Error("Ungültige Daten von Supabase (influencers)");
  }
  return parsed.data;
}

export async function fetchOrders(): Promise<Order[]> {
  if (useMock || !supabase) return ORDERS;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("order_date", { ascending: true });

  if (error) throw new Error(`Supabase fetchOrders: ${error.message}`);

  const parsed = OrdersSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Supabase Validierungsfehler (orders):", parsed.error.flatten());
    throw new Error("Ungültige Daten von Supabase (orders)");
  }
  return parsed.data;
}

// ─── Compensation Update (für CompensationEditor) ──────────

export async function updateCompensation(
  influencerId: string,
  compensation: Influencer["compensation"]
): Promise<void> {
  if (useMock || !supabase) return; // Mock: kein Persist nötig

  const { error } = await supabase
    .from("influencers")
    .update({
      comp_type:           compensation.type,
      comp_interval:       compensation.interval ?? null,
      comp_fixed_eur:      compensation.fixed_eur ?? null,
      comp_commission_pct: compensation.commission_pct ?? null,
      comp_per_post_eur:   compensation.per_post_eur ?? null,
      comp_posts_count:    compensation.posts_count ?? null,
      comp_start_date:     compensation.start_date ?? null,
    })
    .eq("id", influencerId);

  if (error) throw new Error(`Supabase updateCompensation: ${error.message}`);
}
