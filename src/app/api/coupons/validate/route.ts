import { NextRequest, NextResponse } from "next/server";
import { getCurrentShop } from "@/lib/auth";
import { verifyPendingRegistration } from "@/lib/pendingRegistration";
import { applyCoupon, normalizeCouponCode } from "@/lib/coupons";
import { PLANS, type PlanId } from "@/lib/plans";

// Checks a coupon against every plan for either a signed-in shop (Billing) or
// a pending signup (registration token), so the UI can show discounted prices.
export async function POST(req: NextRequest) {
  const { code, token } = await req.json();

  let identity: { email: string; shopId?: number } | null = null;
  if (token) {
    const pending = verifyPendingRegistration(token);
    if (pending) identity = { email: pending.email };
  } else {
    const shop = await getCurrentShop();
    if (shop) identity = { email: shop.email, shopId: shop.shopId };
  }
  if (!identity) {
    return NextResponse.json({ error: "Your session expired — please sign in again." }, { status: 401 });
  }

  const normalized = normalizeCouponCode(code);
  if (!normalized) return NextResponse.json({ error: "Enter a coupon code" }, { status: 400 });

  const plans: Record<string, { ok: boolean; error?: string; originalPrice: number; discountAmount?: number; finalPrice?: number }> = {};
  let anyValid = false;
  let firstError = "";
  for (const plan of Object.keys(PLANS) as PlanId[]) {
    const result = await applyCoupon(normalized, plan, identity);
    if (result.ok) {
      anyValid = true;
      plans[plan] = {
        ok: true,
        originalPrice: result.coupon.originalPrice,
        discountAmount: result.coupon.discountAmount,
        finalPrice: result.coupon.finalPrice,
      };
    } else {
      firstError ||= result.error;
      plans[plan] = { ok: false, error: result.error, originalPrice: PLANS[plan].price };
    }
  }

  if (!anyValid) return NextResponse.json({ error: firstError }, { status: 400 });
  return NextResponse.json({ code: normalized, plans });
}
