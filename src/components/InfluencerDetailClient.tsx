"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InfluencerStats, Compensation } from "@/lib/types";
import { InfluencerProfileCard } from "./InfluencerProfileCard";
import { CompensationEditor } from "./CompensationEditor";
import { PowerOff, Loader2 } from "lucide-react";

interface Props {
  stats: InfluencerStats;
}

export function InfluencerDetailClient({ stats: initialStats }: Props) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [deactivating, setDeactivating] = useState(false);

  function handleCompensationSave(updated: Compensation) {
    setStats((prev) => ({
      ...prev,
      influencer: { ...prev.influencer, compensation: updated },
    }));
  }

  async function handleDeactivate() {
    if (!confirm(`${stats.influencer.name} wirklich deaktivieren?`)) return;
    setDeactivating(true);
    try {
      await fetch(`/api/influencers/${stats.influencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });
      router.push("/influencer");
      router.refresh();
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-2">
      <InfluencerProfileCard stats={stats} />
      <div className="flex items-center justify-end gap-3 px-1">
        {stats.influencer.is_active && (
          <button
            onClick={handleDeactivate}
            disabled={deactivating}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {deactivating
              ? <Loader2 size={13} className="animate-spin" />
              : <PowerOff size={13} />}
            Deaktivieren
          </button>
        )}
        <CompensationEditor
          influencerId={stats.influencer.id}
          influencerName={stats.influencer.name}
          current={stats.influencer.compensation}
          onSave={handleCompensationSave}
        />
      </div>
    </div>
  );
}
