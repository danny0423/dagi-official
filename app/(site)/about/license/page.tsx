import type { Metadata } from "next";
import { AboutNavigation, PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";
import { requireLaunched } from "@/lib/launch";
import { getPublicCertifications, getSiteCompany } from "@/lib/site-data";
import { formatDisplayDate } from "@/lib/site-data/format";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/about/license",
    title: "營造業登記與資格",
    description: `${company.name}的營造業登記資料、證照與認證，以及到主管機關查詢系統核對登記資料的方式，供招標機關與建商採購審查。`,
  });
}

export default async function Page() {
  requireLaunched("/about/license");
  // 證照：已上架且未過期（有效期限空白＝無期限），見 lib/site-data 的 getPublicCertifications()
  const [company, certifications] = await Promise.all([getSiteCompany(), getPublicCertifications()]);
  const rows = [
    ["公司名稱", company.name], ["統一編號", company.taxId],
    ["營造業類別與等級", `綜合營造業${company.grade}`],
    ["營造業登記證字號", company.license], ["登記機關", company.registrationAuthority],
    ["資本額", company.capital], ["負責人", company.representative],
  ];
  return <>
    <PageHeading path="/about/license" title="營造業登記與資格" parent={{ href: "/about", label: "關於我們" }} />
    <AboutNavigation current="/about/license" />
    <div className="site-container interior-content">
      <PageSection id="registration" title="登記資料表">
        <table className="registration-table"><caption className="sr-only">公司營造業登記資料</caption><tbody>
          {rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td><PlaceholderText text={value} /></td></tr>)}
        </tbody></table>
      </PageSection>
      <PageSection id="certifications" title="證照與認證">
        {certifications.map((certification) => <article className="certificate-card" key={certification.id}>
          {certification.image && <PhotoPlaceholder description="證照影本" sizes="(max-width: 767px) 100vw, 50vw"
            photo={{ src: certification.image.url, alt: certification.image.alt || `${certification.name}證書` }} />}
          <h3>{certification.name}</h3>
          <dl className="detail-list">
            {[
              ["發證單位", certification.issuer],
              ["證書字號", certification.certificateNumber],
              ["有效期限", certification.expiresOn ? formatDisplayDate(certification.expiresOn) : "無期限"],
              ["備註", certification.note],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </article>)}
        {certifications.length === 0 && ( // check-launch: fallback certifications
          <article className="certificate-card">
            <h3><PlaceholderText text="【待填：證照或認證名稱】" /></h3>
            <dl className="detail-list"><div><dt>發證單位</dt><dd><PlaceholderText text="【待填：發證單位】" /></dd></div><div><dt>有效期限</dt><dd><PlaceholderText text="【待填：有效期限】" /></dd></div></dl>
          </article>
        )}
      </PageSection>
      <PageSection id="verification" title="查驗說明"><p><PlaceholderText text="本公司登記資料可於主管機關的營造業查詢系統查詢：【待填：查詢網站正式名稱與網址】" /></p></PageSection>
    </div>
  </>;
}
