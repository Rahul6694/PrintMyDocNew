import { NextRequest, NextResponse } from "next/server";
import { getPublicShopBySlug } from "@/lib/shop";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const data = await getPublicShopBySlug(params.slug);
  if (!data) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  return NextResponse.json(data);
}
