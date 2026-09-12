import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { computeBotReply } from "@/lib/bot";

// Meta calls this once with a GET to verify you own the webhook URL.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Receives inbound messages. NOTE: this stores messages and can send a plain
// acknowledgement reply, but it does not turn a WhatsApp chat into a print
// order — there's no conversational flow here to collect print options.
// Customers placing orders still use the web order page; WhatsApp is
// intake/notifications only in this build.
export async function POST(req: NextRequest) {
  const payload = await req.json();
  const pool = getPool();

  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages || [];
  const phoneNumberId = value?.metadata?.phone_number_id;

  if (!phoneNumberId || messages.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const [accountRows] = await pool.query<RowDataPacket[]>(
    "SELECT shop_id, access_token_encrypted, status FROM whatsapp_accounts WHERE phone_number_id = ? LIMIT 1",
    [phoneNumberId]
  );
  const account = accountRows[0];
  if (!account) return NextResponse.json({ ok: true });

  const [settingsRows] = await pool.query<RowDataPacket[]>(
    "SELECT whatsapp_ack FROM shop_settings WHERE shop_id = ? LIMIT 1",
    [account.shop_id]
  );
  const ackEnabled = settingsRows[0]?.whatsapp_ack !== 0;

  for (const message of messages) {
    await pool.query(
      `INSERT INTO whatsapp_messages (shop_id, wa_message_id, direction, from_number, to_number, message_type, media_id, raw_payload)
       VALUES (?, ?, 'inbound', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE wa_message_id = wa_message_id`,
      [
        account.shop_id,
        message.id,
        message.from,
        phoneNumberId,
        message.type,
        message[message.type]?.id || null,
        JSON.stringify(message),
      ]
    );

    if (ackEnabled && account.status === "connected") {
      try {
        const isDocument = message.type === "document" || message.type === "image";
        const reply = await computeBotReply(account.shop_id, { text: message.text?.body, isDocument });
        if (reply) {
          const accessToken = decryptSecret(account.access_token_encrypted);
          await sendWhatsAppTextMessage(phoneNumberId, accessToken, message.from, reply);
        }
      } catch {
        // Best-effort acknowledgement — inbound storage above already succeeded.
      }
    }
  }

  return NextResponse.json({ ok: true });
}
