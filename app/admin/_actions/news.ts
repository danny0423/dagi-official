"use server";

import { redirect, RedirectType } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { authorizeAction } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import { revalidateContent, slugConflict, slugRaceFailure, topSortOrder } from "@/lib/admin/content";
import {
  formToObject,
  isForeignKeyViolation,
  isNotFound,
  isUniqueViolation,
  parseId,
  validationFailure,
  zCheckbox,
  zDate,
  zOptionalId,
  zOptionalSlug,
  zOptionalText,
  zText,
  withSlugFromTitle,
} from "@/lib/admin/validation";

// 網址代稱留空時依標題產生（withSlugFromTitle）；重複時回欄位錯誤並建議加上 -2 之類的後綴
const newsSchema = withSlugFromTitle(
  z.object({
    title: zText("標題", 200),
    slug: zOptionalSlug,
    summary: zOptionalText(500),
    content: zText("內文", 50000),
    publishedAt: zDate("日期"),
    coverImageId: zOptionalId,
    published: zCheckbox,
  }),
);

// 存檔失敗的已知原因轉成畫面訊息。唯一索引衝突：送出前已查過代稱，這裡是兩人同時送出同一個代稱的競態
async function saveError(error: unknown, slug: string, excludeId?: number): Promise<ActionState> {
  if (isUniqueViolation(error)) return slugRaceFailure("news", slug, excludeId);
  if (isForeignKeyViolation(error)) return failure("選擇的圖片已不存在，請重新選擇");
  if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
  throw error;
}

export async function createNews(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const parsed = newsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const conflict = await slugConflict("news", parsed.data.slug);
  if (conflict) return conflict;

  let id: number;
  try {
    const created = await prisma.news.create({
      data: { ...parsed.data, sortOrder: await topSortOrder("news") },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    return saveError(error, parsed.data.slug);
  }
  revalidateContent("news");
  redirect(`/admin/news/${id}?notice=created`, RedirectType.replace);
}

export async function updateNews(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = newsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const conflict = await slugConflict("news", parsed.data.slug, id);
  if (conflict) return conflict;

  try {
    await prisma.news.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return saveError(error, parsed.data.slug, id);
  }
  revalidateContent("news");
  return success("已儲存");
}
