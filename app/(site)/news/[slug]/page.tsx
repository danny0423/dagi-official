import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MultilineText } from "@/components/multiline-text";
import { PageHeading } from "@/components/page-heading";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PreviewLabels } from "@/components/preview-labels";
import { isAdminPreview, requireLaunched } from "@/lib/preview";
import { decodeSlugParam, getNewsBySlug, getSiteCompany, type NewsDetail } from "@/lib/site-data";
import { getPreviewNewsBySlug, type MaybePreview } from "@/lib/site-data/preview";
import { formatDisplayDate } from "@/lib/site-data/format";
import { notFoundMetadata, pageMetadata } from "@/lib/seo/metadata";

// 最新消息單篇頁：讀已上架的消息（lib/site-data 的 getNewsBySlug）。上線開關跟著 /news（lib/launch.ts 子網址跟著上層）。
// 登入後台的人連未上架的也看得到，頁面上加標籤（lib/preview.ts）；訪客仍是 404。
// 內文是後台的純文字欄位，每一行一個段落（MultilineText）。

async function resolveNews(rawSlug: string): Promise<MaybePreview<NewsDetail> | null> {
  const slug = decodeSlugParam(rawSlug);
  if (!slug) return null;
  return (await isAdminPreview()) ? getPreviewNewsBySlug(slug) : getNewsBySlug(slug);
}

// 找不到的消息網址會顯示 404，標題也要是 404 的，不能套用其他消息的標題。
export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const news = await resolveNews(slug);
  if (!news) return notFoundMetadata;
  const company = await getSiteCompany();
  return pageMetadata({
    path: `/news/${encodeURIComponent(news.slug)}`,
    title: news.title,
    description: news.summary ?? `${company.name}的最新消息：「${news.title}」。`,
  });
}

export default async function Page({ params }: PageProps<"/news/[slug]">) {
  await requireLaunched("/news");
  const { slug } = await params;
  const news = await resolveNews(slug);
  // 找不到的消息網址交給 app/not-found.tsx（中文 404，含頁首頁尾）
  if (!news) notFound();

  const path = `/news/${encodeURIComponent(news.slug)}`;
  return <>
    <PageHeading path={path} title={news.title} parent={{ href: "/news", label: "最新消息" }}>
      <PreviewLabels labels={news.previewLabels} />
      <p className="news-article-date"><time dateTime={news.publishedAt}>{formatDisplayDate(news.publishedAt)}</time></p>
      {news.summary && <p>{news.summary}</p>}
    </PageHeading>
    <div className="site-container interior-content">
      <article className="news-article" aria-label={news.title}>
        {news.cover && <PhotoPlaceholder description="消息封面" className="news-cover" sizes="(max-width: 767px) 100vw, 52rem"
          photo={{ src: news.cover.url, alt: news.cover.alt || `${news.title}封面照片` }} />}
        <div className="news-body"><MultilineText text={news.content} /></div>
      </article>
      <div className="interior-cta"><Link href="/news" className="text-link">返回最新消息</Link></div>
    </div>
  </>;
}
