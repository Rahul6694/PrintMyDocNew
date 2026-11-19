import type { Metadata } from "next";
import Link from "next/link";
import { SitePage, Lead } from "@/components/site/SitePage";
import { OpenInquiryButton } from "@/components/site/SiteModals";

export const metadata: Metadata = {
  title: "Partner Program — PrintMyDoc",
  description: "Refer other shops and earn, or talk to us about bulk and custom deals.",
};

export default function PartnerPage() {
  return (
    <SitePage wide eyebrow="🤝 Partner Program" title="Earn Together" meta={["Pick the way that suits you"]}>
      <div className="max-w-3xl mx-auto w-full text-center">
        <Lead>
          Already running PrintMyDoc? Refer other shops and earn. Thinking about something bigger? Start by talking to us.
        </Lead>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
        <div className="card p-6 flex flex-col">
          <span className="text-4xl mb-3" aria-hidden>
            🎁
          </span>
          <b className="font-display text-lg font-extrabold mb-1">Referral Program</b>
          <p className="text-sm text-base-500 leading-relaxed mb-5">
            Every shop gets its own referral code in the dashboard. When a new shop signs up with your code, you earn a referral
            bonus in your wallet — tracked in the Referrals tab and withdrawable from your dashboard.
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Link href="/dashboard/referrals" className="btn-primary">
              Open my Referrals →
            </Link>
            <Link href="/register" className="btn-secondary">
              Create account
            </Link>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <span className="text-4xl mb-3" aria-hidden>
            💼
          </span>
          <b className="font-display text-lg font-extrabold mb-1">Business Inquiry</b>
          <p className="text-sm text-base-500 leading-relaxed mb-5">
            Planning a bulk deal for many shops, a custom requirement, or a partnership? Fill the form and the message reaches
            us directly.
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <OpenInquiryButton className="btn-primary !bg-ink !text-base-950 !shadow-none">Talk to us →</OpenInquiryButton>
            <Link href="/contact" className="btn-secondary">
              Contact page
            </Link>
          </div>
        </div>
      </div>
    </SitePage>
  );
}
