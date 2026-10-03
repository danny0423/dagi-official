import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { SiteShell } from "@/components/site-shell";
import { isLaunched } from "@/lib/launch";
import { notFoundMetadata } from "@/lib/seo/metadata";

// 中文 404（docs/ux-review-site.md #5、#6）。
// 根層 not-found 同時處理「不存在的網址」與前台頁面呼叫 notFound()（例如 /projects/[slug] 找不到、未開放頁面在正式環境）。
// 它取代整個 (site) 版面，不會經過 app/(site)/layout.tsx，所以這裡自己包 SiteShell（頁首、頁尾）。
// 後台（/admin 底下）的 404 由 app/admin/(panel)/not-found.tsx 顯示，不會落到這裡。
// 標題用 notFoundMetadata（「找不到頁面」）；呼叫 notFound() 的前台頁面也要讓自己的 metadata 在 404 時改用它（見 lib/seo/metadata.ts）。
const entries = [
  { href: "/", title: "回首頁", description: "從首頁重新瀏覽公司概況與承攬業務。" },
  { href: "/about/license", title: "營造業登記與資格", description: "核對公司的營造業登記資料與證照。" },
  { href: "/contact", title: "工程洽詢", description: "留下工程地點與規模，與我們討論您的工程。" },
].filter(({ href }) => isLaunched(href));

export const metadata: Metadata = notFoundMetadata;

export default function NotFound() {
  return (
    <SiteShell>
      <section className="not-found-hero concrete" aria-labelledby="not-found-title">
        <div className="site-container">
          <p className="not-found-code">404｜找不到頁面</p>
          <h1 id="not-found-title">找不到這個頁面</h1>
          <p className="not-found-description">網址可能輸入錯誤，或頁面已經移除。可以從下面的入口繼續瀏覽。</p>
        </div>
      </section>
      <nav className="site-container section-space" aria-label="常用頁面">
        <ul className="not-found-links">
          {entries.map(({ href, title, description }) => (
            <li key={href}>
              <Link href={href} className="service-card" data-cta={href === "/contact" ? "not-found" : undefined}>
                <span className="service-card-heading"><span className="not-found-link-title">{title}</span><ArrowIcon diagonal /></span>
                <span className="not-found-link-description">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </SiteShell>
  );
}
