import HowItWorksVideo from "@/components/site/HowItWorksVideo";
import { QrCode, UploadCloud, SlidersHorizontal, Printer } from "lucide-react";

const STEPS = [
  { icon: QrCode, title: "Scan karo", desc: "Customer counter par laga QR kisi bhi camera se scan kare — koi app install nahi." },
  { icon: UploadCloud, title: "File upload karo", desc: "PDF, Word, photo — phone se seedha upload. Login ya sign-up ki zarurat nahi." },
  { icon: SlidersHorizontal, title: "Settings chuno", desc: "Copies, B&W ya colour, single/double side, paper size — price turant dikhta hai." },
  { icon: Printer, title: "Pay & auto print", desc: "Online UPI/card ya shop par cash. Payment hote hi print apne aap nikalta hai." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="badge bg-yellow/25 text-ink border border-yellow mb-4">How it works</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3">
          Sirf <span className="marker">4 steps</span> me print ready
        </h2>
        <p className="text-base-500">Shop QR se confirmed print order tak — bina counter par line lagaye.</p>
      </div>

      <HowItWorksVideo className="max-w-4xl mx-auto mb-10 sm:mb-14" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card p-6 relative overflow-hidden hover:-translate-y-1 transition-transform">
            <span className="absolute -right-2 -top-4 font-display font-extrabold text-[88px] leading-none text-base-800 select-none">
              {i + 1}
            </span>
            <span className="relative w-12 h-12 rounded-2xl bg-ink text-yellow flex items-center justify-center mb-4 shadow-pop">
              <s.icon size={22} />
            </span>
            <h3 className="relative font-bold text-lg mb-1">
              {i + 1}. {s.title}
            </h3>
            <p className="relative text-sm text-base-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
