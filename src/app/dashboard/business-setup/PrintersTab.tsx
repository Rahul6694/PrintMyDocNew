"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  RotateCw,
  KeyRound,
  Cpu,
  Activity,
  FlaskConical,
  AlertTriangle,
  Monitor,
  Download,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

type Agent = { id: number; status: string; agent_version: string | null; last_ping_at: string | null } | null;
type Printer = { id: number; name: string; is_default: number; paper_tray: string; status: string };
type Build = { platform: string; arch: string; label: string; filename: string; url: string; sha256: string; size: number };
type Manifest = { version: string; releasedAt: string; builds: Build[] };

const PAPER_TRAY_OPTIONS = ["auto", "tray-1", "tray-2", "manual-feed"];
const PLATFORM_LABELS: Record<string, string> = { windows: "Windows", macos: "macOS", linux: "Linux" };

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Best-effort client-side OS/arch detection so we can pre-select the right download.
// Browsers deliberately obscure exact OS version and (on non-Chromium/UA-CH browsers)
// CPU architecture, so this is a starting guess — the "download for another platform"
// list below lets people override it, same as the underlying UA-CH spec recommends.
async function detectPlatform(): Promise<{ platform: string; arch: string | null }> {
  if (typeof navigator === "undefined") return { platform: "unknown", arch: null };
  const ua = navigator.userAgent;

  let platform = "unknown";
  if (/Win/i.test(ua)) platform = "windows";
  else if (/Mac/i.test(ua)) platform = "macos";
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) platform = "linux";

  const uaData = (navigator as unknown as { userAgentData?: { getHighEntropyValues: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }> } }).userAgentData;
  if (uaData) {
    try {
      const hints = await uaData.getHighEntropyValues(["architecture", "bitness"]);
      if (hints.architecture === "arm") return { platform, arch: "arm64" };
      if (hints.architecture === "x86") return { platform, arch: "x64" };
    } catch {
      /* Chromium but hints denied — fall through to UA sniffing */
    }
  }

  if (/arm64|aarch64/i.test(ua)) return { platform, arch: "arm64" };
  if (/Win64|WOW64|x64|x86_64/i.test(ua)) return { platform, arch: "x64" };
  if (platform === "macos") return { platform, arch: "x64" }; // Apple Silicon Macs misreport "Intel" in the UA string
  if (platform === "linux") return { platform, arch: "x64" };
  return { platform, arch: null };
}

