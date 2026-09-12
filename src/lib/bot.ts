import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export type BotSettings = {
  enabled: number;
  bot_display_name: string | null;
  auto_greeting_message: string;
  document_received_message: string;
};

const DEFAULT_SETTINGS: BotSettings = {
  enabled: 1,
  bot_display_name: null,
  auto_greeting_message: "Welcome to {shop}. Upload your document here: {link} Link expires in 30 minutes.",
  document_received_message: "We received {file}. Set your print options here: {link} Link expires in 30 minutes.",
};

const GREETINGS = ["hi", "hello", "hey", "menu", "start"];

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

export async function getBotSettings(shopId: number): Promise<BotSettings> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT enabled, bot_display_name, auto_greeting_message, document_received_message FROM bot_settings WHERE shop_id = ? LIMIT 1",
    [shopId]
  );
  return (rows[0] as BotSettings) || DEFAULT_SETTINGS;
}

// Shared logic used by both the real WhatsApp webhook and the dashboard's
// "Live Test Preview" — so the preview always reflects real bot behavior.
export async function computeBotReply(
  shopId: number,
  input: { text?: string; isDocument?: boolean }
): Promise<string | null> {
  const pool = getPool();
  const settings = await getBotSettings(shopId);
  if (!settings.enabled) return null;

  const [[shopRow]] = await pool.query<RowDataPacket[]>("SELECT name, slug FROM shops WHERE id = ?", [shopId]);
  const shopName = shopRow?.name || "our shop";
  const link = shopRow?.slug ? `${process.env.NEXT_PUBLIC_APP_URL}/s/${shopRow.slug}` : "";

  if (input.isDocument) {
    return interpolate(settings.document_received_message, { shop: shopName, link, file: "your document" });
  }

  const text = (input.text || "").trim().toLowerCase();
  if (!text || GREETINGS.includes(text)) {
    return interpolate(settings.auto_greeting_message, { shop: shopName, link, file: "" });
  }

  const [qaRows] = await pool.query<RowDataPacket[]>("SELECT question, answer FROM bot_qa_pairs WHERE shop_id = ?", [
    shopId,
  ]);
  const match = qaRows.find((qa) => text.includes(String(qa.question).toLowerCase()));
  if (match) return String(match.answer);

  return null;
}
