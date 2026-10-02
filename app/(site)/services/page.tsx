import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { InquiryLink, PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { company } from "@/lib/placeholder-company";

export const metadata: Metadata = { title: "承攬業務" };

export default function Page() {
  return <>
    <PageHeading title="承攬業務" />
    <div className="site-container interior-content">
      <section aria-labelledby="service-types" className="service-types-section">
        <h2 id="service-types" className="sr-only">業務項目</h2>
        {[
          ["民間建築工程", "承攬建設公司委託的集合住宅、透天與商辦新建工程。開工前提出施工計畫與預定進度表，施工期間定期回報進度，並配合起造人辦理各階段勘驗。", "建設公司、起造人"],
          ["公共工程", "依政府採購法參與【待填：實際參與的工程類型，例：建築、土木】類標案，依規定建立品管與工安制度。", "政府機關、學校、公營事業"],
          ["危老重建營造", "配合起造人與地主，從拆除、新建到取得使用執照。危老案住戶的期待高，我們特別重視施工期間的鄰房保護與溝通。", "危老案起造人、地主"],
        ].map(([title, description, audience]) => <article className="service-detail" key={title}><h3>{title}</h3><div><p><PlaceholderText text={description} /></p><p className="service-audience">適合：{audience}</p></div></article>)}
      </section>
      <PageSection id="contract-scope" title="承攬範圍說明">
        <p><PlaceholderText text={`依營造業法，本公司為綜合營造業${company.grade}，承攬工程規模依法令規定的等級上限辦理。`} /></p>
        <p><PlaceholderText text="【待填：目前等級可以承攬的上限，以主管機關現行規定為準】" /></p>
      </PageSection>
      <PageSection id="process" title="合作流程">
        <ol className="process-list">
          {[
            ["需求洽詢", "提供圖說、地點與預定工期"],
            ["估價與施工規劃", "【待填：估價大約需要的時間】內提出估價單與初步施工計畫"],
            ["簽約與開工", "確認合約、保險與工安計畫後開工"],
            ["施工管理與交屋", "定期回報進度，完工後配合驗收與使用執照"],
          ].map(([title, description]) => <li key={title}><h3>{title}</h3><p><PlaceholderText text={description} /></p></li>)}
        </ol>
      </PageSection>
      <div className="interior-cta"><InquiryLink location="services" /></div>
    </div>
  </>;
}
