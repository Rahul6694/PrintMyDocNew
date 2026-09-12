import Link from "next/link";
import { QrCode, MessageCircle, Cpu, CheckCircle2, Printer } from "lucide-react";

const PILLS = [
  { icon: QrCode, label: "QR order intake" },
  { icon: MessageCircle, label: "WhatsApp orders" },
  { icon: Cpu, label: "Local print agent" },
];

const QUEUE_STEPS = ["1. Scan QR", "2. Upload", "3. Configure", "4. Pay", "5. Queue", "6. Print"];

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="badge bg-success/10 text-success border border-success/30 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-success" /> Print automation for modern shops
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
          Print automation software for{" "}
          <span className="bg-gradient-to-r from-accent-500 to-success bg-clip-text text-transparent">
            faster print shops
          </span>
        </h1>
        <p className="text-base-500 text-lg mb-8 max-w-lg">
          Receive documents over QR and WhatsApp, collect exact print settings, calculate pricing
          automatically, and send confirmed orders straight to your printer — all from one workspace.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {PILLS.map((p) => (
            <span key={p.label} className="badge bg-base-850 border border-base-700 text-sm px-3 py-1.5">
              <p.icon size={14} className="text-accent-400" /> {p.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link href="/register" className="btn-primary">
            Start automating your shop →
          </Link>
          <a href="#how-it-works" className="btn-secondary">
            See how it works
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-base-500">
          <a href="#pricing" className="text-accent-400 font-semibold hover:underline">
            Plans from ₹100 →
          </a>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-success" /> Merchant-controlled pricing
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-success" /> Works with printers you already own
          </span>
        </div>
      </div>

      <div>
        <div className="rounded-2xl bg-[#0d0e1a] border border-base-700 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2.5 text-white">
              <span className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
                <Printer size={15} />
              </span>
              <span className="font-semibold">PrintMyDoc</span>
            </div>
            <span className="badge bg-success/20 text-success text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Live shop automation
            </span>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 flex flex-col items-center text-center">
              <span className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
                <CheckCircle2 size={22} />
              </span>
              <p className="font-bold text-[#14151f]">Order successful</p>
              <p className="text-xs text-gray-500 mt-1">Payment received</p>
              <p className="text-xs text-gray-500">Order queued for printing</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-[#14151f]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-xs">Order Queue</p>
                <span className="badge bg-success/10 text-success text-[10px]">Agent online</span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Pending order</p>
              <p className="text-xs font-semibold">New customer</p>
              <p className="text-[10px] text-gray-500">Order reference</p>
              <p className="text-[10px] text-danger font-medium">PDF · 3 pages</p>
            </div>
          </div>

          <div className="px-5 pb-5 flex flex-wrap gap-2">
            {QUEUE_STEPS.map((s, i) => (
              <span
                key={s}
                className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                  i < 4 ? "bg-success/20 text-success" : "bg-white/10 text-white/60"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="card p-4">
            <p className="font-semibold text-sm">QR + WhatsApp</p>
            <p className="text-xs text-base-500">Order intake</p>
          </div>
          <div className="card p-4">
            <p className="font-semibold text-sm">Live pricing</p>
            <p className="text-xs text-base-500">Before confirmation</p>
          </div>
          <div className="card p-4">
            <p className="font-semibold text-sm">Printer queue</p>
            <p className="text-xs text-base-500">Sent to your agent</p>
          </div>
        </div>
      </div>
    </section>
  );
}
