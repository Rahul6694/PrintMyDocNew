import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/adminAuth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
