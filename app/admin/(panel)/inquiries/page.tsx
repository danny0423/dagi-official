import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/admin/format";
import { inboxFilterQuery, outOfRangePage, parseInboxFilter } from "@/lib/admin/inbox";
import { countByStatus, InboxStatusBadge, InboxTabs } from "@/app/admin/_components/inbox";
import { EmptyState, Notice, PageHeader, Pager, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "工程洽詢" };

const PAGE_SIZE = 50;

export default async function InquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = parseInboxFilter(sp);
  const { status, page } = filter;
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
  // 頁碼超出範圍（例如刪掉最後一頁的最後一筆）：改到最後一頁，一次性提示（?notice=）照常帶過去
  const lastPage = outOfRangePage(page, total, PAGE_SIZE);
  if (lastPage) {
    const notice = typeof sp.notice === "string" ? { notice: sp.notice } : undefined;
    redirect(`/admin/inquiries${inboxFilterQuery({ status, page: lastPage }, notice)}`);
  }
  const query = (p: number) => `/admin/inquiries${inboxFilterQuery({ status, page: p })}`;
  // 詳細頁帶著目前的篩選，返回列表時回到同一個篩選與頁碼
  const detailHref = (id: number) => `/admin/inquiries/${id}${inboxFilterQuery(filter)}`;

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
                  <td data-label="收到時間">{formatDateTime(row.createdAt)}</td>
                  <td className="adm-cell-title" data-label="聯絡人">
                    <Link href={detailHref(row.id)}>{row.name}</Link>
                    {row.company && <span className="adm-sub">{row.company}</span>}
                  </td>
                  <td data-label="工程類型／地點">
                    {row.projectType ?? "—"}
                    {row.location && <span className="adm-sub">{row.location}</span>}
                  </td>
                  <td data-label="狀態">
                    <InboxStatusBadge status={row.status} />
                  </td>
                  <td className="adm-cell-actions" data-label="操作">
                    <Link href={detailHref(row.id)} className="adm-btn adm-btn-sm" aria-label={`查看「${row.name}」的洽詢`}>
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
