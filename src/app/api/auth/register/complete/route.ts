import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { verifyPendingRegistration } from "@/lib/pendingRegistration";
import { createShop } from "@/lib/provisionShop";
import { activateSubscription } from "@/lib/subscription";
import { isPlanId, PLANS } from "@/lib/plans";
import { signSession, getSessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token, plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const pending = verifyPendingRegistration(token);
  if (!pending) {
    return NextResponse.json({ error: "Your session expired — please fill in the form again." }, { status: 401 });
  }
  if (!plan || !isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
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

  // Re-check uniqueness — time has passed since /prepare, and payment is
  // non-refundable-by-us at this point, but we still must not create a
  // duplicate account.
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM shops WHERE email = ?", [pending.email]);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email was created in the meantime. Contact support with your payment ID: " + razorpay_payment_id },
      { status: 409 }
    );
  }

  // This is the only point in the signup flow that writes a shop to the database.
  const shopId = await createShop({
    name: pending.name,
    ownerName: pending.ownerName,
    email: pending.email,
    passwordHash: pending.passwordHash,
    phone: pending.phone,
    referredByCode: pending.referredByCode,
  });

  const price = PLANS[plan].price;
  const [subResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO subscriptions (shop_id, plan, price, razorpay_order_id, status) VALUES (?, ?, ?, ?, 'pending')`,
    [shopId, plan, price, razorpay_order_id]
  );
  await activateSubscription(subResult.insertId, shopId, razorpay_payment_id);

  const [rows] = await pool.query<RowDataPacket[]>("SELECT slug FROM shops WHERE id = ?", [shopId]);
  const slug = rows[0].slug;

  const sessionToken = signSession({ shopId, email: pending.email, slug });
  const res = NextResponse.json({ ok: true, slug });
  res.cookies.set(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
