import type { ResultSetHeader } from "mysql2";
import { getPool } from "./db";
import { DEFAULT_CAPABILITIES } from "./capabilities";

const DEFAULT_PRICING = [
  { paper_size: "A4", color_mode: "bw", sided: "single", price_per_page: 2.0 },
  { paper_size: "A4", color_mode: "bw", sided: "back_to_back_manual", price_per_page: 3.5 },
  { paper_size: "A4", color_mode: "color", sided: "single", price_per_page: 10.0 },
  { paper_size: "A4", color_mode: "color", sided: "back_to_back_manual", price_per_page: 18.0 },
];

function randomReferralCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Seeds every table a brand-new shop needs a row in, so the rest of the app
// can always assume shop_settings/customer_portal_settings/etc. exist.
export async function provisionNewShop(shopId: number): Promise<void> {
  const pool = getPool();

  let referralCode = randomReferralCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await pool.query("UPDATE shops SET referral_code = ? WHERE id = ?", [referralCode, shopId]);
      break;
    } catch {
      referralCode = randomReferralCode();
    }
  }

  await pool.query(
    "INSERT INTO shop_capabilities (shop_id, capabilities) VALUES (?, ?) ON DUPLICATE KEY UPDATE shop_id = shop_id",
    [shopId, JSON.stringify(DEFAULT_CAPABILITIES)]
  );

  await pool.query(
    "INSERT INTO shop_settings (shop_id) VALUES (?) ON DUPLICATE KEY UPDATE shop_id = shop_id",
    [shopId]
  );

  await pool.query(
    `INSERT INTO customer_portal_settings (shop_id, service_toggles, paper_format_visibility)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shop_id = shop_id`,
    [
      shopId,
      JSON.stringify({ black_white: true, color: true, single: true, back_to_back_auto: true, back_to_back_manual: true }),
      JSON.stringify({ A4: true, A3: true, Letter: true, Legal: true }),
    ]
  );

  await pool.query(
    "INSERT INTO shop_credits (shop_id, period_ends_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 30 DAY)) ON DUPLICATE KEY UPDATE shop_id = shop_id",
    [shopId]
  );

  await pool.query(
    "INSERT INTO referral_wallets (shop_id) VALUES (?) ON DUPLICATE KEY UPDATE shop_id = shop_id",
    [shopId]
  );

  for (const rule of DEFAULT_PRICING) {
    await pool.query(
      `INSERT INTO pricing_rules (shop_id, paper_size, color_mode, sided, price_per_page) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE price_per_page = VALUES(price_per_page)`,
      [shopId, rule.paper_size, rule.color_mode, rule.sided, rule.price_per_page]
    );
  }
}

export async function createShop(params: {
  name: string;
  ownerName?: string;
  email: string;
  passwordHash: string;
  phone: string;
  referredByCode?: string;
}): Promise<number> {
  const pool = getPool();
  const baseSlug = params.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100) || "shop";

  let slug = baseSlug;
  for (let i = 1; i < 20; i++) {
    const [existing] = await pool.query("SELECT id FROM shops WHERE slug = ?", [slug]);
    if ((existing as unknown[]).length === 0) break;
    slug = `${baseSlug}-${i}`;
  }

  let referredByShopId: number | null = null;
  if (params.referredByCode) {
    const [rows] = await pool.query("SELECT id FROM shops WHERE referral_code = ?", [params.referredByCode]);
    const referrer = (rows as { id: number }[])[0];
    if (referrer) referredByShopId = referrer.id;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO shops (name, owner_name, slug, email, password_hash, phone, referred_by_shop_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [params.name, params.ownerName || null, slug, params.email, params.passwordHash, params.phone, referredByShopId]
  );
  const shopId = result.insertId;

  await provisionNewShop(shopId);

  if (referredByShopId) {
    const REFERRAL_BONUS = 50;
    await pool.query(
      `INSERT INTO referral_earnings (referrer_shop_id, referred_shop_id, amount, status) VALUES (?, ?, ?, 'pending')`,
      [referredByShopId, shopId, REFERRAL_BONUS]
    );
  }

  return shopId;
}
