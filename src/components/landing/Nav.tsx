"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#whatsapp", label: "WhatsApp" },
  { href: "#qr-orders", label: "QR Orders" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-base-700/60 sticky top-0 bg-base-950/90 backdrop-blur z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight shrink-0">
          Print<span className="text-accent-400">MyDoc</span>
        </Link>
        <div className="hidden lg:flex items-center gap-6 text-sm text-base-500">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/login" className="hidden sm:inline text-sm text-base-500 hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm !px-3 sm:!px-5 !py-2 sm:!py-2.5">
            <span className="sm:hidden">Join →</span>
            <span className="hidden sm:inline">Join as a Merchant →</span>
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-base-700/60 px-4 sm:px-6 py-3 flex flex-col text-sm">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-base-500 hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className="sm:hidden py-2.5 text-base-500 hover:text-ink transition-colors">
            Sign in
          </Link>
        </div>
      )}
    </nav>
  );
}
