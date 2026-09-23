"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, X, Check } from "lucide-react";

// Standard portrait aspect ratios (width / height) for the paper sizes this
// app supports — used to size the crop window so what the customer crops
// matches the sheet it will actually be printed on.
const PAPER_ASPECT: Record<string, number> = {
  A4: 210 / 297,
  A3: 297 / 420,
  Letter: 215.9 / 279.4,
  Legal: 215.9 / 355.6,
};

export function paperAspect(paperSize: string): number {
  return PAPER_ASPECT[paperSize] || PAPER_ASPECT.A4;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function rotateImage(img: HTMLImageElement): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return loadImage(canvas.toDataURL("image/png"));
}

const CONTAINER_WIDTH = 320;
const EXPORT_WIDTH = 1400;

export default function PhotoEditor({
  file,
  aspect,
  title,
  onCancel,
  onApply,
}: {
  file: File;
  aspect: number;
  title: string;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const dragState = useRef<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null);

  const containerH = CONTAINER_WIDTH / aspect;

  const resetView = useCallback(
    (image: HTMLImageElement) => {
      const s = Math.max(CONTAINER_WIDTH / image.naturalWidth, containerH / image.naturalHeight);
      setMinScale(s);
      setScale(s);
      setOffset({
        x: (CONTAINER_WIDTH - image.naturalWidth * s) / 2,
        y: (containerH - image.naturalHeight * s) / 2,
      });
    },
    [containerH]
  );

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    loadImage(url)
      .then((image) => {
        if (cancelled) return;
        setImg(image);
        resetView(image);
      })
      .catch(() => setError("Could not load that image."))
      .finally(() => URL.revokeObjectURL(url));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function clampOffset(next: { x: number; y: number }, s: number, image: HTMLImageElement) {
    const w = image.naturalWidth * s;
    const h = image.naturalHeight * s;
    return {
      x: Math.min(0, Math.max(CONTAINER_WIDTH - w, next.x)),
      y: Math.min(0, Math.max(containerH - h, next.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!img) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current || !img) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(
      clampOffset({ x: dragState.current.startOffset.x + dx, y: dragState.current.startOffset.y + dy }, scale, img)
    );
  }

  function onPointerUp() {
    dragState.current = null;
  }

  function changeZoom(nextScale: number) {
    if (!img) return;
    const s = Math.min(minScale * 4, Math.max(minScale, nextScale));
    // Zoom around the crop window's center so zooming feels anchored, not like a jump.
    const cx = CONTAINER_WIDTH / 2;
    const cy = containerH / 2;
    const ratio = s / scale;
    const next = { x: cx - (cx - offset.x) * ratio, y: cy - (cy - offset.y) * ratio };
    setScale(s);
    setOffset(clampOffset(next, s, img));
  }

  async function rotate() {
    if (!img) return;
    try {
      const rotated = await rotateImage(img);
      setImg(rotated);
      resetView(rotated);
    } catch {
      setError("Could not rotate that image.");
    }
  }

  function apply() {
    if (!img) return;
    const outH = Math.round(EXPORT_WIDTH / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sw = CONTAINER_WIDTH / scale;
    const sh = containerH / scale;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) onApply(blob);
        else setError("Could not export that crop. Try again.");
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-4 sm:p-5 max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" onClick={onCancel} className="text-base-500 hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-base-500 mb-3">Drag to reposition, use the slider to zoom, and rotate if needed.</p>

        <div
          className="relative mx-auto overflow-hidden rounded-lg border border-base-700 bg-base-900 touch-none select-none"
          style={{ width: CONTAINER_WIDTH, height: containerH }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              alt="Crop preview"
              draggable={false}
              style={{
                position: "absolute",
                left: offset.x,
                top: offset.y,
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                maxWidth: "none",
                cursor: "grab",
              }}
            />
          )}
        </div>

        {error && <p className="text-danger text-xs mt-2">{error}</p>}

        <div className="flex items-center gap-2 mt-4">
          <ZoomOut size={16} className="text-base-500 shrink-0" />
          <input
            type="range"
            min={minScale}
            max={minScale * 4}
            step={(minScale * 4 - minScale) / 100 || 0.01}
            value={scale}
            onChange={(e) => changeZoom(Number(e.target.value))}
            className="w-full"
          />
          <ZoomIn size={16} className="text-base-500 shrink-0" />
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={rotate}
            className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-2 hover:border-accent-500 flex items-center gap-1.5"
          >
            <RotateCw size={13} /> Rotate
          </button>
          <button
            type="button"
            onClick={() => img && resetView(img)}
            className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-2 hover:border-accent-500 flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="button" onClick={apply} disabled={!img} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
            <Check size={15} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
