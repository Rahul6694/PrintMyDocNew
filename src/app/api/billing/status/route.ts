import { NextResponse } from "next/server";
import { getCurrentShop } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";

export async function GET() {
  const shop = await getCurrentShop();
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const subscription = await getActiveSubscription(shop.shopId);
  return NextResponse.json({ subscription });
}
