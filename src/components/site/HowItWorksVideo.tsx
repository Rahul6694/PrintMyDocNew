"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Check, FileText, Image as ImageIcon, Printer, Smartphone } from "lucide-react";

/* An animated, video-style walkthrough of the PrintMyDoc flow. Each scene is
   pure CSS/React, so it stays sharp at any size, follows the site theme and
   needs no video file. Scenes re-mount on change so their animations replay. */

const SCENE_MS = 4200;

const SCENES = [
  { chip: "Scan", title: "Customer scans your Shop QR", sub: "Any phone camera — no app, no login." },
  { chip: "Upload", title: "Uploads the document", sub: "PDF, Word or photos, straight from the phone." },
  { chip: "Settings", title: "Chooses print settings", sub: "Copies, B&W or colour, sides, paper — price shows instantly." },
  { chip: "Pay", title: "Pays online or cash", sub: "UPI / card via Razorpay, or pay at the counter." },
  { chip: "Dashboard", title: "Order lands on your dashboard", sub: "Priced by your rates, payment already recorded." },
  { chip: "Print", title: "Prints on its own", sub: "The PrintMyDoc Agent sends it to your default printer." },
] as const;

const TOTAL = SCENES.length * SCENE_MS;

/* ───────────── small visual helpers ───────────── */

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[118px] sm:w-[150px] aspect-[9/17] rounded-[22px] sm:rounded-[26px] bg-[#0b0b0d] border-[3px] border-white/15 shadow-2xl p-1.5">
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1.5 rounded-full bg-white/15" />
      <div className="w-full h-full rounded-[17px] sm:rounded-[20px] bg-[#fffdf8] text-[#111114] overflow-hidden pt-4 px-2 flex flex-col">{children}</div>
    </div>
  );
}

// Deterministic QR-looking grid (decorative only).
const QR = Array.from({ length: 121 }, (_, i) => {
  const r = Math.floor(i / 11);
  const c = i % 11;
  const finder = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
  return finder || ((r * 7 + c * 13 + r * c) % 5 < 2);
});

function QrGlyph({ size = 84 }: { size?: number }) {
  return (
    <div className="grid grid-cols-11 gap-[1.5px] bg-white p-1.5 rounded-lg" style={{ width: size, height: size }}>
      {QR.map((on, i) => (
        <span key={i} className={on ? "bg-[#111114] rounded-[1px]" : ""} />
      ))}
    </div>
  );
}

const d = (ms: number) => ({ animationDelay: `${ms}ms` });

/* ───────────── scenes ───────────── */

function SceneScan() {
  return (
    <div className="flex items-center gap-5 sm:gap-10">
      <div className="v-up hidden sm:flex flex-col items-center gap-2 rounded-2xl bg-[#ffd22e] p-3 text-[#111114] -rotate-3 shadow-xl">
        <QrGlyph size={96} />
        <span className="font-display font-extrabold text-[11px] tracking-wide">SCAN • UPLOAD • PRINT</span>
      </div>
      <div className="v-up" style={d(200)}>
        <Phone>
          <p className="text-[9px] font-bold text-center text-[#6b6870] mb-2">Camera</p>
          <div className="relative mx-auto">
            <QrGlyph size={86} />
            <span className="v-scan absolute left-0 right-0 h-0.5 bg-[#ff2e63] shadow-[0_0_8px_#ff2e63]" />
          </div>
          <div className="v-pop mt-3 mx-auto rounded-full bg-[#ff2e63] text-white text-[9px] font-bold px-2.5 py-1" style={d(1800)}>
            Open shop page ↗
          </div>
        </Phone>
      </div>
    </div>
  );
}

function SceneUpload() {
  const files = [
    { icon: FileText, name: "Resume.pdf", meta: "2 pages" },
    { icon: ImageIcon, name: "Photo.jpg", meta: "1 page" },
  ];
  return (
    <Phone>
      <p className="text-[10px] font-extrabold mb-2">Sharma Print Point</p>
      <div className="v-up rounded-xl border-2 border-dashed border-[#ff2e63]/50 text-[9px] text-center py-2 mb-2 text-[#6b6870]">Tap to upload</div>
      {files.map((f, i) => (
        <div key={f.name} className="v-up rounded-lg bg-white border border-[#ece3d2] p-1.5 mb-1.5" style={d(600 + i * 700)}>
          <div className="flex items-center gap-1.5">
            <f.icon size={12} className="text-[#ff2e63] shrink-0" />
            <span className="text-[9px] font-bold truncate">{f.name}</span>
            <span className="text-[8px] text-[#6b6870] ml-auto">{f.meta}</span>
          </div>
          <div className="h-1 rounded-full bg-[#faf4e6] mt-1 overflow-hidden">
            <span className="v-fill block h-full bg-[#22b573]" style={d(900 + i * 700)} />
          </div>
        </div>
      ))}
    </Phone>
  );
}

