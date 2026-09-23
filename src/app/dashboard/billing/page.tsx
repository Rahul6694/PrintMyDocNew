"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

type PlanId = "basic" | "standard" | "premium";

const PLAN_LIST: { id: PlanId; name: string; price: number; features: string[] }[] = [
  { id: "basic", name: "Basic", price: 100, features: ["Up to 150 orders / month", "QR + link ordering", "Email support"] },
  { id: "standard", name: "Standard", price: 250, features: ["Up to 500 orders / month", "QR + link ordering", "Priority support"] },
  { id: "premium", name: "Premium", price: 500, features: ["Unlimited orders", "QR + link ordering", "Priority support"] },
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Subscription = {
  plan: PlanId;
  status: string;
  expires_at: string;
} | null;

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

  async function loadStatus() {
    const res = await fetch("/api/billing/status");
    if (res.ok) {
      const data = await res.json();
      setSubscription(data.subscription);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleSubscribe(planId: PlanId) {
    setError("");
    setSubscribing(planId);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start subscription");
        setSubscribing(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: Math.round(data.amount * 100),
        currency: "INR",
        name: "PrintMyDoc",
        description: `${planId[0].toUpperCase()}${planId.slice(1)} plan — monthly`,
        order_id: data.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionId: data.subscriptionId, ...response }),
          });
          if (verifyRes.ok) {
            await loadStatus();
          } else {
            setError("Payment verification failed. Contact support if money was deducted.");
          }
          setSubscribing(null);
        },
        modal: {
          ondismiss: () => setSubscribing(null),
        },
        theme: { color: "#f97316" },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubscribing(null);
    }
  }

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-base-500 text-sm mb-6 max-w-lg">
        Choose a monthly plan. Orders stop being accepted once you hit your plan&apos;s limit until
        you upgrade or renew.
      </p>

      {!loading && subscription && (
        <div className="card p-4 mb-6 max-w-2xl flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-base-500">Current plan</p>
            <p className="font-semibold capitalize">{subscription.plan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-base-500">Renews / expires</p>
            <p className="font-semibold">{new Date(subscription.expires_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {!loading && !subscription && (
        <div className="card p-4 mb-6 max-w-2xl border-warning/40">
          <p className="text-warning text-sm font-semibold">No active plan — new orders are blocked.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-3xl">
        {PLAN_LIST.map((plan) => {
          const isCurrent = subscription?.plan === plan.id;
          return (
            <div key={plan.id} className={`card p-4 sm:p-6 flex flex-col ${isCurrent ? "shadow-glow" : ""}`}>
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1 mb-4">
                ₹{plan.price}
                <span className="text-sm text-base-500 font-normal"> / month</span>
              </p>
              <ul className="text-sm text-base-500 space-y-1.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing !== null || isCurrent}
                className="btn-primary"
              >
                {isCurrent ? "Current plan" : subscribing === plan.id ? "Processing..." : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-danger text-sm mt-4">{error}</p>}
    </div>
  );
}
