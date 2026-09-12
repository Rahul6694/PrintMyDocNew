import { X, Check } from "lucide-react";

const ROWS = [
  {
    stage: "Customer intake",
    manual: "Files scattered across chats and devices",
    automated: "WhatsApp, QR and the order page feed one queue",
  },
  {
    stage: "Print settings",
    manual: "Staff asks for copies, colour and paper manually",
    automated: "Customer confirms settings themselves before paying",
  },
  {
    stage: "Pricing",
    manual: "Page counting and quotes calculated by hand",
    automated: "Your configured rates price every order automatically",
  },
  {
    stage: "Queue control",
    manual: "Verbal coordination and printer-by-printer checking",
    automated: "Dashboard tracks pending, printing and completed work",
  },
  {
    stage: "Printing",
    manual: "Download, open dialogs and repeat settings for every file",
    automated: "One click sends the print-ready file to your connected local agent",
  },
];

export default function ComparisonTable() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/30 mb-4">Manual vs automated</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">One counter. Two completely different workflows.</h2>
        <p className="text-base-500">
          Manual printing depends on repeated questions, downloads, and staff memory. PrintMyDoc turns the
          same work into a traceable order from upload to printer.
        </p>
      </div>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-base-500 border-b border-base-700/60">
            <tr>
              <th className="px-5 py-4 font-medium">Stage</th>
              <th className="px-5 py-4 font-medium">
                <span className="flex items-center gap-1.5 text-danger">
                  <X size={14} /> Manual printing
                </span>
              </th>
              <th className="px-5 py-4 font-medium">
                <span className="flex items-center gap-1.5 text-success">
                  <Check size={14} /> PrintMyDoc
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.stage} className="border-b border-base-700/40 last:border-0">
                <td className="px-5 py-4 font-semibold whitespace-nowrap">{r.stage}</td>
                <td className="px-5 py-4 text-base-500">{r.manual}</td>
                <td className="px-5 py-4">{r.automated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
