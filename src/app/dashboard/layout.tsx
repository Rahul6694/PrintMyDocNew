import { redirect } from "next/navigation";
import { getCurrentShop } from "@/lib/auth";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const shop = await getCurrentShop();
  if (!shop) redirect("/login");

  return <DashboardShell shopEmail={shop.email}>{children}</DashboardShell>;
}
