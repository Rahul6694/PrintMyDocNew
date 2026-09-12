import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

// Generates (or rotates) the local print agent's credentials. The plaintext
// secret is returned exactly once — only its bcrypt hash is stored.
export async function POST() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const secret = crypto.randomBytes(24).toString("base64url");
  const secretHash = await bcrypt.hash(secret, 10);

  const pool = getPool();
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM print_agents WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );

  if (existing.length > 0) {
    await pool.query("UPDATE print_agents SET agent_secret_hash = ?, status = 'offline' WHERE shop_id = ?", [
      secretHash,
      shop.shopId,
    ]);
  } else {
    await pool.query(
      "INSERT INTO print_agents (shop_id, agent_secret_hash, status) VALUES (?, ?, 'offline')",
      [shop.shopId, secretHash]
    );
  }

  return NextResponse.json({ shopId: shop.shopId, secret });
}
