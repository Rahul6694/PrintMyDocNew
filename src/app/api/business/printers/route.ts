import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [agentRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, status, agent_version, last_ping_at FROM print_agents WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  const agent = agentRows[0];

  // Heartbeats land every 15s — treat anything older than 45s as stale rather
  // than trusting a status the agent never got to flip back to "offline".
  const STALE_MS = 45_000;
  const isStale = (lastPing: string | null) => !lastPing || Date.now() - new Date(lastPing).getTime() > STALE_MS;

  let printers: RowDataPacket[] = [];
  if (agent) {
    if (isStale(agent.last_ping_at) && agent.status === "online") {
      agent.status = "offline";
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, is_default, paper_tray, status, last_seen_at FROM printers WHERE agent_id = ? ORDER BY name",
      [agent.id]
    );
    printers = rows.map((p) => (isStale(p.last_seen_at) && p.status === "online" ? { ...p, status: "offline" } : p));
  }

  return NextResponse.json({ agent: agent || null, printers });
}
