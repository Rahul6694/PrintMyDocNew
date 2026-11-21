import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import { PLANS, type PlanId } from "./plans";

export type CouponRow = {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: string;
  applicable_plans: PlanId[] | string | null;
  max_uses: number | null;
  used_count: number;
  once_per_shop: number;
  starts_at: Date | null;
  expires_at: Date | null;
  is_active: number;
};

export type AppliedCoupon = {
  couponId: number;
  code: string;
  plan: PlanId;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
};

export function normalizeCouponCode(code: unknown): string {
  return String(code ?? "").trim().toUpperCase();
}

function parsePlans(value: CouponRow["applicable_plans"]): PlanId[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function computeDiscount(coupon: Pick<CouponRow, "discount_type" | "discount_value">, price: number): number {
  const value = Number(coupon.discount_value);
  const raw = coupon.discount_type === "percent" ? (price * value) / 100 : value;
  return Math.min(price, Math.max(0, Math.round(raw * 100) / 100));
}

// Validates a coupon for a plan and identity, returning the discounted price.
// `email` / `shopId` are used for the once-per-shop check (signup has only an
// email; logged-in billing has both).
export async function applyCoupon(
  rawCode: unknown,
  plan: PlanId,
  identity: { email: string; shopId?: number }
): Promise<{ ok: true; coupon: AppliedCoupon } | { ok: false; error: string }> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, error: "Enter a coupon code" };

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM coupons WHERE code = ? LIMIT 1", [code]);
  const coupon = rows[0] as CouponRow | undefined;
  if (!coupon || !coupon.is_active) return { ok: false, error: "Invalid coupon code" };

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ok: false, error: "This coupon is not active yet" };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
    return { ok: false, error: "This coupon has expired" };
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { ok: false, error: "This coupon has reached its usage limit" };
  }
  const plans = parsePlans(coupon.applicable_plans);
  if (plans && plans.length > 0 && !plans.includes(plan)) {
    return { ok: false, error: `This coupon is not valid for the ${PLANS[plan].name} plan` };
  }
  if (coupon.once_per_shop) {
    const [used] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM coupon_redemptions
       WHERE coupon_id = ? AND status = 'redeemed' AND (email = ? OR shop_id = ?) LIMIT 1`,
      [coupon.id, identity.email, identity.shopId ?? 0]
    );
    if (used.length > 0) return { ok: false, error: "You have already used this coupon" };
  }

  const originalPrice = PLANS[plan].price;
  const discountAmount = computeDiscount(coupon, originalPrice);
  return {
    ok: true,
    coupon: {
      couponId: coupon.id,
      code: coupon.code,
      plan,
      originalPrice,
      discountAmount,
      finalPrice: Math.round((originalPrice - discountAmount) * 100) / 100,
    },
  };
}

// Razorpay rejects orders below ₹1, so anything under that is treated as free
// and activated without a payment.
export function isFree(finalPrice: number): boolean {
  return finalPrice < 1;
}

export async function recordPendingRedemption(
  applied: AppliedCoupon,
  orderRef: string,
  email: string,
  shopId: number | null
): Promise<void> {
  await getPool().query(
    `INSERT INTO coupon_redemptions
       (coupon_id, razorpay_order_id, shop_id, email, plan, original_price, discount_amount, final_price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [applied.couponId, orderRef, shopId, email, applied.plan, applied.originalPrice, applied.discountAmount, applied.finalPrice]
  );
}

export async function getPendingRedemption(orderRef: string): Promise<RowDataPacket | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM coupon_redemptions WHERE razorpay_order_id = ? LIMIT 1",
    [orderRef]
  );
  return rows[0] || null;
}

// Called when the subscription tied to `orderRef` activates. Idempotent.
export async function finalizeRedemption(orderRef: string, shopId: number): Promise<void> {
  const pool = getPool();
  const [result] = await pool.query<import("mysql2").ResultSetHeader>(
    `UPDATE coupon_redemptions SET status = 'redeemed', shop_id = ?, redeemed_at = NOW()
     WHERE razorpay_order_id = ? AND status = 'pending'`,
    [shopId, orderRef]
  );
  if (result.affectedRows > 0) {
    await pool.query(
      `UPDATE coupons c JOIN coupon_redemptions r ON r.coupon_id = c.id
       SET c.used_count = c.used_count + 1 WHERE r.razorpay_order_id = ?`,
      [orderRef]
    );
  }
}
