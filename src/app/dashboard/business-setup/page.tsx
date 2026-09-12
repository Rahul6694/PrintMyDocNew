"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Building2, FileText, PercentCircle, Printer, SlidersHorizontal, Zap } from "lucide-react";
import BusinessProfileTab from "./BusinessProfileTab";
import PricingTab from "./PricingTab";
import DiscountsTab from "./DiscountsTab";
import PrintersTab from "./PrintersTab";
import CustomerPortalTab from "./CustomerPortalTab";
import AutomationPaymentTab from "./AutomationPaymentTab";

const TABS = [
  { key: "profile", label: "Business Profile", icon: Building2 },
  { key: "pricing", label: "Pricing", icon: FileText },
  { key: "discounts", label: "Discounts", icon: PercentCircle },
  { key: "printers", label: "Printers", icon: Printer },
  { key: "portal", label: "Customer Portal", icon: SlidersHorizontal },
  { key: "automation", label: "Automation & Payment", icon: Zap },
];

const TAB_DESCRIPTIONS: Record<string, string> = {
  profile: "Shop identity and customer print services",
  pricing: "Configure per-page rates for each print type",
  discounts: "Bulk-order and additional-copy discounts",
  printers: "Add printers, review detected capabilities, and control order routing",
  portal: "Control what customers can select when ordering",
  automation: "Automation preferences and payment configuration",
};

export default function BusinessSetupPage() {
  const [tab, setTab] = useState("profile");
  const [printerCount, setPrinterCount] = useState(0);

  useEffect(() => {
    fetch("/api/business/printers")
      .then((r) => r.json())
      .then((data) => setPrinterCount(data.printers?.length || 0))
      .catch(() => {});
  }, []);

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-base-500 uppercase tracking-wide font-semibold">Business Setup</p>
            <span className="badge bg-success/10 text-success border border-success/30">
              <CheckCircle2 size={12} /> Valid
            </span>
          </div>
          <h1 className="text-2xl font-bold">{active.label}</h1>
          <p className="text-base-500 text-sm mt-1">{TAB_DESCRIPTIONS[tab]}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-active={tab === t.key}
              className="pill-tab flex items-center gap-2 px-3.5 py-2"
            >
              {t.key === "printers" && printerCount > 0 ? (
                <span className="w-4 h-4 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {printerCount}
                </span>
              ) : (
                <CheckCircle2 size={14} className={tab === t.key ? "text-white" : "text-success"} />
              )}
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && <BusinessProfileTab />}
      {tab === "pricing" && <PricingTab />}
      {tab === "discounts" && <DiscountsTab />}
      {tab === "printers" && <PrintersTab />}
      {tab === "portal" && <CustomerPortalTab />}
      {tab === "automation" && <AutomationPaymentTab />}
    </div>
  );
}
