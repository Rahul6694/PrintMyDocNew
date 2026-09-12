import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [shops] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.name, s.email, s.slug, s.phone, s.is_active, s.created_at,
            sub.plan, sub.status AS subscription_status, sub.expires_at
     FROM shops s
     LEFT JOIN subscriptions sub ON sub.id = (
       SELECT id FROM subscriptions WHERE shop_id = s.id ORDER BY created_at DESC LIMIT 1
     )
     ORDER BY s.created_at DESC`
  );

  return NextResponse.json({ shops });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { shopId, isActive } = await req.json();
  const pool = getPool();
  await pool.query("UPDATE shops SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, shopId]);
  return NextResponse.json({ ok: true });
}
