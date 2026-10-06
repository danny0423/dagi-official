import type { MetadataRoute } from "next";
import { isLaunched, launchedPages } from "@/lib/launch";
import { siteUrl } from "@/lib/site";
import { getPublishedProjects } from "@/lib/site-data";

// 只列出已開放的頁面（lib/launch.ts）。/projects 開放時再加入各工程的單案網址（從資料庫讀，範例專案不收錄）。
// /projects 未開放時完全不查資料庫，sitemap 維持 build 時產生的靜態檔；開放後改成請求時產生（lib/site-data 的 connection()）。
// 最新消息目前沒有單篇頁，不用加。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = launchedPages().map(({ path }) => ({ url: path === "/" ? siteUrl : `${siteUrl}${path}` }));
  if (!isLaunched("/projects")) return pages;
  const projects = await getPublishedProjects();
  return [
    ...pages,
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${encodeURIComponent(project.slug)}`,
      lastModified: project.updatedAt,
    })),
  ];
}
