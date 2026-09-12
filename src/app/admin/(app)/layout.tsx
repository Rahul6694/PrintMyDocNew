import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/adminAuth";
import AdminLogoutButton from "./AdminLogoutButton";

const NAV_ITEMS = [
  { href: "/admin/shops", label: "Shops" },
  { href: "/admin/withdrawals", label: "Withdrawal Requests" },
  { href: "/admin/email-templates", label: "Email Templates" },
  { href: "/admin/contact-enquiries", label: "Contact Enquiries" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-60 h-full border-r border-base-700/60 flex flex-col p-5 shrink-0">
        <p className="text-lg font-bold tracking-tight mb-1">
          Print<span className="text-accent-400">MyDoc</span>
        </p>
        <p className="text-xs text-base-500 mb-8">Super Admin</p>
        <nav className="flex flex-col gap-1 text-sm flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-2 rounded-lg hover:bg-base-800 transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-base-500 border-t border-base-700/60 pt-4 mt-4">
          <p className="truncate">{admin.email}</p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 h-full overflow-y-auto p-8">{children}</main>
    </div>
  );
}
