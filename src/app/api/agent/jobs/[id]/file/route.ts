import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readFile } from "fs/promises";
import path from "path";
import { getPool } from "@/lib/db";
import { verifyAgentRequest } from "@/lib/agentAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await verifyAgentRequest(req);
  if (!agent) return NextResponse.json({ error: "Invalid agent credentials" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT pj.is_test, p.name AS printer_name, o.file_name, o.file_path FROM print_jobs pj
     LEFT JOIN orders o ON o.id = pj.order_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.id = ? AND pj.shop_id = ? LIMIT 1`,
    [params.id, agent.shopId]
  );
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (job.is_test) {
    const content = `PrintMyDoc test page\nPrinter: ${job.printer_name || "unknown"}\nGenerated: ${new Date().toISOString()}\n\nIf you can read this, the printer connection is working.\n`;
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="printmydoc-test-page.txt"`,
      },
    });
  }

  const uploadsRoot = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsRoot, job.file_path);
  if (!filePath.startsWith(uploadsRoot)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${job.file_name}"`,
    },
  });
}