export default function PrintersTab() {
  const [agent, setAgent] = useState<Agent>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [credentials, setCredentials] = useState<{ shopId: number; secret: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [detected, setDetected] = useState<{ platform: string; arch: string | null }>({ platform: "unknown", arch: null });
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [origin, setOrigin] = useState("");

  async function load() {
    const res = await fetch("/api/business/printers");
    if (res.ok) {
      const data = await res.json();
      setAgent(data.agent);
      setPrinters(data.printers);
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    detectPlatform().then(setDetected);
    load();
    fetch("/downloads/agent/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setManifest)
      .catch(() => setManifest(null));
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function generateCredentials() {
    setGenerating(true);
    const res = await fetch("/api/business/printers/credentials", { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) setCredentials(data);
  }

  async function setDefaultPrinter(printerId: number) {
    setSettingDefault(true);
    await fetch("/api/business/printers/default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printerId }),
    });
    await load();
    setSettingDefault(false);
  }

  async function setPaperTray(printerId: number, paperTray: string) {
    await fetch("/api/business/printers/paper-tray", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printerId, paperTray }),
    });
    load();
  }

  async function testAllPrinters() {
    setTesting(true);
    setTestMessage("");
    const res = await fetch("/api/business/printers/test", { method: "POST", body: JSON.stringify({}) });
    const data = await res.json();
    setTesting(false);
    setTestMessage(
      res.ok
        ? `Queued ${data.queued} test page(s) — check Live Print for status within a few seconds.`
        : data.error || "Could not queue test print"
    );
  }

  const isOnline = agent?.status === "online";
  const defaultPrinter = printers.find((p) => p.is_default);
  const osLabel = PLATFORM_LABELS[detected.platform] || "your machine";

  const recommendedBuild = useMemo(() => {
    if (!manifest) return null;
    return (
      manifest.builds.find((b) => b.platform === detected.platform && b.arch === detected.arch) ||
      manifest.builds.find((b) => b.platform === detected.platform) ||
      null
    );
  }, [manifest, detected]);

  const otherBuilds = useMemo(
    () => (manifest ? manifest.builds.filter((b) => b !== recommendedBuild) : []),
    [manifest, recommendedBuild]
  );

  const steps = [
    {
      done: downloaded || !!agent,
      label: "Download & install the PrintMyDoc Agent",
      desc: recommendedBuild ? `${recommendedBuild.label} · automatically matched` : `Detected ${osLabel}`,
    },
    {
      done: !!credentials || !!agent,
      label: "Paste your Shop ID & Secret Key into first-run setup",
      desc: "Generate credentials below",
    },
    {
      done: isOnline,
      label: "Agent connects to the PrintMyDoc mesh",
      desc: isOnline ? "Connected" : "Awaiting first heartbeat",
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-5">
          <span className="w-11 h-11 rounded-xl bg-accent-500 text-white flex items-center justify-center shrink-0">
            <Cpu size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">PrintMyDoc Agent</h3>
              <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30">Compatible build</span>
            </div>
            <p className="text-base-500 text-sm">The lightweight desktop agent that links your printers to the platform.</p>
          </div>
          <span className={`badge shrink-0 ${isOnline ? "bg-success/10 text-success border border-success/30" : "bg-base-700 text-base-500"}`}>
            {isOnline ? "Connected" : "Not connected"}
          </span>
        </div>

        <p className="text-xs text-base-500 uppercase tracking-wide font-semibold mb-2">
          Download · detected {osLabel}
          {detected.arch ? ` · ${detected.arch}` : ""}
        </p>

        {manifest && recommendedBuild ? (
          <>
            <a
              href={recommendedBuild.url}
              download
              onClick={() => setDownloaded(true)}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 bg-accent-500 hover:bg-accent-600 text-white transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Monitor size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-sm">Download PrintMyDoc Agent</span>
                <span className="block text-xs text-white/80">
                  v{manifest.version} · {recommendedBuild.label} · {formatSize(recommendedBuild.size)}
                </span>
              </span>
              <Download size={20} className="shrink-0" />
            </a>

            <p className="text-xs text-base-500 font-mono mt-2 break-all">SHA-256: {recommendedBuild.sha256}</p>

            {otherBuilds.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowOtherPlatforms((v) => !v)}
                  className="w-full flex items-center justify-between text-sm font-medium border border-base-700 rounded-xl px-4 py-3 hover:border-accent-500"
                >
                  Download for another platform
                  <ChevronDown size={16} className={`transition-transform ${showOtherPlatforms ? "rotate-180" : ""}`} />
                </button>
                {showOtherPlatforms && (
                  <div className="mt-2 space-y-2">
                    {otherBuilds.map((b) => (
                      <div key={b.filename} className="border border-base-700 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{b.label}</p>
                          <p className="text-xs text-base-500 font-mono truncate">{formatSize(b.size)} · {b.sha256.slice(0, 16)}…</p>
                        </div>
                        <a
                          href={b.url}
                          download
                          onClick={() => setDownloaded(true)}
                          className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-1.5 hover:border-accent-500 flex items-center gap-1.5 shrink-0"
                        >
                          <Download size={13} /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-base-900 rounded-xl p-4 mt-4 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-base-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Supported production systems</p>
                <p className="text-xs text-base-500 mt-1">
                  The recommended download matches your browser-reported OS and CPU architecture. If the browser hides
                  architecture, pick x64 (64-bit Intel/AMD) or arm64 manually from the list above.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-base-900 rounded-xl p-4 text-sm text-base-500">
            {manifest === null ? "No agent build has been published yet — run `npm run build` inside agent/." : "Loading available builds..."}
          </div>
        )}

        <div className="bg-base-900 rounded-xl p-4 space-y-3 mt-4">
          <p className="text-xs text-base-500 uppercase tracking-wide font-semibold">Connection steps</p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              {s.done ? (
                <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
              ) : (
                <Circle size={18} className="text-base-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {i + 1}. {s.label}
                </p>
                <p className="text-xs text-base-500">{s.desc}</p>
              </div>
            </div>
          ))}
          <button onClick={load} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
            <RotateCw size={14} /> Re-check agent connection
          </button>
        </div>

        {agent && (
          <p className="text-base-500 text-sm mt-4">
            Version {agent.agent_version || "unknown"} · Last seen{" "}
            {agent.last_ping_at ? new Date(agent.last_ping_at).toLocaleString() : "never"}
          </p>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <Activity size={16} />
          </span>
          <div>
            <h3 className="font-semibold">Printer Telemetry</h3>
            <p className="text-base-500 text-sm">{printers.filter((p) => p.status === "online").length} of {printers.length} devices online</p>
          </div>
        </div>

        {printers.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-semibold text-sm mb-1">No printers detected</p>
            <p className="text-base-500 text-sm">Make sure the PrintMyDoc Agent is running.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-4 mb-4">
            {printers.map((p) => (
              <div key={p.id} className="border border-base-700 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{p.name}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${p.status === "online" ? "bg-success/10 text-success border border-success/30" : "bg-base-700 text-base-500"}`}
                    >
                      {p.status}
                    </span>
                    {!p.is_default && (
                      <button
                        onClick={() => setDefaultPrinter(p.id)}
                        disabled={settingDefault}
                        className="text-xs font-semibold border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500"
                      >
                        Set default
                      </button>
                    )}
                    {!!p.is_default && <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30">Default</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-base-500">
                  <span>Paper tray:</span>
                  <select
                    value={p.paper_tray}
                    onChange={(e) => setPaperTray(p.id, e.target.value)}
                    className="input-field w-32 py-1 text-xs"
                  >
                    {PAPER_TRAY_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {printers.length > 0 && (
          <p className="text-xs text-base-500 mb-4">
            Default printer: <span className="font-semibold text-ink">{defaultPrinter?.name || "None set"}</span> — orders sent to
            &quot;Printing&quot; are queued to this printer.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={testAllPrinters}
            disabled={testing || printers.length === 0}
            className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-2 hover:border-accent-500 flex items-center gap-1.5 disabled:opacity-50"
          >
            <FlaskConical size={13} /> {testing ? "Queuing..." : "Test All Printers"}
          </button>
          <button
            onClick={load}
            className="text-xs font-semibold border border-base-700 rounded-lg px-3 py-2 hover:border-accent-500 flex items-center gap-1.5"
          >
            <RotateCw size={13} /> Refresh Printer List
          </button>
        </div>
        {testMessage && (
          <p className="text-xs text-accent-400 mt-2 flex items-start gap-1.5">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {testMessage}
          </p>
        )}
      </div>

      <div id="agent-credentials" className="card p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <KeyRound size={16} /> Agent Credentials
        </h3>
        <p className="text-base-500 text-sm mb-4">
          Generate a Shop ID + Secret Key, then paste them — along with the Server URL below — into the PrintMyDoc
          Agent&apos;s first-run setup prompt.
        </p>

        <div className="bg-base-900 rounded-lg p-4 text-sm font-mono border border-base-700 mb-4">
          <p className="text-xs text-base-500 font-sans mb-1">Server URL (paste exactly, including http://)</p>
          <p className="break-all">{origin || "…"}</p>
        </div>

        <button onClick={generateCredentials} disabled={generating} className="btn-primary">
          {generating ? "Generating..." : agent ? "Regenerate Credentials" : "Generate Credentials"}
        </button>

        {credentials && (
          <div className="mt-4 bg-base-900 rounded-lg p-4 text-sm font-mono space-y-1 border border-base-700">
            <p>Server URL: {origin}</p>
            <p>Shop ID: {credentials.shopId}</p>
            <p>Secret Key: {credentials.secret}</p>
            <p className="text-warning text-xs font-sans mt-2">
              This secret is shown once. If the agent was already set up with the wrong Server URL (e.g. it&apos;s
              stuck showing &quot;fetch failed&quot;), delete its saved config and restart it so it asks again — see
              the note below.
            </p>
          </div>
        )}

        <p className="text-xs text-base-500 mt-4">
          Agent stuck printing <span className="font-mono">[jobs] error: fetch failed</span> in a loop? That means
          it&apos;s pointed at the wrong Server URL (often the default <span className="font-mono">localhost:3000</span>).
          Delete its saved config file — Windows: <span className="font-mono">%USERPROFILE%\.printmydoc\agent-config.json</span>,
          macOS/Linux: <span className="font-mono">~/.printmydoc/agent-config.json</span> — then relaunch the agent and
          re-enter the Server URL shown above.
        </p>
      </div>
    </div>
  );
}
