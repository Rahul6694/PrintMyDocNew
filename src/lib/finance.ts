import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export const PLATFORM_COMMISSION_PCT = 2.5;

// Only payments taken through the platform's shared Razorpay account are ever
// held by the platform — a shop using "my own Razorpay account" settles
// directly and has nothing to withdraw here.
export async function getOrderCollectionBalance(shopId: number) {
  const pool = getPool();

  const [[settingsRow]] = await pool.query<RowDataPacket[]>(
    "SELECT use_own_razorpay FROM shop_settings WHERE shop_id = ? LIMIT 1",
    [shopId]
  );
  const usesOwnRazorpay = !!settingsRow?.use_own_razorpay;

  const [[grossRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(p.amount), 0) AS gross, COUNT(*) AS paidOrders
     FROM payments p JOIN orders o ON o.id = p.order_id
     WHERE o.shop_id = ? AND p.status = 'paid' AND p.payment_method = 'razorpay'`,
    [shopId]
  );
  const [[reservedRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(gross_amount), 0) AS reserved
     FROM withdrawals WHERE shop_id = ? AND source = 'order_collection' AND status IN ('pending','approved','paid')`,
    [shopId]
  );

  const gross = usesOwnRazorpay ? 0 : Number(grossRow.gross);
  const reserved = Number(reservedRow.reserved);
  const availableGross = Math.max(gross - reserved, 0);
  const commission = Math.round(availableGross * (PLATFORM_COMMISSION_PCT / 100) * 100) / 100;

  return {
    usesOwnRazorpay,
    grossLifetime: gross,
    paidOrders: Number(grossRow.paidOrders),
    reserved,
    availableGross,
    commission,
    availableAfterCommission: Math.round((availableGross - commission) * 100) / 100,
  };
}
