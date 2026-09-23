"use client";

import { useEffect, useState } from "react";
import { Smartphone, ShieldCheck, Cloud, Mail, Building2, Lock, CheckCircle2, WifiOff } from "lucide-react";

type Account = {
  phone_number_id: string;
  waba_id: string | null;
  display_phone_number: string | null;
  status: string;
  connected_at: string | null;
} | null;

function MetaBadge() {
  return (
    <span className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 font-serif font-bold text-lg">
      f
    </span>
  );
}

export default function WhatsAppSetupPage() {
  const [account, setAccount] = useState<Account>(null);
  const [placeholderQr, setPlaceholderQr] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testNumber, setTestNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("/api/webhooks/whatsapp");

  async function load() {
    const res = await fetch("/api/whatsapp");
    if (res.ok) {
      const data = await res.json();
      setAccount(data.account);
      if (data.account) {
        setPhoneNumberId(data.account.phone_number_id);
        setWabaId(data.account.waba_id || "");
      }
    }
  }

  useEffect(() => {
    load();
    setWebhookUrl(`${window.location.origin}/api/webhooks/whatsapp`);
    fetch("/api/whatsapp/placeholder-qr")
      .then((res) => res.json())
      .then((data) => setPlaceholderQr(data.dataUrl));
  }, []);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    const res = await fetch("/api/whatsapp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId, wabaId, accessToken }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setAccessToken("");
    setMessage(`Connected — verified as ${data.displayPhoneNumber}`);
    load();
  }

  async function disconnect() {
    await fetch("/api/whatsapp", { method: "DELETE" });
    load();
  }

  async function sendTest() {
    setError("");
    setMessage("");
    setTesting(true);
    const res = await fetch("/api/whatsapp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testNumber }),
    });
    const data = await res.json();
    setTesting(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setMessage("Test message sent — check that phone.");
  }

  const isConnected = account?.status === "connected";

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className="text-xs text-accent-400 font-semibold uppercase tracking-wide mb-1">Integration</p>
        <h1 className="text-2xl font-bold">WhatsApp Setup</h1>
      </div>

      <div
        className={`rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 border ${
          isConnected ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-success" : "bg-danger"}`} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${isConnected ? "text-success" : "text-danger"}`}>
              Current device status
            </p>
            <p className="font-semibold text-sm">
              {isConnected ? `Connected — ${account?.display_phone_number}` : "Disconnected — no active WhatsApp session"}
            </p>
          </div>
        </div>
        <span className={`badge ${isConnected ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
          {isConnected ? <CheckCircle2 size={12} /> : <WifiOff size={12} />}
          {isConnected ? "Online" : "Offline"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="card p-4 sm:p-6 opacity-60">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="badge bg-base-700 text-base-500 mb-2">Option 1</span>
              <h3 className="font-semibold">Quick Scan Login</h3>
              <p className="text-base-500 text-sm">Personal WhatsApp QR pairing</p>
            </div>
            <span className="w-9 h-9 rounded-full bg-base-800 text-base-500 flex items-center justify-center shrink-0">
              <Smartphone size={16} />
            </span>
          </div>
          <div className="relative flex items-center justify-center py-4">
            {placeholderQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={placeholderQr} alt="Quick Scan Login is not available" className="w-40 h-40 grayscale" />
            ) : (
              <div className="w-40 h-40 bg-base-800 rounded animate-pulse" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-11 h-11 rounded-full bg-base-900/90 border border-base-700 flex items-center justify-center">
                <Lock size={18} className="text-base-500" />
              </span>
            </div>
          </div>

          <div className="border-t border-base-700/60 pt-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-base-500" />
              <p className="text-sm font-semibold">Not available</p>
            </div>
            <p className="text-xs text-base-500 leading-relaxed">
              This QR doesn&apos;t link to anything — scanning it does nothing. Real Quick Scan pairing
              would use unofficial automation to hijack a merchant&apos;s personal WhatsApp session,
              which violates WhatsApp&apos;s Terms of Service and has gotten real numbers permanently
              banned. We won&apos;t offer it, even as a convenience option. Use Meta Business (Option 2)
              instead.
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="bg-[#1877F2] p-4 flex items-center gap-3">
            <MetaBadge />
            <div className="text-white">
              <span className="badge bg-white/20 text-white mb-1">Option 2 · Recommended</span>
              <h3 className="font-semibold">Connect WhatsApp Through Meta Business</h3>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-2 text-sm text-base-500 mb-5">
              <li className="flex items-start gap-2">
                <Building2 size={14} className="shrink-0 mt-0.5" /> Official WhatsApp Business Cloud API
              </li>
              <li className="flex items-start gap-2">
                <Cloud size={14} className="shrink-0 mt-0.5" /> Cloud connection — no personal-phone session to keep alive
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" /> Never risks your WhatsApp number
              </li>
            </ul>

            <form onSubmit={connect} className="space-y-3">
              <div>
                <label className="text-sm text-base-500 block mb-1.5">Phone Number ID</label>
                <input required value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-base-500 block mb-1.5">WhatsApp Business Account ID (optional)</label>
                <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-base-500 block mb-1.5">Access Token</label>
                <input
                  required
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="input-field"
                  placeholder="From Meta developer app → WhatsApp → API Setup"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Verifying..." : account ? "Reconnect" : "Connect"}
                </button>
                {account && (
                  <button type="button" onClick={disconnect} className="text-sm border border-danger/40 text-danger rounded-lg px-4 py-2.5">
                    Disconnect
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="card p-5 flex items-start gap-3">
        <Mail size={18} className="text-accent-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Why only one option?</p>
          <p className="text-base-500">
            <span className="text-ink font-medium">Meta Business</span> is the only WhatsApp connection this
            platform offers, because it&apos;s the one path that can&apos;t get your shop&apos;s WhatsApp number
            banned. It takes a few extra minutes to set up a Meta developer app, but it&apos;s a one-time
            step.
          </p>
        </div>
      </div>

      {message && <p className="text-accent-400 text-sm">{message}</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      {isConnected && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold mb-1">Test connection</h3>
          <p className="text-base-500 text-sm mb-4">
            Sends a real WhatsApp message via Meta&apos;s API to confirm login still works.
          </p>
          <div className="flex gap-2">
            <input
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="input-field"
            />
            <button onClick={sendTest} disabled={testing} className="btn-primary shrink-0">
              {testing ? "Sending..." : "Send test message"}
            </button>
          </div>
        </div>
      )}

      <div className="card p-4 sm:p-6">
        <h3 className="font-semibold mb-2">Webhook URL</h3>
        <p className="text-base-500 text-sm mb-2">
          Add this URL in your Meta app&apos;s WhatsApp → Configuration → Webhook, with the verify
          token set to your <code>WHATSAPP_VERIFY_TOKEN</code> env var, subscribed to the{" "}
          <code>messages</code> field.
        </p>
        <code className="text-xs bg-base-800 rounded-lg px-3 py-2 block break-all">{webhookUrl}</code>
      </div>
    </div>
  );
}
