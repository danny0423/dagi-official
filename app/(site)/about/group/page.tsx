import type { Metadata } from "next";
import { AboutNavigation, PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { ArrowIcon } from "@/components/arrow-icon";
import { requireLaunched } from "@/lib/launch";
import { getSiteCompany } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/about/group",
    title: "集團關係",
    description: `說明${company.name}與隆磐建設的關係與分工，並提供隆磐建設官網連結。`,
  });
}

export default async function Page() {
  requireLaunched("/about/group");
  const company = await getSiteCompany();
  return <>
    <PageHeading path="/about/group" title="集團關係" parent={{ href: "/about", label: "關於我們" }} />
    <AboutNavigation current="/about/group" />
    <div className="site-container interior-content">
      <PageSection id="relationship" title="關係說明">
        <p className="interior-lead"><PlaceholderText text={`${company.name}由 隆磐建設【待填：投資成立／轉投資／關係企業，以實際法律關係為準】。`} /></p>
        <p><PlaceholderText text="【待填：一段說明成立營造公司的目的，例如讓 隆磐 的建案從規劃到施工由同一個團隊負責。需 隆磐 確認文字】" /></p>
      </PageSection>
      <PageSection id="responsibilities" title="分工示意">
        <div className="responsibility-grid">
          <article><h3>隆磐建設</h3><p><PlaceholderText text="【待填：土地開發、規劃設計、銷售之分工，需隆磐確認】" /></p></article>
          <article><h3><PlaceholderText text={company.shortName} /></h3><p><PlaceholderText text="【待填：施工營造、品質管理、交屋前驗收之分工，需確認】" /></p></article>
        </div>
        <a href={company.groupUrl} className="text-link" data-cta="group-website">前往隆磐建設官網<ArrowIcon diagonal /></a>
      </PageSection>
    </div>
  </>;
}
