import { NextRequest, NextResponse } from "next/server";
import { verifyPendingRegistration } from "@/lib/pendingRegistration";
import { getRazorpay } from "@/lib/razorpay";
import { PLANS, isPlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const { token, plan } = await req.json();

  const pending = verifyPendingRegistration(token);
  if (!pending) {
    return NextResponse.json({ error: "Your session expired — please fill in the form again." }, { status: 401 });
  }
  if (!plan || !isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const price = PLANS[plan].price;

  let razorpayOrder;
  try {
    const razorpay = getRazorpay();
    razorpayOrder = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `signup-${Date.now()}`,
      notes: { email: pending.email, plan },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment gateway error";
    return NextResponse.json({ error: `Could not start payment: ${message}` }, { status: 502 });
  }

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: price,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
