import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MultilineText } from "@/components/multiline-text";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { requireLaunched } from "@/lib/launch";
import { sampleProject } from "@/lib/placeholder-project";
import { decodeSlugParam, getProjectBySlug, getPublishedProjects, getSiteCompany, type ProjectDetail } from "@/lib/site-data";
import { joinPresent, projectPeriod, projectStatusText } from "@/lib/site-data/format";
import { notFoundMetadata, pageMetadata } from "@/lib/seo/metadata";
import { SampleProject } from "./sample-project";

// 單案頁：讀已上架的工程（lib/site-data 的 getProjectBySlug）。
// 資料庫一件已上架的工程都沒有時，/projects/example-project 顯示範例專案（只供版型預覽，即使 /projects 開放了也不收錄）；
// 有真實工程之後範例網址就回 404。

type Resolved = { kind: "project"; project: ProjectDetail } | { kind: "sample" } | null;

async function resolveProject(rawSlug: string): Promise<Resolved> {
  const slug = decodeSlugParam(rawSlug);
  if (!slug) return null;
  const project = await getProjectBySlug(slug);
  if (project) return { kind: "project", project };
  if (slug === sampleProject.slug && (await getPublishedProjects()).length === 0) return { kind: "sample" };
  return null;
}

// 找不到的工程網址會顯示 404，標題也要是 404 的，不能套用其他工程或範例專案的標題。
export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProject(slug);
  if (!resolved) return notFoundMetadata;
  if (resolved.kind === "sample") { // check-launch: fallback projects
    const metadata = pageMetadata({
      path: `/projects/${sampleProject.slug}`,
      title: "【待填：工程名稱】｜範例專案",
      description: "工程實績單案介紹：工程概況、施工重點與工程照片。",
    });
    return metadata === notFoundMetadata ? metadata : { ...metadata, robots: { index: false, follow: true } };
  }
  const { project } = resolved;
  const company = await getSiteCompany();
  return pageMetadata({
    path: `/projects/${encodeURIComponent(project.slug)}`,
    title: project.title,
    description: project.summary ?? `${company.name}承攬的「${project.title}」：工程概況與工程照片。`,
  });
}

export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  requireLaunched("/projects");
  const { slug } = await params;
  const resolved = await resolveProject(slug);
  // 找不到的工程網址交給 app/not-found.tsx（中文 404，含頁首頁尾）
  if (!resolved) notFound();
  if (resolved.kind === "sample") return <SampleProject />;

  const { project } = resolved;
  const path = `/projects/${encodeURIComponent(project.slug)}`;
  const photos = [...(project.cover ? [project.cover] : []), ...project.gallery];
  return <>
    <PageHeading path={path} title={project.title} parent={{ href: "/projects", label: "工程實績" }}>
      {project.summary && <p>{project.summary}</p>}
    </PageHeading>
    <div className="site-container interior-content">
      <PageSection id="project-overview" title="工程概況">
        <dl className="detail-list project-facts">
          {[
            ["工程名稱", project.title],
            ["業主", project.client],
            ["地點", project.location],
            ["工程類別", project.category],
            ["構造與規模", joinPresent([project.structure, project.scale], "，")],
            ["工期", projectPeriod(project)],
            ["工程狀態", projectStatusText(project)],
          ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </PageSection>
      {project.description && <PageSection id="construction-notes" title="施工重點"><MultilineText text={project.description} /></PageSection>}
      {photos.length > 0 && <section className="project-gallery-section" aria-labelledby="project-gallery">
        <div className="section-heading"><h2 id="project-gallery">工程照片</h2></div>
        <div className="project-photo-grid">{photos.map((photo, index) => <figure key={`${photo.url}-${index}`}>
          <PhotoPlaceholder description="工程照片" sizes="(max-width: 767px) 100vw, 30vw" photo={{ src: photo.url, alt: photo.alt || `${project.title}工程照片 ${index + 1}` }} />
          {photo.alt && <figcaption>{photo.alt}</figcaption>}
        </figure>)}</div>
      </section>}
      <div className="interior-cta"><Link href="/projects" className="text-link">返回工程實績</Link></div>
    </div>
  </>;
}
