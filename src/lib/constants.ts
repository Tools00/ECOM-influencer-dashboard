import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/influencer", label: "Influencer", icon: Users },
  { href: "/kampagnen", label: "Kampagnen", icon: Megaphone },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
] as const;

export const DACH_RETURN_BENCHMARKS: Record<string, number> = {
  Kleidung: 40,
  Accessoires: 20,
  Sportswear: 12,
  Supplements: 5,
  Equipment: 15,
  Kochbücher: 4,
  Kochutensilien: 10,
  Gewürze: 3,
  Smartphones: 8,
  Laptops: 12,
  Zubehör: 10,
  Audio: 9,
  Skincare: 18,
  "Make-up": 25,
  Haarpflege: 15,
  Schuhe: 45,
  Yoga: 8,
};

export const CHART_COLORS = {
  primary: "#10b981",
  primaryLight: "#d1fae5",
  primaryMid: "#34d399",
  primaryDark: "#059669",
  secondary: "#6366f1",
  secondaryLight: "#e0e7ff",
  danger: "#ef4444",
  dangerLight: "#fef2f2",
  warning: "#f59e0b",
  warningLight: "#fefce8",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  palette: [
    "#10b981",
    "#6366f1",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ],
} as const;

/** Fixpunkt für Mock-Daten (Jan–März 2024) */
export const REFERENCE_DATE_MOCK = "2024-03-31";

/** Aktuelles Datum — wird für Live-Daten als Referenz verwendet */
export const REFERENCE_DATE = new Date().toISOString().split("T")[0];
