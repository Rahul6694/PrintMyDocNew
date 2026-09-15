"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Balance = { included_in_plan: number; remaining: number; used: number; purchased: number; period_ends_at: string | null };

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function CreditsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/credits");
    if (res.ok) setBalance((await res.json()).balance);
  }

  useEffect(() => {
    load();
  }, []);

  async function buyCredits() {
    setProcessing(true);
    setMessage("");
    const res = await fetch("/api/credits/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to start payment");
      setProcessing(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: Math.round(data.amount * 100),
      currency: "INR",
      name: "PrintMyDoc",
      description: `${data.quantity} credits`,
      order_id: data.razorpayOrderId,
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const verifyRes = await fetch("/api/credits/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (verifyRes.ok) {
          setMessage("Credits added.");
          load();
        } else {
          setMessage("Payment verification failed.");
        }
        setProcessing(false);
      },
      modal: { ondismiss: () => setProcessing(false) },
      theme: { color: "#f97316" },
    });
    rzp.open();
  }

  if (!balance) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="text-2xl font-bold mb-1">Conversion credits</h1>
      <p className="text-base-500 text-sm mb-6">Credits are used by document conversion during your current billing period.</p>

      <div className="grid grid-cols-4 gap-4 mb-6 max-w-3xl">
        <div className="card p-4">
          <p className="text-xs text-base-500">Remaining</p>
          <p className="text-2xl font-bold">{balance.remaining}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500">Used</p>
          <p className="text-2xl font-bold">{balance.used}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500">Included in plan</p>
          <p className="text-2xl font-bold">{balance.included_in_plan}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500">Purchased</p>
          <p className="text-2xl font-bold">{balance.purchased}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 max-w-3xl">
        <div className="card p-5">
          <h3 className="font-semibold mb-1">Add more credits</h3>
          <p className="text-base-500 text-sm mb-4">₹{1} per credit</p>
          <div className="flex gap-2 mb-3">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setQuantity(amt)}
                className={`text-sm rounded-lg border px-3 py-1.5 ${quantity === amt ? "border-accent-500 bg-accent-500/10" : "border-base-700"}`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          <label className="text-sm text-base-500 block mb-1.5">Custom quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input-field mb-3"
          />
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-base-500">Payment total</span>
            <span className="font-bold">₹{quantity.toFixed(2)}</span>
          </div>
          <button onClick={buyCredits} disabled={processing} className="btn-primary w-full">
            {processing ? "Processing..." : "Pay and add credits"}
          </button>
          {message && <p className="text-sm text-accent-400 mt-2">{message}</p>}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Credit policy</h3>
          <ul className="text-sm text-base-500 space-y-2">
            <li>Plan and purchased credits apply to the current billing period.</li>
            <li>Payment verification is idempotent — the same Razorpay order can&apos;t add credits twice.</li>
            <li>Unused purchased credits expire when the current billing period ends.</li>
            {balance.period_ends_at && <li>Period ends {new Date(balance.period_ends_at).toLocaleString()}.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
