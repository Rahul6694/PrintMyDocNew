"use client";

import { useEffect, useState } from "react";

type Withdrawal = {
  id: number;
  shop_id: number;
  shop_name: string;
  source: string;
  gross_amount: string;
  commission_amount: string;
  net_amount: string;
  payout_method: string;
  payout_destination: string;
  status: string;
  requested_at: string;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = filter === "all" ? "" : `?status=${filter}`;
    const res = await fetch(`/api/admin/withdrawals${params}`);
    if (res.ok) setWithdrawals((await res.json()).withdrawals);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: number, status: string) {
    await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId: id, status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Withdrawal Requests</h1>
      <p className="text-base-500 text-sm mb-6">Approve, reject, or mark as paid after sending money manually</p>

      <div className="flex gap-2 mb-6">
        {["pending", "approved", "paid", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border capitalize ${
              filter === f ? "bg-accent-500 border-accent-500 text-white" : "border-base-700 text-base-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : withdrawals.length === 0 ? (
        <div className="card p-10 text-center text-base-500">No withdrawal requests in this view.</div>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Net Amount</th>
                <th className="px-4 py-3 font-medium">Payout To</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-base-700/40 last:border-0">
                  <td className="px-4 py-3">{w.shop_name}</td>
                  <td className="px-4 py-3 capitalize">{w.source.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-semibold">
                    ₹{w.net_amount} <span className="text-xs text-base-500">(gross ₹{w.gross_amount})</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {w.payout_method.toUpperCase()}: {w.payout_destination}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-base-700 text-base-500 capitalize">{w.status}</span>
                  </td>
                  <td className="px-4 py-3 text-base-500">{new Date(w.requested_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {w.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(w.id, "approved")} className="text-xs border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500">
                            Approve
                          </button>
                          <button onClick={() => updateStatus(w.id, "rejected")} className="text-xs border border-danger/40 text-danger rounded-lg px-2.5 py-1.5">
                            Reject
                          </button>
                        </>
                      )}
                      {w.status === "approved" && (
                        <button onClick={() => updateStatus(w.id, "paid")} className="text-xs border border-success/40 text-success rounded-lg px-2.5 py-1.5">
                          Mark paid
                        </button>
                      )}
                    </div>
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
