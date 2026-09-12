import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export async function verifyAgentRequest(
  req: NextRequest
): Promise<{ shopId: number; agentId: number } | null> {
  const shopId = Number(req.headers.get("x-shop-id"));
  const secret = req.headers.get("x-agent-secret");
  if (!shopId || !secret) return null;

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, agent_secret_hash FROM print_agents WHERE shop_id = ? LIMIT 1",
    [shopId]
  );
  const agent = rows[0];
  if (!agent) return null;

  const valid = await bcrypt.compare(secret, agent.agent_secret_hash);
  if (!valid) return null;

  return { shopId, agentId: agent.id };
}
