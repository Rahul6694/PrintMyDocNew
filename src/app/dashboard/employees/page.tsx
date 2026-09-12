"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/employees");
    if (res.ok) setEmployees((await res.json()).employees);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to add employee");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setShowForm(false);
    load();
  }

  async function toggleActive(id: number, isActive: boolean) {
    await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    load();
  }

  async function removeEmployee(id: number) {
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-base-500 text-sm">Assign operational access to your staff</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-1.5">
          <UserPlus size={15} /> Add employee
        </button>
      </div>

      {showForm && (
        <form onSubmit={addEmployee} className="card p-5 mb-6 max-w-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="input-field" />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              className="input-field"
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Adding..." : "Add employee"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-base-500 text-sm">Loading...</p>
      ) : employees.length === 0 ? (
        <div className="card p-10 text-center text-base-500 flex flex-col items-center gap-2">
          <ShieldCheck size={28} className="text-base-600" />
          <p className="font-semibold text-ink">No employee accounts yet</p>
          <p className="text-sm">The merchant owner keeps full access.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-base-500 border-b border-base-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-base-700/40 last:border-0">
                  <td className="px-4 py-3">{e.name}</td>
                  <td className="px-4 py-3 text-base-500">{e.email}</td>
                  <td className="px-4 py-3 capitalize">{e.role}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${e.is_active ? "bg-success/10 text-success border border-success/30" : "bg-base-700 text-base-500"}`}>
                      {e.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => toggleActive(e.id, !e.is_active)}
                      className="text-xs font-semibold border border-base-700 rounded-lg px-2.5 py-1.5 hover:border-accent-500"
                    >
                      {e.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => removeEmployee(e.id)}
                      className="text-xs font-semibold border border-danger/40 text-danger rounded-lg px-2.5 py-1.5 hover:bg-danger/10"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
