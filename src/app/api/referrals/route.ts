import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [shopRows] = await pool.query<RowDataPacket[]>("SELECT referral_code FROM shops WHERE id = ?", [
    shop.shopId,
  ]);
  const [walletRows] = await pool.query<RowDataPacket[]>(
    "SELECT locked, available, reserved, withdrawn, cancelled, reversed FROM referral_wallets WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  const [referred] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.name, s.created_at, re.amount, re.status
     FROM shops s LEFT JOIN referral_earnings re ON re.referred_shop_id = s.id AND re.referrer_shop_id = ?
     WHERE s.referred_by_shop_id = ?
     ORDER BY s.created_at DESC`,
    [shop.shopId, shop.shopId]
  );
  const [withdrawalHistory] = await pool.query<RowDataPacket[]>(
    "SELECT id, net_amount, status, requested_at FROM withdrawals WHERE shop_id = ? AND source = 'referral' ORDER BY requested_at DESC LIMIT 20",
    [shop.shopId]
  );

  return NextResponse.json({
    referralCode: shopRows[0]?.referral_code,
    wallet: walletRows[0] || { locked: 0, available: 0, reserved: 0, withdrawn: 0, cancelled: 0, reversed: 0 },
    referredShops: referred,
    withdrawalHistory,
  });
}
