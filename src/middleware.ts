import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SHOP_COOKIE = "pmd_session";
const ADMIN_COOKIE = "pmd_admin_session";

export async function middleware(req: NextRequest) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    try {
      const { payload } = await jwtVerify(token, secret);
      if (!payload.isAdmin) throw new Error("not an admin token");
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  const token = req.cookies.get(SHOP_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
