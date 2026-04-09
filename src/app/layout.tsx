import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Influencer Dashboard",
  description: "Shopify influencer revenue, return rates & partnership profitability — DACH",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
