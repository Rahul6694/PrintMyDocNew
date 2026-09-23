"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: number;
  paper_size: string;
  color_mode: string;
  sided: string;
  price_per_page: string;
  binding_price: string;
};

const SIDED_LABEL: Record<string, string> = {
  single: "Single Sided",
  back_to_back_auto: "Back-to-Back (Auto)",
  back_to_back_manual: "Back-to-Back",
};

export default function PricingTab() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/business/pricing")
      .then((r) => r.json())
      .then((data) => setRules(data.rules || []))
      .finally(() => setLoading(false));
  }, []);

  function updateLocal(id: number, value: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, price_per_page: value } : r)));
  }

  async function save(rule: Rule) {
    setSavingId(rule.id);
    await fetch("/api/business/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rule.id,
        pricePerPage: Number(rule.price_per_page),
        bindingPrice: Number(rule.binding_price),
      }),
    });
    setSavingId(null);
  }

  if (loading) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div className="card p-4 sm:p-6 max-w-2xl">
      <h3 className="font-semibold mb-1">Dynamic Pricing Grid</h3>
      <p className="text-base-500 text-sm mb-5">Set per-page rates for each print configuration</p>

      <div className="space-y-2">
        {rules.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 border border-base-700 rounded-lg px-4 py-3"
          >
            <div>
              <p className="text-xs text-base-500">{r.paper_size} Paper</p>
              <p className="font-medium">
                {r.color_mode === "bw" ? "Black & White" : "Color"} · {SIDED_LABEL[r.sided] || r.sided}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base-500">₹</span>
              <input
                type="number"
                step="0.5"
                value={r.price_per_page}
                onChange={(e) => updateLocal(r.id, e.target.value)}
                onBlur={() => save(r)}
                className="input-field w-24 text-right"
              />
              <span className="text-xs text-base-500">per page</span>
              {savingId === r.id && <span className="text-xs text-accent-400">saving…</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-accent-400 bg-accent-500/10 border border-accent-500/30 rounded-lg px-3 py-2 mt-4">
        Back-to-back rates apply per printed side. Customers are charged based on page count × configured
        rate × copies.
      </p>
    </div>
  );
}
