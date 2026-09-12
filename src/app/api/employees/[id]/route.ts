import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { isActive } = await req.json();
  const pool = getPool();
  await pool.query("UPDATE employees SET is_active = ? WHERE id = ? AND shop_id = ?", [
    isActive ? 1 : 0,
    params.id,
    shop.shopId,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  await pool.query("DELETE FROM employees WHERE id = ? AND shop_id = ?", [params.id, shop.shopId]);
  return NextResponse.json({ ok: true });
}
