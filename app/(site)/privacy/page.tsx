import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";

export const metadata: Metadata = { title: "隱私權政策" };

export default function Page() {
  return <>
    <PageHeading title="隱私權政策" />
    <div className="site-container interior-content privacy-content">
      <PageSection id="privacy-policy" title="政策內文">
        <div className="policy-placeholder"><p><PlaceholderText text="【待填：請法務或顧問依個資法撰寫；內容包含蒐集目的、資料類別、利用期間與方式、當事人權利、聯絡窗口。若導入 GA4，也要說明分析用 cookie】" /></p></div>
      </PageSection>
    </div>
  </>;
}
