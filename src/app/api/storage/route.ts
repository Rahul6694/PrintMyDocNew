import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

const ALLOWED = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt", ".xlsx", ".csv"];
const MAX_BYTES = 25 * 1024 * 1024;

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [files] = await pool.query<RowDataPacket[]>(
    `SELECT id, category, file_name, file_size, created_at FROM shop_files
     WHERE shop_id = ? ORDER BY created_at DESC LIMIT 200`,
    [shop.shopId]
  );
  const [categories] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT category FROM shop_files WHERE shop_id = ? ORDER BY category`,
    [shop.shopId]
  );

  return NextResponse.json({ files, categories: categories.map((c) => c.category) });
}

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const category = String(form.get("category") || "General").slice(0, 100);

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.includes(ext)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

  const dir = path.join(process.cwd(), "uploads", String(shop.shopId), "library");
  await mkdir(dir, { recursive: true });
  const storedName = `${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), bytes);

  const relativePath = path.join(String(shop.shopId), "library", storedName);
  const pool = getPool();
  const [result] = await pool.query(
    "INSERT INTO shop_files (shop_id, category, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?)",
    [shop.shopId, category, file.name, relativePath, file.size]
  );

  return NextResponse.json({ ok: true, id: (result as { insertId: number }).insertId });
}
