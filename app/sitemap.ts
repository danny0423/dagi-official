import type { MetadataRoute } from "next";
import { launchedPages } from "@/lib/launch";
import { siteUrl } from "@/lib/site";

// 只列出已開放的頁面（lib/launch.ts）。之後工程實績、最新消息開放並改成從資料庫讀時，再動態加入單頁網址。
export default function sitemap(): MetadataRoute.Sitemap {
  return launchedPages().map(({ path }) => ({ url: path === "/" ? siteUrl : `${siteUrl}${path}` }));
}
