import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Print automation" },
      { href: "#whatsapp", label: "WhatsApp printing" },
      { href: "#qr-orders", label: "QR ordering" },
    ],
  },
  {
    title: "Company & help",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#pricing", label: "Pricing" },
      { href: "#faq", label: "FAQ" },
      { href: "#contact", label: "Contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-base-700/60">
      <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <p className="text-lg font-bold tracking-tight mb-3">
            Print<span className="text-accent-400">MyDoc</span>
          </p>
          <p className="text-sm text-base-500">The automated order and printer workflow for modern print shops.</p>
          <p className="text-xs text-base-500 mt-4">© {new Date().getFullYear()} PrintMyDoc.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-semibold text-sm mb-3">{col.title}</p>
            <div className="flex flex-col gap-2">
              {col.links.map((l) => (
                <a key={l.label} href={l.href} className="text-sm text-base-500 hover:text-ink transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="font-semibold text-sm mb-3">Merchant</p>
          <div className="flex flex-col gap-2 items-start">
            <Link href="/login" className="text-sm text-accent-400 hover:underline">
              Sign in →
            </Link>
            <Link href="/register" className="btn-primary text-sm mt-2">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
