import { Order, Influencer } from "@/lib/types";
import { formatEUR, formatDate } from "@/lib/formatters";
import { PlatformBadge } from "@/components/PlatformBadge";
import clsx from "clsx";

interface Props {
  orders: Order[];
  influencers: Influencer[];
}

export function RecentOrdersFeed({ orders, influencers }: Props) {
  const infMap = new Map(influencers.map((i) => [i.id, i]));
  const recent = [...orders]
    .sort((a, b) => b.order_date.localeCompare(a.order_date))
    .slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Letzte Bestellungen</h3>
        <p className="text-xs text-gray-400 mt-0.5">Die 10 neuesten Transaktionen</p>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {recent.map((order) => {
          const inf = infMap.get(order.influencer_id);
          return (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                  {inf?.name.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">
                    {inf?.handle ?? order.influencer_id}
                  </div>
                  <div className="text-xs text-gray-400">
                    {order.product_category} · {formatDate(order.order_date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {inf && <PlatformBadge platform={inf.platform} />}
                <span className={clsx("text-xs font-semibold", order.is_returned ? "text-red-500 line-through" : "text-gray-800")}>
                  {formatEUR(order.gross_value_eur)}
                </span>
                {order.is_returned && (
                  <span className="text-xs text-red-400 bg-red-50 px-1.5 py-0.5 rounded">R</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
