import { Compensation, CompensationType } from "@/lib/types";
import { formatCompensation } from "@/lib/formatters";
import clsx from "clsx";

const config: Record<CompensationType, { label: string; className: string }> = {
  fixed:      { label: "Fixum",      className: "bg-blue-100 text-blue-700" },
  commission: { label: "Provision",  className: "bg-purple-100 text-purple-700" },
  hybrid:     { label: "Hybrid",     className: "bg-indigo-100 text-indigo-700" },
  per_post:   { label: "Per Post",   className: "bg-amber-100 text-amber-700" },
  barter:     { label: "Barter",     className: "bg-orange-100 text-orange-700" },
};

interface Props {
  compensation: Compensation;
  showDetail?: boolean;
}

export function CompensationBadge({ compensation, showDetail = false }: Props) {
  const { label, className } = config[compensation.type];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full", className)}>
        {label}
      </span>
      {showDetail && (
        <span className="text-xs text-gray-500">{formatCompensation(compensation)}</span>
      )}
    </div>
  );
}
