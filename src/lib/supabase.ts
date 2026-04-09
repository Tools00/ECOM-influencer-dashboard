import { createClient } from "@supabase/supabase-js";
import { Influencer, Order } from "./types";
import { INFLUENCERS, ORDERS } from "./mockData";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useMock = process.env.USE_MOCK_DATA === "true" || !supabaseUrl || !supabaseKey;

export const supabase = useMock
  ? null
  : createClient(supabaseUrl!, supabaseKey!);

export async function fetchInfluencers(): Promise<Influencer[]> {
  if (useMock || !supabase) return INFLUENCERS;

  const { data, error } = await supabase.from("influencers").select("*");
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data as Influencer[];
}

export async function fetchOrders(): Promise<Order[]> {
  if (useMock || !supabase) return ORDERS;

  const { data, error } = await supabase.from("orders").select("*");
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data as Order[];
}
