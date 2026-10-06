import type { Prisma } from "@/lib/generated/prisma/client";

// 前台讀內容時共用的條件。前台（lib/site-data/）、後台儀表板的上線前檢查、scripts/check-launch.ts 都用這裡，
// 三邊對「哪些資料會出現在前台」的判斷才會一致。

// 團隊成員：必須「已上架」且「已取得同意公開」才能出現在前台（AGENTS.md 內容鐵則）
export const publicTeamMemberWhere = {
  published: true,
  consentToPublish: true,
} satisfies Prisma.TeamMemberWhereInput;

// 工程實績、最新消息、職缺：已上架就出現在前台
export const publishedWhere = { published: true } as const;

// 首頁精選工程：已上架且勾了「首頁精選」
export const featuredProjectWhere = {
  published: true,
  featured: true,
} satisfies Prisma.ProjectWhereInput;

/**
 * 證照：已上架，而且沒有過期（有效期限空白＝無期限；到期日當天仍算有效）。
 * today 是台北時間的 YYYY-MM-DD（lib/admin/format.ts 的 todayInTaipei()）。
 * 前台的快取只存「已上架」的證照，過期與否在每次請求時判斷（isCertificationValid），不會因為快取而顯示過期證照。
 */
export function publicCertificationWhere(today: string): Prisma.CertificationWhereInput {
  return {
    published: true,
    OR: [{ expiresOn: null }, { expiresOn: { gte: new Date(`${today}T00:00:00.000Z`) } }],
  };
}

/** expiresOn：YYYY-MM-DD 或 null（無期限） */
export function isCertificationValid(expiresOn: string | null, today: string): boolean {
  return expiresOn === null || expiresOn >= today;
}
