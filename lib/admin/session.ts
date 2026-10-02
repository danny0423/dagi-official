import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/auth";

// 後台 session（D12）：cookie 放 32 bytes 隨機 token，資料庫只存 SHA-256 雜湊。

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: number,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
      ipAddress: meta.ipAddress?.slice(0, 100) ?? null,
      userAgent: meta.userAgent?.slice(0, 500) ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
};

// 同一個 request 內（layout＋page＋action）只查一次資料庫
export const getCurrentSession = cache(async (): Promise<{ id: number; user: SessionUser } | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  // 帳號被停用：停用時已刪除 session，這裡再擋一次
  if (!session.user.isActive) return null;

  const { id, email, name, role } = session.user;
  return { id: session.id, user: { id, email, name, role } };
});

// 登出：刪掉資料庫的 session，並清除 cookie
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// 停用帳號、重設密碼時呼叫：該帳號所有裝置立即登出
export async function destroyUserSessions(userId: number, exceptSessionId?: number): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}
