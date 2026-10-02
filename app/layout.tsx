import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { company } from "@/lib/placeholder-company";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: company.name,
    template: `%s｜${company.shortName}`,
  },
  description: `${company.name}官方網站：綜合營造業登記資料、承攬業務與工程洽詢。`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
