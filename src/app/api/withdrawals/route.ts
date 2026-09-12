import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { getOrderCollectionBalance, PLATFORM_COMMISSION_PCT } from "@/lib/finance";

const MIN_ORDER_COLLECTION_WITHDRAWAL = 100;
const MIN_REFERRAL_WITHDRAWAL = 500;

export async function GET(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const source = req.nextUrl.searchParams.get("source");
  const pool = getPool();
  let query = "SELECT id, source, gross_amount, commission_amount, net_amount, payout_method, status, requested_at, processed_at FROM withdrawals WHERE shop_id = ?";
  const params: (string | number)[] = [shop.shopId];
  if (source) {
    query += " AND source = ?";
    params.push(source);
  }
  query += " ORDER BY requested_at DESC LIMIT 50";

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return NextResponse.json({ withdrawals: rows });
}

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { source, grossAmount, payoutMethod, payoutDestination } = await req.json();
  if (!["order_collection", "referral"].includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }
  if (!payoutDestination) {
    return NextResponse.json({ error: "Payout destination is required" }, { status: 400 });
  }
  const amount = Number(grossAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const pool = getPool();

  if (source === "order_collection") {
    if (amount < MIN_ORDER_COLLECTION_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ₹${MIN_ORDER_COLLECTION_WITHDRAWAL}` }, { status: 400 });
    }
    const balance = await getOrderCollectionBalance(shop.shopId);
    if (amount > balance.availableGross) {
      return NextResponse.json({ error: "Amount exceeds your available balance" }, { status: 400 });
    }
  } else {
    if (amount < MIN_REFERRAL_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ₹${MIN_REFERRAL_WITHDRAWAL}` }, { status: 400 });
    }
    const [[wallet]] = await pool.query<RowDataPacket[]>(
      "SELECT available FROM referral_wallets WHERE shop_id = ? LIMIT 1",
      [shop.shopId]
    );
    if (!wallet || amount > Number(wallet.available)) {
      return NextResponse.json({ error: "Amount exceeds your available referral balance" }, { status: 400 });
    }
    await pool.query(
      "UPDATE referral_wallets SET available = available - ?, reserved = reserved + ? WHERE shop_id = ?",
      [amount, amount, shop.shopId]
    );
  }

  const commission = Math.round(amount * (PLATFORM_COMMISSION_PCT / 100) * 100) / 100;
  const netAmount = Math.round((amount - commission) * 100) / 100;

  await pool.query(
    `INSERT INTO withdrawals (shop_id, source, gross_amount, commission_pct, commission_amount, net_amount, payout_method, payout_destination)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [shop.shopId, source, amount, PLATFORM_COMMISSION_PCT, commission, netAmount, payoutMethod || "upi", payoutDestination]
  );

  return NextResponse.json({ ok: true });
}
