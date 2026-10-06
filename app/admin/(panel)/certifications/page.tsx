import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { contentOrderBy } from "@/lib/admin/content";
import { publicLinkOf } from "@/lib/admin/public-url";
import { formatDate } from "@/lib/admin/format";
import { ContentTable } from "@/app/admin/_components/content-table";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "證照" };

const DAY_MS = 24 * 60 * 60 * 1000;

function expiryBadge(expiresOn: Date | null, now: number) {
  if (!expiresOn) return <span className="adm-badge">無期限</span>;
  const label = formatDate(expiresOn);
  if (expiresOn.getTime() < now) return <span className="adm-badge adm-badge-err">{label}（已過期）</span>;
  if (expiresOn.getTime() < now + 60 * DAY_MS) return <span className="adm-badge adm-badge-warn">{label}（即將到期）</span>;
  return <span>{label}</span>;
}

async function loadRows() {
  const rows = await prisma.certification.findMany({
    orderBy: contentOrderBy,
    select: { id: true, name: true, issuer: true, expiresOn: true, published: true },
  });
  return { rows, now: Date.now() };
}

export default async function CertificationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { notice } = await searchParams;
  const { rows, now } = await loadRows();

  return (
    <div className="adm-page">
      <PageHeader
        title="證照"
        actions={
          <Link href="/admin/certifications/new" className="adm-btn adm-btn-primary">
            新增證照
          </Link>
        }
      />
      <Notice code={notice} />
      <ContentTable
        kind="certifications"
        rows={rows}
        titleOf={(row) => row.name}
        publicLink={(row) => publicLinkOf("certifications", row)}
        emptyText="還沒有證照"
        columns={[
          {
            header: "證照名稱",
            className: "adm-cell-title",
            cell: (row) => <Link href={`/admin/certifications/${row.id}`}>{row.name}</Link>,
          },
          { header: "發證單位", cell: (row) => row.issuer ?? "—" },
          { header: "有效期限", cell: (row) => expiryBadge(row.expiresOn, now) },
        ]}
      />
    </div>
  );
}
