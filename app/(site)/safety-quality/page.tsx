import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { requireLaunched } from "@/lib/preview";
import { getSiteCompany } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/safety-quality",
    title: "工安與品質管理",
    description: `${company.name}的工安政策與品質管理制度，說明工地安全管理與施工品質檢查的做法。`,
  });
}

export default async function Page() {
  await requireLaunched("/safety-quality");
  return <>
    <PageHeading path="/safety-quality" title="工安與品質管理" />
    <div className="site-container interior-content">
      <PageSection id="safety-policy" title="工安政策">
        <p className="interior-lead">我們相信沒有任何工期比人命重要。</p>
        <p>每個工地開工前都辦理危害辨識與安全教育訓練，並每天進行工具箱會議（開工前的安全宣導）。</p>
        <p><PlaceholderText text="【待填：公司實際的職業安全衛生管理制度名稱或做法】" /></p>
      </PageSection>
      <PageSection id="quality-management" title="品質管理">
        <p>依工程規模建立品管計畫，材料進場與各施工階段都有自主檢查表，紀錄保存備查。</p>
        <p><PlaceholderText text="【待填：實際的品管流程或系統】" /></p>
      </PageSection>
      <PageSection id="safety-record" title="工安紀錄"><div className="record-placeholder concrete"><PlaceholderText text="【待填：連續無災害工時，或其他可查證的工安紀錄】" /></div></PageSection>
    </div>
  </>;
}
