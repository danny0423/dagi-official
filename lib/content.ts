import type { Prisma } from "@/lib/generated/prisma/client";

// 前台讀內容時共用的條件（前台改成讀資料庫時使用）。

// 團隊成員：必須「已上架」且「已取得同意公開」才能出現在前台（AGENTS.md 內容鐵則）
export const publicTeamMemberWhere = {
  published: true,
  consentToPublish: true,
} satisfies Prisma.TeamMemberWhereInput;
