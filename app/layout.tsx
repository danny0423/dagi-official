import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { getSiteCompany } from "@/lib/site-data";
import { siteOpenGraph } from "@/lib/seo/metadata";
import "./globals.css";

// 全站預設值（公司名稱、短稱、一句話介紹來自資料庫的 company_settings）。
// 前台各頁用 lib/seo/metadata.ts 的 pageMetadata() 設定自己的 description 與 canonical；
// 分享圖由 app/(site)/opengraph-image.tsx 產生。
export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: company.name,
      template: `%s｜${company.shortName}`,
    },
    description: company.description ?? `${company.name}官方網站：綜合營造業登記資料、承攬業務與工程洽詢。`,
    openGraph: siteOpenGraph(company.name),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
