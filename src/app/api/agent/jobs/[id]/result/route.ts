import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { verifyAgentRequest } from "@/lib/agentAuth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await verifyAgentRequest(req);
  if (!agent) return NextResponse.json({ error: "Invalid agent credentials" }, { status: 401 });

  const { status, errorMessage } = (await req.json()) as {
    status: "completed" | "failed";
    errorMessage?: string;
  };
  if (status !== "completed" && status !== "failed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, order_id FROM print_jobs WHERE id = ? AND shop_id = ? LIMIT 1",
    [params.id, agent.shopId]
  );
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  await pool.query(
    "UPDATE print_jobs SET status = ?, error_message = ?, attempts = attempts + 1 WHERE id = ?",
    [status, errorMessage || null, job.id]
  );
  if (job.order_id) {
    await pool.query("UPDATE orders SET status = ? WHERE id = ? AND status = 'printing'", [
      status === "completed" ? "done" : "print_failed",
      job.order_id,
    ]);
  }

  return NextResponse.json({ ok: true });
}
