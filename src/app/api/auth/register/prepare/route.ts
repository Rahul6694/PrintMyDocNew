import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { signPendingRegistration } from "@/lib/pendingRegistration";

export async function POST(req: NextRequest) {
  const { ownerName, name, email, password, phone, referredByCode } = await req.json();

  if (!ownerName || !name || !email || !password || !phone) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "Mobile number must be 10 digits" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const pool = getPool();
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM shops WHERE email = ?", [email]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = signPendingRegistration({
    ownerName,
    name,
    email,
    passwordHash,
    phone,
    referredByCode: referredByCode || undefined,
  });

  return NextResponse.json({ token });
}
