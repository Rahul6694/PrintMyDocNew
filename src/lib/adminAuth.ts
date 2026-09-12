import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "pmd_admin_session";
const JWT_SECRET = process.env.JWT_SECRET as string;

export type AdminSession = {
  adminId: number;
  email: string;
  isAdmin: true;
};

export function signAdminSession(payload: Omit<AdminSession, "isAdmin">): string {
  return jwt.sign({ ...payload, isAdmin: true }, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAdminSession(token: string): AdminSession | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminSession;
    return payload.isAdmin ? payload : null;
  } catch {
    return null;
  }
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSession(token);
}
