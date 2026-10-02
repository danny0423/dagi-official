import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminUser } from "@/lib/admin/guard";
import { roleLabel } from "@/lib/admin/format";
import { AdminSidebar } from "@/app/admin/_components/sidebar";

// 需要登入的後台頁面共用外框：側邊選單、目前使用者、登出。
// layout 在換頁時不一定重跑，所以每個頁面仍要自己呼叫 requireAdmin()/requireRole()。
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const [settings, newInquiries, newVendors] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: 1 }, select: { name: true } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.vendorApplication.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="adm-layout">
      <AdminSidebar
        siteName={settings?.name ?? "網站後台"}
        user={{ name: user.name, email: user.email, role: user.role, roleLabel: roleLabel[user.role] }}
        inboxCounts={{ inquiries: newInquiries, vendors: newVendors }}
      />
      <main className="adm-main">{children}</main>
    </div>
  );
}
