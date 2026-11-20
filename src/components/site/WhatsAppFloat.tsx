import { whatsappLink } from "@/lib/site";

/* Floating "Chat on WhatsApp" button pinned to the bottom-right of the
   public pages. Renders nothing when no support WhatsApp number is set. */
export default function WhatsAppFloat({ message = "Hello PrintMyDoc, I have a question." }: { message?: string }) {
  const href = whatsappLink(message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 pl-3.5 pr-3.5 sm:pr-5 py-3.5 sm:py-3 hover:bg-[#1ebe5b] hover:scale-105 active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3C9.38 3 4 8.38 4 15.004c0 2.117.553 4.183 1.604 6.004L4 29l8.2-1.576a11.96 11.96 0 0 0 3.804.62C22.62 28.044 28 22.664 28 16.04 28 9.416 22.628 3 16.004 3Zm0 22.86a9.83 9.83 0 0 1-5.01-1.37l-.36-.214-4.866.936.95-4.74-.234-.374a9.79 9.79 0 0 1-1.5-5.094c0-5.43 4.42-9.85 9.86-9.85 5.43 0 9.85 4.42 9.85 9.85 0 5.43-4.42 10.856-9.69 10.856Zm5.4-7.37c-.296-.148-1.75-.864-2.022-.962-.27-.1-.468-.148-.665.148-.197.296-.763.962-.936 1.16-.172.197-.345.222-.64.074-.297-.148-1.252-.462-2.385-1.472-.882-.786-1.477-1.757-1.65-2.053-.172-.296-.018-.456.13-.604.133-.132.296-.345.444-.518.148-.172.197-.296.296-.493.099-.197.05-.37-.025-.518-.074-.148-.665-1.603-.911-2.195-.24-.576-.484-.498-.665-.507l-.567-.01a1.09 1.09 0 0 0-.788.37c-.27.296-1.035 1.011-1.035 2.466s1.06 2.86 1.207 3.057c.148.197 2.085 3.183 5.05 4.463.706.305 1.256.487 1.686.623.708.225 1.353.193 1.862.117.568-.085 1.75-.715 1.997-1.406.246-.69.246-1.282.172-1.406-.074-.123-.27-.197-.567-.345Z" />
      </svg>
      <span className="hidden sm:inline text-sm font-semibold">Chat with us</span>
    </a>
  );
}
