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
  parseIdList,
  validationFailure,
  zCheckbox,
  zOptionalDate,
  zOptionalId,
  zOptionalText,
  zSlug,
  zText,
} from "@/lib/admin/validation";

const projectSchema = z
  .object({
    title: zText("工程名稱", 200),
    slug: zSlug,
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
  });

function saveError(error: unknown): ActionState {
  if (isUniqueViolation(error)) return failure("請修正標示的欄位", { slug: ["這個網址代稱已被使用"] });
  if (isForeignKeyViolation(error)) return failure("選擇的圖片已不存在，請重新選擇");
  if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
  throw error;
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
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
    return saveError(error);
  }
  revalidateContent("projects");
  redirect(`/admin/projects/${id}?notice=created`);
}

export async function updateProject(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = projectSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
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
    return saveError(error);
  }
  revalidateContent("projects");
  return success("已儲存");
}
