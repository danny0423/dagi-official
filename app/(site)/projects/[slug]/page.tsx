import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";
import { sampleProject } from "@/lib/placeholder-project";

export const metadata: Metadata = {
  title: "【待填：工程名稱】｜範例專案",
  robots: { index: false, follow: true },
};

export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  if (slug !== sampleProject.slug) notFound();
  return <>
    <PageHeading title={sampleProject.name} parent={{ href: "/projects", label: "工程實績" }}><p><PlaceholderText text={sampleProject.notice} /></p></PageHeading>
    <div className="site-container interior-content">
      <PageSection id="project-overview" title="工程概況">
        <dl className="detail-list project-facts">
          {[
            ["工程名稱", sampleProject.name],
            ["業主", "【待填：業主名稱；業主不同意公開就寫「民間業主」】"],
            ["地點", sampleProject.location],
            ["構造與規模", "【待填：例：RC 造，地上 ○ 層、地下 ○ 層】"],
            ["工期", "【待填：開工年月】～【待填：完工年月】"],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd><PlaceholderText text={value} /></dd></div>)}
        </dl>
      </PageSection>
      <PageSection id="construction-notes" title="施工重點"><p><PlaceholderText text="本案基地緊鄰既有建物，施工期間採【待填：實際使用的工法】，並於開挖前完成鄰房現況鑑定。【待填：工務人員提供的實際施工重點】" /></p></PageSection>
      <section className="project-gallery-section" aria-labelledby="project-gallery">
        <div className="section-heading"><h2 id="project-gallery">工程照片</h2><p><PlaceholderText text="【待填：施工前／施工中／完工各 1～3 張】" /></p></div>
        <div className="project-photo-grid">{["施工前", "施工中", "完工"].map((stage) => <figure key={stage}><PhotoPlaceholder description={`${stage}照片`} sizes="(max-width: 767px) 100vw, 30vw" /><figcaption>{stage}</figcaption></figure>)}</div>
      </section>
      <div className="interior-cta"><Link href="/projects" className="text-link">返回工程實績</Link></div>
    </div>
  </>;
}
