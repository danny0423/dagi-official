import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { CompanyContact } from "@/components/company-contact";
import { PlaceholderText } from "@/components/placeholder-text";
import { isLaunched } from "@/lib/launch";
import type { SiteCompany } from "@/lib/site-data";

// 未開放的頁面（lib/launch.ts）不放進頁尾。
const footerLinks = [
  { href: "/privacy", label: "隱私權政策" },
  { href: "/careers", label: "人才招募" },
  { href: "/partners", label: "協力廠商合作" },
].filter(({ href }) => isLaunched(href));

export function SiteFooter({ company }: { company: SiteCompany }) {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-main">
          <div>
            <Link href="/" className="footer-brand"><PlaceholderText text={company.name} /></Link>
            <div className="footer-registration">
              <p>統一編號：<PlaceholderText text={company.taxId} /></p>
              <p>營造業登記證：<PlaceholderText text={company.license} /></p>
            </div>
          </div>
          <address className="footer-address">
            <p>地址：<PlaceholderText text={company.address} /></p>
            <p>電話：<CompanyContact kind="phone" company={company} /></p>
            <p>Email：<CompanyContact kind="email" company={company} /></p>
          </address>
          <Link href="/contact" className="footer-cta" data-cta="footer">工程洽詢<ArrowIcon diagonal /></Link>
        </div>
        <nav aria-label="頁尾導覽" className="footer-links">
          {footerLinks.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
          <a href={company.groupUrl}>隆磐建設官網<ArrowIcon diagonal /></a>
        </nav>
      </div>
    </footer>
  );
}
