import { Download, Link2, ShieldCheck } from "lucide-react";

export default function QrSection() {
  return (
    <section id="qr-orders" className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 card p-8 flex flex-col items-center text-center">
          <div className="w-40 h-40 bg-white rounded-xl p-4 mb-4 grid grid-cols-5 grid-rows-5 gap-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={`rounded-sm ${[0, 4, 20, 24, 12, 6, 18, 2, 22].includes(i) ? "bg-[#14151f]" : "bg-transparent"}`} />
            ))}
          </div>
          <p className="font-semibold text-sm">Rahul Print Shop</p>
          <p className="text-xs text-base-500">printmydoc.app/s/rahul-print-shop</p>
        </div>
        <div className="order-1 lg:order-2">
          <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">
            QR order automation
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">One QR code. Zero installs.</h2>
          <p className="text-base-500 mb-6">
            Print one QR code and stick it at your counter. Walk-in customers scan it with any camera app,
            upload their file, and pay — no app download, no login.
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2.5 text-sm">
              <Link2 size={16} className="text-accent-400 shrink-0 mt-0.5" />
              A permanent link that never expires — reprint your QR poster only if you want to
            </li>
            <li className="flex items-start gap-2.5 text-sm">
              <Download size={16} className="text-accent-400 shrink-0 mt-0.5" />
              Download it print-ready straight from your dashboard
            </li>
            <li className="flex items-start gap-2.5 text-sm">
              <ShieldCheck size={16} className="text-accent-400 shrink-0 mt-0.5" />
              Scoped to your shop only — one merchant can never see another's orders
            </li>
          </ul>
          <a href="/register" className="btn-primary inline-block">
            Get your shop QR
          </a>
        </div>
      </div>
    </section>
  );
}
