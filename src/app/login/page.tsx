"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, Eye, EyeOff } from "lucide-react";
import AuthHeader from "@/components/auth/AuthHeader";

const STEPS = ["Receive", "Configure", "Print"];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-950">
      <AuthHeader />
      <main className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-2 bg-base-850">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-accent-600 to-accent-400 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-16">
              <span className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Printer size={16} />
              </span>
              <span className="font-semibold">PrintMyDoc</span>
            </div>
            <span className="badge bg-white/20 text-white mb-4">Merchant workspace</span>
            <h1 className="text-3xl font-bold leading-tight mb-4">Every print order, under control.</h1>
            <p className="text-white/85 text-sm max-w-xs">
              Receive documents from WhatsApp and your shop QR, confirm print settings, collect payments,
              and send jobs to your connected printer.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="bg-white/15 rounded-xl p-3">
                <p className="text-xs text-white/70 font-mono">{String(i + 1).padStart(2, "0")}</p>
                <p className="font-semibold text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10 bg-base-850">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="w-12 h-12 rounded-xl bg-accent-500 text-white flex items-center justify-center mb-4">
              <Printer size={20} />
            </span>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-base-500 text-sm mt-1">Sign in to your shop dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-base-500 block mb-1.5">Email or mobile number</label>
              <input
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="you@yourshop.com or 9876543210"
              />
            </div>
            <div>
              <label className="text-sm text-base-500 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-9"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-500 hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <a href="/#contact" className="text-xs text-accent-400 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in..." : "Secure sign in →"}
            </button>
          </form>

          <p className="text-center text-sm text-base-500 mt-6">
            New to PrintMyDoc?{" "}
            <Link href="/register" className="text-accent-400 font-semibold hover:underline">
              Join as a Merchant
            </Link>
          </p>
          <p className="text-center text-xs text-base-500 mt-2">Encrypted in transit · Secured by Razorpay</p>
        </div>
      </div>
      </main>
    </div>
  );
}
