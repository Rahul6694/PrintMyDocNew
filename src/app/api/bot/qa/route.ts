import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [pairs] = await pool.query<RowDataPacket[]>(
    "SELECT id, question, answer FROM bot_qa_pairs WHERE shop_id = ? ORDER BY created_at DESC",
    [shop.shopId]
  );
  return NextResponse.json({ pairs });
}

export async function POST(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { question, answer } = await req.json();
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query("INSERT INTO bot_qa_pairs (shop_id, question, answer) VALUES (?, ?, ?)", [
    shop.shopId,
    question.trim(),
    answer.trim(),
  ]);

  return NextResponse.json({ ok: true });
}
