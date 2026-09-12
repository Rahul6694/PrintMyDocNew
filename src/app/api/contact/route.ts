import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, phone, email, message } = await req.json();

  if (!name?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    "INSERT INTO contact_enquiries (name, phone, email, message) VALUES (?, ?, ?, ?)",
    [name.trim(), phone?.trim() || null, email?.trim() || null, message.trim()]
  );

  return NextResponse.json({ ok: true });
}
