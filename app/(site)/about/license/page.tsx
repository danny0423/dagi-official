import type { Metadata } from "next";
import { AboutNavigation, PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { company } from "@/lib/placeholder-company";

export const metadata: Metadata = { title: "營造業登記與資格" };

export default function Page() {
  const rows = [
    ["公司名稱", company.name], ["統一編號", company.taxId],
    ["營造業類別與等級", `綜合營造業${company.grade}`],
    ["營造業登記證字號", company.license], ["登記機關", company.registrationAuthority],
    ["資本額", company.capital], ["負責人", company.representative],
  ];
  return <>
    <PageHeading title="營造業登記與資格" parent={{ href: "/about", label: "關於我們" }} />
    <AboutNavigation current="/about/license" />
    <div className="site-container interior-content">
      <PageSection id="registration" title="登記資料表">
        <table className="registration-table"><caption className="sr-only">公司營造業登記資料</caption><tbody>
          {rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td><PlaceholderText text={value} /></td></tr>)}
        </tbody></table>
      </PageSection>
      <PageSection id="certifications" title="證照與認證">
        <article className="certificate-card">
          <h3><PlaceholderText text="【待填：證照或認證名稱】" /></h3>
          <dl className="detail-list"><div><dt>發證單位</dt><dd><PlaceholderText text="【待填：發證單位】" /></dd></div><div><dt>有效期限</dt><dd><PlaceholderText text="【待填：有效期限】" /></dd></div></dl>
        </article>
      </PageSection>
      <PageSection id="verification" title="查驗說明"><p><PlaceholderText text="本公司登記資料可於主管機關的營造業查詢系統查詢：【待填：查詢網站正式名稱與網址】" /></p></PageSection>
    </div>
  </>;
}