function SceneSettings() {
  const chips = ["2 copies", "B&W", "Double side", "A4"];
  return (
    <Phone>
      <p className="text-[10px] font-extrabold mb-2">Print settings</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {chips.map((c, i) => (
          <span key={c} className="v-pop rounded-full bg-[#111114] text-[#ffd22e] text-[8.5px] font-bold px-2 py-0.5" style={d(300 + i * 350)}>
            {c}
          </span>
        ))}
      </div>
      <div className="v-up rounded-xl bg-[#fff9ec] border border-[#ece3d2] p-2 text-[9px]" style={d(1800)}>
        <div className="flex justify-between text-[#6b6870]">
          <span>3 pages × 2</span>
          <span>₹3.5 / page</span>
        </div>
        <div className="flex justify-between font-extrabold text-[13px] mt-1">
          <span>Total</span>
          <span className="v-pop text-[#ff2e63]" style={d(2300)}>
            ₹21
          </span>
        </div>
      </div>
    </Phone>
  );
}

function ScenePay() {
  return (
    <Phone>
      <p className="text-[10px] font-extrabold mb-2">Pay ₹21</p>
      {["UPI", "Card", "Cash at counter"].map((m, i) => (
        <div
          key={m}
          className={`v-up rounded-lg border p-1.5 mb-1.5 text-[9px] font-bold flex items-center justify-between ${
            i === 0 ? "border-[#ff2e63] bg-[#ff2e63]/5" : "border-[#ece3d2]"
          }`}
          style={d(200 + i * 250)}
        >
          {m}
          {i === 0 && <span className="w-2.5 h-2.5 rounded-full bg-[#ff2e63]" />}
        </div>
      ))}
      <div className="flex-1 flex flex-col items-center justify-center">
        <span className="v-pop w-11 h-11 rounded-full bg-[#22b573] text-white flex items-center justify-center shadow-lg" style={d(1700)}>
          <Check size={22} strokeWidth={3} />
        </span>
        <span className="v-up text-[9px] font-extrabold text-[#15803d] mt-1.5" style={d(2000)}>
          Payment successful
        </span>
      </div>
    </Phone>
  );
}

function SceneDashboard() {
  const rows = [
    { id: "#1042", who: "Resume.pdf + 1", amt: "₹21", tag: "Paid", fresh: true },
    { id: "#1041", who: "Notes.pdf", amt: "₹40", tag: "Printing", fresh: false },
    { id: "#1040", who: "Form.jpg", amt: "₹10", tag: "Done", fresh: false },
  ];
  return (
    <div className="v-up w-[min(88%,420px)]">
      <div className="rounded-t-xl bg-[#1c1b20] border border-white/10 border-b-0 p-2.5 sm:p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-2 h-2 rounded-full bg-[#f0645f]" />
          <span className="w-2 h-2 rounded-full bg-[#f5b544]" />
          <span className="w-2 h-2 rounded-full bg-[#22b573]" />
          <span className="ml-2 text-[10px] text-white/50 font-semibold">PrintMyDoc · Orders</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] sm:text-[11px] ${
                r.fresh ? "v-in-left bg-[#ff2e63]/15 border border-[#ff2e63]/50" : "v-up bg-white/5"
              }`}
              style={d(r.fresh ? 700 : 150 + i * 120)}
            >
              <span className="font-bold text-white/80">{r.id}</span>
              <span className="text-white/55 truncate">{r.who}</span>
              <span className="ml-auto font-bold">{r.amt}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  r.tag === "Paid" ? "bg-[#22b573] text-white" : r.tag === "Printing" ? "bg-[#ffd22e] text-[#111114]" : "bg-white/10 text-white/60"
                }`}
              >
                {r.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-2.5 rounded-b-xl bg-[#2e2c33] mx-[-6%]" />
      <div className="v-pop mt-3 mx-auto w-fit rounded-full bg-[#ffd22e] text-[#111114] text-[10px] font-extrabold px-3 py-1" style={d(1600)}>
        🔔 New paid order
      </div>
    </div>
  );
}

function ScenePrint() {
  return (
    <div className="flex items-end gap-6 sm:gap-10">
      <div className="v-up hidden sm:flex flex-col items-center gap-1 text-white/70">
        <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <Smartphone size={22} />
        </span>
        <span className="text-[10px] font-semibold">Customer</span>
      </div>
      <div className="hidden sm:flex items-center self-center gap-1 mb-6">
        {[0, 1, 2].map((i) => (
          <span key={i} className="v-dot w-1.5 h-1.5 rounded-full bg-[#ffd22e]" style={d(i * 200)} />
        ))}
      </div>
      <div className="relative flex flex-col items-center">
        <div className="relative w-[150px] sm:w-[180px]">
          <div className="relative z-10 h-14 rounded-t-2xl bg-[#ece3d2] border-b-4 border-[#dccfb6] flex items-center justify-end px-3">
            <span className="w-2 h-2 rounded-full bg-[#22b573] shadow-[0_0_6px_#22b573]" />
          </div>
          <div className="relative z-10 h-9 bg-[#dccfb6] rounded-b-md flex items-center justify-center">
            <Printer size={16} className="text-[#6b6870]" />
          </div>
          <div className="overflow-hidden mx-5 h-[86px]">
            <div className="v-print h-full rounded-b-md bg-white shadow-lg p-2.5 flex flex-col gap-1.5" style={d(400)}>
              <span className="h-1.5 w-3/4 rounded bg-[#111114]/70" />
              <span className="h-1 w-full rounded bg-[#111114]/25" />
              <span className="h-1 w-5/6 rounded bg-[#111114]/25" />
              <span className="h-1 w-full rounded bg-[#111114]/25" />
              <span className="h-1 w-2/3 rounded bg-[#111114]/25" />
            </div>
          </div>
        </div>
        <span className="v-pop absolute -right-4 top-2 z-20 rounded-full bg-[#22b573] text-white text-[10px] font-extrabold px-2.5 py-1 shadow-lg" style={d(2600)}>
          Done ✓
        </span>
      </div>
    </div>
  );
}

