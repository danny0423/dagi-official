"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import {
  CONTENT_KINDS,
  contentDelegate,
  contentOrderBy,
  isContentKind,
  revalidateContent,
} from "@/lib/admin/content";
import { isNotFound, parseId } from "@/lib/admin/validation";

// 五種內容共用的列表操作：上下架、上移／下移、刪除。
// kind 與 id 是從畫面 bind 進來的，可能被竄改，一律重新驗證。

export async function togglePublished(kind: unknown, rawId: unknown): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!isContentKind(kind) || !id) return failure("參數錯誤");

  const row = await contentDelegate(kind).findUnique({ where: { id }, select: { id: true, published: true } });
  if (!row) return failure("找不到這筆資料，可能已被刪除");
  const nextPublished = !row.published;

  if (kind === "team" && nextPublished) {
    const member = await prisma.teamMember.findUnique({ where: { id }, select: { consentToPublish: true } });
    if (!member?.consentToPublish) return failure("尚未取得當事人同意公開，不能上架");
  }

  await contentDelegate(kind).update({ where: { id }, data: { published: nextPublished } });
  revalidateContent(kind);
  return success(nextPublished ? "已上架" : "已下架");
}

export async function moveContent(
  kind: unknown,
  rawId: unknown,
  direction: unknown,
): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!isContentKind(kind) || !id || (direction !== "up" && direction !== "down")) return failure("參數錯誤");

  const delegate = contentDelegate(kind);
  const rows = await delegate.findMany({ select: { id: true }, orderBy: contentOrderBy });
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return failure("找不到這筆資料，可能已被刪除");
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return failure(direction === "up" ? "已經是第一筆" : "已經是最後一筆");

  // 交換位置後整批重新編號（間隔 10），順便修正重複的排序值
  [rows[index], rows[target]] = [rows[target]!, rows[index]!];
  await prisma.$transaction(
    rows.map((row, i) => delegate.update({ where: { id: row.id }, data: { sortOrder: i * 10 } })),
  );
  revalidateContent(kind);
  return success(direction === "up" ? "已上移" : "已下移");
}

export async function deleteContent(kind: unknown, rawId: unknown): Promise<ActionState> {
  await requireAdmin();
  const id = parseId(rawId);
  if (!isContentKind(kind) || !id) return failure("參數錯誤");

  try {
    await contentDelegate(kind).delete({ where: { id } });
  } catch (error) {
    if (isNotFound(error)) return failure("找不到這筆資料，可能已被刪除");
    throw error;
  }
  // 只刪內容本身；用到的圖片留在媒體庫，需要時再到媒體庫刪
  revalidateContent(kind);
  redirect(`${CONTENT_KINDS[kind].adminPath}?notice=deleted`);
}
