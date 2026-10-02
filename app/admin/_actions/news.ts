"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import { revalidateContent, topSortOrder } from "@/lib/admin/content";
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
  zOptionalText,
  zSlug,
  zText,
} from "@/lib/admin/validation";

const newsSchema = z.object({
  title: zText("標題", 200),
  slug: zSlug,
  summary: zOptionalText(500),
  content: zText("內文", 50000),
  publishedAt: zDate("日期"),
  coverImageId: zOptionalId,
  published: zCheckbox,
});

function saveError(error: unknown): ActionState {
  if (isUniqueViolation(error)) return failure("請修正標示的欄位", { slug: ["這個網址代稱已被使用"] });
  if (isForeignKeyViolation(error)) return failure("選擇的圖片已不存在，請重新選擇");
  if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
  throw error;
}

export async function createNews(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = newsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let id: number;
  try {
    const created = await prisma.news.create({
      data: { ...parsed.data, sortOrder: await topSortOrder("news") },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    return saveError(error);
  }
  revalidateContent("news");
  redirect(`/admin/news/${id}?notice=created`);
}

export async function updateNews(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = newsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.news.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return saveError(error);
  }
  revalidateContent("news");
  return success("已儲存");
}
