import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { verifyWhatsAppCredentials, WhatsAppApiError } from "@/lib/whatsapp";
import { encryptSecret } from "@/lib/crypto";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT phone_number_id, waba_id, display_phone_number, status, connected_at FROM whatsapp_accounts WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  return NextResponse.json({ account: rows[0] || null });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { phoneNumberId, wabaId, accessToken } = await req.json();
  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: "Phone number ID and access token are required" }, { status: 400 });
  }

  let verified;
  try {
    verified = await verifyWhatsAppCredentials(phoneNumberId, accessToken);
  } catch (err) {
    const message = err instanceof WhatsAppApiError ? err.message : "Could not verify WhatsApp credentials";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO whatsapp_accounts (shop_id, phone_number_id, waba_id, display_phone_number, access_token_encrypted, status, connected_at)
     VALUES (?, ?, ?, ?, ?, 'connected', NOW())
     ON DUPLICATE KEY UPDATE phone_number_id = VALUES(phone_number_id), waba_id = VALUES(waba_id),
       display_phone_number = VALUES(display_phone_number), access_token_encrypted = VALUES(access_token_encrypted),
       status = 'connected', connected_at = NOW()`,
    [shop.shopId, phoneNumberId, wabaId || null, verified.display_phone_number, encryptSecret(accessToken)]
  );

  return NextResponse.json({ ok: true, displayPhoneNumber: verified.display_phone_number });
}

export async function DELETE() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  await pool.query("UPDATE whatsapp_accounts SET status = 'disconnected' WHERE shop_id = ?", [shop.shopId]);
  return NextResponse.json({ ok: true });
}
