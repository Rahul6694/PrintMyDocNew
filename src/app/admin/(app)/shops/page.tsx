"use client";

import { useEffect, useState } from "react";

type Shop = {
  id: number;
  name: string;
  email: string;
  slug: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  plan: string | null;
  subscription_status: string | null;
  expires_at: string | null;
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Shops</h1>
      <p className="text-base-500 text-sm mb-6">{shops.length} registered shops</p>

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className="border-b border-base-700/40 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-base-500">/{s.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-base-500">{s.email}</td>
                  <td className="px-4 py-3 text-base-500">{s.phone}</td>
                  <td className="px-4 py-3 capitalize">
                    {s.plan ? `${s.plan} (${s.subscription_status})` : "None"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.is_active ? "bg-success/10 text-success border border-success/30" : "bg-danger/10 text-danger border border-danger/30"}`}>
                      {s.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-base-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(s.id, !s.is_active)}
                      className="text-xs font-semibold border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500"
                    >
                      {s.is_active ? "Suspend" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
