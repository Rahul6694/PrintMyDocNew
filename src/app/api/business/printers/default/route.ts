import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { printerId } = await req.json();
  const pool = getPool();

  await pool.query("UPDATE printers SET is_default = 0 WHERE shop_id = ?", [shop.shopId]);
  await pool.query("UPDATE printers SET is_default = 1 WHERE id = ? AND shop_id = ?", [printerId, shop.shopId]);

  return NextResponse.json({ ok: true });
}
