"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Trash2, Plus } from "lucide-react";

type Settings = {
  enabled: number;
  bot_display_name: string | null;
  auto_greeting_message: string;
  document_received_message: string;
};

type QaPair = { id: number; question: string; answer: string };
type ChatMessage = { from: "customer" | "bot"; text: string };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="toggle-switch" data-on={checked}>
      <span className="knob" />
    </button>
  );
}

export default function TrainBotPage() {
  const [tab, setTab] = useState<"rules" | "qa">("rules");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [qaPairs, setQaPairs] = useState<QaPair[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [settingsRes, qaRes] = await Promise.all([fetch("/api/bot/settings"), fetch("/api/bot/qa")]);
    setSettings((await settingsRes.json()).settings);
    setQaPairs((await qaRes.json()).pairs || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function persistSettings(next: Settings) {
    setSettings(next);
    const res = await fetch("/api/bot/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: !!next.enabled,
        botDisplayName: next.bot_display_name,
        autoGreetingMessage: next.auto_greeting_message,
        documentReceivedMessage: next.document_received_message,
      }),
    });
    if (res.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(""), 1500);
    }
  }

  async function addQa(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    await fetch("/api/bot/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
    });
    setNewQuestion("");
    setNewAnswer("");
    load();
  }

  async function removeQa(id: number) {
    await fetch(`/api/bot/qa/${id}`, { method: "DELETE" });
    load();
  }

  async function sendTestMessage() {
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChat((c) => [...c, { from: "customer", text }]);
    setChatInput("");
    setSending(true);
    const res = await fetch("/api/bot/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setSending(false);
    setChat((c) => [...c, { from: "bot", text: data.reply }]);
  }

  if (!settings) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-xs text-base-500 uppercase tracking-wide font-semibold mb-1">WhatsApp Automation</p>
          <h1 className="text-2xl font-bold">Train Bot</h1>
        </div>
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30">
          Database + Q&amp;A only
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-9 h-9 rounded-lg bg-accent-500/10 text-accent-500 flex items-center justify-center">
              <Bot size={17} />
            </span>
            <div>
              <h3 className="font-semibold">Train Bot</h3>
              <p className="text-xs text-base-500">Merchant data and auto-reply configuration</p>
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            <button onClick={() => setTab("rules")} data-active={tab === "rules"} className="pill-tab">
              Store Rules
            </button>
            <button onClick={() => setTab("qa")} data-active={tab === "qa"} className="pill-tab">
              Instant Q&amp;A Matrix
            </button>
          </div>

          {tab === "rules" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 border border-base-700 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Bot Status</p>
                  <p className="text-xs text-base-500">
                    {settings.enabled ? "Bot is live — responding to customer messages" : "Bot is disabled"}
                  </p>
                </div>
                <Toggle checked={!!settings.enabled} onChange={(v) => persistSettings({ ...settings, enabled: v ? 1 : 0 })} />
              </div>

              <div>
                <label className="text-sm text-base-500 block mb-1.5">Bot Display Name</label>
                <p className="text-xs text-base-500 mb-1.5">Shown in internal logs only, not visible to customers.</p>
                <input
                  className="input-field"
                  value={settings.bot_display_name || ""}
                  onChange={(e) => setSettings({ ...settings, bot_display_name: e.target.value })}
                  onBlur={() => persistSettings(settings)}
                />
              </div>

              <div>
                <label className="text-sm text-base-500 block mb-1.5">Auto Greeting Message</label>
                <p className="text-xs text-base-500 mb-1.5">
                  Sent when a customer says hi/hello. Keep {"{shop}"} and {"{link}"} where needed.
                </p>
                <textarea
                  className="input-field"
                  rows={3}
                  maxLength={500}
                  value={settings.auto_greeting_message}
                  onChange={(e) => setSettings({ ...settings, auto_greeting_message: e.target.value })}
                  onBlur={() => persistSettings(settings)}
                />
                <p className="text-xs text-base-500 text-right mt-1">{settings.auto_greeting_message.length}/500</p>
              </div>

              <div>
                <label className="text-sm text-base-500 block mb-1.5">Document Received Message</label>
                <p className="text-xs text-base-500 mb-1.5">
                  Sent after a file arrives. Placeholders: {"{file}"}, {"{shop}"}, {"{link}"}.
                </p>
                <textarea
                  className="input-field"
                  rows={3}
                  maxLength={500}
                  value={settings.document_received_message}
                  onChange={(e) => setSettings({ ...settings, document_received_message: e.target.value })}
                  onBlur={() => persistSettings(settings)}
                />
              </div>

              {message && <p className="text-accent-400 text-sm">{message}</p>}
            </div>
          ) : (
            <div>
              <form onSubmit={addQa} className="flex gap-2 mb-4">
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Keyword customers might send (e.g. 'timing')"
                  className="input-field"
                />
                <input
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Bot's reply"
                  className="input-field"
                />
                <button type="submit" className="btn-primary shrink-0 flex items-center gap-1.5">
                  <Plus size={14} /> Add
                </button>
              </form>

              {qaPairs.length === 0 ? (
                <p className="text-base-500 text-sm text-center py-8">No Q&amp;A pairs yet.</p>
              ) : (
                <div className="space-y-2">
                  {qaPairs.map((qa) => (
                    <div key={qa.id} className="flex items-center justify-between gap-3 border border-base-700 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">&quot;{qa.question}&quot;</p>
                        <p className="text-xs text-base-500">{qa.answer}</p>
                      </div>
                      <button onClick={() => removeQa(qa.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-4 flex flex-col h-[560px]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-sm">Live Test Preview</p>
              <p className="text-xs text-base-500">{qaPairs.length} instant Q&amp;A pairs active</p>
            </div>
            <span className={`badge ${settings.enabled ? "bg-success/10 text-success border border-success/30" : "bg-base-700 text-base-500"}`}>
              {settings.enabled ? "Bot Active" : "Disabled"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-base-900 rounded-lg p-3 space-y-2 mb-3">
            {chat.length === 0 && (
              <p className="text-xs text-base-500 text-center mt-6">Type a message below to test your bot&apos;s replies.</p>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.from === "bot" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] text-xs rounded-lg px-3 py-2 ${
                    m.from === "bot" ? "bg-base-850 border border-base-700" : "bg-accent-500 text-white"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
              placeholder="Type to test your bot..."
              className="input-field text-sm"
            />
            <button onClick={sendTestMessage} disabled={sending} className="btn-primary shrink-0 px-3">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
