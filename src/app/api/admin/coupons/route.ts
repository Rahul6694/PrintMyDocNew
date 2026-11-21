import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { normalizeCouponCode } from "@/lib/coupons";
import { isPlanId } from "@/lib/plans";

type CouponInput = {
  code?: string;
  description?: string;
  discountType?: string;
  discountValue?: number | string;
  applicablePlans?: string[];
  maxUses?: number | string | null;
  oncePerShop?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validate(input: CouponInput): { error: string } | { values: unknown[] } {
  const code = normalizeCouponCode(input.code);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    return { error: "Code must be 3–40 characters: letters, numbers, - or _" };
  }
  if (input.discountType !== "percent" && input.discountType !== "flat") {
    return { error: "Discount type must be percent or flat" };
  }
  const value = Number(input.discountValue);
  if (!Number.isFinite(value) || value <= 0) return { error: "Discount value must be greater than 0" };
  if (input.discountType === "percent" && value > 100) return { error: "Percent discount cannot exceed 100" };

  const plans = (input.applicablePlans || []).filter(isPlanId);
  const maxUses = input.maxUses === "" || input.maxUses == null ? null : Number(input.maxUses);
  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { error: "Max uses must be a whole number of at least 1 (or empty for unlimited)" };
  }
  const startsAt = toDate(input.startsAt);
  const expiresAt = toDate(input.expiresAt);
  if (startsAt && expiresAt && expiresAt <= startsAt) return { error: "Expiry must be after the start date" };

  return {
    values: [
      code,
      input.description?.trim() || null,
      input.discountType,
      value,
      plans.length > 0 ? JSON.stringify(plans) : null,
      maxUses,
      input.oncePerShop === false ? 0 : 1,
      startsAt,
      expiresAt,
      input.isActive === false ? 0 : 1,
    ],
  };
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [coupons] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, COALESCE(SUM(CASE WHEN r.status = 'redeemed' THEN r.discount_amount END), 0) AS total_discount
     FROM coupons c LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
     GROUP BY c.id ORDER BY c.created_at DESC`
  );
  const [redemptions] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, c.code, r.email, s.name AS shop_name, r.plan, r.original_price, r.discount_amount, r.final_price, r.redeemed_at
     FROM coupon_redemptions r
     JOIN coupons c ON c.id = r.coupon_id
     LEFT JOIN shops s ON s.id = r.shop_id
     WHERE r.status = 'redeemed'
     ORDER BY r.redeemed_at DESC LIMIT 100`
  );
  return NextResponse.json({ coupons, redemptions });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const result = validate(await req.json());
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const pool = getPool();
  try {
    const [insert] = await pool.query<ResultSetHeader>(
      `INSERT INTO coupons (code, description, discount_type, discount_value, applicable_plans, max_uses,
                            once_per_shop, starts_at, expires_at, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...result.values, admin.adminId]
    );
    return NextResponse.json({ ok: true, id: insert.insertId });
  } catch (err) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }
    throw err;
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
  const pool = getPool();

  // Quick toggle from the list.
  if (Object.keys(body).length === 2 && typeof body.isActive === "boolean") {
    await pool.query("UPDATE coupons SET is_active = ? WHERE id = ?", [body.isActive ? 1 : 0, id]);
    return NextResponse.json({ ok: true });
  }

  const result = validate(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    await pool.query(
      `UPDATE coupons SET code = ?, description = ?, discount_type = ?, discount_value = ?, applicable_plans = ?,
                          max_uses = ?, once_per_shop = ?, starts_at = ?, expires_at = ?, is_active = ?
       WHERE id = ?`,
      [...result.values, id]
    );
  } catch (err) {
    if ((err as { code?: string }).code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT used_count FROM coupons WHERE id = ?", [id]);
  if (!rows[0]) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  if (rows[0].used_count > 0) {
    return NextResponse.json(
      { error: "This coupon has been used — deactivate it instead so its history is kept" },
      { status: 409 }
    );
  }
  await pool.query("DELETE FROM coupons WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
