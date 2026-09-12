import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT file_name, file_path FROM shop_files WHERE id = ? AND shop_id = ? LIMIT 1",
    [params.id, shop.shopId]
  );
  const file = rows[0];
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsRoot, file.file_path);
  if (!filePath.startsWith(uploadsRoot)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.file_name}"`,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT file_path FROM shop_files WHERE id = ? AND shop_id = ? LIMIT 1",
    [params.id, shop.shopId]
  );
  const file = rows[0];
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsRoot, file.file_path);
  if (filePath.startsWith(uploadsRoot)) {
    await unlink(filePath).catch(() => {});
  }
  await pool.query("DELETE FROM shop_files WHERE id = ? AND shop_id = ?", [params.id, shop.shopId]);

  return NextResponse.json({ ok: true });
}
