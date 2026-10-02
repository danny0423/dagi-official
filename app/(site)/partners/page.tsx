import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { InquiryForm } from "@/components/inquiry-form";
import { PlaceholderText } from "@/components/placeholder-text";

export const metadata: Metadata = { title: "協力廠商合作" };

export default function Page() {
  return <>
    <PageHeading title="協力廠商合作" />
    <div className="site-container interior-content">
      <PageSection id="partner-introduction" title="合作說明"><p className="interior-lead"><PlaceholderText text="我們長期徵求以下工種的協力廠商：【待填：實際需要的工種，例：鋼筋、模板、水電】。" /></p></PageSection>
      <PageSection id="partner-registration" title="登記表單"><InquiryForm kind="partner" /></PageSection>
    </div>
  </>;
}
