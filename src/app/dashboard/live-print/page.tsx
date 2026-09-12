"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Printer as PrinterIcon, Wifi } from "lucide-react";

type Job = {
  id: number;
  status: string;
  is_test: number;
  order_number: string | null;
  customer_name: string | null;
  file_name: string | null;
  printer_name: string | null;
};

export default function LivePrintPage() {
  const [workingPrinters, setWorkingPrinters] = useState(0);
  const [printingNow, setPrintingNow] = useState(0);
  const [waitingToPrint, setWaitingToPrint] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState<"all" | "errors">("all");

  async function load() {
    const res = await fetch("/api/live-print");
    if (res.ok) {
      const data = await res.json();
      setWorkingPrinters(data.workingPrinters);
      setPrintingNow(data.printingNow);
      setWaitingToPrint(data.waitingToPrint);
      setJobs(data.jobs);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (alertFilter === "errors" && j.status !== "failed") return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        j.order_number?.toLowerCase().includes(q) ||
        j.customer_name?.toLowerCase().includes(q) ||
        j.file_name?.toLowerCase().includes(q) ||
        (j.is_test && "test print".includes(q))
      );
    });
  }, [jobs, search, alertFilter]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Print</h1>
          <p className="text-base-500 text-sm">Real printer assignments and queues · refreshes every 3 seconds</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, name, mobile or document"
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-base-500">Printer alerts</span>
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value as "all" | "errors")}
            className="input-field w-40 py-1.5"
          >
            <option value="all">Show all</option>
            <option value="errors">Errors only</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-2xl">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-base-500 uppercase tracking-wide">Working printers</p>
            <Wifi size={14} className="text-success" />
          </div>
          <p className="text-2xl font-bold">{workingPrinters}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-base-500 uppercase tracking-wide">Printing now</p>
            <PrinterIcon size={14} className="text-accent-400" />
          </div>
          <p className="text-2xl font-bold">{printingNow}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-base-500 uppercase tracking-wide mb-1">Waiting to print</p>
          <p className="text-2xl font-bold">{waitingToPrint}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : filteredJobs.length === 0 ? (
        <div className="card p-10 text-center text-base-500 max-w-2xl flex flex-col items-center gap-2">
          <PrinterIcon size={26} className="text-base-600" />
          <p className="font-semibold text-ink">
            {jobs.length === 0 ? "No working printers online" : "No jobs match your filters"}
          </p>
          <p className="text-sm">Start the local agent or check Business Setup → Printers.</p>
        </div>
      ) : (
        <div className="card overflow-hidden max-w-2xl">
          <table className="w-full text-sm">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Printer</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((j) => (
                <tr key={j.id} className="border-b border-base-700/40 last:border-0">
                  <td className="px-4 py-3">
                    {j.is_test ? (
                      <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30">Test print</span>
                    ) : (
                      <>
                        <p className="font-mono text-xs">{j.order_number}</p>
                        <p className="text-base-500 text-xs">{j.customer_name}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">{j.printer_name || "Unassigned"}</td>
                  <td className="px-4 py-3 capitalize">{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
