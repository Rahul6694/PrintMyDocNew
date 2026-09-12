import Link from "next/link";

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
  return (
    <nav className="border-b border-base-700/60 sticky top-0 bg-base-950/90 backdrop-blur z-20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
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
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/login" className="text-sm text-base-500 hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Join as a Merchant →
          </Link>
        </div>
      </div>
    </nav>
  );
}
