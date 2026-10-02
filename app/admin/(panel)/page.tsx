import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";

// 後台首頁（儀表板）：收件匣未處理數量、各內容筆數。功能清單見 docs/tech-architecture.md F4～F8。
export const metadata: Metadata = { title: "儀表板" };

const EXPIRY_WARNING_DAYS = 60;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAdmin();
  const { denied } = await searchParams;

  const [inquiries, vendors, projects, news, jobs, team, certifications, mediaCount, expiringCerts, noConsent] =
    await Promise.all([
      prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.vendorApplication.groupBy({ by: ["status"], _count: { _all: true } }),
      countContent(prisma.project),
      countContent(prisma.news),
      countContent(prisma.job),
      countContent(prisma.teamMember),
      countContent(prisma.certification),
      prisma.media.count(),
      prisma.certification.count({ where: { expiresOn: { lte: daysFromNow(EXPIRY_WARNING_DAYS) } } }),
      prisma.teamMember.count({ where: { consentToPublish: false } }),
    ]);

  const statusCount = (rows: { status: string; _count: { _all: number } }[], status: string) =>
    rows.find((row) => row.status === status)?._count._all ?? 0;

  const inbox = [
    { label: "工程洽詢", href: "/admin/inquiries", rows: inquiries },
    { label: "協力廠商登記", href: "/admin/vendor-applications", rows: vendors },
  ];
  const content = [
    { label: "工程實績", href: "/admin/projects", ...projects },
    { label: "最新消息", href: "/admin/news", ...news },
    { label: "職缺", href: "/admin/jobs", ...jobs },
    { label: "團隊成員", href: "/admin/team", ...team },
    { label: "證照", href: "/admin/certifications", ...certifications },
  ];

  return (
    <div className="adm-page">
      <PageHeader title="儀表板" description={`${user.name}，你好`} />
      <Notice code={denied === "1" ? "denied" : undefined} />

      <section>
        <h2 className="adm-section-title">收件匣</h2>
        <div className="adm-stat-grid">
          {inbox.map((item) => {
            const fresh = statusCount(item.rows, "NEW");
            return (
              <Link
                key={item.href}
                href={`${item.href}?status=NEW`}
                className={`adm-stat${fresh > 0 ? " is-alert" : ""}`}
              >
                <span className="adm-stat-label">{item.label}・未處理</span>
                <span className="adm-stat-value">{fresh}</span>
                <span className="adm-stat-sub">處理中 {statusCount(item.rows, "IN_PROGRESS")} 筆</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="adm-section-title">內容</h2>
        <div className="adm-stat-grid">
          {content.map((item) => (
            <Link key={item.href} href={item.href} className="adm-stat">
              <span className="adm-stat-label">{item.label}</span>
              <span className="adm-stat-value">{item.total}</span>
              <span className="adm-stat-sub">上架 {item.published} 筆</span>
            </Link>
          ))}
          <Link href="/admin/media" className="adm-stat">
            <span className="adm-stat-label">媒體庫</span>
            <span className="adm-stat-value">{mediaCount}</span>
            <span className="adm-stat-sub">張圖片</span>
          </Link>
        </div>
      </section>

      {(expiringCerts > 0 || noConsent > 0) && (
        <section className="flex flex-col gap-2">
          <h2 className="adm-section-title">需要注意</h2>
          {expiringCerts > 0 && (
            <p className="adm-msg adm-msg-warn">
              有 {expiringCerts} 張證照已過期或將在 {EXPIRY_WARNING_DAYS} 天內到期，
              <Link href="/admin/certifications">前往證照管理</Link>
            </p>
          )}
          {noConsent > 0 && (
            <p className="adm-msg adm-msg-warn">
              有 {noConsent} 位團隊成員尚未取得同意公開，這些人不會出現在前台，
              <Link href="/admin/team">前往團隊成員</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

type CountDelegate = { count(args?: { where?: { published?: boolean } }): Promise<number> };

async function countContent(delegate: unknown) {
  const d = delegate as CountDelegate;
  const [total, published] = await Promise.all([d.count(), d.count({ where: { published: true } })]);
  return { total, published };
}
