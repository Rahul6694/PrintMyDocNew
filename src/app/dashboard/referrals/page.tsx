"use client";

import { useEffect, useState } from "react";

type Wallet = { locked: string; available: string; reserved: string; withdrawn: string; cancelled: string; reversed: string };
type ReferredShop = { id: number; name: string; created_at: string; amount: string | null; status: string | null };
type Withdrawal = { id: number; net_amount: string; status: string; requested_at: string };

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState("");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [referredShops, setReferredShops] = useState<ReferredShop[]>([]);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const referralLink =
    typeof window !== "undefined" && referralCode
      ? `${window.location.origin}/register?ref=${referralCode}`
      : "";

  async function load() {
    const res = await fetch("/api/referrals");
    if (res.ok) {
      const data = await res.json();
      setReferralCode(data.referralCode);
      setWallet(data.wallet);
      setReferredShops(data.referredShops);
      setHistory(data.withdrawalHistory);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function requestWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "referral", grossAmount: Number(amount), payoutMethod: "upi", payoutDestination: destination }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to request withdrawal");
      return;
    }
    setAmount("");
    setDestination("");
    setMessage("Withdrawal requested.");
    load();
  }

  if (!wallet) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Referrals</h1>

      <div className="card p-5 mb-6 max-w-2xl">
        <h3 className="font-semibold mb-1">Your referral code</h3>
        <p className="text-base-500 text-sm mb-3">Share this link — new merchants who sign up and subscribe earn you ₹50 each.</p>
        <div className="flex gap-2">
          <input readOnly value={referralCode} className="input-field w-32 font-mono" />
          <input readOnly value={referralLink} className="input-field flex-1 text-xs" />
          <button onClick={copyLink} className="btn-primary shrink-0">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-6 max-w-4xl">
        {(["locked", "available", "reserved", "withdrawn", "cancelled", "reversed"] as const).map((key) => (
          <div key={key} className="card p-3">
            <p className="text-xs text-base-500 capitalize">{key}</p>
            <p className="font-bold">₹{wallet[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6 max-w-4xl">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Referred merchants</h3>
          {referredShops.length === 0 ? (
            <p className="text-base-500 text-sm">No referred merchants yet.</p>
          ) : (
            <div className="space-y-2">
              {referredShops.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b border-base-700/40 pb-2 last:border-0">
                  <span>{s.name}</span>
                  <span className="badge bg-base-700 text-base-500 capitalize">{s.status || "no earning yet"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={requestWithdrawal} className="card p-5 space-y-3">
          <h3 className="font-semibold">Withdraw referral balance</h3>
          <p className="text-xs text-base-500">Minimum ₹500. Separate from order-collection withdrawals.</p>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="UPI ID"
            className="input-field"
          />
          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in INR"
            className="input-field"
          />
          <button type="submit" className="btn-primary w-full">
            Request withdrawal
          </button>
          {message && <p className="text-sm text-accent-400">{message}</p>}
        </form>
      </div>

      <div className="card p-5 max-w-4xl">
        <h3 className="font-semibold mb-3">Withdrawal history</h3>
        {history.length === 0 ? (
          <p className="text-base-500 text-sm">No referral withdrawals yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm border-b border-base-700/40 pb-2 last:border-0">
                <span>{new Date(w.requested_at).toLocaleDateString()}</span>
                <span>₹{w.net_amount}</span>
                <span className="badge bg-base-700 text-base-500 capitalize">{w.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
