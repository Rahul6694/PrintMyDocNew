import { NextRequest, NextResponse } from "next/server";
import { getCurrentShop } from "@/lib/auth";
import { computeBotReply } from "@/lib/bot";

// Powers the dashboard's "Live Test Preview" — runs the exact same reply
// logic the real WhatsApp webhook uses, so the preview never lies about
// what the bot will actually say.
export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { text, isDocument } = await req.json();
  const reply = await computeBotReply(shop.shopId, { text, isDocument });

  return NextResponse.json({
    reply: reply || "(No configured reply matches this message — the bot stays silent.)",
  });
}
