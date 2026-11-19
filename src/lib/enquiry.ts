// Shared client-side helpers for the contact form, the Business Inquiry modal
// and the Free Demo modal. Every send is also saved through /api/contact so
// nothing is lost if the visitor closes WhatsApp or their mail app.
import { mailtoLink, whatsappLink } from "./site";

export type Enquiry = { name: string; phone: string; email: string; message: string };

export function validateEnquiry(e: Enquiry, opts: { requireMessage?: boolean } = {}): string | null {
  if (!e.name.trim()) return "Please enter your name.";
  if (!/^[6-9]\d{9}$/.test(e.phone.trim())) return "Please enter a valid 10-digit mobile number.";
  if (e.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email.trim())) return "Please enter a valid email address.";
  if (opts.requireMessage !== false && !e.message.trim()) return "Please write your message.";
  return null;
}

export async function saveEnquiry(e: Enquiry): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || "Could not send your message." };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

function composeText(e: Enquiry): string {
  return [
    "Hello PrintMyDoc,",
    "",
    e.message.trim(),
    "",
    `Name: ${e.name.trim()}`,
    `Mobile: ${e.phone.trim()}`,
    e.email.trim() ? `Email: ${e.email.trim()}` : "",
  ]
    .filter((l, i, a) => l !== "" || (a[i - 1] ?? "") !== "")
    .join("\n");
}

// Saves the enquiry, then opens WhatsApp or the mail app with it pre-filled.
// Returns an error string, or null on success.
export async function sendEnquiry(e: Enquiry, via: "wa" | "mail"): Promise<string | null> {
  const saved = await saveEnquiry(e);
  if (!saved.ok) return saved.error || "Could not send your message.";
  const text = composeText(e);
  const wa = via === "wa" ? whatsappLink(text) : null;
  const href = wa || mailtoLink(`Enquiry from ${e.name.trim()}`, text);
  window.open(href, wa ? "_blank" : "_self", "noopener");
  return null;
}
