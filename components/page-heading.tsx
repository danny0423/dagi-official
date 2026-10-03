import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { PlaceholderText } from "@/components/placeholder-text";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

// 內頁標題區：畫面上的麵包屑，同時輸出相同路徑的 BreadcrumbList 結構化資料。
export function PageHeading({ path, title, parent, children }: {
  /** 本頁網址路徑，給 BreadcrumbList 使用 */
  path: string;
  title: string;
  parent?: { href: string; label: string };
  children?: ReactNode;
}) {
  const breadcrumbs = [
    { name: "首頁", path: "/" },
    ...(parent ? [{ name: parent.label, path: parent.href }] : []),
    { name: title, path },
  ];
  return (
    <header className="page-heading concrete">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="site-container">
        <nav aria-label="麵包屑" className="breadcrumbs">
          <ol>
            <li><Link href="/">首頁</Link></li>
            {parent && <li><Link href={parent.href}>{parent.label}</Link></li>}
            <li aria-current="page"><PlaceholderText text={title} /></li>
          </ol>
        </nav>
        <h1><PlaceholderText text={title} /></h1>
        {children && <div className="page-heading-description">{children}</div>}
      </div>
    </header>
  );
}

const aboutLinks = [
  ["/about", "公司簡介"],
  ["/about/license", "營造業登記與資格"],
  ["/about/team", "專業團隊"],
  ["/about/group", "集團關係"],
];

export function AboutNavigation({ current }: { current: string }) {
  return (
    <nav aria-label="關於我們章節" className="about-section-nav site-container">
      {aboutLinks.map(([href, label]) => <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</Link>)}
    </nav>
  );
}
