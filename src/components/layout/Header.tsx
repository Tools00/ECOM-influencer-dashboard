import { ReactNode } from "react";
import { REFERENCE_DATE } from "@/lib/constants";

interface Props {
  children?: ReactNode;
}

export function Header({ children }: Props) {
  const updated = new Date(REFERENCE_DATE).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">{children}</div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">Stand: {updated}</span>
        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
          Live-Daten
        </span>
      </div>
    </header>
  );
}
