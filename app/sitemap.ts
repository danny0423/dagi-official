import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// 之後工程實績、最新消息改成從資料庫讀，動態加入單頁網址
const paths = [
  "",
  "/about",
  "/about/license",
  "/about/team",
  "/about/group",
  "/services",
  "/projects",
  "/safety-quality",
  "/contact",
  "/privacy",
  "/news",
  "/careers",
  "/partners",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: `${siteUrl}${path}` }));
}
