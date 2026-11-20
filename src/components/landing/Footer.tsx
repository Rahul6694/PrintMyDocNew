import Link from "next/link";
import { BrandMark } from "./Nav";
import { OpenDemoButton, OpenInquiryButton } from "@/components/site/SiteModals";
import { SUPPORT_EMAIL, SUPPORT_HOURS, SUPPORT_PHONE, whatsappLink } from "@/lib/site";

const linkCls = "text-sm text-white/65 hover:text-white transition-colors text-left";

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg inline-block mb-3" aria-label="PrintMyDoc home">
              <BrandMark />
            </Link>
            <p className="text-sm text-white/65 leading-relaxed max-w-xs">
              Automated printing for cyber cafes and print shops — the customer scans your QR, and the print comes out on its own.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="font-display font-bold text-sm mb-1">Product</h4>
            <Link href="/" className={linkCls}>Home</Link>
            <Link href="/features" className={linkCls}>Features</Link>
            <Link href="/setup-guide" className={linkCls}>How to Setup</Link>
            <Link href="/#pricing" className={linkCls}>Pricing</Link>
            <Link href="/#faq" className={linkCls}>FAQ</Link>
            <OpenDemoButton className={linkCls}>Start Free Demo</OpenDemoButton>
            <Link href="/partner" className={linkCls}>🤝 Partner Program</Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <h4 className="font-display font-bold text-sm mb-1">Legal</h4>
            <Link href="/terms-and-conditions" className={linkCls}>Terms &amp; Conditions</Link>
            <Link href="/privacy-policy" className={linkCls}>Privacy Policy</Link>
            <Link href="/refund-policy" className={linkCls}>Refund Policy</Link>
            <Link href="/disclaimer" className={linkCls}>Disclaimer</Link>
            <Link href="/about" className={linkCls}>About</Link>
          </div>

          <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
            <h4 className="font-display font-bold text-sm mb-1">Contact</h4>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={`${linkCls} break-all`}>📧 {SUPPORT_EMAIL}</a>
            {SUPPORT_PHONE && (
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className={linkCls}>📞 {SUPPORT_PHONE}</a>
            )}
            {whatsappLink("Hello PrintMyDoc, I have a question.") && (
              <a href={whatsappLink("Hello PrintMyDoc, I have a question.")!} target="_blank" rel="noopener noreferrer" className={linkCls}>
                💬 WhatsApp Us
              </a>
            )}
            <span className="text-xs text-white/45 -mt-1">{SUPPORT_HOURS}</span>
            <OpenInquiryButton className={linkCls}>💼 Business Inquiry</OpenInquiryButton>
            <Link href="/login" className={linkCls}>🔑 Shop Owner Login</Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/45">
          © {new Date().getFullYear()} · Powered by <b className="text-white/70">PrintMyDoc</b> · All rights reserved.
        </div>
      </div>
    </footer>
  );
}
