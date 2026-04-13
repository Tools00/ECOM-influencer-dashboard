/**
 * Simulator-Konfiguration.
 * Liest seed-extension-config.json und typed die Struktur.
 */

import rawConfig from "../../scripts/seed-extension-config.json";

export interface InfluencerSim {
  code: string;
  name: string;
  platform: "instagram" | "tiktok" | "youtube";
  niches: Record<string, number>;
  avg_order_eur: number;
  orders_per_day: number;
  meta_overlap_rate: number;
  refund_rate: number;
}

export interface SimConfig {
  influencers: InfluencerSim[];
}

export function loadSimConfig(): SimConfig {
  return {
    influencers: rawConfig.influencers as unknown as InfluencerSim[],
  };
}

/**
 * Nischen → Produktkategorien Mapping.
 * Keys = product_type wie im Shopify Store.
 */
export const NICHE_CATEGORIES: Record<string, string[]> = {
  Fashion:   ["Fashion"],
  Beauty:    ["Beauty"],
  Fitness:   ["Fitness"],
  Food:      ["Food"],
  Tech:      ["Tech"],
  Gaming:    ["Gaming"],
  Lifestyle: ["Lifestyle"],
};
