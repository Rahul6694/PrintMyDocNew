"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import AdminLogoutButton from "./AdminLogoutButton";

const NAV_ITEMS = [
  { href: "/admin/shops", label: "Shops" },
  { href: "/admin/withdrawals", label: "Withdrawal Requests" },
  { href: "/admin/email-templates", label: "Email Templates" },
  { href: "/admin/contact-enquiries", label: "Contact Enquiries" },
];

export default function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden">
      <header className="md:hidden flex items-center justify-between gap-3 px-4 h-14 border-b border-base-700/60 bg-base-850 shrink-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>
        <p className="text-lg font-bold tracking-tight">
          Print<span className="text-accent-400">MyDoc</span>
        </p>
        <span className="w-9" />
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`w-64 max-w-[85vw] md:w-60 fixed inset-y-0 left-0 z-50 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0 md:z-auto h-full border-r border-base-700/60 flex flex-col p-5 shrink-0 bg-base-850 md:bg-transparent transition-transform duration-200`}
      >
        <div className="flex items-start justify-between gap-2 mb-8">
          <div>
            <p className="text-lg font-bold tracking-tight mb-1">
              Print<span className="text-accent-400">MyDoc</span>
            </p>
            <p className="text-xs text-base-500">Super Admin</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 text-sm flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith(item.href) ? "bg-base-800 text-ink" : "hover:bg-base-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-base-500 border-t border-base-700/60 pt-4 mt-4">
          <p className="truncate">{email}</p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0 min-h-0 md:h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
