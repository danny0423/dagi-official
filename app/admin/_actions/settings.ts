"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { authorizeAction } from "@/lib/admin/guard";
import { success, type ActionState } from "@/lib/admin/action-state";
import {
  formToObject,
  validationFailure,
  zOptionalDate,
  zOptionalEmail,
  zOptionalInt,
  zOptionalText,
  zOptionalUrl,
  zText,
} from "@/lib/admin/validation";

// 公司資料（只有一筆，id = 1）。只有 ADMIN 能改。
const settingsSchema = z.object({
  name: zText("公司名稱", 100),
  englishName: zOptionalText(200),
  taxId: zOptionalText(8).refine((v) => v === null || /^\d{8}$/.test(v), "統一編號為 8 碼數字"),
  representative: zOptionalText(50),
  foundedOn: zOptionalDate,
  contractorGrade: zOptionalText(20),
  licenseNumber: zOptionalText(100),
  registeredCity: zOptionalText(20),
  registrationAuthority: zOptionalText(100),
  capital: zOptionalText(100),
  engineerCount: zOptionalInt(0, 10000),
  address: zOptionalText(200),
  phone: zOptionalText(50),
  fax: zOptionalText(50),
  email: zOptionalEmail,
  serviceHours: zOptionalText(100),
  responseTime: zOptionalText(100),
  groupUrl: zOptionalUrl,
  description: zOptionalText(300),
});

export async function updateCompanySettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction("ADMIN");
  if (!auth.ok) return auth.state;
  const parsed = settingsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  await prisma.companySettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });
  // 公司資料出現在全站頁尾，整站重新產生
  revalidatePath("/", "layout");
  return success("已儲存公司資料");
}
