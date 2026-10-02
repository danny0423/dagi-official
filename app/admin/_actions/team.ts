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
  parseId,
  validationFailure,
  zCheckbox,
  zOptionalDate,
  zOptionalId,
  zOptionalText,
  zText,
} from "@/lib/admin/validation";

// 團隊成員：沒勾「已取得同意公開」不得上架（AGENTS.md 內容鐵則），伺服器端強制檢查
const teamSchema = z
  .object({
    name: zText("姓名", 100),
    title: zOptionalText(100),
    licenses: zOptionalText(2000),
    bio: zOptionalText(5000),
    experience: zOptionalText(10000),
    photoId: zOptionalId,
    consentToPublish: zCheckbox,
    consentDate: zOptionalDate,
    published: zCheckbox,
  })
  .refine((d) => !d.published || d.consentToPublish, {
    path: ["published"],
    message: "尚未取得當事人同意公開，不能上架",
  });

function saveError(error: unknown): ActionState {
  if (isForeignKeyViolation(error)) return failure("選擇的照片已不存在，請重新選擇");
  if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
  throw error;
}

export async function createTeamMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = teamSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let id: number;
  try {
    const created = await prisma.teamMember.create({
      data: { ...parsed.data, sortOrder: await topSortOrder("team") },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    return saveError(error);
  }
  revalidateContent("team");
  redirect(`/admin/team/${id}?notice=created`);
}

export async function updateTeamMember(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = teamSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.teamMember.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return saveError(error);
  }
  revalidateContent("team");
  return success("已儲存");
}
