import Link from "next/link";
import { company } from "@/lib/placeholder-company";
import { ArrowIcon } from "@/components/arrow-icon";
import { CompanyContact } from "@/components/company-contact";
import { PlaceholderText } from "@/components/placeholder-text";

export function SiteFooter() {
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
            <p>電話：<CompanyContact kind="phone" /></p>
            <p>Email：<CompanyContact kind="email" /></p>
          </address>
          <Link href="/contact" className="footer-cta" data-cta="footer">工程洽詢<ArrowIcon diagonal /></Link>
        </div>
        <nav aria-label="頁尾導覽" className="footer-links">
          <Link href="/privacy">隱私權政策</Link>
          <Link href="/careers">人才招募</Link>
          <Link href="/partners">協力廠商合作</Link>
          <a href={company.groupUrl}>隆磐建設官網<ArrowIcon diagonal /></a>
        </nav>
      </div>
    </footer>
  );
}
