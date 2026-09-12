import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";
import type { Sided, ColorMode } from "./price";

export type PublicPricingRule = {
  paper_size: string;
  color_mode: ColorMode;
  sided: Sided;
  price_per_page: string;
  binding_price: string;
};

export type PublicPortalSettings = {
  show_customer_details_page: number;
  require_name: number;
  require_mobile: number;
  allow_stapling: number;
  pages_per_sheet_enabled: number;
  service_toggles: Record<string, boolean>;
  paper_format_visibility: Record<string, boolean>;
};

export type PublicShopSettings = {
  accept_online_payments: number;
  allow_manual_payment: number;
  checkout_display_name: string | null;
  currency: string;
  upi_id: string | null;
  min_order_amount: string;
  max_file_size_mb: number;
};

const DEFAULT_PORTAL_SETTINGS: PublicPortalSettings = {
  show_customer_details_page: 1,
  require_name: 1,
  require_mobile: 1,
  allow_stapling: 0,
  pages_per_sheet_enabled: 0,
  service_toggles: {},
  paper_format_visibility: {},
};

const DEFAULT_SHOP_SETTINGS: PublicShopSettings = {
  accept_online_payments: 0,
  allow_manual_payment: 1,
  checkout_display_name: null,
  currency: "INR",
  upi_id: null,
  min_order_amount: "1.00",
  max_file_size_mb: 25,
};

export async function getPublicShopBySlug(slug: string) {
  const pool = getPool();

  const [shopRows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, slug FROM shops WHERE slug = ? AND is_active = 1 LIMIT 1",
    [slug]
  );
  const shop = shopRows[0];
  if (!shop) return null;

  const [rules] = await pool.query<RowDataPacket[]>(
    `SELECT paper_size, color_mode, sided, price_per_page, binding_price
     FROM pricing_rules WHERE shop_id = ? AND is_active = 1`,
    [shop.id]
  );

  const [portalRows] = await pool.query<RowDataPacket[]>(
    `SELECT show_customer_details_page, require_name, require_mobile, allow_stapling,
            pages_per_sheet_enabled, service_toggles, paper_format_visibility
     FROM customer_portal_settings WHERE shop_id = ? LIMIT 1`,
    [shop.id]
  );

  const [settingsRows] = await pool.query<RowDataPacket[]>(
    `SELECT accept_online_payments, allow_manual_payment, checkout_display_name, currency,
            upi_id, min_order_amount, max_file_size_mb
     FROM shop_settings WHERE shop_id = ? LIMIT 1`,
    [shop.id]
  );

  return {
    shop: shop as { id: number; name: string; slug: string },
    pricing: rules as PublicPricingRule[],
    portal: (portalRows[0] as PublicPortalSettings) || DEFAULT_PORTAL_SETTINGS,
    settings: (settingsRows[0] as PublicShopSettings) || DEFAULT_SHOP_SETTINGS,
  };
}
