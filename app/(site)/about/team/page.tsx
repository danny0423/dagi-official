import type { Metadata } from "next";
import { Fragment } from "react";
import { MultilineText } from "@/components/multiline-text";
import { AboutNavigation, PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";
import { requireLaunched } from "@/lib/launch";
import { getPublicTeamMembers, getSiteCompany } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/about/team",
    title: "專業團隊",
    description: `${company.name}的專任工程人員、工地主任等核心技術人員介紹與資格。`,
  });
}

export default async function Page() {
  requireLaunched("/about/team");
  // 只有「已上架」且「已取得同意公開」的成員（lib/content.ts 的 publicTeamMemberWhere）；一個都沒有時顯示待填範例
  const members = await getPublicTeamMembers();
  const experienced = members.filter((member) => member.experience);
  return <>
    <PageHeading path="/about/team" title="專業團隊" parent={{ href: "/about", label: "關於我們" }} />
    <AboutNavigation current="/about/team" />
    <div className="site-container interior-content">
      <section aria-labelledby="team-members" className="team-section">
        <h2 id="team-members">團隊介紹</h2>
        <div className="team-grid">
          {members.map((member) => <article className="team-member" key={member.id}>
            {member.photo && <PhotoPlaceholder description="本人同意使用的照片" className="team-portrait" sizes="(max-width: 767px) 100vw, 45vw"
              photo={{ src: member.photo.url, alt: member.photo.alt || `${member.name}照片` }} />}
            <div className="team-member-heading"><h3>{member.name}</h3>{member.title && <p>{member.title}</p>}</div>
            {member.licenses.length > 0 && <ul className="team-licenses" aria-label={`${member.name}的證照`}>{member.licenses.map((license, index) => <li key={index}>{license}</li>)}</ul>}
            {member.bio && <div className="team-member-bio"><MultilineText text={member.bio} /></div>}
          </article>)}
          {members.length === 0 && ( // check-launch: fallback team
            [
              { role: "專任工程人員", qualification: "【待填：技師類別或證照名稱】" },
              { role: "工地主任", qualification: "【待填：證照名稱】" },
            ].map(({ role, qualification }) => <article className="team-member" key={role}>
              <PhotoPlaceholder description="本人同意使用的照片" className="team-portrait" sizes="(max-width: 767px) 100vw, 45vw" />
              <div className="team-member-heading"><h3><PlaceholderText text="【待填：姓名】" /></h3><p>{role}</p></div>
              <p><PlaceholderText text={qualification} /></p>
              {role === "專任工程人員" && <blockquote><PlaceholderText text="「我負責每一件工程的施工技術把關，……」【待填：本人寫或確認過的一句話】" /></blockquote>}
            </article>)
          )}
        </div>
      </section>
      {/* 過往經歷：非本公司承攬，一定要加註（AGENTS.md 工程實績上線方式） */}
      {experienced.length > 0 && <PageSection id="experience" title="核心人員經歷">
        {experienced.map((member) => <Fragment key={member.id}>
          <h3>{member.name}過往任職經歷</h3>
          <MultilineText text={member.experience} />
        </Fragment>)}
        <p className="content-notice">※ 以上為人員個人過往任職經歷，非本公司承攬工程。</p>
      </PageSection>}
      {members.length === 0 && ( // check-launch: fallback team
        <PageSection id="experience" title="核心人員經歷">
          <h3><PlaceholderText text="【待填：姓名】過往任職經歷" /></h3>
          <p><PlaceholderText text="【待填：年份】～【待填：年份】任職於【待填：前公司】，參與【待填：工程類型】" /></p>
          <p className="content-notice">※ 以上為人員個人過往任職經歷，非本公司承攬工程。</p>
        </PageSection>
      )}
    </div>
  </>;
}
