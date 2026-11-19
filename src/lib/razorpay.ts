import Razorpay from "razorpay";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local"
      );
    }
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

// The Razorpay SDK rejects with a plain object like
// { statusCode: 401, error: { code: "BAD_REQUEST_ERROR", description: "Authentication failed" } }
// — not an Error instance — so `err instanceof Error` was false and the real
// reason (wrong keys, test/live mismatch, amount too small…) was hidden behind
// "Payment gateway error". This pulls the actual description out and logs it.
export function gatewayErrorMessage(err: unknown): string {
  console.error("[razorpay] order create failed:", err);
  if (err instanceof Error) return err.message;
  const e = err as { statusCode?: number; error?: { description?: string } } | null;
  const desc = e?.error?.description;
  if (e?.statusCode === 401 || /authentication/i.test(desc || "")) {
    return "Payment gateway authentication failed — the shop's Razorpay keys are invalid or test/live keys are mixed up";
  }
  return desc || "Payment gateway error";
}

// ── Per-shop gateway ────────────────────────────────────────────────────────
// Shops can switch on "Use my own Razorpay account" in Business Setup. Before,
// that toggle and the keys were saved but never read, so every customer payment
// still went through the platform keys. This resolves which account to use.

export type ShopGateway = { client: Razorpay; keyId: string; keySecret: string; own: boolean };

// Stored secrets are AES-GCM "iv.tag.data" strings; older rows hold plaintext.
export function readStoredSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.split(".").length === 3 && !stored.startsWith("rzp_")) {
    try {
      return decryptSecret(stored);
    } catch {
      /* fall through: treat as legacy plaintext */
    }
  }
  return stored;
}

export async function getShopGateway(shopId: number): Promise<ShopGateway> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT use_own_razorpay, razorpay_key_id, razorpay_key_secret FROM shop_settings WHERE shop_id = ? LIMIT 1",
    [shopId]
  );
  const s = rows[0];
  const ownSecret = readStoredSecret(s?.razorpay_key_secret);
  if (s?.use_own_razorpay && s.razorpay_key_id && ownSecret) {
    const keyId = String(s.razorpay_key_id).trim();
    return { client: new Razorpay({ key_id: keyId, key_secret: ownSecret }), keyId, keySecret: ownSecret, own: true };
  }
  return {
    client: getRazorpay(),
    keyId: process.env.RAZORPAY_KEY_ID as string,
    keySecret: process.env.RAZORPAY_KEY_SECRET as string,
    own: false,
  };
}
