import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

const ALLOWED = [".png", ".jpg", ".jpeg"];
const MAX_BYTES = 1024 * 1024; // 1MB

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 1MB)" }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: "Only PNG/JPG/JPEG allowed" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "uploads", "logos");
  await mkdir(dir, { recursive: true });
  const fileName = `${shop.shopId}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, fileName), bytes);

  const url = `/api/business/logo/${shop.shopId}?v=${Date.now()}`;
  const pool = getPool();
  await pool.query(
    `INSERT INTO shop_settings (shop_id, payment_logo_url) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE payment_logo_url = VALUES(payment_logo_url)`,
    [shop.shopId, url]
  );

  return NextResponse.json({ ok: true, url });
}
