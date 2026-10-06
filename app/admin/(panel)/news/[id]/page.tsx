import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { publicLinkOf } from "@/lib/admin/public-url";
import { parseId } from "@/lib/admin/validation";
import { toMediaDTO } from "@/lib/media";
import { updateNews } from "@/app/admin/_actions/news";
import { deleteContent } from "@/app/admin/_actions/content";
import { ActionButton } from "@/app/admin/_components/action-button";
import { Notice, PageHeader, ViewOnSiteLink, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";
import { NewsForm } from "../news-form";

export const metadata: Metadata = { title: "編輯消息" };

export default async function EditNewsPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const news = await prisma.news.findUnique({ where: { id }, include: { coverImage: true } });
  if (!news) notFound();
  const { notice } = await searchParams;

  return (
    <div className="adm-page">
      <PageHeader
        title={`編輯：${news.title}`}
        back={{ href: "/admin/news", label: "最新消息列表" }}
        actions={
          <>
            <ViewOnSiteLink link={publicLinkOf("news", news)} title={news.title} />
            <ActionButton
              action={deleteContent.bind(null, "news", news.id)}
              label="刪除這筆"
              variant="danger"
              confirmMessage={`確定要刪除消息「${news.title}」？刪除後無法復原。`}
            />
          </>
        }
      />
      <Notice code={notice} />
      <div className="adm-card">
        <NewsForm
          action={updateNews.bind(null, news.id)}
          submitLabel="儲存"
          initial={{ ...news, coverImage: news.coverImage ? toMediaDTO(news.coverImage) : null }}
        />
      </div>
    </div>
  );
}
