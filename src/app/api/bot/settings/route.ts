import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { getBotSettings } from "@/lib/bot";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const settings = await getBotSettings(shop.shopId);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { enabled, botDisplayName, autoGreetingMessage, documentReceivedMessage } = await req.json();
  if (!autoGreetingMessage || !documentReceivedMessage) {
    return NextResponse.json({ error: "Both messages are required" }, { status: 400 });
  }
  if (autoGreetingMessage.length > 500 || documentReceivedMessage.length > 500) {
    return NextResponse.json({ error: "Messages must be 500 characters or fewer" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO bot_settings (shop_id, enabled, bot_display_name, auto_greeting_message, document_received_message)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), bot_display_name = VALUES(bot_display_name),
       auto_greeting_message = VALUES(auto_greeting_message), document_received_message = VALUES(document_received_message)`,
    [shop.shopId, enabled ? 1 : 0, botDisplayName || null, autoGreetingMessage, documentReceivedMessage]
  );

  return NextResponse.json({ ok: true });
}
