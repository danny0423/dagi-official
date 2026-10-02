import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/admin/format";
import { countByStatus, InboxStatusBadge, InboxTabs, parseInboxStatus } from "@/app/admin/_components/inbox";
import { EmptyState, Notice, PageHeader, Pager, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "協力廠商登記" };

const PAGE_SIZE = 50;

export default async function VendorApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = parseInboxStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);
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
  const query = (p: number) =>
    `/admin/vendor-applications?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`;

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
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td className="adm-cell-title">
                    {row.companyName}
                    <span className="adm-sub">{row.contactName}</span>
                  </td>
                  <td>
                    {row.trade ?? "—"}
                    {row.serviceArea && <span className="adm-sub">{row.serviceArea}</span>}
                  </td>
                  <td>
                    <InboxStatusBadge status={row.status} />
                  </td>
                  <td>
                    <Link href={`/admin/vendor-applications/${row.id}`} className="adm-btn adm-btn-sm">
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
