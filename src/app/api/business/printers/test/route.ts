import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

// Queues a real test print job — the agent downloads a generated test page
// and sends it to the printer just like a real order, so this button is a
// genuine test, not a decorative one.
export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { printerId } = await req.json().catch(() => ({ printerId: undefined }));
  const pool = getPool();

  let printers: RowDataPacket[];
  if (printerId) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM printers WHERE id = ? AND shop_id = ? LIMIT 1",
      [printerId, shop.shopId]
    );
    printers = rows;
  } else {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM printers WHERE shop_id = ?", [shop.shopId]);
    printers = rows;
  }

  if (printers.length === 0) {
    return NextResponse.json({ error: "No printers to test" }, { status: 400 });
  }

  for (const printer of printers) {
    await pool.query(
      "INSERT INTO print_jobs (order_id, shop_id, printer_id, is_test, status) VALUES (NULL, ?, ?, 1, 'queued')",
      [shop.shopId, printer.id]
    );
  }

  return NextResponse.json({ ok: true, queued: printers.length });
}
