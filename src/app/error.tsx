"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Dashboard-Fehler:", error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Daten konnten nicht geladen werden</h2>
          <p className="text-xs text-gray-400 mt-1">
            {error.message.includes("Supabase")
              ? "Verbindung zur Datenbank fehlgeschlagen."
              : "Ein unerwarteter Fehler ist aufgetreten."}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 text-xs font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw size={13} />
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
