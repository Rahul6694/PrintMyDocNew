import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyAgentRequest } from "@/lib/agentAuth";

type ReportedPrinter = { name: string; isDefault?: boolean; paperTray?: string };

export async function POST(req: NextRequest) {
  const agent = await verifyAgentRequest(req);
  if (!agent) return NextResponse.json({ error: "Invalid agent credentials" }, { status: 401 });

  const { printers, version } = (await req.json()) as { printers: ReportedPrinter[]; version?: string };

  const pool = getPool();
  await pool.query(
    "UPDATE print_agents SET status = 'online', agent_version = ?, last_ping_at = NOW() WHERE id = ?",
    [version || null, agent.agentId]
  );

  const reportedNames = (printers || []).map((p) => p.name);

  for (const printer of printers || []) {
    await pool.query(
      `INSERT INTO printers (shop_id, agent_id, name, is_default, paper_tray, status, last_seen_at)
       VALUES (?, ?, ?, ?, ?, 'online', NOW())
       ON DUPLICATE KEY UPDATE is_default = VALUES(is_default), paper_tray = VALUES(paper_tray),
         status = 'online', last_seen_at = NOW()`,
      [agent.shopId, agent.agentId, printer.name, printer.isDefault ? 1 : 0, printer.paperTray || "auto"]
    );
  }

  if (reportedNames.length > 0) {
    await pool.query(
      `UPDATE printers SET status = 'offline' WHERE agent_id = ? AND name NOT IN (?)`,
      [agent.agentId, reportedNames]
    );
  } else {
    await pool.query("UPDATE printers SET status = 'offline' WHERE agent_id = ?", [agent.agentId]);
  }

  return NextResponse.json({ ok: true });
}
