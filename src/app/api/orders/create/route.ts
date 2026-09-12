import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db";
import { calculatePrice, type Sided, type ColorMode } from "@/lib/price";
import { getRazorpay } from "@/lib/razorpay";
import { canAcceptNewOrder } from "@/lib/subscription";
import { consumeCredit } from "@/lib/credits";
import { sendTemplatedEmail } from "@/lib/mailer";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const DEFAULT_MAX_FILE_MB = 25;

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PMD-${stamp}-${rand}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const slug = String(form.get("slug") || "");
  const customerName = String(form.get("customerName") || "").trim();
  const customerPhone = String(form.get("customerPhone") || "").trim();
  const paperSize = String(form.get("paperSize") || "A4");
  const colorMode = String(form.get("colorMode") || "bw") as ColorMode;
  const sided = String(form.get("sided") || "single") as Sided;
  const pageCount = Number(form.get("pageCount") || 1);
  const copies = Number(form.get("copies") || 1);
  const binding = form.get("binding") === "true";
  const instructions = String(form.get("instructions") || "").slice(0, 500);
  const paymentMethod = String(form.get("paymentMethod") || "razorpay") as "razorpay" | "manual";
  const file = form.get("file") as File | null;

  if (!slug || !file) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Number.isFinite(pageCount) || pageCount < 1 || !Number.isFinite(copies) || copies < 1) {
    return NextResponse.json({ error: "Invalid page count or copies" }, { status: 400 });
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const pool = getPool();
  const [shopRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, email FROM shops WHERE slug = ? AND is_active = 1 LIMIT 1",
    [slug]
  );
  const shop = shopRows[0];
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const [settingsRows] = await pool.query<RowDataPacket[]>(
    `SELECT accept_online_payments, allow_manual_payment, min_order_amount, max_file_size_mb,
            require_name, require_mobile
     FROM shop_settings LEFT JOIN customer_portal_settings USING (shop_id)
     WHERE shop_id = ? LIMIT 1`,
    [shop.id]
  );
  const settings = settingsRows[0];
  const maxFileMb = settings?.max_file_size_mb ?? DEFAULT_MAX_FILE_MB;
  if (file.size > maxFileMb * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${maxFileMb}MB)` }, { status: 400 });
  }
  if (settings?.require_name && !customerName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (settings?.require_mobile !== 0 && !customerPhone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (paymentMethod === "razorpay" && settings && !settings.accept_online_payments) {
    return NextResponse.json({ error: "Online payments are not enabled for this shop" }, { status: 400 });
  }
  if (paymentMethod === "manual" && settings && !settings.allow_manual_payment) {
    return NextResponse.json({ error: "Manual payment is not accepted by this shop" }, { status: 400 });
  }

  const gate = await canAcceptNewOrder(shop.id);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 403 });
  }

  let price;
  try {
    price = await calculatePrice({ shopId: shop.id, paperSize, colorMode, sided, pageCount, copies, binding });
  } catch {
    return NextResponse.json({ error: "No pricing configured for this combination" }, { status: 400 });
  }

  const minOrder = Number(settings?.min_order_amount ?? 1);
  if (price.total < minOrder) {
    return NextResponse.json(
      { error: `Minimum order amount is ₹${minOrder}` },
      { status: 400 }
    );
  }

  const shopDir = path.join(process.cwd(), "uploads", String(shop.id));
  await mkdir(shopDir, { recursive: true });
  const storedFileName = `${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(shopDir, storedFileName), bytes);
  const relativeFilePath = path.join(String(shop.id), storedFileName);

  const orderNumber = generateOrderNumber();
  const initialStatus = paymentMethod === "manual" ? "pending" : "pending_payment";

  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO orders
      (shop_id, order_number, customer_name, customer_phone, file_name, file_path,
       page_count, copies, paper_size, color_mode, sided, binding, instructions, total_amount, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      shop.id,
      orderNumber,
      customerName,
      customerPhone,
      file.name,
      relativeFilePath,
      pageCount,
      copies,
      paperSize,
      colorMode,
      sided,
      binding ? 1 : 0,
      instructions,
      price.total,
      initialStatus,
    ]
  );
  const orderId = insertResult.insertId;

  if (await consumeCredit(shop.id)) {
    await pool.query("UPDATE orders SET credit_consumed = 1 WHERE id = ?", [orderId]);
  }

  sendTemplatedEmail("order_received", shop.email, {
    shopName: shop.name,
    orderNumber,
    customerName,
    amount: String(price.total),
  }).catch(() => {});

  if (paymentMethod === "manual") {
    await pool.query(
      `INSERT INTO payments (order_id, payment_method, amount, status) VALUES (?, 'manual', ?, 'created')`,
      [orderId, price.total]
    );
    return NextResponse.json({ orderId, orderNumber, amount: price.total, paymentMethod: "manual" });
  }

  let razorpayOrder;
  try {
    const razorpay = getRazorpay();
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(price.total * 100), // paise
      currency: "INR",
      receipt: orderNumber,
      notes: { orderId: String(orderId), shopId: String(shop.id) },
    });
  } catch (err) {
    await pool.query("UPDATE orders SET status = 'print_failed' WHERE id = ?", [orderId]);
    const message = err instanceof Error ? err.message : "Payment gateway error";
    return NextResponse.json({ error: `Could not start payment: ${message}` }, { status: 502 });
  }

  await pool.query(
    `INSERT INTO payments (order_id, payment_method, razorpay_order_id, amount, status)
     VALUES (?, 'razorpay', ?, ?, 'created')`,
    [orderId, razorpayOrder.id, price.total]
  );

  return NextResponse.json({
    orderId,
    orderNumber,
    amount: price.total,
    razorpayOrderId: razorpayOrder.id,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    paymentMethod: "razorpay",
  });
}
