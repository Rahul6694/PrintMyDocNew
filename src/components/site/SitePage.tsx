import Link from "next/link";
import { BrandMark } from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import { SITE_NAV } from "@/lib/site";
import { OpenInquiryButton } from "./SiteModals";
import ThemeToggle from "@/components/ThemeToggle";
import WhatsAppFloat from "./WhatsAppFloat";

/* Shared layout for the content pages (setup guide, features, about, contact,
   partner and the legal pages): top bar → cover → lead → note → sections. */

export function SitePage({
  eyebrow,
  title,
  meta,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode[];
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="bg-ambient min-h-screen">
      <header className="sticky top-0 z-30 bg-base-950/90 backdrop-blur-md border-b border-base-700/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="text-lg shrink-0" aria-label="PrintMyDoc home">
            <BrandMark />
          </Link>
          <nav aria-label="Site" className="hidden lg:flex items-center gap-1 text-[13.5px] font-semibold">
            {SITE_NAV.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-2 rounded-xl text-base-500 hover:text-ink hover:bg-yellow/15 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle variant="icon" />
            <Link href="/" className="text-sm font-semibold text-base-500 hover:text-ink transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
        <nav aria-label="Site" className="lg:hidden flex gap-1 overflow-x-auto px-3 pb-2 text-[13px] font-semibold [scrollbar-width:none]">
          {SITE_NAV.map((l) => (
            <Link key={l.href} href={l.href} className="shrink-0 px-3 py-1.5 rounded-full border border-base-700 bg-base-850 text-base-500 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className={`${wide ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 sm:px-6 py-10 sm:py-14`}>
        <div className="text-center mb-8 sm:mb-10">
          <span className="badge bg-yellow/25 text-ink border border-yellow px-3 py-1 mb-4">{eyebrow}</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{title}</h1>
          {meta && meta.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 text-[13px] text-base-500">
              {meta.map((m, i) => (
                <span key={i} className="rounded-full bg-base-850 border border-base-700 px-3 py-1">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5">{children}</div>
      </div>

      <Footer />
      <WhatsAppFloat />
    </main>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <div className="text-[15.5px] sm:text-base leading-relaxed text-base-500 [&_strong]:text-ink">{children}</div>;
}

export function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-l-4 border-yellow bg-yellow/10 px-5 py-4 text-sm leading-relaxed">
      <b className="block font-display font-extrabold text-ink mb-1">{title}</b>
      <div className="text-base-500 [&_b]:text-ink">{children}</div>
    </div>
  );
}

export function Sec({
  n,
  title,
  tone,
  children,
  id,
}: {
  n?: React.ReactNode;
  title: React.ReactNode;
  tone?: "warn" | "accent";
  children: React.ReactNode;
  id?: string;
}) {
  const toneCls =
    tone === "warn" ? "border-accent-500/40 bg-accent-500/[0.04]" : tone === "accent" ? "border-yellow bg-yellow/[0.06]" : "border-base-700 bg-base-850";
  return (
    <section id={id} className={`scroll-mt-28 rounded-2xl border p-5 sm:p-6 ${toneCls}`}>
      <h2 className="flex items-start gap-3 text-lg sm:text-xl font-bold mb-3">
        {n !== undefined && (
          <span className="shrink-0 w-8 h-8 rounded-xl bg-ink text-yellow text-sm font-extrabold flex items-center justify-center">{n}</span>
        )}
        <span className="pt-0.5">{title}</span>
      </h2>
      <div className="text-[14.5px] text-base-500 leading-relaxed flex flex-col gap-3 [&_strong]:text-ink [&_b]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_a]:text-accent-500 [&_a]:font-semibold hover:[&_a]:underline">
        {children}
      </div>
    </section>
  );
}

export function ContactBox({
  title = "Have a question?",
  text = "For anything about PrintMyDoc — reach us directly.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-dark text-white text-center px-6 py-8 mt-2">
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-yellow/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-accent-500/25 blur-3xl" />
      <h3 className="relative text-xl font-extrabold mb-1">{title}</h3>
      <p className="relative text-white/70 text-sm mb-5">{text}</p>
      <div className="relative flex flex-wrap justify-center gap-2">
        <OpenInquiryButton className="btn-primary">💼 Business Inquiry</OpenInquiryButton>
        <Link href="/contact" className="rounded-full px-5 py-2.5 font-semibold border border-white/25 hover:border-white transition-colors">
          Contact page →
        </Link>
      </div>
    </div>
  );
}

export function LegalLinks({ current }: { current?: string }) {
  const links = [
    { href: "/terms-and-conditions", label: "Terms & Conditions" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/disclaimer", label: "Disclaimer" },
  ].filter((l) => l.href !== current);
  return (
    <p className="text-center text-[13px] text-base-500 pt-2">
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && " · "}
          <Link href={l.href} className="underline hover:text-ink">
            {l.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
