import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

const PLAN_ORDER = ["basic", "standard", "premium"] as const;

export default function PricingSection() {
  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">Pricing</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Choose your PrintMyDoc plan</h2>
        <p className="text-base-500">
          Every plan includes the full dashboard — QR ordering, WhatsApp, Employees, Referrals, and Business
          Setup. The only difference is your monthly order limit.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-5 max-w-md md:max-w-4xl mx-auto">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isPopular = id === "standard";
          return (
            <div key={id} className={`card p-6 relative ${isPopular ? "border-accent-500 shadow-glow" : ""}`}>
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-accent-500 text-white text-xs">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">
                ₹{plan.price}
                <span className="text-sm text-base-500 font-normal"> /month</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-base-500">
                    <Check size={14} className="text-success shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={isPopular ? "btn-primary block text-center" : "btn-secondary block text-center"}>
                Create merchant account
              </Link>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-base-500 mt-8">
        Pick a plan during signup and pay securely via Razorpay — your account is created the moment
        payment is confirmed.
      </p>
    </section>
  );
}
