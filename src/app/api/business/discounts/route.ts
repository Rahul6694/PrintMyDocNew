import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [bulkSettings] = await pool.query<RowDataPacket[]>(
    "SELECT enabled, threshold_amount FROM bulk_pricing_settings WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  const [bulkRates] = await pool.query<RowDataPacket[]>(
    "SELECT id, paper_size, color_mode, sided, enabled, discounted_price FROM bulk_pricing_rates WHERE shop_id = ?",
    [shop.shopId]
  );
  const [copySettings] = await pool.query<RowDataPacket[]>(
    "SELECT enabled FROM additional_copy_discount_settings WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  const [copyRates] = await pool.query<RowDataPacket[]>(
    "SELECT id, paper_size, color_mode, sided, discounted_price FROM additional_copy_discount_rates WHERE shop_id = ?",
    [shop.shopId]
  );

  return NextResponse.json({
    bulkSettings: bulkSettings[0] || { enabled: 0, threshold_amount: "100.00" },
    bulkRates,
    copySettings: copySettings[0] || { enabled: 0 },
    copyRates,
  });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const pool = getPool();

  if (body.type === "bulk_settings") {
    await pool.query(
      `INSERT INTO bulk_pricing_settings (shop_id, enabled, threshold_amount) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), threshold_amount = VALUES(threshold_amount)`,
      [shop.shopId, body.enabled ? 1 : 0, body.thresholdAmount]
    );
  } else if (body.type === "bulk_rate") {
    await pool.query(
      `INSERT INTO bulk_pricing_rates (shop_id, paper_size, color_mode, sided, enabled, discounted_price)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), discounted_price = VALUES(discounted_price)`,
      [shop.shopId, body.paperSize, body.colorMode, body.sided, body.enabled ? 1 : 0, body.discountedPrice]
    );
  } else if (body.type === "copy_settings") {
    await pool.query(
      `INSERT INTO additional_copy_discount_settings (shop_id, enabled) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)`,
      [shop.shopId, body.enabled ? 1 : 0]
    );
  } else if (body.type === "copy_rate") {
    await pool.query(
      `INSERT INTO additional_copy_discount_rates (shop_id, paper_size, color_mode, sided, discounted_price)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE discounted_price = VALUES(discounted_price)`,
      [shop.shopId, body.paperSize, body.colorMode, body.sided, body.discountedPrice]
    );
  } else {
    return NextResponse.json({ error: "Unknown discount type" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
