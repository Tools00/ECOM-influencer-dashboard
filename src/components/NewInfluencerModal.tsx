"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Loader2 } from "lucide-react";
import clsx from "clsx";
import { Influencer } from "@/lib/types";

type CompType = Influencer["compensation"]["type"];
type Platform = Influencer["platform"];

interface FormState {
  name: string;
  handle: string;
  platform: Platform;
  niche: string;
  discount_code: string;
  followers: string;
  campaign_name: string;
  contract_start_date: string;
  comp_type: CompType;
  comp_fixed_eur: string;
  comp_commission_pct: string;
  comp_per_post_eur: string;
  comp_posts_count: string;
  comp_interval: "monthly" | "weekly" | "biweekly";
}

const EMPTY: FormState = {
  name: "",
  handle: "",
  platform: "instagram",
  niche: "",
  discount_code: "",
  followers: "",
  campaign_name: "",
  contract_start_date: new Date().toISOString().split("T")[0],
  comp_type: "fixed",
  comp_fixed_eur: "",
  comp_commission_pct: "",
  comp_per_post_eur: "",
  comp_posts_count: "",
  comp_interval: "monthly",
};

function influencerToFormState(inf: Influencer): FormState {
  const c = inf.compensation;
  return {
    name:                inf.name,
    handle:              inf.handle,
    platform:            inf.platform,
    niche:               inf.niche ?? "",
    discount_code:       inf.discount_code,
    followers:           String(inf.followers ?? ""),
    campaign_name:       inf.campaign_name ?? "",
    contract_start_date: inf.contract_start_date ?? new Date().toISOString().split("T")[0],
    comp_type:           c.type,
    comp_fixed_eur:      String(c.fixed_eur ?? ""),
    comp_commission_pct: String(c.commission_pct ?? ""),
    comp_per_post_eur:   String(c.per_post_eur ?? ""),
    comp_posts_count:    String(c.posts_count ?? ""),
    comp_interval:       c.interval ?? "monthly",
  };
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

const COMP_LABELS: Record<CompType, string> = {
  fixed: "Fixum",
  commission: "Provision",
  hybrid: "Hybrid (Fix + Provision)",
  per_post: "Pro Post",
  barter: "Barter (Sachleistung)",
};

// ─── Neuer Influencer Button (für /influencer Liste) ────────

export function NewInfluencerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <Plus size={13} />
        Neuer Influencer
      </button>
      {open && <InfluencerFormModal onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── Bearbeiten Button (für Detail-Seite) ──────────────────

interface EditButtonProps {
  influencer: Influencer;
  onSaved: (updated: Influencer) => void;
}

export function EditInfluencerButton({ influencer, onSaved }: EditButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        <Pencil size={13} />
        Bearbeiten
      </button>
      {open && (
        <InfluencerFormModal
          editInfluencer={influencer}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}

// ─── Gemeinsames Formular-Modal ────────────────────────────

interface ModalProps {
  editInfluencer?: Influencer;
  onClose: () => void;
  onSaved?: (updated: Influencer) => void;
}

function InfluencerFormModal({ editInfluencer, onClose, onSaved }: ModalProps) {
  const router = useRouter();
  const isEdit = !!editInfluencer;
  const [form, setForm] = useState<FormState>(
    isEdit ? influencerToFormState(editInfluencer!) : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const compensation = buildCompensation(form);
    const payload: Omit<Influencer, "id"> = {
      name:                form.name.trim(),
      handle:              form.handle.startsWith("@") ? form.handle.trim() : `@${form.handle.trim()}`,
      platform:            form.platform,
      niche:               form.niche.trim(),
      discount_code:       form.discount_code.trim().toUpperCase(),
      followers:           parseInt(form.followers) || 0,
      campaign_name:       form.campaign_name.trim(),
      contract_start_date: form.contract_start_date || undefined,
      is_active:           editInfluencer?.is_active ?? true,
      compensation,
    };

    try {
      if (isEdit) {
        const res = await fetch(`/api/influencers/${editInfluencer!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
        onSaved?.({ ...editInfluencer!, ...payload });
        router.refresh();
        onClose();
      } else {
        const res = await fetch("/api/influencers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
        router.refresh();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-sm font-semibold text-gray-800">
            {isEdit ? `${editInfluencer!.name} bearbeiten` : "Neuer Influencer"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Stammdaten */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stammdaten</legend>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *">
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Sophie Müller" className={inputCls} />
              </Field>
              <Field label="Handle *">
                <input required value={form.handle} onChange={(e) => set("handle", e.target.value)}
                  placeholder="@sophiestyle" className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Plattform *">
                <select value={form.platform} onChange={(e) => set("platform", e.target.value as Platform)} className={inputCls}>
                  {(["instagram", "tiktok", "youtube"] as Platform[]).map((p) => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nische">
                <input value={form.niche} onChange={(e) => set("niche", e.target.value)}
                  placeholder="Fashion & Lifestyle" className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount Code *">
                <input required value={form.discount_code}
                  onChange={(e) => set("discount_code", e.target.value.toUpperCase())}
                  placeholder="SOPHIE10" className={clsx(inputCls, "uppercase tracking-widest")} />
              </Field>
              <Field label="Follower">
                <input type="number" min={0} value={form.followers}
                  onChange={(e) => set("followers", e.target.value)}
                  placeholder="85000" className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kampagne">
                <input value={form.campaign_name} onChange={(e) => set("campaign_name", e.target.value)}
                  placeholder="Frühjahrskampagne Q1" className={inputCls} />
              </Field>
              <Field label="Vertragsbeginn">
                <input type="date" value={form.contract_start_date}
                  onChange={(e) => set("contract_start_date", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </fieldset>

          {/* Vergütung */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vergütungsmodell</legend>

            <Field label="Typ *">
              <select value={form.comp_type} onChange={(e) => set("comp_type", e.target.value as CompType)} className={inputCls}>
                {(Object.keys(COMP_LABELS) as CompType[]).map((t) => (
                  <option key={t} value={t}>{COMP_LABELS[t]}</option>
                ))}
              </select>
            </Field>

            {(form.comp_type === "fixed" || form.comp_type === "hybrid" || form.comp_type === "barter") && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={form.comp_type === "barter" ? "Warenwert (€)" : "Fixum (€)"}>
                  <input type="number" min={0} value={form.comp_fixed_eur}
                    onChange={(e) => set("comp_fixed_eur", e.target.value)}
                    placeholder="500" className={inputCls} />
                </Field>
                {form.comp_type !== "barter" && (
                  <Field label="Intervall">
                    <select value={form.comp_interval}
                      onChange={(e) => set("comp_interval", e.target.value as FormState["comp_interval"])} className={inputCls}>
                      <option value="monthly">Monatlich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="biweekly">Zweiwöchentlich</option>
                    </select>
                  </Field>
                )}
              </div>
            )}

            {(form.comp_type === "commission" || form.comp_type === "hybrid") && (
              <Field label="Provision (%)">
                <input type="number" min={0} max={100} step={0.5} value={form.comp_commission_pct}
                  onChange={(e) => set("comp_commission_pct", e.target.value)}
                  placeholder="10" className={inputCls} />
              </Field>
            )}

            {form.comp_type === "per_post" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pro Post (€)">
                  <input type="number" min={0} value={form.comp_per_post_eur}
                    onChange={(e) => set("comp_per_post_eur", e.target.value)}
                    placeholder="300" className={inputCls} />
                </Field>
                <Field label="Anzahl Posts">
                  <input type="number" min={1} value={form.comp_posts_count}
                    onChange={(e) => set("comp_posts_count", e.target.value)}
                    placeholder="3" className={inputCls} />
                </Field>
              </div>
            )}
          </fieldset>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {saving
                ? <Loader2 size={13} className="animate-spin" />
                : isEdit ? <Pencil size={13} /> : <Plus size={13} />}
              {saving ? "Wird gespeichert…" : isEdit ? "Änderungen speichern" : "Influencer anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";

function buildCompensation(form: FormState): Influencer["compensation"] {
  const base = { type: form.comp_type, start_date: form.contract_start_date || undefined } as Influencer["compensation"];
  switch (form.comp_type) {
    case "fixed":    return { ...base, type: "fixed",      interval: form.comp_interval, fixed_eur: parseFloat(form.comp_fixed_eur) || 0 };
    case "commission": return { ...base, type: "commission", commission_pct: parseFloat(form.comp_commission_pct) || 0 };
    case "hybrid":   return { ...base, type: "hybrid",     interval: form.comp_interval, fixed_eur: parseFloat(form.comp_fixed_eur) || 0, commission_pct: parseFloat(form.comp_commission_pct) || 0 };
    case "per_post": return { ...base, type: "per_post",   per_post_eur: parseFloat(form.comp_per_post_eur) || 0, posts_count: parseInt(form.comp_posts_count) || 1 };
    case "barter":   return { ...base, type: "barter",     fixed_eur: parseFloat(form.comp_fixed_eur) || 0 };
  }
}
