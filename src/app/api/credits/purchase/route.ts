import { NextRequest, NextResponse } from "next/server";
import { getCurrentShop } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";
import { getPool } from "@/lib/db";

const PRICE_PER_CREDIT = 1; // INR

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { quantity } = await req.json();
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  const amount = qty * PRICE_PER_CREDIT;

  let order;
  try {
    const razorpay = getRazorpay();
    order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `credits-${shop.shopId}-${Date.now()}`,
      notes: { shopId: String(shop.shopId), credits: String(qty) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment gateway error";
    return NextResponse.json({ error: `Could not start payment: ${message}` }, { status: 502 });
  }

  const pool = getPool();
  await pool.query(
    "INSERT INTO credit_transactions (shop_id, type, amount, razorpay_order_id) VALUES (?, 'purchased', ?, ?)",
    [shop.shopId, qty, order.id]
  );

  return NextResponse.json({
    razorpayOrderId: order.id,
    amount,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    quantity: qty,
  });
}
