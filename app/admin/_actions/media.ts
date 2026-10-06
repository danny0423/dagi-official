"use server";

import { revalidatePath, updateTag } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { authorizeAction } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import { formToObject, isForeignKeyViolation, isNotFound, parseId, validationFailure, zOptionalText } from "@/lib/admin/validation";
import { getMediaUsage } from "@/lib/media";
import { getStorage } from "@/lib/storage";
import { SITE_TAGS } from "@/lib/site-data/tags";

// 媒體庫：改替代文字、刪除（被內容引用時不能刪，並列出引用處）。上傳走 /api/admin/media。

const altSchema = z.object({ alt: zOptionalText(300) });

export async function updateMediaAlt(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = altSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.media.update({ where: { id }, data: { alt: parsed.data.alt ?? "" } });
  } catch (error) {
    if (isNotFound(error)) return failure("找不到這張圖片，可能已被刪除");
    throw error;
  }
  // 前台的團隊照片、證照圖、工程照片都帶 alt：用到圖片的前台資料快取一起失效
  updateTag(SITE_TAGS.media);
  revalidatePath("/admin/media");
  return success("已儲存替代文字");
}

export async function deleteMedia(rawId: unknown): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");

  const usage = await getMediaUsage(id);
  if (usage.length > 0) {
    return failure(`這張圖片還在使用中，請先移除引用再刪除：${usage.map((u) => u.label).join("、")}`);
  }

  let storageKey: string;
  try {
    const deleted = await prisma.media.delete({ where: { id }, select: { storageKey: true } });
    storageKey = deleted.storageKey;
  } catch (error) {
    if (isNotFound(error)) return failure("找不到這張圖片，可能已被刪除");
    // 檢查完到刪除之間剛好被引用（資料庫的 Restrict 擋下）
    if (isForeignKeyViolation(error)) return failure("這張圖片剛被內容引用，請重新整理後再試");
    throw error;
  }

  try {
    await getStorage().delete(storageKey);
  } catch (error) {
    // 資料已刪，檔案刪不掉只記 log（留下孤兒檔案不影響網站）
    console.error("[media delete] 檔案刪除失敗", storageKey, error);
  }
  revalidatePath("/admin/media");
  return success("已刪除");
}
