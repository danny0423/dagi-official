import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { PlaceholderText } from "@/components/placeholder-text";
import { requireLaunched } from "@/lib/launch";
import { company } from "@/lib/placeholder-company";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/news",
  title: "最新消息",
  description: `${company.name}的最新消息與工程進度。`,
});

export default function Page() {
  requireLaunched("/news");
  return <>
    <PageHeading path="/news" title="最新消息／工程進度" />
    <section className="site-container interior-content" aria-labelledby="news-list-title">
      <h2 id="news-list-title" className="sr-only">文章列表</h2>
      <div className="news-list">
        {["【待填：工程名稱】結構體完成", "公司取得【待填：證照名稱】"].map((title) => <article className="news-row" key={title}>
          <p className="news-date"><PlaceholderText text="【範例】【待填：日期】" /></p>
          <h2><PlaceholderText text={title} /></h2>
        </article>)}
      </div>
    </section>
  </>;
}
