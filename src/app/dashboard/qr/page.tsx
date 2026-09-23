"use client";

import { useEffect, useState } from "react";
import { Download, Copy, ExternalLink, Printer } from "lucide-react";

export default function QrPage() {
  const [dataUrl, setDataUrl] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [shopName, setShopName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/qr")
      .then((res) => res.json())
      .then((data) => {
        setDataUrl(data.dataUrl);
        setOrderUrl(data.orderUrl);
      });
    fetch("/api/business/profile")
      .then((r) => r.json())
      .then((data) => setShopName(data.profile?.name || ""));
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <p className="text-xs text-accent-400 font-semibold uppercase tracking-wide mb-1">Customer Intake</p>
      <h1 className="text-2xl font-bold mb-1">Shop QR Code</h1>
      <p className="text-base-500 text-sm mb-6 max-w-lg">
        Download, print and test the permanent QR displayed at your counter.
      </p>

      <div className="card p-4 sm:p-6 max-w-2xl flex flex-col sm:flex-row gap-6 items-center">
        <div className="w-56 shrink-0">
          <div className="rounded-2xl bg-accent-500 p-4 text-white text-center">
            <p className="font-bold text-sm mb-2">
              Print<span className="opacity-80">MyDoc</span>
            </p>
            <div className="bg-white rounded-xl p-3">
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt="Shop order QR code" className="w-full rounded" />
              ) : (
                <div className="w-full aspect-square bg-base-800 rounded animate-pulse" />
              )}
            </div>
            <p className="font-semibold text-sm mt-2 truncate">{shopName}</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{shopName || "Your shop"}</h3>
          <p className="text-base-500 text-sm mb-4">
            Customers scan this permanent QR and go straight to your order page.
          </p>
          <input readOnly value={orderUrl} className="input-field text-xs mb-3" />
          <div className="flex flex-wrap gap-2">
            {dataUrl && (
              <a href={dataUrl} download="shop-qr.png" className="btn-primary text-sm flex items-center gap-1.5">
                <Download size={14} /> Download QR
              </a>
            )}
            <button onClick={copyLink} className="btn-secondary text-sm flex items-center gap-1.5">
              <Copy size={14} /> {copied ? "Copied!" : "Copy link"}
            </button>
            <a href={orderUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm flex items-center gap-1.5">
              <ExternalLink size={14} /> Test page
            </a>
          </div>
        </div>
      </div>

      <div className="card p-5 max-w-2xl mt-5 flex items-start gap-3">
        <Printer size={18} className="text-accent-400 shrink-0 mt-0.5" />
        <p className="text-sm text-base-500">
          Print this QR at your counter — customers scan it with any camera app, no install needed. The
          link never expires unless you deactivate your shop.
        </p>
      </div>
    </div>
  );
}
