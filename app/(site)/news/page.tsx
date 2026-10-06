import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { PlaceholderText } from "@/components/placeholder-text";
import { PreviewLabels } from "@/components/preview-labels";
import { isAdminPreview, requireLaunched } from "@/lib/preview";
import { getPublishedNews, getSiteCompany, type PublicNews } from "@/lib/site-data";
import { getPreviewNews, type MaybePreview } from "@/lib/site-data/preview";
import { formatDisplayDate } from "@/lib/site-data/format";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/news",
    title: "最新消息",
    description: `${company.name}的最新消息與工程進度。`,
  });
}

export default async function Page() {
  await requireLaunched("/news");
  // 已上架的消息，依日期由新到舊；一篇都沒有時顯示範例。每一篇連到單篇頁（/news/[slug]）。
  // 登入後台的人看到全部消息，未上架的加標籤（lib/preview.ts）
  const news: MaybePreview<PublicNews>[] = (await isAdminPreview()) ? await getPreviewNews() : await getPublishedNews();
  return <>
    <PageHeading path="/news" title="最新消息／工程進度" />
    <section className="site-container interior-content" aria-labelledby="news-list-title">
      <h2 id="news-list-title" className="sr-only">文章列表</h2>
      <div className="news-list">
        {news.map((item) => <article className="news-row" key={item.id}>
          <p className="news-date"><time dateTime={item.publishedAt}>{formatDisplayDate(item.publishedAt)}</time></p>
          <div>
            <PreviewLabels labels={item.previewLabels} />
            {/* 標題連結用 ::after 撐滿整列（globals.css 的 .news-row-link），整列都可以點 */}
            <h2><Link href={`/news/${encodeURIComponent(item.slug)}`} className="news-row-link">{item.title}</Link></h2>
            {item.summary && <p className="news-summary">{item.summary}</p>}
          </div>
        </article>)}
        {news.length === 0 && ( // check-launch: fallback news
          ["【待填：工程名稱】結構體完成", "公司取得【待填：證照名稱】"].map((title) => <article className="news-row" key={title}>
            <p className="news-date"><PlaceholderText text="【範例】【待填：日期】" /></p>
            <h2><PlaceholderText text={title} /></h2>
          </article>)
        )}
      </div>
    </section>
  </>;
}
