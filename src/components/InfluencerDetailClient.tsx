"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InfluencerStats, Compensation, Influencer } from "@/lib/types";
import { InfluencerProfileCard } from "./InfluencerProfileCard";
import { CompensationEditor } from "./CompensationEditor";
import { EditInfluencerButton } from "./NewInfluencerModal";
import { PowerOff, Power, Loader2 } from "lucide-react";

interface Props {
  stats: InfluencerStats;
}

export function InfluencerDetailClient({ stats: initialStats }: Props) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [toggling, setToggling] = useState(false);

  function handleCompensationSave(updated: Compensation) {
    setStats((prev) => ({
      ...prev,
      influencer: { ...prev.influencer, compensation: updated },
    }));
  }

  function handleInfluencerSaved(updated: Influencer) {
    setStats((prev) => ({ ...prev, influencer: updated }));
  }

  async function handleToggleActive() {
    const nextActive = !stats.influencer.is_active;
    const label = nextActive ? "reaktivieren" : "deaktivieren";
    if (!confirm(`${stats.influencer.name} wirklich ${label}?`)) return;

    setToggling(true);
    try {
      await fetch(`/api/influencers/${stats.influencer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (!nextActive) {
        router.push("/influencer");
        router.refresh();
      } else {
        setStats((prev) => ({
          ...prev,
          influencer: { ...prev.influencer, is_active: true },
        }));
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  }

  const isActive = stats.influencer.is_active;

  return (
    <div className="space-y-2">
      <InfluencerProfileCard stats={stats} />
      <div className="flex items-center justify-end gap-3 px-1">

        {/* Aktiv / Inaktiv Toggle */}
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            isActive
              ? "text-gray-400 hover:text-red-500"
              : "text-amber-500 hover:text-emerald-600"
          }`}
        >
          {toggling
            ? <Loader2 size={13} className="animate-spin" />
            : isActive ? <PowerOff size={13} /> : <Power size={13} />}
          {isActive ? "Deaktivieren" : "Reaktivieren"}
        </button>

        {/* Bearbeiten */}
        <EditInfluencerButton
          influencer={stats.influencer}
          onSaved={handleInfluencerSaved}
        />

        {/* Vergütung */}
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
