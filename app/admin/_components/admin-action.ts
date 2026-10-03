import { unstable_rethrow } from "next/navigation";
import { authExpired, failure, type ActionState } from "@/lib/admin/action-state";

// 後台表單與列表按鈕呼叫 server action 的共用包裝（給 client component 用；不加 "use client"，REAUTH_URL 才能在 server component 直接當字串用）。
//
// 為什麼要包：server action 丟例外時，React 會把錯誤丟給最近的 error boundary，整頁換成錯誤頁、表單內容全部消失。
// 會丟例外的情況不只伺服器錯誤：登入到期或在別的分頁登出後，cookie 已經不在，proxy.ts 會把 action 的 POST
// 導去登入頁，client 拿到的不是 action 的回應而直接失敗。所以這裡攔下例外，改回傳失敗狀態，並問一次
// /api/admin/session（不經過 proxy）判斷是不是登入過期。
// server 端在 action 裡發現沒登入時也會直接回傳登入過期狀態（lib/admin/guard.ts 的 authorizeAction）。

export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export async function runAdminAction(
  action: FormAction,
  prev: ActionState,
  formData: FormData,
  failMessage: string,
): Promise<ActionState> {
  try {
    return await action(prev, formData);
  } catch (error) {
    // redirect()、notFound() 是 Next.js 用例外實作的導頁，要交還給 Next.js
    unstable_rethrow(error);
    console.error("[admin action]", error);
    const loggedIn = await checkLoggedIn();
    if (loggedIn === false) return authExpired();
    // 登入中，或查不到登入狀態（網路斷線、伺服器或資料庫暫時出錯，分不出是哪一種）：
    // 都用呼叫端的訊息（「可能是網路或伺服器暫時有問題，內容還在，請稍後再按一次」），不要只叫使用者檢查網路
    return failure(failMessage);
  }
}

// true：登入中；false：未登入或已過期；null：查不到（連不到伺服器，或伺服器回錯誤，例如資料庫暫時連不上）
export async function checkLoggedIn(): Promise<boolean | null> {
  try {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { loggedIn?: unknown } | null;
    return typeof data?.loggedIn === "boolean" ? data.loggedIn : null;
  } catch {
    return null;
  }
}

// 重新登入的網址：登入頁看到 reauth=1 時，登入後不跳轉，改提示「回原分頁再按一次儲存」
export const REAUTH_URL = "/admin/login?reauth=1";
