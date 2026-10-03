import { getAdminUser } from "@/lib/admin/guard";

// 查詢目前是否仍在登入狀態（後台表單送出失敗時判斷是不是登入過期、錯誤頁判斷要不要提示重新登入）。
// 路徑在 /api/admin 底下，不經過 proxy.ts，沒有 cookie 時也會回 JSON 而不是被導去登入頁。
// 只回傳是否登入，不回傳任何帳號資料。
export async function GET() {
  const user = await getAdminUser();
  return Response.json({ ok: true, loggedIn: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
}
