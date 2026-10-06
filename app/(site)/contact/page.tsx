import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { InquiryForm } from "@/components/inquiry-form";
import { CompanyContact } from "@/components/company-contact";
import { PlaceholderText } from "@/components/placeholder-text";
import { requireLaunched } from "@/lib/launch";
import { getSiteCompany } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/contact",
    title: "聯絡我們／工程洽詢",
    description: `向${company.name}提出工程洽詢：填寫工程地點、類型與預估規模，並查看公司地址與聯絡資訊。`,
  });
}

export default async function Page() {
  requireLaunched("/contact");
  const company = await getSiteCompany();
  return <>
    <PageHeading path="/contact" title="聯絡我們／工程洽詢" />
    <div className="site-container interior-content">
      <PageSection id="inquiry" title="洽詢表單"><InquiryForm kind="engineering" responseTime={company.responseTime} /></PageSection>
      <PageSection id="company-location" title="公司資訊與地圖">
        <address className="company-info"><dl className="detail-list">
          <div><dt>公司地址</dt><dd><PlaceholderText text={company.address} /></dd></div>
          <div><dt>電話</dt><dd><CompanyContact kind="phone" company={company} /></dd></div>
          <div><dt>傳真</dt><dd><PlaceholderText text={company.fax} /></dd></div>
          <div><dt>Email</dt><dd><CompanyContact kind="email" company={company} /></dd></div>
          <div><dt>服務時間</dt><dd><PlaceholderText text={company.serviceHours} /></dd></div>
        </dl></address>
        <div className="map-placeholder concrete"><PlaceholderText text="【待填：嵌入 Google 地圖】" /></div>
      </PageSection>
    </div>
  </>;
}
