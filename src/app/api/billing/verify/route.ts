import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { activateSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { subscriptionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!subscriptionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET as string;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, status FROM subscriptions WHERE id = ? AND shop_id = ? AND razorpay_order_id = ? LIMIT 1",
    [subscriptionId, shop.shopId, razorpay_order_id]
  );
  const subscription = rows[0];
  if (!subscription) return NextResponse.json({ error: "Subscription record not found" }, { status: 404 });

  if (subscription.status !== "active") {
    await activateSubscription(subscription.id, shop.shopId, razorpay_payment_id);
  }

  return NextResponse.json({ ok: true });
}
