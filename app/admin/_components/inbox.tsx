import Link from "next/link";
import { AdminForm, SelectField, TextAreaField, type FormAction } from "@/app/admin/_components/form";
import { inboxStatusLabel } from "@/lib/admin/format";
import { INBOX_STATUSES, parseInboxStatus, type InboxStatus } from "@/lib/admin/inbox";

// 收件匣（工程洽詢、協力廠商）共用元件。狀態與篩選的解析在 lib/admin/inbox.ts（server action 也要用）。

export { INBOX_STATUSES, parseInboxStatus, type InboxStatus } from "@/lib/admin/inbox";

// 電話 → tel: 連結（只留數字、+、#、*、逗號、分號）；整理後沒有數字就不做連結
export function telHref(phone: string | null | undefined): string | null {
  const cleaned = phone?.replace(/[^\d+#*,;]/g, "") ?? "";
  return /\d/.test(cleaned) ? `tel:${cleaned}` : null;
}

// Email → mailto: 連結；資料是前台訪客填的，格式不像 Email（或含 ?、& 這類會被當成參數的字元）就不做連結
export function mailtoHref(email: string | null | undefined): string | null {
  const value = email?.trim() ?? "";
  return /^[^\s@?&#,;<>"]+@[^\s@?&#,;<>"]+\.[^\s@?&#,;<>"]+$/.test(value) ? `mailto:${value}` : null;
}

// 收件匣詳細頁的一個欄位：電話、Email 可以直接點
export type InboxField = { label: string; value: string | null; href?: string | null };

export function InboxFields({ fields }: { fields: InboxField[] }) {
  return (
    <dl className="adm-dl">
      {fields.map(({ label, value, href }) => (
        <div key={label} className="contents">
          <dt>{label}</dt>
          <dd>{!value ? "—" : href ? <a href={href}>{value}</a> : value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InboxStatusBadge({ status }: { status: InboxStatus }) {
  const tone = status === "NEW" ? "adm-badge-err" : status === "IN_PROGRESS" ? "adm-badge-warn" : "adm-badge-ok";
  return <span className={`adm-badge ${tone}`}>{inboxStatusLabel[status]}</span>;
}

export function InboxTabs({
  basePath,
  current,
  counts,
}: {
  basePath: string;
  current?: InboxStatus;
  counts: Record<InboxStatus, number>;
}) {
  const total = INBOX_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const tabs: { status?: InboxStatus; label: string; count: number }[] = [
    { label: "全部", count: total },
    ...INBOX_STATUSES.map((status) => ({ status, label: inboxStatusLabel[status], count: counts[status] })),
  ];
  return (
    <nav className="adm-tabs" aria-label="處理狀態篩選">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.status ? `${basePath}?status=${tab.status}` : basePath}
          aria-current={tab.status === current ? "page" : undefined}
        >
          {tab.label}（{tab.count}）
        </Link>
      ))}
    </nav>
  );
}

export function InboxUpdateForm({
  action,
  status,
  adminNote,
}: {
  action: FormAction;
  status: InboxStatus;
  adminNote: string | null;
}) {
  return (
    <AdminForm action={action} submitLabel="更新處理狀態">
      <SelectField
        label="處理狀態"
        name="status"
        defaultValue={status}
        options={INBOX_STATUSES.map((value) => ({ value, label: inboxStatusLabel[value] }))}
      />
      <TextAreaField label="處理備註" name="adminNote" defaultValue={adminNote} rows={4} maxLength={5000} hint="只在後台顯示" />
    </AdminForm>
  );
}

export function countByStatus(rows: { status: string; _count: { _all: number } }[]): Record<InboxStatus, number> {
  const counts = { NEW: 0, IN_PROGRESS: 0, CLOSED: 0 };
  for (const row of rows) {
    const status = parseInboxStatus(row.status);
    if (status) counts[status] = row._count._all;
  }
  return counts;
}
