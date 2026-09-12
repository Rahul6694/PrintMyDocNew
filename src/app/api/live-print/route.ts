import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rawPrinters] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, status, last_seen_at FROM printers WHERE shop_id = ? ORDER BY name",
    [shop.shopId]
  );

  // Heartbeats land every 15s — treat anything older than 45s as stale.
  const STALE_MS = 45_000;
  const printers = rawPrinters.map((p) =>
    !p.last_seen_at || Date.now() - new Date(p.last_seen_at).getTime() > STALE_MS
      ? { ...p, status: "offline" }
      : p
  );

  const [jobs] = await pool.query<RowDataPacket[]>(
    `SELECT pj.id, pj.status, pj.is_test, o.order_number, o.customer_name, o.file_name, p.name AS printer_name
     FROM print_jobs pj LEFT JOIN orders o ON o.id = pj.order_id LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.shop_id = ? AND pj.status IN ('queued','sent','printing')
     ORDER BY pj.created_at ASC`,
    [shop.shopId]
  );

  const workingPrinters = printers.filter((p) => p.status === "online").length;
  const printingNow = jobs.filter((j) => j.status === "printing").length;
  const waitingToPrint = jobs.filter((j) => j.status === "queued" || j.status === "sent").length;

  return NextResponse.json({ printers, jobs, workingPrinters, printingNow, waitingToPrint });
}
