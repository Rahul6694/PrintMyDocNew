"use client";

import { useState } from "react";
import { Send, Mail } from "lucide-react";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, message }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setStatus("error");
      return;
    }
    setStatus("sent");
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
  }

  return (
    <section id="contact" className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-accent-600 to-accent-400 p-8 text-white flex flex-col">
          <span className="badge bg-white/20 text-white mb-6 self-start">Support</span>
          <h2 className="text-3xl font-bold mb-4">How can we help?</h2>
          <p className="text-white/85 mb-8">
            Send your question and we&apos;ll get back to you. Only the message is required.
          </p>
          <div className="mt-auto">
            <a
              href="mailto:support@printmydoc.app"
              className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-3 font-medium"
            >
              <Mail size={16} /> support@printmydoc.app
            </a>
          </div>
        </div>

        <div className="card p-8">
          <h3 className="font-semibold text-lg mb-1">Contact us</h3>
          <p className="text-base-500 text-sm mb-5">Send us your question and contact details.</p>

          {status === "sent" ? (
            <p className="text-success font-medium">Thanks — we&apos;ve received your message and will reply soon.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-base-500 block mb-1.5">Name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-sm text-base-500 block mb-1.5">Phone number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="Phone number" />
                </div>
              </div>
              <div>
                <label className="text-sm text-base-500 block mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="Email address" />
              </div>
              <div>
                <label className="text-sm text-base-500 block mb-1.5">How can we help?</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="input-field"
                  placeholder="Tell us your question or problem"
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <button type="submit" disabled={status === "sending"} className="btn-primary flex items-center gap-2">
                <Send size={14} /> {status === "sending" ? "Sending..." : "Send enquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
