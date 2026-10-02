import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { contentOrderBy } from "@/lib/admin/content";
import { formatDateTime } from "@/lib/admin/format";
import { ContentTable } from "@/app/admin/_components/content-table";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "團隊成員" };

export default async function TeamPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const rows = await prisma.teamMember.findMany({
    orderBy: contentOrderBy,
    select: { id: true, name: true, title: true, consentToPublish: true, published: true, updatedAt: true },
  });

  return (
    <div className="adm-page">
      <PageHeader
        title="團隊成員"
        description="沒有取得當事人同意公開的人，不會出現在前台，也不能上架。"
        actions={
          <Link href="/admin/team/new" className="adm-btn adm-btn-primary">
            新增成員
          </Link>
        }
      />
      <Notice code={notice} />
      <ContentTable
        kind="team"
        rows={rows}
        titleOf={(row) => row.name}
        emptyText="還沒有團隊成員"
        columns={[
          {
            header: "姓名",
            className: "adm-cell-title",
            cell: (row) => <Link href={`/admin/team/${row.id}`}>{row.name}</Link>,
          },
          { header: "職稱", cell: (row) => row.title ?? "—" },
          {
            header: "同意公開",
            cell: (row) =>
              row.consentToPublish ? (
                <span className="adm-badge adm-badge-ok">已同意</span>
              ) : (
                <span className="adm-badge adm-badge-err">未同意</span>
              ),
          },
          { header: "更新時間", cell: (row) => formatDateTime(row.updatedAt) },
        ]}
      />
    </div>
  );
}
