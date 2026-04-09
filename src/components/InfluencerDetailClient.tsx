"use client";

import { useState } from "react";
import { InfluencerStats, Compensation } from "@/lib/types";
import { InfluencerProfileCard } from "./InfluencerProfileCard";
import { CompensationEditor } from "./CompensationEditor";

interface Props {
  stats: InfluencerStats;
}

export function InfluencerDetailClient({ stats: initialStats }: Props) {
  const [stats, setStats] = useState(initialStats);

  function handleCompensationSave(updated: Compensation) {
    setStats((prev) => ({
      ...prev,
      influencer: { ...prev.influencer, compensation: updated },
    }));
  }

  return (
    <div className="space-y-2">
      <InfluencerProfileCard stats={stats} />
      <div className="flex justify-end px-1">
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
