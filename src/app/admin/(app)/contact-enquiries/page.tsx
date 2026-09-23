"use client";

import { useEffect, useState } from "react";

type Enquiry = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  status: string;
  created_at: string;
};

export default function ContactEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/contact-enquiries");
    if (res.ok) setEnquiries((await res.json()).enquiries);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: number, status: string) {
    await fetch("/api/admin/contact-enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Contact Enquiries</h1>
      <p className="text-base-500 text-sm mb-6">Submissions from the landing page contact form</p>

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : enquiries.length === 0 ? (
        <div className="card p-6 sm:p-10 text-center text-base-500">No enquiries yet.</div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-xs text-base-500">
                    {e.email || "no email"} · {e.phone || "no phone"} · {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
                <select
                  value={e.status}
                  onChange={(ev) => updateStatus(e.id, ev.target.value)}
                  className="input-field w-32 text-xs py-1.5"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <p className="text-sm whitespace-pre-wrap">{e.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
