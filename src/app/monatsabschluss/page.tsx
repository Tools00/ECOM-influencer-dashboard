import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import { computeMonthlyStats } from "@/lib/analytics";
import { MonatsabschlussClient } from "@/components/MonatsabschlussClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

function isValidMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}$/.test(v);
}

export default async function MonatsabschlussPage({ searchParams }: Props) {
  const params = await searchParams;
  const month = isValidMonth(params.month)
    ? params.month
    : new Date().toISOString().slice(0, 7);

  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const report = computeMonthlyStats(influencers, orders, month);

  return <MonatsabschlussClient report={report} />;
}
