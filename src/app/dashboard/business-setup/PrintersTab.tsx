"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, RotateCw, KeyRound, Cpu, Activity, FlaskConical, AlertTriangle } from "lucide-react";

type Agent = { id: number; status: string; agent_version: string | null; last_ping_at: string | null } | null;
type Printer = { id: number; name: string; is_default: number; paper_tray: string; status: string };

const PAPER_TRAY_OPTIONS = ["auto", "tray-1", "tray-2", "manual-feed"];

function detectOs(): string {
  if (typeof navigator === "undefined") return "your machine";
  const ua = navigator.userAgent;
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  return "your machine";
}

export default function PrintersTab() {
  const [agent, setAgent] = useState<Agent>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<{ shopId: number; secret: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [os, setOs] = useState("your machine");

  async function load() {
    const res = await fetch("/api/business/printers");
    if (res.ok) {
      const data = await res.json();
      setAgent(data.agent);
      setPrinters(data.printers);
    }
    setLoading(false);
  }

  useEffect(() => {
    setOs(detectOs());
    load();
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

  const steps = [
    { done: !!credentials || !!agent, label: "Generate agent credentials", desc: "Create a Shop ID + Secret Key below" },
    { done: !!agent, label: "Run the local agent", desc: `npm start inside the agent/ folder on the shop PC (${os})` },
    { done: isOnline, label: "Agent connects & reports printers", desc: isOnline ? "Connected" : "Awaiting first heartbeat" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl bg-accent-500 text-white flex items-center justify-center shrink-0">
            <Cpu size={18} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">PrintMyDoc Agent</h3>
              <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30">Open source</span>
            </div>
            <p className="text-base-500 text-sm">The lightweight local service that links your printers to this dashboard</p>
          </div>
          <span className={`badge shrink-0 ${isOnline ? "bg-success/10 text-success border border-success/30" : "bg-base-700 text-base-500"}`}>
            {isOnline ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="bg-base-900 rounded-xl p-4 mb-4">
          <p className="text-xs text-base-500 uppercase tracking-wide font-semibold mb-2">Setup · detected {os}</p>
          <p className="text-sm text-base-500">
            There&apos;s no separate installer to download — the agent is a small open-source Node.js script you run
            directly on the print server. {os === "Windows" && "Windows also needs SumatraPDF installed for silent printing — see agent/README.md."}
          </p>
        </div>

        <div className="bg-base-900 rounded-xl p-4 space-y-3 mb-4">
          <p className="text-xs text-base-500 uppercase tracking-wide font-semibold">Connection steps</p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              {s.done ? (
                <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
              ) : (
                <Circle size={18} className="text-base-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-base-500">{s.desc}</p>
              </div>
            </div>
          ))}
          <button
            onClick={load}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            <RotateCw size={14} /> Re-check agent connection
          </button>
        </div>

        {agent && (
          <p className="text-base-500 text-sm">
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
            <p className="text-base-500 text-sm">Make sure the PrintMyDoc agent is running.</p>
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

      <div className="card p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <KeyRound size={16} /> Agent Credentials
        </h3>
        <p className="text-base-500 text-sm mb-4">
          Generate a Shop ID + Secret Key, then paste them into the agent&apos;s <code>.env</code> file.
        </p>
        <button onClick={generateCredentials} disabled={generating} className="btn-primary">
          {generating ? "Generating..." : agent ? "Regenerate Credentials" : "Generate Credentials"}
        </button>

        {credentials && (
          <div className="mt-4 bg-base-900 rounded-lg p-4 text-sm font-mono space-y-1 border border-base-700">
            <p>SHOP_ID={credentials.shopId}</p>
            <p>AGENT_SECRET={credentials.secret}</p>
            <p className="text-warning text-xs font-sans mt-2">This secret is shown once. Copy it into agent/.env now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
