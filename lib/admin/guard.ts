import "server-only";
import { redirect } from "next/navigation";
import { getCurrentSession, type SessionUser } from "@/lib/admin/session";
import { authExpired, permissionDenied, type ActionState } from "@/lib/admin/action-state";

// 後台權限檢查。proxy.ts 只看 cookie 在不在；真正的驗證都走這裡（每次都查資料庫）。
// 每個後台頁面、server action、route handler 都要自己呼叫，不能只靠 layout 或隱藏按鈕。
// - 頁面（server component）用 requireAdmin()／requireRole()：沒登入導回登入頁。
// - server action 用 authorizeAction()：沒登入時「回傳」登入已過期的狀態，不 redirect、不丟例外，
//   使用者打好的表單內容才會留在畫面上（docs/ux-review-admin.md #1）。
// 注意：redirect() 是丟例外，不要包在 try/catch 裡呼叫。

export type AdminRole = SessionUser["role"];

export async function getAdminUser(): Promise<SessionUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

// 需要登入（任何角色）；沒登入導回登入頁
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

// 需要特定角色；ADMIN 可以做所有事，EDITOR 只能做 EDITOR 的事
export async function requireRole(role: AdminRole): Promise<SessionUser> {
  const user = await requireAdmin();
  if (!hasRole(user, role)) redirect("/admin?denied=1");
  return user;
}

export function hasRole(user: SessionUser, role: AdminRole): boolean {
  return role === "EDITOR" || user.role === "ADMIN";
}

export type ActionAuth =
  | { ok: true; user: SessionUser; sessionId: number }
  | { ok: false; state: NonNullable<ActionState> };

// server action 專用的權限檢查。用法：
//   const auth = await authorizeAction("ADMIN");
//   if (!auth.ok) return auth.state;
export async function authorizeAction(role: AdminRole = "EDITOR"): Promise<ActionAuth> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, state: authExpired() };
  if (!hasRole(session.user, role)) return { ok: false, state: permissionDenied() };
  return { ok: true, user: session.user, sessionId: session.id };
}
