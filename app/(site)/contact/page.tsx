import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { InquiryForm } from "@/components/inquiry-form";
import { CompanyContact } from "@/components/company-contact";
import { PlaceholderText } from "@/components/placeholder-text";
import { company } from "@/lib/placeholder-company";

export const metadata: Metadata = { title: "聯絡我們／工程洽詢" };

export default function Page() {
  return <>
    <PageHeading title="聯絡我們／工程洽詢" />
    <div className="site-container interior-content">
      <PageSection id="inquiry" title="洽詢表單"><InquiryForm kind="engineering" /></PageSection>
      <PageSection id="company-location" title="公司資訊與地圖">
        <address className="company-info"><dl className="detail-list">
          <div><dt>公司地址</dt><dd><PlaceholderText text={company.address} /></dd></div>
          <div><dt>電話</dt><dd><CompanyContact kind="phone" /></dd></div>
          <div><dt>傳真</dt><dd><PlaceholderText text={company.fax} /></dd></div>
          <div><dt>Email</dt><dd><CompanyContact kind="email" /></dd></div>
          <div><dt>服務時間</dt><dd><PlaceholderText text={company.serviceHours} /></dd></div>
        </dl></address>
        <div className="map-placeholder concrete"><PlaceholderText text="【待填：嵌入 Google 地圖】" /></div>
      </PageSection>
    </div>
  </>;
}
