import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteModalsProvider } from "@/components/site/SiteModals";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "PrintMyDoc — QR se print, seedha aapke printer par",
  description: "Customers scan your shop QR, upload, pay online or cash, and the document prints automatically on your printer.",
};

// Runs before paint so the stored theme applies without a light/dark flash.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('pmd-theme');
    if (stored === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans bg-base-950 text-ink min-h-screen">
        <SiteModalsProvider>{children}</SiteModalsProvider>
      </body>
    </html>
  );
}
