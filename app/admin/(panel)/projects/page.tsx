import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { contentOrderBy } from "@/lib/admin/content";
import { publicLinkOf } from "@/lib/admin/public-url";
import { formatDateTime, projectStatusLabel } from "@/lib/admin/format";
import { ContentTable } from "@/app/admin/_components/content-table";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "工程實績" };

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const rows = await prisma.project.findMany({
    orderBy: contentOrderBy,
    select: { id: true, title: true, slug: true, category: true, status: true, featured: true, published: true, updatedAt: true },
  });

  return (
    <div className="adm-page">
      <PageHeader
        title="工程實績"
        description="前台實績頁的上線方式還沒定案（docs/decisions.md Q1）；隆磐建設的工程不可登錄成本公司實績。"
        actions={
          <Link href="/admin/projects/new" className="adm-btn adm-btn-primary">
            新增工程實績
          </Link>
        }
      />
      <Notice code={notice} />
      <ContentTable
        kind="projects"
        rows={rows}
        titleOf={(row) => row.title}
        publicLink={(row) => publicLinkOf("projects", row)}
        emptyText="還沒有工程實績"
        columns={[
          {
            header: "工程名稱",
            className: "adm-cell-title",
            cell: (row) => (
              <>
                <Link href={`/admin/projects/${row.id}`}>{row.title}</Link>
                <span className="adm-sub">/projects/{row.slug}</span>
              </>
            ),
          },
          { header: "類別", cell: (row) => row.category ?? "—" },
          {
            header: "狀態",
            cell: (row) => (
              <span className="adm-badge adm-badge-steel">{projectStatusLabel[row.status]}</span>
            ),
          },
          { header: "精選", cell: (row) => (row.featured ? "是" : "—") },
          { header: "更新時間", cell: (row) => formatDateTime(row.updatedAt) },
        ]}
      />
    </div>
  );
}
