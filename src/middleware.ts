import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SHOP_COOKIE = "pmd_session";
const ADMIN_COOKIE = "pmd_admin_session";

async function isValidToken(token: string | undefined, secret: Uint8Array, requireAdmin: boolean) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return requireAdmin ? !!payload.isAdmin : true;
  } catch {
    return false;
  }
}

// Login/register pages must never be served from the browser's back-forward
// cache once a session exists — otherwise pressing Back after logging in can
// flash the old page before any redirect has a chance to run.
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export async function middleware(req: NextRequest) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const adminValid = await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value, secret, true);

    if (pathname === "/admin/login") {
      if (adminValid) return noStore(NextResponse.redirect(new URL("/admin/shops", req.url)));
      return noStore(NextResponse.next());
    }

    if (!adminValid) return NextResponse.redirect(new URL("/admin/login", req.url));
    return noStore(NextResponse.next());
  }

  const shopValid = await isValidToken(req.cookies.get(SHOP_COOKIE)?.value, secret, false);

  if (pathname === "/login" || pathname === "/register") {
    if (shopValid) return noStore(NextResponse.redirect(new URL("/dashboard", req.url)));
    return noStore(NextResponse.next());
  }

  if (pathname.startsWith("/dashboard")) {
    if (!shopValid) return NextResponse.redirect(new URL("/login", req.url));
    return noStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
