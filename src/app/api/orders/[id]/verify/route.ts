import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";

// Verifies the Razorpay checkout signature server-side. This is a convenience
// path for immediate UI feedback — the payments.status webhook (see webhook/route.ts)
// remains the source of truth for fulfillment, since a client can close the browser
// before this call ever fires.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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
    "SELECT id, order_id, status FROM payments WHERE razorpay_order_id = ? AND order_id = ? LIMIT 1",
    [razorpay_order_id, params.id]
  );
  const payment = rows[0];
  if (!payment) return NextResponse.json({ error: "Payment record not found" }, { status: 404 });

  if (payment.status !== "paid") {
    await pool.query(
      "UPDATE payments SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?",
      [razorpay_payment_id, razorpay_signature, payment.id]
    );
    await pool.query("UPDATE orders SET status = 'pending' WHERE id = ? AND status = 'pending_payment'", [
      params.id,
    ]);
  }

  return NextResponse.json({ ok: true });
}
