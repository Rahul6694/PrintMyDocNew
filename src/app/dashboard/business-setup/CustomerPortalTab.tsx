"use client";

import { useEffect, useState } from "react";
import { Printer as PrinterIcon, FileText } from "lucide-react";

type Settings = {
  show_customer_details_page: number;
  require_name: number;
  require_mobile: number;
  allow_stapling: number;
  pages_per_sheet_enabled: number;
  service_toggles: Record<string, boolean>;
  paper_format_visibility: Record<string, boolean>;
};

const SERVICE_ROWS = [
  { key: "black_white", label: "Black & White" },
  { key: "color", label: "Color" },
  { key: "single", label: "Single-Sided" },
  { key: "back_to_back_auto", label: "Back-to-Back (Auto)" },
  { key: "back_to_back_manual", label: "Back-to-Back (Manual)" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="toggle-switch" data-on={checked}>
      <span className="knob" />
    </button>
  );
}

export default function CustomerPortalTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [shopName, setShopName] = useState("Your Shop");

  useEffect(() => {
    fetch("/api/business/customer-portal")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
    fetch("/api/business/profile")
      .then((r) => r.json())
      .then((data) => setShopName(data.profile?.name || "Your Shop"));
  }, []);

  async function persist(next: Settings) {
    setSettings(next);
    await fetch("/api/business/customer-portal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }

  if (!settings) return <p className="text-base-500 text-sm">Loading...</p>;

  const enabledColorModes = SERVICE_ROWS.filter((r) => ["black_white", "color"].includes(r.key) && settings.service_toggles[r.key] !== false);
  const enabledSided = SERVICE_ROWS.filter(
    (r) => !["black_white", "color"].includes(r.key) && settings.service_toggles[r.key] !== false
  );
  const enabledPapers = Object.entries(settings.paper_format_visibility).filter(([, v]) => v !== false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="card p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-1">Portal Service Controls</h3>
          <p className="text-base-500 text-sm mb-4">Choose exactly what customers can select when placing an order</p>

          <div className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3 mb-2">
            <div>
              <p className="font-medium text-sm">Customer details page</p>
              <p className="text-xs text-base-500">When disabled, customers skip straight to document upload</p>
            </div>
            <Toggle
              checked={!!settings.show_customer_details_page}
              onChange={(v) => persist({ ...settings, show_customer_details_page: v ? 1 : 0 })}
            />
          </div>

          {settings.show_customer_details_page === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-2 ml-4">
              <div className="flex items-center justify-between border border-base-700 rounded-lg px-3 py-2">
                <span className="text-sm">Require full name</span>
                <Toggle checked={!!settings.require_name} onChange={(v) => persist({ ...settings, require_name: v ? 1 : 0 })} />
              </div>
              <div className="flex items-center justify-between border border-base-700 rounded-lg px-3 py-2">
                <span className="text-sm">Require mobile number</span>
                <Toggle checked={!!settings.require_mobile} onChange={(v) => persist({ ...settings, require_mobile: v ? 1 : 0 })} />
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-base-500 uppercase tracking-wide mb-2">Print options shown to customers</p>
          <div className="space-y-2">
            {SERVICE_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3">
                <span className="text-sm">{row.label}</span>
                <Toggle
                  checked={settings.service_toggles[row.key] !== false}
                  onChange={(v) =>
                    persist({
                      ...settings,
                      service_toggles: { ...settings.service_toggles, [row.key]: v },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-base-500 uppercase tracking-wide mb-2">Paper formats</p>
          <div className="grid grid-cols-2 gap-2">
            {["A4", "A3", "Letter", "Legal"].map((size) => (
              <div key={size} className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3">
                <span className="text-sm">{size}</span>
                <Toggle
                  checked={settings.paper_format_visibility[size] !== false}
                  onChange={(v) =>
                    persist({
                      ...settings,
                      paper_format_visibility: { ...settings.paper_format_visibility, [size]: v },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border border-base-700 rounded-lg px-4 py-3">
          <div>
            <p className="font-medium text-sm">Allow customers to request stapling</p>
            <p className="text-xs text-base-500">Purely informational — printing must still be arranged manually</p>
          </div>
          <Toggle checked={!!settings.allow_stapling} onChange={(v) => persist({ ...settings, allow_stapling: v ? 1 : 0 })} />
        </div>
      </div>

      <div className="card p-4 sticky top-6">
        <p className="font-semibold text-sm mb-1">Live Portal Preview</p>
        <p className="text-xs text-base-500 mb-4">Updates instantly before saving</p>

        <div className="rounded-xl overflow-hidden border border-base-700">
          <div className="bg-accent-500 text-white p-4 flex items-center gap-2">
            <PrinterIcon size={16} />
            <div>
              <p className="font-semibold text-sm">{shopName}</p>
              <p className="text-xs opacity-80">Secure print order</p>
            </div>
          </div>
          <div className="p-4 bg-base-900 space-y-3">
            <div className="bg-base-850 border border-base-700 rounded-lg h-28 flex items-center justify-center">
              <FileText size={24} className="text-base-500" />
            </div>
            {enabledColorModes.length > 0 && (
              <div>
                <p className="text-xs text-base-500 mb-1">Color Mode</p>
                <div className="flex gap-1.5 flex-wrap">
                  {enabledColorModes.map((c) => (
                    <span key={c.key} className="text-xs border border-accent-500 text-accent-500 rounded-lg px-2 py-1">
                      {c.key === "black_white" ? "B&W" : "Color"}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {enabledSided.length > 0 && (
              <div>
                <p className="text-xs text-base-500 mb-1">Print Style</p>
                <div className="flex gap-1.5 flex-wrap">
                  {enabledSided.map((s) => (
                    <span key={s.key} className="text-xs border border-accent-500 text-accent-500 rounded-lg px-2 py-1">
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {enabledPapers.length > 0 && (
              <div>
                <p className="text-xs text-base-500 mb-1">Paper</p>
                <div className="flex gap-1.5 flex-wrap">
                  {enabledPapers.map(([size]) => (
                    <span key={size} className="text-xs border border-accent-500 text-accent-500 rounded-lg px-2 py-1">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button className="btn-primary w-full text-sm" disabled>
              Confirm Print Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
