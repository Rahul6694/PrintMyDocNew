"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Inbox as InboxIcon } from "lucide-react";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  file_name: string;
  page_count: number;
  copies: number;
  paper_size: string;
  color_mode: string;
  sided: string;
  binding: number;
  total_amount: string;
  status: string;
  origin: string;
  created_at: string;
};

const TABS: { key: string; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "printing", label: "Printing" },
  { key: "rejected", label: "Rejected" },
  { key: "print_failed", label: "Print Failed" },
  { key: "done", label: "Done" },
  { key: "all", label: "All Orders" },
];

const TAB_DESCRIPTIONS: Record<string, string> = {
  pending: "New and downloaded orders awaiting merchant action",
  processing: "Orders accepted and being prepared",
  printing: "Orders currently at the printer",
  rejected: "Orders declined by the shop",
  print_failed: "Orders that failed to print",
  done: "Orders printed and delivered",
  all: "Every order for this shop",
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-base-700 text-base-500",
  pending: "bg-accent-500/10 text-accent-400 border border-accent-500/30",
  processing: "bg-warning/10 text-warning border border-warning/30",
  printing: "bg-warning/10 text-warning border border-warning/30",
  done: "bg-success/10 text-success border border-success/30",
  rejected: "bg-danger/10 text-danger border border-danger/30",
  print_failed: "bg-danger/10 text-danger border border-danger/30",
  cancelled: "bg-danger/10 text-danger border border-danger/30",
};

const NEXT_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending: [
    { label: "Accept", next: "processing" },
    { label: "Reject", next: "rejected" },
  ],
  processing: [
    { label: "Start printing", next: "printing" },
    { label: "Reject", next: "rejected" },
  ],
  printing: [
    { label: "Mark done", next: "done" },
    { label: "Mark failed", next: "print_failed" },
  ],
  print_failed: [{ label: "Retry", next: "printing" }],
};

function OrdersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("status") || "pending";

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    if (search) params.set("search", search);
    const res = await fetch(`/api/orders?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setStatusCounts(data.statusCounts || {});
    }
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search]);

  async function advance(orderId: number, nextStatus: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) loadOrders();
  }

  function selectTab(key: string) {
    router.push(`/dashboard/orders?status=${key}`);
  }

  const totalCount = tab === "all" ? orders.length : statusCounts[tab] || 0;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalPages = orders.reduce((sum, o) => sum + o.page_count * o.copies, 0);

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-xs text-accent-400 font-semibold uppercase tracking-wide mb-1">Order Queue</p>
          <h1 className="text-2xl font-bold capitalize">{tab === "all" ? "All Orders" : `${tab.replace("_", " ")} Orders`}</h1>
          <p className="text-base-500 text-sm mt-1">{TAB_DESCRIPTIONS[tab]}</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xl font-bold">{totalCount}</p>
            <p className="text-xs text-base-500 uppercase tracking-wide">Orders</p>
          </div>
          <div>
            <p className="text-xl font-bold">₹{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-base-500 uppercase tracking-wide">Revenue</p>
          </div>
          <div>
            <p className="text-xl font-bold">{totalPages}</p>
            <p className="text-xs text-base-500 uppercase tracking-wide">Pages</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
            data-active={tab === t.key}
            className="pill-tab"
          >
            {t.label} {t.key !== "all" ? statusCounts[t.key] || 0 : ""}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search order ID, name, phone or file..."
        className="input-field max-w-sm mb-6"
      />

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="card p-14 text-center text-base-500 flex flex-col items-center gap-3">
          {tab === "pending" ? <Clock size={28} className="text-base-600" /> : <InboxIcon size={28} className="text-base-600" />}
          <div>
            <p className="font-semibold text-ink">No {tab === "all" ? "" : tab.replace("_", " ")} orders right now</p>
            <p className="text-sm mt-1">Orders will appear here as they arrive.</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Spec</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const actions = NEXT_ACTIONS[o.status] || [];
                return (
                  <tr key={o.id} className="border-b border-base-700/40 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <p>{o.customer_name || "—"}</p>
                      <p className="text-base-500 text-xs">{o.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-base-500 text-xs whitespace-nowrap">
                      {o.paper_size} · {o.color_mode === "bw" ? "B/W" : "Color"} · {o.sided} ·{" "}
                      {o.page_count}pg × {o.copies} {o.binding ? "· binding" : ""}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">₹{o.total_amount}</td>
                    <td className="px-4 py-3 text-xs capitalize">{o.origin}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_STYLES[o.status] || ""}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/orders/${o.id}/file`}
                        className="text-accent-400 hover:underline text-xs"
                      >
                        Download
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {actions.map((a) => (
                          <button
                            key={a.next}
                            onClick={() => advance(o.id, a.next)}
                            className="text-xs font-semibold border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500 transition-colors whitespace-nowrap"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-base-500 text-sm">Loading...</p>}>
      <OrdersPageInner />
    </Suspense>
  );
}
