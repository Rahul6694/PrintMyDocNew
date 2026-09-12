"use client";

import { useEffect, useState } from "react";

type Template = { id: number; template_key: string; subject: string; html_body: string; updated_at: string };

const KNOWN_KEYS = ["order_received", "withdrawal_status", "order_ready", "welcome_merchant"];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeKey, setActiveKey] = useState(KNOWN_KEYS[0]);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/admin/email-templates");
    if (res.ok) setTemplates((await res.json()).templates);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const existing = templates.find((t) => t.template_key === activeKey);
    setSubject(existing?.subject || "");
    setHtmlBody(existing?.html_body || "");
  }, [activeKey, templates]);

  async function save() {
    setMessage("");
    const res = await fetch("/api/admin/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateKey: activeKey, subject, htmlBody }),
    });
    if (res.ok) {
      setMessage("Saved");
      load();
    } else {
      setMessage("Failed to save");
    }
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Email Templates</h1>
      <p className="text-base-500 text-sm mb-6">
        Use <code>{"{{variableName}}"}</code> placeholders — filled in when each email is sent.
      </p>

      <div className="flex gap-2 mb-6">
        {KNOWN_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border ${
              activeKey === key ? "bg-accent-500 border-accent-500 text-white" : "border-base-700 text-base-500"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="card p-6 max-w-2xl space-y-4">
        <div>
          <label className="text-sm text-base-500 block mb-1.5">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-sm text-base-500 block mb-1.5">HTML Body</label>
          <textarea
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            rows={12}
            className="input-field font-mono text-xs"
          />
        </div>
        <button onClick={save} className="btn-primary">
          Save template
        </button>
        {message && <p className="text-accent-400 text-sm">{message}</p>}
      </div>

      <div className="text-xs text-base-500 mt-4 max-w-2xl">
        <p className="font-semibold mb-1">Available variables per template:</p>
        <p><code>order_received</code>: shopName, orderNumber, customerName, amount</p>
        <p><code>withdrawal_status</code>: shopName, status, netAmount</p>
      </div>
    </div>
  );
}
