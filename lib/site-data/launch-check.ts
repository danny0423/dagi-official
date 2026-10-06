import { isLaunched, sitePages, type SitePath } from "@/lib/launch";
import { companyColumns, type PlaceholderColumn } from "@/lib/placeholder-company";
import { isBlank, type CompanyRow } from "@/lib/site-data/company";
import type { PublicContentCounts } from "@/lib/site-data/queries";

// 上線前檢查（以資料庫為準）：已開放的頁面上，哪些地方會因為資料庫空白而顯示【待填】或範例。
// 後台儀表板（權威來源：正式部署 build 時連不到資料庫）與 scripts/check-launch.ts 共用。
// 純函式，不能加 "server-only"（scripts/ 要用）。

export const SHARED = "shared";
export type UsageKey = typeof SHARED | SitePath;

/**
 * 各頁面用到、空白時會顯示【待填】的公司資料欄位（SHARED＝全站共用的頁首、頁尾、根 layout）。
 * 這是給後台儀表板用的對照表（正式環境沒有原始碼可以掃）。scripts/check-launch.ts 會掃描程式碼裡的
 * company.欄位 比對這張表，不一致時列為「上線開關設定問題」並印出正確內容，照著更新即可。
 */
export const companyColumnsByPage = {
  [SHARED]: ["taxId", "licenseNumber", "address", "phone", "email"],
  "/": ["foundedOn", "contractorGrade", "engineerCount", "responseTime"],
  "/about": ["foundedOn", "registeredCity"],
  "/about/license": ["taxId", "contractorGrade", "licenseNumber", "registrationAuthority", "capital", "representative"],
  "/about/team": [],
  "/about/group": [],
  "/services": ["contractorGrade"],
  "/safety-quality": [],
  "/contact": ["address", "fax", "serviceHours", "responseTime"],
  "/privacy": [],
  "/projects": [],
  "/news": [],
  "/careers": [],
  "/partners": [],
} as const satisfies Record<UsageKey, readonly PlaceholderColumn[]>;

export type ContentFallbackKind = keyof PublicContentCounts;

/** 資料庫沒有符合條件的資料時，頁面會改顯示待填範例的內容區塊。 */
export const contentFallbacks: readonly {
  kind: ContentFallbackKind;
  page: SitePath;
  /** 這個區塊還要另一頁開放才會顯示（首頁精選工程跟著 /projects） */
  requires?: SitePath;
  label: string;
  condition: string;
  adminHref: string;
}[] = [
  { kind: "team", page: "/about/team", label: "團隊成員", condition: "已上架且已取得同意公開的團隊成員", adminHref: "/admin/team" },
  { kind: "certifications", page: "/about/license", label: "證照與認證", condition: "已上架且未過期的證照", adminHref: "/admin/certifications" },
  { kind: "featuredProjects", page: "/", requires: "/projects", label: "首頁精選工程", condition: "已上架且勾選「首頁精選」的工程", adminHref: "/admin/projects" },
  { kind: "projects", page: "/projects", label: "工程實績", condition: "已上架的工程實績", adminHref: "/admin/projects" },
  { kind: "news", page: "/news", label: "最新消息", condition: "已上架的最新消息", adminHref: "/admin/news" },
  { kind: "jobs", page: "/careers", label: "職缺", condition: "已上架的職缺", adminHref: "/admin/jobs" },
];

export function usageName(key: UsageKey): string {
  return key === SHARED ? "全站頁首／頁尾" : sitePages.find((page) => page.path === key)?.name ?? key;
}

export type CompanyLaunchIssue = { column: PlaceholderColumn; label: string; placeholder: string; pages: string[] };
export type ContentLaunchIssue = { kind: ContentFallbackKind; label: string; page: string; condition: string; adminHref: string };

/** 已開放頁面會用到、但 company_settings 仍空白的欄位（依後台表單順序）。 */
export function companyLaunchIssues(row: CompanyRow | null): CompanyLaunchIssue[] {
  const keys = (Object.keys(companyColumnsByPage) as UsageKey[]).filter((key) => key === SHARED || isLaunched(key));
  const issues: CompanyLaunchIssue[] = [];
  for (const column of Object.keys(companyColumns) as (keyof typeof companyColumns)[]) {
    const info = companyColumns[column];
    if (info.placeholder === null || !isBlank(row, column)) continue;
    const pages = keys.filter((key) => (companyColumnsByPage[key] as readonly string[]).includes(column)).map(usageName);
    if (pages.length > 0) issues.push({ column: column as PlaceholderColumn, label: info.label, placeholder: info.placeholder, pages });
  }
  return issues;
}

/** 已開放頁面上，因為資料庫沒有資料而顯示待填範例的內容區塊。 */
export function contentLaunchIssues(counts: PublicContentCounts): ContentLaunchIssue[] {
  return contentFallbacks
    .filter((item) => isLaunched(item.page) && (!item.requires || isLaunched(item.requires)) && counts[item.kind] === 0)
    .map((item) => ({ kind: item.kind, label: item.label, page: usageName(item.page), condition: item.condition, adminHref: item.adminHref }));
}
