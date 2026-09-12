const GRAPH_API_VERSION = "v20.0";

export class WhatsAppApiError extends Error {}

// Verifies the phone number ID + access token actually work by asking Meta
// for that number's own metadata — the same call the dashboard's "Test
// connection" button makes.
export async function verifyWhatsAppCredentials(phoneNumberId: string, accessToken: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new WhatsAppApiError(data?.error?.message || "Meta rejected these credentials");
  }
  return data as { display_phone_number: string; verified_name: string };
}

export async function sendWhatsAppTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string
) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new WhatsAppApiError(data?.error?.message || "Failed to send WhatsApp message");
  }
  return data;
}
