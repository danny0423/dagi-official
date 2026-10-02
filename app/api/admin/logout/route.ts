import { destroyCurrentSession } from "@/lib/admin/session";
import { isSameOrigin, jsonError } from "@/lib/admin/request";

// 登出：刪除資料庫的 session 與 cookie，導回登入頁
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("來源不符", 403);
  await destroyCurrentSession();
  return new Response(null, { status: 303, headers: { Location: "/admin/login?loggedOut=1" } });
}
