import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/admin/format";
import { parseId } from "@/lib/admin/validation";
import { deleteInboxItem, updateInboxItem } from "@/app/admin/_actions/inbox";
import { ActionButton } from "@/app/admin/_components/action-button";
import { inboxFilterQuery, parseInboxFilter } from "@/lib/admin/inbox";
import {
  InboxFields,
  InboxStatusBadge,
  InboxUpdateForm,
  mailtoHref,
  telHref,
  type InboxField,
} from "@/app/admin/_components/inbox";
import { PageHeader, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "協力廠商登記內容" };

// 網址上的 ?status=&page= 是從列表帶過來的篩選：返回列表、刪除後都回到同一個篩選
export default async function VendorApplicationDetailPage({
  params,
  searchParams,
}: {
  params: IdParams;
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const application = await prisma.vendorApplication.findUnique({ where: { id } });
  if (!application) notFound();
  const listQuery = inboxFilterQuery(parseInboxFilter(await searchParams));

  const fields: InboxField[] = [
    { label: "收到時間", value: formatDateTime(application.createdAt) },
    { label: "廠商名稱", value: application.companyName },
    { label: "統一編號", value: application.taxId },
    { label: "聯絡人", value: application.contactName },
    { label: "電話", value: application.phone, href: telHref(application.phone) },
    { label: "Email", value: application.email, href: mailtoHref(application.email) },
    { label: "工種／專業項目", value: application.trade },
    { label: "服務區域", value: application.serviceArea },
    { label: "內容", value: application.message },
    { label: "來源 IP", value: application.ipAddress },
    { label: "最後更新", value: formatDateTime(application.updatedAt) },
  ];

  return (
    <div className="adm-page">
      <PageHeader
        title={`協力廠商：${application.companyName}`}
        back={{ href: `/admin/vendor-applications${listQuery}`, label: "協力廠商列表" }}
        description={<InboxStatusBadge status={application.status} />}
        actions={
          <ActionButton
            action={deleteInboxItem.bind(null, "vendors", application.id, listQuery)}
            label="刪除這筆"
            variant="danger"
            confirmMessage="確定要刪除這筆登記資料？刪除後無法復原（垃圾訊息才建議刪除）。"
          />
        }
      />
      <div className="adm-card">
        <InboxFields fields={fields} />
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
