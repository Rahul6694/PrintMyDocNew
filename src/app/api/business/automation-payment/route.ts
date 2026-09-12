import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

const DEFAULTS = {
  push_notifications: 1,
  whatsapp_ack: 1,
  print_receipt: 1,
  auto_print_mode: "off",
  order_separator: "none",
  accept_online_payments: 0,
  use_own_razorpay: 0,
  razorpay_key_id: null,
  checkout_display_name: null,
  payment_logo_url: null,
  currency: "INR",
  upi_id: null,
  min_order_amount: "1.00",
  max_file_size_mb: 25,
  allow_manual_payment: 1,
};

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT push_notifications, whatsapp_ack, print_receipt, auto_print_mode, order_separator,
            accept_online_payments, use_own_razorpay, razorpay_key_id, allow_manual_payment,
            checkout_display_name, payment_logo_url, currency, upi_id, min_order_amount, max_file_size_mb
     FROM shop_settings WHERE shop_id = ? LIMIT 1`,
    [shop.shopId]
  );
  return NextResponse.json({ settings: rows[0] || DEFAULTS });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const b = await req.json();
  const pool = getPool();

  // razorpay_key_secret is only overwritten when a new one is actually supplied,
  // so re-saving this form never blanks out a previously stored secret.
  const setSecretClause = b.razorpayKeySecret ? ", razorpay_key_secret = ?" : "";
  const insertParams: (string | number | null)[] = [
    shop.shopId,
    b.pushNotifications ? 1 : 0,
    b.whatsappAck ? 1 : 0,
    b.printReceipt ? 1 : 0,
    b.autoPrintMode || "off",
    b.orderSeparator || "none",
    b.acceptOnlinePayments ? 1 : 0,
    b.useOwnRazorpay ? 1 : 0,
    b.razorpayKeyId || null,
    b.allowManualPayment ? 1 : 0,
    b.checkoutDisplayName || null,
    b.paymentLogoUrl || null,
    b.currency || "INR",
    b.upiId || null,
    b.minOrderAmount ?? 1,
    b.maxFileSizeMb ?? 25,
  ];
  const updateParams = b.razorpayKeySecret ? [b.razorpayKeySecret] : [];

  await pool.query(
    `INSERT INTO shop_settings
       (shop_id, push_notifications, whatsapp_ack, print_receipt, auto_print_mode, order_separator,
        accept_online_payments, use_own_razorpay, razorpay_key_id, allow_manual_payment,
        checkout_display_name, payment_logo_url, currency, upi_id, min_order_amount, max_file_size_mb)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       push_notifications = VALUES(push_notifications),
       whatsapp_ack = VALUES(whatsapp_ack),
       print_receipt = VALUES(print_receipt),
       auto_print_mode = VALUES(auto_print_mode),
       order_separator = VALUES(order_separator),
       accept_online_payments = VALUES(accept_online_payments),
       use_own_razorpay = VALUES(use_own_razorpay),
       razorpay_key_id = VALUES(razorpay_key_id),
       allow_manual_payment = VALUES(allow_manual_payment),
       checkout_display_name = VALUES(checkout_display_name),
       payment_logo_url = VALUES(payment_logo_url),
       currency = VALUES(currency),
       upi_id = VALUES(upi_id),
       min_order_amount = VALUES(min_order_amount),
       max_file_size_mb = VALUES(max_file_size_mb)${setSecretClause}`,
    [...insertParams, ...updateParams]
  );

  return NextResponse.json({ ok: true });
}
