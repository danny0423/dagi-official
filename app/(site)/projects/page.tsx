import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";
import { PreviewLabels } from "@/components/preview-labels";
import { ProjectFilters } from "@/components/project-filters";
import { ArrowIcon } from "@/components/arrow-icon";
import { sampleProject } from "@/lib/placeholder-project";
import { isAdminPreview, requireLaunched } from "@/lib/preview";
import { getPublishedProjects, getSiteCompany, type ProjectSummary } from "@/lib/site-data";
import { getPreviewProjects, type MaybePreview } from "@/lib/site-data/preview";
import { joinPresent, projectStatusText } from "@/lib/site-data/format";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/projects",
    title: "工程實績",
    description: `${company.name}承攬的工程實績，可依工程類別與施工狀態篩選。`,
  });
}

// 篩選列的施工狀態順序
const statusOrder = ["規劃中", "施工中", "已完工"];

export default async function Page() {
  await requireLaunched("/projects");
  // 已上架的工程（排序同後台）；一件都沒有時顯示範例專案（lib/placeholder-project.ts）。
  // 登入後台的人看到全部工程，未上架的加標籤（lib/preview.ts）
  const projects: MaybePreview<ProjectSummary>[] = (await isAdminPreview()) ? await getPreviewProjects() : await getPublishedProjects();
  // 有真實工程時，篩選列用實際出現的類別與施工狀態。類別是後台自由填寫，可能跟施工狀態同名（例如填「施工中」）或叫「全部」，
  // 合併後去重並排除「全部」，否則會出現兩顆同名按鈕（React key 重複）
  const filters = [...new Set([
    ...projects.map((project) => project.category).filter((category): category is string => Boolean(category)),
    ...statusOrder.filter((status) => projects.some((project) => project.statusLabel === status)),
  ])].filter((label) => label !== "全部");
  return <>
    <PageHeading path="/projects" title="工程實績" />
    <section className="site-container interior-content" aria-label="工程列表">
      {projects.length > 0 && <ProjectFilters filters={filters} items={projects.map((project) => ({
        id: project.slug, category: project.category, status: project.statusLabel,
        content: <article className="project-list-card">
          <Link href={`/projects/${encodeURIComponent(project.slug)}`} className="project-card-link">
            <PhotoPlaceholder description="工地或完工照" sizes="(max-width: 767px) 100vw, 60vw"
              photo={project.cover ? { src: project.cover.url, alt: project.cover.alt || `${project.title}工程照片` } : undefined} />
            <div className="project-list-copy">
              <PreviewLabels labels={project.previewLabels} />
              <h2>{project.title}</h2>
              <p>{joinPresent([project.location, project.category, projectStatusText(project)], "｜")}</p>
              {project.summary && <p>{project.summary}</p>}
              <span className="text-link">查看工程<ArrowIcon diagonal /></span>
            </div>
          </Link>
        </article>,
      }))} />}
      {projects.length === 0 && ( // check-launch: fallback projects
        <ProjectFilters sample items={[{
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
      )}
    </section>
  </>;
}
