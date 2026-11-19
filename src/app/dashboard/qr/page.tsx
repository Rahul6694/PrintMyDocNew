"use client";

import { useEffect, useState } from "react";
import { Download, Copy, ExternalLink, Printer, FileImage, FileText, RefreshCcw } from "lucide-react";

const POSTER_W = 1131;
const POSTER_H = 1600;

// Rasterise the poster SVG to a PNG data URL at `scale`× resolution (2× ≈ 300dpi at A5,
// sharp enough for A4 prints).
async function posterToPng(svgUrl: string, scale = 2): Promise<string> {
  const svgText = await fetch(svgUrl, { cache: "no-store" }).then((r) => r.text());
  const blobUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render poster"));
      img.src = blobUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = POSTER_W * scale;
    canvas.height = POSTER_H * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function QrPage() {
  const [dataUrl, setDataUrl] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [shopName, setShopName] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"" | "png" | "pdf" | "print">("");
  const [error, setError] = useState("");
  const [posterKey, setPosterKey] = useState(() => Date.now());

  const posterUrl = `/api/qr/poster?v=${posterKey}`;
  const fileBase = (shopName || "shop").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "shop";

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

  async function run(kind: "png" | "pdf" | "print") {
    setError("");
    setBusy(kind);
    try {
      const png = await posterToPng(posterUrl, kind === "png" ? 2 : 2);
      if (kind === "png") {
        triggerDownload(png, `${fileBase}-qr-poster.png`);
      } else if (kind === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        // A4 is 210×297; the poster is 1131:1600, so fit by height and centre.
        const h = 297;
        const w = (POSTER_W / POSTER_H) * h;
        pdf.addImage(png, "PNG", (210 - w) / 2, 0, w, h);
        pdf.save(`${fileBase}-qr-poster.pdf`);
      } else {
        const win = window.open("", "_blank");
        if (!win) throw new Error("Allow pop-ups to print the poster");
        win.document.write(
          `<!doctype html><title>QR Poster</title><style>@page{size:A4;margin:0}html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100vh}</style><img src="${png}" onload="setTimeout(function(){window.print()},200)">`
        );
        win.document.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the poster");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <p className="text-xs text-accent-400 font-semibold uppercase tracking-wide mb-1">Customer Intake</p>
      <h1 className="text-2xl font-bold mb-1">Shop QR Poster</h1>
      <p className="text-base-500 text-sm mb-6 max-w-xl">
        Print this poster and stick it at your counter. Customers scan, upload, pay online or cash — and the
        document prints automatically.
      </p>

      <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start max-w-5xl">
        <div className="card p-3 sm:p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={posterKey}
            src={posterUrl}
            alt={`QR poster for ${shopName || "your shop"}`}
            className="w-full rounded-xl border border-base-700 bg-white"
            width={POSTER_W}
            height={POSTER_H}
          />
        </div>

        <div className="space-y-5 min-w-0">
          <div className="card p-5">
            <h3 className="font-semibold mb-1">Download poster</h3>
            <p className="text-base-500 text-sm mb-4">A4 size, print-ready. Your shop name and payment options are filled in automatically.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => run("pdf")} disabled={!!busy} className="btn-primary text-sm flex items-center gap-1.5">
                <FileText size={14} /> {busy === "pdf" ? "Preparing…" : "Download PDF (A4)"}
              </button>
              <button onClick={() => run("png")} disabled={!!busy} className="btn-secondary text-sm flex items-center gap-1.5">
                <FileImage size={14} /> {busy === "png" ? "Preparing…" : "Download PNG"}
              </button>
              <button onClick={() => run("print")} disabled={!!busy} className="btn-secondary text-sm flex items-center gap-1.5">
                <Printer size={14} /> Print now
              </button>
              <a href={posterUrl} download={`${fileBase}-qr-poster.svg`} className="btn-secondary text-sm flex items-center gap-1.5">
                <Download size={14} /> SVG
              </a>
            </div>
            {error && <p className="text-danger text-sm mt-3">{error}</p>}
            <button
              onClick={() => setPosterKey(Date.now())}
              className="mt-4 text-xs text-base-500 hover:text-ink inline-flex items-center gap-1"
            >
              <RefreshCcw size={12} /> Changed your shop name or payment settings? Refresh poster
            </button>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-1">{shopName || "Your shop"} — order link</h3>
            <p className="text-base-500 text-sm mb-3">The QR opens this page. Share it on WhatsApp or Instagram too.</p>
            <input readOnly value={orderUrl} className="input-field text-xs mb-3" />
            <div className="flex flex-wrap gap-2">
              <button onClick={copyLink} className="btn-secondary text-sm flex items-center gap-1.5">
                <Copy size={14} /> {copied ? "Copied!" : "Copy link"}
              </button>
              <a href={orderUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm flex items-center gap-1.5">
                <ExternalLink size={14} /> Test page
              </a>
              {dataUrl && (
                <a href={dataUrl} download={`${fileBase}-qr.png`} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Download size={14} /> Plain QR only
                </a>
              )}
            </div>
          </div>

          <div className="card p-5 flex items-start gap-3">
            <Printer size={18} className="text-accent-400 shrink-0 mt-0.5" />
            <p className="text-sm text-base-500">
              The link never expires unless you deactivate your shop. The poster says &ldquo;Pay Online Or Pay Cash&rdquo;
              only when both are switched on in Business Setup → Automation &amp; Payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
