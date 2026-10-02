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

const certificationSchema = z
  .object({
    name: zText("證照名稱", 200),
    issuer: zOptionalText(200),
    certificateNumber: zOptionalText(100),
    issuedOn: zOptionalDate,
    expiresOn: zOptionalDate,
    note: zOptionalText(2000),
    imageId: zOptionalId,
    published: zCheckbox,
  })
  .refine((d) => !d.issuedOn || !d.expiresOn || d.expiresOn >= d.issuedOn, {
    path: ["expiresOn"],
    message: "有效期限不能早於發證日期",
  });

function saveError(error: unknown): ActionState {
  if (isForeignKeyViolation(error)) return failure("選擇的圖片已不存在，請重新選擇");
  if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
  throw error;
}

export async function createCertification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = certificationSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let id: number;
  try {
    const created = await prisma.certification.create({
      data: { ...parsed.data, sortOrder: await topSortOrder("certifications") },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    return saveError(error);
  }
  revalidateContent("certifications");
  redirect(`/admin/certifications/${id}?notice=created`);
}

export async function updateCertification(
  rawId: unknown,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = certificationSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.certification.update({ where: { id }, data: parsed.data });
  } catch (error) {
    return saveError(error);
  }
  revalidateContent("certifications");
  return success("已儲存");
}
