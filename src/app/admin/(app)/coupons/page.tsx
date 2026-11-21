"use client";

import { useEffect, useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";

type Coupon = {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: string;
  applicable_plans: PlanId[] | string | null;
  max_uses: number | null;
  used_count: number;
  once_per_shop: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: number;
  total_discount: string;
};

type Redemption = {
  id: number;
  code: string;
  email: string;
  shop_name: string | null;
  plan: PlanId;
  original_price: string;
  discount_amount: string;
  final_price: string;
  redeemed_at: string;
};

type FormState = {
  id: number | null;
  code: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: string;
  applicablePlans: PlanId[];
  maxUses: string;
  oncePerShop: boolean;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const PLAN_IDS = Object.keys(PLANS) as PlanId[];

const EMPTY_FORM: FormState = {
  id: null,
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  applicablePlans: [],
  maxUses: "",
  oncePerShop: true,
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

function parsePlans(value: Coupon["applicable_plans"]): PlanId[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm".
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function couponStatus(c: Coupon): { label: string; className: string } {
  const now = Date.now();
  if (!c.is_active) return { label: "Inactive", className: "bg-base-700 text-base-500" };
  if (c.expires_at && new Date(c.expires_at).getTime() <= now) return { label: "Expired", className: "bg-danger/10 text-danger" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "Scheduled", className: "bg-warning/10 text-warning" };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { label: "Used up", className: "bg-base-700 text-base-500" };
  return { label: "Active", className: "bg-success/10 text-success" };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons);
      setRedemptions(data.redemptions);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startCreate() {
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function startEdit(c: Coupon) {
    setForm({
      id: c.id,
      code: c.code,
      description: c.description || "",
      discountType: c.discount_type,
      discountValue: String(Number(c.discount_value)),
      applicablePlans: parsePlans(c.applicable_plans),
      maxUses: c.max_uses == null ? "" : String(c.max_uses),
      oncePerShop: Boolean(c.once_per_shop),
      startsAt: toLocalInput(c.starts_at),
      expiresAt: toLocalInput(c.expires_at),
      isActive: Boolean(c.is_active),
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save coupon");
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  }

  async function toggleActive(c: Coupon) {
    setListError("");
    await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isActive: !c.is_active }),
    });
    load();
  }

  async function remove(c: Coupon) {
    setListError("");
    const res = await fetch(`/api/admin/coupons?id=${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      setListError((await res.json()).error || "Could not delete coupon");
      return;
    }
    load();
  }

  const previewPrice = (plan: PlanId) => {
    const price = PLANS[plan].price;
    const v = Number(form.discountValue) || 0;
    const discount = Math.min(price, form.discountType === "percent" ? (price * v) / 100 : v);
    return Math.max(0, Math.round((price - discount) * 100) / 100);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Coupon Codes</h1>
          <p className="text-base-500 text-sm">Discounts on plan subscriptions, at signup and on the Billing page</p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="btn-primary">
            + New coupon
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={save} className="card p-5 mb-6 max-w-3xl space-y-4">
          <h3 className="font-semibold">{form.id ? `Edit ${form.code}` : "New coupon"}</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => update("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                className="input-field font-mono uppercase"
                placeholder="e.g. WELCOME50"
                maxLength={40}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Description <span className="text-base-500 font-normal">(internal)</span>
              </label>
              <input
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="input-field"
                placeholder="Diwali campaign"
                maxLength={255}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Discount</label>
              <div className="flex gap-2">
                <select
                  value={form.discountType}
                  onChange={(e) => update("discountType", e.target.value as "percent" | "flat")}
                  className="input-field w-32 shrink-0"
                >
                  <option value="percent">% off</option>
                  <option value="flat">₹ off</option>
                </select>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={form.discountType === "percent" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => update("discountValue", e.target.value)}
                  className="input-field"
                  placeholder={form.discountType === "percent" ? "10" : "50"}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Max total uses <span className="text-base-500 font-normal">(empty = unlimited)</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.maxUses}
                onChange={(e) => update("maxUses", e.target.value)}
                className="input-field"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Starts <span className="text-base-500 font-normal">(optional)</span>
              </label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Expires <span className="text-base-500 font-normal">(optional)</span>
              </label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => update("expiresAt", e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-1.5">
              Applies to plans <span className="text-base-500 font-normal">(none selected = all plans)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PLAN_IDS.map((plan) => {
                const selected = form.applicablePlans.includes(plan);
                return (
                  <button
                    type="button"
                    key={plan}
                    onClick={() =>
                      update(
                        "applicablePlans",
                        selected ? form.applicablePlans.filter((p) => p !== plan) : [...form.applicablePlans, plan]
                      )
                    }
                    className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border ${
                      selected ? "bg-accent-500 border-accent-500 text-white" : "border-base-700 text-base-500"
                    }`}
                  >
                    {PLANS[plan].name} · ₹{PLANS[plan].price}
                    {form.discountValue && (
                      <span className="opacity-80"> → ₹{previewPrice(plan)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.oncePerShop} onChange={(e) => update("oncePerShop", e.target.checked)} />
              One use per shop
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
              Active
            </label>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : form.id ? "Save changes" : "Create coupon"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {listError && <p className="text-danger text-sm mb-3">{listError}</p>}

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : coupons.length === 0 ? (
        <div className="card p-6 sm:p-10 text-center text-base-500">No coupons yet. Create one to offer plan discounts.</div>
      ) : (
        <div className="card overflow-hidden overflow-x-auto mb-8">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Plans</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = couponStatus(c);
                const plans = parsePlans(c.applicable_plans);
                return (
                  <tr key={c.id} className="border-b border-base-700/40 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold">{c.code}</p>
                      {c.description && <p className="text-xs text-base-500">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {c.discount_type === "percent" ? `${Number(c.discount_value)}% off` : `₹${Number(c.discount_value)} off`}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {plans.length === 0 ? "All" : plans.map((p) => PLANS[p]?.name || p).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      {c.used_count}
                      {c.max_uses != null && <span className="text-base-500"> / {c.max_uses}</span>}
                      {Number(c.total_discount) > 0 && (
                        <p className="text-xs text-base-500">₹{Number(c.total_discount)} given</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-base-500">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => startEdit(c)} className="text-xs border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500">
                          Edit
                        </button>
                        <button onClick={() => toggleActive(c)} className="text-xs border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500">
                          {c.is_active ? "Deactivate" : "Activate"}
                        </button>
                        {c.used_count === 0 && (
                          <button onClick={() => remove(c)} className="text-xs border border-danger/40 text-danger rounded-lg px-2.5 py-1.5">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Recent redemptions</h2>
      {redemptions.length === 0 ? (
        <div className="card p-6 text-center text-base-500 text-sm">No coupons redeemed yet.</div>
      ) : (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((r) => (
                <tr key={r.id} className="border-b border-base-700/40 last:border-0">
                  <td className="px-4 py-3 font-mono">{r.code}</td>
                  <td className="px-4 py-3">
                    {r.shop_name || "—"}
                    <p className="text-xs text-base-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">{PLANS[r.plan]?.name || r.plan}</td>
                  <td className="px-4 py-3">
                    ₹{Number(r.final_price)}{" "}
                    <span className="text-xs text-base-500 line-through">₹{Number(r.original_price)}</span>
                  </td>
                  <td className="px-4 py-3 text-base-500">{new Date(r.redeemed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
