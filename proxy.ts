import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// 只擋「沒有 session cookie」的人進後台。
// session 是否有效要在後台頁面或 API 內查資料庫確認（D12），proxy 不連資料庫。
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
