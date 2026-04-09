const eurFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("de-DE");

export function formatEUR(n: number): string {
  return eurFmt.format(n);
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatNumber(n: number): string {
  return numFmt.format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTrend(pct: number): string {
  if (pct === 0) return "—";
  const arrow = pct > 0 ? "▲" : "▼";
  return `${arrow} ${Math.abs(pct).toFixed(1)}%`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

export function formatCompensation(c: import("./types").Compensation): string {
  const interval = c.interval === "weekly" ? "Woche" : c.interval === "biweekly" ? "2 Wo." : "Monat";
  switch (c.type) {
    case "fixed":
      return `${formatEUR(c.fixed_eur ?? 0)} / ${interval}`;
    case "commission":
      return `${c.commission_pct}% Provision`;
    case "hybrid":
      return `${formatEUR(c.fixed_eur ?? 0)} + ${c.commission_pct}% / ${interval}`;
    case "per_post":
      return `${formatEUR(c.per_post_eur ?? 0)} / Post`;
    case "barter":
      return `Barter · ${formatEUR(c.fixed_eur ?? 0)} Warenwert`;
  }
}
