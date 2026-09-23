"use client";

import { useEffect, useState } from "react";

type Rate = {
  id: number;
  paper_size: string;
  color_mode: string;
  sided: string;
  enabled?: number;
  discounted_price: string | null;
};

const CONFIG_LABEL: Record<string, string> = {
  "bw|single": "Black & White · Single-Sided",
  "bw|back_to_back_manual": "Black & White · Back-to-Back",
  "color|single": "Color · Single-Sided",
  "color|back_to_back_manual": "Color · Back-to-Back",
};

function keyOf(r: { color_mode: string; sided: string }) {
  return `${r.color_mode}|${r.sided}`;
}

export default function DiscountsTab() {
  const [bulkEnabled, setBulkEnabled] = useState(false);
  const [threshold, setThreshold] = useState("100");
  const [bulkRates, setBulkRates] = useState<Rate[]>([]);
  const [copyEnabled, setCopyEnabled] = useState(false);
  const [copyRates, setCopyRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business/discounts")
      .then((r) => r.json())
      .then((data) => {
        setBulkEnabled(!!data.bulkSettings.enabled);
        setThreshold(data.bulkSettings.threshold_amount);
        setBulkRates(data.bulkRates);
        setCopyEnabled(!!data.copySettings.enabled);
        setCopyRates(data.copyRates);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveBulkSettings(enabled: boolean, thresholdAmount: string) {
    setBulkEnabled(enabled);
    setThreshold(thresholdAmount);
    await fetch("/api/business/discounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "bulk_settings", enabled, thresholdAmount }),
    });
  }

  async function saveBulkRate(rate: Rate, enabled: boolean, discountedPrice: string) {
    setBulkRates((prev) =>
      prev.map((r) => (r.id === rate.id ? { ...r, enabled: enabled ? 1 : 0, discounted_price: discountedPrice } : r))
    );
    await fetch("/api/business/discounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "bulk_rate",
        paperSize: rate.paper_size,
        colorMode: rate.color_mode,
        sided: rate.sided,
        enabled,
        discountedPrice: discountedPrice || null,
      }),
    });
  }

  async function saveCopySettings(enabled: boolean) {
    setCopyEnabled(enabled);
    await fetch("/api/business/discounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "copy_settings", enabled }),
    });
  }

  async function saveCopyRate(rate: Rate, discountedPrice: string) {
    setCopyRates((prev) =>
      prev.map((r) => (r.id === rate.id ? { ...r, discounted_price: discountedPrice } : r))
    );
    await fetch("/api/business/discounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "copy_rate",
        paperSize: rate.paper_size,
        colorMode: rate.color_mode,
        sided: rate.sided,
        discountedPrice: discountedPrice || null,
      }),
    });
  }

  if (loading) return <p className="text-base-500 text-sm">Loading...</p>;

  // Bulk/copy rate rows only exist once a merchant has touched them; fall back
  // to a blank row per known config so the grid always has something to edit.
  const knownConfigs = Object.keys(CONFIG_LABEL);
  const bulkByKey = new Map(bulkRates.map((r) => [keyOf(r), r]));
  const copyByKey = new Map(copyRates.map((r) => [keyOf(r), r]));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div>
            <h3 className="font-semibold">High-Value Order Discount</h3>
            <p className="text-base-500 text-sm">Offer lower per-page pricing once an order crosses a set amount</p>
          </div>
          <button
            onClick={() => saveBulkSettings(!bulkEnabled, threshold)}
            className="toggle-switch"
            data-on={bulkEnabled}
          >
            <span className="knob" />
          </button>
        </div>

        <div className="mt-4 mb-4">
          <label className="text-sm text-base-500 block mb-1.5">Apply when normal order value is at least</label>
          <input
            className="input-field w-40"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            onBlur={() => saveBulkSettings(bulkEnabled, threshold)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {knownConfigs.map((key) => {
            const [colorMode, sided] = key.split("|");
            const rate = bulkByKey.get(key) || { id: 0, paper_size: "A4", color_mode: colorMode, sided, enabled: 0, discounted_price: null };
            return (
              <div key={key} className="border border-base-700 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-medium">{CONFIG_LABEL[key]}</p>
                  <button
                    onClick={() => saveBulkRate({ ...rate, paper_size: "A4" }, !rate.enabled, rate.discounted_price || "")}
                    className="toggle-switch"
                    data-on={!!rate.enabled}
                  >
                    <span className="knob" />
                  </button>
                </div>
                <input
                  className="input-field text-sm"
                  placeholder="Discounted rate"
                  value={rate.discounted_price || ""}
                  onChange={(e) =>
                    setBulkRates((prev) => {
                      const exists = prev.find((r) => keyOf(r) === key);
                      if (exists) return prev.map((r) => (keyOf(r) === key ? { ...r, discounted_price: e.target.value } : r));
                      return [...prev, { ...rate, discounted_price: e.target.value }];
                    })
                  }
                  onBlur={(e) => saveBulkRate({ ...rate, paper_size: "A4" }, !!rate.enabled, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div>
            <h3 className="font-semibold">Additional Copy Discount</h3>
            <p className="text-base-500 text-sm">Copy 1 uses the normal price; copies 2+ use the rate below</p>
          </div>
          <button onClick={() => saveCopySettings(!copyEnabled)} className="toggle-switch" data-on={copyEnabled}>
            <span className="knob" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {knownConfigs.map((key) => {
            const [colorMode, sided] = key.split("|");
            const rate = copyByKey.get(key) || { id: 0, paper_size: "A4", color_mode: colorMode, sided, discounted_price: null };
            return (
              <div key={key} className="border border-base-700 rounded-lg p-3">
                <p className="text-xs font-medium mb-2">{CONFIG_LABEL[key]}</p>
                <input
                  className="input-field text-sm"
                  placeholder="Normal rate if blank"
                  value={rate.discounted_price || ""}
                  onChange={(e) =>
                    setCopyRates((prev) => {
                      const exists = prev.find((r) => keyOf(r) === key);
                      if (exists) return prev.map((r) => (keyOf(r) === key ? { ...r, discounted_price: e.target.value } : r));
                      return [...prev, { ...rate, discounted_price: e.target.value }];
                    })
                  }
                  onBlur={(e) => saveCopyRate({ ...rate, paper_size: "A4" }, e.target.value)}
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-base-500 mt-4">
          Blank or disabled rates safely fall back to the normal price.
        </p>
      </div>
    </div>
  );
}
