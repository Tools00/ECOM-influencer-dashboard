"use client";

import { useEffect, useState, useCallback } from "react";
import { formatEUR } from "@/lib/formatters";
import clsx from "clsx";
import { Radio, RefreshCw } from "lucide-react";

interface OrderEntry {
  id: string;
  order_date: string;
  gross_value_eur: number;
  return_type: "none" | "full" | "partial";
  product_category: string;
  order_source: string;
  shopify_order_id: string | null;
  influencer: {
    id: string;
    name: string;
    handle: string;
    platform: string;
  } | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-gradient-to-br from-fuchsia-500 to-orange-400",
  tiktok: "bg-gradient-to-br from-gray-800 to-black",
  youtube: "bg-gradient-to-br from-red-500 to-red-700",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  youtube: "YT",
};

const POLL_INTERVAL = 15_000;

export function LiveOrdersFeed() {
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/recent", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      setOrders((prev) => {
        // Neue Orders markieren (die vorher nicht da waren)
        const prevIds = new Set(prev.map((o) => o.id));
        const freshIds = new Set<string>();
        for (const o of data.orders) {
          if (!prevIds.has(o.id)) freshIds.add(o.id);
        }
        if (freshIds.size > 0) {
          setNewIds(freshIds);
          // Nach 3s Animation entfernen
          setTimeout(() => setNewIds(new Set()), 3000);
        }
        return data.orders;
      });

      setLastUpdate(data.ts);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    if (!isLive) return;
    const timer = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchOrders, isLive]);

  const ago = lastUpdate
    ? Math.round((Date.now() - lastUpdate) / 1000)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={14} className="text-emerald-500" />
            {isLive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Live Bestellungen</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLive ? "Auto-Refresh alle 15s" : "Pausiert"}
              {ago !== null && ` · vor ${ago}s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsLive(!isLive)}
            className={clsx(
              "text-xs px-2 py-1 rounded-md transition-colors",
              isLive
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {isLive ? "Live" : "Pause"}
          </button>
          <button
            onClick={fetchOrders}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Jetzt aktualisieren"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {loading && orders.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Noch keine Bestellungen
          </div>
        ) : (
          orders.map((order) => {
            const isNew = newIds.has(order.id);
            const inf = order.influencer;
            const platform = inf?.platform ?? "instagram";

            return (
              <div
                key={order.id}
                className={clsx(
                  "flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg transition-all duration-500",
                  isNew
                    ? "bg-emerald-50 ring-1 ring-emerald-200 scale-[1.01]"
                    : "hover:bg-gray-50"
                )}
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                      PLATFORM_COLORS[platform] ?? "bg-gray-500"
                    )}
                  >
                    {PLATFORM_LABELS[platform] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">
                      {inf?.name ?? "Unbekannt"}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <span>{order.product_category}</span>
                      <span>·</span>
                      <span>{order.order_date.slice(5).replace("-", ".")}</span>
                      {order.order_source === "meta_ads" && (
                        <>
                          <span>·</span>
                          <span className="text-blue-500 font-medium">Meta</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Status */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={clsx(
                      "text-xs font-semibold tabular-nums",
                      order.return_type === "full"
                        ? "text-red-500 line-through"
                        : order.return_type === "partial"
                          ? "text-orange-500"
                          : "text-gray-800"
                    )}
                  >
                    {formatEUR(order.gross_value_eur)}
                  </span>
                  {order.return_type === "full" && (
                    <span className="text-[10px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                      RET
                    </span>
                  )}
                  {order.return_type === "partial" && (
                    <span className="text-[10px] text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                      TEIL
                    </span>
                  )}
                  {isNew && (
                    <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold animate-pulse">
                      NEU
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
