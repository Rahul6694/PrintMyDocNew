import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { signSession, getSessionCookieName } from "@/lib/auth";

interface ShopRow extends RowDataPacket {
  id: number;
  email: string;
  slug: string;
  password_hash: string;
  is_active: number;
}

export async function POST(req: NextRequest) {
  const { email: identifier, password } = await req.json();

  if (!identifier || !password) {
    return NextResponse.json({ error: "Email/mobile and password are required" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query<ShopRow[]>(
    "SELECT id, email, slug, password_hash, is_active FROM shops WHERE email = ? OR phone = ? LIMIT 1",
    [identifier, identifier]
  );

  const shop = rows[0];
  if (!shop || !shop.is_active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, shop.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({ shopId: shop.id, email: shop.email, slug: shop.slug });

  const res = NextResponse.json({ ok: true, slug: shop.slug });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
