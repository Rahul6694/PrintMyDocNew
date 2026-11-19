"use client";

// Loads Razorpay's checkout.js on demand and resolves once `window.Razorpay`
// exists. Previously every page used <Script strategy="lazyOnload">, which only
// loads after the page is idle — on slow mobile networks a customer could tap
// "Pay" before the script arrived, `new window.Razorpay` threw, and they only
// saw a generic "Something went wrong".

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (response: { error?: { description?: string; reason?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in a browser"));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    const timer = window.setTimeout(() => fail("Payment page took too long to load. Check your internet and try again."), 15000);
    function fail(message: string) {
      window.clearTimeout(timer);
      script.remove();
      loading = null; // allow a retry on the next tap
      reject(new Error(message));
    }
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.Razorpay) resolve();
      else fail("Payment gateway failed to initialise. Please try again.");
    };
    script.onerror = () =>
      fail("Could not load the payment gateway. Check your internet, or disable any ad-blocker, and try again.");
    document.head.appendChild(script);
  });
  return loading;
}

// Opens checkout and wires the `payment.failed` event so a declined card/UPI
// shows Razorpay's reason instead of silently doing nothing.
export async function openRazorpay(
  options: Record<string, unknown>,
  onFailed?: (message: string) => void
): Promise<void> {
  await loadRazorpay();
  const rzp = new window.Razorpay(options);
  if (onFailed) {
    rzp.on("payment.failed", (response) => {
      onFailed(response.error?.description || "Payment failed. Please try again.");
    });
  }
  rzp.open();
}
