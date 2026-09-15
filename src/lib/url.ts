import { headers } from "next/headers";

// Derives the site's own base URL from the incoming request instead of a
// hardcoded env var, so QR codes / WhatsApp links work on whatever host the
// app is actually being served from (localhost, a bare server IP, or a
// domain) without needing per-deployment config.
export function getBaseUrl(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") || "http";
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
