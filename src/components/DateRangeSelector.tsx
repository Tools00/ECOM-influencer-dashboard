"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { DateRange } from "@/lib/types";

const OPTIONS: { label: string; value: DateRange }[] = [
  { label: "7T", value: "7d" },
  { label: "30T", value: "30d" },
  { label: "90T", value: "90d" },
  { label: "Gesamt", value: "all" },
];

interface Props {
  current: DateRange;
}

export function DateRangeSelector({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(range: DateRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => select(opt.value)}
          className={clsx(
            "px-3 py-1 text-xs font-medium rounded-md transition-all",
            current === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
