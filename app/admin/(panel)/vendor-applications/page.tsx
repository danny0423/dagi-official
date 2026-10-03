import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/admin/format";
import { inboxFilterQuery, outOfRangePage, parseInboxFilter } from "@/lib/admin/inbox";
import { countByStatus, InboxStatusBadge, InboxTabs } from "@/app/admin/_components/inbox";
import { EmptyState, Notice, PageHeader, Pager, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "協力廠商登記" };

const PAGE_SIZE = 50;

export default async function VendorApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = parseInboxFilter(sp);
  const { status, page } = filter;
  const where = status ? { status } : {};

  const [rows, total, grouped] = await Promise.all([
    prisma.vendorApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, companyName: true, contactName: true, trade: true, serviceArea: true, status: true, createdAt: true },
    }),
    prisma.vendorApplication.count({ where }),
    prisma.vendorApplication.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  // 頁碼超出範圍（例如刪掉最後一頁的最後一筆）：改到最後一頁，一次性提示（?notice=）照常帶過去
  const lastPage = outOfRangePage(page, total, PAGE_SIZE);
  if (lastPage) {
    const notice = typeof sp.notice === "string" ? { notice: sp.notice } : undefined;
    redirect(`/admin/vendor-applications${inboxFilterQuery({ status, page: lastPage }, notice)}`);
  }
  const query = (p: number) => `/admin/vendor-applications${inboxFilterQuery({ status, page: p })}`;
  // 詳細頁帶著目前的篩選，返回列表時回到同一個篩選與頁碼
  const detailHref = (id: number) => `/admin/vendor-applications/${id}${inboxFilterQuery(filter)}`;

  return (
    <div className="adm-page">
      <PageHeader title="協力廠商登記" description="前台「協力廠商合作」表單送進來的登記資料。" />
      <Notice code={sp.notice} />
      <InboxTabs basePath="/admin/vendor-applications" current={status} counts={countByStatus(grouped)} />
      {rows.length === 0 ? (
        <EmptyState>沒有符合的登記資料</EmptyState>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">收到時間</th>
                <th scope="col">廠商／聯絡人</th>
                <th scope="col">工種／服務區域</th>
                <th scope="col">狀態</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-label="收到時間">{formatDateTime(row.createdAt)}</td>
                  <td className="adm-cell-title" data-label="廠商／聯絡人">
                    <Link href={detailHref(row.id)}>{row.companyName}</Link>
                    <span className="adm-sub">{row.contactName}</span>
                  </td>
                  <td data-label="工種／服務區域">
                    {row.trade ?? "—"}
                    {row.serviceArea && <span className="adm-sub">{row.serviceArea}</span>}
                  </td>
                  <td data-label="狀態">
                    <InboxStatusBadge status={row.status} />
                  </td>
                  <td className="adm-cell-actions" data-label="操作">
                    <Link
                      href={detailHref(row.id)}
                      className="adm-btn adm-btn-sm"
                      aria-label={`查看「${row.companyName}」的登記資料`}
                    >
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
