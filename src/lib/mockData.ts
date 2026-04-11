import { Influencer, Order, OrderSource, ReturnType } from "./types";

export const INFLUENCERS: Influencer[] = [
  {
    id: "inf_001",
    name: "Sophie Müller",
    handle: "@sophiestyle",
    platform: "instagram",
    niche: "Fashion & Lifestyle",
    discount_code: "SOPHIE10",
    followers: 85000,
    campaign_name: "Frühjahrskampagne Q1",
    compensation: {
      type: "fixed",
      interval: "monthly",
      fixed_eur: 500,
      start_date: "2024-01-01",
    },
    is_active: true, tags: [],
    contract_start_date: "2024-01-01",
  },
  {
    id: "inf_002",
    name: "Max Bauer",
    handle: "@maxlifts",
    platform: "tiktok",
    niche: "Fitness & Sport",
    discount_code: "MAX15",
    followers: 220000,
    campaign_name: "Fitness Launch",
    compensation: {
      type: "commission",
      commission_pct: 12,
      start_date: "2024-01-01",
    },
    is_active: true, tags: [],
    contract_start_date: "2024-01-01",
  },
  {
    id: "inf_003",
    name: "Lisa Hoffmann",
    handle: "@lisacooks",
    platform: "instagram",
    niche: "Food & Kochen",
    discount_code: "LISA10",
    followers: 47000,
    campaign_name: "Foodie Collab",
    compensation: {
      type: "hybrid",
      interval: "monthly",
      fixed_eur: 200,
      commission_pct: 8,
      start_date: "2024-01-01",
    },
    is_active: true, tags: [],
    contract_start_date: "2024-01-01",
  },
  {
    id: "inf_004",
    name: "Thomas Wagner",
    handle: "@tomtech",
    platform: "youtube",
    niche: "Tech & Gadgets",
    discount_code: "TOM20",
    followers: 125000,
    campaign_name: "Tech Review Sprint",
    compensation: {
      type: "per_post",
      per_post_eur: 300,
      posts_count: 3,
      start_date: "2024-01-01",
    },
    is_active: true, tags: [],
    contract_start_date: "2024-01-01",
  },
  {
    id: "inf_005",
    name: "Anna Schmidt",
    handle: "@annaglow",
    platform: "instagram",
    niche: "Beauty & Skincare",
    discount_code: "ANNA10",
    followers: 183000,
    campaign_name: "Frühjahrskampagne Q1",
    compensation: {
      type: "hybrid",
      interval: "monthly",
      fixed_eur: 300,
      commission_pct: 5,
      start_date: "2024-01-01",
    },
    is_active: true, tags: [],
    contract_start_date: "2024-01-01",
  },
];

// Helper: deterministic order generation
// returned: false → "none", true → "full", "partial" → "partial" (50% of value)
function o(
  id: string,
  infId: string,
  date: string,
  value: number,
  returned: boolean | "partial",
  category: string,
  items: number = 1,
  source: OrderSource = "influencer"
): Order {
  const return_type: ReturnType = returned === "partial" ? "partial" : returned ? "full" : "none";
  const return_value_eur = returned === "partial" ? Math.round(value * 0.5 * 100) / 100 : returned ? value : 0;
  return {
    id,
    influencer_id: infId,
    order_date: date,
    gross_value_eur: value,
    return_type,
    return_value_eur,
    product_category: category,
    item_count: items,
    order_source: source,
  };
}

