import "server-only";
import { redirect } from "next/navigation";
import { getCurrentSession, type SessionUser } from "@/lib/admin/session";

// 後台權限檢查。proxy.ts 只看 cookie 在不在；真正的驗證都走這裡（每次都查資料庫）。
// 每個後台頁面、server action、route handler 都要自己呼叫，不能只靠 layout 或隱藏按鈕。
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
