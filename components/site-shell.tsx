import type { ReactNode } from "react";
import { Noto_Sans_TC } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { LaunchPreviewBanner } from "@/components/launch-preview-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteCompany } from "@/lib/site-data";
import { generalContractorJsonLd } from "@/lib/seo/json-ld";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// 前台外框（字型、頁首、頁尾、全站 JSON-LD）。
// app/(site)/layout.tsx 與 app/not-found.tsx 共用：根層 404 不會經過 (site) layout，所以要自己包一次。
// 公司資料在這裡讀一次（lib/site-data，已快取）再傳給頁首、頁尾、JSON-LD。
export async function SiteShell({ children }: { children: ReactNode }) {
  const company = await getSiteCompany();
  return (
    <div className={`site-shell ${notoSansTC.variable}`}>
      <a href="#main-content" className="skip-link">跳至主要內容</a>
      <LaunchPreviewBanner />
      <SiteHeader company={company} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter company={company} />
      <JsonLd data={generalContractorJsonLd(company)} />
    </div>
  );
}
