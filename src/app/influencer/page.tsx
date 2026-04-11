import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import { computeInfluencerStats } from "@/lib/analytics";
import { Header } from "@/components/layout/Header";
import { CSVExportButton } from "@/components/CSVExportButton";
import { NewInfluencerButton } from "@/components/NewInfluencerModal";
import { InfluencerListClient } from "@/components/InfluencerListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InfluencerListPage() {
  const [influencers, orders] = await Promise.all([
    fetchInfluencers(),
    fetchOrders(),
  ]);

  const stats = influencers.map((inf) => computeInfluencerStats(inf, orders));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <h1 className="text-sm font-semibold text-gray-800">Influencer</h1>
        <div className="flex items-center gap-2">
          <NewInfluencerButton />
          <CSVExportButton stats={stats} />
        </div>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
        <InfluencerListClient initialStats={stats} />
      </main>
    </div>
  );
}
