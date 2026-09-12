import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";

// Source of truth for payment fulfillment — configure this URL in the Razorpay
// dashboard (Settings → Webhooks) so paid orders enter the print queue even if
// the customer closes their browser before the client-side verify call fires.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signature || expected !== signature) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;

  const pool = getPool();

  // Idempotency: ignore an event we've already processed for this gateway payment id.
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM webhook_events WHERE event_id = ? LIMIT 1",
    [payload.payload?.payment?.entity?.id ? `${event}:${payload.payload.payment.entity.id}` : event]
  );
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  if (event === "payment.captured") {
    const paymentEntity = payload.payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, order_id, status FROM payments WHERE razorpay_order_id = ? LIMIT 1",
      [razorpayOrderId]
    );
    const payment = rows[0];

    if (payment && payment.status !== "paid") {
      await pool.query(
        "UPDATE payments SET status = 'paid', razorpay_payment_id = ? WHERE id = ?",
        [paymentEntity.id, payment.id]
      );
      await pool.query(
        "UPDATE orders SET status = 'pending' WHERE id = ? AND status = 'pending_payment'",
        [payment.order_id]
      );
    }
  }

  await pool.query(
    "INSERT INTO webhook_events (event_id, event_type, payload) VALUES (?, ?, ?)",
    [
      payload.payload?.payment?.entity?.id ? `${event}:${payload.payload.payment.entity.id}` : event,
      event,
      rawBody,
    ]
  );

  return NextResponse.json({ ok: true });
}
