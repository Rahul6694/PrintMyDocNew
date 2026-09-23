"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, Printer, Clock, CheckCircle2, Search, Bell, Package } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LineChart from "@/components/LineChart";

type Summary = {
  todayRevenue: number;
  todayCompletedCount: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  weekSeries: { day: string; orders: number; revenue: string }[];
  monthSeries: { month: string; revenue: string }[];
  recentOrders: {
    id: number;
    order_number: string;
    customer_name: string;
    file_name: string;
    status: string;
    total_amount: string;
    created_at: string;
  }[];
};

function StatCard({
  colorVar,
  icon: Icon,
  label,
  value,
  sub,
}: {
  colorVar: string;
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ backgroundColor: colorVar }}>
      <div className="flex items-start justify-between gap-3 mb-6">
        <p className="font-semibold text-sm opacity-95">{label}</p>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold mb-1 break-words">{value}</p>
      <p className="text-xs opacity-80">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Summary | null>(null);
  const [chartMode, setChartMode] = useState<"orders" | "revenue">("orders");
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/dashboard/orders?status=all&search=${encodeURIComponent(search)}`);
  }

  if (!data) return <p className="text-base-500 text-sm">Loading...</p>;

  const weekChartPoints = data.weekSeries.map((d) => ({
    label: new Date(d.day).toLocaleDateString(undefined, { weekday: "short" }),
    value: chartMode === "orders" ? d.orders : Number(d.revenue),
  }));
  const monthChartPoints = data.monthSeries.map((d) => ({
    label: new Date(`${d.month}-01`).toLocaleDateString(undefined, { month: "short" }),
    value: Number(d.revenue),
  }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-xs text-base-500 uppercase tracking-wide font-semibold mb-1">Dashboard</p>
          <h1 className="text-2xl font-bold">Welcome back 👋</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/billing" className="btn-primary text-sm">
            Upgrade plan
          </Link>
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[10rem] sm:flex-none">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="input-field pl-9 w-full sm:w-48 text-sm"
            />
          </form>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors"
            >
              <Bell size={16} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] card p-4 z-10">
                <p className="text-sm font-semibold mb-1">Notifications</p>
                <p className="text-xs text-base-500">No new notifications yet.</p>
              </div>
            )}
          </div>
          <ThemeToggle variant="icon" />
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 border border-base-700 rounded-full pl-1.5 pr-3 py-1.5 hover:border-accent-500 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center">
                S
              </span>
              <span className="text-sm font-medium">Account</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 card p-2 z-10">
                <Link
                  href="/dashboard/business-setup"
                  className="block px-3 py-2 rounded-lg hover:bg-base-800 text-sm"
                >
                  Business Setup
                </Link>
                <Link href="/dashboard/billing" className="block px-3 py-2 rounded-lg hover:bg-base-800 text-sm">
                  Billing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          colorVar="var(--c-stat-blue)"
          icon={TrendingUp}
          label="Today's Revenue"
          value={`₹${data.todayRevenue}`}
          sub={`From ${data.todayCompletedCount} completed orders`}
        />
        <StatCard
          colorVar="var(--c-stat-yellow)"
          icon={Printer}
          label="Total Orders Processed"
          value={String(data.totalOrders)}
          sub="Completed prints for your shop"
        />
        <StatCard
          colorVar="var(--c-stat-red)"
          icon={Clock}
          label="Pending Orders"
          value={String(data.pendingOrders)}
          sub="Awaiting print action"
        />
        <StatCard
          colorVar="var(--c-stat-green)"
          icon={CheckCircle2}
          label="Completed"
          value={String(data.completedOrders)}
          sub="Orders printed & delivered"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold">Orders This Week</h3>
              <p className="text-xs text-base-500">
                Total {data.weekSeries.reduce((s, d) => s + d.orders, 0)} orders · ₹
                {data.weekSeries.reduce((s, d) => s + Number(d.revenue), 0)} revenue
              </p>
            </div>
            <div className="flex gap-1 bg-base-900 rounded-full p-1">
              {(["orders", "revenue"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className={`text-xs font-semibold rounded-full px-3 py-1 capitalize transition-colors ${
                    chartMode === m ? "bg-accent-500 text-white" : "text-base-500"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {weekChartPoints.length === 0 ? (
            <p className="text-base-500 text-sm py-10 text-center">No orders yet.</p>
          ) : (
            <LineChart points={weekChartPoints} formatValue={(v) => (chartMode === "revenue" ? `₹${v}` : `${v} orders`)} />
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-1">Order Status</h3>
          <p className="text-xs text-base-500 mb-6">{data.totalOrders} total orders</p>
          {data.totalOrders === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-base-800 flex items-center justify-center mb-3">
                <Package size={22} className="text-base-500" />
              </div>
              <p className="font-semibold text-sm">No orders yet</p>
              <p className="text-xs text-base-500 mt-1">Status breakdown appears here</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-500">Pending</span>
                <span className="font-semibold">{data.pendingOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-500">Completed</span>
                <span className="font-semibold">{data.completedOrders}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold mb-1">Monthly Revenue</h3>
          <p className="text-xs text-base-500 mb-4">Last 7 months</p>
          {monthChartPoints.length === 0 ? (
            <p className="text-base-500 text-sm py-10 text-center">No revenue yet.</p>
          ) : (
            <LineChart points={monthChartPoints} formatValue={(v) => `₹${v}`} color="var(--c-stat-green)" />
          )}
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-4 sm:px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-base-700/60">
            <div>
              <h3 className="font-semibold">Recent Orders</h3>
              <p className="text-xs text-base-500">Today&apos;s incoming orders</p>
            </div>
            <Link href="/dashboard/orders" className="btn-primary text-xs px-3 py-2">
              Open Order Handler →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <Package size={24} className="text-base-500 mx-auto mb-2" />
              <p className="font-semibold text-sm">No orders yet</p>
              <p className="text-xs text-base-500 mt-1">
                Incoming print orders from your WhatsApp number will show up here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-left text-base-500 border-b border-base-700/60">
                <tr>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Document</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-base-700/40 last:border-0">
                    <td className="px-5 py-2.5">{o.customer_name || "—"}</td>
                    <td className="px-5 py-2.5 text-base-500 text-xs">{o.file_name}</td>
                    <td className="px-5 py-2.5 capitalize">{o.status.replace("_", " ")}</td>
                    <td className="px-5 py-2.5 font-semibold">₹{o.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
