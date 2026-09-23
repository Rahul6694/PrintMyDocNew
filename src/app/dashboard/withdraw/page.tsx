"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, Smartphone, Building2 } from "lucide-react";

type Summary = {
  balance: {
    availableGross: number;
    commission: number;
    availableAfterCommission: number;
    usesOwnRazorpay: boolean;
    grossLifetime: number;
  };
  today: { orders: number; paidOrders: number; orderValue: number; collected: number };
  transactions: {
    date: string;
    order_number: string;
    customer_name: string;
    razorpay_payment_id: string | null;
    amount: string;
    status: string;
  }[];
  withdrawalHistory: { id: number; net_amount: string; status: string; requested_at: string }[];
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "date", label: "Specific date" },
  { key: "all", label: "All time" },
];

export default function WithdrawPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [range, setRange] = useState("today");
  const [specificDate, setSpecificDate] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const params = new URLSearchParams({ range });
    if (range === "date" && specificDate) params.set("date", specificDate);
    const res = await fetch(`/api/finance/summary?${params.toString()}`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, specificDate]);

  async function requestWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    const destination =
      method === "upi" ? upiId : `${holderName} · A/C ${accountNumber} · IFSC ${ifsc}`;
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "order_collection",
        grossAmount: Number(amount),
        payoutMethod: method,
        payoutDestination: destination,
      }),
    });
    const result = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setMessage(result.error || "Failed to request withdrawal");
      return;
    }
    setAmount("");
    setUpiId("");
    setHolderName("");
    setAccountNumber("");
    setIfsc("");
    setMessage("Withdrawal requested — a super admin will review it.");
    load();
  }

  if (!data) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Withdraw earnings</h1>
      <p className="text-base-500 text-sm mb-6">
        {data.balance.usesOwnRazorpay
          ? "You're using your own Razorpay account — payments settle directly to you and aren't held here."
          : "Order collections held by the platform, available to withdraw."}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-base-500">Available after commission</p>
          <p className="text-xl font-bold">₹{data.balance.availableAfterCommission}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500">Gross available</p>
          <p className="text-xl font-bold">₹{data.balance.availableGross}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500">Platform commission</p>
          <p className="text-xl font-bold">₹{data.balance.commission}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500">Settled directly to Razorpay</p>
          <p className="text-xl font-bold">₹{data.balance.usesOwnRazorpay ? data.balance.grossLifetime : 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <form onSubmit={requestWithdrawal} className="card p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <ArrowDownToLine size={16} /> New withdrawal
          </h3>
          <p className="text-xs text-base-500">Receive money by</p>
          <div className="flex gap-2">
            {(["upi", "bank"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm rounded-lg border py-2 ${
                  method === m ? "border-accent-500 bg-accent-500/10" : "border-base-700"
                }`}
              >
                {m === "upi" ? <Smartphone size={14} /> : <Building2 size={14} />}
                {m === "upi" ? "UPI" : "Bank account"}
              </button>
            ))}
          </div>

          {method === "upi" ? (
            <input
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="input-field"
            />
          ) : (
            <>
              <input
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Account holder name"
                className="input-field"
              />
              <input
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                className="input-field"
              />
              <input required value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="IFSC code" className="input-field" />
            </>
          )}

          <input
            required
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Gross amount (min ₹100)"
            className="input-field"
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Requesting..." : "Request withdrawal"}
          </button>
          {message && <p className="text-sm text-accent-400">{message}</p>}
          <p className="text-xs text-base-500">
            Manual settlement: after approval, a super admin transfers funds by UPI/bank and updates status here.
          </p>
        </form>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Withdrawal history</h3>
          {data.withdrawalHistory.length === 0 ? (
            <p className="text-base-500 text-sm">No withdrawal requests yet.</p>
          ) : (
            <div className="space-y-2">
              {data.withdrawalHistory.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-3 text-sm border-b border-base-700/40 pb-2 last:border-0">
                  <span>{new Date(w.requested_at).toLocaleDateString()}</span>
                  <span>₹{w.net_amount}</span>
                  <span className="badge bg-base-700 text-base-500 capitalize">{w.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-semibold">Payment transactions and withdrawal history</h3>
          <div className="flex gap-2 flex-wrap items-center">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} data-active={range === r.key} className="pill-tab">
                {r.label}
              </button>
            ))}
            {range === "date" && (
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="input-field text-sm w-40 py-1.5"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-base-500">Orders</p>
            <p className="text-lg font-bold">{data.today.orders}</p>
          </div>
          <div>
            <p className="text-xs text-base-500">Paid orders</p>
            <p className="text-lg font-bold">{data.today.paidOrders}</p>
          </div>
          <div>
            <p className="text-xs text-base-500">Order value</p>
            <p className="text-lg font-bold">₹{data.today.orderValue}</p>
          </div>
          <div>
            <p className="text-xs text-base-500">Collected</p>
            <p className="text-lg font-bold">₹{data.today.collected}</p>
          </div>
        </div>

        {data.transactions.length === 0 ? (
          <p className="text-base-500 text-sm py-6 text-center">No Razorpay transactions in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-left text-base-500 border-b border-base-700/60">
                <tr>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Payment ID</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t, i) => (
                  <tr key={i} className="border-b border-base-700/40 last:border-0">
                    <td className="py-2">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-2 font-mono text-xs">{t.order_number}</td>
                    <td className="py-2">{t.customer_name}</td>
                    <td className="py-2 font-mono text-xs">{t.razorpay_payment_id || "—"}</td>
                    <td className="py-2 font-semibold">₹{t.amount}</td>
                    <td className="py-2 capitalize">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
