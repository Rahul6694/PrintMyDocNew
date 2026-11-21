import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { getRazorpay, gatewayErrorMessage } from "@/lib/razorpay";
import { PLANS, isPlanId } from "@/lib/plans";
import { applyCoupon, isFree, recordPendingRedemption, type AppliedCoupon } from "@/lib/coupons";
import { activateSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan, couponCode } = await req.json();
  if (!plan || !isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let applied: AppliedCoupon | null = null;
  if (couponCode) {
    const result = await applyCoupon(couponCode, plan, { email: shop.email, shopId: shop.shopId });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    applied = result.coupon;
  }

  const price = applied ? applied.finalPrice : PLANS[plan].price;
  const pool = getPool();

  // 100%-off coupon: activate immediately without a gateway payment.
  if (applied && isFree(price)) {
    const orderRef = `free-${randomUUID()}`;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO subscriptions (shop_id, plan, price, razorpay_order_id, status) VALUES (?, ?, 0, ?, 'pending')`,
      [shop.shopId, plan, orderRef]
    );
    await recordPendingRedemption(applied, orderRef, shop.email, shop.shopId);
    await activateSubscription(result.insertId, shop.shopId, `coupon:${applied.code}`);
    return NextResponse.json({ free: true, activated: true, amount: 0 });
  }

  let razorpayOrder;
  try {
    const razorpay = getRazorpay();
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(price * 100),
      currency: "INR",
      receipt: `sub-${shop.shopId}-${Date.now()}`,
      notes: { shopId: String(shop.shopId), plan, ...(applied ? { coupon: applied.code } : {}) },
    });
  } catch (err) {
    const message = gatewayErrorMessage(err);
    return NextResponse.json({ error: `Could not start payment: ${message}` }, { status: 502 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO subscriptions (shop_id, plan, price, razorpay_order_id, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [shop.shopId, plan, price, razorpayOrder.id]
  );
  if (applied) await recordPendingRedemption(applied, razorpayOrder.id, shop.email, shop.shopId);

  return NextResponse.json({
    subscriptionId: result.insertId,
    amount: price,
    razorpayOrderId: razorpayOrder.id,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
