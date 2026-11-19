"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Printer, KeyRound } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Features" },
  { href: "#qr-orders", label: "Shop QR" },
  { href: "#whatsapp", label: "WhatsApp" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/setup-guide", label: "Setup Guide" },
  { href: "#contact", label: "Contact" },
];

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-extrabold tracking-tight ${className}`}>
      <span className="w-8 h-8 rounded-xl bg-ink text-yellow flex items-center justify-center shadow-pop shrink-0">
        <Printer size={16} strokeWidth={2.5} />
      </span>
      <span>
        Print<span className="text-accent-500">MyDoc</span>
      </span>
    </span>
  );
}

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-30 backdrop-blur-md bg-base-950/85 border-b transition-shadow ${
        scrolled ? "border-base-700 shadow-[0_8px_24px_rgba(17,17,20,0.06)]" : "border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="text-lg shrink-0" aria-label="PrintMyDoc home">
          <BrandMark />
        </Link>
        <div className="hidden lg:flex items-center gap-1 text-[13.5px] font-semibold">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative px-3 py-2 rounded-xl text-base-500 hover:text-ink hover:bg-yellow/15 transition-colors"
            >
              {l.label}
              <span className="absolute left-3 right-3 bottom-1 h-[2.5px] rounded bg-gradient-to-r from-yellow to-accent-500 scale-x-0 origin-left transition-transform group-hover:scale-x-100" />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle variant="icon" />
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full border border-base-700 bg-base-850 hover:border-ink transition-colors"
          >
            <KeyRound size={14} /> Shop Login
          </Link>
          <Link href="/register" className="btn-primary text-sm !px-4 !py-2">
            Start Free →
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center border border-base-700 bg-base-850 hover:border-ink transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-base-700 px-4 sm:px-6 py-3 flex flex-col text-sm font-semibold">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2.5 px-2 rounded-lg text-base-500 hover:text-ink hover:bg-yellow/15 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className="sm:hidden py-2.5 px-2 text-base-500 hover:text-ink transition-colors">
            🔑 Shop Login
          </Link>
        </div>
      )}
    </nav>
  );
}
