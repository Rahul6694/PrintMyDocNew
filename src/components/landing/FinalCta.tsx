import Link from "next/link";
import { OpenDemoButton } from "@/components/site/SiteModals";

export default function FinalCta() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-dark text-white px-6 sm:px-12 py-12 sm:py-16 text-center">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-yellow/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-accent-500/25 blur-3xl" />
        <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
          Apni dukaan ko <span className="text-yellow">smart printing</span> par le aao
        </h2>
        <p className="relative text-white/70 mb-8 max-w-lg mx-auto">
          QR uploads, WhatsApp orders, automatic pricing aur printer release — sab ek dashboard me.
        </p>
        <div className="relative flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary text-base !px-7 !py-3.5">
            🚀 Start Free
          </Link>
          <OpenDemoButton className="rounded-full px-7 py-3.5 font-semibold bg-yellow text-[#111114] hover:opacity-90 transition-opacity">
            🎯 Free Demo
          </OpenDemoButton>
          <Link
            href="/login"
            className="rounded-full px-7 py-3.5 font-semibold border border-white/25 hover:border-white transition-colors"
          >
            🔑 Shop Owner Login
          </Link>
        </div>
        <p className="relative text-sm text-white/50 mt-6">
          Pay online or cash · Merchant-controlled pricing · Works with printers you already own
        </p>
      </div>
    </section>
  );
}