export const ORDERS: Order[] = [
  // ══════════════════════════════════════════
  // JANUAR 2024 — niedrigstes Volumen (Nachsaison)
  // ══════════════════════════════════════════

  // Sophie Müller – Jan (8 orders)
  o("ord_j01", "inf_001", "2024-01-03", 89.99, false, "Kleidung"),
  o("ord_j02", "inf_001", "2024-01-06", 59.90, false, "Accessoires"),
  o("ord_j03", "inf_001", "2024-01-10", 149.00, "partial", "Kleidung"),
  o("ord_j04", "inf_001", "2024-01-14", 79.90, false, "Schuhe"),
  o("ord_j05", "inf_001", "2024-01-18", 199.00, false, "Kleidung", 2),
  o("ord_j06", "inf_001", "2024-01-22", 64.90, true, "Accessoires", 1, "meta_ads"),
  o("ord_j07", "inf_001", "2024-01-26", 119.00, false, "Kleidung"),
  o("ord_j08", "inf_001", "2024-01-30", 89.90, false, "Schuhe"),

  // Max Bauer – Jan (10 orders)
  o("ord_j09", "inf_002", "2024-01-02", 49.99, false, "Sportswear", 1, "meta_ads"),
  o("ord_j10", "inf_002", "2024-01-05", 34.99, false, "Supplements", 1, "organic"),
  o("ord_j11", "inf_002", "2024-01-08", 69.90, false, "Sportswear"),
  o("ord_j12", "inf_002", "2024-01-11", 44.99, false, "Supplements"),
  o("ord_j13", "inf_002", "2024-01-14", 89.00, false, "Equipment"),
  o("ord_j14", "inf_002", "2024-01-17", 54.99, false, "Yoga"),
  o("ord_j15", "inf_002", "2024-01-20", 59.90, false, "Sportswear"),
  o("ord_j16", "inf_002", "2024-01-23", 39.99, false, "Supplements"),
  o("ord_j17", "inf_002", "2024-01-26", 79.90, "partial", "Equipment"),
  o("ord_j18", "inf_002", "2024-01-29", 44.99, false, "Yoga"),

  // Lisa Hoffmann – Jan (6 orders)
  o("ord_j19", "inf_003", "2024-01-04", 34.99, false, "Kochbücher"),
  o("ord_j20", "inf_003", "2024-01-10", 79.90, false, "Kochutensilien"),
  o("ord_j21", "inf_003", "2024-01-15", 24.90, false, "Gewürze"),
  o("ord_j22", "inf_003", "2024-01-20", 44.99, false, "Kochbücher"),
  o("ord_j23", "inf_003", "2024-01-25", 89.00, false, "Kochutensilien"),
  o("ord_j24", "inf_003", "2024-01-30", 34.90, false, "Gewürze"),

  // Thomas Wagner – Jan (5 orders)
  o("ord_j25", "inf_004", "2024-01-05", 299.00, false, "Smartphones"),
  o("ord_j26", "inf_004", "2024-01-12", 149.00, false, "Zubehör"),
  o("ord_j27", "inf_004", "2024-01-18", 449.00, true, "Laptops"),
  o("ord_j28", "inf_004", "2024-01-24", 89.00, false, "Audio"),
  o("ord_j29", "inf_004", "2024-01-30", 199.00, false, "Smartphones"),

  // Anna Schmidt – Jan (8 orders)
  o("ord_j30", "inf_005", "2024-01-02", 59.90, false, "Skincare"),
  o("ord_j31", "inf_005", "2024-01-06", 79.00, true, "Make-up"),
  o("ord_j32", "inf_005", "2024-01-10", 44.99, false, "Haarpflege"),
  o("ord_j33", "inf_005", "2024-01-14", 99.00, false, "Skincare"),
  o("ord_j34", "inf_005", "2024-01-18", 69.90, true, "Make-up"),
  o("ord_j35", "inf_005", "2024-01-22", 54.99, false, "Skincare"),
  o("ord_j36", "inf_005", "2024-01-26", 119.00, true, "Skincare"),
  o("ord_j37", "inf_005", "2024-01-30", 44.99, false, "Haarpflege"),

  // ══════════════════════════════════════════
  // FEBRUAR 2024 — mittleres Volumen (Anlauf)
  // ══════════════════════════════════════════

  // Sophie Müller – Feb (12 orders)
  o("ord_f01", "inf_001", "2024-02-01", 109.00, false, "Kleidung"),
  o("ord_f02", "inf_001", "2024-02-03", 79.90, false, "Accessoires"),
  o("ord_f03", "inf_001", "2024-02-06", 159.00, "partial", "Kleidung"),
  o("ord_f04", "inf_001", "2024-02-08", 89.99, false, "Schuhe"),
  o("ord_f05", "inf_001", "2024-02-10", 199.00, false, "Kleidung", 2),
  o("ord_f06", "inf_001", "2024-02-13", 69.90, false, "Accessoires"),
  o("ord_f07", "inf_001", "2024-02-15", 129.00, false, "Kleidung"),
  o("ord_f08", "inf_001", "2024-02-18", 249.00, true, "Kleidung", 3),
  o("ord_f09", "inf_001", "2024-02-20", 59.90, false, "Schuhe"),
  o("ord_f10", "inf_001", "2024-02-23", 89.00, false, "Kleidung"),
  o("ord_f11", "inf_001", "2024-02-26", 139.00, false, "Kleidung"),
  o("ord_f12", "inf_001", "2024-02-28", 94.90, false, "Accessoires"),

  // Max Bauer – Feb (15 orders)
  o("ord_f13", "inf_002", "2024-02-01", 54.99, false, "Sportswear", 1, "meta_ads"),
  o("ord_f14", "inf_002", "2024-02-03", 89.00, false, "Equipment", 1, "meta_ads"),
  o("ord_f15", "inf_002", "2024-02-05", 44.99, false, "Supplements"),
  o("ord_f16", "inf_002", "2024-02-07", 69.90, false, "Sportswear"),
  o("ord_f17", "inf_002", "2024-02-09", 34.99, false, "Yoga"),
  o("ord_f18", "inf_002", "2024-02-11", 59.90, false, "Sportswear"),
  o("ord_f19", "inf_002", "2024-02-13", 49.99, false, "Supplements"),
  o("ord_f20", "inf_002", "2024-02-15", 79.90, false, "Equipment"),
  o("ord_f21", "inf_002", "2024-02-17", 44.99, false, "Supplements"),
  o("ord_f22", "inf_002", "2024-02-19", 64.90, false, "Sportswear"),
  o("ord_f23", "inf_002", "2024-02-21", 54.99, false, "Yoga"),
  o("ord_f24", "inf_002", "2024-02-23", 89.00, "partial", "Equipment"),
  o("ord_f25", "inf_002", "2024-02-25", 39.99, false, "Supplements"),
  o("ord_f26", "inf_002", "2024-02-27", 69.90, false, "Sportswear"),
  o("ord_f27", "inf_002", "2024-02-28", 49.99, false, "Supplements"),

  // Lisa Hoffmann – Feb (8 orders)
  o("ord_f28", "inf_003", "2024-02-02", 44.99, false, "Kochbücher"),
  o("ord_f29", "inf_003", "2024-02-06", 89.00, false, "Kochutensilien"),
  o("ord_f30", "inf_003", "2024-02-10", 29.90, false, "Gewürze"),
  o("ord_f31", "inf_003", "2024-02-14", 64.99, false, "Kochutensilien"),
  o("ord_f32", "inf_003", "2024-02-18", 34.99, false, "Kochbücher"),
  o("ord_f33", "inf_003", "2024-02-22", 109.00, true, "Kochutensilien"),
  o("ord_f34", "inf_003", "2024-02-25", 39.90, false, "Gewürze"),
  o("ord_f35", "inf_003", "2024-02-28", 74.90, false, "Kochutensilien"),

  // Thomas Wagner – Feb (7 orders)
  o("ord_f36", "inf_004", "2024-02-02", 349.00, false, "Smartphones"),
  o("ord_f37", "inf_004", "2024-02-06", 179.00, false, "Zubehör"),
  o("ord_f38", "inf_004", "2024-02-10", 529.00, true, "Laptops"),
  o("ord_f39", "inf_004", "2024-02-14", 129.00, false, "Audio"),
  o("ord_f40", "inf_004", "2024-02-18", 249.00, false, "Smartphones"),
  o("ord_f41", "inf_004", "2024-02-22", 89.00, false, "Zubehör"),
  o("ord_f42", "inf_004", "2024-02-27", 379.00, false, "Laptops"),

  // Anna Schmidt – Feb (11 orders)
  o("ord_f43", "inf_005", "2024-02-01", 69.90, false, "Skincare"),
  o("ord_f44", "inf_005", "2024-02-04", 89.00, true, "Make-up"),
  o("ord_f45", "inf_005", "2024-02-07", 54.99, false, "Haarpflege"),
  o("ord_f46", "inf_005", "2024-02-10", 119.00, false, "Skincare"),
  o("ord_f47", "inf_005", "2024-02-13", 79.90, true, "Make-up"),
  o("ord_f48", "inf_005", "2024-02-15", 44.99, false, "Skincare"),
  o("ord_f49", "inf_005", "2024-02-18", 99.00, false, "Skincare"),
  o("ord_f50", "inf_005", "2024-02-20", 64.90, false, "Haarpflege"),
  o("ord_f51", "inf_005", "2024-02-23", 149.00, true, "Skincare"),
  o("ord_f52", "inf_005", "2024-02-26", 39.99, false, "Make-up"),
  o("ord_f53", "inf_005", "2024-02-28", 89.00, false, "Skincare"),

  // ══════════════════════════════════════════
  // MÄRZ 2024 — höchstes Volumen (Peak)
  // ══════════════════════════════════════════

  // Sophie Müller – Mar (18 orders)
  o("ord_001", "inf_001", "2024-03-01", 89.99, false, "Kleidung"),
  o("ord_002", "inf_001", "2024-03-03", 124.50, true, "Kleidung"),
  o("ord_003", "inf_001", "2024-03-05", 59.99, false, "Accessoires"),
  o("ord_004", "inf_001", "2024-03-07", 199.00, false, "Kleidung", 2),
  o("ord_005", "inf_001", "2024-03-09", 79.90, true, "Schuhe"),
  o("ord_006", "inf_001", "2024-03-12", 149.00, false, "Kleidung"),
  o("ord_007", "inf_001", "2024-03-14", 89.99, false, "Kleidung"),
  o("ord_008", "inf_001", "2024-03-17", 220.00, false, "Kleidung", 3),
  o("ord_009", "inf_001", "2024-03-19", 64.90, false, "Accessoires"),
  o("ord_010", "inf_001", "2024-03-21", 109.00, true, "Kleidung"),
  o("ord_011", "inf_001", "2024-03-22", 89.90, false, "Schuhe"),
  o("ord_012", "inf_001", "2024-03-24", 175.00, false, "Kleidung", 2),
  o("ord_013", "inf_001", "2024-03-26", 95.00, false, "Accessoires"),
  o("ord_014", "inf_001", "2024-03-27", 139.00, false, "Kleidung"),
  o("ord_015", "inf_001", "2024-03-28", 59.90, false, "Accessoires"),
  o("ord_016", "inf_001", "2024-03-29", 249.00, true, "Kleidung", 3),
  o("ord_017", "inf_001", "2024-03-30", 89.00, false, "Kleidung"),
  o("ord_018", "inf_001", "2024-03-31", 119.90, false, "Schuhe"),

  // Max Bauer – Mar (22 orders)
  o("ord_019", "inf_002", "2024-03-01", 49.99, false, "Sportswear", 1, "meta_ads"),
  o("ord_020", "inf_002", "2024-03-02", 89.00, false, "Supplements", 1, "organic"),
  o("ord_021", "inf_002", "2024-03-04", 59.90, false, "Sportswear"),
  o("ord_022", "inf_002", "2024-03-05", 44.99, false, "Supplements"),
  o("ord_023", "inf_002", "2024-03-06", 79.90, true, "Sportswear"),
  o("ord_024", "inf_002", "2024-03-08", 54.99, false, "Supplements"),
  o("ord_025", "inf_002", "2024-03-10", 69.90, false, "Yoga"),
  o("ord_026", "inf_002", "2024-03-11", 89.00, false, "Equipment"),
  o("ord_027", "inf_002", "2024-03-13", 34.99, false, "Supplements"),
  o("ord_028", "inf_002", "2024-03-14", 59.90, false, "Sportswear"),
  o("ord_029", "inf_002", "2024-03-15", 44.99, false, "Supplements"),
  o("ord_030", "inf_002", "2024-03-16", 74.90, false, "Equipment"),
  o("ord_031", "inf_002", "2024-03-18", 49.99, false, "Yoga"),
  o("ord_032", "inf_002", "2024-03-19", 89.00, false, "Supplements"),
  o("ord_033", "inf_002", "2024-03-20", 59.90, false, "Sportswear"),
  o("ord_034", "inf_002", "2024-03-22", 39.99, false, "Supplements"),
  o("ord_035", "inf_002", "2024-03-24", 69.90, false, "Sportswear"),
  o("ord_036", "inf_002", "2024-03-25", 84.99, false, "Equipment"),
  o("ord_037", "inf_002", "2024-03-26", 54.99, false, "Yoga"),
  o("ord_038", "inf_002", "2024-03-28", 79.90, false, "Sportswear"),
  o("ord_039", "inf_002", "2024-03-29", 44.99, false, "Supplements"),
  o("ord_040", "inf_002", "2024-03-31", 59.90, false, "Sportswear"),

  // Lisa Hoffmann – Mar (12 orders)
  o("ord_041", "inf_003", "2024-03-03", 34.99, false, "Kochbücher"),
  o("ord_042", "inf_003", "2024-03-06", 79.90, false, "Kochutensilien"),
  o("ord_043", "inf_003", "2024-03-09", 44.99, false, "Kochbücher"),
  o("ord_044", "inf_003", "2024-03-12", 129.00, false, "Kochutensilien", 2),
  o("ord_045", "inf_003", "2024-03-14", 34.99, false, "Gewürze"),
  o("ord_046", "inf_003", "2024-03-16", 59.90, true, "Kochutensilien"),
  o("ord_047", "inf_003", "2024-03-19", 89.00, false, "Kochutensilien"),
  o("ord_048", "inf_003", "2024-03-22", 44.99, false, "Kochbücher"),
  o("ord_049", "inf_003", "2024-03-24", 74.90, false, "Kochutensilien"),
  o("ord_050", "inf_003", "2024-03-26", 39.99, false, "Gewürze"),
  o("ord_051", "inf_003", "2024-03-28", 109.00, false, "Kochutensilien"),
  o("ord_052", "inf_003", "2024-03-30", 34.99, false, "Kochbücher"),

  // Thomas Wagner – Mar (10 orders)
  o("ord_053", "inf_004", "2024-03-02", 349.00, false, "Smartphones"),
  o("ord_054", "inf_004", "2024-03-05", 189.00, false, "Zubehör"),
  o("ord_055", "inf_004", "2024-03-08", 499.00, "partial", "Laptops"),
  o("ord_056", "inf_004", "2024-03-11", 279.00, false, "Smartphones"),
  o("ord_057", "inf_004", "2024-03-15", 149.00, false, "Audio"),
  o("ord_058", "inf_004", "2024-03-18", 599.00, true, "Laptops"),
  o("ord_059", "inf_004", "2024-03-21", 229.00, false, "Smartphones"),
  o("ord_060", "inf_004", "2024-03-24", 399.00, false, "Laptops"),
  o("ord_061", "inf_004", "2024-03-27", 189.00, false, "Zubehör"),
  o("ord_062", "inf_004", "2024-03-30", 319.00, false, "Audio"),

  // ── Meta Ads Overlap März (gleiche Codes, anderer Kanal) ──────────────────
  // Sophie SOPHIE10 via Meta Ads
  o("ord_m01", "inf_001", "2024-03-08",  94.90, false, "Kleidung",    1, "meta_ads"),
  o("ord_m02", "inf_001", "2024-03-16", 149.00, false, "Kleidung",    2, "meta_ads"),
  o("ord_m03", "inf_001", "2024-03-25",  79.90, false, "Accessoires", 1, "meta_ads"),
  // Max MAX15 via Meta Ads
  o("ord_m04", "inf_002", "2024-03-10",  54.99, false, "Sportswear",  1, "meta_ads"),
  o("ord_m05", "inf_002", "2024-03-20",  44.99, false, "Supplements", 1, "meta_ads"),
  // Anna ANNA10 via Meta Ads
  o("ord_m06", "inf_005", "2024-03-14",  89.00, false, "Skincare",    1, "meta_ads"),
  o("ord_m07", "inf_005", "2024-03-23",  64.90, false, "Make-up",     1, "meta_ads"),
  // Organic März (direkt / ohne Code-Zuweisung)
  o("ord_m08", "inf_002", "2024-03-17",  34.99, false, "Yoga",        1, "organic"),
  o("ord_m09", "inf_001", "2024-03-22",  59.90, false, "Schuhe",      1, "organic"),

  // Anna Schmidt – Mar (16 orders)
  o("ord_063", "inf_005", "2024-03-01", 69.90, false, "Skincare"),
  o("ord_064", "inf_005", "2024-03-03", 89.00, true, "Make-up"),
  o("ord_065", "inf_005", "2024-03-05", 54.99, false, "Haarpflege"),
  o("ord_066", "inf_005", "2024-03-07", 119.00, true, "Skincare"),
  o("ord_067", "inf_005", "2024-03-09", 79.90, false, "Make-up"),
  o("ord_068", "inf_005", "2024-03-11", 44.99, false, "Skincare"),
  o("ord_069", "inf_005", "2024-03-13", 149.00, true, "Skincare"),
  o("ord_070", "inf_005", "2024-03-15", 69.90, false, "Haarpflege"),
  o("ord_071", "inf_005", "2024-03-17", 89.00, false, "Skincare"),
  o("ord_072", "inf_005", "2024-03-19", 54.99, true, "Make-up"),
  o("ord_073", "inf_005", "2024-03-21", 79.90, false, "Skincare"),
  o("ord_074", "inf_005", "2024-03-23", 99.00, false, "Skincare"),
  o("ord_075", "inf_005", "2024-03-25", 44.99, false, "Make-up"),
  o("ord_076", "inf_005", "2024-03-27", 119.00, true, "Skincare"),
  o("ord_077", "inf_005", "2024-03-29", 69.90, false, "Haarpflege"),
  o("ord_078", "inf_005", "2024-03-31", 89.00, false, "Skincare"),
];
