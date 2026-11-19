import Link from "next/link";
import { QrCode, UploadCloud, CreditCard, Printer, CheckCircle2, FileText, ShieldCheck, Zap } from "lucide-react";

const FLOW = [
  { icon: QrCode, top: "SCAN", sub: "QR Code" },
  { icon: UploadCloud, top: "UPLOAD", sub: "Document" },
  { icon: CreditCard, top: "PAY", sub: "Online / Cash" },
  { icon: Printer, top: "AUTO PRINT", sub: "Instantly" },
];

const TRUST = ["All printers supported", "No Wi-Fi printer needed", "B&W + Colour", "Setup in 2 minutes"];

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-14 sm:pb-20 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
      <div className="text-center lg:text-left">
        <span className="badge bg-base-850 border border-base-700 text-ink px-3 py-1.5 mb-6 shadow-sm">
          <ShieldCheck size={13} className="text-success" /> Files auto-delete after print · Privacy by design
        </span>

        <p className="font-display font-bold text-2xl sm:text-3xl leading-tight">QR se print —</p>
        <h1 className="font-display font-extrabold leading-[0.92] tracking-[-0.04em] text-[clamp(56px,13vw,112px)] my-1">
          Print<span className="text-gradient">MyDoc</span>
        </h1>

        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-ink text-base-950 font-display font-extrabold tracking-wide text-sm sm:text-base px-4 py-2 rounded-xl -rotate-1 mt-3 mb-6">
          SCAN <span className="text-yellow">•</span> UPLOAD <span className="text-yellow">•</span> PAY{" "}
          <span className="text-yellow">•</span> PRINT
        </div>

        <p className="text-lg sm:text-xl font-semibold mb-1">
          Customer ke phone se, <span className="marker">print seedha aapke printer par</span>
        </p>
        <p className="text-base-500 mb-8">No WhatsApp · No pendrive · No file transfer · No counter queue</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
          {FLOW.map((f, i) => (
            <div key={f.top} className="card px-3 py-3 flex flex-col items-center text-center">
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                  i === 3 ? "bg-accent-500 text-white" : "bg-yellow text-[#111114]"
                }`}
              >
                <f.icon size={17} strokeWidth={2.4} />
              </span>
              <span className="font-display font-extrabold text-xs tracking-wide">{f.top}</span>
              <span className="text-[11px] text-base-500">{f.sub}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
          <Link href="/register" className="btn-primary text-base !px-6 !py-3">
            🚀 Abhi Start Karein
          </Link>
          <a href="#pricing" className="btn-secondary text-base !px-6 !py-3">
            💰 Plans from ₹100
          </a>
        </div>

        <ul className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-base-500">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-success" /> {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual: phone scanning → paid → printer feeding paper */}
      <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
        <div className="absolute -inset-6 rounded-[2.5rem] bg-yellow/30 blur-2xl -z-10" />
        <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
          <div className="anim-float rounded-[2rem] bg-ink p-2.5 shadow-2xl">
            <div className="rounded-[1.6rem] bg-base-850 p-4 min-h-[340px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-extrabold text-sm">
                  Print<span className="text-accent-500">MyDoc</span>
                </span>
                <span className="badge bg-success/10 text-success text-[10px]">● Live</span>
              </div>
              <p className="text-[11px] text-base-500 uppercase tracking-wide font-semibold">Sharma Xerox</p>
              <p className="font-display font-bold text-lg mb-3">Upload &amp; pay</p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 rounded-xl border border-base-700 px-3 py-2">
                  <FileText size={16} className="text-accent-500" />
                  <span className="text-xs font-semibold flex-1">Notes.pdf</span>
                  <span className="text-[10px] text-base-500">12 pages</span>
                </div>
                <div className="flex gap-1.5 text-[10px] font-semibold">
                  <span className="rounded-full bg-ink text-base-950 px-2 py-1">B&amp;W</span>
                  <span className="rounded-full border border-base-700 px-2 py-1">A4</span>
                  <span className="rounded-full border border-base-700 px-2 py-1">2 copies</span>
                </div>
              </div>
              <div className="mt-auto rounded-xl bg-base-900 border border-base-700 p-3 flex items-center justify-between mb-2">
                <span className="text-xs text-base-500">Total</span>
                <span className="font-display font-extrabold">₹24</span>
              </div>
              <div className="rounded-full bg-accent-500 text-white text-center text-sm font-bold py-2.5">
                Pay ₹24 &amp; Print
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pb-4">
            <span className="badge bg-success text-white text-[11px] px-2.5 py-1 shadow-lg">
              <CheckCircle2 size={12} /> Paid
            </span>
            <span className="badge bg-yellow text-[#111114] text-[11px] px-2.5 py-1 shadow-lg">
              <Zap size={12} /> Printing…
            </span>
            <div className="relative w-28">
              <div className="h-16 overflow-hidden mx-4">
                <div className="anim-feed h-16 bg-white border border-base-700 rounded-t-md px-2 pt-2 space-y-1">
                  <div className="h-1 rounded bg-base-600 w-4/5" />
                  <div className="h-1 rounded bg-base-600 w-3/5" />
                  <div className="h-1 rounded bg-base-600 w-4/5" />
                </div>
              </div>
              <div className="h-14 rounded-2xl bg-ink flex items-center justify-center text-yellow shadow-xl">
                <Printer size={26} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
