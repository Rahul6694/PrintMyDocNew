"use client";

import { useEffect, useState } from "react";
import { Lock, Upload } from "lucide-react";

type Settings = {
  push_notifications: number;
  whatsapp_ack: number;
  print_receipt: number;
  auto_print_mode: string;
  order_separator: string;
  accept_online_payments: number;
  use_own_razorpay: number;
  razorpay_key_id: string | null;
  allow_manual_payment: number;
  checkout_display_name: string | null;
  payment_logo_url: string | null;
  currency: string;
  upi_id: string | null;
  min_order_amount: string;
  max_file_size_mb: number;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="toggle-switch" data-on={checked}>
      <span className="knob" />
    </button>
  );
}

export default function AutomationPaymentTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetch("/api/business/automation-payment")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => setPlan(data.subscription?.plan || null));
  }, []);

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/business/logo", { method: "POST", body: form });
    const data = await res.json();
    setUploadingLogo(false);
    if (res.ok && settings) setSettings({ ...settings, payment_logo_url: data.url });
  }

  async function persist(next: Settings, extra?: { razorpayKeySecret?: string }) {
    setSettings(next);
    const res = await fetch("/api/business/automation-payment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pushNotifications: !!next.push_notifications,
        whatsappAck: !!next.whatsapp_ack,
        printReceipt: !!next.print_receipt,
        autoPrintMode: next.auto_print_mode,
        orderSeparator: next.order_separator,
        acceptOnlinePayments: !!next.accept_online_payments,
        useOwnRazorpay: !!next.use_own_razorpay,
        razorpayKeyId: next.razorpay_key_id,
        razorpayKeySecret: extra?.razorpayKeySecret,
        allowManualPayment: !!next.allow_manual_payment,
        checkoutDisplayName: next.checkout_display_name,
        currency: next.currency,
        upiId: next.upi_id,
        minOrderAmount: next.min_order_amount,
        maxFileSizeMb: next.max_file_size_mb,
      }),
    });
    if (res.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(""), 1500);
    }
  }

  if (!settings) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6">
        <h3 className="font-semibold mb-4">General Settings</h3>

        <div className="space-y-2 mb-6">
          {[
            { key: "push_notifications" as const, label: "Push Notifications", desc: "Get notified for new orders and status changes" },
            { key: "whatsapp_ack" as const, label: "WhatsApp Acknowledgement", desc: "Auto-reply to customer when their order is received" },
            { key: "print_receipt" as const, label: "Print Receipt", desc: "Print a paper receipt for each completed order" },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-base-500">{row.desc}</p>
              </div>
              <Toggle checked={!!settings[row.key]} onChange={(v) => persist({ ...settings, [row.key]: v ? 1 : 0 })} />
            </div>
          ))}
        </div>

        <p className="text-xs text-base-500 uppercase tracking-wide mb-2">Auto-print configuration</p>
        {plan !== "premium" && (
          <p className="text-xs text-accent-400 bg-accent-500/10 border border-accent-500/30 rounded-lg px-3 py-2 mb-3">
            Current plan: {plan ? plan[0].toUpperCase() + plan.slice(1) : "None"}. Locked modes require the Premium plan —{" "}
            <a href="/dashboard/billing" className="underline">upgrade</a>.
          </p>
        )}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: "auto_all", label: "Auto Print All Documents", desc: "Every document prints automatically after confirmation", locked: plan !== "premium" },
            { key: "after_payment", label: "Print Only After Payment", desc: "Prints automatically only after online payment is verified", locked: plan !== "premium" },
            { key: "off", label: "Auto Print Off", desc: "Merchant uses One-Click Print manually", locked: false },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => !opt.locked && persist({ ...settings, auto_print_mode: opt.key })}
              disabled={opt.locked}
              className={`text-left text-sm border rounded-lg p-3 ${
                settings.auto_print_mode === opt.key ? "border-accent-500 bg-accent-500/10" : "border-base-700"
              } ${opt.locked ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{opt.label}</span>
                {opt.locked && <Lock size={13} className="text-base-500" />}
              </div>
              <p className="text-xs text-base-500">{opt.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-base-500 uppercase tracking-wide mb-2">Order separator</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "none", label: "No Separator" },
            { key: "bw_invoice", label: "B/W Invoice" },
            { key: "blank_page", label: "Blank Page" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => persist({ ...settings, order_separator: opt.key })}
              className={`text-left text-sm border rounded-lg p-3 ${
                settings.order_separator === opt.key ? "border-accent-500 bg-accent-500/10" : "border-base-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold">Payment &amp; Limits</h3>

        <div className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium">Accept online payments</p>
            <p className="text-xs text-base-500">Enables Razorpay checkout on the customer order page</p>
          </div>
          <Toggle
            checked={!!settings.accept_online_payments}
            onChange={(v) => persist({ ...settings, accept_online_payments: v ? 1 : 0 })}
          />
        </div>

        <div className="border border-base-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Use my own Razorpay account</p>
              <p className="text-xs text-base-500">Settle directly to your Razorpay account instead of the platform's</p>
            </div>
            <Toggle
              checked={!!settings.use_own_razorpay}
              onChange={(v) => persist({ ...settings, use_own_razorpay: v ? 1 : 0 })}
            />
          </div>
          {settings.use_own_razorpay === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input-field"
                placeholder="rzp_live_..."
                value={settings.razorpay_key_id || ""}
                onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                onBlur={() => persist(settings)}
              />
              <input
                className="input-field"
                type="password"
                placeholder="Enter a new secret"
                value={razorpaySecret}
                onChange={(e) => setRazorpaySecret(e.target.value)}
                onBlur={() => {
                  if (razorpaySecret) persist(settings, { razorpayKeySecret: razorpaySecret });
                  setRazorpaySecret("");
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium">Allow confirmation with manual payment</p>
            <p className="text-xs text-base-500">Customers can confirm and pay cash/offline at the shop</p>
          </div>
          <Toggle
            checked={!!settings.allow_manual_payment}
            onChange={(v) => persist({ ...settings, allow_manual_payment: v ? 1 : 0 })}
          />
        </div>

        <div>
          <label className="text-sm text-base-500 block mb-1.5">Checkout Display Name</label>
          <input
            className="input-field"
            value={settings.checkout_display_name || ""}
            onChange={(e) => setSettings({ ...settings, checkout_display_name: e.target.value })}
            onBlur={() => persist(settings)}
          />
        </div>

        <div className="border border-base-700 rounded-lg p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-base-900 border border-base-700 flex items-center justify-center overflow-hidden shrink-0">
            {settings.payment_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.payment_logo_url} alt="Payment logo" className="w-full h-full object-cover" />
            ) : (
              <Upload size={18} className="text-base-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Payment logo</p>
            <p className="text-xs text-base-500">Square image · min 256×256px · PNG/JPG · max 1MB</p>
          </div>
          <label className="btn-primary text-xs px-3 py-2 cursor-pointer">
            {uploadingLogo ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">UPI ID</label>
            <input
              className="input-field"
              placeholder="yourshop@upi"
              value={settings.upi_id || ""}
              onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
              onBlur={() => persist(settings)}
            />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Min. Order (INR)</label>
            <input
              className="input-field"
              value={settings.min_order_amount}
              onChange={(e) => setSettings({ ...settings, min_order_amount: e.target.value })}
              onBlur={() => persist(settings)}
            />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Max File Size (MB)</label>
            <input
              className="input-field"
              value={settings.max_file_size_mb}
              onChange={(e) => setSettings({ ...settings, max_file_size_mb: Number(e.target.value) })}
              onBlur={() => persist(settings)}
            />
          </div>
        </div>
      </div>

      {message && <p className="text-accent-400 text-sm">{message}</p>}
    </div>
  );
}
