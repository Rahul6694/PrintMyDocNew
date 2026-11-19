import type { Metadata } from "next";
import { SitePage, Lead, Note, Sec } from "@/components/site/SitePage";
import { OpenInquiryButton } from "@/components/site/SiteModals";
import { whatsappLink } from "@/lib/site";
import HowItWorksVideo from "@/components/site/HowItWorksVideo";

export const metadata: Metadata = {
  title: "How to Set Up PrintMyDoc — Setup Guide",
  description: "Step-by-step guide: create your account, install the PrintMyDoc Agent, pick your printer and take your first QR print.",
};

type Step = { icon: string; title: string; body: React.ReactNode; sub?: string[] };

const MAIN: Step[] = [
  {
    icon: "💳",
    title: "Create your account",
    body: (
      <>
        Go to <b>Start Free</b>, fill in your shop details and pick a plan. Pay securely via Razorpay — your shop account is
        created the moment the payment is confirmed.
      </>
    ),
  },
  {
    icon: "🔑",
    title: "Log in to your shop",
    body: (
      <>
        Use <b>Shop Owner Login</b> with your email and password. You land straight on your Shop Dashboard.
      </>
    ),
  },
  {
    icon: "📥",
    title: "Open Business Setup → Printers",
    body: <>In the dashboard sidebar open Business Setup and go to the Printers tab. There are two things to do here:</>,
    sub: ["💻 Download the PrintMyDoc Agent (your computer's OS is detected automatically)", "🔐 Generate your Agent Credentials — Shop ID + Secret Key"],
  },
  {
    icon: "🖥️",
    title: "Install the Agent on the shop PC",
    body: (
      <>
        Install the Agent on the computer your printers are connected to. On first run it asks for your <b>Shop ID</b>,{" "}
        <b>Secret Key</b> and <b>Server URL</b> — paste the values shown in the Printers tab.
      </>
    ),
  },
  {
    icon: "🟢",
    title: "Wait for “Connected”",
    body: (
      <>
        The Agent sends its first heartbeat within a few seconds. The Printers tab then shows the Agent as{" "}
        <b>Connected</b> and lists the printers installed on that PC.
      </>
    ),
  },
  {
    icon: "🖨️",
    title: "Choose your default printer",
    body: (
      <>
        In the same tab, mark one printer as <b>Default</b> and set its paper tray. Orders you release are sent straight to
        this printer.
      </>
    ),
  },
  {
    icon: "💰",
    title: "Set your prices",
    body: (
      <>
        Open Business Setup → <b>Pricing</b> and set your per-page rates for B&amp;W, colour and double-sided. New shops start
        with sample rates (₹2 B&amp;W, ₹10 colour on A4) — change them to match your counter.
      </>
    ),
  },
  {
    icon: "🎉",
    title: "Download your QR and test",
    body: (
      <>
        Open <b>Shop QR</b>, download or print your QR, then scan it with your phone and place a <b>test order</b>. When the
        page comes out of your printer, you&apos;re live! 🎊
      </>
    ),
  },
];

const PAYMENT: Step[] = [
  {
    icon: "🏦",
    title: "Create a Razorpay account",
    body: (
      <>
        Sign up at <b>razorpay.com</b> and complete the KYC for your shop.
      </>
    ),
  },
  {
    icon: "🔐",
    title: "Generate Live API keys",
    body: (
      <>
        Once the account is active, open Razorpay&apos;s <b>Settings → API Keys</b> and generate a <b>Live</b> key pair.
      </>
    ),
  },
  {
    icon: "⚙️",
    title: "Open Automation & Payment",
    body: (
      <>
        In your PrintMyDoc dashboard go to Business Setup → <b>Automation &amp; Payment</b> and switch on{" "}
        <b>“Use my own Razorpay account”</b>.
      </>
    ),
  },
  {
    icon: "🔑",
    title: "Paste the keys and save",
    body: (
      <>
        Paste your <b>Key ID</b> and <b>Key Secret</b>, set a checkout display name, and save. Customer payments now settle
        directly into your Razorpay account.
      </>
    ),
  },
  {
    icon: "⚡",
    title: "Pick an auto-print mode",
    body: (
      <>
        On the same page choose <b>Print Only After Payment</b> or <b>Auto Print All Documents</b> (Premium plan), or keep{" "}
        <b>Auto Print Off</b> and release each order with one click.
      </>
    ),
  },
];

