import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { getCurrentShop } from "@/lib/auth";
import { getBaseUrl } from "@/lib/url";
import { buildPosterSvg } from "@/lib/qrPoster";

// GET /api/qr/poster          → the signed-in shop's counter poster (SVG)
// GET /api/qr/poster?sample=1 → a demo poster for the landing page (no auth)
export async function GET(req: NextRequest) {
  const base = getBaseUrl();

  if (req.nextUrl.searchParams.get("sample") === "1") {
    const svg = await buildPosterSvg({ url: base, shopName: "Your Shop Name", acceptOnline: true, acceptCash: true });
    return svgResponse(svg, "public, max-age=3600");
  }

  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT s.name, ss.accept_online_payments, ss.allow_manual_payment
     FROM shops s LEFT JOIN shop_settings ss ON ss.shop_id = s.id
     WHERE s.id = ? LIMIT 1`,
    [shop.shopId]
  );
  const row = rows[0];
  // Same defaults as Business Setup: online off, cash on, until the shop changes them.
  const acceptOnline = row?.accept_online_payments === 1;
  const acceptCash = row?.allow_manual_payment !== 0;

  const svg = await buildPosterSvg({
    url: `${base}/s/${shop.slug}`,
    shopName: row?.name || "Your Shop",
    acceptOnline,
    acceptCash: acceptCash || !acceptOnline,
  });
  return svgResponse(svg, "private, no-store");
}

function svgResponse(svg: string, cache: string) {
  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": cache },
  });
}
