import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { queuePrintJob } from "@/lib/printQueue";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "rejected"],
  processing: ["printing", "rejected"],
  printing: ["done", "print_failed"],
  print_failed: ["printing"],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { status: nextStatus } = await req.json();
  const pool = getPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, status FROM orders WHERE id = ? AND shop_id = ? LIMIT 1",
    [params.id, shop.shopId]
  );
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot move order from ${order.status} to ${nextStatus}` },
      { status: 400 }
    );
  }

  await pool.query("UPDATE orders SET status = ? WHERE id = ? AND shop_id = ?", [
    nextStatus,
    params.id,
    shop.shopId,
  ]);

  // Entering "printing" hands the job to the default printer via the local agent.
  if (nextStatus === "printing") {
    await queuePrintJob(params.id, shop.shopId);
  }

  return NextResponse.json({ ok: true });
}
