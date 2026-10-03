import { inboxStatusLabel } from "@/lib/admin/format";

// 收件匣（工程洽詢、協力廠商）的狀態與列表篩選（client／server 共用）。
// 從列表進詳細頁時把篩選（狀態＋頁碼）帶在網址上，返回列表、刪除後回列表都回到原本的篩選。

export type InboxStatus = keyof typeof inboxStatusLabel;
export const INBOX_STATUSES = Object.keys(inboxStatusLabel) as InboxStatus[];

export type InboxFilter = { status?: InboxStatus; page: number };

export function parseInboxStatus(value: unknown): InboxStatus | undefined {
  return typeof value === "string" && (INBOX_STATUSES as string[]).includes(value) ? (value as InboxStatus) : undefined;
}

export function parsePage(value: unknown): number {
  const n = Number(typeof value === "string" ? value : NaN);
  return Number.isInteger(n) && n > 1 && n < 100_000 ? n : 1;
}

export function parseInboxFilter(params: { status?: unknown; page?: unknown }): InboxFilter {
  return { status: parseInboxStatus(params.status), page: parsePage(params.page) };
}

// 頁碼超出範圍時要改去的頁碼（最後一頁）；沒超出回傳 null。
// 例：在第 2 頁刪掉（或改了狀態）該頁最後一筆，回到列表時第 2 頁已經不存在，
// 不改的話會停在「沒有符合的資料」而且看不到分頁列，以為整個篩選都空了。
export function outOfRangePage(page: number, total: number, pageSize: number): number | null {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return page > lastPage ? lastPage : null;
}

// 篩選 → 網址查詢字串（含開頭的 ?）；預設值（全部、第 1 頁）不寫進網址
export function inboxFilterQuery(filter: InboxFilter, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.page > 1) params.set("page", String(filter.page));
  for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

// 從 bind 進 server action 的查詢字串（可能被竄改）還原篩選，只認得 status、page
export function parseInboxFilterQuery(value: unknown): InboxFilter {
  if (typeof value !== "string" || value.length > 200) return { page: 1 };
  const params = new URLSearchParams(value.startsWith("?") ? value.slice(1) : value);
  return parseInboxFilter({ status: params.get("status") ?? undefined, page: params.get("page") ?? undefined });
}
