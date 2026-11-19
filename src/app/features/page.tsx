import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, UploadCloud, Printer } from "lucide-react";
import { SitePage, Note } from "@/components/site/SitePage";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Features — PrintMyDoc",
  description: "QR and WhatsApp ordering, automatic pricing, auto print, photo editing and a full shop dashboard — everything PrintMyDoc does.",
};

const PAINS = [
  { icon: "💬", title: "Asking for files on WhatsApp", text: "Your personal number goes to every customer. Files get lost in chat, and you keep scrolling for “that file, bhaiya”." },
  { icon: "🦠", title: "Pendrive viruses", text: "Every customer pendrive is a virus risk. The PC slows down, files corrupt, and sometimes the whole system crashes." },
  { icon: "📒", title: "The accounting headache", text: "Who paid, who didn't — written in a notebook, then forgotten. At month-end the accounts never add up." },
  { icon: "⏰", title: "Everyone waiting in the crowd", text: "You print for one customer while five others stand waiting. Take the file, open it, print — the whole day goes into this." },
];

const SOLUTION = [
  { icon: QrCode, title: "Stick the QR in the shop" },
  { icon: UploadCloud, title: "Customer scans, uploads, pays" },
  { icon: Printer, title: "The print comes out on its own" },
];

const BENEFITS = [
  { icon: "🔲", title: "QR + Link Ordering", text: "Customers scan your Shop QR or open your shop link — no app, no login. Copies, colour, sides and paper size are chosen on their phone." },
  { icon: "💬", title: "WhatsApp Orders", text: "Connect an official WhatsApp Cloud API number and customers can send files on WhatsApp — straight into the same queue." },
  { icon: "💰", title: "Automatic Pricing", text: "Your per-page rates price every order instantly. Add discounts, and customers see the final amount before they pay." },
  { icon: "⚡", title: "Auto Print", text: "Print only after online payment is verified, auto-print everything, or keep it manual with one-click release — your choice." },
  { icon: "✂️", title: "Photo Editing on the Phone", text: "Customers rotate, zoom and crop photos themselves before sending — no more “thoda seedha kar do”." },
  { icon: "📄", title: "Peak-hour Separator", text: "Insert a B&W invoice or a blank page between jobs, so back-to-back orders never mix at the printer tray." },
  { icon: "💳", title: "Online or Cash", text: "Take UPI/card via Razorpay — or plug in your own Razorpay keys so money settles directly to you — or cash at the counter." },
  { icon: "👥", title: "Employees & Live Print", text: "Give staff their own logins and watch every job move from pending to printing to done on the Live Print screen." },
  { icon: "📶", title: "Safe if the Internet Drops", text: "The Agent keeps printing what it has already downloaded. New orders wait in the queue and print once you're back online." },
];

const COMPARE = [
  ["Receiving files", "Give your number, dig through chat", "QR scan — your number stays private"],
  ["Payment", "Remember who still owes", "Every order has its own payment record"],
  ["Your time", "Handle every print by hand", "Prints are released automatically"],
  ["Virus risk", "Pendrive = danger", "Zero — everything comes from the phone"],
  ["Pricing", "Count pages, quote by hand", "Your rates price every order"],
  ["Busy hours", "Orders mix up at the tray", "Separator page between every job"],
];

// Illustration only — uses the default sample B&W rate and the Basic plan price.
const PRINTS_PER_DAY = 15;
const RATE = 2;
const monthly = PRINTS_PER_DAY * RATE * 30;
const basic = PLANS.basic.price;
const daysToRecover = Math.ceil(basic / (PRINTS_PER_DAY * RATE));

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center mt-8 mb-1">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-1.5">{title}</h2>
      <p className="text-sm text-base-500">{sub}</p>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <SitePage wide eyebrow="🎁 Features" title="A System for the Whole Shop" meta={["Everything in one place", "No extra software"]}>
      <Heading title="😤 What happens in your shop right now?" sub="The daily pain of every cyber cafe and print shop owner" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PAINS.map((p) => (
          <div key={p.title} className="card p-5 hover:-translate-y-1 transition-transform">
            <span className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-2xl mb-3" aria-hidden>
              {p.icon}
            </span>
            <b className="block font-display font-bold mb-1">{p.title}</b>
            <p className="text-sm text-base-500 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>

      <Heading title="✨ After setting up PrintMyDoc" sub="Your job: stick up the QR. That's it." />
      <div className="rounded-3xl bg-gradient-to-br from-yellow/30 via-yellow/10 to-accent-500/10 border border-yellow p-5 sm:p-8">
        <div className="grid sm:grid-cols-3 gap-4">
          {SOLUTION.map((s, i) => (
            <div key={s.title} className="card p-5 text-center">
              <span className="mx-auto w-14 h-14 rounded-2xl bg-ink text-yellow flex items-center justify-center shadow-pop mb-3">
                <s.icon size={24} />
              </span>
              <b className="block font-display font-extrabold text-accent-500 mb-0.5">Step {i + 1}</b>
              <span className="font-semibold">{s.title}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-base-500 mt-5">
          You just sit at the counter — no taking files, opening them, or hitting print. The payment record builds itself.
        </p>
      </div>

      <Heading title="🎁 Not just printing — a system for the whole shop" sub="Everything you get, all in one place" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="card p-5">
            <span className="w-11 h-11 rounded-xl bg-yellow/25 flex items-center justify-center text-xl mb-3" aria-hidden>
              {b.icon}
            </span>
            <b className="block font-display font-bold mb-1">{b.title}</b>
            <p className="text-sm text-base-500 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </div>

      <Heading title="⚖️ Before vs After" sub="The old way compared with PrintMyDoc" />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="border-b border-base-700">
              <th className="p-4 text-left" />
              <th className="p-4 text-left font-display">📱 The WhatsApp way</th>
              <th className="p-4 text-left font-display text-accent-500">⚡ PrintMyDoc</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([k, bad, good]) => (
              <tr key={k} className="border-b border-base-700 last:border-0">
                <td className="p-4 font-bold">{k}</td>
                <td className="p-4 text-danger">✗ {bad}</td>
                <td className="p-4 text-success font-medium">✓ {good}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl bg-dark text-white p-6 sm:p-8 mt-4">
        <h3 className="text-xl font-extrabold mb-4">🧮 Do the math — how fast does it pay for itself?</h3>
        {[
          [`Just ${PRINTS_PER_DAY} B&W prints a day`, `${PRINTS_PER_DAY} × ₹${RATE} = ₹${PRINTS_PER_DAY * RATE}/day`],
          ["Monthly print earnings", `~₹${monthly.toLocaleString("en-IN")}`],
          [`${PLANS.basic.name} plan`, `₹${basic}/month`],
          ["Recovered", `In ${daysToRecover} days ✅`],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between gap-4 py-2.5 border-b border-white/10 last:border-0 text-sm">
            <span className="text-white/70">{a}</span>
            <span className="font-bold text-yellow text-right">{b}</span>
          </div>
        ))}
        <p className="text-[11px] text-white/50 mt-3">
          * Example only — your rates and order volume depend on your shop. Plus the time you save at the counter.
        </p>
      </div>

      <Note title="Everything in a single software">
        No separate photo tool, no WhatsApp chaos, no accounts notebook. One QR — and the whole shop&apos;s print work is done.
      </Note>

      <div className="text-center pt-2">
        <Link href="/#pricing" className="btn-primary !px-7 !py-3">
          See pricing →
        </Link>
      </div>
    </SitePage>
  );
}
