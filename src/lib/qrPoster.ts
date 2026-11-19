import QRCode from "qrcode";

// Print-ready A-series poster (1131×1600 ≈ A4 ratio) for the shop counter:
// brand title, SCAN • UPLOAD • PAY • PRINT ribbon, the shop's QR with the three
// steps around it, an "AUTOMATIC PRINT" band, the payment line and the shop
// name. Pure SVG with system fonts so it renders the same as an <img>, when
// rasterised to PNG/PDF in the browser, and when printed.

export type PosterOptions = {
  url: string;
  shopName: string;
  acceptOnline: boolean;
  acceptCash: boolean;
};

const NAVY = "#0b1f5c";
const BLUE = "#1f4fd1";
const YELLOW = "#ffd22e";
const FONT_HEAVY = "'Arial Black','Helvetica Neue',Arial,'Nirmala UI','Kohinoor Devanagari','Noto Sans Devanagari',sans-serif";
const FONT = "'Helvetica Neue',Arial,'Nirmala UI','Kohinoor Devanagari','Noto Sans Devanagari',sans-serif";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function qrPath(url: string, x: number, y: number, size: number) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cell = size / n;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        d += `M${(x + c * cell).toFixed(2)} ${(y + r * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
      }
    }
  }
  return `<path d="${d}" fill="#000" shape-rendering="crispEdges"/>`;
}

// Simple glyphs drawn from primitives so the poster has no external assets.
const printerIcon = (cx: number, cy: number, s: number, fg: string, bg: string) => `
  <g transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})">
    <rect x="28" y="8" width="44" height="26" rx="4" fill="${fg}"/>
    <rect x="8" y="30" width="84" height="40" rx="10" fill="${fg}"/>
    <rect x="26" y="56" width="48" height="36" rx="4" fill="${bg}" stroke="${fg}" stroke-width="6"/>
    <rect x="36" y="68" width="28" height="5" rx="2" fill="${fg}"/>
    <rect x="36" y="78" width="20" height="5" rx="2" fill="${fg}"/>
    <circle cx="78" cy="42" r="4" fill="${bg}"/>
  </g>`;

const phoneIcon = (cx: number, cy: number) => `
  <g transform="translate(${cx - 34} ${cy - 46})">
    <rect x="10" y="0" width="48" height="84" rx="9" fill="#fff"/>
    <rect x="16" y="10" width="36" height="58" rx="3" fill="${BLUE}"/>
    <rect x="21" y="16" width="11" height="11" fill="#fff"/><rect x="36" y="16" width="11" height="11" fill="#fff"/>
    <rect x="21" y="31" width="11" height="11" fill="#fff"/><rect x="38" y="33" width="7" height="7" fill="#fff"/>
    <rect x="22" y="48" width="24" height="4" rx="2" fill="#fff"/>
    <path d="M0 62 q4 -18 18 -14 l10 4 v28 q-14 8 -28 -6z" fill="#fff"/>
  </g>`;

const cloudIcon = (cx: number, cy: number) => `
  <g transform="translate(${cx - 40} ${cy - 30})">
    <path d="M20 58 a18 18 0 0 1 -2 -36 a24 24 0 0 1 46 -4 a18 18 0 0 1 0 40z" fill="#fff"/>
    <path d="M40 30 l-14 14 h9 v12 h10 v-12 h9z" fill="${BLUE}"/>
  </g>`;

const pinIcon = (cx: number, cy: number) => `
  <g transform="translate(${cx - 24} ${cy - 34})">
    <path d="M24 0 a24 24 0 0 1 24 24 c0 18 -24 44 -24 44 s-24 -26 -24 -44 a24 24 0 0 1 24 -24z" fill="${YELLOW}"/>
    <circle cx="24" cy="24" r="9" fill="${NAVY}"/>
  </g>`;

const burst = (x: number, y: number, flip: boolean) => {
  const k = flip ? -1 : 1;
  return `<g stroke="${BLUE}" stroke-width="9" stroke-linecap="round" fill="none">
    <path d="M${x} ${y} l${22 * k} -22"/><path d="M${x - 10 * k} ${y + 34} l${32 * k} -4"/><path d="M${x - 2 * k} ${y + 70} l${26 * k} 12"/>
  </g>`;
};

function paymentLine(online: boolean, cash: boolean) {
  if (online && cash) return "Pay Online Or Pay Cash Option Available";
  if (online) return "Pay Online — UPI · Card · Netbanking";
  return "Pay Cash At The Counter";
}

export async function buildPosterSvg(o: PosterOptions): Promise<string> {
  const W = 1131;
  const H = 1600;
  const name = o.shopName.trim() || "Your Shop";
  // Shrink long shop names so they always fit the footer band.
  const nameSize = Math.max(40, Math.min(78, Math.floor(1700 / Math.max(name.length, 10))));
  // Arial Black averages ~0.68em per glyph; clamp the name to the band width.
  const estWidth = name.length * nameSize * 0.68;
  const nameWidth = Math.min(estWidth, 900);
  const fitName = estWidth > 900 ? ` textLength="900" lengthAdjust="spacingAndGlyphs"` : "";
  const prettyUrl = o.url.replace(/^https?:\/\//, "");
  const urlSize = prettyUrl.length > 42 ? 20 : 24;

  const qrBox = { x: 345, y: 470, w: 440, h: 440 };
  const qrInner = 356;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <rect x="16" y="16" width="${W - 32}" height="1430" rx="34" fill="#fff"/>

  ${burst(330, 48, false)}
  ${burst(800, 48, true)}
  ${printerIcon(W / 2, 92, 1.1, NAVY, "#fff")}

  <!-- Title -->
  <text x="${W / 2}" y="282" text-anchor="middle" textLength="960" lengthAdjust="spacingAndGlyphs" font-family="${FONT_HEAVY}" font-weight="900" font-size="150">
    <tspan fill="${NAVY}">Print</tspan><tspan fill="${BLUE}">MyDoc</tspan>
  </text>
  <text x="${W / 2}" y="350" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="30" fill="${NAVY}" opacity=".75">QR scan karo · file bhejo · print lo</text>

  <!-- Ribbon -->
  <path d="M70 366 H1060 L1080 446 H50 Z" fill="${BLUE}"/>
  <path d="M70 366 H1060 L1064 380 H66 Z" fill="${NAVY}" opacity=".35"/>
  <text x="${W / 2}" y="426" text-anchor="middle" textLength="900" lengthAdjust="spacingAndGlyphs" font-family="${FONT_HEAVY}" font-weight="900" font-size="56" fill="#fff">
    SCAN <tspan fill="${YELLOW}">•</tspan> UPLOAD <tspan fill="${YELLOW}">•</tspan> PAY <tspan fill="${YELLOW}">•</tspan> PRINT
  </text>

  <!-- QR frame with pointer -->
  <rect x="${qrBox.x}" y="${qrBox.y}" width="${qrBox.w}" height="${qrBox.h}" rx="30" fill="#fff" stroke="${NAVY}" stroke-width="12"/>
  <path d="M${W / 2 - 34} ${qrBox.y + qrBox.h + 4} L${W / 2} ${qrBox.y + qrBox.h + 42} L${W / 2 + 34} ${qrBox.y + qrBox.h + 4} Z" fill="${NAVY}"/>
  ${qrPath(o.url, qrBox.x + (qrBox.w - qrInner) / 2, qrBox.y + (qrBox.h - qrInner) / 2, qrInner)}

  <!-- Step 1 -->
  <rect x="52" y="580" width="180" height="265" rx="22" fill="#fff" stroke="${BLUE}" stroke-width="4"/>
  <circle cx="142" cy="655" r="58" fill="${BLUE}"/>
  ${phoneIcon(142, 658)}
  <text x="142" y="760" text-anchor="middle" textLength="148" lengthAdjust="spacingAndGlyphs" font-family="${FONT_HEAVY}" font-weight="900" font-size="36" fill="${BLUE}">1. SCAN</text>
  <text x="142" y="795" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="24" fill="#111">QR Code</text>
  <text x="142" y="826" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="24" fill="#111">Scan करें</text>
  <path d="M248 707 h28 v-20 l26 30 l-26 30 v-20 h-28z" fill="${BLUE}"/>

  <!-- Step 3 -->
  <rect x="905" y="572" width="176" height="262" rx="22" fill="#fff" stroke="${BLUE}" stroke-width="4"/>
  <circle cx="993" cy="645" r="58" fill="${BLUE}"/>
  ${printerIcon(993, 645, 0.66, "#fff", BLUE)}
  <text x="993" y="748" text-anchor="middle" textLength="148" lengthAdjust="spacingAndGlyphs" font-family="${FONT_HEAVY}" font-weight="900" font-size="36" fill="${BLUE}">3. PRINT</text>
  <text x="993" y="784" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="24" fill="#111">Automatic</text>
  <text x="993" y="815" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="24" fill="#111">Print होगा</text>
  <path d="M838 700 h28 v-20 l26 30 l-26 30 v-20 h-28z" fill="${BLUE}"/>

  <!-- Manual URL under QR (for phones that can't scan) -->
  <text x="${W / 2}" y="${qrBox.y + qrBox.h + 78}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${urlSize}" fill="${NAVY}" opacity=".8">${esc(prettyUrl)}</text>

  <!-- Step 2 -->
  <rect x="297" y="1018" width="528" height="172" rx="24" fill="#fff" stroke="${BLUE}" stroke-width="4"/>
  <circle cx="378" cy="1104" r="56" fill="${BLUE}"/>
  ${cloudIcon(378, 1104)}
  <text x="452" y="1080" textLength="350" lengthAdjust="spacingAndGlyphs" font-family="${FONT_HEAVY}" font-weight="900" font-size="44" fill="${BLUE}">2. UPLOAD &amp; PAY</text>
  <text x="452" y="1124" font-family="${FONT}" font-weight="600" font-size="28" fill="#111">अपनी File Upload करें</text>
  <text x="452" y="1162" font-family="${FONT}" font-weight="600" font-size="28" fill="#111">और Payment करें</text>

  <!-- Automatic print band -->
  <path d="M128 1240 q60 -12 120 -4 q120 -10 260 0 q160 -8 330 2 q120 -6 160 4 l-6 92 q-80 6 -170 -2 q-150 8 -320 -2 q-150 8 -290 0 q-50 4 -90 -4 z" fill="${YELLOW}"/>
  ${printerIcon(250, 1286, 0.88, NAVY, YELLOW)}
  <text x="655" y="1316" text-anchor="middle" textLength="660" lengthAdjust="spacingAndGlyphs" font-family="${FONT_HEAVY}" font-weight="900" font-size="78" fill="${NAVY}">AUTOMATIC PRINT</text>
  <g stroke="${BLUE}" stroke-width="7" stroke-linecap="round"><path d="M92 1262 l26 10"/><path d="M88 1292 h30"/><path d="M92 1322 l26 -10"/>
  <path d="M1039 1262 l-26 10"/><path d="M1043 1292 h-30"/><path d="M1039 1322 l-26 -10"/></g>

  <text x="${W / 2}" y="1404" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="40" fill="#111">${esc(paymentLine(o.acceptOnline, o.acceptCash))}</text>

  <!-- Footer -->
  <text x="${W / 2}" y="1494" text-anchor="middle" font-family="${FONT_HEAVY}" font-weight="900" font-size="30" fill="#fff" letter-spacing="2">AVAILABLE ONLY AT</text>
  ${pinIcon(W / 2 + 30 - nameWidth / 2 - 44, 1548)}
  <text x="${W / 2 + 30}" y="${1548 + nameSize * 0.36}" text-anchor="middle"${fitName} font-family="${FONT_HEAVY}" font-weight="900" font-size="${nameSize}" fill="${YELLOW}">${esc(name)}</text>
</svg>`;
}
