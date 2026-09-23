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
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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

  // On mobile the drawer always shows the full (expanded) sidebar.
  const isCollapsed = collapsed && !mobileOpen;

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
        <Link href="/" className="text-lg font-bold tracking-tight whitespace-nowrap">
          Print<span className="text-accent-400">MyDoc</span>
        </Link>
        <ThemeToggle variant="icon" />
      </header>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${isCollapsed ? "md:w-[72px]" : "md:w-64"} w-72 max-w-[85vw] fixed inset-y-0 left-0 z-50 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0 md:z-auto h-full border-r border-base-700/60 flex flex-col shrink-0 transition-all duration-200 bg-base-850`}
      >
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 pt-5 pb-4`}>
          {!isCollapsed && (
            <Link href="/" className="text-lg font-bold tracking-tight whitespace-nowrap">
              Print<span className="text-accent-400">MyDoc</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex w-8 h-8 rounded-full items-center justify-center border border-base-700 hover:border-accent-500 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center border border-base-700 hover:border-accent-500 transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X size={15} />
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
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-accent-500 text-white" : "text-base-500 hover:bg-base-800 hover:text-ink"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
                {item.group && !isCollapsed && isActive && (
                  <div className="ml-4 pl-3 border-l border-base-700 my-1 flex flex-col gap-0.5">
                    {item.group.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
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
          {!isCollapsed && <p className="px-3 text-xs text-base-500 truncate mb-1">{shopEmail}</p>}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={16} />
            {!isCollapsed && "Log Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 md:h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
