import { Printer, Layers, Cpu } from "lucide-react";

const FEATURES = [
  {
    icon: Printer,
    tag: "A",
    title: "Default printer assignment",
    desc: "Move an order to \"Printing\" and it's sent straight to the printer you've set as default — no manual file hunting or repeated dialogs.",
    chips: ["One-click release", "Local agent", "Per-shop default"],
  },
  {
    icon: Layers,
    tag: "B",
    title: "Peak-hour order separator",
    desc: "Insert a B&W invoice or a blank spacer page between print jobs during busy hours, so back-to-back orders never get mixed up at the tray.",
    chips: ["Configurable per shop", "No mix-ups", "Off by default"],
  },
  {
    icon: Cpu,
    tag: "C",
    title: "Resilient local agent",
    desc: "The PrintMyDoc agent keeps printing jobs it's already downloaded even if your internet drops, and resumes polling the moment you're back online.",
    chips: ["Open source", "Runs on your PC", "Offline-tolerant"],
  },
];

export default function ProductFeatures() {
  return (
    <section id="product" className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">How it&apos;s built</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Three parts running under your counter.</h2>
        <p className="text-base-500">
          Every order flows through the same pipeline — priced by your rules, queued in one dashboard, and
          released to your printer by a small local agent.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="w-11 h-11 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
                <f.icon size={20} />
              </span>
              <span className="w-7 h-7 rounded-full bg-base-800 text-base-500 text-xs font-bold flex items-center justify-center">
                {f.tag}
              </span>
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-base-500 leading-relaxed mb-4">{f.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {f.chips.map((c) => (
                <span key={c} className="badge bg-base-800 text-base-500 text-xs">
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
