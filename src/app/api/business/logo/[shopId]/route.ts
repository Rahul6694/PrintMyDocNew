import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

// Public — this logo is shown to customers on the checkout page, so it isn't shop-auth gated.
export async function GET(req: NextRequest, { params }: { params: { shopId: string } }) {
  const dir = path.join(process.cwd(), "uploads", "logos");

  for (const ext of Object.keys(EXT_TO_CONTENT_TYPE)) {
    try {
      const buffer = await readFile(path.join(dir, `${params.shopId}${ext}`));
      return new NextResponse(buffer, { headers: { "Content-Type": EXT_TO_CONTENT_TYPE[ext] } });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "Logo not found" }, { status: 404 });
}
