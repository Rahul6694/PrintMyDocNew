import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, role, assigned_printer_id, dedicated_qr_slug, is_active, created_at
     FROM employees WHERE shop_id = ? ORDER BY created_at DESC`,
    [shop.shopId]
  );
  return NextResponse.json({ employees: rows });
}

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const pool = getPool();
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      `INSERT INTO employees (shop_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [shop.shopId, name, email, passwordHash, role === "manager" ? "manager" : "staff"]
    );
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "An employee with this email already exists" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
