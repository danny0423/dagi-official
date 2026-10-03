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

export const metadata: Metadata = { title: "工程洽詢內容" };

// 網址上的 ?status=&page= 是從列表帶過來的篩選：返回列表、刪除後都回到同一個篩選
export default async function InquiryDetailPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) notFound();
  const listQuery = inboxFilterQuery(parseInboxFilter(await searchParams));

  const fields: InboxField[] = [
    { label: "收到時間", value: formatDateTime(inquiry.createdAt) },
    { label: "聯絡人", value: inquiry.name },
    { label: "公司", value: inquiry.company },
    { label: "電話", value: inquiry.phone, href: telHref(inquiry.phone) },
    { label: "Email", value: inquiry.email, href: mailtoHref(inquiry.email) },
    { label: "工程類型", value: inquiry.projectType },
    { label: "工程地點", value: inquiry.location },
    { label: "預算規模", value: inquiry.budget },
    { label: "內容", value: inquiry.message },
    { label: "來源 IP", value: inquiry.ipAddress },
    { label: "最後更新", value: formatDateTime(inquiry.updatedAt) },
  ];

  return (
    <div className="adm-page">
      <PageHeader
        title={`洽詢：${inquiry.name}`}
        back={{ href: `/admin/inquiries${listQuery}`, label: "工程洽詢列表" }}
        description={<InboxStatusBadge status={inquiry.status} />}
        actions={
          <ActionButton
            action={deleteInboxItem.bind(null, "inquiries", inquiry.id, listQuery)}
            label="刪除這筆"
            variant="danger"
            confirmMessage="確定要刪除這筆洽詢？刪除後無法復原（垃圾訊息才建議刪除）。"
          />
        }
      />
      <div className="adm-card">
        <InboxFields fields={fields} />
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
