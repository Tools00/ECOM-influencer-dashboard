"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InfluencerDetailError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Influencer-Detail-Fehler:", error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Influencer konnte nicht geladen werden</h2>
          <p className="text-xs text-gray-400 mt-1">
            Daten nicht verfügbar oder Verbindungsfehler.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/influencer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={13} />
            Zurück zur Liste
          </Link>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-xs font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw size={13} />
            Erneut versuchen
          </button>
        </div>
      </div>
    </div>
  );
}
