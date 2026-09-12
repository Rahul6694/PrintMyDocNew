import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { getOrderCollectionBalance } from "@/lib/finance";

export async function GET(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const range = req.nextUrl.searchParams.get("range") || "today"; // today | yesterday | date | all
  const date = req.nextUrl.searchParams.get("date");

  const balance = await getOrderCollectionBalance(shop.shopId);
  const pool = getPool();

  let dateClause = "";
  const dateParams: string[] = [];
  if (range === "today") {
    dateClause = "AND o.created_at >= CURDATE()";
  } else if (range === "yesterday") {
    dateClause = "AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND o.created_at < CURDATE()";
  } else if (range === "date" && date) {
    dateClause = "AND DATE(o.created_at) = ?";
    dateParams.push(date);
  }
  // range === "all" applies no date filter

  const [[rangeRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS orders, SUM(p.status = 'paid') AS paidOrders, COALESCE(SUM(o.total_amount), 0) AS orderValue,
            COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS collected
     FROM orders o LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.shop_id = ? AND o.status != 'pending_payment' ${dateClause}`,
    [shop.shopId, ...dateParams]
  );

  const [transactions] = await pool.query<RowDataPacket[]>(
    `SELECT o.created_at AS date, o.order_number, o.customer_name, p.razorpay_payment_id, p.amount, p.status
     FROM payments p JOIN orders o ON o.id = p.order_id
     WHERE o.shop_id = ? AND p.payment_method = 'razorpay' ${dateClause}
     ORDER BY o.created_at DESC LIMIT 50`,
    [shop.shopId, ...dateParams]
  );

  const [withdrawalHistory] = await pool.query<RowDataPacket[]>(
    `SELECT id, net_amount, status, requested_at FROM withdrawals
     WHERE shop_id = ? AND source = 'order_collection' ORDER BY requested_at DESC LIMIT 20`,
    [shop.shopId]
  );

  return NextResponse.json({
    balance,
    today: {
      orders: Number(rangeRow.orders),
      paidOrders: Number(rangeRow.paidOrders || 0),
      orderValue: Number(rangeRow.orderValue),
      collected: Number(rangeRow.collected),
    },
    transactions,
    withdrawalHistory,
  });
}
