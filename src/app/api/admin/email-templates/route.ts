import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, template_key, subject, html_body, updated_at FROM email_templates ORDER BY template_key"
  );
  return NextResponse.json({ templates: rows });
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { templateKey, subject, htmlBody } = await req.json();
  if (!templateKey || !subject || !htmlBody) {
    return NextResponse.json({ error: "templateKey, subject and htmlBody are required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO email_templates (template_key, subject, html_body, updated_by) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE subject = VALUES(subject), html_body = VALUES(html_body), updated_by = VALUES(updated_by)`,
    [templateKey, subject, htmlBody, admin.adminId]
  );

  return NextResponse.json({ ok: true });
}
