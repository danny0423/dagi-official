"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import { revalidateContent, topSortOrder } from "@/lib/admin/content";
import {
  formToObject,
  isNotFound,
  parseId,
  validationFailure,
  zCheckbox,
  zOptionalText,
  zText,
} from "@/lib/admin/validation";

const jobSchema = z.object({
  title: zText("職缺名稱", 200),
  department: zOptionalText(100),
  location: zOptionalText(200),
  employmentType: zOptionalText(50),
  salary: zOptionalText(200),
  description: zOptionalText(10000),
  requirements: zOptionalText(10000),
  benefits: zOptionalText(10000),
  published: zCheckbox,
});

export async function createJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = jobSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const created = await prisma.job.create({
    data: { ...parsed.data, sortOrder: await topSortOrder("jobs") },
    select: { id: true },
  });
  revalidateContent("jobs");
  redirect(`/admin/jobs/${created.id}?notice=created`);
}

export async function updateJob(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = jobSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.job.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
    throw error;
  }
  revalidateContent("jobs");
  return success("已儲存");
}
