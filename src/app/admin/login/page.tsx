"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/auth/AuthHeader";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push("/admin/shops");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <AuthHeader />
      <main className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-lg font-bold tracking-tight">
            Print<span className="text-accent-400">MyDoc</span>
          </p>
          <p className="text-base-500 text-sm mt-2">Super admin sign in</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
      </main>
    </div>
  );
}
