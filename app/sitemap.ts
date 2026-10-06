import type { MetadataRoute } from "next";
import { isLaunched, launchedPages } from "@/lib/launch";
import { siteUrl } from "@/lib/site";
import { getPublishedNews, getPublishedProjects } from "@/lib/site-data";

// 只列出已開放的頁面（lib/launch.ts）。/projects、/news 開放時再加入各工程、各篇消息的網址（從資料庫讀，只有已上架的；範例專案不收錄）。
// 兩頁都未開放時完全不查資料庫，sitemap 維持 build 時產生的靜態檔；開放後改成請求時產生（lib/site-data 的 connection()）。
// 這裡一律用公開資料（不看登入狀態），登入者預覽的未上架內容不會進 sitemap。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = launchedPages().map(({ path }) => ({ url: path === "/" ? siteUrl : `${siteUrl}${path}` }));
  const [projects, news] = await Promise.all([
    isLaunched("/projects") ? getPublishedProjects() : Promise.resolve([]),
    isLaunched("/news") ? getPublishedNews() : Promise.resolve([]),
  ]);
  return [
    ...pages,
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${encodeURIComponent(project.slug)}`,
      lastModified: project.updatedAt,
    })),
    ...news.map((item) => ({
      url: `${siteUrl}/news/${encodeURIComponent(item.slug)}`,
      lastModified: item.updatedAt,
    })),
  ];
}
