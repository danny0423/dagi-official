import Link from "next/link";
import { PlaceholderText } from "@/components/placeholder-text";
import { SiteNavigation } from "@/components/site-navigation";
import { getAdminUser } from "@/lib/admin/guard";
import type { SiteCompany } from "@/lib/site-data";

export async function SiteHeader({ company }: { company: SiteCompany }) {
  // 只有已登入後台的人看得到「後台管理」；一般訪客沒有 session cookie，不會查資料庫
  const adminUser = await getAdminUser();
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Link href="/" className="site-brand" aria-label={`${company.name}，回首頁`}>
          <span className="brand-name"><PlaceholderText text={company.shortName} /></span>
          <span className="brand-descriptor">綜合營造業</span>
        </Link>
        <div className="header-actions">
          <SiteNavigation />
          {adminUser && <Link href="/admin" className="header-admin-link" prefetch={false}>後台管理</Link>}
        </div>
      </div>
    </header>
  );
}
