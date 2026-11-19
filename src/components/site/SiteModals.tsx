"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, MessageCircle, Mail, Printer, X } from "lucide-react";
import { saveEnquiry, sendEnquiry, validateEnquiry, type Enquiry } from "@/lib/enquiry";
import { SUPPORT_WHATSAPP } from "@/lib/site";

type ModalKind = "demo" | "inquiry" | null;
const Ctx = createContext<{ open: (k: Exclude<ModalKind, null>) => void }>({ open: () => {} });

export function useSiteModals() {
  return useContext(Ctx);
}

export function SiteModalsProvider({ children }: { children: React.ReactNode }) {
  const [kind, setKind] = useState<ModalKind>(null);
  const close = useCallback(() => setKind(null), []);
  return (
    <Ctx.Provider value={{ open: setKind }}>
      {children}
      {kind === "demo" && <DemoModal onClose={close} />}
      {kind === "inquiry" && <InquiryModal onClose={close} />}
    </Ctx.Provider>
  );
}

// Buttons usable from server components.
export function OpenDemoButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open } = useSiteModals();
  return (
    <button type="button" className={className} onClick={() => open("demo")}>
      {children}
    </button>
  );
}

export function OpenInquiryButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open } = useSiteModals();
  return (
    <button type="button" className={className} onClick={() => open("inquiry")}>
      {children}
    </button>
  );
}

/* ───────────────────────── shared shell ───────────────────────── */

function ModalShell({ onClose, labelledBy, children }: { onClose: () => void; labelledBy: string; children: React.ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    boxRef.current?.querySelector<HTMLInputElement>("input, textarea")?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111114]/55 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-base-850 border border-base-700 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-base-500 hover:text-ink hover:bg-base-800 transition-colors"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className="rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm px-3.5 py-2.5 mb-3">{msg}</div>;
}

function phoneHint(phone: string): { text: string; ok: boolean } | null {
  if (!phone) return null;
  if (!/^\d*$/.test(phone)) return { text: "Digits only", ok: false };
  if (phone.length < 10) return { text: `${10 - phone.length} more digit${phone.length === 9 ? "" : "s"}`, ok: false };
  if (!/^[6-9]/.test(phone)) return { text: "Indian mobile numbers start with 6–9", ok: false };
  return { text: "✓ Looks good", ok: true };
}

const digits10 = (v: string) => v.replace(/\D/g, "").slice(0, 10);

/* ───────────────────────── Free Demo ───────────────────────── */

function DemoModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shop, setShop] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const hint = phoneHint(phone);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!shop.trim()) return setError("Please enter your shop name.");
    if (!address.trim()) return setError("Please enter your shop address.");
    const enquiry: Enquiry = {
      name,
      phone,
      email,
      message: `[Free demo request]\nShop: ${shop.trim()}\nAddress: ${address.trim()}`,
    };
    const invalid = validateEnquiry(enquiry);
    if (invalid) return setError(invalid);
    setSending(true);
    const res = await saveEnquiry(enquiry);
    setSending(false);
    if (!res.ok) return setError(res.error || "Could not send your request.");
    setDone(true);
  }

  return (
    <ModalShell onClose={onClose} labelledBy="demoModalTitle">
      <div className="text-center mb-5 pr-4 pl-4">
        <span className="inline-flex w-12 h-12 rounded-2xl bg-ink text-yellow items-center justify-center shadow-pop mb-3">
          <Printer size={22} />
        </span>
        <h3 id="demoModalTitle" className="text-xl font-extrabold">
          🎯 Free Demo
        </h3>
        <p className="text-sm text-base-500 mt-1">Fill in your shop details — we&apos;ll set up a demo and send you the login on WhatsApp.</p>
        <span className="inline-flex items-center gap-1.5 mt-3 text-[11.5px] font-semibold text-success bg-success/10 rounded-full px-3 py-1">
          <Lock size={11} /> Secure form · No payment · No card
        </span>
      </div>

      {done ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold mb-1">Request received!</p>
          <p className="text-sm text-base-500 mb-4">
            We&apos;ll message you on <b className="text-ink">{phone}</b> with your demo login shortly. Want to start right now instead?
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/register" className="btn-primary text-sm" onClick={onClose}>
              Create my account →
            </Link>
            <Link href="/setup-guide" className="btn-secondary text-sm" onClick={onClose}>
              Read setup guide
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2.5" noValidate>
          <ErrorBox msg={error} />
          <input className="input-field" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <input
              className="input-field"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="WhatsApp number (10 digits)"
              value={phone}
              onChange={(e) => setPhone(digits10(e.target.value))}
            />
            {hint && <p className={`text-xs mt-1 ml-1 ${hint.ok ? "text-success" : "text-warning"}`}>{hint.text}</p>}
          </div>
          <input className="input-field" autoComplete="organization" placeholder="Shop name" value={shop} onChange={(e) => setShop(e.target.value)} />
          <input className="input-field" autoComplete="street-address" placeholder="Shop address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="input-field" type="email" autoComplete="email" placeholder="Email address (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="input-field !bg-base-800 text-base-500 font-semibold text-sm cursor-not-allowed select-none" aria-label="Printer">
            🖨️ Default Printer (auto-selected by the agent)
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full !py-3 mt-1">
            {sending ? "Sending…" : "Request Free Demo ›"}
          </button>
          <p className="text-[11px] text-base-500 text-center leading-relaxed">No payment · We reply on WhatsApp</p>
        </form>
      )}

      <button type="button" onClick={onClose} className="w-full mt-3 text-sm font-semibold text-base-500 hover:text-ink py-2">
        Close
      </button>
    </ModalShell>
  );
}

