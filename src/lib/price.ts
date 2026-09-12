import { getPool } from "./db";
import type { RowDataPacket } from "mysql2";

export type Sided = "single" | "back_to_back_auto" | "back_to_back_manual";
export type ColorMode = "bw" | "color";

export type PriceInput = {
  shopId: number;
  paperSize: string;
  colorMode: ColorMode;
  sided: Sided;
  pageCount: number;
  copies: number;
  binding: boolean;
};

export type PriceBreakdown = {
  total: number;
  perPageFirstCopy: number;
  perPageAdditionalCopies: number;
  bulkDiscountApplied: boolean;
  additionalCopyDiscountApplied: boolean;
};

interface PricingRow extends RowDataPacket {
  price_per_page: string;
  binding_price: string;
}

interface DiscountRow extends RowDataPacket {
  enabled: number;
  discounted_price: string | null;
  threshold_amount?: string;
}

// Server-side price calculation — never trust a price sent from the client.
//
// Pricing order of operations (mirrors the merchant "Discounts" settings):
// 1. Base rate comes from pricing_rules for this (paper, color, sided) combination.
// 2. If bulk pricing is enabled and the normal order value clears the configured
//    threshold, the whole order re-prices at the bulk-discounted per-page rate.
// 3. If the additional-copy discount is enabled, copy 1 keeps the (possibly bulk)
//    rate above, and copies 2+ use the separately configured per-copy rate instead.
export async function calculatePrice(input: PriceInput): Promise<PriceBreakdown> {
  const pool = getPool();

  const [rows] = await pool.query<PricingRow[]>(
    `SELECT price_per_page, binding_price FROM pricing_rules
     WHERE shop_id = ? AND paper_size = ? AND color_mode = ? AND sided = ? AND is_active = 1
     LIMIT 1`,
    [input.shopId, input.paperSize, input.colorMode, input.sided]
  );
  if (rows.length === 0) {
    throw new Error("No pricing rule found for this combination");
  }

  const basePerPage = Number(rows[0].price_per_page);
  const bindingPrice = input.binding ? Number(rows[0].binding_price) : 0;
  const normalTotal = basePerPage * input.pageCount * input.copies + bindingPrice * input.copies;

  let perPageFirstCopy = basePerPage;
  let bulkDiscountApplied = false;

  const [bulkSettingsRows] = await pool.query<DiscountRow[]>(
    "SELECT enabled, threshold_amount FROM bulk_pricing_settings WHERE shop_id = ? LIMIT 1",
    [input.shopId]
  );
  const bulkSettings = bulkSettingsRows[0];
  if (bulkSettings?.enabled && normalTotal >= Number(bulkSettings.threshold_amount)) {
    const [bulkRateRows] = await pool.query<DiscountRow[]>(
      `SELECT enabled, discounted_price FROM bulk_pricing_rates
       WHERE shop_id = ? AND paper_size = ? AND color_mode = ? AND sided = ? LIMIT 1`,
      [input.shopId, input.paperSize, input.colorMode, input.sided]
    );
    const rate = bulkRateRows[0];
    if (rate?.enabled && rate.discounted_price !== null) {
      perPageFirstCopy = Number(rate.discounted_price);
      bulkDiscountApplied = true;
    }
  }

  let perPageAdditionalCopies = perPageFirstCopy;
  let additionalCopyDiscountApplied = false;

  const [copySettingsRows] = await pool.query<DiscountRow[]>(
    "SELECT enabled FROM additional_copy_discount_settings WHERE shop_id = ? LIMIT 1",
    [input.shopId]
  );
  if (copySettingsRows[0]?.enabled && input.copies > 1) {
    const [copyRateRows] = await pool.query<DiscountRow[]>(
      `SELECT discounted_price FROM additional_copy_discount_rates
       WHERE shop_id = ? AND paper_size = ? AND color_mode = ? AND sided = ? LIMIT 1`,
      [input.shopId, input.paperSize, input.colorMode, input.sided]
    );
    const rate = copyRateRows[0];
    if (rate?.discounted_price !== null && rate?.discounted_price !== undefined) {
      perPageAdditionalCopies = Number(rate.discounted_price);
      additionalCopyDiscountApplied = true;
    }
  }

  const total =
    perPageFirstCopy * input.pageCount +
    perPageAdditionalCopies * input.pageCount * (input.copies - 1) +
    bindingPrice * input.copies;

  return {
    total: Math.round(total * 100) / 100,
    perPageFirstCopy,
    perPageAdditionalCopies,
    bulkDiscountApplied,
    additionalCopyDiscountApplied,
  };
}
