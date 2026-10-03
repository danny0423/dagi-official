"use server";

import { headers } from "next/headers";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { authorizeAction } from "@/lib/admin/guard";
import { destroyUserSessions } from "@/lib/admin/session";
import { failure, success, type ActionState } from "@/lib/admin/action-state";
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/admin/rate-limit";
import { getClientIp } from "@/lib/admin/request";
import { formToObject, passwordPair, validationFailure } from "@/lib/admin/validation";
import { hashPassword, PASSWORD_MAX_LENGTH, verifyPassword } from "@/lib/password";

// 我的帳號：所有角色都能改自己的密碼（docs/ux-review-admin.md #6）。
// 要先輸入目前密碼；成功後這個帳號其他裝置的 session 全部失效，目前這個保留。
// 目前密碼打錯會計入登入失敗次數（lib/admin/rate-limit.ts，同 IP＋同帳號），避免拿已登入的畫面猜密碼。

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "請輸入目前的密碼" })
      .min(1, "請輸入目前的密碼")
      .max(PASSWORD_MAX_LENGTH, "目前的密碼不正確"),
  })
  .and(passwordPair)
  .refine((d) => d.password !== d.currentPassword, { path: ["password"], message: "新密碼不能跟目前的密碼相同" });

export async function changeOwnPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await authorizeAction();
  if (!auth.ok) return auth.state;
  const parsed = changePasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const user = await prisma.adminUser.findUnique({
    where: { id: auth.user.id },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) return failure("找不到你的帳號，請重新登入");

  const ip = getClientIp(await headers());
  const limit = checkLoginAllowed(ip, user.email);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSec / 60));
    return failure(`密碼輸入錯誤次數過多，請 ${minutes} 分鐘後再試`);
  }
  if (!(await verifyPassword(user.passwordHash, parsed.data.currentPassword))) {
    recordLoginFailure(ip, user.email);
    return failure("請修正標示的欄位", { currentPassword: ["目前的密碼不正確"] });
  }
  clearLoginFailures(ip, user.email);

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await destroyUserSessions(user.id, auth.sessionId);
  return success("已更新密碼。這個帳號在其他裝置上的登入都已登出，目前這個裝置不受影響。");
}
