import { Download, Link2, ShieldCheck } from "lucide-react";

export default function QrSection() {
  return (
    <section id="qr-orders" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 flex justify-center">
          <div className="relative w-full max-w-sm -rotate-2 hover:rotate-0 transition-transform">
            <div className="absolute -inset-4 rounded-[2rem] bg-yellow/30 blur-2xl -z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/qr/poster?sample=1"
              alt="Sample PrintMyDoc counter poster with shop QR code"
              width={1131}
              height={1600}
              loading="lazy"
              className="w-full rounded-2xl shadow-2xl border border-base-700"
            />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">
            QR order automation
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">Ek poster. <span className="marker">Poori dukaan automatic.</span></h2>
          <p className="text-base-500 mb-6">
            Dashboard se apna ready-made A4 poster download karo — shop name, QR aur payment options pehle se bhare hue. Walk-in customers scan it with any camera app,
            upload their file, and pay — no app download, no login.
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2.5 text-sm">
              <Link2 size={16} className="text-accent-400 shrink-0 mt-0.5" />
              A permanent link that never expires — reprint your QR poster only if you want to
            </li>
            <li className="flex items-start gap-2.5 text-sm">
              <Download size={16} className="text-accent-400 shrink-0 mt-0.5" />
              Download as PDF, PNG or print directly from your dashboard
            </li>
            <li className="flex items-start gap-2.5 text-sm">
              <ShieldCheck size={16} className="text-accent-400 shrink-0 mt-0.5" />
              Scoped to your shop only — one merchant can never see another's orders
            </li>
          </ul>
          <a href="/register" className="btn-primary inline-block">
            Get your shop poster →
          </a>
        </div>
      </div>
    </section>
  );
}
