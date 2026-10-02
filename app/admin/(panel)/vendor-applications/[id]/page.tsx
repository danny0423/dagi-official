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

export const metadata: Metadata = { title: "協力廠商登記內容" };

export default async function VendorApplicationDetailPage({ params }: { params: IdParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const application = await prisma.vendorApplication.findUnique({ where: { id } });
  if (!application) notFound();

  const fields: [string, string | null][] = [
    ["收到時間", formatDateTime(application.createdAt)],
    ["廠商名稱", application.companyName],
    ["統一編號", application.taxId],
    ["聯絡人", application.contactName],
    ["電話", application.phone],
    ["Email", application.email],
    ["工種／專業項目", application.trade],
    ["服務區域", application.serviceArea],
    ["內容", application.message],
    ["來源 IP", application.ipAddress],
    ["最後更新", formatDateTime(application.updatedAt)],
  ];

  return (
    <div className="adm-page">
      <PageHeader
        title={`協力廠商：${application.companyName}`}
        back={{ href: "/admin/vendor-applications", label: "協力廠商列表" }}
        description={<InboxStatusBadge status={application.status} />}
        actions={
          <ActionButton
            action={deleteInboxItem.bind(null, "vendors", application.id)}
            label="刪除這筆"
            variant="danger"
            confirmMessage="確定要刪除這筆登記資料？刪除後無法復原（垃圾訊息才建議刪除）。"
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
          action={updateInboxItem.bind(null, "vendors", application.id)}
          status={application.status}
          adminNote={application.adminNote}
        />
      </div>
    </div>
  );
}
