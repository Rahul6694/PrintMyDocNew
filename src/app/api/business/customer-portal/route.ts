import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";

const DEFAULTS = {
  show_customer_details_page: 1,
  require_name: 1,
  require_mobile: 1,
  allow_stapling: 0,
  pages_per_sheet_enabled: 0,
  service_toggles: {
    black_white: true,
    color: true,
    single_sided: true,
    back_to_back_auto: true,
    back_to_back_manual: true,
  },
  paper_format_visibility: { A4: true, A3: true, Letter: true, Legal: true },
};

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM customer_portal_settings WHERE shop_id = ? LIMIT 1",
    [shop.shopId]
  );
  return NextResponse.json({ settings: rows[0] || DEFAULTS });
}

export async function PUT(req: NextRequest) {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const pool = getPool();

  await pool.query(
    `INSERT INTO customer_portal_settings
       (shop_id, show_customer_details_page, require_name, require_mobile, allow_stapling,
        pages_per_sheet_enabled, service_toggles, paper_format_visibility)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       show_customer_details_page = VALUES(show_customer_details_page),
       require_name = VALUES(require_name),
       require_mobile = VALUES(require_mobile),
       allow_stapling = VALUES(allow_stapling),
       pages_per_sheet_enabled = VALUES(pages_per_sheet_enabled),
       service_toggles = VALUES(service_toggles),
       paper_format_visibility = VALUES(paper_format_visibility)`,
    [
      shop.shopId,
      body.show_customer_details_page ? 1 : 0,
      body.require_name ? 1 : 0,
      body.require_mobile ? 1 : 0,
      body.allow_stapling ? 1 : 0,
      body.pages_per_sheet_enabled ? 1 : 0,
      JSON.stringify(body.service_toggles || DEFAULTS.service_toggles),
      JSON.stringify(body.paper_format_visibility || DEFAULTS.paper_format_visibility),
    ]
  );

  return NextResponse.json({ ok: true });
}
