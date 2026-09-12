import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export type PendingRegistration = {
  purpose: "pending_registration";
  ownerName: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  referredByCode?: string;
};

// Nothing is written to the database until payment succeeds — the entire
// registration form just travels as a signed, short-lived token between the
// details step and the payment step. Abandoning payment leaves no trace.
export function signPendingRegistration(data: Omit<PendingRegistration, "purpose">): string {
  return jwt.sign({ ...data, purpose: "pending_registration" }, JWT_SECRET, { expiresIn: "30m" });
}

export function verifyPendingRegistration(token: string): PendingRegistration | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as PendingRegistration;
    return payload.purpose === "pending_registration" ? payload : null;
  } catch {
    return null;
  }
}
