import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

// 五種可上下架、可排序的內容：共用的設定與資料庫操作

export const CONTENT_KINDS = {
  projects: { label: "工程實績", adminPath: "/admin/projects", publicPaths: ["/", "/projects", "/projects/[slug]"] },
  news: { label: "最新消息", adminPath: "/admin/news", publicPaths: ["/", "/news"] },
  jobs: { label: "職缺", adminPath: "/admin/jobs", publicPaths: ["/careers"] },
  team: { label: "團隊成員", adminPath: "/admin/team", publicPaths: ["/about/team"] },
  certifications: { label: "證照", adminPath: "/admin/certifications", publicPaths: ["/about/license"] },
} as const;

export type ContentKind = keyof typeof CONTENT_KINDS;

export function isContentKind(value: unknown): value is ContentKind {
  return typeof value === "string" && Object.hasOwn(CONTENT_KINDS, value);
}

// 五個 Prisma delegate 的共同部分（都有 id、published、sortOrder）
type SortableDelegate = {
  findMany(args: {
    select: { id: true };
    orderBy: Array<{ sortOrder: "asc" } | { id: "desc" }>;
  }): Promise<Array<{ id: number }>>;
  findFirst(args: { select: { sortOrder: true }; orderBy: { sortOrder: "asc" } }): Promise<{ sortOrder: number } | null>;
  findUnique(args: { where: { id: number }; select: { id: true; published: true } }): Promise<{
    id: number;
    published: boolean;
  } | null>;
  update(args: { where: { id: number }; data: { published?: boolean; sortOrder?: number } }): Prisma.PrismaPromise<unknown>;
  delete(args: { where: { id: number } }): Promise<unknown>;
};

export function contentDelegate(kind: ContentKind): SortableDelegate {
  const delegates = {
    projects: prisma.project,
    news: prisma.news,
    jobs: prisma.job,
    team: prisma.teamMember,
    certifications: prisma.certification,
  };
  return delegates[kind] as unknown as SortableDelegate;
}

// 列表排序規則：sortOrder 小的在前，同值時新的在前
export const contentOrderBy = [{ sortOrder: "asc" as const }, { id: "desc" as const }];

// 新增的資料排在最上面
export async function topSortOrder(kind: ContentKind): Promise<number> {
  const first = await contentDelegate(kind).findFirst({ select: { sortOrder: true }, orderBy: { sortOrder: "asc" } });
  return (first?.sortOrder ?? 10) - 10;
}

// 內容變動後：後台列表、儀表板與對應的前台頁面都重新產生
export function revalidateContent(kind: ContentKind): void {
  const config = CONTENT_KINDS[kind];
  revalidatePath("/admin");
  revalidatePath(config.adminPath, "layout");
  for (const path of config.publicPaths) {
    if (path.includes("[")) revalidatePath(path, "page");
    else revalidatePath(path);
  }
}
