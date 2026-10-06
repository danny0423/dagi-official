import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { isLaunched } from "@/lib/launch";

// 中文 404 的內容（不含頁首頁尾）。
// - app/not-found.tsx：沒有對應路由的網址，自己包 SiteShell。
// - app/(site)/not-found.tsx：前台頁面呼叫 notFound()，已在 (site) layout 的 SiteShell 裡，只放內容，避免頁首頁尾重複。
const entries = [
  { href: "/", title: "回首頁", description: "從首頁重新瀏覽公司概況與承攬業務。" },
  { href: "/about/license", title: "營造業登記與資格", description: "核對公司的營造業登記資料與證照。" },
  { href: "/contact", title: "工程洽詢", description: "留下工程地點與規模，與我們討論您的工程。" },
].filter(({ href }) => isLaunched(href));

export function NotFoundContent() {
  return (
    <>
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
    </>
  );
}
