import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { autoPrintPaidOrder } from "@/lib/printQueue";
import { getShopGateway } from "@/lib/razorpay";

// Verifies the Razorpay checkout signature server-side. This is a convenience
// path for immediate UI feedback — the payments.status webhook (see webhook/route.ts)
// remains the source of truth for fulfillment, since a client can close the browser
// before this call ever fires.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
  }

  const pool = getPool();
  const [orderRows] = await pool.query<RowDataPacket[]>("SELECT shop_id FROM orders WHERE id = ? LIMIT 1", [params.id]);
  if (!orderRows[0]) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // The order may have been paid into the shop's own Razorpay account, so check
  // the signature against that account's secret as well as the platform's.
  const gateway = await getShopGateway(orderRows[0].shop_id);
  const secrets = Array.from(new Set([gateway.keySecret, process.env.RAZORPAY_KEY_SECRET].filter(Boolean))) as string[];
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const valid = secrets.some((secret) => {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return expected.length === String(razorpay_signature).length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpay_signature)));
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

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
    await autoPrintPaidOrder(params.id);
  }

  return NextResponse.json({ ok: true });
}
