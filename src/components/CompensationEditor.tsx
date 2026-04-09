"use client";

import { useState } from "react";
import { Compensation, CompensationType, PaymentInterval } from "@/lib/types";
import { formatCompensation } from "@/lib/formatters";
import { X, Save, Pencil } from "lucide-react";
import clsx from "clsx";

const TYPE_OPTIONS: { value: CompensationType; label: string; desc: string }[] = [
  { value: "fixed",      label: "Fixum",     desc: "Fixer Betrag pro Intervall" },
  { value: "commission", label: "Provision",  desc: "% vom Netto-Umsatz" },
  { value: "hybrid",     label: "Hybrid",     desc: "Fixum + Provision kombiniert" },
  { value: "per_post",   label: "Per Post",   desc: "Pauschale pro Content-Stück" },
  { value: "barter",     label: "Barter",     desc: "Vergütung in Waren statt Cash" },
];

const INTERVAL_OPTIONS: { value: PaymentInterval; label: string }[] = [
  { value: "monthly",   label: "Monatlich" },
  { value: "weekly",    label: "Wöchentlich" },
  { value: "biweekly",  label: "Alle 2 Wochen" },
];

interface Props {
  influencerId: string;
  influencerName: string;
  current: Compensation;
  onSave: (updated: Compensation) => void;
}

export function CompensationEditor({ influencerId, influencerName, current, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Compensation>({ ...current });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Compensation>(key: K, value: Compensation[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(type: CompensationType) {
    // Reset to clean state for new type
    const base: Compensation = { type };
    if (type === "fixed" || type === "hybrid") base.interval = "monthly";
    if (type === "fixed" || type === "hybrid" || type === "barter") base.fixed_eur = 0;
    if (type === "commission" || type === "hybrid") base.commission_pct = 10;
    if (type === "per_post") { base.per_post_eur = 0; base.posts_count = 1; }
    setForm(base);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/influencers/${influencerId}/compensation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave(form);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setForm({ ...current }); setOpen(true); }}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-all"
      >
        <Pencil size={12} />
        Vergütung anpassen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Vergütung anpassen</h3>
                <p className="text-xs text-gray-400 mt-0.5">{influencerName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Model type selector */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Vergütungsmodell</label>
              <div className="grid grid-cols-1 gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeChange(opt.value)}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all",
                      form.type === opt.value
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "border-gray-100 hover:border-gray-200 text-gray-700"
                    )}
                  >
                    <div>
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{opt.desc}</span>
                    </div>
                    {form.type === opt.value && (
                      <span className="text-xs text-emerald-600 font-medium">✓ Aktiv</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic fields */}
            <div className="space-y-3 mb-5">

              {/* Interval — for fixed + hybrid */}
              {(form.type === "fixed" || form.type === "hybrid") && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Zahlungsintervall</label>
                  <div className="flex gap-2">
                    {INTERVAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => set("interval", opt.value)}
                        className={clsx(
                          "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                          form.interval === opt.value
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed amount — for fixed, hybrid, barter */}
              {(form.type === "fixed" || form.type === "hybrid" || form.type === "barter") && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    {form.type === "barter" ? "Warenwert (€)" : "Fixbetrag (€)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={form.fixed_eur ?? 0}
                      onChange={(e) => set("fixed_eur", parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              )}

              {/* Commission % — for commission + hybrid */}
              {(form.type === "commission" || form.type === "hybrid") && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    Provision (% vom Netto-Umsatz)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={form.commission_pct ?? 0}
                      onChange={(e) => set("commission_pct", parseFloat(e.target.value) || 0)}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              )}

              {/* Per-post fields */}
              {form.type === "per_post" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Betrag / Post (€)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={form.per_post_eur ?? 0}
                        onChange={(e) => set("per_post_eur", parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Anzahl Posts</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.posts_count ?? 1}
                      onChange={(e) => set("posts_count", parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-xs text-gray-600 border border-gray-100">
              <span className="font-semibold text-gray-700">Vorschau: </span>
              {formatCompensation(form)}
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
