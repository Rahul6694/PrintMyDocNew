"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Printer, User, Store, Phone, Mail, Lock, Gift, Eye, EyeOff, CheckCircle2, Check } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import AuthHeader from "@/components/auth/AuthHeader";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const PLAN_ORDER: PlanId[] = ["basic", "standard", "premium"];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referredByCode = searchParams.get("ref") || undefined;

  const [step, setStep] = useState<"details" | "plan">("details");
  const [registrationToken, setRegistrationToken] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(referredByCode || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [payingPlan, setPayingPlan] = useState<PlanId | null>(null);

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          name,
          email,
          password,
          phone,
          referredByCode: referralCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not continue");
        return;
      }
      setRegistrationToken(data.token);
      setStep("plan");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function choosePlan(plan: PlanId) {
    setError("");
    setPayingPlan(plan);
    try {
      const res = await fetch("/api/auth/register/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: registrationToken, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment");
        setPayingPlan(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: Math.round(data.amount * 100),
        currency: "INR",
        name: "PrintMyDoc",
        description: `${PLANS[plan].name} plan — monthly`,
        order_id: data.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const completeRes = await fetch("/api/auth/register/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: registrationToken, plan, ...response }),
          });
          const completeData = await completeRes.json();
          if (!completeRes.ok) {
            setError(completeData.error || "Payment succeeded but account creation failed — contact support.");
            setPayingPlan(null);
            return;
          }
          router.push("/dashboard");
          router.refresh();
        },
        modal: { ondismiss: () => setPayingPlan(null) },
        theme: { color: "#f97316" },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setPayingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-base-950">
      <AuthHeader />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="px-4 sm:px-6 py-8 sm:py-16">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-success">
            {step === "details" ? "Step 1 of 2" : "Step 2 of 2"}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mt-3 mb-4 sm:mb-6">
            {step === "details" ? (
              <>Create your merchant account in under a minute.</>
            ) : (
              <>Pick a plan to activate your shop.</>
            )}
          </h1>
          <p className="text-base-500 text-base sm:text-lg mb-6 sm:mb-8 max-w-md">
            {step === "details"
              ? "Enter your details, then choose and pay for a plan — your account is created the moment payment is confirmed."
              : "Your account is created only after payment succeeds. Nothing is saved if you close this before paying."}
          </p>
          <div className="space-y-3">
            {[
              "Account created only after successful payment",
              "Your card/UPI details are handled entirely by Razorpay",
              "Cancel anytime before paying — nothing is created",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 size={13} />
                </span>
                <p className="text-sm font-medium">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {step === "details" ? (
          <div className="card p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-11 h-11 rounded-xl bg-accent-500 text-white flex items-center justify-center shrink-0">
                <Printer size={20} />
              </span>
              <div>
                <p className="font-semibold">PrintMyDoc</p>
                <p className="text-xs text-base-500">Merchant registration</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-1">Create merchant account</h2>
            <p className="text-sm text-base-500 mb-6">
              Enter your login details. You&apos;ll choose a plan and pay on the next step.
            </p>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Owner name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
                  <input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="input-field pl-9" placeholder="Your full name" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Business name</label>
                <div className="relative">
                  <Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-9" placeholder="Your shop or business name" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Mobile number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="input-field pl-9"
                    placeholder="10-digit business mobile"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-9" placeholder="you@yourshop.com" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Create password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-9 pr-9"
                    placeholder="8+ characters"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-500 hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Referral code <span className="text-base-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Gift size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="input-field pl-9 uppercase"
                    placeholder="Enter referral code"
                  />
                </div>
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Continuing..." : "Continue to plan & payment →"}
              </button>
            </form>

            <p className="text-center text-sm text-base-500 mt-5">
              Already registered?{" "}
              <Link href="/login" className="text-accent-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="card p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-11 h-11 rounded-xl bg-accent-500 text-white flex items-center justify-center shrink-0">
                <Printer size={20} />
              </span>
              <div>
                <p className="font-semibold">PrintMyDoc</p>
                <p className="text-xs text-base-500">Choose your plan</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {PLAN_ORDER.map((id) => {
                const plan = PLANS[id];
                const isPopular = id === "standard";
                return (
                  <div
                    key={id}
                    className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${
                      isPopular ? "border-accent-500 bg-accent-500/5" : "border-base-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{plan.name}</p>
                        {isPopular && <span className="badge bg-accent-500 text-white text-[10px]">Most popular</span>}
                      </div>
                      <p className="text-2xl font-bold">
                        ₹{plan.price}
                        <span className="text-xs text-base-500 font-normal"> /month</span>
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {plan.features.map((f) => (
                          <li key={f} className="text-xs text-base-500 flex items-center gap-1.5">
                            <Check size={11} className="text-success shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => choosePlan(id)}
                      disabled={payingPlan !== null}
                      className={isPopular ? "btn-primary shrink-0 text-sm" : "btn-secondary shrink-0 text-sm"}
                    >
                      {payingPlan === id ? "Processing..." : "Pay & activate"}
                    </button>
                  </div>
                );
              })}
            </div>

            {error && <p className="text-danger text-sm mb-2">{error}</p>}

            <button onClick={() => setStep("details")} className="text-sm text-base-500 hover:text-ink">
              ← Back to edit details
            </button>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
