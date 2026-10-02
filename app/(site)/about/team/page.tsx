import type { Metadata } from "next";
import { AboutNavigation, PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";

export const metadata: Metadata = { title: "專業團隊" };

export default function Page() {
  return <>
    <PageHeading title="專業團隊" parent={{ href: "/about", label: "關於我們" }} />
    <AboutNavigation current="/about/team" />
    <div className="site-container interior-content">
      <section aria-labelledby="team-members" className="team-section">
        <h2 id="team-members">團隊介紹</h2>
        <div className="team-grid">
          {[
            { role: "專任工程人員", qualification: "【待填：技師類別或證照名稱】" },
            { role: "工地主任", qualification: "【待填：證照名稱】" },
          ].map(({ role, qualification }) => <article className="team-member" key={role}>
            <PhotoPlaceholder description="本人同意使用的照片" className="team-portrait" sizes="(max-width: 767px) 100vw, 45vw" />
            <div className="team-member-heading"><h3><PlaceholderText text="【待填：姓名】" /></h3><p>{role}</p></div>
            <p><PlaceholderText text={qualification} /></p>
            {role === "專任工程人員" && <blockquote><PlaceholderText text="「我負責每一件工程的施工技術把關，……」【待填：本人寫或確認過的一句話】" /></blockquote>}
          </article>)}
        </div>
      </section>
      <PageSection id="experience" title="核心人員經歷">
        <h3><PlaceholderText text="【待填：姓名】過往任職經歷" /></h3>
        <p><PlaceholderText text="【待填：年份】～【待填：年份】任職於【待填：前公司】，參與【待填：工程類型】" /></p>
        <p className="content-notice">※ 以上為人員個人過往任職經歷，非本公司承攬工程。</p>
      </PageSection>
    </div>
  </>;
}
