import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { sendTemplatedEmail } from "@/lib/mailer";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const pool = getPool();
  let query = `SELECT w.id, w.shop_id, s.name AS shop_name, w.source, w.gross_amount, w.commission_amount,
                      w.net_amount, w.payout_method, w.payout_destination, w.status, w.admin_note,
                      w.requested_at, w.processed_at
               FROM withdrawals w JOIN shops s ON s.id = w.shop_id`;
  const params: string[] = [];
  if (status) {
    query += " WHERE w.status = ?";
    params.push(status);
  }
  query += " ORDER BY w.requested_at DESC LIMIT 200";

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return NextResponse.json({ withdrawals: rows });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { withdrawalId, status, adminNote } = await req.json();
  if (!["approved", "rejected", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM withdrawals WHERE id = ? LIMIT 1", [
    withdrawalId,
  ]);
  const withdrawal = rows[0];
  if (!withdrawal) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

  await pool.query(
    "UPDATE withdrawals SET status = ?, admin_note = ?, processed_by = ?, processed_at = NOW() WHERE id = ?",
    [status, adminNote || null, admin.adminId, withdrawalId]
  );

  if (withdrawal.source === "referral") {
    if (status === "rejected") {
      await pool.query(
        "UPDATE referral_wallets SET reserved = reserved - ?, available = available + ? WHERE shop_id = ?",
        [withdrawal.gross_amount, withdrawal.gross_amount, withdrawal.shop_id]
      );
    } else if (status === "paid") {
      await pool.query(
        "UPDATE referral_wallets SET reserved = reserved - ?, withdrawn = withdrawn + ? WHERE shop_id = ?",
        [withdrawal.gross_amount, withdrawal.gross_amount, withdrawal.shop_id]
      );
    }
  }

  const [[shopRow]] = await pool.query<RowDataPacket[]>("SELECT email, name FROM shops WHERE id = ?", [
    withdrawal.shop_id,
  ]);
  if (shopRow) {
    sendTemplatedEmail("withdrawal_status", shopRow.email, {
      shopName: shopRow.name,
      status,
      netAmount: String(withdrawal.net_amount),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
