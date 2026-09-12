"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  Circle,
  Hourglass,
  Printer,
  XCircle,
  CheckSquare,
  ListOrdered,
  Activity,
  MessageCircle,
  Archive,
  Coins,
  IndianRupee,
  Share2,
  Users,
  Bot,
  Building2,
  QrCode,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const ORDER_SUB_ITEMS = [
  { href: "/dashboard/orders?status=pending", label: "Pending", icon: Circle },
  { href: "/dashboard/orders?status=processing", label: "Processing", icon: Hourglass },
  { href: "/dashboard/orders?status=printing", label: "Printing", icon: Printer },
  { href: "/dashboard/orders?status=rejected", label: "Rejected", icon: XCircle },
  { href: "/dashboard/orders?status=print_failed", label: "Print Failed", icon: XCircle },
  { href: "/dashboard/orders?status=done", label: "Done", icon: CheckSquare },
  { href: "/dashboard/orders?status=all", label: "All Orders", icon: ListOrdered },
];

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/dashboard/orders", label: "Orders", icon: Inbox, group: ORDER_SUB_ITEMS },
  { href: "/dashboard/live-print", label: "Live Print", icon: Activity },
  { href: "/dashboard/whatsapp", label: "WhatsApp Setup", icon: MessageCircle },
  { href: "/dashboard/storage", label: "Storage", icon: Archive },
  { href: "/dashboard/credits", label: "Credits", icon: Coins },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: IndianRupee },
  { href: "/dashboard/referrals", label: "Referrals", icon: Share2 },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/train-bot", label: "Train Bot", icon: Bot },
  { href: "/dashboard/business-setup", label: "Business Setup", icon: Building2 },
  { href: "/dashboard/qr", label: "Shop QR", icon: QrCode },
];

export default function DashboardShell({
  shopEmail,
  children,
}: {
  shopEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("pmd-sidebar-collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pmd-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        className={`${
          collapsed ? "w-[72px]" : "w-64"
        } h-full border-r border-base-700/60 flex flex-col shrink-0 transition-all duration-150 bg-base-850`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 pt-5 pb-4`}>
          {!collapsed && (
            <Link href="/" className="text-lg font-bold tracking-tight whitespace-nowrap">
              Print<span className="text-accent-400">MyDoc</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-accent-500 text-white" : "text-base-500 hover:bg-base-800 hover:text-ink"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
                {item.group && !collapsed && isActive && (
                  <div className="ml-4 pl-3 border-l border-base-700 my-1 flex flex-col gap-0.5">
                    {item.group.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-base-500 hover:bg-base-800 hover:text-ink transition-colors"
                        >
                          <SubIcon size={14} className="shrink-0" />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-base-700/60 p-3 flex flex-col gap-1">
          {!collapsed && <p className="px-3 text-xs text-base-500 truncate mb-1">{shopEmail}</p>}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={16} />
            {!collapsed && "Log Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden p-8">{children}</main>
    </div>
  );
}
