import { NextResponse } from "next/server";
import { getCurrentShop } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const balance = await getCreditBalance(shop.shopId);
  return NextResponse.json({ balance });
}