function Flow({ steps, alt = false }: { steps: Step[]; alt?: boolean }) {
  return (
    <ol className="relative flex flex-col gap-3">
      <span aria-hidden className={`absolute left-[27px] top-6 bottom-6 w-0.5 ${alt ? "bg-accent-500/25" : "bg-yellow/60"}`} />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 rounded-2xl border border-base-700 bg-base-850 p-4 sm:p-5">
          <span
            className={`relative shrink-0 w-14 h-14 -ml-1 rounded-full flex items-center justify-center text-2xl ${
              alt ? "bg-accent-500/10" : "bg-yellow/25"
            }`}
          >
            <span aria-hidden>{s.icon}</span>
            <span
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center border-2 border-base-850 ${
                alt ? "bg-accent-500 text-white" : "bg-ink text-yellow"
              }`}
            >
              {i + 1}
            </span>
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-[15.5px] mb-1">{s.title}</h3>
            <p className="text-sm text-base-500 leading-relaxed [&_b]:text-ink">{s.body}</p>
            {s.sub && (
              <div className="mt-2.5 flex flex-col gap-1.5">
                {s.sub.map((x) => (
                  <div key={x} className="text-[13px] font-medium rounded-xl bg-base-800 px-3 py-2">
                    {x}
                  </div>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SecHead({ tag, title, sub, alt = false }: { tag: string; title: string; sub?: string; alt?: boolean }) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
        <span className={`badge px-2.5 py-1 ${alt ? "bg-accent-500 text-white" : "bg-ink text-yellow"}`}>{tag}</span>
        <h2 className="text-xl sm:text-2xl font-extrabold">{title}</h2>
      </div>
      {sub && <p className="text-sm text-base-500">{sub}</p>}
    </div>
  );
}

export default function SetupGuidePage() {
  const wa = whatsappLink("Hello, I need help with PrintMyDoc setup.");
  return (
    <SitePage
      eyebrow="🧭 Setup Guide"
      title="How to Set Up PrintMyDoc"
      meta={["⏱️ Up and running in about 10 minutes", "🙋 No technical knowledge needed"]}
    >
      <Lead>
        This guide walks you <strong>step-by-step</strong> from creating your account to taking your first test print.
        Follow the steps in order — and if you get stuck, the support box at the bottom has our contact details.
      </Lead>
      <Note title="In one line">
        Sign up → Business Setup → Printers → download the Agent + generate credentials → install on the PC → pick the default
        printer → set prices → scan your Shop QR and print a test. That&apos;s all.
      </Note>

      <HowItWorksVideo />

      <SecHead tag="Step 1–8" title="🖨️ Set up printing" sub="Everyone needs these 8 steps — whether you take cash at the counter or online payment." />
      <Flow steps={MAIN} />

      <SecHead
        alt
        tag="Step 1–5 · Optional"
        title="💳 Your own Razorpay account"
        sub="Skip this if you only take cash, or are happy with the default payment setup. Follow it if you want online payments settled straight into your own account."
      />
      <Flow steps={PAYMENT} alt />

      <SecHead tag="FAQ" title="❓ Common questions" />
      <Sec n={1} title="Do I need a new printer or a Wi-Fi printer?">
        <p>
          No. The Agent prints to any printer already installed on your shop computer — USB or network. If your computer can print
          to it, PrintMyDoc can.
        </p>
      </Sec>
      <Sec n={2} title="What happens if the internet goes down?">
        <p>
          The Agent keeps printing jobs it has already downloaded. New orders wait safely in the queue and print as soon as
          you&apos;re back online — nothing is lost.
        </p>
      </Sec>
      <Sec n={3} title="Can customers order on WhatsApp too?">
        <p>
          Yes. Open <b>WhatsApp Setup</b> in the dashboard to connect an official WhatsApp Cloud API number. Personal-number
          pairing isn&apos;t supported, because it breaks WhatsApp&apos;s terms and can get the number banned.
        </p>
      </Sec>
      <Sec n={4} title="The Agent shows offline — what should I check?">
        <p>
          Make sure the Agent is running on the shop PC and the PC has internet. Then check the Shop ID, Secret Key and Server
          URL in the Agent match the Printers tab — if in doubt, generate new credentials and paste them again.
        </p>
      </Sec>

      <div className="relative overflow-hidden rounded-3xl bg-dark text-white text-center px-6 py-8 mt-2">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-yellow/20 blur-3xl" />
        <h3 className="relative text-xl font-extrabold mb-1">Stuck during setup?</h3>
        <p className="relative text-white/70 text-sm mb-5">If any step is unclear — reach us directly, and we&apos;ll help.</p>
        <div className="relative flex flex-wrap justify-center gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="rounded-full px-5 py-2.5 font-bold bg-[#1fa855] hover:bg-[#178f47] transition-colors">
              💬 WhatsApp Support
            </a>
          )}
          <OpenInquiryButton className="btn-primary">💼 Send a message</OpenInquiryButton>
        </div>
      </div>
    </SitePage>
  );
}
