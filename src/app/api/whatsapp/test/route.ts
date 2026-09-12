import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { sendWhatsAppTextMessage, WhatsAppApiError } from "@/lib/whatsapp";

// The actual "does WhatsApp login still work" check: sends a real test
// message through Meta's API using the stored credentials.
export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: "A destination phone number is required" }, { status: 400 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT phone_number_id, access_token_encrypted, status FROM whatsapp_accounts WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  const account = rows[0];
  if (!account || account.status !== "connected") {
    return NextResponse.json({ error: "Connect a WhatsApp number first" }, { status: 400 });
  }

  try {
    const accessToken = decryptSecret(account.access_token_encrypted);
    await sendWhatsAppTextMessage(
      account.phone_number_id,
      accessToken,
      to,
      "This is a test message from your PrintMyDoc shop — WhatsApp login is working."
    );
  } catch (err) {
    const message = err instanceof WhatsAppApiError ? err.message : "Failed to send test message";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
