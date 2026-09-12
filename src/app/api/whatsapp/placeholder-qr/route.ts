import { NextResponse } from "next/server";
import QRCode from "qrcode";

// Purely decorative — encodes plain text, not a real pairing payload, so
// scanning it does nothing (unlike a real WhatsApp Web QR). Used only to make
// the disabled "Quick Scan Login" option look visually complete without
// implying a live, working session.
export async function GET() {
  const dataUrl = await QRCode.toDataURL("PrintMyDoc: Quick Scan Login is not available.", {
    width: 240,
    margin: 1,
    color: { dark: "#9199b8", light: "#ffffff" },
  });
  return NextResponse.json({ dataUrl });
}
