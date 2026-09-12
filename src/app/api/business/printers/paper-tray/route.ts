import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { printerId, paperTray } = await req.json();
  const pool = getPool();
  await pool.query("UPDATE printers SET paper_tray = ? WHERE id = ? AND shop_id = ?", [
    paperTray,
    printerId,
    shop.shopId,
  ]);

  return NextResponse.json({ ok: true });
}
