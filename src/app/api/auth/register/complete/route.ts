import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { verifyPendingRegistration } from "@/lib/pendingRegistration";
import { createShop } from "@/lib/provisionShop";
import { activateSubscription } from "@/lib/subscription";
import { isPlanId, PLANS } from "@/lib/plans";
import { signSession, getSessionCookieName } from "@/lib/auth";
import { applyCoupon, isFree, getPendingRedemption, recordPendingRedemption, type AppliedCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const { token, plan, couponCode, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const pending = verifyPendingRegistration(token);
  if (!pending) {
    return NextResponse.json({ error: "Your session expired — please fill in the form again." }, { status: 401 });
  }
  if (!plan || !isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  // Free signup (100%-off coupon): no payment, but the coupon is re-validated
  // here so a client can't skip payment by just claiming it's free.
  let freeCoupon: AppliedCoupon | null = null;
  if (!razorpay_order_id && couponCode) {
    const result = await applyCoupon(couponCode, plan, { email: pending.email });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    if (!isFree(result.coupon.finalPrice)) {
      return NextResponse.json({ error: "This coupon doesn't cover the full price — payment is required." }, { status: 400 });
    }
    freeCoupon = result.coupon;
  } else {
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
  }

  const pool = getPool();

  // Re-check uniqueness — time has passed since /prepare, and payment is
  // non-refundable-by-us at this point, but we still must not create a
  // duplicate account.
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM shops WHERE email = ?", [pending.email]);
  if (existing.length > 0) {
    return NextResponse.json(
      {
        error: razorpay_payment_id
          ? "An account with this email was created in the meantime. Contact support with your payment ID: " + razorpay_payment_id
          : "An account with this email already exists.",
      },
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

  // The price actually charged: the coupon's final price if one was used
  // (recorded at /pay against this gateway order), else the plan's list price.
  let orderRef: string = razorpay_order_id;
  let price: number = PLANS[plan].price;
  if (freeCoupon) {
    orderRef = `free-${crypto.randomUUID()}`;
    price = 0;
    await recordPendingRedemption(freeCoupon, orderRef, pending.email, shopId);
  } else {
    const redemption = await getPendingRedemption(razorpay_order_id);
    if (redemption && redemption.plan === plan) price = Number(redemption.final_price);
  }

  const [subResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO subscriptions (shop_id, plan, price, razorpay_order_id, status) VALUES (?, ?, ?, ?, 'pending')`,
    [shopId, plan, price, orderRef]
  );
  await activateSubscription(subResult.insertId, shopId, razorpay_payment_id || `coupon:${freeCoupon?.code}`);

  const [rows] = await pool.query<RowDataPacket[]>("SELECT slug FROM shops WHERE id = ?", [shopId]);
  const slug = rows[0].slug;

  const sessionToken = signSession({ shopId, email: pending.email, slug });
  const res = NextResponse.json({ ok: true, slug });
  res.cookies.set(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    secure: req.headers.get("x-forwarded-proto") === "https" || req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
