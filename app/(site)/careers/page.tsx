import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";

export const metadata: Metadata = { title: "人才招募" };

export default function Page() {
  return <>
    <PageHeading title="人才招募" />
    <div className="site-container interior-content">
      <PageSection id="open-positions" title="招募職缺">
        <article className="job-opening">
          <p><PlaceholderText text="【待填：確認此職缺是否開放招募】" /></p>
          <div className="job-heading"><h3>工地主任</h3><p><PlaceholderText text="【待填：工作地點】" /></p></div>
          <p><PlaceholderText text="負責工地現場管理、進度與品質控管。需要具備【待填：資格條件】。" /></p>
          <div className="job-apply"><button type="button" className="button-primary" disabled aria-describedby="job-link-notice">前往投遞</button><p id="job-link-notice"><PlaceholderText text="【待填：人力銀行連結】" /></p></div>
        </article>
      </PageSection>
      <PageSection id="benefits" title="福利與工作環境"><p className="interior-lead"><PlaceholderText text="【待填：實際提供的福利】" /></p></PageSection>
    </div>
  </>;
}
