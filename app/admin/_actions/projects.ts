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
  parseIdList,
  validationFailure,
  zCheckbox,
  zOptionalDate,
  zOptionalId,
  zOptionalSlug,
  zOptionalText,
  zText,
  withSlugFromTitle,
} from "@/lib/admin/validation";

// 網址代稱留空時依工程名稱產生（withSlugFromTitle）；重複時回欄位錯誤並建議加上 -2 之類的後綴
const projectSchema = withSlugFromTitle(
  z
    .object({
      title: zText("工程名稱", 200),
      slug: zOptionalSlug,
      category: zOptionalText(100),
      location: zOptionalText(200),
      structure: zOptionalText(100),
      scale: zOptionalText(200),
      client: zOptionalText(200),
      startDate: zOptionalDate,
      endDate: zOptionalDate,
      status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"], { error: "請選擇工程狀態" }),
      summary: zOptionalText(500),
      description: zOptionalText(20000),
      featured: zCheckbox,
      published: zCheckbox,
      coverImageId: zOptionalId,
    })
    .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
      path: ["endDate"],
      message: "完工日期不能早於開工日期",
    }),
);

// 存檔失敗的已知原因轉成畫面訊息。唯一索引衝突：送出前已查過代稱，這裡是兩人同時送出同一個代稱的競態
async function saveError(error: unknown, slug: string, excludeId?: number): Promise<ActionState> {
  if (isUniqueViolation(error)) return slugRaceFailure("projects", slug, excludeId);
  if (isForeignKeyViolation(error)) return failure("選擇的圖片已不存在，請重新選擇");
  if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
  throw error;
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const parsed = projectSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const conflict = await slugConflict("projects", parsed.data.slug);
  if (conflict) return conflict;
  const galleryIds = parseIdList(formData, "galleryIds");

  let id: number;
  try {
    const created = await prisma.project.create({
      data: {
        ...parsed.data,
        sortOrder: await topSortOrder("projects"),
        images: { create: galleryIds.map((mediaId, i) => ({ mediaId, sortOrder: i })) },
      },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    return saveError(error, parsed.data.slug);
  }
  revalidateContent("projects");
  redirect(`/admin/projects/${id}?notice=created`, RedirectType.replace);
}

export async function updateProject(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = projectSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const conflict = await slugConflict("projects", parsed.data.slug, id);
  if (conflict) return conflict;
  const galleryIds = parseIdList(formData, "galleryIds");

  try {
    await prisma.$transaction([
      prisma.project.update({ where: { id }, data: parsed.data }),
      prisma.projectImage.deleteMany({ where: { projectId: id } }),
      prisma.projectImage.createMany({
        data: galleryIds.map((mediaId, i) => ({ projectId: id, mediaId, sortOrder: i })),
      }),
    ]);
  } catch (error) {
    return saveError(error, parsed.data.slug, id);
  }
  revalidateContent("projects");
  return success("已儲存");
}
