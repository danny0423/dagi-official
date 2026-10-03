import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { failure, type ActionState } from "@/lib/admin/action-state";
import { SLUG_MAX_LENGTH, truncateSlug } from "@/lib/admin/slug";

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

// ───── 網址代稱（工程實績、最新消息）唯一性檢查 ─────

export type SlugKind = Extract<ContentKind, "projects" | "news">;

async function takenSlugs(kind: SlugKind, slugs: string[], excludeId?: number): Promise<Set<string>> {
  const where = { slug: { in: slugs }, ...(excludeId ? { id: { not: excludeId } } : {}) };
  const rows =
    kind === "projects"
      ? await prisma.project.findMany({ where, select: { slug: true } })
      : await prisma.news.findMany({ where, select: { slug: true } });
  return new Set(rows.map((row) => row.slug));
}

// 找一個還沒被用過的「原代稱-2」「原代稱-3」…；都被用了就回傳 null
async function suggestFreeSlug(kind: SlugKind, slug: string, excludeId?: number): Promise<string | null> {
  const candidates = Array.from({ length: 19 }, (_, i) => {
    const suffix = `-${i + 2}`;
    return `${truncateSlug(slug, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
  });
  const taken = await takenSlugs(kind, candidates, excludeId);
  return candidates.find((candidate) => !taken.has(candidate)) ?? null;
}

// 代稱重複時回傳欄位錯誤（含建議值）；沒重複回傳 null。
// 送出前先查一次，資料庫的唯一索引另外擋同時送出的競態（見各 action 的 isUniqueViolation）。
export async function slugConflict(kind: SlugKind, slug: string, excludeId?: number): Promise<NonNullable<ActionState> | null> {
  const taken = await takenSlugs(kind, [slug], excludeId);
  if (!taken.has(slug)) return null;
  return slugTakenFailure(kind, slug, await suggestFreeSlug(kind, slug, excludeId));
}

export async function slugRaceFailure(kind: SlugKind, slug: string, excludeId?: number): Promise<NonNullable<ActionState>> {
  return slugTakenFailure(kind, slug, await suggestFreeSlug(kind, slug, excludeId));
}

function slugTakenFailure(kind: SlugKind, slug: string, suggestion: string | null): NonNullable<ActionState> {
  const label = CONTENT_KINDS[kind].label;
  const message = suggestion
    ? `「${slug}」已被其他${label}使用，可以改成「${suggestion}」`
    : `「${slug}」已被其他${label}使用，請換一個`;
  return failure("請修正標示的欄位", { slug: [message] }, suggestion ? { slug: suggestion } : undefined);
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
