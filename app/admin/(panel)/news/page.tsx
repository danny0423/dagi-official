import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { contentOrderBy } from "@/lib/admin/content";
import { publicLinkOf } from "@/lib/admin/public-url";
import { formatDate, formatDateTime } from "@/lib/admin/format";
import { ContentTable } from "@/app/admin/_components/content-table";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "最新消息" };

export default async function NewsListPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const rows = await prisma.news.findMany({
    orderBy: contentOrderBy,
    select: { id: true, title: true, slug: true, publishedAt: true, published: true, updatedAt: true },
  });

  return (
    <div className="adm-page">
      <PageHeader
        title="最新消息"
        actions={
          <Link href="/admin/news/new" className="adm-btn adm-btn-primary">
            新增消息
          </Link>
        }
      />
      <Notice code={notice} />
      <ContentTable
        kind="news"
        rows={rows}
        titleOf={(row) => row.title}
        publicLink={(row) => publicLinkOf("news", row)}
        emptyText="還沒有消息"
        columns={[
          {
            header: "標題",
            className: "adm-cell-title",
            cell: (row) => (
              <>
                <Link href={`/admin/news/${row.id}`}>{row.title}</Link>
                <span className="adm-sub">/news/{row.slug}</span>
              </>
            ),
          },
          { header: "日期", cell: (row) => formatDate(row.publishedAt) },
          { header: "更新時間", cell: (row) => formatDateTime(row.updatedAt) },
        ]}
      />
    </div>
  );
}
