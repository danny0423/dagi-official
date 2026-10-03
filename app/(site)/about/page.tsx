import type { Metadata } from "next";
import { AboutNavigation, PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { company } from "@/lib/placeholder-company";
import { requireLaunched } from "@/lib/launch";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "關於我們",
  description: `${company.name}的公司簡介、經營理念與大事記，說明我們如何由內部工務團隊統一管理營造施工，讓業主只需要對一個窗口。`,
});

export default function Page() {
  requireLaunched("/about");
  return <>
    <PageHeading path="/about" title="關於我們" />
    <AboutNavigation current="/about" />
    <div className="site-container interior-content">
      <PageSection id="introduction" title="公司簡介">
        <p className="interior-lead"><PlaceholderText text={`${company.name}成立於${company.founded}年，是登記於${company.registeredCity}的綜合營造業。`} /></p>
        <p>我們專注在中小型集合住宅與危老重建的營造施工。從開工前的施工計畫，到結構、裝修、取得使用執照，都由公司內部的工務團隊統一管理，讓業主只需要對一個窗口。</p>
      </PageSection>
      <PageSection id="philosophy" title="經營理念">
        <div className="editorial-list">
          {[
            ["說到做到", "合約寫的工期與規格，就是我們的底線。"],
            ["現場為本", "主管每週都到工地，問題在現場解決。"],
            ["長期合作", "我們希望每位業主下一個案子還會找我們。"],
          ].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </PageSection>
      <PageSection id="milestones" title="大事記">
        <ol className="milestone-list">
          <li><span><PlaceholderText text="【待填：年份】" /></span><p><PlaceholderText text="公司成立，取得【待填：等級】綜合營造業登記" /></p></li>
          <li><span><PlaceholderText text="【待填：年份】" /></span><p><PlaceholderText text="【待填：第一件承攬工程開工，沒有就不寫】" /></p></li>
        </ol>
      </PageSection>
    </div>
  </>;
}
