import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "pmd_session";
const JWT_SECRET = process.env.JWT_SECRET as string;

export type ShopSession = {
  shopId: number;
  email: string;
  slug: string;
};

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to .env.local");
}

export function signSession(payload: ShopSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): ShopSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as ShopSession;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export async function getCurrentShop(): Promise<ShopSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
