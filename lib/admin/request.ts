import "server-only";

// Route Handler 與 server action 共用的請求工具

// 取用戶端 IP。正式環境在 Nginx 後面，要讓 Nginx 設定 X-Forwarded-For／X-Real-IP；
// 沒有反向代理時這兩個標頭可被偽造，只拿來做頻率限制與紀錄，不當作身分依據。
export function getClientIp(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 100);
  return headers.get("x-real-ip")?.trim().slice(0, 100) || "unknown";
}

// 簡單的 CSRF 防護：瀏覽器送來的 POST 會帶 Origin，必須跟本站同 host。
// 沒有 Origin（curl 等非瀏覽器）放行；瀏覽器端另有 cookie 的 SameSite=Lax 擋跨站 POST。
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ ok: false, message }, { status, headers });
}
