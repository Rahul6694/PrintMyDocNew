import { QrCode, UploadCloud, SlidersHorizontal, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: QrCode,
    step: "Step 1",
    title: "Scan the QR",
    desc: "Scan the shop's QR code with any camera app — no app install needed.",
  },
  {
    icon: UploadCloud,
    step: "Step 2",
    title: "Upload your document",
    desc: "Choose your file from your phone — no sign-up required.",
  },
  {
    icon: SlidersHorizontal,
    step: "Step 3",
    title: "Set print preferences",
    desc: "Pick copies, B&W or color, single or double-sided, and paper size.",
  },
  {
    icon: CheckCircle2,
    step: "Step 4",
    title: "Pay & get your print",
    desc: "Pay online or at the shop, then collect your print when it's ready.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">How it works</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Scan. Upload. Choose. Print.</h2>
        <p className="text-base-500">Four simple steps take a customer from your shop QR to a confirmed print order.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        {STEPS.map((s) => (
          <div key={s.title} className="card p-6">
            <span className="w-11 h-11 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center mb-4">
              <s.icon size={20} />
            </span>
            <span className="badge bg-base-800 text-base-500 mb-2">{s.step}</span>
            <h3 className="font-semibold mb-1">{s.title}</h3>
            <p className="text-sm text-base-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
