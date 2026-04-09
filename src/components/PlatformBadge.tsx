import clsx from "clsx";
import { Platform } from "@/lib/types";

const config: Record<Platform, { label: string; className: string }> = {
  instagram: { label: "Instagram", className: "bg-pink-100 text-pink-700" },
  tiktok: { label: "TikTok", className: "bg-gray-900 text-white" },
  youtube: { label: "YouTube", className: "bg-red-100 text-red-700" },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, className } = config[platform];
  return (
    <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", className)}>
      {label}
    </span>
  );
}
