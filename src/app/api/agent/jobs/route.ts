import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { verifyAgentRequest } from "@/lib/agentAuth";

export async function GET(req: NextRequest) {
  const agent = await verifyAgentRequest(req);
  if (!agent) return NextResponse.json({ error: "Invalid agent credentials" }, { status: 401 });

  const pool = getPool();
  const [jobs] = await pool.query<RowDataPacket[]>(
    `SELECT pj.id, pj.order_id, pj.printer_id, pj.is_test, p.name AS printer_name, p.paper_tray,
            COALESCE(o.file_name, 'printmydoc-test-page.txt') AS file_name,
            COALESCE(o.copies, 1) AS copies,
            COALESCE(o.color_mode, 'bw') AS color_mode,
            COALESCE(o.sided, 'single') AS sided,
            COALESCE(o.paper_size, 'A4') AS paper_size
     FROM print_jobs pj
     LEFT JOIN orders o ON o.id = pj.order_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.shop_id = ? AND pj.status = 'queued'
     ORDER BY pj.created_at ASC
     LIMIT 20`,
    [agent.shopId]
  );

  if (jobs.length > 0) {
    const ids = jobs.map((j) => j.id);
    await pool.query<ResultSetHeader>("UPDATE print_jobs SET status = 'sent' WHERE id IN (?)", [ids]);
  }

  return NextResponse.json({ jobs });
}
