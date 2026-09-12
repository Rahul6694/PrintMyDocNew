import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "./db";

export type CreditBalance = {
  included_in_plan: number;
  remaining: number;
  used: number;
  purchased: number;
  period_ends_at: string | null;
};

export async function getCreditBalance(shopId: number): Promise<CreditBalance> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT included_in_plan, remaining, used, purchased, period_ends_at FROM shop_credits WHERE shop_id = ? LIMIT 1",
    [shopId]
  );
  if (rows.length === 0) {
    return { included_in_plan: 0, remaining: 0, used: 0, purchased: 0, period_ends_at: null };
  }
  return rows[0] as CreditBalance;
}

// One credit is consumed per print order (document conversion). Called only
// after canAcceptNewOrder() has already gated on subscription + order limits.
export async function consumeCredit(shopId: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE shop_credits SET remaining = remaining - 1, used = used + 1 WHERE shop_id = ? AND remaining > 0",
    [shopId]
  );
  if (result.affectedRows > 0) {
    await pool.query(
      "INSERT INTO credit_transactions (shop_id, type, amount) VALUES (?, 'consumed', -1)",
      [shopId]
    );
    return true;
  }
  return false;
}

export async function addPurchasedCredits(shopId: number, amount: number): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO shop_credits (shop_id, remaining, purchased) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE remaining = remaining + VALUES(remaining), purchased = purchased + VALUES(purchased)`,
    [shopId, amount, amount]
  );
}
