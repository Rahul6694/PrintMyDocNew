require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DEFAULT_PRICING = [
  { paper_size: "A4", color_mode: "bw", sided: "single", price_per_page: 2.0 },
  { paper_size: "A4", color_mode: "bw", sided: "back_to_back_manual", price_per_page: 3.5 },
  { paper_size: "A4", color_mode: "color", sided: "single", price_per_page: 10.0 },
  { paper_size: "A4", color_mode: "color", sided: "back_to_back_manual", price_per_page: 18.0 },
];

const DEFAULT_CAPABILITIES = {
  black_white: true,
  color: true,
  single_sided: true,
  back_to_back_auto: false,
  back_to_back_manual: true,
  a4: true,
  a3: false,
  glossy_paper: false,
  plain_paper: true,
  auto_orientation: true,
  portrait: true,
  landscape: true,
  multiple_copies: true,
  page_selection: true,
  fit_to_page: true,
  actual_size: true,
  collated_printing: true,
  pages_per_sheet: false,
};

const DEFAULT_SERVICE_TOGGLES = {
  black_white: true,
  color: true,
  single: true,
  back_to_back_auto: true,
  back_to_back_manual: true,
};

const DEFAULT_PAPER_VISIBILITY = { A4: true, A3: true, Letter: true, Legal: true };

const EMAIL_TEMPLATES = [
  {
    key: "order_received",
    subject: "New order {{orderNumber}} received",
    html: "<p>Hi {{shopName}},</p><p>You have a new order <strong>{{orderNumber}}</strong> from {{customerName}} for ₹{{amount}}.</p>",
  },
  {
    key: "withdrawal_status",
    subject: "Your withdrawal is now {{status}}",
    html: "<p>Hi {{shopName}},</p><p>Your withdrawal request is now <strong>{{status}}</strong>. Net amount: ₹{{netAmount}}.</p>",
  },
  {
    key: "order_ready",
    subject: "Order {{orderNumber}} is ready for pickup",
    html: "<p>Hi {{customerName}},</p><p>Your order <strong>{{orderNumber}}</strong> is ready for pickup at {{shopName}}.</p>",
  },
  {
    key: "welcome_merchant",
    subject: "Welcome to PrintMyDoc",
    html: "<p>Hi {{shopName}},</p><p>Your merchant account is live. Set up your pricing and printers from Business Setup.</p>",
  },
];

function randomReferralCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function main() {
  const pool = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "printmydoc",
  });

  // --- Demo shop ---
  const email = process.env.SEED_SHOP_EMAIL;
  const password = process.env.SEED_SHOP_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_SHOP_EMAIL / SEED_SHOP_PASSWORD not set in .env.local");
  }

  const [existing] = await pool.query("SELECT id FROM shops WHERE email = ?", [email]);
  let shopId;

  if (existing.length > 0) {
    shopId = existing[0].id;
    console.log(`Shop already exists (id=${shopId}), updating password...`);
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query("UPDATE shops SET password_hash = ? WHERE id = ?", [passwordHash, shopId]);

    const [[current]] = await pool.query("SELECT referral_code FROM shops WHERE id = ?", [shopId]);
    if (!current.referral_code) {
      await pool.query("UPDATE shops SET referral_code = ? WHERE id = ?", [randomReferralCode(), shopId]);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO shops (name, slug, email, password_hash, phone, address, owner_name, city, state, pincode, referral_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Rahul Print Shop",
        "rahul-print-shop",
        email,
        passwordHash,
        "9999999999",
        "Main Market",
        "Rahul Kumar Sharma",
        "Delhi",
        "Delhi",
        "110001",
        randomReferralCode(),
      ]
    );
    shopId = result.insertId;
    console.log(`Created shop id=${shopId} slug=rahul-print-shop`);
  }

  for (const rule of DEFAULT_PRICING) {
    await pool.query(
      `INSERT INTO pricing_rules (shop_id, paper_size, color_mode, sided, price_per_page)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE price_per_page = VALUES(price_per_page)`,
      [shopId, rule.paper_size, rule.color_mode, rule.sided, rule.price_per_page]
    );
  }

  await pool.query(
    `INSERT INTO shop_capabilities (shop_id, capabilities) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE shop_id = shop_id`,
    [shopId, JSON.stringify(DEFAULT_CAPABILITIES)]
  );

  // Online + manual payments both on, sensible limits — so the demo order flow works immediately.
  await pool.query(
    `INSERT INTO shop_settings (shop_id, accept_online_payments, allow_manual_payment, checkout_display_name)
     VALUES (?, 1, 1, 'Rahul Print Shop')
     ON DUPLICATE KEY UPDATE accept_online_payments = 1, allow_manual_payment = 1`,
    [shopId]
  );

  await pool.query(
    `INSERT INTO customer_portal_settings (shop_id, service_toggles, paper_format_visibility)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE shop_id = shop_id`,
    [shopId, JSON.stringify(DEFAULT_SERVICE_TOGGLES), JSON.stringify(DEFAULT_PAPER_VISIBILITY)]
  );

  await pool.query(
    `INSERT INTO shop_credits (shop_id, period_ends_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 30 DAY))
     ON DUPLICATE KEY UPDATE shop_id = shop_id`,
    [shopId]
  );

  await pool.query(
    "INSERT INTO referral_wallets (shop_id) VALUES (?) ON DUPLICATE KEY UPDATE shop_id = shop_id",
    [shopId]
  );

  const [activeSub] = await pool.query(
    "SELECT id FROM subscriptions WHERE shop_id = ? AND status = 'active' AND expires_at > NOW() LIMIT 1",
    [shopId]
  );
  if (activeSub.length === 0) {
    await pool.query(
      `INSERT INTO subscriptions (shop_id, plan, price, status, started_at, expires_at)
       VALUES (?, 'premium', 500, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [shopId]
    );
    console.log("Activated a demo Premium subscription (30 days) so the order flow works immediately.");
  }

  // --- Super admin ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const [existingAdmin] = await pool.query("SELECT id FROM super_admins WHERE email = ?", [adminEmail]);
    const adminHash = await bcrypt.hash(adminPassword, 10);
    if (existingAdmin.length > 0) {
      await pool.query("UPDATE super_admins SET password_hash = ? WHERE id = ?", [adminHash, existingAdmin[0].id]);
      console.log(`Super admin already exists (${adminEmail}), updated password.`);
    } else {
      await pool.query("INSERT INTO super_admins (name, email, password_hash) VALUES (?, ?, ?)", [
        "Platform Admin",
        adminEmail,
        adminHash,
      ]);
      console.log(`Created super admin: ${adminEmail}`);
    }
  }

  // --- Email templates ---
  for (const t of EMAIL_TEMPLATES) {
    await pool.query(
      `INSERT INTO email_templates (template_key, subject, html_body) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE template_key = template_key`,
      [t.key, t.subject, t.html]
    );
  }
  console.log(`Seeded ${EMAIL_TEMPLATES.length} default email templates.`);

  console.log("\nSeed complete.");
  console.log(`Shop login: ${email} / ${password}`);
  console.log(`Shop order page: /s/rahul-print-shop`);
  if (adminEmail && adminPassword) {
    console.log(`Admin login: /admin/login with ${adminEmail} / ${adminPassword}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
