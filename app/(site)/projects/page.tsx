import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";
import { ProjectFilters } from "@/components/project-filters";
import { ArrowIcon } from "@/components/arrow-icon";
import { sampleProject } from "@/lib/placeholder-project";
import { requireLaunched } from "@/lib/launch";
import { company } from "@/lib/placeholder-company";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/projects",
  title: "工程實績",
  description: `${company.name}承攬的工程實績，可依工程類別與施工狀態篩選。`,
});

export default function Page() {
  requireLaunched("/projects");
  return <>
    <PageHeading path="/projects" title="工程實績" />
    <section className="site-container interior-content" aria-label="工程列表">
      <ProjectFilters items={[{
        id: sampleProject.slug, category: sampleProject.category, status: sampleProject.status,
        content: <article className="project-list-card">
          <Link href={`/projects/${sampleProject.slug}`} className="project-card-link" aria-label="查看範例專案，非真實案件">
            <PhotoPlaceholder description="工地或完工照" sizes="(max-width: 767px) 100vw, 60vw" />
            <div className="project-list-copy">
              <p><PlaceholderText text={sampleProject.notice} /></p>
              <h2><PlaceholderText text={sampleProject.name} /></h2>
              <p><PlaceholderText text={`${sampleProject.location}｜${sampleProject.categoryLabel}｜${sampleProject.statusLabel}`} /></p>
              <span className="text-link">查看工程<ArrowIcon diagonal /></span>
            </div>
          </Link>
        </article>,
      }]} />
    </section>
  </>;
}
