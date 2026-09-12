import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

const VALID_STATUSES = new Set([
  "pending_payment",
  "pending",
  "processing",
  "printing",
  "print_failed",
  "rejected",
  "done",
  "cancelled",
]);

// Scoped strictly to the authenticated shop — a merchant can never see another shop's orders.
export async function GET(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const statusFilter = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search")?.trim();
  const rangeFilter = req.nextUrl.searchParams.get("range"); // today | yesterday | all

  const pool = getPool();
  let query = `SELECT id, order_number, customer_name, customer_phone, file_name, page_count, copies,
                      paper_size, color_mode, sided, binding, total_amount, status, credit_consumed,
                      origin, created_at
               FROM orders WHERE shop_id = ?`;
  const params: (string | number)[] = [shop.shopId];

  if (statusFilter && VALID_STATUSES.has(statusFilter)) {
    query += " AND status = ?";
    params.push(statusFilter);
  }

  if (search) {
    query += " AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR file_name LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (rangeFilter === "today") {
    query += " AND created_at >= CURDATE()";
  } else if (rangeFilter === "yesterday") {
    query += " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND created_at < CURDATE()";
  }

  query += " ORDER BY created_at DESC LIMIT 200";

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  const [counts] = await pool.query<RowDataPacket[]>(
    `SELECT status, COUNT(*) AS count FROM orders WHERE shop_id = ? GROUP BY status`,
    [shop.shopId]
  );
  const statusCounts: Record<string, number> = {};
  for (const row of counts) statusCounts[row.status] = Number(row.count);

  return NextResponse.json({ orders: rows, statusCounts });
}
