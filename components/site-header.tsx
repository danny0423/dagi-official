import Link from "next/link";
import { PlaceholderText } from "@/components/placeholder-text";
import { SiteNavigation } from "@/components/site-navigation";
import type { SiteCompany } from "@/lib/site-data";

export function SiteHeader({ company }: { company: SiteCompany }) {
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Link href="/" className="site-brand" aria-label={`${company.name}，回首頁`}>
          <span className="brand-name"><PlaceholderText text={company.shortName} /></span>
          <span className="brand-descriptor">綜合營造業</span>
        </Link>
        <SiteNavigation />
      </div>
    </header>
  );
}
