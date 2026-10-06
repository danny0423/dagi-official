import Link from "next/link";
import type { ReactNode } from "react";
import { PERMISSION_DENIED_MESSAGE } from "@/lib/admin/action-state";
import type { PublicLink } from "@/lib/admin/public-url";

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
  denied: { text: PERMISSION_DENIED_MESSAGE, tone: "err" },
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

// 「前台查看」：新分頁開啟這筆內容在前台的位置（網址規則在 lib/admin/public-url.ts）。
// 訪客看不到的內容也能點，登入後台的人會看到預覽（lib/preview.ts）；旁邊的小字說明訪客看不看得到。
export function ViewOnSiteLink({ link, title }: { link: PublicLink; title: string }) {
  const status = link.guestVisible ? "前台" : "預覽（訪客看不到）";
  return (
    <span className="adm-view-site">
      <a
        href={link.href}
        target="_blank"
        rel="noopener"
        className="adm-btn adm-btn-sm"
        aria-label={`前台查看「${title}」，${status}，在新分頁開啟`}
      >
        前台查看<span aria-hidden="true" className="adm-view-site-icon">↗</span>
      </a>
      <span className={link.guestVisible ? "adm-view-site-status" : "adm-view-site-status is-preview"} aria-hidden="true">
        {status}
      </span>
    </span>
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
