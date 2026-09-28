import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";

// Hands an order to the shop's default printer — the local agent picks it up on its next poll.
export async function queuePrintJob(orderId: number | string, shopId: number | string) {
  const pool = getPool();
  const [defaultPrinterRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM printers WHERE shop_id = ? AND is_default = 1 LIMIT 1",
    [shopId]
  );
  await pool.query(
    "INSERT INTO print_jobs (order_id, shop_id, printer_id, status) VALUES (?, ?, ?, 'queued')",
    [orderId, shopId, defaultPrinterRows[0]?.id || null]
  );
}

// Online-paid orders skip shop confirmation and go straight to the printer.
// The conditional UPDATE makes this idempotent: when both the client verify call
// and the Razorpay webhook fire, only the first one moves the order and queues a job.
export async function autoPrintPaidOrder(orderId: number | string) {
  const pool = getPool();
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE orders SET status = 'printing' WHERE id = ? AND status = 'pending_payment'",
    [orderId]
  );
  if (result.affectedRows !== 1) return;

  const [rows] = await pool.query<RowDataPacket[]>("SELECT shop_id FROM orders WHERE id = ? LIMIT 1", [orderId]);
  if (rows[0]) await queuePrintJob(orderId, rows[0].shop_id);
}
