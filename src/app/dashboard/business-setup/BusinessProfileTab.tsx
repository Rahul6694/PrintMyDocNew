"use client";

import { useEffect, useState } from "react";
import {
  CAPABILITY_GROUPS,
  ADVANCED_CAPABILITY_GROUPS,
  PHYSICAL_CAPABILITY_GROUPS,
  DEFAULT_CAPABILITIES,
} from "@/lib/capabilities";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="toggle-switch" data-on={checked}>
      <span className="knob" />
    </button>
  );
}

type Profile = {
  name: string;
  owner_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
};

export default function BusinessProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>(DEFAULT_CAPABILITIES);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [physicalEnabled, setPhysicalEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/business/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile);
        setCapabilities(data.capabilities);
        setAdvancedEnabled(!!data.advancedServicesEnabled);
        setPhysicalEnabled(!!data.physicalServicesEnabled);
      });
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/business/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        ownerName: profile.owner_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        gstin: profile.gstin,
        capabilities,
        advancedServicesEnabled: advancedEnabled,
        physicalServicesEnabled: physicalEnabled,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage("Saved");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setMessage(data.error || "Failed to save");
    }
    setTimeout(() => setMessage(""), 2500);
  }

  if (!profile) return <p className="text-base-500 text-sm">Loading...</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Business Profile &amp; Capabilities</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Shop Name</label>
            <input
              value={profile.name}
              onChange={(e) => update("name", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Contact Number</label>
            <input
              value={profile.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <p className="text-xs text-base-500 uppercase tracking-wide mb-2">Popular services</p>
        <div className="space-y-2">
          {CAPABILITY_GROUPS.map((group, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              {group.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 text-sm border border-base-700 rounded-lg px-3 py-2 cursor-pointer hover:border-accent-500"
                >
                  <input
                    type="checkbox"
                    checked={!!capabilities[item.key]}
                    onChange={(e) =>
                      setCapabilities((c) => ({ ...c, [item.key]: e.target.checked }))
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className={`mt-5 rounded-xl border p-4 ${advancedEnabled ? "border-accent-500" : "border-base-700"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Advanced services</p>
              <p className="text-xs text-base-500">Enable only capabilities your shop can fulfil.</p>
            </div>
            <Toggle checked={advancedEnabled} onChange={setAdvancedEnabled} />
          </div>
          {advancedEnabled && (
            <div className="space-y-2 mt-4">
              {ADVANCED_CAPABILITY_GROUPS.map((group, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  {group.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 text-sm border border-base-700 rounded-lg px-3 py-2 cursor-pointer hover:border-accent-500"
                    >
                      <input
                        type="checkbox"
                        checked={!!capabilities[item.key]}
                        onChange={(e) => setCapabilities((c) => ({ ...c, [item.key]: e.target.checked }))}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-3 rounded-xl border p-4 ${physicalEnabled ? "border-warning" : "border-base-700"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Physical services</p>
              <p className="text-xs text-base-500">Media loading and finishing performed by printer hardware or shop staff.</p>
            </div>
            <Toggle checked={physicalEnabled} onChange={setPhysicalEnabled} />
          </div>
          {physicalEnabled && (
            <div className="space-y-2 mt-4">
              {PHYSICAL_CAPABILITY_GROUPS.map((group, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  {group.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 text-sm border border-base-700 rounded-lg px-3 py-2 cursor-pointer hover:border-accent-500"
                    >
                      <input
                        type="checkbox"
                        checked={!!capabilities[item.key]}
                        onChange={(e) => setCapabilities((c) => ({ ...c, [item.key]: e.target.checked }))}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Owner &amp; Login Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Owner Name</label>
            <input
              value={profile.owner_name || ""}
              onChange={(e) => update("owner_name", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Login Email</label>
            <input value={profile.email} disabled className="input-field opacity-60" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm text-base-500 block mb-1.5">Business Address</label>
          <input
            value={profile.address || ""}
            onChange={(e) => update("address", e.target.value)}
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">City</label>
            <input value={profile.city || ""} onChange={(e) => update("city", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">State</label>
            <input value={profile.state || ""} onChange={(e) => update("state", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">PIN Code</label>
            <input value={profile.pincode || ""} onChange={(e) => update("pincode", e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm text-base-500 block mb-1.5">GSTIN (optional)</label>
          <input value={profile.gstin || ""} onChange={(e) => update("gstin", e.target.value)} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-base-500 block mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="Required for login changes"
            />
          </div>
          <div>
            <label className="text-sm text-base-500 block mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Leave blank to keep"
            />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Update account details"}
        </button>
        {message && <p className="text-sm mt-2 text-accent-400">{message}</p>}
      </div>
    </div>
  );
}
