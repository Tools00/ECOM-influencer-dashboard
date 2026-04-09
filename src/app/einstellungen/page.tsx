import { Header } from "@/components/layout/Header";
import { Settings, Database, Bell, Shield, Code2 } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Datenquelle",
    description: "Shopify Webhook Endpoint, Supabase PostgreSQL, Discount Code Tracking",
    status: "Aktiv",
    statusColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Bell,
    title: "Benachrichtigungen",
    description: "E-Mail-Alerts bei Retourenquote > 30% oder negativem ROI",
    status: "Konfigurierbar",
    statusColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: Shield,
    title: "Datenschutz (DSGVO)",
    description: "Alle Daten werden innerhalb der EU verarbeitet. Kein PII ohne explizite Einwilligung.",
    status: "Konform",
    statusColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Code2,
    title: "API & Integrationen",
    description: "REST API unter /api/influencers. Shopify Webhook Sprint 3 (geplant).",
    status: "Beta",
    statusColor: "bg-indigo-100 text-indigo-700",
  },
];

export default function EinstellungenPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header>
        <h1 className="text-sm font-semibold text-gray-800">Einstellungen</h1>
      </Header>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6">
        <div className="max-w-2xl space-y-4">
          {sections.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <s.icon size={18} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.statusColor}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center text-xs text-gray-300 pt-4">
            Influencer Dashboard v2.0 · DACH E-Commerce · Strictly Boring GmbH
          </div>
        </div>
      </main>
    </div>
  );
}
