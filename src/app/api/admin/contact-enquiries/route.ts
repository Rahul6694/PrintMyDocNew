import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [enquiries] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, phone, email, message, status, created_at FROM contact_enquiries ORDER BY created_at DESC LIMIT 200"
  );
  return NextResponse.json({ enquiries });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id, status } = await req.json();
  if (!["new", "read", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query("UPDATE contact_enquiries SET status = ? WHERE id = ?", [status, id]);
  return NextResponse.json({ ok: true });
}
