import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { addPurchasedCredits } from "@/lib/credits";

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET as string;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const pool = getPool();
  // Idempotent: a razorpay_order_id can only ever be credited once.
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, amount, razorpay_payment_id FROM credit_transactions WHERE shop_id = ? AND razorpay_order_id = ? LIMIT 1",
    [shop.shopId, razorpay_order_id]
  );
  const tx = rows[0];
  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (tx.razorpay_payment_id) {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  await pool.query("UPDATE credit_transactions SET razorpay_payment_id = ? WHERE id = ?", [
    razorpay_payment_id,
    tx.id,
  ]);
  await addPurchasedCredits(shop.shopId, tx.amount);

  return NextResponse.json({ ok: true });
}
