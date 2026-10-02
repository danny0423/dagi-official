import Link from "next/link";
import type { ReactNode } from "react";

// 後台頁面共用的小元件（server component）

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="adm-page-header">
      <div>
        {back && (
          <p className="adm-breadcrumb">
            <Link href={back.href}>← {back.label}</Link>
          </p>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="adm-actions">{actions}</div>}
    </header>
  );
}

const NOTICES: Record<string, { text: string; tone: "ok" | "err" | "warn" }> = {
  created: { text: "已新增", tone: "ok" },
  deleted: { text: "已刪除", tone: "ok" },
  saved: { text: "已儲存", tone: "ok" },
  denied: { text: "權限不足：這個功能只有管理員可以使用", tone: "err" },
};

// 依網址參數 ?notice=xxx 顯示一次性的提示（新增後導頁、刪除後回列表時用）
export function Notice({ code }: { code?: string | string[] }) {
  const notice = typeof code === "string" ? NOTICES[code] : undefined;
  if (!notice) return null;
  return (
    <p role="status" className={`adm-msg adm-msg-${notice.tone}`}>
      {notice.text}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="adm-empty">{children}</div>;
}

export function PublishedBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="adm-badge adm-badge-ok">上架中</span>
  ) : (
    <span className="adm-badge">未上架</span>
  );
}

export function Pager({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="adm-actions" aria-label="分頁">
      {page > 1 && (
        <Link className="adm-btn adm-btn-sm" href={href(page - 1)}>
          上一頁
        </Link>
      )}
      <span className="adm-hint">
        第 {page} / {pageCount} 頁
      </span>
      {page < pageCount && (
        <Link className="adm-btn adm-btn-sm" href={href(page + 1)}>
          下一頁
        </Link>
      )}
    </nav>
  );
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export type IdParams = Promise<{ id: string }>;
