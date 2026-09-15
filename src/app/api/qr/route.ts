import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentShop } from "@/lib/auth";
import { getBaseUrl } from "@/lib/url";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orderUrl = `${getBaseUrl()}/s/${shop.slug}`;
  const dataUrl = await QRCode.toDataURL(orderUrl, {
    width: 320,
    margin: 1,
    color: { dark: "#0a0a0f", light: "#ffffff" },
  });

  return NextResponse.json({ dataUrl, orderUrl });
}
