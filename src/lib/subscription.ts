import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import { PLANS, type PlanId } from "./plans";

// Marks a subscription active and, if this shop was referred, releases the
// referrer's pending bonus into their wallet. Shared by the post-signup
// payment flow and the existing Billing "upgrade later" flow so both paths
// activate a subscription identically.
export async function activateSubscription(
  subscriptionId: number,
  shopId: number,
  razorpayPaymentId: string
): Promise<void> {
  const pool = getPool();

  await pool.query(
    `UPDATE subscriptions
     SET status = 'active', razorpay_payment_id = ?, started_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
     WHERE id = ?`,
    [razorpayPaymentId, subscriptionId]
  );

  const [pendingEarnings] = await pool.query<RowDataPacket[]>(
    "SELECT id, referrer_shop_id, amount FROM referral_earnings WHERE referred_shop_id = ? AND status = 'pending' LIMIT 1",
    [shopId]
  );
  const earning = pendingEarnings[0];
  if (earning) {
    await pool.query("UPDATE referral_earnings SET status = 'available' WHERE id = ?", [earning.id]);
    await pool.query(
      `INSERT INTO referral_wallets (shop_id, available) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE available = available + VALUES(available)`,
      [earning.referrer_shop_id, earning.amount]
    );
  }
}

export type ActiveSubscription = {
  id: number;
  plan: PlanId;
  price: string;
  status: string;
  started_at: string;
  expires_at: string;
};

export async function getActiveSubscription(shopId: number): Promise<ActiveSubscription | null> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, plan, price, status, started_at, expires_at FROM subscriptions
     WHERE shop_id = ? AND status = 'active' AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [shopId]
  );
  return (rows[0] as ActiveSubscription) || null;
}

async function getMonthlyOrderCount(shopId: number): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM orders
     WHERE shop_id = ? AND status NOT IN ('pending_payment', 'cancelled', 'print_failed')
       AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
    [shopId]
  );
  return Number(rows[0].count);
}

// Gate new orders on an active, non-exhausted subscription. Called from the
// public order-create endpoint — never trust the client on this.
export async function canAcceptNewOrder(shopId: number): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await getActiveSubscription(shopId);
  if (!subscription) {
    return { allowed: false, reason: "This shop's subscription is inactive. Please try again later." };
  }

  const limit = PLANS[subscription.plan].orderLimit;
  if (limit === null) return { allowed: true };

  const used = await getMonthlyOrderCount(shopId);
  if (used >= limit) {
    return {
      allowed: false,
      reason: "This shop has reached its monthly order limit. Please try again later.",
    };
  }
  return { allowed: true };
}
