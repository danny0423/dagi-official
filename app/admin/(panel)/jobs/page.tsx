import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { contentOrderBy } from "@/lib/admin/content";
import { publicLinkOf } from "@/lib/admin/public-url";
import { formatDateTime } from "@/lib/admin/format";
import { ContentTable } from "@/app/admin/_components/content-table";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "職缺" };

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const rows = await prisma.job.findMany({
    orderBy: contentOrderBy,
    select: { id: true, title: true, location: true, employmentType: true, published: true, updatedAt: true },
  });

  return (
    <div className="adm-page">
      <PageHeader
        title="職缺"
        actions={
          <Link href="/admin/jobs/new" className="adm-btn adm-btn-primary">
            新增職缺
          </Link>
        }
      />
      <Notice code={notice} />
      <ContentTable
        kind="jobs"
        rows={rows}
        titleOf={(row) => row.title}
        publicLink={(row) => publicLinkOf("jobs", row)}
        emptyText="還沒有職缺"
        columns={[
          {
            header: "職缺名稱",
            className: "adm-cell-title",
            cell: (row) => <Link href={`/admin/jobs/${row.id}`}>{row.title}</Link>,
          },
          { header: "地點", cell: (row) => row.location ?? "—" },
          { header: "性質", cell: (row) => row.employmentType ?? "—" },
          { header: "更新時間", cell: (row) => formatDateTime(row.updatedAt) },
        ]}
      />
    </div>
  );
}
