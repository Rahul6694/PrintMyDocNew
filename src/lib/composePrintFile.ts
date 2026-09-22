// Turns a cropped "front" image (and optional "back" image) into the single
// file the order form actually uploads. The backend only ever stores/prints
// one file per order, so a two-sided document has to be flattened client-side
// into either one composite image (both sides on one sheet) or a 2-page PDF
// (each side its own sheet) before it's submitted.

const PAPER_SIZE_MM: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  Letter: { w: 215.9, h: 279.4 },
  Legal: { w: 215.9, h: 355.6 },
};

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not export image"))), "image/jpeg", 0.92);
  });
}

// Draws `img` centered and contained within a w x h box, with a white letterbox
// margin on whichever axis doesn't fill exactly — never crops or distorts.
function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export async function composeSamePage(front: Blob, back: Blob, aspect: number): Promise<File> {
  const [frontImg, backImg] = await Promise.all([loadImage(front), loadImage(back)]);

  const width = 1400;
  const height = Math.round(width / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const gap = Math.round(height * 0.015);
  const halfH = (height - gap) / 2;
  drawContain(ctx, frontImg, 0, 0, width, halfH);
  drawContain(ctx, backImg, 0, halfH + gap, width, halfH);

  ctx.strokeStyle = "#c9ccd8";
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, halfH + gap / 2);
  ctx.lineTo(width, halfH + gap / 2);
  ctx.stroke();

  const blob = await canvasToBlob(canvas);
  return new File([blob], "front-back.jpg", { type: "image/jpeg" });
}

export async function composeSeparatePages(front: Blob, back: Blob, paperSize: string): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const size = PAPER_SIZE_MM[paperSize] || PAPER_SIZE_MM.A4;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [size.w, size.h] });

  for (const [index, blob] of [front, back].entries()) {
    if (index > 0) doc.addPage([size.w, size.h], "portrait");
    const img = await loadImage(blob);
    const scale = Math.min(size.w / img.naturalWidth, size.h / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const dataUrl = await blobToDataUrl(blob);
    doc.addImage(dataUrl, "JPEG", (size.w - w) / 2, (size.h - h) / 2, w, h);
  }

  const pdfBlob = doc.output("blob");
  return new File([pdfBlob], "front-back.pdf", { type: "application/pdf" });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });
}
