import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rules] = await pool.query<RowDataPacket[]>(
    `SELECT id, paper_size, color_mode, sided, price_per_page, binding_price
     FROM pricing_rules WHERE shop_id = ? ORDER BY paper_size, color_mode, sided`,
    [shop.shopId]
  );
  const [special] = await pool.query<RowDataPacket[]>(
    `SELECT id, kind, color_mode, sided, enabled, price_per_output_page
     FROM special_pricing WHERE shop_id = ?`,
    [shop.shopId]
  );

  return NextResponse.json({ rules, special });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id, pricePerPage, bindingPrice } = await req.json();
  if (!id || pricePerPage === undefined) {
    return NextResponse.json({ error: "id and pricePerPage are required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    "UPDATE pricing_rules SET price_per_page = ?, binding_price = ? WHERE id = ? AND shop_id = ?",
    [pricePerPage, bindingPrice ?? 0, id, shop.shopId]
  );

  return NextResponse.json({ ok: true });
}
