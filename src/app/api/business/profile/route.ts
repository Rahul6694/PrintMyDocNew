import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { DEFAULT_CAPABILITIES } from "@/lib/capabilities";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [shopRows] = await pool.query<RowDataPacket[]>(
    `SELECT name, owner_name, email, phone, address, city, state, pincode, gstin
     FROM shops WHERE id = ? LIMIT 1`,
    [shop.shopId]
  );
  const [capRows] = await pool.query<RowDataPacket[]>(
    "SELECT capabilities, advanced_services_enabled, physical_services_enabled FROM shop_capabilities WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );

  return NextResponse.json({
    profile: shopRows[0],
    capabilities: capRows[0]?.capabilities || DEFAULT_CAPABILITIES,
    advancedServicesEnabled: !!capRows[0]?.advanced_services_enabled,
    physicalServicesEnabled: !!capRows[0]?.physical_services_enabled,
  });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    ownerName,
    phone,
    address,
    city,
    state,
    pincode,
    gstin,
    capabilities,
    advancedServicesEnabled,
    physicalServicesEnabled,
    currentPassword,
    newPassword,
  } = body;

  const pool = getPool();

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>("SELECT password_hash FROM shops WHERE id = ?", [
      shop.shopId,
    ]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE shops SET password_hash = ? WHERE id = ?", [newHash, shop.shopId]);
  }

  await pool.query(
    `UPDATE shops SET name = ?, owner_name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?, gstin = ?
     WHERE id = ?`,
    [name, ownerName, phone, address, city, state, pincode, gstin || null, shop.shopId]
  );

  await pool.query(
    `INSERT INTO shop_capabilities (shop_id, capabilities, advanced_services_enabled, physical_services_enabled)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE capabilities = VALUES(capabilities),
       advanced_services_enabled = VALUES(advanced_services_enabled),
       physical_services_enabled = VALUES(physical_services_enabled)`,
    [
      shop.shopId,
      JSON.stringify(capabilities || DEFAULT_CAPABILITIES),
      advancedServicesEnabled ? 1 : 0,
      physicalServicesEnabled ? 1 : 0,
    ]
  );

  return NextResponse.json({ ok: true });
}
