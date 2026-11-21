import { NextRequest, NextResponse } from "next/server";
import { verifyPendingRegistration } from "@/lib/pendingRegistration";
import { getRazorpay, gatewayErrorMessage } from "@/lib/razorpay";
import { PLANS, isPlanId } from "@/lib/plans";
import { applyCoupon, isFree, recordPendingRedemption, type AppliedCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const { token, plan, couponCode } = await req.json();

  const pending = verifyPendingRegistration(token);
  if (!pending) {
    return NextResponse.json({ error: "Your session expired — please fill in the form again." }, { status: 401 });
  }
  if (!plan || !isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let applied: AppliedCoupon | null = null;
  if (couponCode) {
    const result = await applyCoupon(couponCode, plan, { email: pending.email });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    applied = result.coupon;
  }

  const price = applied ? applied.finalPrice : PLANS[plan].price;

  // 100%-off coupon: no gateway call — the client goes straight to /complete.
  if (applied && isFree(price)) {
    return NextResponse.json({ free: true, amount: 0 });
  }

  let razorpayOrder;
  try {
    const razorpay = getRazorpay();
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(price * 100),
      currency: "INR",
      receipt: `signup-${Date.now()}`,
      notes: { email: pending.email, plan, ...(applied ? { coupon: applied.code } : {}) },
    });
  } catch (err) {
    const message = gatewayErrorMessage(err);
    return NextResponse.json({ error: `Could not start payment: ${message}` }, { status: 502 });
  }

  if (applied) await recordPendingRedemption(applied, razorpayOrder.id, pending.email, null);

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: price,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
