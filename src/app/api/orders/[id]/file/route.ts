import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readFile } from "fs/promises";
import path from "path";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT file_name, file_path FROM orders WHERE id = ? AND shop_id = ? LIMIT 1",
    [params.id, shop.shopId]
  );
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsRoot, order.file_path);

  // Guard against path traversal — resolved path must stay inside uploads/.
  if (!filePath.startsWith(uploadsRoot)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${order.file_name}"`,
    },
  });
}