const SCENE_VIEWS = [SceneScan, SceneUpload, SceneSettings, ScenePay, SceneDashboard, ScenePrint];

/* ───────────── player ───────────── */

export default function HowItWorksVideo({ className = "" }: { className?: string }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);

  const scene = Math.min(SCENES.length - 1, Math.floor(t / SCENE_MS));
  const View = SCENE_VIEWS[scene];

  // Tick the clock while playing; loop back to the start at the end.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      setT((prev) => (prev + dt >= TOTAL ? 0 : prev + dt));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Autoplay when scrolled into view (unless reduced motion), pause when out.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!reduce && !userPaused.current) {
            setStarted(true);
            setPlaying(true);
          }
        } else {
          setPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = useCallback(() => {
    setStarted(true);
    setPlaying((p) => {
      userPaused.current = p;
      return !p;
    });
  }, []);

  const jump = (i: number) => {
    setStarted(true);
    setT(i * SCENE_MS);
  };

  const done = (i: number) => (i < scene ? 1 : i > scene ? 0 : (t - i * SCENE_MS) / SCENE_MS);

  return (
    <div ref={rootRef} className={`w-full ${className}`}>
      <div
        className="relative overflow-hidden rounded-3xl bg-dark text-white aspect-[4/3] sm:aspect-video shadow-2xl border border-white/5 select-none"
        role="region"
        aria-roledescription="video"
        aria-label="How PrintMyDoc works"
      >
        {/* ambient glows */}
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-yellow/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-accent-500/25 blur-3xl" />

        {/* top bar */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
          <span className="font-display font-extrabold text-sm">
            Print<span className="text-accent-500">MyDoc</span>
          </span>
          <span className="rounded-full bg-white/10 text-[11px] font-bold px-2.5 py-1">
            {scene + 1} / {SCENES.length} · {SCENES[scene].chip}
          </span>
        </div>

        {/* stage */}
        <div key={scene} className={`absolute inset-0 flex items-center justify-center pt-8 pb-20 sm:pb-24 ${playing ? "" : "v-paused"}`}>
          <View />
        </div>

        {/* caption */}
        <div key={`c${scene}`} className="absolute left-0 right-0 bottom-11 sm:bottom-12 text-center px-4 z-10">
          <p className="v-up font-display font-extrabold text-base sm:text-xl leading-tight">{SCENES[scene].title}</p>
          <p className="v-up text-[12px] sm:text-sm text-white/65 mt-0.5" style={d(150)}>
            {SCENES[scene].sub}
          </p>
        </div>

        {/* controls */}
        <div className="absolute left-0 right-0 bottom-0 z-20 flex items-center gap-2.5 px-3 sm:px-4 py-2.5 bg-gradient-to-t from-black/50 to-transparent">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="w-8 h-8 rounded-full bg-white text-[#111114] flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
          >
            {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </button>
          <div className="flex-1 flex gap-1">
            {SCENES.map((s, i) => (
              <button
                key={s.chip}
                type="button"
                onClick={() => jump(i)}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                className="group flex-1 py-2"
              >
                <span className="block h-1 rounded-full bg-white/20 overflow-hidden group-hover:h-1.5 transition-all">
                  <span className="block h-full bg-accent-500" style={{ width: `${done(i) * 100}%` }} />
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => jump(0)}
            aria-label="Restart"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* big play overlay before first play */}
        {!started && (
          <button
            type="button"
            onClick={toggle}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[2px]"
            aria-label="Play video"
          >
            <span className="w-16 h-16 rounded-full bg-accent-500 flex items-center justify-center shadow-[0_14px_34px_-10px_rgba(255,46,99,0.7)]">
              <Play size={26} fill="currentColor" className="ml-1" />
            </span>
            <span className="font-display font-extrabold">Watch how it works · {Math.round(TOTAL / 1000)}s</span>
          </button>
        )}
      </div>

      {/* chapter chips */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
        {SCENES.map((s, i) => (
          <button
            key={s.chip}
            type="button"
            onClick={() => jump(i)}
            className="pill-tab !text-xs !px-3 !py-1"
            data-active={i === scene && started ? "true" : "false"}
          >
            {i + 1}. {s.chip}
          </button>
        ))}
      </div>
    </div>
  );
}
