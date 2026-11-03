"use client";

import { useEffect, useMemo, useState } from "react";

type Shop = {
  id: number;
  name: string;
  email: string;
  slug: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
  login_count: number | null;
  plan: string | null;
  subscription_status: string | null;
  started_at: string | null;
  expires_at: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(value: string | null) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function planExpiry(s: Shop) {
  if (!s.plan) return { label: "No plan", tone: "text-base-500" };
  if (!s.expires_at) return { label: s.subscription_status === "active" ? "No end date" : "—", tone: "text-base-500" };
  const days = Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / DAY_MS);
  if (days < 0) return { label: `Expired ${-days} day${days === -1 ? "" : "s"} ago`, tone: "text-danger" };
  if (days === 0) return { label: "Expires today", tone: "text-danger" };
  if (days <= 7) return { label: `${days} day${days === 1 ? "" : "s"} left`, tone: "text-warning" };
  return { label: `${days} days left`, tone: "text-success" };
}

function isPlanLive(s: Shop) {
  return (
    s.subscription_status === "active" && (!s.expires_at || new Date(s.expires_at).getTime() > Date.now())
  );
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    const res = await fetch("/api/admin/shops");
    if (res.ok) setShops((await res.json()).shops);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(shopId: number, isActive: boolean) {
    await fetch("/api/admin/shops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, isActive }),
    });
    load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((s) =>
      [s.name, s.email, s.slug, s.phone ?? "", s.plan ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [shops, query]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * DAY_MS;
    return {
      total: shops.length,
      livePlans: shops.filter(isPlanLive).length,
      expiringSoon: shops.filter((s) => {
        if (!isPlanLive(s) || !s.expires_at) return false;
        return new Date(s.expires_at).getTime() - Date.now() <= 7 * DAY_MS;
      }).length,
      activeThisWeek: shops.filter((s) => s.last_login_at && new Date(s.last_login_at).getTime() >= weekAgo).length,
    };
  }, [shops]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Shops</h1>
      <p className="text-base-500 text-sm mb-6">{shops.length} registered shops</p>

      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total shops", value: stats.total },
            { label: "Active plans", value: stats.livePlans },
            { label: "Expiring in 7 days", value: stats.expiringSoon },
            { label: "Logged in this week", value: stats.activeThisWeek },
          ].map((c) => (
            <div key={c.label} className="card p-4">
              <p className="text-xs text-base-500 mb-1">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, phone or plan..."
        className="input-field w-full sm:max-w-sm mb-4"
      />

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Login ID</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Plan Start</th>
                <th className="px-4 py-3 font-medium">Plan End</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const expiry = planExpiry(s);
                return (
                  <tr key={s.id} className="border-b border-base-700/40 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-base-500">/{s.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-base-500">
                      <p>{s.email}</p>
                      {s.phone && <p className="text-xs">{s.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {s.plan ? (
                        <>
                          <p className="font-medium capitalize">{s.plan}</p>
                          <p className="text-xs text-base-500 capitalize">{s.subscription_status}</p>
                        </>
                      ) : (
                        <span className="text-base-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-base-500 whitespace-nowrap">{formatDate(s.started_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p>{formatDate(s.expires_at)}</p>
                      <p className={`text-xs ${expiry.tone}`}>{expiry.label}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p>{formatDateTime(s.last_login_at)}</p>
                      {s.last_login_at && (
                        <p className="text-xs text-base-500">
                          {relativeTime(s.last_login_at)} · {s.login_count ?? 0} login{s.login_count === 1 ? "" : "s"}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          s.is_active
                            ? "bg-success/10 text-success border border-success/30"
                            : "bg-danger/10 text-danger border border-danger/30"
                        }`}
                      >
                        {s.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-base-500 whitespace-nowrap">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(s.id, !s.is_active)}
                        className="text-xs font-semibold border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500"
                      >
                        {s.is_active ? "Suspend" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-base-500">
                    No shops match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