/* ───────────────────────── Business Inquiry ───────────────────────── */

export function EnquiryForm({ compact = false }: { compact?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [sending, setSending] = useState<"wa" | "mail" | null>(null);

  async function send(via: "wa" | "mail") {
    setError("");
    setOk("");
    const e: Enquiry = { name, phone, email, message };
    const invalid = validateEnquiry(e);
    if (invalid) return setError(invalid);
    setSending(via);
    const err = await sendEnquiry(e, via);
    setSending(null);
    if (err) return setError(err);
    setOk("✓ Message sent — we'll get back to you soon.");
    setMessage("");
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ErrorBox msg={error} />
      {ok && <div className="rounded-xl bg-success/10 border border-success/30 text-success text-sm px-3.5 py-2.5">{ok}</div>}
      <div className={compact ? "flex flex-col gap-2.5" : "grid sm:grid-cols-2 gap-2.5"}>
        <input className="input-field" placeholder="Your name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input-field"
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number (10 digit)"
          value={phone}
          onChange={(e) => setPhone(digits10(e.target.value))}
        />
      </div>
      <input className="input-field" type="email" placeholder="Email (optional)" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
      <textarea
        className="input-field min-h-[110px]"
        rows={4}
        maxLength={1000}
        placeholder="Your message — what would you like to know?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="grid sm:grid-cols-2 gap-2.5 mt-1">
        {SUPPORT_WHATSAPP && (
          <button
            type="button"
            disabled={!!sending}
            onClick={() => send("wa")}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 font-bold text-white bg-[#1fa855] hover:bg-[#178f47] disabled:opacity-50 transition-colors"
          >
            <MessageCircle size={16} /> {sending === "wa" ? "Sending…" : "Send via WhatsApp"}
          </button>
        )}
        <button
          type="button"
          disabled={!!sending}
          onClick={() => send("mail")}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 font-bold bg-ink text-base-950 hover:opacity-90 disabled:opacity-50 transition-opacity ${
            SUPPORT_WHATSAPP ? "" : "sm:col-span-2"
          }`}
        >
          <Mail size={16} /> {sending === "mail" ? "Sending…" : "Send via Email"}
        </button>
      </div>
    </div>
  );
}

function InquiryModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} labelledBy="inqModalTitle">
      <h3 id="inqModalTitle" className="text-xl font-extrabold pr-8">
        💼 Business Inquiry
      </h3>
      <p className="text-sm text-base-500 mt-1 mb-4">
        Fill the form — the message reaches us directly on {SUPPORT_WHATSAPP ? "WhatsApp or Email" : "Email"}.
      </p>
      <EnquiryForm compact />
      <button type="button" onClick={onClose} className="w-full mt-3 text-sm font-semibold text-base-500 hover:text-ink py-2">
        Close
      </button>
    </ModalShell>
  );
}
