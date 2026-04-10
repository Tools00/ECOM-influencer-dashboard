import { Header } from "@/components/layout/Header";
import { fetchInfluencers, fetchOrders } from "@/lib/supabase";
import {
  Database, Webhook, Shield, Users, ShoppingBag,
  CheckCircle, Clock, ExternalLink
} from "lucide-react";

export default async function EinstellungenPage() {
  const [influencers, orders] = await Promise.all([fetchInfluencers(), fetchOrders()]);

  const activeInfluencers = influencers.filter((i) => i.is_active).length;
  const useMock = process.env.USE_MOCK_DATA === "true";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] ?? "—";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <h1 className="text-sm font-semibold text-gray-800">Einstellungen</h1>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 space-y-5">
        <div className="max-w-2xl space-y-4">

          {/* ── Datenbank-Status ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Database size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Supabase Datenbank</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${useMock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {useMock ? "Mock-Modus" : "Live"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-3">
                  {projectRef}.supabase.co · Region: EU (Frankfurt)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                    <Users size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-800">{influencers.length}</p>
                    <p className="text-xs text-gray-400">Influencer</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                    <CheckCircle size={14} className="text-emerald-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-800">{activeInfluencers}</p>
                    <p className="text-xs text-gray-400">Aktiv</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                    <ShoppingBag size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-800">{orders.length}</p>
                    <p className="text-xs text-gray-400">Orders gesamt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Shopify Webhook ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Webhook size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Shopify Webhook</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    Sprint 3B
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Echtzeit-Sync von Orders, Retouren und Discount-Code-Nutzung aus deinem Shopify-Store.
                </p>
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Webhook-Endpoint (nach Sprint 3B aktiv)</p>
                  <code className="text-xs text-indigo-700 break-all">
                    POST /api/shopify/webhook
                  </code>
                  <div className="pt-1 space-y-1">
                    {["orders/create", "orders/updated", "refunds/create"].map((event) => (
                      <div key={event} className="flex items-center gap-2">
                        <Clock size={11} className="text-amber-400 shrink-0" />
                        <span className="text-xs text-gray-400 font-mono">{event}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <a
                  href="https://dev.shopify.com/dashboard/213578047/stores"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Shopify Dev Dashboard öffnen
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* ── Attribution ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-600">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Attribution-Modell</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                    Aktiv
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Bestellungen werden nach <code className="text-violet-700">order_source</code> klassifiziert: Influencer, Meta Ads oder Organisch. Bei Überschneidung (gleicher Discount Code in Meta Ads) wird automatisch gewarnt.
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    { label: "Influencer", color: "bg-emerald-100 text-emerald-700" },
                    { label: "Meta Ads",   color: "bg-violet-100 text-violet-700" },
                    { label: "Organisch",  color: "bg-gray-100 text-gray-600" },
                  ].map((s) => (
                    <span key={s.label} className={`px-2 py-1.5 rounded-lg font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── DSGVO ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Datenschutz (DSGVO)</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Konform
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Supabase-Daten werden in der EU (Frankfurt) gespeichert. Kein PII ohne explizite Einwilligung. Keine Weitergabe an Dritte.
                </p>
              </div>
            </div>
          </div>

        </div>

        <p className="text-center text-xs text-gray-300 pt-2 max-w-2xl">
          Influencer Dashboard v3.0 · Sprint 3A aktiv · DACH E-Commerce
        </p>
      </main>
    </div>
  );
}
