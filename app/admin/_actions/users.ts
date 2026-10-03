"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { authorizeAction } from "@/lib/admin/guard";
import { destroyUserSessions } from "@/lib/admin/session";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import {
  formToObject,
  isUniqueViolation,
  passwordPair,
  parseId,
  validationFailure,
  zEmail,
  zText,
} from "@/lib/admin/validation";
import { hashPassword } from "@/lib/password";

// 帳號管理：只有 ADMIN 能用。不能停用自己、不能改自己的角色，且至少要留一個啟用中的 ADMIN。

const zRole = z.enum(["ADMIN", "EDITOR"], { error: "請選擇角色" });

const createSchema = z
  .object({ email: zEmail, name: zText("名稱", 100), role: zRole })
  .and(passwordPair);

const updateSchema = z.object({ name: zText("名稱", 100), role: zRole });

async function otherActiveAdminExists(excludeUserId: number): Promise<boolean> {
  const count = await prisma.adminUser.count({
    where: { role: "ADMIN", isActive: true, id: { not: excludeUserId } },
  });
  return count > 0;
}

function revalidateUsers() {
  revalidatePath("/admin/users", "layout");
}

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction("ADMIN");
  if (!auth.ok) return auth.state;
  const parsed = createSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { email, name, role, password } = parsed.data;

  let id: number;
  try {
    const created = await prisma.adminUser.create({
      data: { email, name, role, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) return failure("請修正標示的欄位", { email: ["這個 Email 已經有帳號"] });
    throw error;
  }
  revalidateUsers();
  redirect(`/admin/users/${id}?notice=created`, RedirectType.replace);
}

export async function updateUser(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction("ADMIN");
  if (!auth.ok) return auth.state;
  const me = auth.user;
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = updateSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const target = await prisma.adminUser.findUnique({ where: { id }, select: { role: true } });
  if (!target) return failure("找不到這個帳號");
  if (target.role !== parsed.data.role) {
    if (id === me.id) return failure("不能修改自己的角色", { role: ["不能修改自己的角色"] });
    if (target.role === "ADMIN" && !(await otherActiveAdminExists(id))) {
      return failure("至少要保留一個啟用中的管理員", { role: ["至少要保留一個啟用中的管理員"] });
    }
  }

  await prisma.adminUser.update({ where: { id }, data: parsed.data });
  revalidateUsers();
  return success("已儲存");
}

export async function setUserActive(rawId: unknown, active: unknown): Promise<ActionState> {
  const auth = await authorizeAction("ADMIN");
  if (!auth.ok) return auth.state;
  const me = auth.user;
  const id = parseId(rawId);
  if (!id || typeof active !== "boolean") return failure("參數錯誤");
  if (id === me.id && !active) return failure("不能停用自己的帳號");

  const target = await prisma.adminUser.findUnique({ where: { id }, select: { role: true } });
  if (!target) return failure("找不到這個帳號");
  if (!active && target.role === "ADMIN" && !(await otherActiveAdminExists(id))) {
    return failure("至少要保留一個啟用中的管理員");
  }

  await prisma.adminUser.update({ where: { id }, data: { isActive: active } });
  // 停用後立即登出該帳號所有裝置
  if (!active) await destroyUserSessions(id);
  revalidateUsers();
  return success(active ? "已啟用" : "已停用，該帳號已被登出");
}

export async function resetUserPassword(rawId: unknown, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction("ADMIN");
  if (!auth.ok) return auth.state;
  const me = auth.user;
  const id = parseId(rawId);
  if (!id) return failure("參數錯誤");
  const parsed = passwordPair.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const target = await prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
  if (!target) return failure("找不到這個帳號");

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  // 改密碼後該帳號其他裝置全部登出（自己改自己時保留目前這個 session）
  await destroyUserSessions(id, id === me.id ? auth.sessionId : undefined);
  revalidateUsers();
  return success("已重設密碼，該帳號其他已登入的裝置都已登出");
}
