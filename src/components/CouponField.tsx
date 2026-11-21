"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";

export type CouponPlanResult = {
  ok: boolean;
  error?: string;
  originalPrice: number;
  discountAmount?: number;
  finalPrice?: number;
};

export type AppliedCouponState = {
  code: string;
  plans: Record<string, CouponPlanResult>;
};

// Coupon entry box. `token` is the pending-registration token during signup;
// omit it on pages where the shop is signed in.
export default function CouponField({
  token,
  applied,
  onChange,
  disabled,
}: {
  token?: string;
  applied: AppliedCouponState | null;
  onChange: (value: AppliedCouponState | null) => void;
  disabled?: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function apply() {
    if (!code.trim()) return;
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid coupon code");
        onChange(null);
        return;
      }
      onChange({ code: data.code, plans: data.plans });
      setCode("");
    } catch {
      setError("Could not check the coupon. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 border border-success/40 bg-success/5 rounded-xl px-3 py-2.5">
        <p className="text-sm flex items-center gap-2 min-w-0">
          <Tag size={14} className="text-success shrink-0" />
          <span className="truncate">
            Coupon <b className="font-mono">{applied.code}</b> applied
          </span>
        </p>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="text-base-500 hover:text-ink shrink-0"
          aria-label="Remove coupon"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            className="input-field pl-9 uppercase font-mono"
            placeholder="Have a coupon code?"
            disabled={disabled}
          />
        </div>
        <button type="button" onClick={apply} disabled={disabled || checking || !code.trim()} className="btn-secondary shrink-0 text-sm">
          {checking ? "Checking..." : "Apply"}
        </button>
      </div>
      {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
    </div>
  );
}

// Price display helper: list price struck through when a coupon lowers it.
export function CouponPrice({ price, result, suffix }: { price: number; result?: CouponPlanResult; suffix: string }) {
  if (result?.ok && result.finalPrice !== undefined && result.finalPrice < price) {
    return (
      <>
        <span className="text-base-500 line-through text-base font-normal mr-1.5">₹{price}</span>₹{result.finalPrice}
        <span className="text-xs text-base-500 font-normal">{suffix}</span>
      </>
    );
  }
  return (
    <>
      ₹{price}
      <span className="text-xs text-base-500 font-normal">{suffix}</span>
    </>
  );
}
