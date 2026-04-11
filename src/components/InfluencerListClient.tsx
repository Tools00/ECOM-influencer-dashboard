"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Users, X, Plus, Check, Tag as TagIcon, Search, ChevronDown } from "lucide-react";
import { InfluencerStats, Platform } from "@/lib/types";
import { PlatformBadge } from "./PlatformBadge";
import { formatEUR, formatPct, formatCompact } from "@/lib/formatters";
import { BUILTIN_TAGS, TAG_COLORS } from "@/lib/constants";

type SortKey =
  | "roi"
  | "profit"
  | "net_revenue"
  | "gross_revenue"
  | "return_rate"
  | "total_orders"
  | "followers"
  | "aov"
  | "actual_cost";

type StatusFilter = "all" | "active" | "inactive";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "roi",            label: "ROI"             },
  { key: "profit",         label: "Profit"          },
  { key: "net_revenue",    label: "Netto-Umsatz"    },
  { key: "gross_revenue",  label: "Brutto-Umsatz"   },
  { key: "return_rate",    label: "Retourenquote"   },
  { key: "total_orders",   label: "Orders"          },
  { key: "followers",      label: "Follower"        },
  { key: "aov",            label: "Ø Bestellwert"   },
  { key: "actual_cost",    label: "Kosten"          },
];

const PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube"];
const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok:    "TikTok",
  youtube:   "YouTube",
};

