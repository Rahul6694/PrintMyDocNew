"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Do I need to buy new printers or hardware?",
    a: "No. The local PrintMyDoc agent sends jobs to printers you already have installed on your shop computer — it doesn't require special hardware.",
  },
  {
    q: "Can I connect my personal WhatsApp number?",
    a: "No — and this is intentional. PrintMyDoc only supports the official Meta WhatsApp Cloud API. Unofficial personal-number pairing violates WhatsApp's Terms of Service and can get a number permanently banned.",
  },
  {
    q: "What happens if my internet goes down?",
    a: "The local agent keeps printing jobs it has already downloaded. New orders simply wait in the queue until you're back online — nothing is lost.",
  },
  {
    q: "Can I use my own Razorpay account instead of PrintMyDoc's?",
    a: "Yes. Business Setup → Automation & Payment lets you switch to your own Razorpay keys so payments settle directly to your account.",
  },
  {
    q: "What's the difference between the plans?",
    a: "All three plans include the same full feature set — the only difference is your monthly order limit (150 / 500 / unlimited).",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="text-center mb-10">
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">FAQ</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <div key={item.q} className="card overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-medium text-sm">{item.q}</span>
              <ChevronDown size={16} className={`text-base-500 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-base-500 leading-relaxed">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
