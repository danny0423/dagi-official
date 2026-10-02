import type { NextRequest } from "next/server";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/admin/session";
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/admin/rate-limit";
import { getClientIp, isSameOrigin, jsonError } from "@/lib/admin/request";
import { PASSWORD_MAX_LENGTH, verifyAgainstDummy, verifyPassword } from "@/lib/password";

// 後台登入（D12）。接受 JSON（登入頁的 fetch）或一般表單（沒有 JS 時）。
// 失敗訊息一律相同，不透露帳號是否存在或是否被停用。

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

const INVALID_MESSAGE = "Email 或密碼錯誤";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("來源不符", 403);

  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let raw: unknown;
  try {
    raw = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(isJson, 400, "請輸入 Email 與密碼", "missing");
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return reply(isJson, 400, "請輸入 Email 與密碼", "missing");
  const { email, password } = parsed.data;

  const ip = getClientIp(request.headers);
  const limit = checkLoginAllowed(ip, email);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSec / 60));
    return reply(isJson, 429, `嘗試次數過多，請 ${minutes} 分鐘後再試`, "limited", {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const user = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, isActive: true },
  });
  const passwordOk = user ? await verifyPassword(user.passwordHash, password) : await verifyAgainstDummy(password);

  if (!user || !passwordOk || !user.isActive) {
    recordLoginFailure(ip, email);
    return reply(isJson, 401, INVALID_MESSAGE, "invalid");
  }

  clearLoginFailures(ip, email);
  // 順手清掉過期的 session
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await createSession(user.id, { ipAddress: ip, userAgent: request.headers.get("user-agent") });
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  if (isJson) return Response.json({ ok: true, redirectTo: "/admin" });
  return new Response(null, { status: 303, headers: { Location: "/admin" } });
}

function reply(isJson: boolean, status: number, message: string, code: string, headers?: Record<string, string>) {
  if (isJson) return jsonError(message, status, headers);
  return new Response(null, { status: 303, headers: { Location: `/admin/login?error=${code}`, ...headers } });
}
