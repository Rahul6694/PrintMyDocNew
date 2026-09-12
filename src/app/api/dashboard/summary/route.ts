import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const shopId = shop.shopId;

  const [[todayRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue, COUNT(*) AS count
     FROM orders WHERE shop_id = ? AND status = 'done' AND created_at >= CURDATE()`,
    [shopId]
  );

  const [[totalsRow]] = await pool.query<RowDataPacket[]>(
    `SELECT
       SUM(status = 'done') AS completed,
       SUM(status IN ('pending','processing','printing')) AS pending,
       COUNT(*) AS total
     FROM orders WHERE shop_id = ? AND status != 'pending_payment'`,
    [shopId]
  );

  const [weekRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     WHERE shop_id = ? AND status != 'pending_payment' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [shopId]
  );

  const [monthRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     WHERE shop_id = ? AND status = 'done' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY month
     ORDER BY month ASC`,
    [shopId]
  );

  const [recentOrders] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_number, customer_name, file_name, status, total_amount, created_at
     FROM orders WHERE shop_id = ? AND status != 'pending_payment' AND created_at >= CURDATE()
     ORDER BY created_at DESC LIMIT 10`,
    [shopId]
  );

  return NextResponse.json({
    todayRevenue: Number(todayRow.revenue),
    todayCompletedCount: Number(todayRow.count),
    totalOrders: Number(totalsRow.total || 0),
    pendingOrders: Number(totalsRow.pending || 0),
    completedOrders: Number(totalsRow.completed || 0),
    weekSeries: weekRows,
    monthSeries: monthRows,
    recentOrders,
  });
}
