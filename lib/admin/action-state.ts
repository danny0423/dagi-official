// server action 回傳給表單的狀態（client／server 共用，不能加 "server-only"）

export type FieldErrors = Record<string, string[] | undefined>;

// 特殊失敗原因：畫面會依這個顯示不同的提示
// - auth：登入已過期（或在別的分頁登出），表單內容保留，提示到新分頁重新登入
// - denied：權限不足
export type ActionCode = "auth" | "denied";

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrors;
  code?: ActionCode;
  // 欄位的建議值（例：網址代稱重複時建議加上 -2），畫面可以提供「改用建議值」按鈕
  suggestions?: Record<string, string>;
  // 每次回傳都不同，讓相同訊息也能重新顯示
  ts: number;
} | null;

export const AUTH_EXPIRED_MESSAGE = "登入已過期，這次沒有儲存";
export const PERMISSION_DENIED_MESSAGE = "權限不足：這個功能只有管理員可以使用。如需權限請聯絡網站管理員。";

export function success(message: string): NonNullable<ActionState> {
  return { ok: true, message, ts: Date.now() };
}

export function failure(
  message: string,
  fieldErrors?: FieldErrors,
  suggestions?: Record<string, string>,
): NonNullable<ActionState> {
  return { ok: false, message, fieldErrors, suggestions, ts: Date.now() };
}

export function authExpired(): NonNullable<ActionState> {
  return { ok: false, code: "auth", message: AUTH_EXPIRED_MESSAGE, ts: Date.now() };
}

export function permissionDenied(): NonNullable<ActionState> {
  return { ok: false, code: "denied", message: PERMISSION_DENIED_MESSAGE, ts: Date.now() };
}
