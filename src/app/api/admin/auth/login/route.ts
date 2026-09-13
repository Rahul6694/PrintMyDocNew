import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { signAdminSession, getAdminCookieName } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, email, password_hash FROM super_admins WHERE email = ? LIMIT 1",
    [email]
  );
  const admin = rows[0];
  if (!admin) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = signAdminSession({ adminId: admin.id, email: admin.email });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure: req.headers.get("x-forwarded-proto") === "https" || req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
