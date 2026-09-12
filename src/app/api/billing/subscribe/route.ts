import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";
import { PLANS, isPlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { plan } = await req.json();
  if (!plan || !isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const price = PLANS[plan].price;
  const pool = getPool();

  let razorpayOrder;
  try {
    const razorpay = getRazorpay();
    razorpayOrder = await razorpay.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `sub-${shop.shopId}-${Date.now()}`,
      notes: { shopId: String(shop.shopId), plan },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment gateway error";
    return NextResponse.json({ error: `Could not start payment: ${message}` }, { status: 502 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO subscriptions (shop_id, plan, price, razorpay_order_id, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [shop.shopId, plan, price, razorpayOrder.id]
  );

  return NextResponse.json({
    subscriptionId: result.insertId,
    amount: price,
    razorpayOrderId: razorpayOrder.id,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
