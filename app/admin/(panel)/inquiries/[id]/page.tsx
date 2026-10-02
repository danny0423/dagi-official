import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/admin/format";
import { parseId } from "@/lib/admin/validation";
import { deleteInboxItem, updateInboxItem } from "@/app/admin/_actions/inbox";
import { ActionButton } from "@/app/admin/_components/action-button";
import { InboxStatusBadge, InboxUpdateForm } from "@/app/admin/_components/inbox";
import { PageHeader, type IdParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "工程洽詢內容" };

export default async function InquiryDetailPage({ params }: { params: IdParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();

  const fields: [string, string | null][] = [
    ["收到時間", formatDateTime(inquiry.createdAt)],
    ["聯絡人", inquiry.name],
    ["公司", inquiry.company],
    ["電話", inquiry.phone],
    ["Email", inquiry.email],
    ["工程類型", inquiry.projectType],
    ["工程地點", inquiry.location],
    ["預算規模", inquiry.budget],
    ["內容", inquiry.message],
    ["來源 IP", inquiry.ipAddress],
    ["最後更新", formatDateTime(inquiry.updatedAt)],
  ];

  return (
    <div className="adm-page">
      <PageHeader
        title={`洽詢：${inquiry.name}`}
        back={{ href: "/admin/inquiries", label: "工程洽詢列表" }}
        description={<InboxStatusBadge status={inquiry.status} />}
        actions={
          <ActionButton
            action={deleteInboxItem.bind(null, "inquiries", inquiry.id)}
            label="刪除這筆"
            variant="danger"
            confirmMessage="確定要刪除這筆洽詢？刪除後無法復原（垃圾訊息才建議刪除）。"
          />
        }
      />
      <div className="adm-card">
        <dl className="adm-dl">
          {fields.map(([label, value]) => (
            <div key={label} className="contents">
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="adm-card">
        <h2>處理</h2>
        <InboxUpdateForm
          action={updateInboxItem.bind(null, "inquiries", inquiry.id)}
          status={inquiry.status}
          adminNote={inquiry.adminNote}
        />
      </div>
    </div>
  );
}
