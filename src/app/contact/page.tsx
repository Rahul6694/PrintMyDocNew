import type { Metadata } from "next";
import { SitePage, Lead, Sec } from "@/components/site/SitePage";
import { EnquiryForm } from "@/components/site/SiteModals";
import { SUPPORT_EMAIL, SUPPORT_PHONE, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us — PrintMyDoc",
  description: "Talk to the PrintMyDoc team on WhatsApp, email or phone — direct support, no middleman.",
};

export default function ContactPage() {
  const wa = whatsappLink("Hello PrintMyDoc, I have a question.");
  const cards = [
    wa && { href: wa, ext: true, icon: "💚", title: "WhatsApp", value: SUPPORT_PHONE || "Chat with us", hint: "You get the fastest reply here" },
    { href: `mailto:${SUPPORT_EMAIL}`, ext: false, icon: "✉️", title: "Email", value: SUPPORT_EMAIL, hint: "For detailed matters" },
    SUPPORT_PHONE && {
      href: `tel:${SUPPORT_PHONE.replace(/\s/g, "")}`,
      ext: false,
      icon: "📞",
      title: "Phone",
      value: SUPPORT_PHONE,
      hint: "During working hours",
    },
  ].filter(Boolean) as { href: string; ext: boolean; icon: string; title: string; value: string; hint: string }[];

  return (
    <SitePage eyebrow="💬 Contact" title="Talk to Us" meta={["Direct support, no middleman"]}>
      <Lead>
        Have a setup problem or something you don&apos;t understand? Message us directly — there&apos;s no third-party support
        team; you get the answer from us.
      </Lead>

      <div className={`grid gap-3 ${cards.length === 3 ? "sm:grid-cols-3" : cards.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.href}
            {...(c.ext ? { target: "_blank", rel: "noopener" } : {})}
            className="card p-5 flex flex-col items-center text-center gap-1 hover:-translate-y-1 hover:border-accent-500 transition-all"
          >
            <span className="text-3xl mb-1" aria-hidden>
              {c.icon}
            </span>
            <b className="font-display">{c.title}</b>
            <span className="text-sm font-semibold text-accent-500 break-all">{c.value}</span>
            <span className="text-xs text-base-500">{c.hint}</span>
          </a>
        ))}
      </div>

      <Sec n="✉" title="Or send a message right here">
        <EnquiryForm />
      </Sec>
    </SitePage>
  );
}
