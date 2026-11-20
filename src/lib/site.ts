// Public contact details shown on the marketing pages, footer and modals.
// WhatsApp/phone can be overridden from env without a code change;
// otherwise they default to the main support number.
export const SUPPORT_EMAIL = "support@printmydoc.app";

// Digits only, with country code, e.g. "919876543210".
export const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "918275500437").replace(/\D/g, "");

// Display form, e.g. "+91 98765 43210".
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 82755 00437";

export const SUPPORT_HOURS = "Call: 10am – 7pm · Message: anytime";

export function whatsappLink(text: string): string | null {
  if (!SUPPORT_WHATSAPP) return null;
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const SITE_NAV = [
  { href: "/", label: "Home" },
  { href: "/setup-guide", label: "How to Setup" },
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact Us" },
  { href: "/login", label: "Shop Owner Login" },
];