function tagClass(tag: string) {
  return TAG_COLORS[tag] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

function getStatValue(s: InfluencerStats, key: SortKey): number {
  switch (key) {
    case "roi":           return s.roi;
    case "profit":        return s.profit;
    case "net_revenue":   return s.net_revenue;
    case "gross_revenue": return s.gross_revenue;
    case "return_rate":   return s.return_rate;
    case "total_orders":  return s.total_orders;
    case "followers":     return s.influencer.followers;
    case "aov":           return s.aov;
    case "actual_cost":   return s.actual_cost;
  }
}

export function InfluencerListClient({ initialStats }: { initialStats: InfluencerStats[] }) {
  const [statsState, setStatsState] = useState<InfluencerStats[]>(initialStats);
  const [search, setSearch]         = useState("");
  const [platforms, setPlatforms]   = useState<Set<Platform>>(new Set());
  const [niches, setNiches]         = useState<Set<string>>(new Set());
  const [status, setStatus]         = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter]   = useState<Set<string>>(new Set());
  const [sortKey, setSortKey]       = useState<SortKey>("roi");
  const [sortDir, setSortDir]       = useState<"desc" | "asc">("desc");
  const [editingId, setEditingId]   = useState<string | null>(null);

  const allNiches = useMemo(
    () => Array.from(new Set(statsState.map((s) => s.influencer.niche))).sort(),
    [statsState]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>(BUILTIN_TAGS);
    statsState.forEach((s) => s.influencer.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [statsState]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return statsState.filter((row) => {
      const inf = row.influencer;
      if (platforms.size > 0 && !platforms.has(inf.platform)) return false;
      if (niches.size > 0 && !niches.has(inf.niche)) return false;
      if (status === "active" && !inf.is_active) return false;
      if (status === "inactive" && inf.is_active) return false;
      if (tagFilter.size > 0) {
        const has = inf.tags.some((t) => tagFilter.has(t));
        if (!has) return false;
      }
      if (s) {
        const hay = `${inf.name} ${inf.handle} ${inf.discount_code} ${inf.campaign_name} ${inf.niche}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [statsState, search, platforms, niches, status, tagFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = getStatValue(a, sortKey);
      const vb = getStatValue(b, sortKey);
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function clearFilters() {
    setSearch("");
    setPlatforms(new Set());
    setNiches(new Set());
    setStatus("all");
    setTagFilter(new Set());
  }

  async function persistTags(infId: string, tags: string[]) {
    // Optimistic update
    setStatsState((prev) =>
      prev.map((s) =>
        s.influencer.id === infId
          ? { ...s, influencer: { ...s.influencer, tags } }
          : s
      )
    );
    try {
      const res = await fetch(`/api/influencers/${infId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("Tag-Update fehlgeschlagen:", err);
    }
  }

  const activeFilterCount =
    platforms.size + niches.size + tagFilter.size + (status !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Handle, Code…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Platform pills */}
          <div className="flex items-center gap-1">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatforms((prev) => toggleSet(prev, p))}
                className={clsx(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                  platforms.has(p)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-1">
            {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                  status === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {s === "all" ? "Alle" : s === "active" ? "Aktiv" : "Inaktiv"}
              </button>
            ))}
          </div>

          {/* Niche dropdown */}
          <NicheDropdown
            allNiches={allNiches}
            selected={niches}
            onToggle={(n) => setNiches((prev) => toggleSet(prev, n))}
          />

          <div className="flex-1" />

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Sortieren</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-300"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300"
              title={sortDir === "desc" ? "Absteigend" : "Aufsteigend"}
            >
              {sortDir === "desc" ? "↓" : "↑"}
            </button>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 px-2 py-1.5"
            >
              Zurücksetzen ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Tag-Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <TagIcon size={12} className="text-gray-400 mr-1" />
          {allTags.length === 0 && (
            <span className="text-xs text-gray-400">Noch keine Tags vergeben</span>
          )}
          {allTags.map((tag) => {
            const active = tagFilter.has(tag);
            return (
              <button
                key={tag}
                onClick={() => setTagFilter((prev) => toggleSet(prev, tag))}
                className={clsx(
                  "text-xs font-semibold px-2.5 py-1 rounded-full border transition-all",
                  active
                    ? tagClass(tag) + " ring-2 ring-offset-1 ring-emerald-300"
                    : tagClass(tag) + " opacity-60 hover:opacity-100"
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {sorted.length} von {statsState.length} Influencer
          {activeFilterCount > 0 && " (gefiltert)"}
        </span>
        <span>Sortiert nach {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((s) => {
          const inf = s.influencer;
          const isEditing = editingId === inf.id;
          return (
            <div
              key={inf.id}
              className={clsx(
                "bg-white rounded-2xl border shadow-sm p-5 transition-all",
                inf.is_active ? "border-gray-100" : "border-gray-200 opacity-70",
                "hover:border-emerald-200 hover:shadow-md"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <Link href={`/influencer/${inf.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700 shrink-0">
                    {inf.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{inf.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-400 truncate">{inf.handle}</span>
                      <PlatformBadge platform={inf.platform} />
                    </div>
                  </div>
                </Link>
                <span className={clsx(
                  "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                  s.profit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"
                )}>
                  ROI {s.roi.toFixed(0)}%
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1 mb-3 min-h-[24px]">
                {inf.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter((prev) => toggleSet(prev, tag))}
                    className={clsx(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      tagClass(tag)
                    )}
                    title="Nach Tag filtern"
                  >
                    {tag}
                  </button>
                ))}
                <button
                  onClick={() => setEditingId(isEditing ? null : inf.id)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-emerald-300 hover:text-emerald-700 inline-flex items-center gap-0.5"
                >
                  {isEditing ? <X size={10} /> : <Plus size={10} />}
                  {isEditing ? "Schließen" : "Tag"}
                </button>
              </div>

              {/* Tag-Editor */}
              {isEditing && (
                <TagEditor
                  current={inf.tags}
                  allTags={allTags}
                  onChange={(next) => persistTags(inf.id, next)}
                />
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div>
                  <div className="text-xs text-gray-400">Netto</div>
                  <div className="text-sm font-bold text-gray-800 mt-0.5">{formatEUR(s.net_revenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Retouren</div>
                  <div className={clsx(
                    "text-sm font-bold mt-0.5",
                    s.return_rate > 25 ? "text-red-600" : s.return_rate > 15 ? "text-amber-600" : "text-gray-800"
                  )}>
                    {formatPct(s.return_rate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Orders</div>
                  <div className="text-sm font-bold text-gray-800 mt-0.5">{s.total_orders}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <Users size={11} />
                  {formatCompact(inf.followers)}
                </div>
                <span className="text-gray-300 truncate max-w-[100px]">{inf.campaign_name}</span>
                <span className="font-mono text-emerald-600">{inf.discount_code}</span>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-sm font-semibold text-gray-700 mb-1">Keine Influencer gefunden</div>
          <div className="text-xs text-gray-400">Versuche andere Filter oder setze sie zurück.</div>
        </div>
      )}
    </div>
  );
}

// ─── Niche Dropdown ───────────────────────────────────────────

function NicheDropdown({
  allNiches,
  selected,
  onToggle,
}: {
  allNiches: string[];
  selected: Set<string>;
  onToggle: (n: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "text-xs font-semibold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1 transition-colors",
          selected.size > 0
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
        )}
      >
        Nische {selected.size > 0 && `(${selected.size})`}
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-h-64 overflow-y-auto">
            {allNiches.map((n) => (
              <button
                key={n}
                onClick={() => onToggle(n)}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between"
              >
                <span>{n}</span>
                {selected.has(n) && <Check size={12} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tag Editor (inline pro Card) ─────────────────────────────

function TagEditor({
  current,
  allTags,
  onChange,
}: {
  current: string[];
  allTags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const set = new Set(current);

  function toggle(tag: string) {
    const next = new Set(set);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(Array.from(next));
  }

  function addCustom() {
    const t = input.trim();
    if (!t) return;
    if (!set.has(t)) onChange([...current, t]);
    setInput("");
  }

  // Vorschläge: Built-in + bereits existierende, ohne aktuelle
  const suggestions = Array.from(new Set([...BUILTIN_TAGS, ...allTags])).filter(
    (t) => !set.has(t)
  );

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3 space-y-2">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        Vorschläge
      </div>
      <div className="flex flex-wrap gap-1">
        {suggestions.length === 0 && (
          <span className="text-xs text-gray-400">Alle Vorschläge bereits vergeben</span>
        )}
        {suggestions.map((tag) => (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={clsx(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              tagClass(tag),
              "opacity-60 hover:opacity-100"
            )}
          >
            + {tag}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 pt-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Eigener Tag…"
          className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 focus:outline-none focus:border-emerald-300"
        />
        <button
          onClick={addCustom}
          className="text-xs font-semibold px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          +
        </button>
      </div>
      {current.length > 0 && (
        <div className="pt-1">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Aktuell
          </div>
          <div className="flex flex-wrap gap-1">
            {current.map((tag) => (
              <button
                key={tag}
                onClick={() => toggle(tag)}
                className={clsx(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-0.5",
                  tagClass(tag)
                )}
              >
                {tag} <X size={9} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
