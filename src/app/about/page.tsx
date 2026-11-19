import type { Metadata } from "next";
import Link from "next/link";
import { SitePage, Lead, Note, Sec, LegalLinks } from "@/components/site/SitePage";
import { PLANS, type PlanId } from "@/lib/plans";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — PrintMyDoc",
  description: "PrintMyDoc is a smart printing platform for cyber cafes, print shops and CSC centres: scan, upload, pay, auto print.",
};

const OFFERS = [
  "QR-based smart printing — Scan → Upload → Pay → Auto Print",
  "Works with the printers you already have — no Wi-Fi printer needed",
  "WhatsApp ordering through the official Cloud API",
  "Automatic pricing from your own rates, plus discounts",
  "Shop owner dashboard with Live Print and order tracking",
  "Employee logins, credits, referrals and withdrawals",
  "A lightweight desktop Agent that keeps printing through internet drops",
];

const AUDIENCE = [
  "Cyber Cafes",
  "Print & Xerox Shops",
  "CSC Centres",
  "Digital Service Centres",
  "Schools & Colleges",
  "Coaching Institutes",
  "Libraries and Offices",
  "Small & medium printing businesses",
];

const PLAN_ORDER: PlanId[] = ["basic", "standard", "premium"];

export default function AboutPage() {
  return (
    <SitePage eyebrow="✨ About" title="About PrintMyDoc" meta={[<b key="a" className="text-ink">Smart Printing. Made Simple.</b>, "Scan · Upload · Pay · Auto Print"]}>
      <Lead>
        <strong>PrintMyDoc</strong> is a smart printing platform built for cyber cafes, print shops, CSC centres and digital
        service businesses. Our mission is simple — make printing fast, automated and hassle-free.
      </Lead>
      <Note title="How it works">
        The customer scans your QR code, uploads the document and pays — and the print starts on your printer. No pendrive, no
        files over WhatsApp, no manual file handling.
      </Note>

      <Sec n={1} title="Our Mission">
        <p>
          Technology should make people&apos;s work easier. PrintMyDoc lets any print shop offer a modern self-service printing
          experience without expensive hardware or a complicated setup.
        </p>
        <p>Our goal isn&apos;t just to provide software, but to help every shop owner run a more professional, faster business.</p>
      </Sec>

      <Sec n={2} title="What PrintMyDoc offers">
        <ul>
          {OFFERS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </Sec>

      <Sec n={3} title="Who it's for">
        <div className="flex flex-wrap gap-2">
          {AUDIENCE.map((a) => (
            <span key={a} className="rounded-full bg-base-800 border border-base-700 px-3 py-1.5 text-[13px] font-medium text-ink">
              {a}
            </span>
          ))}
        </div>
      </Sec>

      <Sec n={4} title="Direct support, without a middleman">
        <p>
          If you hit a problem during setup or while using the software, you talk to the PrintMyDoc team directly — so every
          shop gets the full benefit without confusion.
        </p>
      </Sec>

      <Sec n={5} title="What we sell" id="what-we-sell">
        <p>
          PrintMyDoc is a software business. We sell monthly software subscriptions (SaaS) to print shops, cyber cafes and CSC
          centres. We do not sell physical goods.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            return (
              <div key={id} className="rounded-2xl border border-base-700 bg-base-950 p-4">
                <b className="block font-display text-ink">{p.name}</b>
                <span className="block text-2xl font-extrabold text-ink my-1">
                  ₹{p.price}
                  <span className="text-xs font-normal text-base-500"> /month</span>
                </span>
                <span className="text-xs">{p.orderLimit ? `Up to ${p.orderLimit} orders / month` : "Unlimited orders"}</span>
              </div>
            );
          })}
        </div>
        <p className="text-ink font-semibold mt-1">How it is delivered</p>
        <ul>
          <li>Everything is delivered online. There is no physical shipping.</li>
          <li>Your shop account is created the moment your payment is confirmed.</li>
          <li>Payments are taken online through Razorpay.</li>
          <li>
            Current prices are always shown on the <Link href="/#pricing">pricing section</Link>.
          </li>
        </ul>
      </Sec>

      <Sec n={6} title="Contact details" id="contact-details">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="[&_th]:text-left [&_th]:font-semibold [&_th]:text-ink [&_th]:py-2 [&_th]:pr-4 [&_th]:w-40 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-base-700 [&_tr:last-child]:border-0">
              <tr>
                <th scope="row">Business name</th>
                <td>PrintMyDoc</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </td>
              </tr>
              {SUPPORT_PHONE && (
                <tr>
                  <th scope="row">Mobile / WhatsApp</th>
                  <td>
                    {SUPPORT_WHATSAPP ? (
                      <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener">
                        {SUPPORT_PHONE}
                      </a>
                    ) : (
                      SUPPORT_PHONE
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <th scope="row">Support</th>
                <td>
                  <Link href="/contact">Contact page</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Sec>

      <Note title="PrintMyDoc">
        Scan. Upload. Pay. Auto Print.
        <br />
        Making printing smarter, faster &amp; simpler.
      </Note>
      <LegalLinks />
    </SitePage>
  );
}
