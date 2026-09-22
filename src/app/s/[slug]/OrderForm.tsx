"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import type { PublicPricingRule, PublicPortalSettings, PublicShopSettings } from "@/lib/shop";
import type { Sided } from "@/lib/price";
import PhotoEditor, { paperAspect } from "@/components/PhotoEditor";
import { composeSamePage, composeSeparatePages } from "@/lib/composePrintFile";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Crop,
  Loader2,
  Printer,
  RefreshCcw,
} from "lucide-react";

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

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

function isImageFile(file: File | null): boolean {
  if (!file) return false;
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

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

  // Photo editor: cropped output replaces the raw upload for whichever side
  // it was applied to. Two-sided documents (front + back) get composed into
  // a single upload right before submit — same page (one sheet) or separate
  // pages (a 2-page PDF) — since the backend stores/prints one file per order.
  const [frontEdited, setFrontEdited] = useState<Blob | null>(null);
  const [isTwoSided, setIsTwoSided] = useState(false);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backEdited, setBackEdited] = useState<Blob | null>(null);
  const [layoutMode, setLayoutMode] = useState<"same_page" | "separate_pages">("same_page");
  const [editingSide, setEditingSide] = useState<"front" | "back" | null>(null);

  const [status, setStatus] = useState<"idle" | "submitting" | "paid" | "placed" | "error">("idle");
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [copied, setCopied] = useState(false);

  const fileIsImage = isImageFile(file);

  useEffect(() => {
    if (!fileIsImage) {
      setIsTwoSided(false);
    }
  }, [fileIsImage]);

  // A crop is framed against the paper's aspect ratio at the time it was made.
  // Changing paper size after cropping would silently reuse a crop framed for
  // a different shape, so clear it and let the customer redo it deliberately.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFrontEdited(null);
    setBackEdited(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperSize]);

  // Front/back is one physical printed page (or, for separate pages, two
  // single-sided sheets) — lock the count/sided fields so they can't drift
  // out of sync with what the composed file actually is.
  useEffect(() => {
    if (!isTwoSided) return;
    setPageCount(layoutMode === "same_page" ? 1 : 2);
    if (sidedOptions.includes("single")) setSided("single");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTwoSided, layoutMode]);

  // Object URLs must be created and revoked explicitly (there's no GC hook for
  // them) — recompute the preview whenever the underlying source changes, and
  // always revoke the previous one so selecting/cropping repeatedly can't leak.
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    const source = frontEdited || file;
    if (!source) {
      setFrontPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(source);
    setFrontPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, frontEdited]);

  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    const source = backEdited || backFile;
    if (!source) {
      setBackPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(source);
    setBackPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [backFile, backEdited]);

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

  function handleFrontEdit(blob: Blob) {
    setFrontEdited(blob);
    setEditingSide(null);
  }

  function handleBackEdit(blob: Blob) {
    setBackEdited(blob);
    setEditingSide(null);
  }

  async function submitOrder(paymentMethod: "razorpay" | "manual") {
    setError("");
    if (!file) {
      setError("Please attach a file to print");
      return;
    }
    if (isTwoSided && !backFile) {
      setError("Please attach the back side too, or turn off front & back printing");
      return;
    }
    setStatus("submitting");

    try {
      let uploadFile: File | Blob = file;
      if (isTwoSided && backFile) {
        const frontSource = frontEdited || file;
        const backSource = backEdited || backFile;
        uploadFile =
          layoutMode === "same_page"
            ? await composeSamePage(frontSource, backSource, paperAspect(paperSize))
            : await composeSeparatePages(frontSource, backSource, paperSize);
      } else if (frontEdited) {
        uploadFile = frontEdited;
      }

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
      const uploadName = uploadFile instanceof File ? uploadFile.name : file.name;
      form.append("file", uploadFile, uploadName);

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

  function copyOrderNumber() {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (status === "paid" || status === "placed") {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-success" />
        </div>
        <p className="badge bg-success/10 text-success border border-success/30 mb-3">
          {status === "paid" ? "Payment confirmed" : "Order placed"}
        </p>
        <h2 className="text-xl font-bold mb-2">Order {orderNumber} placed</h2>
        <button
          type="button"
          onClick={copyOrderNumber}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-base-500 hover:text-ink mb-3"
        >
          <Copy size={12} /> {copied ? "Copied!" : "Copy order number"}
        </button>
        <p className="text-base-500 text-sm flex items-center justify-center gap-1.5">
          <Printer size={14} className="shrink-0" />
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

      {editingSide === "front" && file && (
        <PhotoEditor
          file={file}
          aspect={paperAspect(paperSize)}
          title="Edit & crop"
          onCancel={() => setEditingSide(null)}
          onApply={handleFrontEdit}
        />
      )}
      {editingSide === "back" && backFile && (
        <PhotoEditor
          file={backFile}
          aspect={paperAspect(paperSize)}
          title="Edit & crop back side"
          onCancel={() => setEditingSide(null)}
          onApply={handleBackEdit}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitOrder(canPayOnline ? "razorpay" : "manual");
        }}
        className="card p-6 space-y-5"
        aria-busy={status === "submitting"}
      >
        <fieldset disabled={status === "submitting"} className="space-y-5 disabled:opacity-60">
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
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setFrontEdited(null);
              }}
              className="input-field file:mr-3 file:btn-primary file:border-0 file:cursor-pointer"
            />

            {file && fileIsImage && frontPreviewUrl && (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frontPreviewUrl}
                  alt="Selected file preview"
                  className="w-12 h-12 object-cover rounded-md border border-base-700"
                />
                <button
                  type="button"
                  onClick={() => setEditingSide("front")}
                  className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-1.5 hover:border-accent-500 flex items-center gap-1.5"
                >
                  <Crop size={13} /> Edit / crop photo
                </button>
                {frontEdited && <span className="text-xs text-success">Cropped ✓</span>}
              </div>
            )}
          </div>

          {file && fileIsImage && (
            <div className="border border-base-700 rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTwoSided(!isTwoSided)}
                  className="toggle-switch"
                  data-on={isTwoSided}
                >
                  <span className="knob" />
                </button>
                <span className="text-sm font-medium">
                  This document has a back side too (e.g. ID card) — print front &amp; back
                </span>
              </label>

              {isTwoSided && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-sm text-base-500 block mb-1.5">Back side photo</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setBackFile(f);
                        setBackEdited(null);
                      }}
                      className="input-field file:mr-3 file:btn-primary file:border-0 file:cursor-pointer"
                    />
                    {backFile && backPreviewUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={backPreviewUrl}
                          alt="Back side preview"
                          className="w-12 h-12 object-cover rounded-md border border-base-700"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingSide("back")}
                          className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-1.5 hover:border-accent-500 flex items-center gap-1.5"
                        >
                          <Crop size={13} /> Edit / crop photo
                        </button>
                        {backEdited && <span className="text-xs text-success">Cropped ✓</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-base-500 mb-1.5">Layout</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLayoutMode("same_page")}
                        className={`text-xs font-semibold rounded-lg px-3 py-2.5 border transition-colors ${
                          layoutMode === "same_page"
                            ? "border-accent-500 bg-accent-500/10 text-accent-400"
                            : "border-base-700 hover:border-accent-500"
                        }`}
                      >
                        Front &amp; back on same page
                      </button>
                      <button
                        type="button"
                        onClick={() => setLayoutMode("separate_pages")}
                        className={`text-xs font-semibold rounded-lg px-3 py-2.5 border transition-colors ${
                          layoutMode === "separate_pages"
                            ? "border-accent-500 bg-accent-500/10 text-accent-400"
                            : "border-base-700 hover:border-accent-500"
                        }`}
                      >
                        Front &amp; back on different pages
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
              <select
                value={sided}
                onChange={(e) => setSided(e.target.value as Sided)}
                disabled={isTwoSided}
                className="input-field disabled:opacity-60"
              >
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
                disabled={isTwoSided}
                className="input-field disabled:opacity-60"
              />
              {isTwoSided && (
                <p className="text-xs text-base-500 mt-1">
                  Set automatically ({layoutMode === "same_page" ? "1 sheet" : "2 sheets"}) for front &amp; back.
                </p>
              )}
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
                  className="text-sm font-semibold border border-base-700 rounded-lg px-4 py-2.5 hover:border-accent-500 transition-colors flex items-center gap-2"
                >
                  {status === "submitting" && <Loader2 size={14} className="animate-spin" />}
                  Pay at shop
                </button>
              )}
              {canPayOnline && (
                <button
                  type="submit"
                  disabled={status === "submitting" || !estimate}
                  className="btn-primary flex items-center gap-2"
                >
                  {status === "submitting" && <Loader2 size={14} className="animate-spin" />}
                  {status === "submitting" ? "Processing..." : "Pay & submit order"}
                </button>
              )}
              {!canPayOnline && !canPayManually && (
                <p className="text-danger text-sm">This shop isn&apos;t accepting orders right now.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-3.5 py-3" role="alert">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-xs font-semibold underline mt-1 inline-flex items-center gap-1"
                >
                  <RefreshCcw size={11} /> Dismiss and try again
                </button>
              </div>
            </div>
          )}
        </fieldset>
      </form>
    </>
  );
}
