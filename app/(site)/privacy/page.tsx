import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { requireLaunched } from "@/lib/launch";
import { company } from "@/lib/placeholder-company";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "隱私權政策",
  description: `${company.name}網站的隱私權政策，說明透過表單蒐集個人資料的目的、類別、利用方式與當事人權利。`,
});

export default function Page() {
  requireLaunched("/privacy");
  return <>
    <PageHeading path="/privacy" title="隱私權政策" />
    <div className="site-container interior-content privacy-content">
      <PageSection id="privacy-policy" title="政策內文">
        <div className="policy-placeholder"><p><PlaceholderText text="【待填：請法務或顧問依個資法撰寫；內容包含蒐集目的、資料類別、利用期間與方式、當事人權利、聯絡窗口。若導入 GA4，也要說明分析用 cookie】" /></p></div>
      </PageSection>
    </div>
  </>;
}
