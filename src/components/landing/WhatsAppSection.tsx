import { FileText, MessagesSquare, ShieldCheck, Bot } from "lucide-react";

const CARDS = [
  {
    icon: FileText,
    title: "Document intake",
    desc: "Customers message your shop's official WhatsApp Business number to send a file — no counter handoff needed.",
  },
  {
    icon: Bot,
    title: "Configurable auto-replies",
    desc: "Train Bot sends a greeting and a document-received message with your shop's order link — wording is yours to edit.",
  },
  {
    icon: MessagesSquare,
    title: "Web-based configuration",
    desc: "Customers still pick copies, colour and paper on the order page — the most reliable way to get exact settings.",
  },
  {
    icon: ShieldCheck,
    title: "Official & compliant",
    desc: "Built on Meta's WhatsApp Cloud API only — never the unofficial personal-number pairing that gets numbers banned.",
  },
];

export default function WhatsAppSection() {
  return (
    <section id="whatsapp" className="max-w-7xl mx-auto px-6 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">
            WhatsApp order automation
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            WhatsApp intake, without risking your number
          </h2>
          <p className="text-base-500 mb-6">
            Keep WhatsApp convenient for customers while every order still gets structured, priced, and
            queued the same reliable way — through the official Meta Cloud API, not an unofficial hack.
          </p>
          <a href="/register" className="btn-primary inline-block">
            Set up WhatsApp for my shop
          </a>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {CARDS.map((c) => (
            <div key={c.title} className="card p-5">
              <span className="w-10 h-10 rounded-lg bg-accent-500/10 text-accent-500 flex items-center justify-center mb-3">
                <c.icon size={17} />
              </span>
              <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-base-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
