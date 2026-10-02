import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/admin/format";
import { countByStatus, InboxStatusBadge, InboxTabs, parseInboxStatus } from "@/app/admin/_components/inbox";
import { EmptyState, Notice, PageHeader, Pager, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "工程洽詢" };

const PAGE_SIZE = 50;

export default async function InquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = parseInboxStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = status ? { status } : {};

  const [rows, total, grouped] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, company: true, projectType: true, location: true, status: true, createdAt: true },
    }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const query = (p: number) => `/admin/inquiries?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <div className="adm-page">
      <PageHeader title="工程洽詢" description="前台「聯絡我們」表單送進來的洽詢。" />
      <Notice code={sp.notice} />
      <InboxTabs basePath="/admin/inquiries" current={status} counts={countByStatus(grouped)} />
      {rows.length === 0 ? (
        <EmptyState>沒有符合的洽詢</EmptyState>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">收到時間</th>
                <th scope="col">聯絡人</th>
                <th scope="col">工程類型／地點</th>
                <th scope="col">狀態</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td className="adm-cell-title">
                    {row.name}
                    {row.company && <span className="adm-sub">{row.company}</span>}
                  </td>
                  <td>
                    {row.projectType ?? "—"}
                    {row.location && <span className="adm-sub">{row.location}</span>}
                  </td>
                  <td>
                    <InboxStatusBadge status={row.status} />
                  </td>
                  <td>
                    <Link href={`/admin/inquiries/${row.id}`} className="adm-btn adm-btn-sm">
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={query} />
    </div>
  );
}
