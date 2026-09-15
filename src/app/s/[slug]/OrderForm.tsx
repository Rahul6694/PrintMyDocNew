"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import type { PublicPricingRule, PublicPortalSettings, PublicShopSettings } from "@/lib/shop";
import type { Sided } from "@/lib/price";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SIDED_LABEL: Record<string, string> = {
  single: "Single-sided",
  back_to_back_auto: "Back-to-back (auto)",
  back_to_back_manual: "Back-to-back (manual)",
};

export default function OrderForm({
  slug,
  pricing,
  portal,
  settings,
}: {
  slug: string;
  pricing: PublicPricingRule[];
  portal: PublicPortalSettings;
  settings: PublicShopSettings;
}) {
  const paperSizes = useMemo(() => {
    const all = [...new Set(pricing.map((p) => p.paper_size))];
    const visibility = portal.paper_format_visibility || {};
    const filtered = all.filter((size) => visibility[size] !== false);
    return filtered.length > 0 ? filtered : all;
  }, [pricing, portal.paper_format_visibility]);

  const sidedOptions = useMemo(() => {
    const all = [...new Set(pricing.map((p) => p.sided))];
    const toggles = portal.service_toggles || {};
    const filtered = all.filter((s) => toggles[s] !== false);
    return filtered.length > 0 ? filtered : all;
  }, [pricing, portal.service_toggles]);

  const colorOptions = useMemo(() => {
    const all = [...new Set(pricing.map((p) => p.color_mode))];
    const toggles = portal.service_toggles || {};
    const filtered = all.filter((c) => toggles[c] !== false);
    return filtered.length > 0 ? filtered : all;
  }, [pricing, portal.service_toggles]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paperSize, setPaperSize] = useState(paperSizes[0] || "A4");
  const [colorMode, setColorMode] = useState<"bw" | "color">((colorOptions[0] as "bw" | "color") || "bw");
  const [sided, setSided] = useState(sidedOptions[0] || "single");
  const [pageCount, setPageCount] = useState(1);
  const [copies, setCopies] = useState(1);
  const [binding, setBinding] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<"idle" | "submitting" | "paid" | "placed" | "error">("idle");
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const activeRule = pricing.find(
    (p) => p.paper_size === paperSize && p.color_mode === colorMode && p.sided === sided
  );
  const estimate = activeRule
    ? (
        Number(activeRule.price_per_page) * pageCount * copies +
        (binding ? Number(activeRule.binding_price) * copies : 0)
      ).toFixed(2)
    : null;

  const showDetailsPage = portal.show_customer_details_page !== 0;
  const canPayOnline = settings.accept_online_payments === 1;
  const canPayManually = settings.allow_manual_payment === 1;

  async function submitOrder(paymentMethod: "razorpay" | "manual") {
    setError("");
    if (!file) {
      setError("Please attach a file to print");
      return;
    }
    setStatus("submitting");

    try {
      const form = new FormData();
      form.append("slug", slug);
      form.append("customerName", customerName);
      form.append("customerPhone", customerPhone);
      form.append("paperSize", paperSize);
      form.append("colorMode", colorMode);
      form.append("sided", sided);
      form.append("pageCount", String(pageCount));
      form.append("copies", String(copies));
      form.append("binding", String(binding));
      form.append("instructions", instructions);
      form.append("paymentMethod", paymentMethod);
      form.append("file", file);

      const res = await fetch("/api/orders/create", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create order");
        setStatus("error");
        return;
      }

      setOrderNumber(data.orderNumber);

      if (paymentMethod === "manual") {
        setStatus("placed");
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: Math.round(data.amount * 100),
        currency: "INR",
        name: "PrintMyDoc",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch(`/api/orders/${data.orderId}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            setStatus("paid");
          } else {
            setError(
              "Payment verification failed. If money was deducted, contact the shop with your order number."
            );
            setStatus("error");
          }
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
        theme: { color: "#f97316" },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "paid" || status === "placed") {
    return (
      <div className="card p-8 text-center">
        <p className="badge bg-success/10 text-success border border-success/30 mb-4">
          {status === "paid" ? "Payment confirmed" : "Order placed"}
        </p>
        <h2 className="text-xl font-bold mb-2">Order {orderNumber} placed</h2>
        <p className="text-base-500 text-sm">
          {status === "placed"
            ? "Pay the shop directly when you pick up your prints."
            : "The shop will print your document and notify you when it's ready for pickup."}
        </p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitOrder(canPayOnline ? "razorpay" : "manual");
        }}
        className="card p-6 space-y-5"
      >
        {showDetailsPage && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-base-500 block mb-1.5">Your name</label>
              <input
                required={portal.require_name !== 0}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-sm text-base-500 block mb-1.5">Phone</label>
              <input
                required={portal.require_mobile !== 0}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input-field"
                placeholder="10-digit number"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-base-500 block mb-1.5">File to print</label>
          <input
            required
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input-field file:mr-3 file:btn-primary file:border-0 file:cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Paper size</label>
            <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="input-field">
              {paperSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Color</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as "bw" | "color")}
              className="input-field"
            >
              {colorOptions.includes("bw") && <option value="bw">Black &amp; white</option>}
              {colorOptions.includes("color") && <option value="color">Color</option>}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Sided</label>
            <select value={sided} onChange={(e) => setSided(e.target.value as Sided)} className="input-field">
              {sidedOptions.map((s) => (
                <option key={s} value={s}>
                  {SIDED_LABEL[s] || s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-2.5">
            <input
              id="binding"
              type="checkbox"
              checked={binding}
              onChange={(e) => setBinding(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="binding" className="text-sm text-base-500">
              Add binding
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Pages</label>
            <input
              type="number"
              min={1}
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Copies</label>
            <input
              type="number"
              min={1}
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-base-500 block mb-1.5">Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="input-field"
            rows={2}
            placeholder="e.g. staple pages, print in landscape..."
          />
        </div>

        <div className="flex items-center justify-between border-t border-base-700/60 pt-4">
          <div>
            <p className="text-xs text-base-500">Estimated total</p>
            <p className="text-xl font-bold">{estimate ? `₹${estimate}` : "—"}</p>
          </div>
          <div className="flex gap-2">
            {canPayManually && (
              <button
                type="button"
                onClick={() => submitOrder("manual")}
                disabled={status === "submitting" || !estimate}
                className="text-sm font-semibold border border-base-700 rounded-lg px-4 py-2.5 hover:border-accent-500 transition-colors"
              >
                Pay at shop
              </button>
            )}
            {canPayOnline && (
              <button type="submit" disabled={status === "submitting" || !estimate} className="btn-primary">
                {status === "submitting" ? "Processing..." : "Pay & submit order"}
              </button>
            )}
            {!canPayOnline && !canPayManually && (
              <p className="text-danger text-sm">This shop isn&apos;t accepting orders right now.</p>
            )}
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}
      </form>
    </>
  );
}
