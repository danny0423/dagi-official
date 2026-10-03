"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { authorizeAction } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import { formToObject, isNotFound, parseId, validationFailure, zOptionalText } from "@/lib/admin/validation";
import { inboxFilterQuery, parseInboxFilterQuery } from "@/lib/admin/inbox";

// 收件匣（工程洽詢、協力廠商）：ADMIN 與 EDITOR 都可以處理

const inboxSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"], { error: "請選擇處理狀態" }),
  adminNote: zOptionalText(5000),
});

const INBOX = {
  inquiries: { path: "/admin/inquiries" },
  vendors: { path: "/admin/vendor-applications" },
} as const;
type InboxKind = keyof typeof INBOX;

function isInboxKind(value: unknown): value is InboxKind {
  return typeof value === "string" && Object.hasOwn(INBOX, value);
}

function revalidateInbox() {
  // 側邊選單有未處理數量，整個後台都要更新
  revalidatePath("/admin", "layout");
}

export async function updateInboxItem(
  kind: unknown,
  rawId: unknown,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const id = parseId(rawId);
  if (!isInboxKind(kind) || !id) return failure("參數錯誤");
  const parsed = inboxSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    if (kind === "inquiries") await prisma.inquiry.update({ where: { id }, data: parsed.data });
    else await prisma.vendorApplication.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
    throw error;
  }
  revalidateInbox();
  return success("已更新處理狀態");
}

// returnQuery：詳細頁目前的列表篩選（例：?status=NEW&page=2），刪除後回到同一個篩選
export async function deleteInboxItem(kind: unknown, rawId: unknown, returnQuery?: unknown): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const id = parseId(rawId);
  if (!isInboxKind(kind) || !id) return failure("參數錯誤");

  try {
    if (kind === "inquiries") await prisma.inquiry.delete({ where: { id } });
    else await prisma.vendorApplication.delete({ where: { id } });
  } catch (error) {
    if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
    throw error;
  }
  revalidateInbox();
  const filter = parseInboxFilterQuery(returnQuery);
  redirect(`${INBOX[kind].path}${inboxFilterQuery(filter, { notice: "deleted" })}`, RedirectType.replace);
}
